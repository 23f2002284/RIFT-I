import { useState } from 'react'
import { ThemeProvider, useTheme } from './context/ThemeContext'
import { DocumentProvider, useDocuments } from './context/DocumentContext'
import { ThemeSwitcher } from './components/ThemeSwitcher'
import { LibraryPage } from './pages/LibraryPage'
import { ReaderPage } from './pages/ReaderPage'
import { GlassLibraryPage } from './pages/glass/GlassLibraryPage'
import { GlassReaderPage } from './pages/glass/GlassReaderPage'

function AppInner() {
  const [view, setView] = useState<'library' | 'reader'>('library')
  const { theme } = useTheme()
  const { activeDoc, setActiveDocId, addDocumentFromFile } = useDocuments()

  const enterWorkspace = async (docId?: string) => {
    if (docId) setActiveDocId(docId)
    setView('reader')
  }

  const goBack = () => {
    setView('library')
  }

  if (view === 'library') {
    return theme === 'glass' ? (
      <GlassLibraryPage
        onEnterWorkspace={enterWorkspace}
        onUploadFile={addDocumentFromFile}
      />
    ) : (
      <LibraryPage onEnterWorkspace={(title) => {
        setView('reader')
        if (title) {/* legacy path: title-only */}
      }} />
    )
  }

  return theme === 'glass' ? (
    <GlassReaderPage
      doc={activeDoc}
      onBack={goBack}
    />
  ) : (
    <ReaderPage
      docTitle={activeDoc?.title ?? 'Document'}
      doc={activeDoc}
      onBack={goBack}
    />
  )
}

export default function App() {
  return (
    <DocumentProvider>
      <ThemeProvider>
        <ThemeSwitcher />
        <AppInner />
      </ThemeProvider>
    </DocumentProvider>
  )
}
