import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Send, Mic, Keyboard, Headphones, ExternalLink, Volume2, FileText, Sparkles,
} from 'lucide-react'
import { type ChatMessage, type Citation } from '../../data/mockData'
import { type StoredDocument } from '../../context/DocumentContext'

interface Props {
  doc: StoredDocument | null
  onCitationClick: (bboxId: string) => void
  onActivityStart: () => void   // pauses Section 2 dictation
}

const STARTER_CHIPS = [
  'Summarize key findings',
  'Explain main methodology',
  'What are the conclusions?',
]

/* ─────────── Typewriter streaming cursor ─────────── */
function StreamCursor() {
  return (
    <span
      className="stream-cursor"
      style={{
        display: 'inline-block',
        width: '2px',
        height: '14px',
        background: '#22d3ee',
        marginLeft: '2px',
        verticalAlign: 'middle',
        borderRadius: '1px',
        boxShadow: '0 0 8px rgba(34,211,238,0.9)',
      }}
    />
  )
}

/* ─────────── Karaoke word renderer for AI answer ─────────── */
function AnswerKaraoke({ words, activeIdx }: { words: string[]; activeIdx: number }) {
  return (
    <span>
      {words.map((word, i) => {
        const spoken  = i < activeIdx
        const current = i === activeIdx
        return (
          <span key={i}>
            <span
              style={{
                display: 'inline',
                borderRadius: '3px',
                padding: current ? '0 3px' : undefined,
                backgroundColor: current ? 'rgba(34,211,238,0.22)' : undefined,
                color: current ? '#67e8f9' : spoken ? 'rgba(203,213,225,0.5)' : '#cbd5e1',
                textShadow: current ? '0 0 8px rgba(34,211,238,0.8)' : undefined,
                fontWeight: current ? 600 : 400,
                transition: 'color 0.1s ease',
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

/* ─────────── Noise Cancellation HUD ─────────── */
function NoiseCancelHUD() {
  const pills = [
    { icon: '🔇', label: 'Echo Cancel',       status: 'ON', color: '#34d399' },
    { icon: '🌬️', label: 'Ambient Suppress', status: 'ON', color: '#22d3ee' },
    { icon: '🎙️', label: 'Voice Isolation',   status: 'ON', color: '#a78bfa' },
  ]
  return (
    <div
      style={{
        padding: '8px 14px',
        background: 'rgba(2,6,23,0.75)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(56,189,248,0.18)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexShrink: 0,
        flexWrap: 'wrap',
      }}
    >
      <span style={{ fontSize: '9px', color: '#38bdf8', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginRight: '4px' }}>
        NC Active
      </span>
      {pills.map((p) => (
        <div
          key={p.label}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 10px',
            borderRadius: '9999px',
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${p.color}44`,
            fontSize: '10px',
          }}
        >
          <span>{p.icon}</span>
          <span style={{ color: '#94a3b8' }}>{p.label}:</span>
          <span style={{ color: p.color, fontWeight: 600 }}>{p.status}</span>
        </div>
      ))}
    </div>
  )
}

/* ─────────── Citation pill ─────────── */
function CitationPill({
  cit,
  onPdfClick,
}: {
  cit: Citation
  onPdfClick: (bboxId: string) => void
}) {
  const [showTooltip, setShowTooltip] = useState(false)

  if (cit.type === 'web') {
    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button
          type="button"
          onMouseEnter={(e) => {
            setShowTooltip(true)
            e.currentTarget.style.background = 'rgba(79,70,229,0.25)'
          }}
          onMouseLeave={(e) => {
            setShowTooltip(false)
            e.currentTarget.style.background = 'rgba(79,70,229,0.12)'
          }}
          onClick={() => window.open(cit.url, '_blank', 'noopener')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 10px',
            borderRadius: '9999px',
            background: 'rgba(79,70,229,0.12)',
            border: '1px solid rgba(99,102,241,0.4)',
            color: '#a5b4fc',
            fontSize: '10px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <ExternalLink size={10} />
          <span>{cit.label}</span>
        </button>
        {showTooltip && cit.url && (
          <div
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 6px)',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'rgba(2,6,23,0.92)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(99,102,241,0.4)',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '10px',
              color: '#c7d2fe',
              whiteSpace: 'nowrap',
              zIndex: 100,
              pointerEvents: 'none',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            }}
          >
            🌐 {cit.url}
          </div>
        )}
      </div>
    )
  }

  // PDF citation
  return (
    <button
      type="button"
      onClick={() => onPdfClick(cit.bboxId)}
      title={`Jump to Page ${cit.page}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: '3px 10px',
        borderRadius: '9999px',
        background: 'rgba(6,182,212,0.08)',
        border: '1px solid rgba(6,182,212,0.3)',
        color: '#22d3ee',
        fontSize: '10px',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(6,182,212,0.2)'
        e.currentTarget.style.borderColor = 'rgba(34,211,238,0.6)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(6,182,212,0.08)'
        e.currentTarget.style.borderColor = 'rgba(6,182,212,0.3)'
      }}
    >
      <FileText size={10} />
      <span>{cit.label}</span>
    </button>
  )
}

/* ─────────── Main component ─────────── */
export function GlassChatPanel({ doc, onCitationClick, onActivityStart }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  // Reset messages when document changes
  useEffect(() => { setMessages([]) }, [doc?.id])
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'type' | 'voice' | 'listen'>('type')
  const [isGenerating, setIsGenerating] = useState(false)
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null)
  const [speakWordIdx, setSpeakWordIdx] = useState(0)
  // Streaming: track how many chars of the latest AI msg are revealed
  const [streamState, setStreamState] = useState<{ msgId: string; chars: number } | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  /* ── Scroll to bottom whenever messages/typing change ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isGenerating, streamState])

  /* ── Typewriter streaming for new AI messages ── */
  useEffect(() => {
    if (!streamState) return
    const msg = messages.find((m) => m.id === streamState.msgId)
    if (!msg) return
    if (streamState.chars >= msg.text.length) {
      setStreamState(null)
      return
    }
    const t = setTimeout(() => {
      setStreamState((s) => s ? { ...s, chars: s.chars + 3 } : null)
    }, 18)
    return () => clearTimeout(t)
  }, [streamState, messages])

  /* ── Karaoke advance while speaking an AI answer ── */
  useEffect(() => {
    if (!speakingMsgId) { setSpeakWordIdx(0); return }
    const msg = messages.find((m) => m.id === speakingMsgId)
    const words = msg?.words ?? msg?.text.split(' ') ?? []
    if (speakWordIdx >= words.length) return
    const t = setInterval(() => {
      setSpeakWordIdx((prev) => {
        if (prev >= words.length - 1) { clearInterval(t); return prev }
        return prev + 1
      })
    }, 340)
    return () => clearInterval(t)
  }, [speakingMsgId, speakWordIdx, messages])

  /* ── Send handler ── */
  const handleSend = useCallback(() => {
    const trimmed = input.trim()
    if (!trimmed) return

    // Priority interlock: stop Section 2 dictation
    onActivityStart()

    const userMsg: ChatMessage = { id: `msg-${Date.now()}`, type: 'user', text: trimmed }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsGenerating(true)

    setTimeout(() => {
      const responseText =
        'Quantum-classical hybrid retrieval augments a frozen LLM with a Grover-indexed vector store. At query time, the quantum oracle marks relevant embeddings in superposition; a single amplitude amplification pass surfaces the top-K results with O(√N) oracle calls. The classical decoder then conditions generation on these retrieved contexts, fusing neural language modelling with quantum-accelerated search.'
      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        type: 'ai',
        text: responseText,
        words: responseText.split(' '),
        streamed: true,
        citations: [
          { id: `cit-${Date.now()}-1`, label: 'Para 3 · p.1',   type: 'pdf', page: 1, bboxId: 'bbox-3' },
          { id: `cit-${Date.now()}-2`, label: 'Web · arxiv.org', type: 'web', page: 0, bboxId: '', url: 'https://arxiv.org/abs/2310.06825' },
        ],
      }
      setMessages((prev) => [...prev, aiMsg])
      setIsGenerating(false)
      // Start streaming reveal
      setStreamState({ msgId: aiMsg.id, chars: 0 })
    }, 1400)
  }, [input, onActivityStart])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSend() }
  }

  const toggleSpeaking = (msgId: string) => {
    if (speakingMsgId === msgId) {
      setSpeakingMsgId(null)
      setSpeakWordIdx(0)
    } else {
      onActivityStart()          // stop Section 2 dictation
      setSpeakingMsgId(msgId)
      setSpeakWordIdx(0)
    }
  }

  const handleListenMode = () => {
    const next = mode === 'listen' ? 'type' : 'listen'
    if (next === 'listen') onActivityStart()
    setMode(next)
  }

  const handleVoiceStt = () => {
    onActivityStart()
    setMode('voice')
    setInput((prev) => (prev ? prev + ' ' : '') + 'How does quantum attention work?')
    inputRef.current?.focus()
  }

  /* ── render message text (with stream / karaoke / plain) ── */
  const renderText = (msg: ChatMessage) => {
    if (msg.type !== 'ai') return <span>{msg.text}</span>

    // Still streaming in
    if (streamState && streamState.msgId === msg.id) {
      const revealed = msg.text.slice(0, streamState.chars)
      return (
        <span>
          {revealed}
          <StreamCursor />
        </span>
      )
    }

    // Being dictated with karaoke
    if (speakingMsgId === msg.id) {
      const words = msg.words ?? msg.text.split(' ')
      return <AnswerKaraoke words={words} activeIdx={speakWordIdx} />
    }

    // Fully revealed, word-animated on first appearance
    if (msg.words && msg.streamed) {
      return (
        <span>
          {msg.words.map((word, wIdx) => (
            <span
              key={wIdx}
              className="typing-word"
              style={{ display: 'inline-block', marginRight: '4px', animationDelay: `${Math.min(wIdx * 0.025, 1.0)}s` }}
            >
              {word}
            </span>
          ))}
        </span>
      )
    }

    return <span>{msg.text}</span>
  }

  /* ── glass tokens ── */
  const panelBg      = 'rgba(15, 23, 42, 0.45)'
  const glassBorder  = 'rgba(56, 189, 248, 0.22)'
  const headerBg     = 'rgba(2, 6, 23, 0.4)'
  const footerBg     = 'rgba(2, 6, 23, 0.6)'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: panelBg,
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: `1px solid ${glassBorder}`,
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 0 30px rgba(6,182,212,0.1), inset 0 1px 0 0 rgba(255,255,255,0.08)',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          padding: '10px 16px',
          borderBottom: `1px solid ${glassBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          background: headerBg,
        }}
      >
        <span style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.14em', color: '#38bdf8', fontWeight: 700 }}>
          Ask RIFT
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px rgba(16,185,129,0.6)', display: 'inline-block' }} />
          <span style={{ fontSize: '10px', color: '#475569' }}>Copilot Active</span>
        </div>
      </div>

      {/* ── Messages scroll area ── */}
      <div
        style={{ flex: 1, overflowY: 'auto', padding: '12px 12px 4px', display: 'flex', flexDirection: 'column', gap: '10px' }}
        className="glass-scroll"
      >
        {/* Empty state */}
        {messages.length === 0 && !isGenerating && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '24px 16px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={22} color="rgba(34,211,238,0.5)" />
            </div>
            <div>
              <p style={{ color: '#e0f2fe', fontSize: '13px', fontWeight: 600, margin: 0 }}>Ask anything about this document</p>
              <p style={{ color: '#475569', fontSize: '11px', marginTop: '5px', lineHeight: 1.5 }}>
                or click the Headphones icon to start<br />hands-free Listening Mode
              </p>
            </div>
            {/* Starter chips */}
            {doc && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', justifyContent: 'center', marginTop: '4px' }}>
                {STARTER_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => { setInput(chip); handleSend() }}
                    style={{ padding: '6px 14px', borderRadius: '9999px', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.3)', color: '#38bdf8', fontSize: '11px', fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s ease' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(6,182,212,0.18)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(6,182,212,0.08)' }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map((msg) => {
          const isUser = msg.type === 'user'
          const isSpeaking = speakingMsgId === msg.id

          if (isUser) {
            return (
              <div key={msg.id} style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <div
                  style={{
                    background: 'rgba(37,99,235,0.28)',
                    border: '1px solid rgba(34,211,238,0.35)',
                    borderRadius: '18px 3px 18px 18px',
                    padding: '9px 14px',
                    maxWidth: '75%',
                    fontSize: '12.5px',
                    lineHeight: 1.55,
                    color: '#e0f2fe',
                    boxShadow: '0 0 15px rgba(59,130,246,0.18)',
                    wordBreak: 'break-word',
                  }}
                >
                  {msg.text}
                </div>
              </div>
            )
          }

          // ── AI card ──
          const isStreaming = streamState?.msgId === msg.id
          return (
            <div key={msg.id} style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{ maxWidth: '88%', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {/* AI response card */}
                <div
                  style={{
                    background: 'rgba(8,47,73,0.42)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: `1px solid rgba(103,232,249,${isStreaming ? '0.5' : '0.28'})`,
                    borderRadius: '3px 18px 18px 18px',
                    padding: '12px 14px',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    boxShadow: `0 0 ${isStreaming ? '30px' : '20px'} rgba(34,211,238,${isStreaming ? '0.22' : '0.12'})`,
                    transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
                  }}
                >
                  {/* Streaming top-edge glow */}
                  {isStreaming && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0,
                        height: '1px',
                        background: 'linear-gradient(90deg, transparent, #22d3ee, transparent)',
                        borderRadius: '0 18px 0 0',
                      }}
                      className="scanline-sweep"
                    />
                  )}

                  {/* Message text */}
                  <div style={{ fontSize: '12.5px', lineHeight: 1.65, color: '#cbd5e1', paddingRight: '28px' }}>
                    {renderText(msg)}
                  </div>

                  {/* Answer dictation button (bottom-right inside card) */}
                  <button
                    type="button"
                    onClick={() => toggleSpeaking(msg.id)}
                    title={isSpeaking ? 'Pause answer dictation' : 'Dictate this answer'}
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      width: '26px',
                      height: '26px',
                      borderRadius: '50%',
                      background: isSpeaking
                        ? 'linear-gradient(135deg, #0ea5e9, #06b6d4)'
                        : 'rgba(6,182,212,0.08)',
                      border: `1px solid rgba(6,182,212,${isSpeaking ? '0.6' : '0.22'})`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isSpeaking ? '0 0 10px rgba(6,182,212,0.5)' : 'none',
                    }}
                  >
                    {isSpeaking ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5px', height: '10px' }}>
                        {[0, 0.1, 0.2].map((d, i) => (
                          <div key={i} className="wave-bar" style={{ width: '2px', background: '#fff', animationDelay: `${d}s` }} />
                        ))}
                      </div>
                    ) : (
                      <Volume2 size={12} color="#22d3ee" />
                    )}
                  </button>
                </div>

                {/* Citation pills row (outside the card) */}
                {msg.citations && msg.citations.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', paddingLeft: '4px' }}>
                    {msg.citations.map((cit) => (
                      <CitationPill key={cit.id} cit={cit} onPdfClick={onCitationClick} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* AI generating indicator */}
        {isGenerating && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div
              style={{
                background: 'rgba(8,47,73,0.42)',
                border: '1px solid rgba(34,211,238,0.3)',
                borderRadius: '3px 14px 14px 14px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ fontSize: '11px', color: '#38bdf8' }}>RIFT thinking</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '2px', height: '10px' }}>
                {[0, 0.12, 0.24].map((d, i) => (
                  <div key={i} className="wave-bar" style={{ width: '2px', background: '#06b6d4', animationDelay: `${d}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── Noise Cancellation HUD (shown when listen mode is active) ── */}
      {mode === 'listen' && <NoiseCancelHUD />}

      {/* ── Bottom Input Bar ── */}
      <div
        style={{
          borderTop: `1px solid ${glassBorder}`,
          padding: '10px 12px',
          background: footerBg,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          flexShrink: 0,
        }}
      >
        {/* Mode pills */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(2,6,23,0.6)',
            borderRadius: '10px',
            padding: '2px',
            border: '1px solid rgba(56,189,248,0.16)',
            gap: '1px',
            flexShrink: 0,
          }}
        >
          {([
            { m: 'type',   Icon: Keyboard,   label: 'Type'   },
            { m: 'voice',  Icon: Mic,        label: 'Voice'  },
            { m: 'listen', Icon: Headphones, label: 'Listen' },
          ] as const).map(({ m, Icon, label }) => {
            const on = mode === m
            return (
              <button
                key={m}
                type="button"
                onClick={() => {
                  if (m === 'listen') { handleListenMode(); return }
                  if (m === 'voice')  { handleVoiceStt();  return }
                  setMode('type')
                }}
                title={`${label} mode`}
                style={{
                  padding: '5px 8px',
                  borderRadius: '8px',
                  border: 'none',
                  background: on ? 'rgba(6,182,212,0.22)' : 'transparent',
                  color: on ? '#22d3ee' : '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '10px',
                  fontWeight: on ? 600 : 400,
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={12} />
                <span>{label}</span>
              </button>
            )
          })}
        </div>

        {/* Glass input pill */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(15,23,42,0.55)',
            border: '1px solid rgba(56,189,248,0.22)',
            borderRadius: '9999px',
            overflow: 'hidden',
            transition: 'border-color 0.15s ease',
          }}
          onFocusCapture={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(34,211,238,0.6)' }}
          onBlurCapture={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(56,189,248,0.22)' }}
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type Your Question…"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#e0f2fe',
              fontSize: '12.5px',
              padding: '8px 12px 8px 16px',
              fontFamily: 'inherit',
            }}
          />
          {/* STT mic inside pill */}
          <button
            type="button"
            title="Speak query (STT)"
            onClick={handleVoiceStt}
            style={{
              padding: '6px 10px 6px 6px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              color: mode === 'voice' ? '#22d3ee' : '#38bdf8',
              transition: 'color 0.15s ease',
            }}
          >
            <Mic size={15} />
          </button>
        </div>

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!input.trim()}
          title="Send question"
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: input.trim()
              ? 'linear-gradient(135deg, #0ea5e9, #06b6d4)'
              : 'rgba(6,182,212,0.07)',
            border: `1px solid rgba(6,182,212,${input.trim() ? '0.5' : '0.15'})`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: input.trim() ? 'pointer' : 'default',
            flexShrink: 0,
            boxShadow: input.trim() ? '0 0 14px rgba(6,182,212,0.4)' : 'none',
            transition: 'all 0.15s ease',
          }}
        >
          <Send size={14} color={input.trim() ? '#fff' : '#475569'} style={{ marginLeft: '1px' }} />
        </button>

        {/* Listening mode headphones orb */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {mode === 'listen' && (
            <>
              <div
                className="halo-ring"
                style={{ position: 'absolute', inset: '-5px', borderRadius: '50%', border: '1.5px solid rgba(6,182,212,0.5)', pointerEvents: 'none' }}
              />
              <div
                className="halo-ring halo-ring-outer"
                style={{ position: 'absolute', inset: '-12px', borderRadius: '50%', border: '1px solid rgba(6,182,212,0.25)', pointerEvents: 'none' }}
              />
            </>
          )}
          <button
            type="button"
            onClick={handleListenMode}
            title={mode === 'listen' ? 'Exit Listening Mode' : 'Enter Listening Mode'}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: mode === 'listen'
                ? 'linear-gradient(135deg, #06b6d4, #2563eb)'
                : 'rgba(6,182,212,0.1)',
              border: `1.5px solid rgba(6,182,212,${mode === 'listen' ? '0.7' : '0.3'})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: mode === 'listen' ? '0 0 18px rgba(6,182,212,0.55)' : 'none',
              transition: 'all 0.25s ease',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <Headphones size={18} color={mode === 'listen' ? '#fff' : '#22d3ee'} />
          </button>
        </div>
      </div>
    </div>
  )
}
