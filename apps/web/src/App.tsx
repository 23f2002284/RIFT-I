import { useState } from 'react'
import { ThemeProvider } from './context/ThemeContext'
import { DocumentProvider, useDocuments } from './context/DocumentContext'
import { GlassLibraryPage } from './pages/glass/GlassLibraryPage'
import { GlassReaderPage } from './pages/glass/GlassReaderPage'

function AppInner() {
  const [view, setView] = useState<'library' | 'reader'>('library')
  const { activeDoc, setActiveDocId, addDocumentFromFile } = useDocuments()

  const enterWorkspace = async (docId?: string) => {
    if (docId) setActiveDocId(docId)
    setView('reader')
  }

  const goBack = () => {
    setView('library')
  }

  if (view === 'library') {
    return (
      <GlassLibraryPage
        onEnterWorkspace={enterWorkspace}
        onUploadFile={addDocumentFromFile}
      />
    )
  }

  return (
    <GlassReaderPage
      doc={activeDoc}
      onBack={goBack}
    />
  )
}

export default function App() {
  return (
    <DocumentProvider>
      <ThemeProvider>
        <AppInner />
      </ThemeProvider>
    </DocumentProvider>
  )
}
