import { useState } from 'react'
import { MousePointer2, Hand, ZoomIn, ZoomOut, Layers } from 'lucide-react'
import { mockParagraphs, mockBBoxes } from '../../data/mockData'

interface Props {
  activeParagraphIdx: number
  onBBoxClick: (idx: number) => void
}

export function PdfViewer({ activeParagraphIdx, onBBoxClick }: Props) {
  const [activeTool, setActiveTool] = useState<'pointer' | 'hand'>('pointer')
  const [zoomLevel, setZoomLevel] = useState(100)
  const [showThumbnails, setShowThumbnails] = useState(true)
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const [selectedPage, setSelectedPage] = useState(1)

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 15, 160))
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 15, 70))

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: '#0d0d0d',
        overflow: 'hidden',
      }}
    >
      {/* Top Toolbar */}
      <div
        style={{
          height: '46px',
          backgroundColor: '#1a1028',
          borderBottom: '1px solid #3a2050',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          flexShrink: 0,
          zIndex: 5,
        }}
      >
        {/* Left: Tools */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            title="Select tool"
            onClick={() => setActiveTool('pointer')}
            style={{
              padding: '6px 8px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: activeTool === 'pointer' ? '#3a2050' : 'transparent',
              color: activeTool === 'pointer' ? '#c084fc' : '#9b8bbb',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <MousePointer2 size={16} />
          </button>
          <button
            type="button"
            title="Pan tool"
            onClick={() => setActiveTool('hand')}
            style={{
              padding: '6px 8px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: activeTool === 'hand' ? '#3a2050' : 'transparent',
              color: activeTool === 'hand' ? '#c084fc' : '#9b8bbb',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Hand size={16} />
          </button>

          <div style={{ width: '1px', height: '18px', backgroundColor: '#3a2050', margin: '0 4px' }} />

          <button
            type="button"
            title="Zoom Out"
            onClick={handleZoomOut}
            style={{
              padding: '6px 8px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#9b8bbb',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ZoomOut size={16} />
          </button>
          <span style={{ fontSize: '12px', color: '#f0e6ff', minWidth: '42px', textAlign: 'center' }}>
            {zoomLevel}%
          </span>
          <button
            type="button"
            title="Zoom In"
            onClick={handleZoomIn}
            style={{
              padding: '6px 8px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#9b8bbb',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ZoomIn size={16} />
          </button>
        </div>

        {/* Right: Pages Toggle Button */}
        <button
          type="button"
          onClick={() => setShowThumbnails(!showThumbnails)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 10px',
            borderRadius: '6px',
            border: '1px solid #3a2050',
            backgroundColor: showThumbnails ? '#241734' : 'transparent',
            color: showThumbnails ? '#c084fc' : '#9b8bbb',
            fontSize: '12px',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Layers size={14} />
          <span>Pages</span>
        </button>
      </div>

      {/* Main Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Collapsible Page Thumbnails Sidebar */}
        <div
          style={{
            width: showThumbnails ? '84px' : '0px',
            height: '100%',
            backgroundColor: '#1a1028',
            borderRight: showThumbnails ? '1px solid #3a2050' : 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            padding: showThumbnails ? '12px 6px' : '0',
            overflowY: 'auto',
            overflowX: 'hidden',
            transition: 'width 0.2s ease, padding 0.2s ease',
            flexShrink: 0,
          }}
        >
          {[1, 2, 3, 4, 5, 6].map((pg) => {
            const isSelected = selectedPage === pg
            return (
              <button
                key={pg}
                type="button"
                onClick={() => setSelectedPage(pg)}
                style={{
                  width: '64px',
                  height: '84px',
                  borderRadius: '6px',
                  backgroundColor: '#241734',
                  border: isSelected ? '2px solid #9b5de5' : '1px solid #3a2050',
                  boxShadow: isSelected ? '0 0 10px rgba(155, 93, 229, 0.4)' : 'none',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '6px 4px',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
              >
                {/* Mini lines imitating document */}
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '3px', padding: '2px' }}>
                  <div style={{ height: '3px', width: '70%', backgroundColor: '#9b8bbb', borderRadius: '1px' }} />
                  <div style={{ height: '2px', width: '90%', backgroundColor: '#4a3360', borderRadius: '1px' }} />
                  <div style={{ height: '2px', width: '85%', backgroundColor: '#4a3360', borderRadius: '1px' }} />
                  <div style={{ height: '2px', width: '95%', backgroundColor: '#4a3360', borderRadius: '1px' }} />
                  <div style={{ height: '2px', width: '60%', backgroundColor: '#4a3360', borderRadius: '1px' }} />
                </div>
                <span style={{ fontSize: '10px', color: isSelected ? '#c084fc' : '#9b8bbb', fontWeight: 600 }}>
                  p. {pg}
                </span>
              </button>
            )
          })}
        </div>

        {/* Main Canvas Area */}
        <div
          style={{
            flex: 1,
            height: '100%',
            overflow: 'auto',
            backgroundColor: '#0d0d0d',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-start',
            padding: '32px 20px',
            cursor: activeTool === 'hand' ? 'grab' : 'default',
          }}
        >
          {/* A4 Document Page */}
          <div
            style={{
              width: '580px',
              minHeight: '840px',
              backgroundColor: '#f8f4ff',
              borderRadius: '4px',
              boxShadow: '0 12px 40px rgba(0, 0, 0, 0.65)',
              padding: '40px 36px',
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.15s ease',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              color: '#1a1028',
            }}
          >
            {/* Document Header */}
            <div style={{ marginBottom: '24px', borderBottom: '2px solid #e0d0f0', paddingBottom: '14px' }}>
              <h1
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#241734',
                  margin: 0,
                  letterSpacing: '-0.01em',
                }}
              >
                Deep Learning Fundamentals
              </h1>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: '6px',
                  fontSize: '11px',
                  color: '#6b5b7b',
                  fontWeight: 500,
                }}
              >
                <span>Research Lab, 2026</span>
                <span>Page {selectedPage} of 6</span>
              </div>
            </div>

            {/* Paragraph Blocks / Overlaid Bounding Boxes */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
              {mockParagraphs.map((para, idx) => {
                const isActive = activeParagraphIdx === idx
                const isHovered = hoveredIdx === idx
                const bbox = mockBBoxes[idx]

                return (
                  <div
                    key={para.id}
                    onClick={() => onBBoxClick(idx)}
                    onMouseEnter={() => setHoveredIdx(idx)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    className={isActive ? 'glow-box' : ''}
                    style={{
                      position: 'relative',
                      backgroundColor: '#e8e0f0',
                      borderRadius: '6px',
                      padding: '12px 14px',
                      cursor: 'pointer',
                      border: isActive
                        ? '2px solid #9b5de5'
                        : isHovered
                        ? '2px dashed #9b5de5'
                        : '2px solid transparent',
                      transition: 'border 0.15s ease, transform 0.15s ease, background-color 0.15s ease',
                      transform: isActive ? 'scale(1.01)' : 'none',
                    }}
                  >
                    {/* Bounding Box Indicator Pill */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '-9px',
                        right: '12px',
                        backgroundColor: isActive ? '#9b5de5' : isHovered ? '#7b2cbf' : '#3a2050',
                        color: '#ffffff',
                        fontSize: '9px',
                        fontWeight: 600,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        letterSpacing: '0.04em',
                        transition: 'background-color 0.15s ease',
                      }}
                    >
                      {bbox?.id || `bbox-${idx + 1}`}
                    </div>

                    <p
                      style={{
                        margin: 0,
                        fontSize: '12.5px',
                        lineHeight: 1.55,
                        color: '#241734',
                        fontWeight: isActive ? 600 : 400,
                      }}
                    >
                      {para.text}
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Document Footer */}
            <div
              style={{
                marginTop: '28px',
                paddingTop: '10px',
                borderTop: '1px solid #e0d0f0',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '10px',
                color: '#8b7b9b',
              }}
            >
              <span>RIFT Document Viewer • Neural Engine v2.4</span>
              <span>CONFIDENTIAL & PROPRIETARY</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
