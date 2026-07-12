import { useNavigate, useLocation } from 'react-router-dom'

/* Pestañas de la sección Agenda: Citas | Horario de atención.
   Se muestran en ambas páginas (/appointments y /hours) para que
   se sientan una sola sección con dos vistas. */
export default function AgendaTabs() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const tabs = [
    { to: '/appointments', label: 'Citas' },
    { to: '/hours',        label: 'Horario de atención' },
  ]

  return (
    <div style={{ display: 'inline-flex', background: 'var(--dark-2)', border: '1px solid var(--border-soft, var(--dark-4))', borderRadius: 12, padding: 5, marginBottom: 28, gap: 4 }}>
      {tabs.map(t => {
        const active = pathname === t.to
        return (
          <button
            key={t.to}
            onClick={() => !active && navigate(t.to)}
            style={{
              padding: '10px 22px', borderRadius: 8, border: 'none', cursor: active ? 'default' : 'pointer',
              background: active ? 'var(--gold)' : 'transparent',
              color: active ? 'var(--dark)' : 'var(--cream-dim)',
              fontWeight: 700, fontSize: 13, letterSpacing: '0.03em', transition: 'all 0.15s',
              fontFamily: 'var(--font-body, inherit)',
            }}
            onMouseOver={(e) => { if (!active) e.currentTarget.style.color = 'var(--cream)' }}
            onMouseOut={(e) => { if (!active) e.currentTarget.style.color = 'var(--cream-dim)' }}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}