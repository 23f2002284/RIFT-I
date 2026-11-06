"""
Database engine lifecycle management for Supabase Postgres (via asyncpg + SQLAlchemy).

Usage:
    - Call `await init_db()` on app startup (inside FastAPI lifespan).
    - Call `await close_db()` on app shutdown (inside FastAPI lifespan).
    - Use `get_db()` as a FastAPI dependency to get an async session per request.
"""

from __future__ import annotations

import socket
from contextlib import asynccontextmanager
from typing import AsyncIterator
from urllib.parse import urlparse, urlunparse

from sqlalchemy.ext.asyncio import (
    AsyncConnection,
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.core.config import settings
from app.core.logger import get_logger

logger = get_logger("app.core.db")

# Module-level engine singleton (None until init_db() is called)
_engine: AsyncEngine | None = None
_session_factory: async_sessionmaker[AsyncSession] | None = None


# ── DNS Pre-resolution ────────────────────────────────────────────────────────

def _resolve_fast_host(url_str: str) -> str:
    """
    Resolve hostname to IP address upfront to bypass DNS latency on every query.
    Falls back to original URL if resolution fails.
    """
    try:
        parsed = urlparse(url_str)
        host = parsed.hostname

        # Already an IP address or no host found
        if not host or host.startswith("["):
            return url_str

        addrs = socket.getaddrinfo(host, parsed.port or 5432, family=socket.AF_UNSPEC)

        if addrs:
            ip = addrs[0][4][0]
            # IPv6 addresses need square brackets in URLs, IPv4 does not
            formatted_ip = f"[{ip}]" if ":" in ip else ip

            port_part = f":{parsed.port}" if parsed.port else ""

            if "@" in parsed.netloc:
                auth, _ = parsed.netloc.split("@", 1)
                netloc = f"{auth}@{formatted_ip}{port_part}"
            else:
                netloc = f"{formatted_ip}{port_part}"

            resolved = urlunparse(parsed._replace(netloc=netloc))
            logger.debug("DNS resolved: %s -> %s", host, ip)
            return resolved

    except Exception as e:
        logger.warning("DNS pre-resolution failed for %s: %s. Using original URL.", url_str, e)

    return url_str


# ── URL Normalization ─────────────────────────────────────────────────────────

def _normalize_url(raw_url: str) -> str:
    """
    Ensure the URL uses the asyncpg driver prefix and resolve hostname to IP.
    """
    url = raw_url

    # Supabase / Heroku / Neon give postgres:// or postgresql://
    # SQLAlchemy async requires postgresql+asyncpg://
    if url.startswith("postgresql://"):
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)

    return _resolve_fast_host(url)


# ── Engine Builder ────────────────────────────────────────────────────────────

def _build_engine() -> AsyncEngine:
    """
    Build the SQLAlchemy async engine configured for Supabase transaction pooler.
    """
    if not settings.DATABASE_URL:
        raise RuntimeError(
            "DATABASE_URL is not configured.\n"
            "Add to your .env file:\n"
            "  DATABASE_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres"
        )

    url = _normalize_url(settings.DATABASE_URL)
    logger.info("Building database engine...")

    return create_async_engine(
        url,
        # ── Connection Pool ──────────────────────────────────────────────────
        pool_size=5,           # Persistent connections kept open at all times
        max_overflow=10,       # Extra connections allowed during traffic spikes (max total = 15)
        pool_pre_ping=True,    # Heartbeat check before using a pooled connection
        pool_recycle=300,      # Recycle connections every 5 minutes

        # ── Logging ─────────────────────────────────────────────────────────
        echo=False,            # Set True only for local SQL debugging

        # ── asyncpg Options (Supabase Transaction Pooler compatibility) ──────
        connect_args={
            # Required: Supabase port 6543 (PgBouncer/Supavisor) does NOT
            # support named prepared statements — disabling the cache prevents
            # "prepared statement does not exist" errors
            "statement_cache_size": 0,
            "prepared_statement_cache_size": 0,

            # Connection + query timeouts in seconds
            "timeout": 30,
            "command_timeout": 30,
        }
    )


# ── Lifecycle ─────────────────────────────────────────────────────────────────

async def init_db() -> None:
    """
    Initialize the database engine and session factory.
    Call this once on application startup.
    """
    global _engine, _session_factory

    _engine = _build_engine()
    _session_factory = async_sessionmaker(
        bind=_engine,
        class_=AsyncSession,
        expire_on_commit=False,   # Avoids lazy-load errors after commit
    )
    logger.info("Database engine initialized.")


async def close_db() -> None:
    """
    Gracefully close all database connections.
    Call this once on application shutdown.
    """
    global _engine, _session_factory

    if _engine is not None:
        await _engine.dispose()
        _engine = None
        _session_factory = None
        logger.info("Database engine closed.")


# ── FastAPI Dependency ────────────────────────────────────────────────────────

async def get_db() -> AsyncIterator[AsyncSession]:
    """
    FastAPI dependency that yields a database session per request.

    Usage in a route:
        @router.get("/items")
        async def list_items(db: AsyncSession = Depends(get_db)):
            result = await db.execute(select(Item))
            return result.scalars().all()
    """
    if _session_factory is None:
        raise RuntimeError("Database is not initialized. Call await init_db() on startup.")

    async with _session_factory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

