/**
 * DocumentContext — global store for uploaded PDFs.
 * Handles: upload → pdf.js extraction → thumbnail → history state.
 */
import {
  createContext, useContext, useState, useCallback, useEffect,
  type ReactNode,
} from 'react'
import * as pdfjsLib from 'pdfjs-dist'

// Point worker at the bundled copy Vite copies to dist/
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString()

export interface ExtractedParagraph {
  id: string
  text: string
  bboxId: string
  pageIndex: number
}

export interface ExtractedBBox {
  id: string
  x: number       // % of page width
  y: number       // % of page height
  width: number
  height: number
  paragraphIdx: number
  pageIndex: number
}

export interface StoredDocument {
  id: string
  title: string
  pageCount: number
  uploadedAt: string
  size: number                    // bytes
  thumbnail: string | null        // base64 PNG of page 1
  paragraphs: ExtractedParagraph[]
  bboxes: ExtractedBBox[]
  pdfUrl: string | null           // object URL for pdf.js rendering
  apiId?: string                  // id from backend if upload succeeds
}

interface DocumentContextValue {
  documents: StoredDocument[]
  activeDocId: string | null
  activeDoc: StoredDocument | null
  setActiveDocId: (id: string | null) => void
  addDocumentFromFile: (file: File, onProgress?: (pct: number) => void) => Promise<StoredDocument>
  removeDocument: (id: string) => void
  isLoading: boolean
  loadError: string | null
}

const DocumentContext = createContext<DocumentContextValue>({
  documents: [],
  activeDocId: null,
  activeDoc: null,
  setActiveDocId: () => {},
  addDocumentFromFile: async () => { throw new Error('no provider') },
  removeDocument: () => {},
  isLoading: false,
  loadError: null,
})

/* ── Helpers ── */

const STORAGE_KEY = 'rift_stored_documents_v2'

function loadLocalDocuments(): StoredDocument[] {
  try {
    // Clean up older buggy cache keys if present
    localStorage.removeItem('rift_stored_documents_v1')

    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as StoredDocument[]
    if (Array.isArray(parsed)) {
      // Validate that paragraphs have non-empty text; filter out empty fragments
      return parsed.map((doc) => {
        const cleanedParagraphs = (doc.paragraphs ?? []).filter(
          (p) => typeof p.text === 'string' && p.text.trim().length > 0
        )
        const hasValidText = cleanedParagraphs.length > 0

        if (!hasValidText) {
          return { ...doc, paragraphs: [], bboxes: [] }
        }
        return { ...doc, paragraphs: cleanedParagraphs }
      })
    }
  } catch (e) {
    console.warn('Failed to load documents from localStorage:', e)
  }
  return []
}

function saveLocalDocuments(docs: StoredDocument[]) {
  try {
    const serializable = docs.map((d) => ({
      ...d,
      pdfUrl: d.pdfUrl && d.pdfUrl.startsWith('blob:') ? null : d.pdfUrl,
    }))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable))
  } catch (e) {
    console.warn('Failed to save documents to localStorage:', e)
  }
}

/** Render page 1 of a PDF to a lightweight base64 JPEG thumbnail */
async function extractThumbnail(pdf: pdfjsLib.PDFDocumentProxy): Promise<string> {
  const page = await pdf.getPage(1)
  const scale = 0.35
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height
  const ctx = canvas.getContext('2d')!
  await page.render({ canvasContext: ctx, viewport, canvas }).promise
  return canvas.toDataURL('image/jpeg', 0.8)
}

