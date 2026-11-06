"""
Supabase Storage client for PDF uploads.
Provides upload_pdf(), get_signed_url(), delete_pdf() functions.
"""
from __future__ import annotations
from supabase import create_client, Client
from app.core.config import settings
from app.core.logger import get_logger

logger = get_logger("app.core.storage")

_client: Client | None = None

def get_storage_client() -> Client:
    global _client
    if _client is None:
        _client = create_client(settings.SUPABASE_URL, settings.SUPABASE_SECRET_KEY)
    return _client

async def upload_pdf(file_bytes: bytes, filename: str, user_id: str) -> str:
    """Upload PDF to Supabase Storage. Returns the storage path."""
    import uuid
    path = f"{user_id}/{uuid.uuid4()}_{filename}"
    client = get_storage_client()
    client.storage.from_(settings.STORAGE_BUCKET).upload(
        path=path,
        file=file_bytes,
        file_options={"content-type": "application/pdf", "upsert": "true"}
    )
    logger.info("Uploaded PDF: %s", path)
    return path

async def get_signed_url(path: str, expires_in: int = 3600) -> str:
    """Get a signed URL for temporary access to a PDF."""
    client = get_storage_client()
    result = client.storage.from_(settings.STORAGE_BUCKET).create_signed_url(path, expires_in)
    return result["signedURL"]

async def delete_pdf(path: str) -> None:
    """Delete a PDF from storage."""
    client = get_storage_client()
    client.storage.from_(settings.STORAGE_BUCKET).remove([path])
    logger.info("Deleted PDF: %s", path)
