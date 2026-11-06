import { useEffect, useRef, useState, useMemo } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import {
  MousePointer2,
  Hand,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Upload,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { type StoredDocument } from '../../context/DocumentContext'

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url,
).toString()

interface Props {
  doc: StoredDocument | null
  activeParagraphIdx: number
  onBBoxClick: (idx: number) => void
}

interface BBoxStyle {
  label: string
  border: string
  bg: string
  glow: string
  text: string
}

function getBBoxStyle(idx: number, isCovered: boolean): BBoxStyle {
  if (isCovered) {
    return {
      label: `Line #${idx + 1} · Completed`,
      border: 'rgba(16, 185, 129, 0.85)',
      bg: 'rgba(16, 185, 129, 0.18)',
      glow: '0 0 16px rgba(16, 185, 129, 0.45)',
      text: '#6ee7b7',
    }
  }

  return {
    label: `Line #${idx + 1}`,
    border: 'rgba(34, 211, 238, 0.85)',
    bg: 'rgba(6, 182, 212, 0.18)',
    glow: '0 0 18px rgba(6, 182, 212, 0.55)',
    text: '#67e8f9',
  }
}

function CornerBrackets({ color = 'rgba(34,211,238,0.9)' }: { color?: string }) {
  const size = 10, t = 2
  return (
    <>
      <div style={{ position: 'absolute', top: -t, left: -t, width: size, height: size, borderTop: `${t}px solid ${color}`, borderLeft: `${t}px solid ${color}`, borderRadius: '1px' }} />
      <div style={{ position: 'absolute', top: -t, right: -t, width: size, height: size, borderTop: `${t}px solid ${color}`, borderRight: `${t}px solid ${color}`, borderRadius: '1px' }} />
      <div style={{ position: 'absolute', bottom: -t, left: -t, width: size, height: size, borderBottom: `${t}px solid ${color}`, borderLeft: `${t}px solid ${color}`, borderRadius: '1px' }} />
      <div style={{ position: 'absolute', bottom: -t, right: -t, width: size, height: size, borderBottom: `${t}px solid ${color}`, borderRight: `${t}px solid ${color}`, borderRadius: '1px' }} />
    </>
  )
}

/** Renders a single PDF page onto a canvas and hosts overlays within exact canvas boundaries */
function PdfPageContainer({
  pdfUrl,
  pageNum,
  children,
}: {
  pdfUrl: string
  pageNum: number
  children?: React.ReactNode
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pageSize, setPageSize] = useState<{ width: number; height: number } | null>(null)
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading')

  useEffect(() => {
    let renderTask: any = null
    let cancelled = false
    setStatus('loading')
    ;(async () => {
      try {
        const pdf = await pdfjsLib.getDocument({ url: pdfUrl }).promise
        if (cancelled) return
        const page = await pdf.getPage(pageNum)
        if (cancelled) return
        const vp = page.getViewport({ scale: 1.0 })
        const canvas = canvasRef.current
        if (!canvas) return
        canvas.width = vp.width
        canvas.height = vp.height
        setPageSize({ width: vp.width, height: vp.height })
        const ctx = canvas.getContext('2d')!
        renderTask = page.render({ canvasContext: ctx, viewport: vp, canvas: canvas })
        await renderTask.promise
        if (!cancelled) setStatus('done')
      } catch (err: unknown) {
        if (!cancelled) {
          const isCancelled = err && typeof err === 'object' && 'name' in err && (err as { name: string }).name === 'RenderingCancelledException'
          if (!isCancelled) {
            console.error('PDF render error on page', pageNum, err)
            setStatus('error')
          }
        }
      }
    })()
    return () => {
      cancelled = true
      if (renderTask) {
        try {
          renderTask.cancel()
        } catch {
          // ignore
        }
      }
    }
  }, [pdfUrl, pageNum])

  return (
    <div
      style={{
        position: 'relative',
        display: 'inline-block',
        width: pageSize ? `${pageSize.width}px` : 'auto',
        height: pageSize ? `${pageSize.height}px` : 'auto',
        lineHeight: 0,
        borderRadius: '4px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
      }}
    >
      {status === 'loading' && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            background: 'rgba(2,6,23,0.7)',
            borderRadius: '4px',
            zIndex: 10,
            minWidth: '400px',
            minHeight: '550px',
          }}
        >
          <div
            className="scanline-sweep"
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.08), transparent)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              width: '36px',
              height: '36px',
              border: '2px solid rgba(6,182,212,0.3)',
              borderTopColor: '#22d3ee',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <span style={{ fontSize: '11px', color: '#38bdf8' }}>Extracting layout &amp; vector bounding boxes…</span>
        </div>
      )}
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          borderRadius: '4px',
          pointerEvents: 'auto',
        }}
      />
      {/* Overlays strictly inside the exact canvas boundary */}
      {status === 'done' && children}
    </div>
  )
}

