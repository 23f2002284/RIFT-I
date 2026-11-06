import { useCallback, useState } from 'react'
import { uploadDocument, type Document } from '../api/documents'

interface Props {
  onUploaded: (doc: Document) => void
}

export function UploadZone({ onUploaded }: Props) {
  const [dragging, setDragging] = useState(false)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.name.toLowerCase().endsWith('.pdf')) {
        setError('Only PDF files are allowed.')
        return
      }
      setError(null)
      setProgress(0)
      try {
        const doc = await uploadDocument(file, setProgress)
        onUploaded(doc)
      } catch (e: any) {
        setError(e.message ?? 'Upload failed')
      } finally {
        setProgress(null)
      }
    },
    [onUploaded],
  )

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    e.target.value = ''
  }

  return (
    <div className="mb-10">
      <label
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{
          display: 'block',
          border: `1.5px dashed ${dragging ? 'var(--accent)' : 'var(--border)'}`,
          borderRadius: '10px',
          padding: '48px 32px',
          textAlign: 'center',
          cursor: progress !== null ? 'not-allowed' : 'pointer',
          background: dragging ? 'rgba(124,106,247,0.04)' : 'var(--surface)',
          transition: 'all 150ms ease',
        }}
      >
        <input
          type="file"
          accept=".pdf"
          className="hidden"
          disabled={progress !== null}
          onChange={onInputChange}
        />

        {/* Icon */}
        <div style={{ fontSize: 32, marginBottom: 12 }}>
          {progress !== null ? '⏳' : '📄'}
        </div>

        {/* Label */}
        {progress === null ? (
          <>
            <p style={{ color: 'var(--text)', fontWeight: 500 }}>
              Drop PDF here or <span style={{ color: 'var(--accent)' }}>click to upload</span>
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 6 }}>
              Max 50 MB
            </p>
          </>
        ) : (
          <div style={{ maxWidth: 260, margin: '0 auto' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: 10, fontSize: 13 }}>
              Uploading… {progress}%
            </p>
            {/* Progress bar */}
            <div style={{
              height: 3,
              borderRadius: 2,
              background: 'var(--border)',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${progress}%`,
                background: 'var(--accent)',
                transition: 'width 150ms ease',
              }} />
            </div>
          </div>
        )}
      </label>

      {error && (
        <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 8, paddingLeft: 4 }}>
          {error}
        </p>
      )}
    </div>
  )
}

