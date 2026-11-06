import { useEffect } from 'react'
import { Routes, Route, useNavigate, useParams } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { DocumentProvider, useDocuments } from './context/DocumentContext'
import { GlassLibraryPage } from './pages/glass/GlassLibraryPage'
import { GlassReaderPage } from './pages/glass/GlassReaderPage'

/** Library route — "/" */
function LibraryRoute() {
  const navigate = useNavigate()
  const { setActiveDocId, addDocumentFromFile } = useDocuments()

  const enterWorkspace = async (docId?: string) => {
    if (docId) {
      setActiveDocId(docId)
      navigate(`/reader/${docId}/page/1`)
    }
  }

  return (
    <GlassLibraryPage
      onEnterWorkspace={enterWorkspace}
      onUploadFile={addDocumentFromFile}
    />
  )
}

/** Reader route — "/reader/:docId/page/:page" */
function ReaderRoute() {
  const navigate = useNavigate()
  const { docId, page } = useParams<{ docId: string; page: string }>()
  const { setActiveDocId, activeDoc } = useDocuments()

  // Sync activeDocId from URL cleanly via useEffect
  useEffect(() => {
    if (docId) {
      setActiveDocId(docId)
    }
  }, [docId, setActiveDocId])

  const initialPage = Math.max(1, parseInt(page ?? '1', 10) || 1)

  const handlePageChange = (newPage: number) => {
    navigate(`/reader/${docId}/page/${newPage}`, { replace: true })
  }

  const goBack = () => navigate('/')

  return (
    <GlassReaderPage
      doc={activeDoc}
      initialPage={initialPage}
      onPageChange={handlePageChange}
      onBack={goBack}
    />
  )
}

function AppInner() {
  return (
    <Routes>
      <Route path="/" element={<LibraryRoute />} />
      <Route path="/reader/:docId/page/:page" element={<ReaderRoute />} />
      {/* Redirect bare /reader/:docId → page 1 */}
      <Route path="/reader/:docId" element={<ReaderRoute />} />
    </Routes>
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
