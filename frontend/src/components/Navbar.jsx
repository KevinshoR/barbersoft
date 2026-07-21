import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useRef, useEffect } from 'react'
import ThemeToggle from './ThemeToggle'

const links = [
  { to: '/dashboard',    label: 'Inicio',     icon: '⌂' },
  { to: '/appointments', label: 'Agenda',      icon: '◷' },
  { to: '/barbers',      label: 'Barberos',    icon: '◈' },
  { to: '/services',     label: 'Servicios',   icon: '✦' },
]

export default function Navbar() {
  const { barbershop, logout } = useAuth()
  const location  = useLocation()
  const navigate  = useNavigate()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const statusLabel = {
    trial:   'PERÍODO DE PRUEBA',
    active:  'ACTIVO',
    blocked: 'BLOQUEADO',
  }

  const statusColor = {
    trial:   'var(--gold)',
    active:  'var(--success)',
    blocked: 'var(--danger)',
  }

  const status = barbershop?.subscription_status || 'trial'

  return (
    <nav style={{ background:'var(--dark-2)', borderBottom:'1px solid var(--dark-4)', padding:'0 24px', display:'flex', alignItems:'center', justifyContent:'space-between', height:64, position:'sticky', top:0, zIndex:100 }}>

      {/* Logo */}
      <Link to="/" style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none' }} title="Ir al sitio de Barbersoft">
        <span style={{ color:'var(--gold)', fontSize:20 }}>✂</span>
        <span style={{ fontFamily:'Playfair Display', fontWeight:900, fontSize:18, color:'var(--cream)', letterSpacing:'0.02em' }}>
          Barber<span style={{ color:'var(--gold)' }}>soft</span>
        </span>
      </Link>

      {/* Links */}
      <div style={{ display:'flex', alignItems:'center' }}>
        {links.map(link => {
          const active = location.pathname === link.to ||
            (link.to === '/appointments' && location.pathname === '/hours')
          return (
            <Link
              key={link.to}
              to={link.to}
              style={{ color: active ? 'var(--gold)' : 'var(--cream-dim)', borderBottom: active ? '2px solid var(--gold)' : '2px solid transparent', padding:'20px 14px 18px', fontSize:12, fontWeight: active ? 600 : 400, letterSpacing:'0.04em', textDecoration:'none', transition:'all 0.2s', display:'flex', alignItems:'center', gap:5 }}
            >
              <span style={{ fontSize:10, opacity:0.7 }}>{link.icon}</span>
              {link.label.toUpperCase()}
            </Link>
          )
        })}
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
      <ThemeToggle />

      {/* Perfil con dropdown */}
      <div ref={ref} style={{ position:'relative' }}>
        <button
          onClick={() => setOpen(prev => !prev)}
          style={{ display:'flex', alignItems:'center', gap:10, background: open ? 'var(--dark-3)' : 'transparent', border:'1px solid ' + (open ? 'var(--dark-4)' : 'transparent'), borderRadius:10, padding:'7px 12px', cursor:'pointer', transition:'all 0.2s' }}
        >
          {/* Avatar */}
          <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg, var(--gold-dim), var(--gold))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontFamily:'Playfair Display', fontWeight:900, color:'var(--dark)', flexShrink:0 }}>
            {barbershop?.name?.charAt(0).toUpperCase() || 'B'}
          </div>
          <div style={{ textAlign:'left' }}>
            <p style={{ fontSize:12, color:'var(--cream)', fontWeight:600, lineHeight:1.2, maxWidth:120, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
              {barbershop?.name}
            </p>
            <p style={{ fontSize:10, color: statusColor[status], letterSpacing:'0.06em', fontWeight:600, lineHeight:1.2 }}>
              {statusLabel[status]}
            </p>
          </div>
          <span style={{ color:'var(--cream-dim)', fontSize:10, opacity:0.6, transition:'transform 0.2s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}>▾</span>
        </button>

        {/* Dropdown */}
        {open && (
          <div className="animate-fade-up" style={{ position:'absolute', top:'calc(100% + 8px)', right:0, background:'var(--dark-2)', border:'1px solid var(--dark-4)', borderRadius:12, padding:6, minWidth:220, boxShadow:'0 8px 32px rgba(0,0,0,0.5)', zIndex:200 }}>

            {/* Info */}
            <div style={{ padding:'10px 12px 12px', borderBottom:'1px solid var(--dark-4)', marginBottom:4 }}>
              <p style={{ color:'var(--cream)', fontSize:13, fontWeight:600, marginBottom:2 }}>{barbershop?.name}</p>
              <p style={{ color:'var(--cream-dim)', fontSize:11, opacity:0.6 }}>{barbershop?.email}</p>
            </div>

            {/* Opciones */}
            {[
              { icon:'⚙', label:'Configuración', action:() => { navigate('/settings'); setOpen(false) } },
              { icon:'◆', label:'Suscripción',   action:() => { navigate('/subscription'); setOpen(false) } },
              { icon:'🔗', label:'Mi página de reservas', action:() => { window.open('/reservar/'+barbershop?.slug, '_blank'); setOpen(false) } },
            ].map(item => (
              <button
                key={item.label}
                onClick={item.action}
                style={{ display:'flex', alignItems:'center', gap:10, width:'100%', background:'transparent', border:'none', padding:'9px 12px', borderRadius:8, cursor:'pointer', transition:'background 0.15s', color:'var(--cream)', fontSize:13, fontFamily:'DM Sans', textAlign:'left' }}
                onMouseEnter={e => e.currentTarget.style.background='var(--dark-3)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}
              >
                <span style={{ fontSize:14, opacity:0.7 }}>{item.icon}</span>
                {item.label}
              </button>
            ))}

            {/* Divider + Salir */}
            <div style={{ height:1, background:'var(--dark-4)', margin:'4px 0' }} />
            <button
              onClick={handleLogout}
              style={{ display:'flex', alignItems:'center', gap:10, width:'100%', background:'transparent', border:'none', padding:'9px 12px', borderRadius:8, cursor:'pointer', transition:'background 0.15s', color:'var(--danger)', fontSize:13, fontFamily:'DM Sans', textAlign:'left' }}
              onMouseEnter={e => e.currentTarget.style.background='rgba(224,82,82,0.08)'}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}
            >
              <span style={{ fontSize:14, opacity:0.7 }}>→</span>
              Cerrar sesión
            </button>
          </div>
        )}
      </div>
      </div>
    </nav>
  )
}