import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  FileText,
  Sliders,
  Check,
} from 'lucide-react'
import { type StoredDocument } from '../../context/DocumentContext'
import { mockParagraphs } from '../../data/mockData'

interface Props {
  doc: StoredDocument | null
  activeParagraphIdx: number
  onBlockClick: (idx: number) => void
  isDictating: boolean
  onDictationChange: (val: boolean) => void
}

/* ─────────── Voice personas ─────────── */
const LANGUAGES = ['EN', 'ES', 'FR', 'DE', 'HI', 'JA', 'ZH']
const VOICES = [
  { id: 'nova',  label: 'Nova',  desc: 'Neural Studio' },
  { id: 'orion', label: 'Orion', desc: 'Deep Narrative' },
  { id: 'aria',  label: 'Aria',  desc: 'Conversational' },
  { id: 'echo',  label: 'Echo',  desc: 'Crisp & Clear' },
]

export interface ScriptSegment {
  id: string
  paragraphIdx: number
  text: string
  timecode: string
  words: string[]
}

/** Formats seconds into MM:SS */
function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60)
  const secs = Math.floor(totalSeconds % 60)
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

/* ─────────── ElevenLabs Spectral Wave Bars ─────────── */
function WaveBars() {
  const delays = [0, 0.15, 0.08, 0.22, 0.05, 0.18, 0.1]
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2.5px', height: '16px' }}>
      {delays.map((d, i) => (
        <div
          key={i}
          className="wave-bar"
          style={{
            width: '2.5px',
            background: '#ffffff',
            borderRadius: '2px',
            animationDelay: `${d}s`,
          }}
        />
      ))}
    </div>
  )
}

/* ─────────── Word-by-Word Transcript Renderer ─────────── */
function WordByWordText({
  words,
  activeWordIdx,
  isLive,
}: {
  words: string[]
  activeWordIdx: number
  isLive: boolean
}) {
  if (!isLive) {
    return (
      <span style={{ color: '#f1f5f9', fontWeight: 500, fontSize: '15px', lineHeight: 1.65 }}>
        {words.join(' ')}
      </span>
    )
  }

  return (
    <span style={{ fontSize: '15px', lineHeight: 1.65 }}>
      {words.map((word, i) => {
        const isSpoken = i < activeWordIdx
        const isCurrent = i === activeWordIdx

        return (
          <span key={i}>
            <span
              style={{
                display: 'inline-block',
                borderRadius: '4px',
                padding: isCurrent ? '0 4px' : undefined,
                margin: isCurrent ? '0 1px' : undefined,
                backgroundColor: isCurrent ? 'rgba(34, 211, 238, 0.24)' : undefined,
                color: isCurrent
                  ? '#67e8f9'
                  : isSpoken
                  ? '#f8fafc'
                  : 'rgba(148, 163, 184, 0.45)',
                textShadow: isCurrent
                  ? '0 0 12px rgba(34, 211, 238, 0.85)'
                  : undefined,
                fontWeight: isCurrent ? 700 : isSpoken ? 500 : 400,
                transform: isCurrent ? 'scale(1.04)' : 'scale(1)',
                transition: 'all 0.12s ease',
              }}
            >
              {word}
            </span>
            {i < words.length - 1 ? ' ' : ''}
          </span>
        )
      })}
    </span>
  )
}

