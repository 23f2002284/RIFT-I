import { useState } from 'react'
import { deleteDocument, type Document } from '../api/documents'

interface Props {
  doc: Document
  onOpen: (doc: Document) => void
  onDeleted: (id: string) => void
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export function DocumentCard({ doc, onOpen, onDeleted }: Props) {
  const [deleting, setDeleting] = useState(false)
  const [hovered, setHovered] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Delete "${doc.filename}"?`)) return
    setDeleting(true)
    try {
      await deleteDocument(doc.id)
      onDeleted(doc.id)
    } catch {
      setDeleting(false)
    }
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--surface-2)' : 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '16px',
        cursor: 'pointer',
        transition: 'all 150ms ease',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        opacity: deleting ? 0.4 : 1,
      }}
      onClick={() => onOpen(doc)}
    >
      {/* Top row: icon + actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {/* PDF icon */}
        <div style={{
          width: 36, height: 36,
          background: 'rgba(124,106,247,0.1)',
          borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
          flexShrink: 0,
        }}>
          📄
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 4 }}>
          {/* Open */}
          <button
            title="Open"
            onClick={(e) => { e.stopPropagation(); onOpen(doc) }}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--accent)',
              borderRadius: 6,
              width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 13,
              transition: 'all 150ms ease',
            }}
          >
            →
          </button>

          {/* Delete */}
          <button
            title="Delete"
            onClick={handleDelete}
            disabled={deleting}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text-muted)',
              borderRadius: 6,
              width: 28, height: 28,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 12,
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--red)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            🗑
          </button>
        </div>
      </div>

      {/* Filename */}
      <p style={{
        fontWeight: 500,
        fontSize: 13,
        color: 'var(--text)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {doc.filename}
      </p>

      {/* Meta */}
      <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--text-muted)' }}>
        <span>{doc.page_count} pages</span>
        <span>·</span>
        <span>{formatSize(doc.file_size)}</span>
        <span>·</span>
        <span>{formatDate(doc.created_at)}</span>
      </div>
    </div>
  )
}