/** Extract text items from all pages and build paragraph + bbox arrays */
async function extractContent(pdf: pdfjsLib.PDFDocumentProxy): Promise<{
  paragraphs: ExtractedParagraph[]
  bboxes: ExtractedBBox[]
}> {
  const paragraphs: ExtractedParagraph[] = []
  const bboxes: ExtractedBBox[] = []

  for (let pageIdx = 0; pageIdx < Math.min(pdf.numPages, 25); pageIdx++) {
    const page = await pdf.getPage(pageIdx + 1)
    const viewport = page.getViewport({ scale: 1.0 })
    const textContent = await page.getTextContent()

    interface RawItem {
      str: string
      left: number
      top: number
      right: number
      bottom: number
      fontHeight: number
      baseline: number
    }

    const rawItems: RawItem[] = []
    for (const item of textContent.items) {
      if (!('str' in item) || !item.str.trim()) continue
      const tx = pdfjsLib.Util.transform(viewport.transform, item.transform)
      const fontHeight = Math.abs(tx[3]) || item.height || 12
      const left = tx[4]
      const baseline = tx[5]
      // In PDF.js viewport coordinates (0, 0 is top-left), baseline is tx[5].
      // Text rises upward from the baseline to (baseline - fontHeight).
      const top = baseline - fontHeight
      const bottom = baseline + fontHeight * 0.18
      const width = item.width || fontHeight * item.str.length * 0.55
      const right = left + width
      rawItems.push({ str: item.str, left, top, right, bottom, fontHeight, baseline })
    }

    if (rawItems.length === 0) continue

    // 1. Sort items top-to-bottom, then left-to-right
    rawItems.sort((a, b) => a.top - b.top || a.left - b.left)

    // 2. Group items that share the same baseline into visual lines
    interface TextLine {
      text: string
      left: number
      top: number
      right: number
      bottom: number
      fontHeight: number
      baseline: number
    }

    const lines: TextLine[] = []
    let currentLineItems: RawItem[] = []

    for (const item of rawItems) {
      if (currentLineItems.length === 0) {
        currentLineItems.push(item)
        continue
      }
      const prev = currentLineItems[currentLineItems.length - 1]
      const baselineDiff = Math.abs(item.baseline - prev.baseline)
      const isSameLine = baselineDiff < Math.min(item.fontHeight, prev.fontHeight) * 0.45

      if (isSameLine) {
        currentLineItems.push(item)
      } else {
        currentLineItems.sort((a, b) => a.left - b.left)
        const lineText = currentLineItems.map((i) => i.str).join(' ').replace(/\s+/g, ' ').trim()
        if (lineText) {
          lines.push({
            text: lineText,
            left: Math.min(...currentLineItems.map((i) => i.left)),
            top: Math.min(...currentLineItems.map((i) => i.top)),
            right: Math.max(...currentLineItems.map((i) => i.right)),
            bottom: Math.max(...currentLineItems.map((i) => i.bottom)),
            fontHeight: Math.max(...currentLineItems.map((i) => i.fontHeight)),
            baseline: currentLineItems[0].baseline,
          })
        }
        currentLineItems = [item]
      }
    }

    if (currentLineItems.length > 0) {
      currentLineItems.sort((a, b) => a.left - b.left)
      const lineText = currentLineItems.map((i) => i.str).join(' ').replace(/\s+/g, ' ').trim()
      if (lineText) {
        lines.push({
          text: lineText,
          left: Math.min(...currentLineItems.map((i) => i.left)),
          top: Math.min(...currentLineItems.map((i) => i.top)),
          right: Math.max(...currentLineItems.map((i) => i.right)),
          bottom: Math.max(...currentLineItems.map((i) => i.bottom)),
          fontHeight: Math.max(...currentLineItems.map((i) => i.fontHeight)),
          baseline: currentLineItems[0].baseline,
        })
      }
    }

    // 3. Group visual lines into coherent paragraphs
    const paragraphGroups: TextLine[][] = []
    let curGroup: TextLine[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (curGroup.length === 0) {
        curGroup.push(line)
        continue
      }
      const lastLine = curGroup[curGroup.length - 1]
      const verticalGap = line.top - lastLine.bottom
      const avgFontHeight = (line.fontHeight + lastLine.fontHeight) / 2

      // Paragraph break conditions:
      // - Gap is wider than normal line spacing
      const isLargeGap = verticalGap > avgFontHeight * 0.75
      // - Font size changes significantly (e.g. heading vs body)
      const isFontChange = Math.abs(line.fontHeight - lastLine.fontHeight) > 3.5
      // - Sentence ends and is followed by substantial gap or paragraph length reached
      const endsSentence = /[.:?!]$/.test(lastLine.text.trim())
      const isNewSentenceBlock = endsSentence && verticalGap > avgFontHeight * 0.4
      const isTooLong = curGroup.map((l) => l.text).join(' ').length > 350 && endsSentence

      if (isLargeGap || isFontChange || isNewSentenceBlock || isTooLong) {
        paragraphGroups.push(curGroup)
        curGroup = [line]
      } else {
        curGroup.push(line)
      }
    }
    if (curGroup.length > 0) {
      paragraphGroups.push(curGroup)
    }

    // 4. Calculate exact, tight normalized bounding boxes
    for (const group of paragraphGroups) {
      const text = group.map((l) => l.text).join(' ').replace(/\s+/g, ' ').trim()
      if (text.length < 3) continue // skip microscopic fragments

      const pIdx = paragraphs.length
      const bboxId = `bbox-p${pageIdx}-${pIdx}`
      const pid = `p-${pageIdx}-${pIdx}`

      // Bounding box with a 2px padding buffer for visual breathing room
      const minX = Math.max(0, Math.min(...group.map((l) => l.left)) - 3)
      const minY = Math.max(0, Math.min(...group.map((l) => l.top)) - 2)
      const maxX = Math.min(viewport.width, Math.max(...group.map((l) => l.right)) + 3)
      const maxY = Math.min(viewport.height, Math.max(...group.map((l) => l.bottom)) + 2)

      const boxWidth = maxX - minX
      const boxHeight = maxY - minY
      if (boxWidth <= 0 || boxHeight <= 0) continue

      paragraphs.push({ id: pid, text, bboxId, pageIndex: pageIdx })
      bboxes.push({
        id: bboxId,
        x: Math.max(0, Math.min(100, (minX / viewport.width) * 100)),
        y: Math.max(0, Math.min(100, (minY / viewport.height) * 100)),
        width: Math.max(0.5, Math.min(100, (boxWidth / viewport.width) * 100)),
        height: Math.max(0.5, Math.min(100, (boxHeight / viewport.height) * 100)),
        paragraphIdx: pIdx,
        pageIndex: pageIdx,
      })
    }
  }

  return { paragraphs, bboxes }
}

