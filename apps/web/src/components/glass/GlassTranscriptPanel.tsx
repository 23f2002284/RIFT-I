import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Mic, FileText } from 'lucide-react'
import { type StoredDocument } from '../../context/DocumentContext'

interface Props {
  doc: StoredDocument | null
  activeParagraphIdx: number
  onBlockClick: (idx: number) => void
  isDictating: boolean
  onDictationChange: (val: boolean) => void
}

/* ─────────── Voice persona data ─────────── */
const LANGUAGES = ['EN', 'ES', 'FR', 'DE', 'HI', 'JA', 'ZH']
const VOICES = [
  { id: 'nova',  label: 'Nova',  desc: 'Neural' },
  { id: 'orion', label: 'Orion', desc: 'Deep' },
  { id: 'aria',  label: 'Aria',  desc: 'Conversational' },
  { id: 'echo',  label: 'Echo',  desc: 'Precise' },
]

/* ─────────── Spectral wave bars inside orb ─────────── */
function WaveBars() {
  const delays = [0, 0.15, 0.08, 0.22, 0.05, 0.18, 0.1]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '18px' }}>
      {delays.map((d, i) => (
        <div
          key={i}
          className="wave-bar"
          style={{
            width: '2.5px',
            background: 'rgba(255,255,255,0.9)',
            borderRadius: '2px',
            animationDelay: `${d}s`,
          }}
        />
      ))}
    </div>
  )
}

/* ─────────── Pulsing halo ring around orb ─────────── */
function HaloRing() {
  return (
    <>
      {/* fast inner ring */}
      <div
        className="halo-ring"
        style={{
          position: 'absolute',
          inset: '-5px',
          borderRadius: '50%',
          border: '1.5px solid rgba(34,211,238,0.55)',
          pointerEvents: 'none',
        }}
      />
      {/* slower outer ring */}
      <div
        className="halo-ring halo-ring-outer"
        style={{
          position: 'absolute',
          inset: '-12px',
          borderRadius: '50%',
          border: '1px solid rgba(34,211,238,0.28)',
          pointerEvents: 'none',
        }}
      />
    </>
  )
}

/* ─────────── Karaoke word renderer ─────────── */
function KaraokeText({ text, activeWordIdx }: { text: string; activeWordIdx: number }) {
  const safeText = (text || '').trim()
  const words = safeText ? safeText.split(/\s+/) : []
  return (
    <p style={{ margin: 0, fontSize: '12.5px', lineHeight: 1.65, color: '#e0f2fe', fontWeight: 500, wordBreak: 'break-word' }}>
      {words.map((word, i) => {
        const isSpoken = i < activeWordIdx
        const isCurrent = i === activeWordIdx
        return (
          <span key={i}>
            <span
              style={{
                display: 'inline',
                borderRadius: '3px',
                padding: isCurrent ? '0 3px' : undefined,
                backgroundColor: isCurrent ? 'rgba(34,211,238,0.22)' : undefined,
                color: isCurrent
                  ? '#67e8f9'
                  : isSpoken
                  ? 'rgba(255,255,255,0.45)'
                  : '#e0f2fe',
                textShadow: isCurrent
                  ? '0 0 10px rgba(34,211,238,0.9)'
                  : undefined,
                fontWeight: isCurrent ? 600 : isSpoken ? 400 : 500,
                transition: 'color 0.1s ease, background-color 0.1s ease',
              }}
            >
              {word}
            </span>
            {i < words.length - 1 ? ' ' : ''}
          </span>
        )
      })}
    </p>
  )
}

