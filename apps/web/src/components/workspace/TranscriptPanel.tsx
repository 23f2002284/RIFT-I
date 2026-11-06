import { useEffect, useRef, useState } from 'react'
import { Play, ChevronDown } from 'lucide-react'
import { mockParagraphs } from '../../data/mockData'
import { type StoredDocument } from '../../context/DocumentContext'

interface Props {
  doc?: StoredDocument | null
  activeParagraphIdx: number
  onBlockClick: (idx: number) => void
  isDictating: boolean
  onDictationChange: (val: boolean) => void
}

export function TranscriptPanel({
  doc = null,
  activeParagraphIdx,
  onBlockClick,
  isDictating,
  onDictationChange,
}: Props) {
  const paragraphs = doc?.paragraphs && doc.paragraphs.length > 0 ? doc.paragraphs : mockParagraphs
  const [selectedLang, setSelectedLang] = useState('EN')
  const [langMenuOpen, setLangMenuOpen] = useState(false)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll the active block into view
  useEffect(() => {
    const activeEl = itemRefs.current[activeParagraphIdx]
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [activeParagraphIdx])

  // Dictation simulation: advance paragraph when dictating
  useEffect(() => {
    if (!isDictating) return
    const timer = setInterval(() => {
      const nextIdx = (activeParagraphIdx + 1) % Math.max(paragraphs.length, 1)
      onBlockClick(nextIdx)
    }, 4500)
    return () => clearInterval(timer)
  }, [isDictating, activeParagraphIdx, onBlockClick, paragraphs.length])

  const languages = ['EN', 'ES', 'FR', 'DE', 'JA', 'ZH']

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#241734',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #3a2050',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            color: '#9b8bbb',
            fontWeight: 700,
          }}
        >
          Transcript
        </span>
        <span style={{ fontSize: '11px', color: '#6b5b7b' }}>
          {paragraphs.length} segments
        </span>
      </div>

      {/* Scrollable List of Paragraphs */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px 16px',
        }}
      >
        {paragraphs.map((para, idx) => {
          const isActive = activeParagraphIdx === idx
          const paraText = (para.text || (para as any).content || (para as any).body || '').trim()

          return (
            <div
              key={para.id}
              ref={(el) => {
                itemRefs.current[idx] = el
              }}
              onClick={() => onBlockClick(idx)}
              style={{
                borderRadius: '8px',
                padding: '12px 16px',
                marginBottom: '8px',
                cursor: 'pointer',
                backgroundColor: isActive ? '#8a3ffc' : '#1a1028',
                color: isActive ? '#ffffff' : '#9b8bbb',
                transform: isActive ? 'scale(1.01)' : 'scale(1)',
                boxShadow: isActive ? '0 4px 14px rgba(138, 63, 252, 0.4)' : 'none',
                border: isActive ? '1px solid #c084fc' : '1px solid transparent',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#2d1f42'
                  e.currentTarget.style.color = '#f0e6ff'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#1a1028'
                  e.currentTarget.style.color = '#9b8bbb'
                }
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '4px',
                  fontSize: '10px',
                  opacity: isActive ? 0.9 : 0.6,
                }}
              >
                <span style={{ fontWeight: 600 }}>SEGMENT {String(idx + 1).padStart(2, '0')}</span>
                <span>{para.bboxId}</span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: '13px',
                  lineHeight: 1.5,
                  fontWeight: isActive ? 500 : 400,
                  wordBreak: 'break-word',
                  color: !paraText ? '#6b5b7b' : undefined,
                  fontStyle: !paraText ? 'italic' : undefined,
                }}
              >
                {paraText || '(No readable text detected in this segment)'}
              </p>
            </div>
          )
        })}
      </div>

      {/* Bottom Control Bar */}
      <div
        style={{
          borderTop: '1px solid #3a2050',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#1a1028',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        {/* Left: Language Selector */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setLangMenuOpen(!langMenuOpen)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: '6px',
              backgroundColor: '#241734',
              border: '1px solid #3a2050',
              color: '#f0e6ff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <span>{selectedLang}</span>
            <ChevronDown size={14} color="#9b8bbb" />
          </button>

          {langMenuOpen && (
            <div
              style={{
                position: 'absolute',
                bottom: '100%',
                left: 0,
                marginBottom: '6px',
                backgroundColor: '#241734',
                border: '1px solid #3a2050',
                borderRadius: '6px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                zIndex: 20,
              }}
            >
              {languages.map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => {
                    setSelectedLang(lang)
                    setLangMenuOpen(false)
                  }}
                  style={{
                    padding: '6px 16px',
                    textAlign: 'left',
                    background: selectedLang === lang ? '#3a2050' : 'transparent',
                    border: 'none',
                    color: selectedLang === lang ? '#c084fc' : '#f0e6ff',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#3a2050'
                  }}
                  onMouseLeave={(e) => {
                    if (selectedLang !== lang) {
                      e.currentTarget.style.backgroundColor = 'transparent'
                    }
                  }}
                >
                  {lang}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Circular Dictation Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isDictating && (
            <span style={{ fontSize: '11px', color: '#c084fc', fontWeight: 500 }}>
              Dictating...
            </span>
          )}
          <button
            type="button"
            onClick={() => onDictationChange(!isDictating)}
            title={isDictating ? 'Pause dictation' : 'Start dictation'}
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              backgroundColor: isDictating ? '#9b5de5' : 'transparent',
              border: isDictating ? 'none' : '1.5px solid #9b5de5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: isDictating ? '0 0 12px rgba(155, 93, 229, 0.6)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            {isDictating ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '14px' }}>
                <div className="wave-bar" style={{ width: '2px', background: '#ffffff' }} />
                <div className="wave-bar" style={{ width: '2px', background: '#ffffff' }} />
                <div className="wave-bar" style={{ width: '2px', background: '#ffffff' }} />
                <div className="wave-bar" style={{ width: '2px', background: '#ffffff' }} />
                <div className="wave-bar" style={{ width: '2px', background: '#ffffff' }} />
              </div>
            ) : (
              <Play size={15} color="#c084fc" style={{ marginLeft: '2px' }} />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