/* ── Provider ── */
export function DocumentProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState<StoredDocument[]>(() => loadLocalDocuments())
  const [activeDocId, setActiveDocId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  const activeDoc = documents.find((d) => d.id === activeDocId) ?? null

  // Helper to ensure a document's PDF stream / URL is loaded and content extracted
  const ensurePdfLoaded = useCallback(async (targetDoc: StoredDocument): Promise<StoredDocument> => {
    let pdfUrl = targetDoc.pdfUrl

    // If PDF url is missing and we have apiId, get fresh signed URL from backend
    if (!pdfUrl && targetDoc.apiId) {
      try {
        const { getDocumentUrl } = await import('../api/documents')
        pdfUrl = await getDocumentUrl(targetDoc.apiId)
        targetDoc.pdfUrl = pdfUrl
      } catch (err) {
        console.warn('Failed to load PDF URL from backend:', err)
      }
    }

    const hasValidParagraphs =
      Boolean(targetDoc.paragraphs &&
      targetDoc.paragraphs.length > 0 &&
      targetDoc.paragraphs.some((p) => typeof p.text === 'string' && p.text.trim().length > 0))

    // If thumbnail or valid paragraphs with actual text are missing, extract them freshly
    if (pdfUrl && (!targetDoc.thumbnail || !hasValidParagraphs)) {
      try {
        const pdf = await pdfjsLib.getDocument({ url: pdfUrl }).promise
        const [thumbnail, content] = await Promise.all([
          targetDoc.thumbnail ? Promise.resolve(targetDoc.thumbnail) : extractThumbnail(pdf),
          extractContent(pdf),
        ])
        targetDoc.thumbnail = thumbnail
        targetDoc.paragraphs = content.paragraphs
        targetDoc.bboxes = content.bboxes
        targetDoc.pageCount = pdf.numPages

        setDocuments((prev) => {
          const updated = prev.map((d) => (d.id === targetDoc.id ? { ...targetDoc } : d))
          saveLocalDocuments(updated)
          return updated
        })
      } catch (err) {
        console.warn('Failed to extract content in ensurePdfLoaded:', err)
      }
    } else if (pdfUrl && targetDoc.pdfUrl !== pdfUrl) {
      setDocuments((prev) => {
        const updated = prev.map((d) => (d.id === targetDoc.id ? { ...targetDoc } : d))
        saveLocalDocuments(updated)
        return updated
      })
    }

    return targetDoc
  }, [])

  // Sync with backend on startup
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { fetchDocuments } = await import('../api/documents')
        const backendDocs = await fetchDocuments()
        if (cancelled || !backendDocs || backendDocs.length === 0) return

        setDocuments((currentDocs) => {
          const merged = [...currentDocs]
          for (const bDoc of backendDocs) {
            const existing = merged.find(
              (d) => d.apiId === bDoc.id || d.title === bDoc.filename
            )
            if (existing) {
              existing.apiId = bDoc.id
              if (!existing.pageCount && bDoc.page_count) existing.pageCount = bDoc.page_count
            } else {
              merged.push({
                id: `doc-${bDoc.id}`,
                apiId: bDoc.id,
                title: bDoc.filename,
                pageCount: bDoc.page_count || 1,
                uploadedAt: bDoc.created_at,
                size: bDoc.file_size || 0,
                thumbnail: null,
                paragraphs: [],
                bboxes: [],
                pdfUrl: null,
              })
            }
          }
          saveLocalDocuments(merged)
          return merged
        })
      } catch {
        // Backend offline — local documents still function smoothly
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  // Ensure the active document always loads its PDF and extracted paragraphs
  useEffect(() => {
    if (!activeDocId) return
    const doc = documents.find((d) => d.id === activeDocId)
    if (!doc) return

    const hasValidParagraphs = Boolean(
      doc.paragraphs &&
      doc.paragraphs.length > 0 &&
      doc.paragraphs.some((p) => typeof p.text === 'string' && p.text.trim().length > 0)
    )

    if (!doc.pdfUrl || !hasValidParagraphs) {
      ensurePdfLoaded(doc)
    }
  }, [activeDocId, documents, ensurePdfLoaded])

  // Custom setActiveDocId that automatically loads PDF if URL expired
  const handleSetActiveDocId = useCallback(
    (id: string | null) => {
      setActiveDocId(id)
      if (id) {
        setDocuments((prev) => {
          const target = prev.find((d) => d.id === id)
          if (target) {
            const hasValid = Boolean(
              target.paragraphs &&
              target.paragraphs.length > 0 &&
              target.paragraphs.some((p) => typeof p.text === 'string' && p.text.trim().length > 0)
            )
            if (!target.pdfUrl || !hasValid) {
              ensurePdfLoaded(target)
            }
          }
          return prev
        })
      }
    },
    [ensurePdfLoaded]
  )

  const addDocumentFromFile = useCallback(
    async (file: File, onProgress?: (pct: number) => void): Promise<StoredDocument> => {
      setIsLoading(true)
      setLoadError(null)

      try {
        const pdfUrl = URL.createObjectURL(file)
        const arrayBuf = await file.arrayBuffer()
        const pdf = await pdfjsLib.getDocument({ data: arrayBuf }).promise

        const [thumbnail, { paragraphs, bboxes }] = await Promise.all([
          extractThumbnail(pdf),
          extractContent(pdf),
        ])

        const doc: StoredDocument = {
          id: `doc-${Date.now()}`,
          title: file.name,
          pageCount: pdf.numPages,
          uploadedAt: new Date().toISOString(),
          size: file.size,
          thumbnail,
          paragraphs,
          bboxes,
          pdfUrl,
        }

        // Try uploading to backend
        try {
          const { uploadDocument } = await import('../api/documents')
          const apiDoc = await uploadDocument(file, onProgress)
          doc.apiId = apiDoc.id
        } catch {
          // Backend offline — continue in local mode
        }

        setDocuments((prev) => {
          const next = [doc, ...prev.filter((d) => d.title !== doc.title)]
          saveLocalDocuments(next)
          return next
        })
        return doc
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to process PDF'
        setLoadError(msg)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const removeDocument = useCallback(
    (id: string) => {
      setDocuments((prev) => {
        const doc = prev.find((d) => d.id === id)
        if (doc?.pdfUrl && doc.pdfUrl.startsWith('blob:')) {
          URL.revokeObjectURL(doc.pdfUrl)
        }
        if (doc?.apiId) {
          import('../api/documents').then(({ deleteDocument }) => {
            deleteDocument(doc.apiId!).catch(() => {})
          })
        }
        const next = prev.filter((d) => d.id !== id)
        saveLocalDocuments(next)
        return next
      })
      if (activeDocId === id) setActiveDocId(null)
    },
    [activeDocId]
  )

  return (
    <DocumentContext.Provider
      value={{
        documents,
        activeDocId,
        activeDoc,
        setActiveDocId: handleSetActiveDocId,
        addDocumentFromFile,
        removeDocument,
        isLoading,
        loadError,
      }}
    >
      {children}
    </DocumentContext.Provider>
  )
}

export function useDocuments() {
  return useContext(DocumentContext)
}

