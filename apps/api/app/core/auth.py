"""
Authentication dependency for Supabase Auth.

Supports three modes (tried in order):

1. Local dev shortcut — if APP_ENV=development and the Authorization header
   is a bare UUID (no "Bearer" prefix), returns a mock user instantly.
   Lets you hit protected endpoints with just: -H "Authorization: <your-uuid>"

2. Legacy JWT — if SUPABASE_JWT_SECRET is set in .env, decodes the token
   locally using HS256 without any network call.
   Use this only if you are on an old Supabase project that still issues
   symmetric JWTs.

3. Modern Supabase Auth (default) — calls POST /auth/v1/user on the
   Supabase Auth API to validate the token and return the user profile.
   Includes a lightweight TTL cache so the same token is not re-validated
   on every single request.
"""

from __future__ import annotations

import time
import uuid
from typing import Any

import httpx
from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.core.config import settings
from app.core.logger import get_logger

logger = get_logger("app.core.auth")

# ── HTTP Bearer extractor ──────────────────────────────────────────────────────
# auto_error=False lets us return a custom 401 instead of FastAPI's generic one
_bearer = HTTPBearer(auto_error=False)


# ── Simple in-memory TTL cache ────────────────────────────────────────────────
# Avoids hitting the Supabase Auth API on every request for the same token.
# Format: { token: (user_dict, expires_at_unix_timestamp) }
_auth_cache: dict[str, tuple[dict[str, Any], float]] = {}
_CACHE_TTL_SECONDS = 60  # Re-validate each token at most once per minute


def _cache_get(token: str) -> dict[str, Any] | None:
    """Return cached user dict if still valid, else None."""
    entry = _auth_cache.get(token)
    if entry and time.time() < entry[1]:
        return entry[0]
    _auth_cache.pop(token, None)  # evict stale entry
    return None


def _cache_set(token: str, user: dict[str, Any]) -> None:
    """Store user in cache with a TTL expiry."""
    _auth_cache[token] = (user, time.time() + _CACHE_TTL_SECONDS)


# ── Helper: raise a clean 401 ────────────────────────────────────────────────
def _unauthorized(detail: str = "Not authenticated") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


# ── Mode 1: Local dev UUID shortcut ──────────────────────────────────────────

def _is_local_dev_uuid(token: str) -> bool:
    """
    In development, allow a raw UUID as the Authorization value.
    This lets developers hit protected endpoints without a real Supabase session.
    Enabled when APP_ENV is development, dev, local, or default.
    """
    if settings.APP_ENV.lower() not in ("development", "dev", "local"):
        return False
    try:
        uuid.UUID(token)    # raises ValueError if not a valid UUID
        return True
    except ValueError:
        return False


def _make_dev_user(raw_uuid: str) -> dict[str, Any]:
    """Build a mock user dict that mirrors Supabase's /auth/v1/user response shape."""
    return {
        "id": raw_uuid,
        "email": "dev@localhost",
        "role": "authenticated",
        "_source": "local_dev",
    }


# ── Mode 2: Legacy HS256 JWT decoding ────────────────────────────────────────

def _decode_legacy_jwt(token: str) -> dict[str, Any]:
    """
    Decode a Supabase-issued HS256 JWT locally using SUPABASE_JWT_SECRET.
    Only used when SUPABASE_JWT_SECRET is explicitly set in config.
    Raises HTTPException on invalid / expired tokens.
    """
    try:
        import jwt  # pip install PyJWT

        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            options={"verify_aud": False},   # Supabase tokens have audience = "authenticated"
        )
        return {
            "id": payload.get("sub"),
            "email": payload.get("email"),
            "role": payload.get("role", "authenticated"),
            "_source": "legacy_jwt",
        }
    except Exception as exc:
        logger.warning("Legacy JWT decode failed: %s", exc)
        raise _unauthorized("Invalid or expired token.")


# ── Mode 3: Modern Supabase Auth API validation ───────────────────────────────

async def _validate_via_supabase_api(token: str) -> dict[str, Any]:
    """
    Call POST /auth/v1/user on the Supabase Auth API to validate a token.

    Supabase now uses asymmetric keys (RS256/ES256 via JWKS), so local
    decoding requires fetching public keys. Calling the API directly is
    simpler, always correct, and returns the full user profile.

    The TTL cache on top means this network call only happens at most once
    per minute per unique token — not on every request.
    """
    # 1. Check cache first
    cached = _cache_get(token)
    if cached:
        logger.debug("Auth cache hit for token (user: %s)", cached.get("id"))
        return cached

    # 2. Call Supabase Auth API
    url = f"{settings.SUPABASE_URL}/auth/v1/user"
    headers = {
        "apikey": settings.SUPABASE_PUBLISHABLE_KEY,    # Supabase requires this on every request
        "Authorization": f"Bearer {token}",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, headers=headers)
    except httpx.TimeoutException:
        logger.error("Supabase Auth API timed out")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Auth service unavailable. Please try again.",
        )
    except httpx.RequestError as exc:
        logger.error("Supabase Auth API request failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Auth service unavailable. Please try again.",
        )

    # 3. Handle response
    if response.status_code == 401:
        raise _unauthorized("Invalid or expired token.")

    if response.status_code != 200:
        logger.warning("Supabase Auth returned %d: %s", response.status_code, response.text)
        raise _unauthorized("Could not validate credentials.")

    user = response.json()
    user["_source"] = "supabase_api"

    # 4. Store in cache
    _cache_set(token, user)
    logger.debug("Authenticated user %s via Supabase API", user.get("id"))

    return user


# ── Public FastAPI Dependency ─────────────────────────────────────────────────

async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> dict[str, Any]:
    """
    FastAPI dependency — validates the Bearer token or raw UUID and returns the user dict.
    """
    token: str | None = None
    if credentials and credentials.credentials:
        token = credentials.credentials
    else:
        # Fallback to direct Authorization header check (supports bare UUIDs and Bearer)
        raw_header = request.headers.get("authorization") or request.headers.get("Authorization")
        if raw_header:
            if raw_header.lower().startswith("bearer "):
                token = raw_header[7:].strip()
            else:
                token = raw_header.strip()

    if not token:
        raise _unauthorized("Authorization header missing.")

    # Mode 1: Local dev UUID shortcut
    if _is_local_dev_uuid(token):
        logger.debug("Dev mode: using UUID shortcut for user %s", token)
        return _make_dev_user(token)

    # Mode 2: Legacy local JWT decode
    if settings.SUPABASE_JWT_SECRET:
        return _decode_legacy_jwt(token)

    # Mode 3: Modern Supabase Auth API (default)
    return await _validate_via_supabase_api(token)

