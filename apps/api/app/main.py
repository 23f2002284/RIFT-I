"""
RIFT API — FastAPI application entry point.
"""
from __future__ import annotations
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.db import init_db, close_db
from app.core.logger import get_logger
from app.routes.documents import router as documents_router

logger = get_logger("app.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting RIFT API...")
    await init_db()
    yield
    await close_db()
    logger.info("RIFT API shut down.")

app = FastAPI(
    title="RIFT API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(documents_router, prefix="/api/v1")

@app.get("/health")
async def health():
    return {"status": "ok"}