/* ─────────── Main component ─────────── */
export function GlassTranscriptPanel({
  doc,
  activeParagraphIdx,
  onBlockClick,
  isDictating,
  onDictationChange,
}: Props) {
  const paragraphs = doc?.paragraphs ?? []
  const hasContent = paragraphs.length > 0
  const [selectedLang, setSelectedLang] = useState('EN')
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0])
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeWordIdx, setActiveWordIdx] = useState(0)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const menuRef = useRef<HTMLDivElement>(null)

  /* ── Auto-scroll active block into view ── */
  useEffect(() => {
    const el = itemRefs.current[activeParagraphIdx]
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    setActiveWordIdx(0) // reset karaoke on paragraph change
  }, [activeParagraphIdx])

  /* ── Paragraph advance during dictation ── */
  useEffect(() => {
    if (!isDictating) return
    const timer = setInterval(() => {
      onBlockClick((activeParagraphIdx + 1) % Math.max(paragraphs.length, 1))
    }, 5000)
    return () => clearInterval(timer)
  }, [isDictating, activeParagraphIdx, onBlockClick])

  /* ── Karaoke word advance while dictating ── */
  useEffect(() => {
    if (!isDictating) { setActiveWordIdx(0); return }
    const currentPara = paragraphs[activeParagraphIdx]
    const rawText = currentPara ? (currentPara.text || (currentPara as any).content || '').trim() : ''
    const words = rawText ? rawText.split(/\s+/) : []
    if (activeWordIdx >= words.length) return
    const wordTimer = setInterval(() => {
      setActiveWordIdx((prev) => {
        if (prev >= words.length - 1) { clearInterval(wordTimer); return prev }
        return prev + 1
      })
    }, 320)
    return () => clearInterval(wordTimer)
  }, [isDictating, activeParagraphIdx, activeWordIdx, paragraphs])

  /* ── Close dropdown on outside click ── */
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow:
          '0 0 30px rgba(6, 182, 212, 0.1), inset 0 1px 0 0 rgba(255,255,255,0.1)',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          padding: '10px 16px',
          borderBottom: '1px solid rgba(56, 189, 248, 0.16)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          background: 'rgba(2, 6, 23, 0.4)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '10px',
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: '#38bdf8',
              fontWeight: 700,
            }}
          >
            Transcript
          </span>
          {isDictating && (
            <span
              style={{
                fontSize: '9px',
                color: '#22d3ee',
                fontWeight: 600,
                background: 'rgba(6,182,212,0.12)',
                border: '1px solid rgba(34,211,238,0.3)',
                padding: '1px 7px',
                borderRadius: '9999px',
                letterSpacing: '0.06em',
              }}
            >
              ◉ LIVE
            </span>
          )}
        </div>
        <span style={{ fontSize: '10px', color: '#475569' }}>
          {paragraphs.length} segments
        </span>
      </div>

      {/* ── Scrollable Script Blocks or Empty State ── */}
      <div
        style={{ flex: 1, overflowY: 'auto', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '7px' }}
        className="glass-scroll"
      >
        {!hasContent ? (
          /* Empty / no-text state */
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', padding: '32px 16px', textAlign: 'center' }}>
            <FileText size={28} color="rgba(34,211,238,0.3)" />
            <div>
              <p style={{ color: '#475569', fontSize: '12px', margin: 0 }}>No extractable text blocks found on this page</p>
              <p style={{ color: '#334155', fontSize: '11px', marginTop: '4px' }}>This may be a scanned image PDF</p>
            </div>
          </div>
        ) : (
          paragraphs.map((para, idx) => {
          const isActive = activeParagraphIdx === idx

          return (
            <div
              key={para.id}
              ref={(el) => { itemRefs.current[idx] = el }}
              onClick={() => { onBlockClick(idx) }}
              style={{
                borderRadius: '14px',
                padding: '12px 14px',
                cursor: 'pointer',
                position: 'relative',
                overflow: 'hidden',
                transition: 'all 0.25s ease',
                // Active: bioluminescent cyan-blue gradient
                background: isActive
                  ? 'linear-gradient(135deg, rgba(6,182,212,0.22), rgba(59,130,246,0.18), rgba(79,70,229,0.22))'
                  : 'rgba(30, 41, 59, 0.35)',
                border: isActive
                  ? '2px solid rgba(34, 211, 238, 0.7)'
                  : '1px solid rgba(6, 182, 212, 0.14)',
                boxShadow: isActive
                  ? '0 0 20px rgba(34, 211, 238, 0.32)'
                  : 'none',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(8, 47, 73, 0.4)'
                  e.currentTarget.style.borderColor = 'rgba(6,182,212,0.3)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(30, 41, 59, 0.35)'
                  e.currentTarget.style.borderColor = 'rgba(6,182,212,0.14)'
                }
              }}
            >
              {/* Active left accent bar */}
              {isActive && (
                <div
                  style={{
                    position: 'absolute',
                    left: 0, top: 0, bottom: 0,
                    width: '3px',
                    background: 'linear-gradient(180deg, #22d3ee, #3b82f6, #818cf8)',
                    borderRadius: '2px 0 0 2px',
                  }}
                />
              )}

              {/* Scanline shimmer on active */}
              {isActive && (
                <div
                  className="scanline-sweep"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(90deg, transparent 0%, rgba(34,211,238,0.06) 50%, transparent 100%)',
                    pointerEvents: 'none',
                  }}
                />
              )}

              {/* Segment label row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                }}
              >
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    letterSpacing: '0.1em',
                    color: isActive ? '#22d3ee' : '#475569',
                  }}
                >
                  SEGMENT {String(idx + 1).padStart(2, '0')}
                </span>
                <span style={{ fontSize: '9px', color: '#334155' }}>{para.bboxId}</span>
              </div>

              {/* Paragraph text — karaoke when active + dictating, plain otherwise */}
              {(() => {
                const paraText = (para.text || (para as any).content || (para as any).body || '').trim()
                if (isActive && isDictating) {
                  return <KaraokeText text={paraText} activeWordIdx={activeWordIdx} />
                }
                if (paraText) {
                  return (
                    <p
                      style={{
                        margin: 0,
                        fontSize: '12.5px',
                        lineHeight: 1.6,
                        color: isActive ? '#e0f2fe' : '#94a3b8',
                        fontWeight: isActive ? 500 : 400,
                        paddingLeft: isActive ? '6px' : 0,
                        transition: 'color 0.2s ease',
                        wordBreak: 'break-word',
                      }}
                    >
                      {paraText}
                    </p>
                  )
                }
                return (
                  <p
                    style={{
                      margin: 0,
                      fontSize: '11.5px',
                      lineHeight: 1.5,
                      color: '#64748b',
                      fontStyle: 'italic',
                      paddingLeft: isActive ? '6px' : 0,
                    }}
                  >
                    (No readable text detected in this segment)
                  </p>
                )
              })()}
            </div>
          )
          })
        )}
      </div>

      {/* ── Bottom Control Bar ── */}
      <div
        style={{
          borderTop: '1px solid rgba(56, 189, 248, 0.18)',
          padding: '8px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(2, 6, 23, 0.55)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        {/* ── Language + Voice Selector ── */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '7px',
              padding: '6px 12px',
              borderRadius: '10px',
              background: menuOpen
                ? 'rgba(6,182,212,0.18)'
                : 'rgba(6,182,212,0.08)',
              border: `1px solid rgba(6,182,212,${menuOpen ? '0.55' : '0.3'})`,
              color: '#67e8f9',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              letterSpacing: '0.03em',
            }}
          >
            <Mic size={12} color="#22d3ee" />
            <span>{selectedLang}</span>
            <span
              style={{
                fontSize: '10px',
                color: '#38bdf8',
                fontWeight: 400,
                borderLeft: '1px solid rgba(34,211,238,0.3)',
                paddingLeft: '7px',
              }}
            >
              {selectedVoice.label}
            </span>
            <ChevronDown size={12} color="#38bdf8" style={{ transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
          </button>

          {/* Floating glass menu */}
          {menuOpen && (
            <div
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 8px)',
                left: 0,
                width: '240px',
                background: 'rgba(2, 6, 23, 0.88)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                border: '1px solid rgba(56,189,248,0.28)',
                borderRadius: '14px',
                boxShadow: '0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(34,211,238,0.06)',
                overflow: 'hidden',
                zIndex: 50,
              }}
            >
              {/* Language section */}
              <div style={{ padding: '10px 12px 6px' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: '#475569', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  Language
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '7px' }}>
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setSelectedLang(lang)}
                      style={{
                        padding: '4px 11px',
                        borderRadius: '7px',
                        border: `1px solid rgba(6,182,212,${selectedLang === lang ? '0.6' : '0.18'})`,
                        background: selectedLang === lang ? 'rgba(6,182,212,0.2)' : 'transparent',
                        color: selectedLang === lang ? '#22d3ee' : '#64748b',
                        fontSize: '11px',
                        fontWeight: selectedLang === lang ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'all 0.12s ease',
                      }}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: '1px', background: 'rgba(56,189,248,0.1)', margin: '4px 12px' }} />

              {/* Voice persona section */}
              <div style={{ padding: '6px 12px 10px' }}>
                <span style={{ fontSize: '9px', fontWeight: 700, color: '#475569', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                  AI Voice
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '7px' }}>
                  {VOICES.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => { setSelectedVoice(v); setMenuOpen(false) }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '7px 10px',
                        borderRadius: '9px',
                        border: `1px solid rgba(6,182,212,${selectedVoice.id === v.id ? '0.5' : '0.1'})`,
                        background: selectedVoice.id === v.id ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.02)',
                        color: selectedVoice.id === v.id ? '#22d3ee' : '#94a3b8',
                        fontSize: '12px',
                        fontWeight: selectedVoice.id === v.id ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'all 0.12s ease',
                        textAlign: 'left',
                        width: '100%',
                      }}
                      onMouseEnter={(e) => {
                        if (selectedVoice.id !== v.id) e.currentTarget.style.background = 'rgba(6,182,212,0.07)'
                      }}
                      onMouseLeave={(e) => {
                        if (selectedVoice.id !== v.id) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                      }}
                    >
                      <span>{v.label}</span>
                      <span
                        style={{
                          fontSize: '10px',
                          color: selectedVoice.id === v.id ? '#38bdf8' : '#334155',
                          background: 'rgba(6,182,212,0.08)',
                          border: '1px solid rgba(6,182,212,0.15)',
                          padding: '1px 7px',
                          borderRadius: '9999px',
                        }}
                      >
                        {v.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Dictation Wave Orb ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {isDictating && (
            <span
              style={{
                fontSize: '10px',
                color: '#38bdf8',
                fontWeight: 500,
                letterSpacing: '0.04em',
              }}
            >
              {selectedVoice.label} · {selectedLang}
            </span>
          )}

          {/* Orb with halo rings */}
          <div style={{ position: 'relative', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Pulsing halo rings when dictating */}
            {isDictating && <HaloRing />}

            <button
              type="button"
              disabled={!hasContent}
              onClick={() => onDictationChange(!isDictating)}
              title={!hasContent ? 'No text to dictate' : isDictating ? 'Pause dictation' : 'Start dictation'}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: isDictating
                  ? 'linear-gradient(135deg, #2563eb, #06b6d4)'
                  : 'linear-gradient(135deg, rgba(37,99,235,0.3), rgba(6,182,212,0.3))',
                border: isDictating
                  ? 'none'
                  : '1.5px solid rgba(6,182,212,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: !hasContent ? 'not-allowed' : 'pointer',
                opacity: !hasContent ? 0.4 : 1,
                boxShadow: isDictating
                  ? '0 0 20px rgba(34, 211, 238, 0.55), 0 0 40px rgba(34, 211, 238, 0.2)'
                  : '0 0 10px rgba(6,182,212,0.15)',
                transition: 'all 0.25s ease',
                position: 'relative',
                zIndex: 1,
              }}
            >
              {isDictating ? (
                <WaveBars />
              ) : (
                /* Static mini bars when idle */
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '14px' }}>
                  {[8, 12, 10, 14, 9].map((h, i) => (
                    <div
                      key={i}
                      style={{
                        width: '2.5px',
                        height: `${h}px`,
                        background: 'rgba(34,211,238,0.5)',
                        borderRadius: '2px',
                      }}
                    />
                  ))}
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
