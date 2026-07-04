import { useTheme } from '../context/ThemeContext'

// Botón sol/luna para alternar el tema. `floating` lo posiciona fijo en la
// esquina, para usarlo en pantallas públicas que no tienen Navbar.
export default function ThemeToggle({ floating = false }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  const baseStyle = {
    width: 36, height: 36, borderRadius: '50%',
    background: 'var(--dark-3)', border: '1px solid var(--dark-4)',
    color: 'var(--cream)', fontSize: 16, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s', flexShrink: 0,
  }

  const floatingStyle = floating ? {
    position: 'fixed', top: 20, right: 20, zIndex: 500,
    boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
  } : {}

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Activar modo claro' : 'Activar modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
      style={{ ...baseStyle, ...floatingStyle }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--gold)' }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--dark-4)'; e.currentTarget.style.color = 'var(--cream)' }}
    >
      {isDark ? '☀' : '☾'}
    </button>
  )
}
