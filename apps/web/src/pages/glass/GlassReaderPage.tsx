import { useState } from 'react'
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels'
import { GlassLeftNav } from '../../components/glass/GlassLeftNav'
import { GlassPdfViewer } from '../../components/glass/GlassPdfViewer'
import { GlassTranscriptPanel } from '../../components/glass/GlassTranscriptPanel'
import { GlassChatPanel } from '../../components/glass/GlassChatPanel'
import { type StoredDocument } from '../../context/DocumentContext'

interface Props {
  doc: StoredDocument | null
  onBack: () => void
}

/** Holographic vertical resize handle */
function VertHandle({ onDoubleClick }: { onDoubleClick?: () => void }) {
  return (
    <PanelResizeHandle
      onDoubleClick={onDoubleClick}
      style={{ width: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'col-resize', flexShrink: 0 }}
    >
      <div
        style={{ width: '3px', height: '48px', borderRadius: '9999px', background: 'rgba(34,211,238,0.2)', transition: 'all 0.15s ease' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(34,211,238,0.75)'; e.currentTarget.style.boxShadow = '0 0 10px rgba(34,211,238,0.5)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(34,211,238,0.2)'; e.currentTarget.style.boxShadow = 'none' }}
      />
    </PanelResizeHandle>
  )
}

/** Holographic horizontal resize handle */
function HorizHandle({ onDoubleClick }: { onDoubleClick?: () => void }) {
  return (
    <PanelResizeHandle
      onDoubleClick={onDoubleClick}
      style={{ height: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'row-resize', flexShrink: 0 }}
    >
      <div
        style={{ height: '3px', width: '48px', borderRadius: '9999px', background: 'rgba(34,211,238,0.2)', transition: 'all 0.15s ease' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(34,211,238,0.75)'; e.currentTarget.style.boxShadow = '0 0 10px rgba(34,211,238,0.5)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(34,211,238,0.2)'; e.currentTarget.style.boxShadow = 'none' }}
      />
    </PanelResizeHandle>
  )
}

export function GlassReaderPage({ doc, onBack }: Props) {
  const [activeParagraphIdx, setActiveParagraphIdx] = useState(0)
  const [isDictating, setIsDictating] = useState(false)

  const handleBBoxClick    = (idx: number) => setActiveParagraphIdx(idx)
  const handleBlockClick   = (idx: number) => setActiveParagraphIdx(idx)
  const handleChatStart    = () => setIsDictating(false)

  const handleCitationClick = (bboxId: string) => {
    const bboxes = doc?.bboxes ?? []
    const idx = bboxes.findIndex((b) => b.id === bboxId)
    if (idx >= 0) setActiveParagraphIdx(bboxes[idx].paragraphIdx)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#020617', position: 'relative' }}>

      {/* Aurora background */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div className="aurora-orb aurora-orb-1" style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%)', filter: 'blur(80px)', top: '-10%', left: '30%' }} />
        <div className="aurora-orb aurora-orb-2" style={{ position: 'absolute', width: '450px', height: '450px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)', filter: 'blur(100px)', bottom: '-10%', right: '5%' }} />
        <div className="aurora-orb aurora-orb-3" style={{ position: 'absolute', width: '350px', height: '350px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(79,70,229,0.18) 0%, transparent 70%)', filter: 'blur(70px)', top: '50%', left: '55%' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(56,189,248,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
      </div>

      {/* Content layer */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', width: '100%', height: '100%', padding: '10px', gap: '0' }}>

        {/* Slim left nav */}
        <GlassLeftNav onHome={onBack} />

        {/* Resizable panels */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', paddingLeft: '8px' }}>
          <PanelGroup direction="horizontal" style={{ width: '100%', height: '100%' }}>

            {/* PDF Viewer — default 55%, 30–75% */}
            <Panel defaultSize={55} minSize={30} maxSize={75}>
              <GlassPdfViewer
                doc={doc}
                activeParagraphIdx={activeParagraphIdx}
                onBBoxClick={handleBBoxClick}
              />
            </Panel>

            <VertHandle />

            {/* Right column: Transcript + Chat */}
            <Panel defaultSize={45} minSize={25} maxSize={70}>
              <PanelGroup direction="vertical" style={{ height: '100%' }}>

                {/* Transcript — top 50%, 20–80% */}
                <Panel defaultSize={50} minSize={20} maxSize={80}>
                  <GlassTranscriptPanel
                    doc={doc}
                    activeParagraphIdx={activeParagraphIdx}
                    onBlockClick={handleBlockClick}
                    isDictating={isDictating}
                    onDictationChange={setIsDictating}
                  />
                </Panel>

                <HorizHandle />

                {/* Chat — bottom */}
                <Panel defaultSize={50} minSize={20} maxSize={80}>
                  <GlassChatPanel
                    doc={doc}
                    onCitationClick={handleCitationClick}
                    onActivityStart={handleChatStart}
                  />
                </Panel>

              </PanelGroup>
            </Panel>

          </PanelGroup>
        </div>
      </div>
    </div>
  )
}
