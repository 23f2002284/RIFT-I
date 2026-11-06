import { useState } from 'react'
import { History, FileText, Trash2, Clock } from 'lucide-react'
import { useDocuments, type StoredDocument } from '../../context/DocumentContext'

interface Props {
  onSelect: (doc: StoredDocument) => void
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`
}

/** Empty state shown when no documents yet */
function EmptyHistory() {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        gap: '14px',
        textAlign: 'center',
      }}
    >
      {/* Glowing floating document icon */}
      <div
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          background: 'rgba(6,182,212,0.08)',
          border: '1px solid rgba(6,182,212,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(6,182,212,0.15)',
          animation: 'float-idle 3s ease-in-out infinite',
        }}
      >
        <FileText size={26} color="rgba(34,211,238,0.6)" />
      </div>
      <div>
        <p style={{ color: '#e0f2fe', fontSize: '13px', fontWeight: 600, margin: 0 }}>
          No Documents Yet
        </p>
        <p style={{ color: '#475569', fontSize: '11px', marginTop: '6px', lineHeight: 1.5 }}>
          Upload your first PDF on the right<br />to build your neural knowledge base.
        </p>
      </div>
    </div>
  )
}

/** Thumbnail card for one stored document */
function DocCard({
  doc,
  onSelect,
  onDelete,
}: {
  doc: StoredDocument
  onSelect: () => void
  onDelete: () => void
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 10px',
        borderRadius: '14px',
        background: hovered ? 'rgba(8,47,73,0.5)' : 'rgba(255,255,255,0.03)',
        border: `1px solid rgba(6,182,212,${hovered ? '0.45' : '0.14'})`,
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        position: 'relative',
        boxShadow: hovered ? '0 4px 20px rgba(6,182,212,0.12)' : 'none',
      }}
    >
      {/* Page 1 Thumbnail */}
      <div
        style={{
          width: '44px',
          height: '60px',
          borderRadius: '8px',
          overflow: 'hidden',
          background: '#0f172a',
          border: '1px solid rgba(34,211,238,0.25)',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 12px rgba(6,182,212,0.12)',
          transition: 'transform 0.2s ease',
          transform: hovered ? 'scale(1.05)' : 'scale(1)',
        }}
      >
        {doc.thumbnail ? (
          <img
            src={doc.thumbnail}
            alt="Page 1"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <FileText size={18} color="rgba(34,211,238,0.5)" />
        )}
      </div>

      {/* Metadata */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            color: hovered ? '#67e8f9' : '#e0f2fe',
            fontWeight: 500,
            fontSize: '12px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            transition: 'color 0.15s ease',
          }}
          title={doc.title}
        >
          {doc.title}
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '5px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '10px', color: '#38bdf8', background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', padding: '1px 7px', borderRadius: '9999px' }}>
            {doc.pageCount} pages
          </span>
          <span style={{ fontSize: '10px', color: '#475569', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Clock size={9} />
            {relativeTime(doc.uploadedAt)}
          </span>
          <span style={{ fontSize: '10px', color: '#334155' }}>
            {formatSize(doc.size)}
          </span>
        </div>
      </div>

      {/* Delete button — appears on hover */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onDelete() }}
        title="Remove from history"
        style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          width: '24px',
          height: '24px',
          borderRadius: '6px',
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.15s ease',
          color: '#f87171',
        }}
      >
        <Trash2 size={12} />
      </button>
    </div>
  )
}

export function GlassHistorySidebar({ onSelect }: Props) {
  const { documents, removeDocument } = useDocuments()

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        background: 'rgba(15,23,42,0.45)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(56,189,248,0.22)',
        borderRadius: '20px',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(2,132,199,0.1), inset 0 1px 0 0 rgba(255,255,255,0.1)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 16px 12px',
          borderBottom: '1px solid rgba(56,189,248,0.14)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: 'rgba(2,6,23,0.4)',
          flexShrink: 0,
        }}
      >
        <History size={16} color="#06b6d4" />
        <h2 style={{ fontSize: '13px', fontWeight: 600, color: '#e0f2fe', letterSpacing: '0.03em', flex: 1, margin: 0 }}>
          History
        </h2>
        {documents.length > 0 && (
          <div style={{ background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.4)', borderRadius: '9999px', padding: '2px 8px', fontSize: '10px', fontWeight: 600, color: '#22d3ee' }}>
            {documents.length}
          </div>
        )}
      </div>

      {/* Document List or Empty State */}
      {documents.length === 0 ? (
        <EmptyHistory />
      ) : (
        <div
          style={{ flex: 1, overflowY: 'auto', padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: '7px' }}
          className="glass-scroll"
        >
          {documents.map((doc) => (
            <DocCard
              key={doc.id}
              doc={doc}
              onSelect={() => onSelect(doc)}
              onDelete={() => removeDocument(doc.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
