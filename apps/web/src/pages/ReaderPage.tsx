import { useState } from 'react'
import { LeftNav } from '../components/workspace/LeftNav'
import { PdfViewer } from '../components/workspace/PdfViewer'
import { TranscriptPanel } from '../components/workspace/TranscriptPanel'
import { ChatPanel } from '../components/workspace/ChatPanel'
import { mockBBoxes } from '../data/mockData'
import { type StoredDocument } from '../context/DocumentContext'

interface Props {
  docTitle: string
  doc?: StoredDocument | null
  onBack: () => void
}

export function ReaderPage({ docTitle: _docTitle, doc = null, onBack }: Props) {
  const [activeParagraphIdx, setActiveParagraphIdx] = useState(0)
  const [isDictating, setIsDictating] = useState(false)

  const handleBBoxClick = (idx: number) => setActiveParagraphIdx(idx)
  const handleBlockClick = (idx: number) => setActiveParagraphIdx(idx)
  const handleChatStart = () => setIsDictating(false)

  const handleCitationClick = (bboxId: string) => {
    const bbox = (doc?.bboxes ?? mockBBoxes).find((b) => b.id === bboxId)
    if (bbox) setActiveParagraphIdx(bbox.paragraphIdx)
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#020617' }}>
      {/* Slim left nav */}
      <LeftNav onHome={onBack} />

      {/* PDF Viewer ~55% */}
      <div style={{ flex: '0 0 55%', display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(56, 189, 248, 0.16)' }}>
        <PdfViewer activeParagraphIdx={activeParagraphIdx} onBBoxClick={handleBBoxClick} />
      </div>

      {/* Right column: Transcript top + Chat bottom */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{ flex: '0 0 50%', display: 'flex', flexDirection: 'column', borderBottom: '1px solid rgba(56, 189, 248, 0.16)' }}>
          <TranscriptPanel
            doc={doc}
            activeParagraphIdx={activeParagraphIdx}
            onBlockClick={handleBlockClick}
            isDictating={isDictating}
            onDictationChange={setIsDictating}
          />
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <ChatPanel onCitationClick={handleCitationClick} onActivityStart={handleChatStart} />
        </div>
      </div>
    </div>
  )
}
