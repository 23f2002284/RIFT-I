"""
Document service — handles PDF upload, storage, DB persistence, and retrieval.
Uses PyMuPDF (fitz) to extract page count from PDFs.
"""
from __future__ import annotations
import uuid
import hashlib
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.document import Document
from app.core.storage import upload_pdf, get_signed_url, delete_pdf
from app.core.logger import get_logger

logger = get_logger("app.services.documents")

async def create_document(
    db: AsyncSession,
    file_bytes: bytes,
    filename: str,
    user_id: str,
) -> Document:
    """Upload PDF to storage and save metadata to DB."""
    import fitz  # PyMuPDF

    # Count pages
    try:
        pdf = fitz.open(stream=file_bytes, filetype="pdf")
        page_count = len(pdf)
        pdf.close()
    except Exception:
        page_count = 0

    # Calculate SHA-256 hash
    file_hash = hashlib.sha256(file_bytes).hexdigest()

    # Check if duplicate already exists for this user
    owner_uuid = uuid.UUID(user_id)
    existing = await db.execute(
        select(Document).where(
            Document.owner_id == owner_uuid,
            Document.file_hash == file_hash
        )
    )
    existing_doc = existing.scalar_one_or_none()
    if existing_doc:
        logger.info("Document with hash %s already exists (%s), returning existing record", file_hash, existing_doc.id)
        return existing_doc

    # Upload to Supabase Storage
    storage_path = await upload_pdf(file_bytes, filename, user_id)

    # Save to DB
    doc = Document(
        id=uuid.uuid4(),
        owner_id=uuid.UUID(user_id),
        title=filename,
        storage_path=storage_path,
        page_count=page_count,
        file_hash=file_hash,
        status="ready",
    )
    db.add(doc)
    await db.commit()
    await db.refresh(doc)
    logger.info("Created document %s for user %s", doc.id, user_id)
    return doc

async def list_documents(db: AsyncSession, user_id: str) -> list[Document]:
    """List all documents for a user, newest first."""
    owner_uuid = uuid.UUID(user_id)
    result = await db.execute(
        select(Document)
        .where(Document.owner_id == owner_uuid)
        .order_by(Document.created_at.desc())
    )
    return list(result.scalars().all())

async def get_document(db: AsyncSession, doc_id: str, user_id: str) -> Document | None:
    """Get a single document by ID (must belong to user)."""
    result = await db.execute(
        select(Document).where(
            Document.id == uuid.UUID(doc_id),
            Document.owner_id == uuid.UUID(user_id)
        )
    )
    return result.scalar_one_or_none()

async def delete_document(db: AsyncSession, doc_id: str, user_id: str) -> bool:
    """Delete document from storage and DB."""
    doc = await get_document(db, doc_id, user_id)
    if not doc:
        return False
    try:
        await delete_pdf(doc.storage_path)
    except Exception as e:
        logger.warning("Could not delete file from storage: %s", e)
    await db.delete(doc)
    await db.commit()
    return True

async def get_document_url(db: AsyncSession, doc_id: str, user_id: str) -> str | None:
    """Get a signed URL to access the PDF."""
    doc = await get_document(db, doc_id, user_id)
    if not doc:
        return None
    return await get_signed_url(doc.storage_path)
