import { useState } from 'react'
import { History, FileText, ChevronRight } from 'lucide-react'
import { historyDocs, type HistoryDoc } from '../../data/mockData'
import { useDocuments } from '../../context/DocumentContext'

interface Props {
  onSelect: (doc: HistoryDoc | { id: string; title: string }) => void
}

export function HistorySidebar({ onSelect }: Props) {
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const { documents } = useDocuments()

  const list = documents.length > 0
    ? documents.map((d) => ({
        id: d.id,
        title: d.title,
        pages: d.pageCount,
        size: d.size > 1024 * 1024 ? `${(d.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(d.size / 1024) || 1} KB`,
        date: new Date(d.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      }))
    : historyDocs

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#241734',
        borderRight: '1px solid #3a2050',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '20px 24px',
          borderBottom: '1px solid #3a2050',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}
      >
        <History size={20} color="#9b5de5" />
        <h2
          style={{
            fontSize: '16px',
            fontWeight: 600,
            color: '#f0e6ff',
            letterSpacing: '0.02em',
          }}
        >
          History
        </h2>
      </div>

      {/* Document List */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        {list.map((doc) => {
          const isHovered = hoveredId === doc.id
          return (
            <div
              key={doc.id}
              onClick={() => onSelect(doc)}
              onMouseEnter={() => setHoveredId(doc.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: isHovered ? '#2d1f42' : 'transparent',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
                border: isHovered ? '1px solid #4a2868' : '1px solid transparent',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: '#1a1028',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <FileText size={18} color="#9b5de5" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    color: '#f0e6ff',
                    fontWeight: 500,
                    fontSize: '13px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={doc.title}
                >
                  {doc.title}
                </div>
                <div
                  style={{
                    color: '#9b8bbb',
                    fontSize: '11px',
                    marginTop: '2px',
                    display: 'flex',
                    gap: '8px',
                  }}
                >
                  <span>{doc.pages} pages</span>
                  <span>•</span>
                  <span>{doc.size}</span>
                  <span>•</span>
                  <span>{doc.date}</span>
                </div>
              </div>
              <ChevronRight
                size={16}
                color={isHovered ? '#9b5de5' : '#4a3360'}
                style={{ flexShrink: 0, transition: 'color 0.15s ease' }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
