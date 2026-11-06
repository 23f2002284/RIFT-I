"""
Document routes — PDF upload, listing, URL generation, and deletion.
"""
from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.db import get_db
from app.core.auth import get_current_user
from app.services.document_service import (
    create_document, list_documents, get_document_url, delete_document
)
from app.core.logger import get_logger
import uuid

logger = get_logger("app.routes.documents")
router = APIRouter(prefix="/documents", tags=["documents"])

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are allowed.")
    
    file_bytes = await file.read()
    if len(file_bytes) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Max 50 MB.")
    if len(file_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty file.")

    doc = await create_document(db, file_bytes, file.filename, user["id"])
    
    return {
        "id": str(doc.id),
        "filename": doc.filename,
        "page_count": doc.page_count,
        "file_size": doc.file_size,
        "created_at": doc.created_at.isoformat(),
    }

@router.get("")
async def get_documents(
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    docs = await list_documents(db, user["id"])
    return [
        {
            "id": str(d.id),
            "filename": d.filename,
            "page_count": d.page_count,
            "file_size": d.file_size,
            "created_at": d.created_at.isoformat(),
        }
        for d in docs
    ]

@router.get("/{doc_id}/url")
async def get_pdf_url(
    doc_id: str,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    url = await get_document_url(db, doc_id, user["id"])
    if not url:
        raise HTTPException(status_code=404, detail="Document not found.")
    return {"url": url, "expires_in": 3600}

@router.delete("/{doc_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_document(
    doc_id: str,
    db: AsyncSession = Depends(get_db),
    user: dict = Depends(get_current_user),
):
    deleted = await delete_document(db, doc_id, user["id"])
    if not deleted:
        raise HTTPException(status_code=404, detail="Document not found.")
