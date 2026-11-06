import { Menu, User } from 'lucide-react'

interface Props {
  onHome: () => void
}

export function GlassLeftNav({ onHome }: Props) {
  return (
    <nav
      style={{
        width: '56px',
        height: '100%',
        background: 'rgba(2, 6, 23, 0.6)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRight: '1px solid rgba(6, 182, 212, 0.18)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 0',
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      {/* Top: Hamburger / home button */}
      <button
        type="button"
        onClick={onHome}
        title="Back to Library"
        style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
          border: 'none',
          color: '#67e8f9',
          cursor: 'pointer',
          transition: 'background-color 0.15s ease, box-shadow 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(6, 182, 212, 0.14)'
          e.currentTarget.style.boxShadow = '0 0 12px rgba(6, 182, 212, 0.2)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        <Menu size={20} />
      </button>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Bottom: User avatar with glowing cyan ring */}
      <div
        title="Account Profile"
        style={{
          width: '34px',
          height: '34px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #0ea5e9, #06b6d4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          border: '2px solid rgba(34, 211, 238, 0.5)',
          boxShadow: '0 0 12px rgba(34, 211, 238, 0.4)',
        }}
      >
        <User size={17} color="#ffffff" />
      </div>
    </nav>
  )
}