/* ─────────── Main GlassTranscriptPanel ─────────── */
export function GlassTranscriptPanel({
  doc,
  activeParagraphIdx,
  onBlockClick,
  isDictating,
  onDictationChange,
}: Props) {
  const [selectedLang, setSelectedLang] = useState('EN')
  const [selectedVoice, setSelectedVoice] = useState(VOICES[0])
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [speedMenuOpen, setSpeedMenuOpen] = useState(false)
  const [activeWordIdx, setActiveWordIdx] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLDivElement | null)[]>([])
  const menuRef = useRef<HTMLDivElement>(null)
  const speedRef = useRef<HTMLDivElement>(null)

  // 1. Break raw paragraphs down into concise 1-2 line script segments
  const rawParagraphs = doc?.paragraphs && doc.paragraphs.length > 0
    ? doc.paragraphs
    : mockParagraphs

  const segments: ScriptSegment[] = useMemo(() => {
    const list: ScriptSegment[] = []
    let cumulativeSeconds = 0

    rawParagraphs.forEach((para, pIdx) => {
      const rawText = (para.text || (para as any).content || (para as any).body || '').trim()
      if (!rawText) return

      // Split into 1-2 line chunks: sentences or clauses of ~12-18 words max
      const sentences = rawText.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [rawText]

      sentences.forEach((s: string) => {
        const trimmed = s.trim()
        if (!trimmed) return

        const words = trimmed.split(/\s+/).filter(Boolean)
        // If a single sentence is still very long, split into ~14-word lines
        const chunkSize = 15
        for (let w = 0; w < words.length; w += chunkSize) {
          const chunkWords = words.slice(w, w + chunkSize)
          const chunkText = chunkWords.join(' ')
          const timecode = formatTime(cumulativeSeconds)

          list.push({
            id: `seg-${pIdx}-${list.length}`,
            paragraphIdx: pIdx,
            text: chunkText,
            timecode,
            words: chunkWords,
          })

          // ~280ms per word
          cumulativeSeconds += Math.max(2, chunkWords.length * 0.32)
        }
      })
    })

    return list
  }, [rawParagraphs])

  // Map activeParagraphIdx to corresponding segment index
  const activeSegmentIdx = useMemo(() => {
    const found = segments.findIndex((s) => s.paragraphIdx === activeParagraphIdx)
    return found >= 0 ? found : 0
  }, [segments, activeParagraphIdx])

  const currentSegment = segments[activeSegmentIdx] || segments[0]

  /* ── Smooth center autoscroll ── */
  const scrollToCenter = useCallback((index: number, smooth = true) => {
    const container = containerRef.current
    const el = itemRefs.current[index]
    if (!container || !el) return

    const containerHeight = container.clientHeight
    const elTop = el.offsetTop
    const elHeight = el.clientHeight
    // Center target calculation: aligns middle of el with middle of container
    const targetScroll = elTop - (containerHeight / 2) + (elHeight / 2)

    container.scrollTo({
      top: Math.max(0, targetScroll),
      behavior: smooth ? 'smooth' : 'auto',
    })
  }, [])

  // Auto-scroll whenever active segment changes
  useEffect(() => {
    scrollToCenter(activeSegmentIdx, true)
    setActiveWordIdx(0)
  }, [activeSegmentIdx, scrollToCenter])

  // Center on mount and window resize
  useEffect(() => {
    const handleResize = () => scrollToCenter(activeSegmentIdx, false)
    window.addEventListener('resize', handleResize)
    const t = setTimeout(() => scrollToCenter(activeSegmentIdx, false), 150)
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(t)
    }
  }, [activeSegmentIdx, scrollToCenter])

  /* ── Word-by-word streaming during playback ── */
  useEffect(() => {
    if (!isDictating || !currentSegment) {
      setActiveWordIdx(0)
      return
    }

    const wordsCount = currentSegment.words.length
    const wordIntervalMs = Math.round(300 / playbackSpeed)

    const timer = setInterval(() => {
      setActiveWordIdx((prev) => {
        if (prev < wordsCount - 1) {
          return prev + 1
        }
        // Segment finished -> advance to next segment
        const nextIdx = (activeSegmentIdx + 1) % Math.max(segments.length, 1)
        const nextSeg = segments[nextIdx]
        if (nextSeg) {
          onBlockClick(nextSeg.paragraphIdx)
        }
        return 0
      })
    }, wordIntervalMs)

    return () => clearInterval(timer)
  }, [isDictating, activeSegmentIdx, currentSegment, segments, onBlockClick, playbackSpeed])

  /* ── Close menus on click outside ── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
      if (speedRef.current && !speedRef.current.contains(e.target as Node)) {
        setSpeedMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSelectSegment = (idx: number) => {
    const seg = segments[idx]
    if (seg) {
      onBlockClick(seg.paragraphIdx)
    }
  }

  const handlePrev = () => {
    const prevIdx = (activeSegmentIdx - 1 + segments.length) % segments.length
    handleSelectSegment(prevIdx)
  }

  const handleNext = () => {
    const nextIdx = (activeSegmentIdx + 1) % segments.length
    handleSelectSegment(nextIdx)
  }

  const hasContent = segments.length > 0

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#070b14',
        border: '1px solid rgba(56, 189, 248, 0.2)',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 0 32px rgba(6, 182, 212, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.06)',
        position: 'relative',
      }}
    >
      {/* ── Top Header ── */}
      <div
        style={{
          padding: '12px 18px',
          borderBottom: '1px solid rgba(56, 189, 248, 0.14)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          background: 'rgba(11, 15, 25, 0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: 'rgba(6, 182, 212, 0.12)',
              border: '1px solid rgba(34, 211, 238, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Volume2 size={15} color="#38bdf8" />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: '#e2e8f0',
                }}
              >
                Transcript
              </span>

              {isDictating ? (
                <span
                  style={{
                    fontSize: '9px',
                    color: '#22d3ee',
                    fontWeight: 700,
                    background: 'rgba(6, 182, 212, 0.15)',
                    border: '1px solid rgba(34, 211, 238, 0.4)',
                    padding: '2px 7px',
                    borderRadius: '9999px',
                    letterSpacing: '0.08em',
                  }}
                >
                  ● SPEAKING
                </span>
              ) : (
                <span
                  style={{
                    fontSize: '9px',
                    color: '#64748b',
                    fontWeight: 500,
                    background: 'rgba(255, 255, 255, 0.04)',
                    padding: '2px 7px',
                    borderRadius: '9999px',
                  }}
                >
                  READY
                </span>
              )}
            </div>
            <span style={{ fontSize: '10px', color: '#64748b' }}>
              ElevenLabs Voice Engine · {selectedVoice.label}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '11px',
              color: '#38bdf8',
              fontWeight: 600,
              background: 'rgba(14, 165, 233, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              padding: '3px 9px',
              borderRadius: '6px',
            }}
          >
            {activeSegmentIdx + 1} / {segments.length}
          </span>
          <span
            style={{
              fontSize: '10px',
              color: '#475569',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title="Active line remains strictly centered in view"
          >
            <Check size={12} color="#22d3ee" />
            Auto-center
          </span>
        </div>
      </div>

      {/* ── ElevenLabs Transcript Scrollport with Top/Bottom Vignette ── */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          paddingLeft: '16px',
          paddingRight: '16px',
          // Generous top & bottom padding so every line (including first and last) can sit in center
          paddingTop: 'calc(50% - 40px)',
          paddingBottom: 'calc(50% - 40px)',
          scrollBehavior: 'smooth',
          position: 'relative',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%, black 85%, transparent 100%)',
        }}
        className="glass-scroll"
      >
        {!hasContent ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 20px',
              textAlign: 'center',
              gap: '12px',
            }}
          >
            <FileText size={32} color="rgba(56, 189, 248, 0.3)" />
            <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
              No extractable script text found
            </p>
          </div>
        ) : (
          segments.map((seg, idx) => {
            const isActive = activeSegmentIdx === idx
            const distance = Math.abs(idx - activeSegmentIdx)
            // Teleprompter opacity curve: active is 1.0, neighbors fade out smoothly
            const opacity = isActive
              ? 1
              : distance === 1
              ? 0.55
              : distance === 2
              ? 0.35
              : 0.2

            return (
              <div
                key={seg.id}
                ref={(el) => {
                  itemRefs.current[idx] = el
                }}
                onClick={() => handleSelectSegment(idx)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  borderRadius: '12px',
                  padding: isActive ? '14px 18px' : '10px 16px',
                  marginBottom: '10px',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                  opacity,
                  transform: isActive ? 'scale(1.02)' : 'scale(0.98)',
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(8, 47, 73, 0.55), rgba(15, 23, 42, 0.8))'
                    : 'rgba(15, 23, 42, 0.2)',
                  border: isActive
                    ? '1.5px solid rgba(34, 211, 238, 0.65)'
                    : '1px solid rgba(255, 255, 255, 0.04)',
                  boxShadow: isActive
                    ? '0 0 24px rgba(6, 182, 212, 0.22), 0 4px 16px rgba(0, 0, 0, 0.4)'
                    : 'none',
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.opacity = '0.85'
                    e.currentTarget.style.background = 'rgba(30, 41, 59, 0.4)'
                    e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.25)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.opacity = String(opacity)
                    e.currentTarget.style.background = 'rgba(15, 23, 42, 0.2)'
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.04)'
                  }
                }}
              >
                {/* Active Cyan Left Accent Indicator */}
                {isActive && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      bottom: 0,
                      width: '4px',
                      background: 'linear-gradient(180deg, #38bdf8, #06b6d4, #2563eb)',
                      borderRadius: '4px 0 0 4px',
                    }}
                  />
                )}

                {/* Left Gutter: Timecode / Play indicator (NO SEGMENT 01 / bboxId) */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    flexShrink: 0,
                    marginTop: '2px',
                    minWidth: '52px',
                  }}
                >
                  {isActive && isDictating ? (
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: 'rgba(34, 211, 238, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <WaveBars />
                    </div>
                  ) : (
                    <div
                      style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '50%',
                        background: isActive ? 'rgba(34, 211, 238, 0.15)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Play
                        size={11}
                        color={isActive ? '#38bdf8' : '#475569'}
                        style={{ marginLeft: '1px' }}
                      />
                    </div>
                  )}

                  <span
                    style={{
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      color: isActive ? '#67e8f9' : '#475569',
                      fontWeight: isActive ? 600 : 400,
                    }}
                  >
                    {seg.timecode}
                  </span>
                </div>

                {/* Script Section Text (1-2 lines, clean, word-by-word) */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {isActive ? (
                    <WordByWordText
                      words={seg.words}
                      activeWordIdx={activeWordIdx}
                      isLive={isDictating}
                    />
                  ) : (
                    <span
                      style={{
                        color: '#94a3b8',
                        fontSize: '14px',
                        lineHeight: 1.6,
                        fontWeight: 400,
                        wordBreak: 'break-word',
                      }}
                    >
                      {seg.text}
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* ── ElevenLabs Control Dock (Bottom) ── */}
      <div
        style={{
          borderTop: '1px solid rgba(56, 189, 248, 0.16)',
          padding: '12px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          background: 'rgba(8, 12, 22, 0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          flexShrink: 0,
          zIndex: 10,
        }}
      >
        {/* Progress scrub bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace', minWidth: '32px' }}>
            {currentSegment?.timecode || '00:00'}
          </span>

          <div
            onClick={(e) => {
              if (segments.length === 0) return
              const rect = e.currentTarget.getBoundingClientRect()
              const pct = (e.clientX - rect.left) / rect.width
              const targetIdx = Math.min(
                segments.length - 1,
                Math.max(0, Math.floor(pct * segments.length))
              )
              handleSelectSegment(targetIdx)
            }}
            style={{
              flex: 1,
              height: '5px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.08)',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: `${Math.round(((activeSegmentIdx + 1) / Math.max(segments.length, 1)) * 100)}%`,
                background: 'linear-gradient(90deg, #0284c7, #38bdf8)',
                borderRadius: '9999px',
                transition: 'width 0.15s ease',
              }}
            />
          </div>

          <span style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace', minWidth: '32px', textAlign: 'right' }}>
            {segments[segments.length - 1]?.timecode || '00:00'}
          </span>
        </div>

        {/* Primary Controls Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Left: Language & Voice selectors */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Voice Dropdown */}
            <div style={{ position: 'relative' }} ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 10px',
                  borderRadius: '8px',
                  background: 'rgba(14, 165, 233, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.28)',
                  color: '#38bdf8',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{selectedVoice.label}</span>
                <span style={{ fontSize: '9px', color: '#64748b' }}>({selectedLang})</span>
                <ChevronDown size={12} color="#38bdf8" />
              </button>

              {menuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 8px)',
                    left: 0,
                    width: '230px',
                    background: 'rgba(11, 15, 25, 0.95)',
                    backdropFilter: 'blur(24px)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    borderRadius: '12px',
                    boxShadow: '0 16px 40px rgba(0, 0, 0, 0.7)',
                    padding: '8px',
                    zIndex: 50,
                  }}
                >
                  <div style={{ padding: '4px 6px 6px' }}>
                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', letterSpacing: '0.1em' }}>
                      VOICE MODEL
                    </span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '6px' }}>
                      {VOICES.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => {
                            setSelectedVoice(v)
                            setMenuOpen(false)
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            background: selectedVoice.id === v.id ? 'rgba(14, 165, 233, 0.16)' : 'transparent',
                            border: `1px solid ${selectedVoice.id === v.id ? 'rgba(56, 189, 248, 0.4)' : 'transparent'}`,
                            color: selectedVoice.id === v.id ? '#38bdf8' : '#cbd5e1',
                            fontSize: '11px',
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          <span>{v.label}</span>
                          <span style={{ fontSize: '9px', color: '#64748b' }}>{v.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.08)', margin: '4px 0' }} />

                  <div style={{ padding: '6px' }}>
                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#64748b', letterSpacing: '0.1em' }}>
                      LANGUAGE
                    </span>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                      {LANGUAGES.map((l) => (
                        <button
                          key={l}
                          type="button"
                          onClick={() => setSelectedLang(l)}
                          style={{
                            padding: '3px 8px',
                            borderRadius: '5px',
                            background: selectedLang === l ? 'rgba(14, 165, 233, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                            border: `1px solid ${selectedLang === l ? 'rgba(56, 189, 248, 0.5)' : 'transparent'}`,
                            color: selectedLang === l ? '#38bdf8' : '#94a3b8',
                            fontSize: '10px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Speed Multiplier Button */}
            <div style={{ position: 'relative' }} ref={speedRef}>
              <button
                type="button"
                onClick={() => setSpeedMenuOpen((o) => !o)}
                style={{
                  padding: '5px 8px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#94a3b8',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Sliders size={11} color="#64748b" />
                <span>{playbackSpeed}x</span>
              </button>

              {speedMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 8px)',
                    left: 0,
                    background: 'rgba(11, 15, 25, 0.95)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    borderRadius: '8px',
                    padding: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                    zIndex: 50,
                  }}
                >
                  {[0.8, 1.0, 1.25, 1.5, 2.0].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setPlaybackSpeed(s)
                        setSpeedMenuOpen(false)
                      }}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '5px',
                        background: playbackSpeed === s ? 'rgba(14, 165, 233, 0.2)' : 'transparent',
                        border: 'none',
                        color: playbackSpeed === s ? '#38bdf8' : '#cbd5e1',
                        fontSize: '11px',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Center / Right: Prev, Play/Pause, Next */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handlePrev}
              title="Previous script line"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <SkipBack size={14} />
            </button>

            {/* Glowing ElevenLabs Play Button */}
            <button
              type="button"
              disabled={!hasContent}
              onClick={() => onDictationChange(!isDictating)}
              title={isDictating ? 'Pause dictation' : 'Start speaking transcript'}
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: isDictating
                  ? 'linear-gradient(135deg, #0284c7, #06b6d4)'
                  : 'linear-gradient(135deg, rgba(2, 132, 199, 0.35), rgba(6, 182, 212, 0.25))',
                border: isDictating
                  ? 'none'
                  : '1.5px solid rgba(56, 189, 248, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: !hasContent ? 'not-allowed' : 'pointer',
                boxShadow: isDictating
                  ? '0 0 20px rgba(34, 211, 238, 0.6), 0 0 35px rgba(6, 182, 212, 0.25)'
                  : '0 0 12px rgba(6, 182, 212, 0.15)',
                transition: 'all 0.2s ease',
              }}
            >
              {isDictating ? (
                <Pause size={17} color="#ffffff" />
              ) : (
                <Play size={17} color="#38bdf8" style={{ marginLeft: '2px' }} />
              )}
            </button>

            <button
              type="button"
              onClick={handleNext}
              title="Next script line"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#94a3b8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <SkipForward size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
