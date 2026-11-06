import { useRef, useState } from 'react'
import { Mic, Upload, Loader } from 'lucide-react'

interface Props {
  onUpload: (files: FileList) => void
  uploadProgress: number | null   // 0–100 while uploading, null when idle
  uploadError: string | null
}

export function GlassPromptBox({ onUpload, uploadProgress, uploadError }: Props) {
  const [instructions, setInstructions] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const isUploading = uploadProgress !== null

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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    if (e.dataTransfer.files.length > 0) onUpload(e.dataTransfer.files)
  }

  return (
    <div style={{ width: '100%', maxWidth: '680px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '28px' }}>

      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ filter: 'drop-shadow(0 0 15px rgba(6,182,212,0.7))' }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <defs>
              <linearGradient id="gG" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
              <linearGradient id="gI" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" />
                <stop offset="100%" stopColor="#4f46e5" />
              </linearGradient>
            </defs>
            <circle cx="24" cy="24" r="22" stroke="url(#gG)" strokeWidth="1.5" fill="rgba(15,23,42,0.6)" />
            <rect x="17" y="17" width="14" height="14" rx="2" transform="rotate(45 24 24)" fill="url(#gI)" opacity="0.9" />
          </svg>
        </div>
        <span style={{ fontSize: '30px', fontWeight: 700, background: 'linear-gradient(90deg, #ffffff 30%, #22d3ee 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', letterSpacing: '0.12em' }}>
          RIFT
        </span>
      </div>

      {/* Glass Command Box */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        style={{
          width: '100%',
          background: 'rgba(15,23,42,0.55)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: isDragOver
            ? '1px solid rgba(6,182,212,0.85)'
            : isUploading
            ? '1px solid rgba(6,182,212,0.6)'
            : '1px solid rgba(6,182,212,0.3)',
          borderRadius: '20px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          boxShadow: isDragOver
            ? '0 0 40px rgba(6,182,212,0.4), inset 0 1px 0 0 rgba(255,255,255,0.15)'
            : '0 0 40px rgba(6,182,212,0.12), inset 0 1px 0 0 rgba(255,255,255,0.1)',
          transition: 'all 0.2s ease',
        }}
      >
        {/* Upload progress bar */}
        {isUploading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#38bdf8' }}>
              <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} />
              <span>
                {uploadProgress! < 50
                  ? 'Uploading PDF…'
                  : uploadProgress! < 90
                  ? 'Extracting layout & vector bounding boxes…'
                  : 'Finalising neural index…'}
              </span>
              <span style={{ marginLeft: 'auto', fontWeight: 600 }}>{uploadProgress}%</span>
            </div>
            <div style={{ width: '100%', height: '3px', background: 'rgba(6,182,212,0.15)', borderRadius: '9999px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${uploadProgress}%`,
                  background: 'linear-gradient(90deg, #0ea5e9, #22d3ee)',
                  borderRadius: '9999px',
                  boxShadow: '0 0 8px rgba(34,211,238,0.6)',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        )}

        {/* Error banner */}
        {uploadError && (
          <div style={{ padding: '8px 12px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: '12px' }}>
            ⚠ {uploadError}
          </div>
        )}

        {/* Drag-over overlay hint */}
        {isDragOver && (
          <div style={{ textAlign: 'center', color: '#22d3ee', fontSize: '13px', fontWeight: 500, padding: '8px 0' }}>
            Drop PDF to upload
          </div>
        )}

        {/* Textarea */}
        {!isUploading && (
          <textarea
            ref={textareaRef}
            value={instructions}
            onChange={handleTextChange}
            placeholder="Write all Instructions… or drop a PDF below"
            rows={3}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#e0f2fe',
              fontSize: '15px',
              fontFamily: 'inherit',
              resize: 'none',
              lineHeight: 1.6,
            }}
          />
        )}

        {/* Bottom Row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: '12px',
            borderTop: '1px solid rgba(56,189,248,0.15)',
          }}
        >
          {/* Upload button */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              accept="application/pdf"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              multiple
            />
            <button
              type="button"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '8px 18px',
                borderRadius: '9999px',
                border: '1px solid rgba(6,182,212,0.4)',
                background: isUploading ? 'rgba(6,182,212,0.04)' : 'rgba(6,182,212,0.08)',
                color: isUploading ? '#475569' : '#67e8f9',
                fontSize: '13px',
                fontWeight: 500,
                cursor: isUploading ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (!isUploading) {
                  e.currentTarget.style.background = 'rgba(6,182,212,0.2)'
                  e.currentTarget.style.borderColor = 'rgba(6,182,212,0.7)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isUploading ? 'rgba(6,182,212,0.04)' : 'rgba(6,182,212,0.08)'
                e.currentTarget.style.borderColor = 'rgba(6,182,212,0.4)'
              }}
            >
              <Upload size={15} />
              <span>+ Upload the pdf/pdfs</span>
            </button>
          </div>

          {/* Mic orb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {isRecording && (
              <div style={{ position: 'relative', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div className="halo-ring" style={{ position: 'absolute', inset: '-5px', borderRadius: '50%', border: '1.5px solid rgba(34,211,238,0.5)', pointerEvents: 'none' }} />
                <div className="halo-ring halo-ring-outer" style={{ position: 'absolute', inset: '-12px', borderRadius: '50%', border: '1px solid rgba(34,211,238,0.25)', pointerEvents: 'none' }} />
              </div>
            )}
            <button
              type="button"
              onClick={() => setIsRecording(!isRecording)}
              title={isRecording ? 'Stop recording' : 'Voice instructions'}
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: isRecording ? 'linear-gradient(135deg, #0ea5e9, #06b6d4)' : 'linear-gradient(135deg, rgba(37,99,235,0.3), rgba(6,182,212,0.3))',
                border: isRecording ? 'none' : '1.5px solid rgba(6,182,212,0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: isRecording ? '0 0 24px rgba(34,211,238,0.7)' : '0 0 10px rgba(6,182,212,0.15)',
                transition: 'all 0.2s ease',
              }}
            >
              <Mic size={20} color="#ffffff" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