/** Empty / no-document state */
function EmptyViewer({ onUploadClick }: { onUploadClick: () => void }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        padding: '40px',
      }}
    >
      <div
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '18px',
          background: 'rgba(6,182,212,0.07)',
          border: '1px solid rgba(6,182,212,0.22)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 24px rgba(6,182,212,0.12)',
        }}
      >
        <Upload size={28} color="rgba(34,211,238,0.5)" />
      </div>
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#e0f2fe', fontSize: '14px', fontWeight: 600, margin: 0 }}>No Document Loaded</p>
        <p style={{ color: '#475569', fontSize: '12px', marginTop: '6px' }}>Upload a PDF to begin reading</p>
      </div>
      <button
        type="button"
        onClick={onUploadClick}
        style={{
          padding: '9px 22px',
          borderRadius: '9999px',
          background: 'rgba(6,182,212,0.12)',
          border: '1px solid rgba(6,182,212,0.4)',
          color: '#22d3ee',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
        }}
      >
        Upload PDF
      </button>
    </div>
  )
}

export function GlassPdfViewer({ doc, activeParagraphIdx, onBBoxClick }: Props) {
  const [activeTool, setActiveTool] = useState<'pointer' | 'hand'>('pointer')
  const [zoomLevel, setZoomLevel] = useState(100)
  const [showThumbnails, setShowThumbnails] = useState(true)
  const [spotlightMode, setSpotlightMode] = useState(false)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [coveredBBoxIds, setCoveredBBoxIds] = useState<Set<string>>(new Set())

  const fileInputRef = useRef<HTMLInputElement>(null)
  const activeBBoxRef = useRef<HTMLDivElement | null>(null)
  const canvasRef = useRef<HTMLDivElement>(null)

  const pageCount = doc?.pageCount ?? 0
  const totalParagraphs = doc?.paragraphs.length ?? 0
  const paragraphs = useMemo(
    () => doc?.paragraphs.filter((p) => p.pageIndex === currentPage - 1) ?? [],
    [doc, currentPage]
  )
  const bboxes = useMemo(
    () => doc?.bboxes.filter((b) => b.pageIndex === currentPage - 1) ?? [],
    [doc, currentPage]
  )

  // Track covered/visited paragraphs as active moves
  useEffect(() => {
    if (!doc || activeParagraphIdx < 0 || activeParagraphIdx >= doc.paragraphs.length) return
    const activePara = doc.paragraphs[activeParagraphIdx]
    if (activePara) {
      setCoveredBBoxIds((prev) => {
        const next = new Set(prev)
        next.add(activePara.bboxId)
        return next
      })
    }
  }, [doc, activeParagraphIdx])

  // Auto-scroll to active bbox when it changes
  useEffect(() => {
    if (activeBBoxRef.current) {
      activeBBoxRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [activeParagraphIdx])

  // When active paragraph changes from transcript/citation click, jump to its page
  const prevActiveParaRef = useRef(activeParagraphIdx)
  useEffect(() => {
    if (!doc) return
    if (prevActiveParaRef.current !== activeParagraphIdx) {
      prevActiveParaRef.current = activeParagraphIdx
      const bbox = doc.bboxes[activeParagraphIdx]
      if (bbox && bbox.pageIndex + 1 !== currentPage) {
        setCurrentPage(bbox.pageIndex + 1)
      }
    }
  }, [activeParagraphIdx, doc, currentPage])

  const goToPage = (targetPage: number) => {
    const validPage = Math.max(1, Math.min(pageCount || 1, targetPage))
    setCurrentPage(validPage)
    // Synchronize transcript and active paragraph to the first chunk on the target page
    if (doc) {
      const firstOnPageIdx = doc.paragraphs.findIndex((p) => p.pageIndex === validPage - 1)
      if (firstOnPageIdx !== -1 && firstOnPageIdx !== activeParagraphIdx) {
        prevActiveParaRef.current = firstOnPageIdx
        onBBoxClick(firstOnPageIdx)
      }
    }
  }

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return
      if (e.key === 'ArrowLeft') {
        goToPage(currentPage - 1)
      } else if (e.key === 'ArrowRight') {
        goToPage(currentPage + 1)
      } else if (e.key === '+' || e.key === '=') {
        setZoomLevel((z) => Math.min(z + 15, 200))
      } else if (e.key === '-') {
        setZoomLevel((z) => Math.max(z - 15, 50))
      } else if (e.key.toLowerCase() === 's') {
        setSpotlightMode((prev) => !prev)
      } else if (e.key.toLowerCase() === 'm') {
        setShowThumbnails((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [pageCount, currentPage])

  const handleZoomIn = () => setZoomLevel((p) => Math.min(p + 15, 200))
  const handleZoomOut = () => setZoomLevel((p) => Math.max(p - 15, 50))
  const handleZoomReset = () => setZoomLevel(100)
  const prevPage = () => goToPage(currentPage - 1)
  const nextPage = () => goToPage(currentPage + 1)

  const toolBtn = (tool: 'pointer' | 'hand', Icon: React.ElementType, label: string) => {
    const on = activeTool === tool
    return (
      <button
        type="button"
        title={label}
        onClick={() => setActiveTool(tool)}
        style={{
          padding: '6px 9px',
          borderRadius: '8px',
          border: 'none',
          background: on ? 'rgba(6,182,212,0.18)' : 'transparent',
          color: on ? '#22d3ee' : '#64748b',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          boxShadow: on ? '0 0 8px rgba(6,182,212,0.25)' : 'none',
          transition: 'all 0.15s ease',
        }}
      >
        <Icon size={15} />
      </button>
    )
  }

  const coveredCount = coveredBBoxIds.size
  const coveragePct = totalParagraphs > 0 ? Math.round((coveredCount / totalParagraphs) * 100) : 0

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: 'rgba(15,23,42,0.45)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(56,189,248,0.22)',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 0 35px rgba(6,182,212,0.08), inset 0 1px 0 0 rgba(255,255,255,0.08)',
      }}
    >
      {/* Top toolbar */}
      <div
        style={{
          padding: '8px 14px',
          borderBottom: '1px solid rgba(56,189,248,0.14)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          background: 'rgba(2,6,23,0.55)',
          gap: '10px',
        }}
      >
        {/* Left tools: Mini-map toggle, Pointer/Hand, Zoom */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Mini-map toggle */}
          <button
            type="button"
            onClick={() => setShowThumbnails(!showThumbnails)}
            title={showThumbnails ? 'Hide Mini-Map (Shortcut: M)' : 'Show Mini-Map (Shortcut: M)'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: '8px',
              border: `1px solid rgba(6,182,212,${showThumbnails ? '0.45' : '0.18'})`,
              background: showThumbnails ? 'rgba(6,182,212,0.14)' : 'transparent',
              color: showThumbnails ? '#22d3ee' : '#64748b',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {showThumbnails ? <PanelLeftClose size={14} /> : <PanelLeftOpen size={14} />}
            <span>Mini-Map</span>
          </button>

          <div style={{ width: '1px', height: '18px', background: 'rgba(56,189,248,0.18)', margin: '0 4px' }} />

          {toolBtn('pointer', MousePointer2, 'Select Mode')}
          {toolBtn('hand', Hand, 'Pan Mode')}

          <div style={{ width: '1px', height: '18px', background: 'rgba(56,189,248,0.18)', margin: '0 4px' }} />

          <button
            type="button"
            onClick={handleZoomOut}
            title="Zoom Out (-)"
            style={{ padding: '6px 8px', borderRadius: '8px', border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer', display: 'flex' }}
          >
            <ZoomOut size={15} />
          </button>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#38bdf8',
              minWidth: '42px',
              textAlign: 'center',
              background: 'rgba(56,189,248,0.08)',
              border: '1px solid rgba(56,189,248,0.2)',
              borderRadius: '6px',
              padding: '3px 6px',
            }}
          >
            {zoomLevel}%
          </span>
          <button
            type="button"
            onClick={handleZoomIn}
            title="Zoom In (+)"
            style={{ padding: '6px 8px', borderRadius: '8px', border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer', display: 'flex' }}
          >
            <ZoomIn size={15} />
          </button>
          {zoomLevel !== 100 && (
            <button
              type="button"
              onClick={handleZoomReset}
              title="Reset Zoom to 100%"
              style={{ padding: '4px 6px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#38bdf8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <RotateCcw size={12} />
            </button>
          )}

          <div style={{ width: '1px', height: '18px', background: 'rgba(56,189,248,0.18)', margin: '0 4px' }} />

          {/* Spotlight Mode Toggle Button (Inspired by RIFT web architecture) */}
          <button
            type="button"
            onClick={() => setSpotlightMode(!spotlightMode)}
            title="Toggle Focused Spotlight Dimming (Key: S)"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 11px',
              borderRadius: '8px',
              border: spotlightMode ? '1px solid rgba(34,211,238,0.7)' : '1px solid rgba(56,189,248,0.2)',
              background: spotlightMode
                ? 'linear-gradient(135deg, rgba(6,182,212,0.24), rgba(59,130,246,0.2))'
                : 'transparent',
              color: spotlightMode ? '#38bdf8' : '#64748b',
              fontSize: '11.5px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: spotlightMode ? '0 0 14px rgba(34,211,238,0.35)' : 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Sparkles size={13} color={spotlightMode ? '#38bdf8' : '#64748b'} />
            <span>Spotlight {spotlightMode ? 'ON' : 'OFF'}</span>
          </button>
        </div>

        {/* Center / Right: Reading Roadmap Progress + Page navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          {totalParagraphs > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 10px',
                background: 'rgba(15,23,42,0.6)',
                border: '1px solid rgba(56,189,248,0.18)',
                borderRadius: '8px',
              }}
              title={`${coveredCount} of ${totalParagraphs} chunks covered`}
            >
              <CheckCircle2 size={13} color="#10b981" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                  <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.02em' }}>
                    ROADMAP
                  </span>
                  <span style={{ fontSize: '10px', color: '#67e8f9', fontWeight: 700, fontFamily: 'monospace' }}>
                    {coveragePct}%
                  </span>
                </div>
                <div
                  style={{
                    width: '70px',
                    height: '3px',
                    background: 'rgba(255,255,255,0.1)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${coveragePct}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #06b6d4, #10b981)',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Page navigation */}
          {pageCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={prevPage}
                disabled={currentPage <= 1}
                title="Previous Page (Left Arrow)"
                style={{
                  padding: '4px 6px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'transparent',
                  color: currentPage > 1 ? '#38bdf8' : '#334155',
                  cursor: currentPage > 1 ? 'pointer' : 'not-allowed',
                  display: 'flex',
                }}
              >
                <ChevronLeft size={15} />
              </button>
              <span style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>
                Page <strong style={{ color: '#e0f2fe' }}>{currentPage}</strong> / {pageCount}
              </span>
              <button
                type="button"
                onClick={nextPage}
                disabled={currentPage >= pageCount}
                title="Next Page (Right Arrow)"
                style={{
                  padding: '4px 6px',
                  borderRadius: '6px',
                  border: 'none',
                  background: 'transparent',
                  color: currentPage < pageCount ? '#38bdf8' : '#334155',
                  cursor: currentPage < pageCount ? 'pointer' : 'not-allowed',
                  display: 'flex',
                }}
              >
                <ChevronRight size={15} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Body: Mini-Map Sidebar + PDF Stage Viewport */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Interactive Mini-Map Strip */}
        {showThumbnails && (
          <div
            style={{
              width: '92px',
              height: '100%',
              background: 'rgba(2,6,23,0.5)',
              borderRight: '1px solid rgba(56,189,248,0.14)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 8px',
              overflowY: 'auto',
              flexShrink: 0,
            }}
            className="glass-scroll"
          >
            {/* Mini-Map Header with close button */}
            <div
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 2px',
              }}
            >
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                Mini-Map
              </span>
              <button
                type="button"
                onClick={() => setShowThumbnails(false)}
                title="Hide Mini-Map (Shortcut: M)"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '4px',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#38bdf8'
                  e.currentTarget.style.background = 'rgba(6,182,212,0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#64748b'
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <PanelLeftClose size={13} />
              </button>
            </div>

            {Array.from({ length: pageCount || 1 }).map((_, i) => {
              const pg = i + 1
              const isSel = currentPage === pg
              const pageBBoxes = doc?.bboxes.filter((b) => b.pageIndex === i) ?? []
              const hasCovered = pageBBoxes.some((b) => coveredBBoxIds.has(b.id))

              return (
                <button
                  key={pg}
                  type="button"
                  onClick={() => goToPage(pg)}
                  title={`Jump to Page ${pg}`}
                  style={{
                    width: '68px',
                    height: '92px',
                    borderRadius: '8px',
                    background: isSel ? 'rgba(6,182,212,0.12)' : 'rgba(15,23,42,0.6)',
                    border: isSel
                      ? '1.5px solid rgba(34,211,238,0.85)'
                      : '1px solid rgba(56,189,248,0.15)',
                    boxShadow: isSel ? '0 0 16px rgba(34,211,238,0.45)' : 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '5px 4px 4px',
                    cursor: 'pointer',
                    flexShrink: 0,
                    overflow: 'hidden',
                    position: 'relative',
                    transition: 'all 0.18s ease',
                  }}
                >
                  {/* Miniature PDF Sheet with Live Miniature Bounding Boxes */}
                  <div
                    style={{
                      width: '100%',
                      flex: 1,
                      position: 'relative',
                      background: '#070b16',
                      borderRadius: '3px',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Simulated miniature text lines */}
                    <div style={{ position: 'absolute', top: '4px', left: '4px', right: '4px', height: '1.5px', background: 'rgba(255,255,255,0.18)', borderRadius: '1px' }} />
                    <div style={{ position: 'absolute', top: '8px', left: '4px', right: '10px', height: '1.5px', background: 'rgba(255,255,255,0.08)', borderRadius: '1px' }} />
                    <div style={{ position: 'absolute', top: '12px', left: '4px', right: '6px', height: '1.5px', background: 'rgba(255,255,255,0.08)', borderRadius: '1px' }} />

                    {/* Miniature Bounding Boxes rendered dynamically */}
                    {pageBBoxes.map((b, idx) => {
                      const isBBoxActive =
                        activeParagraphIdx !== -1 && doc?.paragraphs[activeParagraphIdx]?.bboxId === b.id
                      const isCovered = coveredBBoxIds.has(b.id)

                      return (
                        <div
                          key={b.id || idx}
                          style={{
                            position: 'absolute',
                            left: `${b.x}%`,
                            top: `${b.y}%`,
                            width: `${Math.max(b.width, 10)}%`,
                            height: `${Math.max(b.height, 6)}%`,
                            backgroundColor: isBBoxActive
                              ? 'rgba(6, 182, 212, 0.85)'
                              : isCovered
                              ? 'rgba(16, 185, 129, 0.55)'
                              : 'rgba(148, 163, 184, 0.25)',
                            border: isBBoxActive
                              ? '1px solid #38bdf8'
                              : isCovered
                              ? '1px solid #10b981'
                              : 'none',
                            borderRadius: '1px',
                            boxShadow: isBBoxActive ? '0 0 6px rgba(6, 182, 212, 0.9)' : 'none',
                            zIndex: isBBoxActive ? 10 : 2,
                          }}
                        />
                      )
                    })}
                  </div>

                  {/* Page indicator pill with coverage indicator dot */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
                    <span
                      style={{
                        fontSize: '9.5px',
                        fontWeight: isSel ? 700 : 500,
                        color: isSel ? '#22d3ee' : '#64748b',
                        fontFamily: 'monospace',
                      }}
                    >
                      p.{pg}
                    </span>
                    {hasCovered && (
                      <span
                        style={{
                          width: '4px',
                          height: '4px',
                          borderRadius: '50%',
                          background: '#10b981',
                          boxShadow: '0 0 4px #10b981',
                        }}
                        title="Page contains covered material"
                      />
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* Main Canvas Viewport with Spotlight & Holographic Overlays */}
        <div
          ref={canvasRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            padding: '28px 20px 40px',
            cursor: activeTool === 'hand' ? 'grab' : 'default',
            background: 'radial-gradient(circle at 50% 25%, rgba(15, 23, 42, 0.65), rgba(2, 6, 23, 0.85))',
            position: 'relative',
          }}
          className="glass-scroll"
        >
          {/* Floating Show Mini-Map Trigger when hidden */}
          {!showThumbnails && (
            <button
              type="button"
              onClick={() => setShowThumbnails(true)}
              title="Show Mini-Map (Shortcut: M)"
              style={{
                position: 'absolute',
                top: '14px',
                left: '14px',
                zIndex: 30,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                background: 'rgba(15, 23, 42, 0.85)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '8px',
                color: '#38bdf8',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(34, 211, 238, 0.7)'
                e.currentTarget.style.boxShadow = '0 0 16px rgba(34, 211, 238, 0.35)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.35)'
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.5)'
              }}
            >
              <PanelLeftOpen size={13} />
              <span>Mini-Map</span>
            </button>
          )}

          {!doc ? (
            <>
              <input ref={fileInputRef} type="file" accept="application/pdf" style={{ display: 'none' }} />
              <EmptyViewer onUploadClick={() => fileInputRef.current?.click()} />
            </>
          ) : doc.pdfUrl ? (
            /* Scaled PDF Document Sheet with Zero-Drift Normalized Bounding Boxes */
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'flex-start',
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <PdfPageContainer pdfUrl={doc.pdfUrl} pageNum={currentPage}>
                {/* Spotlight Mode Dimming Backdrop */}
                {spotlightMode && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      backgroundColor: 'rgba(2, 6, 23, 0.68)',
                      backdropFilter: 'blur(2px)',
                      WebkitBackdropFilter: 'blur(2px)',
                      transition: 'opacity 0.25s ease',
                      pointerEvents: 'none',
                      zIndex: 12,
                      borderRadius: '4px',
                    }}
                  />
                )}

                {/* Bounding Box Overlays */}
                {paragraphs.map((para, _idx) => {
                  const globalIdx = doc.paragraphs.indexOf(para)
                  const bbox = bboxes.find((b) => b.id === para.bboxId)
                  if (!bbox) return null

                  const isActive = activeParagraphIdx === globalIdx
                  const isHovered = hoveredIdx === globalIdx
                  const isCovered = coveredBBoxIds.has(para.bboxId)
                  const bboxStyle = getBBoxStyle(globalIdx, isCovered)

                  return (
                    <div
                      key={para.id}
                      ref={(el) => {
                        if (isActive) activeBBoxRef.current = el
                      }}
                      onClick={() => onBBoxClick(globalIdx)}
                      onMouseEnter={() => setHoveredIdx(globalIdx)}
                      onMouseLeave={() => setHoveredIdx(null)}
                      title={para.text.slice(0, 100) + '...'}
                      style={{
                        position: 'absolute',
                        left: `${bbox.x}%`,
                        top: `${bbox.y}%`,
                        width: `${bbox.width}%`,
                        height: `${bbox.height}%`,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        border: isActive
                          ? `2px solid ${bboxStyle.border}`
                          : isHovered
                          ? `1.5px dashed ${bboxStyle.border}`
                          : isCovered
                          ? '1px solid rgba(16, 185, 129, 0.35)'
                          : '1px solid rgba(56,189,248,0.15)',
                        background: isActive
                          ? bboxStyle.bg
                          : isHovered
                          ? 'rgba(6,182,212,0.08)'
                          : isCovered
                          ? 'rgba(16, 185, 129, 0.05)'
                          : 'transparent',
                        boxShadow: isActive ? bboxStyle.glow : 'none',
                        transition: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
                        zIndex: isActive ? 25 : isHovered ? 15 : 8,
                      }}
                    >
                      {/* Corner Reticles for Active Bounding Box */}
                      {isActive && <CornerBrackets color={bboxStyle.border} />}

                      {/* Scanline Sweep Animation for Active Bounding Box */}
                      {isActive && (
                        <div
                          className="scanline-sweep"
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background:
                              'linear-gradient(90deg, transparent, rgba(34,211,238,0.12), transparent)',
                            pointerEvents: 'none',
                          }}
                        />
                      )}

                      {/* Clean Line Indicator Pill floating above active or hovered chunk */}
                      {(isActive || isHovered) && (
                        <div
                          style={{
                            position: 'absolute',
                            top: '-24px',
                            left: '0',
                            background: 'rgba(10, 15, 29, 0.94)',
                            border: `1px solid ${bboxStyle.border}`,
                            color: bboxStyle.text,
                            fontSize: '9.5px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '5px',
                            whiteSpace: 'nowrap',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                            pointerEvents: 'none',
                            letterSpacing: '0.03em',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                        >
                          <span
                            style={{
                              width: '5px',
                              height: '5px',
                              borderRadius: '50%',
                              background: bboxStyle.border,
                              display: 'inline-block',
                            }}
                          />
                          <span>{bboxStyle.label}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </PdfPageContainer>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
