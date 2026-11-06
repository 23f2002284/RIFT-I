import { useRef, useState } from 'react'
import { Mic, Plus } from 'lucide-react'

interface Props {
  onUpload: (files?: FileList) => void
}

export function PromptBox({ onUpload }: Props) {
  const [instructions, setInstructions] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInstructions(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files)
    }
  }

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '680px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '28px',
      }}
    >
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="riftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#7b2cbf" />
            </linearGradient>
          </defs>
          <circle cx="22" cy="22" r="20" stroke="url(#riftGrad)" strokeWidth="2.5" fill="#1a1028" />
          <rect
            x="16"
            y="16"
            width="12"
            height="12"
            rx="2.5"
            transform="rotate(45 22 22)"
            fill="url(#riftGrad)"
          />
        </svg>
        <span
          style={{
            fontSize: '28px',
            fontWeight: 700,
            color: '#d8b4fe',
            letterSpacing: '0.08em',
          }}
        >
          RIFT
        </span>
      </div>

      {/* Wide Rounded Box */}
      <div
        style={{
          width: '100%',
          backgroundColor: '#1a1028',
          border: '1px solid #7a7a7a',
          borderRadius: '16px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        <textarea
          ref={textareaRef}
          value={instructions}
          onChange={handleTextChange}
          placeholder="Write all Instructions…"
          rows={3}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#f0e6ff',
            fontSize: '15px',
            fontFamily: 'inherit',
            resize: 'none',
            lineHeight: 1.5,
          }}
        />

        {/* Bottom Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '8px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {/* Upload Button */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept="application/pdf"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '9999px',
                border: '1px solid #9b5de5',
                backgroundColor: 'rgba(155, 93, 229, 0.1)',
                color: '#d8b4fe',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(155, 93, 229, 0.25)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(155, 93, 229, 0.1)'
              }}
            >
              <Plus size={16} color="#c084fc" />
              <span>+ Upload PDF</span>
            </button>
          </div>

          {/* Right: Mic & Audio Waves */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isRecording && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '24px' }}>
                <div className="wave-bar" />
                <div className="wave-bar" />
                <div className="wave-bar" />
                <div className="wave-bar" />
                <div className="wave-bar" />
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsRecording(!isRecording)}
              title={isRecording ? 'Stop recording' : 'Record audio instructions'}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                backgroundColor: isRecording ? '#7b2cbf' : '#9b5de5',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: isRecording ? '0 0 16px rgba(155, 93, 229, 0.7)' : '0 2px 8px rgba(0,0,0,0.3)',
                transition: 'all 0.2s ease',
              }}
            >
              <Mic size={18} color="#ffffff" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
