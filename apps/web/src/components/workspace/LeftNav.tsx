import { Menu, User } from 'lucide-react'

interface Props {
  onHome: () => void
}

export function LeftNav({ onHome }: Props) {
  return (
    <nav
      style={{
        width: '44px',
        height: '100%',
        backgroundColor: '#1a1028',
        borderRight: '1px solid #3a2050',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 0',
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      {/* Top: Menu */}
      <button
        type="button"
        onClick={onHome}
        title="Back to Library"
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          color: '#f0e6ff',
          cursor: 'pointer',
          transition: 'background-color 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#2d1f42'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
        }}
      >
        <Menu size={20} color="#f0e6ff" />
      </button>

      {/* Middle Spacer */}
      <div style={{ flex: 1 }} />

      {/* Bottom: User avatar */}
      <div
        title="Account Profile"
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          backgroundColor: '#7b2cbf',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          border: '1.5px solid #9b5de5',
        }}
      >
        <User size={18} color="#ffffff" />
      </div>
    </nav>
  )
}
