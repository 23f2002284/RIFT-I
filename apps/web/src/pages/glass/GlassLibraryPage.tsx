import { useState } from 'react'
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels'
import { GlassHistorySidebar } from '../../components/glass/GlassHistorySidebar'
import { GlassPromptBox } from '../../components/glass/GlassPromptBox'
import { type StoredDocument } from '../../context/DocumentContext'

interface Props {
  onEnterWorkspace: (docId?: string) => void
  onUploadFile: (file: File, onProgress?: (pct: number) => void) => Promise<StoredDocument>
}

/** Holographic resize handle — vertical divider */
function VertHandle() {
  return (
    <PanelResizeHandle
      style={{
        width: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'col-resize',
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      <div
        style={{
          width: '3px',
          height: '48px',
          borderRadius: '9999px',
          background: 'rgba(34,211,238,0.22)',
          transition: 'background 0.15s ease, box-shadow 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(34,211,238,0.75)'
          e.currentTarget.style.boxShadow = '0 0 10px rgba(34,211,238,0.5)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(34,211,238,0.22)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      />
    </PanelResizeHandle>
  )
}

export function GlassLibraryPage({ onEnterWorkspace, onUploadFile }: Props) {
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const handleUpload = async (files: FileList) => {
    const file = files[0]
    if (!file) return
    setUploadError(null)
    setUploadProgress(0)
    try {
      const doc = await onUploadFile(file, (pct) => setUploadProgress(pct))
      setUploadProgress(null)
      onEnterWorkspace(doc.id)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
      setUploadProgress(null)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        background: '#020617',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Aurora orbs */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div className="aurora-orb aurora-orb-1" style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.35) 0%, transparent 70%)', filter: 'blur(80px)', top: '-10%', left: '20%' }} />
        <div className="aurora-orb aurora-orb-2" style={{ position: 'absolute', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.3) 0%, transparent 70%)', filter: 'blur(100px)', bottom: '-15%', right: '10%' }} />
        <div className="aurora-orb aurora-orb-3" style={{ position: 'absolute', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.4) 0%, transparent 70%)', filter: 'blur(70px)', top: '40%', left: '50%' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(56,189,248,0.06) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      </div>

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', width: '100%', height: '100%', padding: '12px' }}>
        <PanelGroup direction="horizontal" style={{ width: '100%', height: '100%' }}>
          {/* Left sidebar — resizable 28% default, 18–45% range */}
          <Panel defaultSize={28} minSize={18} maxSize={45}>
            <GlassHistorySidebar
              onSelect={(doc) => onEnterWorkspace(doc.id)}
            />
          </Panel>

          <VertHandle />

          {/* Center main */}
          <Panel>
            <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 48px' }}>
              <GlassPromptBox
                onUpload={handleUpload}
                uploadProgress={uploadProgress}
                uploadError={uploadError}
              />
            </div>
          </Panel>
        </PanelGroup>
      </div>
    </div>
  )
}
