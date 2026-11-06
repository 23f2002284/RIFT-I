import { useState, useRef, useEffect } from 'react'
import {
  Send,
  Mic,
  Keyboard,
  Headphones,
  ExternalLink,
  Volume2,
} from 'lucide-react'
import { mockChatMessages, type ChatMessage } from '../../data/mockData'

interface Props {
  onCitationClick: (bboxId: string) => void
  onActivityStart: () => void // called when chat starts, to pause dictation
}

export function ChatPanel({ onCitationClick, onActivityStart }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>(mockChatMessages)
  const [input, setInput] = useState('')
  const [mode, setMode] = useState<'type' | 'voice' | 'listen'>('type')
  const [isTyping, setIsTyping] = useState(false)
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const handleSend = () => {
    const trimmed = input.trim()
    if (!trimmed) return

    onActivityStart()

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      type: 'user',
      text: trimmed,
    }

    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    // Simulate AI response after 1.5s
    setTimeout(() => {
      const responseText =
        'Based on the document, Transformers replace recurrent neural networks entirely with multi-head self-attention mechanisms. This allows for extensive parallelization during training and significantly better handling of long-distance contextual dependencies across sequences.'
      const responseWords = responseText.split(' ')

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        type: 'ai',
        text: responseText,
        words: responseWords,
        citations: [
          { id: `cit-${Date.now()}-1`, label: 'Deep Learning, p.5', page: 5, bboxId: 'bbox-5', type: 'pdf' as const },
          { id: `cit-${Date.now()}-2`, label: 'Transformer Architecture, p.6', page: 6, bboxId: 'bbox-6', type: 'pdf' as const },
        ],
      }

      setMessages((prev) => [...prev, aiMsg])
      setIsTyping(false)
    }, 1500)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  const toggleSpeaking = (msgId: string) => {
    if (speakingMsgId === msgId) {
      setSpeakingMsgId(null)
    } else {
      setSpeakingMsgId(msgId)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        backgroundColor: '#0d0d0d',
        borderTop: '1px solid #3a2050',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px 16px',
          borderBottom: '1px solid #1f1430',
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
          Ask RIFT
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
            }}
          />
          <span style={{ fontSize: '11px', color: '#6b5b7b' }}>RIFT Copilot Active</span>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        {messages.map((msg) => {
          const isUser = msg.type === 'user'

          if (isUser) {
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <div
                  style={{
                    backgroundColor: '#7b2cbf',
                    color: '#ffffff',
                    borderRadius: '16px 4px 16px 16px',
                    padding: '10px 16px',
                    maxWidth: '80%',
                    fontSize: '13px',
                    lineHeight: 1.5,
                    boxShadow: '0 2px 8px rgba(123, 44, 191, 0.3)',
                    wordBreak: 'break-word',
                  }}
                >
                  {msg.text}
                </div>
              </div>
            )
          }

          // AI Message Card
          const isSpeaking = speakingMsgId === msg.id

          return (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                justifyContent: 'flex-start',
              }}
            >
              <div
                style={{
                  backgroundColor: '#241734',
                  border: '1px solid #3a2050',
                  borderRadius: '4px 16px 16px 16px',
                  padding: '14px 16px',
                  maxWidth: '85%',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                }}
              >
                {/* Message Text with Word-by-Word or Instant rendering */}
                <div
                  style={{
                    fontSize: '13px',
                    lineHeight: 1.55,
                    color: '#f0e6ff',
                    paddingRight: '28px',
                  }}
                >
                  {msg.words ? (
                    <span>
                      {msg.words.map((word, wIdx) => (
                        <span
                          key={wIdx}
                          className="typing-word"
                          style={{
                            display: 'inline-block',
                            marginRight: '4px',
                            animationDelay: `${Math.min(wIdx * 0.03, 1.2)}s`,
                          }}
                        >
                          {word}
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span>{msg.text}</span>
                  )}
                </div>

                {/* Citations Row */}
                {msg.citations && msg.citations.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '6px',
                      marginTop: '4px',
                    }}
                  >
                    {msg.citations.map((cit) => (
                      <button
                        key={cit.id}
                        type="button"
                        onClick={() => onCitationClick(cit.bboxId)}
                        title={`Jump to page ${cit.page}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          backgroundColor: '#3a2050',
                          border: '1px solid #4a2868',
                          color: '#c084fc',
                          borderRadius: '9999px',
                          padding: '3px 10px',
                          fontSize: '11px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          transition: 'background-color 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#4a2868'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = '#3a2050'
                        }}
                      >
                        <ExternalLink size={12} color="#c084fc" />
                        <span>{cit.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Speaker / Dictation Icon Button */}
                <button
                  type="button"
                  onClick={() => toggleSpeaking(msg.id)}
                  title={isSpeaking ? 'Pause reading' : 'Read answer aloud'}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: isSpeaking ? '#9b5de5' : 'rgba(155, 93, 229, 0.15)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isSpeaking ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5px', height: '10px' }}>
                      <div className="wave-bar" style={{ width: '2px', background: '#ffffff' }} />
                      <div className="wave-bar" style={{ width: '2px', background: '#ffffff' }} />
                      <div className="wave-bar" style={{ width: '2px', background: '#ffffff' }} />
                    </div>
                  ) : (
                    <Volume2 size={13} color="#c084fc" />
                  )}
                </button>
              </div>
            </div>
          )
        })}

        {/* AI Typing Indicator */}
        {isTyping && (
          <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div
              style={{
                backgroundColor: '#241734',
                border: '1px solid #3a2050',
                borderRadius: '4px 16px 16px 16px',
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span style={{ fontSize: '11px', color: '#9b8bbb', marginRight: '4px' }}>RIFT thinking</span>
              <div className="wave-bar" style={{ height: '8px' }} />
              <div className="wave-bar" style={{ height: '8px' }} />
              <div className="wave-bar" style={{ height: '8px' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Noise Cancellation Indicator (for Listen mode) */}
      {mode === 'listen' && (
        <div
          style={{
            padding: '6px 16px',
            backgroundColor: '#1a1028',
            borderTop: '1px solid #3a2050',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '11px',
          }}
        >
          <span
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.2)',
              color: '#34d399',
              padding: '2px 8px',
              borderRadius: '9999px',
              fontWeight: 500,
            }}
          >
            🎙 Voice: Active
          </span>
          <span
            style={{
              backgroundColor: '#241734',
              color: '#9b8bbb',
              padding: '2px 8px',
              borderRadius: '9999px',
            }}
          >
            🔇 Echo: Filtered
          </span>
          <span
            style={{
              backgroundColor: '#241734',
              color: '#9b8bbb',
              padding: '2px 8px',
              borderRadius: '9999px',
            }}
          >
            🌊 Noise: Cancelled
          </span>
        </div>
      )}

      {/* Bottom Input Bar */}
      <div
        style={{
          borderTop: '1px solid #3a2050',
          padding: '10px 16px',
          backgroundColor: '#0d0d0d',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Mode Toggles */}
          <div
            style={{
              display: 'flex',
              backgroundColor: '#1a1028',
              borderRadius: '8px',
              padding: '2px',
              border: '1px solid #3a2050',
            }}
          >
            <button
              type="button"
              onClick={() => setMode('type')}
              title="Type Mode"
              style={{
                padding: '5px 8px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: mode === 'type' ? '#9b5de5' : 'transparent',
                color: mode === 'type' ? '#ffffff' : '#9b8bbb',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
              }}
            >
              <Keyboard size={13} />
              <span>Type</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('voice')}
              title="Voice Mode"
              style={{
                padding: '5px 8px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: mode === 'voice' ? '#9b5de5' : 'transparent',
                color: mode === 'voice' ? '#ffffff' : '#9b8bbb',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
              }}
            >
              <Mic size={13} />
              <span>Voice</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('listen')}
              title="Listen Mode"
              style={{
                padding: '5px 8px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: mode === 'listen' ? '#9b5de5' : 'transparent',
                color: mode === 'listen' ? '#ffffff' : '#9b8bbb',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
              }}
            >
              <Headphones size={13} />
              <span>Listen</span>
            </button>
          </div>

          {/* Text Input with internal Mic button */}
          <div
            style={{
              flex: 1,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type Your Question…"
              style={{
                width: '100%',
                backgroundColor: '#1a1028',
                border: '1px solid #3a2050',
                borderRadius: '20px',
                padding: '8px 38px 8px 14px',
                color: '#f0e6ff',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            <button
              type="button"
              title="Voice input"
              onClick={() => {
                onActivityStart()
                setInput((prev) => (prev ? prev + ' ' : '') + 'Explain the attention mechanism')
              }}
              style={{
                position: 'absolute',
                right: '8px',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#9b8bbb',
                padding: '4px',
              }}
            >
              <Mic size={15} />
            </button>
          </div>

          {/* Send Button */}
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim()}
            title="Send Question"
            style={{
              width: '34px',
              height: '34px',
              borderRadius: '50%',
              backgroundColor: input.trim() ? '#9b5de5' : '#3a2050',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: input.trim() ? 'pointer' : 'default',
              transition: 'all 0.15s ease',
              flexShrink: 0,
            }}
          >
            <Send size={15} color="#ffffff" style={{ marginLeft: '1px' }} />
          </button>
        </div>
      </div>
    </div>
  )
}
