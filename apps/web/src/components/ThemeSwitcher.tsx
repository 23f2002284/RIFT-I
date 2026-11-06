import { useTheme } from '../context/ThemeContext'

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme()

  return (
    <div
      style={{
        position: 'fixed',
        top: '14px',
        right: '16px',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
        backgroundColor: theme === 'violet' ? 'rgba(36, 23, 52, 0.85)' : 'rgba(2, 6, 23, 0.75)',
        backdropFilter: 'blur(12px)',
        border: theme === 'violet' ? '1px solid rgba(155,93,229,0.4)' : '1px solid rgba(56,189,248,0.3)',
        borderRadius: '9999px',
        padding: '4px',
        boxShadow: theme === 'violet' ? '0 4px 20px rgba(155,93,229,0.2)' : '0 4px 20px rgba(6,182,212,0.2)',
      }}
    >
      {(['violet', 'glass'] as const).map((t) => (
        <button
          key={t}
          onClick={() => setTheme(t)}
          style={{
            padding: '5px 14px',
            borderRadius: '9999px',
            border: 'none',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.05em',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            backgroundColor:
              theme === t
                ? t === 'violet'
                  ? '#9b5de5'
                  : '#06b6d4'
                : 'transparent',
            color:
              theme === t
                ? '#ffffff'
                : t === 'violet'
                ? '#a78bfa'
                : '#67e8f9',
          }}
        >
          {t === 'violet' ? '◆ Violet' : '◈ Glass'}
        </button>
      ))}
    </div>
  )
}
