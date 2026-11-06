import { GlassTranscriptPanel } from '../glass/GlassTranscriptPanel'
import { type StoredDocument } from '../../context/DocumentContext'

interface Props {
  doc?: StoredDocument | null
  activeParagraphIdx: number
  onBlockClick: (idx: number) => void
  isDictating: boolean
  onDictationChange: (val: boolean) => void
}

export function TranscriptPanel({
  doc = null,
  activeParagraphIdx,
  onBlockClick,
  isDictating,
  onDictationChange,
}: Props) {
  return (
    <GlassTranscriptPanel
      doc={doc}
      activeParagraphIdx={activeParagraphIdx}
      onBlockClick={onBlockClick}
      isDictating={isDictating}
      onDictationChange={onDictationChange}
    />
  )
}
