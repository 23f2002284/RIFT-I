import { HistorySidebar } from '../components/homepage/HistorySidebar'
import { PromptBox } from '../components/homepage/PromptBox'
import { useDocuments } from '../context/DocumentContext'

interface Props {
  onEnterWorkspace: (docTitle?: string) => void
}

export function LibraryPage({ onEnterWorkspace }: Props) {
  const { setActiveDocId, addDocumentFromFile } = useDocuments()

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0d0d0d', overflow: 'hidden' }}>
      {/* Left sidebar 30% */}
      <div style={{ width: '30%', flexShrink: 0, height: '100%' }}>
        <HistorySidebar onSelect={(doc) => {
          setActiveDocId(doc.id)
          onEnterWorkspace(doc.title)
        }} />
      </div>
      {/* Center main */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 60px',
          height: '100%',
        }}
      >
        <PromptBox onUpload={async (files) => {
          if (files && files[0]) {
            try {
              const doc = await addDocumentFromFile(files[0])
              setActiveDocId(doc.id)
              onEnterWorkspace(doc.title)
            } catch {
              onEnterWorkspace()
            }
          } else {
            onEnterWorkspace()
          }
        }} />
      </div>
    </div>
  )
}
