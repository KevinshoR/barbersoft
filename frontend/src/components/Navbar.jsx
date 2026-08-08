import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useRef, useEffect } from 'react'

/* ═══════════════════════════════════════════════════════════════
   Sidebar (barra lateral izquierda) + versión móvil.

   Desktop (>768px): barra lateral fija de 248px, idéntica a la versión
   anterior. Empuja el contenido con padding-left en #root.

   Móvil (≤768px): la barra lateral se OCULTA fuera de pantalla y aparece
   una barra superior con botón ☰. Al tocarlo, la barra lateral entra
   deslizándose como cajón (drawer) sobre un fondo oscuro. El contenido usa
   el ancho completo (padding-top en vez de padding-left). Esto arregla el
   problema de que todo se veía apretado en celulares.

   Se mantiene el nombre "Navbar" para no tocar los imports de las páginas.
═══════════════════════════════════════════════════════════════ */

const SIDEBAR_W = 248
const MOBILE_BREAKPOINT = 768
const TOPBAR_H = 56

// Íconos SVG de línea (consistentes, no emojis)
const Icons = {
  home: (p) => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 9.5 12 3l9 6.5V21a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/><path d="M9 22V12h6v10"/></svg>,
  calendar: (p) => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  users: (p) => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  scissors: (p) => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12"/></svg>,
  crown: (p) => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m2 7 5 5 5-7 5 7 5-5-2 12H4L2 7z"/></svg>,
  settings: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  logout: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>,
  link: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  share: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/></svg>,
  menu: (p) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 12h18M3 6h18M3 18h18"/></svg>,
  close: (p) => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M18 6 6 18M6 6l12 12"/></svg>,
}

const baseLinks = [
  { to: '/dashboard',    label: 'Inicio',    icon: Icons.home },
  { to: '/appointments', label: 'Agenda',    icon: Icons.calendar },
  { to: '/barbers',      label: 'Barberos',  icon: Icons.users },
  { to: '/services',     label: 'Servicios', icon: Icons.scissors },
]

export default function Navbar() {
  const { barbershop, logout } = useAuth()
  const location  = useLocation()
  const navigate  = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const ref = useRef(null)

  // ¿Estamos en móvil? Se recalcula al cambiar el tamaño de la ventana.
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' &&
      window.matchMedia(`(max-width:${MOBILE_BREAKPOINT}px)`).matches
  )
  useEffect(() => {
    const mq = window.matchMedia(`(max-width:${MOBILE_BREAKPOINT}px)`)
    const onChange = () => setIsMobile(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const links = barbershop?.is_super_admin
    ? [...baseLinks, { to: '/admin', label: 'Panel', icon: Icons.crown }]
    : baseLinks

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Empuja el contenido: en desktop a la derecha del sidebar (padding-left),
  // en móvil hacia abajo de la barra superior (padding-top, ancho completo).
  useEffect(() => {
    const root = document.getElementById('root')
    if (!root) return
    if (isMobile) {
      root.style.paddingLeft = ''
      root.style.paddingTop  = TOPBAR_H + 'px'
    } else {
      root.style.paddingLeft = SIDEBAR_W + 'px'
      root.style.paddingTop  = ''
    }
    root.style.transition = 'padding 0.2s'
    return () => { root.style.paddingLeft = ''; root.style.paddingTop = '' }
  }, [isMobile])

  // Al cambiar de página, cerrar el cajón móvil.
  useEffect(() => { setDrawerOpen(false) }, [location.pathname])

  const handleLogout = () => { logout(); navigate('/login') }

  const statusLabel = { trial:'PERÍODO DE PRUEBA', active:'ACTIVO', blocked:'BLOQUEADO' }
  const statusColor = { trial:'var(--gold)', active:'var(--success)', blocked:'var(--danger)' }
  const status = barbershop?.subscription_status || 'trial'

  const reservarUrl = window.location.origin + '/reservar/' + (barbershop?.slug || '')
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&margin=0&color=1A1A1A&bgcolor=FFFFFF&data=${encodeURIComponent(reservarUrl)}`

  const isActive = (to) => location.pathname === to || location.pathname.startsWith(to + '/')

  // Estilo de la barra lateral: en móvil se desliza (translateX) según drawerOpen.
  const asideStyle = {
    position:'fixed', top:0, left:0, bottom:0, width:SIDEBAR_W,
    background:'var(--dark-2)', borderRight:'1px solid var(--dark-4)',
    display:'flex', flexDirection:'column',
    zIndex: isMobile ? 160 : 100,
    overflowY:'auto',
    transform: (isMobile && !drawerOpen) ? 'translateX(-100%)' : 'translateX(0)',
    transition:'transform 0.25s ease',
    boxShadow: (isMobile && drawerOpen) ? '4px 0 32px rgba(0,0,0,0.5)' : 'none',
  }

  return (
    <>
      {/* Barra superior — solo en móvil */}
      {isMobile && (
        <header style={{ position:'fixed', top:0, left:0, right:0, height:TOPBAR_H, background:'var(--dark-2)', borderBottom:'1px solid var(--dark-4)', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px', zIndex:150 }}>
          <Link to="/" style={{ display:'flex', alignItems:'center', gap:8, textDecoration:'none' }}>
            <span style={{ color:'var(--gold)', display:'flex' }}>{Icons.scissors({ width:20, height:20 })}</span>
            <span style={{ fontFamily:'var(--font-display, Georgia, serif)', fontWeight:800, fontSize:19, color:'var(--cream)' }}>
              Barber<span style={{ color:'var(--gold)' }}>soft</span>
            </span>
          </Link>
          <button
            onClick={() => setDrawerOpen(o => !o)}
            aria-label="Abrir menú"
            style={{ background:'transparent', border:'none', color:'var(--cream)', cursor:'pointer', display:'flex', padding:6 }}
          >
            {drawerOpen ? Icons.close() : Icons.menu()}
          </button>
        </header>
      )}

      {/* Fondo oscuro detrás del cajón — solo en móvil cuando está abierto */}
      {isMobile && drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:140 }}
        />
      )}

      <aside style={asideStyle}>

        {/* Logo (oculto en móvil porque ya está en la barra superior) */}
        {!isMobile && (
          <Link to="/" style={{ display:'flex', alignItems:'center', gap:9, textDecoration:'none', padding:'22px 22px 20px' }}>
            <span style={{ color:'var(--gold)', display:'flex' }}>{Icons.scissors({ width:22, height:22 })}</span>
            <span style={{ fontFamily:'var(--font-display, Georgia, serif)', fontWeight:800, fontSize:21, color:'var(--cream)' }}>
              Barber<span style={{ color:'var(--gold)' }}>soft</span>
            </span>
          </Link>
        )}

        {/* Módulos */}
        <nav style={{ display:'flex', flexDirection:'column', gap:4, padding: isMobile ? '18px 14px 6px' : '6px 14px' }}>
          {links.map(link => {
            const active = isActive(link.to)
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setDrawerOpen(false)}
                style={{
                  display:'flex', alignItems:'center', gap:12, padding:'11px 14px', borderRadius:11, textDecoration:'none',
                  background: active ? 'rgba(201,168,76,0.12)' : 'transparent',
                  color: active ? 'var(--gold)' : 'var(--cream-dim)',
                  fontSize:14, fontWeight: active ? 700 : 500,
                  borderLeft: active ? '2px solid var(--gold)' : '2px solid transparent',
                  transition:'all 0.15s',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.background='var(--dark-3)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background='transparent' }}
              >
                <span style={{ display:'flex' }}>{link.icon()}</span>
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Espaciador */}
        <div style={{ flex:1 }} />

        {/* QR + enlace de reservas */}
        <div style={{ margin:'0 14px 14px', padding:16, background:'var(--dark-3)', border:'1px solid var(--dark-4)', borderRadius:14 }}>
          <p style={{ color:'var(--cream-dim)', fontSize:10, letterSpacing:'0.08em', fontWeight:700, marginBottom:10, textTransform:'uppercase' }}>Tu enlace de reservas</p>
          <div style={{ background:'#FFFFFF', padding:8, borderRadius:10, display:'flex', justifyContent:'center', marginBottom:10 }}>
            <img src={qrSrc} alt="QR de reservas" width={120} height={120} style={{ display:'block', borderRadius:4 }} />
          </div>
          <p style={{ color:'var(--cream-dim)', fontSize:10.5, fontFamily:'monospace', wordBreak:'break-all', lineHeight:1.4, marginBottom:10, textAlign:'center' }}>
            /reservar/{barbershop?.slug}
          </p>
          <button
            onClick={() => { navigator.clipboard.writeText(reservarUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
            style={{ width:'100%', display:'inline-flex', alignItems:'center', justifyContent:'center', gap:7, background: copied ? 'rgba(201,168,76,0.15)' : 'var(--gold)', color: copied ? 'var(--gold)' : 'var(--dark)', border:'none', padding:'9px 0', borderRadius:9, cursor:'pointer', fontSize:12, fontWeight:700, marginBottom:8 }}
          >
            {copied ? '✓ Copiado' : <>{Icons.link()} Copiar enlace</>}
          </button>
          <button
            onClick={async () => {
              const shareData = { title: barbershop?.name || 'Barbería', text: 'Reserva tu cita aquí:', url: reservarUrl }
              if (navigator.share) { try { await navigator.share(shareData) } catch { /* cancelado */ } }
              else { navigator.clipboard.writeText(reservarUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) }
            }}
            style={{ width:'100%', display:'inline-flex', alignItems:'center', justifyContent:'center', gap:7, background:'transparent', color:'var(--cream)', border:'1px solid var(--dark-4)', padding:'9px 0', borderRadius:9, cursor:'pointer', fontSize:12, fontWeight:700 }}
            onMouseEnter={e => e.currentTarget.style.background='var(--dark-2)'}
            onMouseLeave={e => e.currentTarget.style.background='transparent'}
          >
            {Icons.share()} Compartir
          </button>
        </div>

        {/* Perfil */}
        <div ref={ref} style={{ position:'relative', borderTop:'1px solid var(--dark-4)', padding:12 }}>
          <button
            onClick={() => setProfileOpen(p => !p)}
            style={{ display:'flex', alignItems:'center', gap:10, width:'100%', background: profileOpen ? 'var(--dark-3)' : 'transparent', border:'none', borderRadius:10, padding:'8px 10px', cursor:'pointer' }}
          >
            <div style={{ width:34, height:34, borderRadius:'50%', background:'linear-gradient(135deg, var(--gold-dim), var(--gold))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontFamily:'var(--font-display, Georgia, serif)', fontWeight:900, color:'var(--dark)', flexShrink:0 }}>
              {barbershop?.name?.charAt(0).toUpperCase() || 'B'}
            </div>
            <div style={{ textAlign:'left', flex:1, minWidth:0 }}>
              <p style={{ fontSize:12.5, color:'var(--cream)', fontWeight:600, lineHeight:1.2, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{barbershop?.name}</p>
              <p style={{ fontSize:9.5, color: statusColor[status], letterSpacing:'0.06em', fontWeight:600, lineHeight:1.3 }}>{statusLabel[status]}</p>
            </div>
            <span style={{ color:'var(--cream-dim)', fontSize:10, opacity:0.6, transform: profileOpen ? 'rotate(180deg)' : 'none' }}>▾</span>
          </button>

          {profileOpen && (
            <div className="animate-fade-up" style={{ position:'absolute', bottom:'calc(100% + 6px)', left:12, right:12, background:'var(--dark-2)', border:'1px solid var(--dark-4)', borderRadius:12, padding:6, boxShadow:'0 8px 32px rgba(0,0,0,0.5)', zIndex:200 }}>
              {[
                { icon: Icons.settings, label:'Configuración', action:() => { navigate('/settings'); setProfileOpen(false); setDrawerOpen(false) } },
                { icon: Icons.crown,    label:'Suscripción',   action:() => { navigate('/subscription'); setProfileOpen(false); setDrawerOpen(false) } },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={item.action}
                  style={{ display:'flex', alignItems:'center', gap:10, width:'100%', background:'transparent', border:'none', padding:'9px 12px', borderRadius:8, cursor:'pointer', color:'var(--cream)', fontSize:13, textAlign:'left' }}
                  onMouseEnter={e => e.currentTarget.style.background='var(--dark-3)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                >
                  <span style={{ opacity:0.7, display:'flex' }}>{item.icon()}</span>
                  {item.label}
                </button>
              ))}
              <div style={{ height:1, background:'var(--dark-4)', margin:'4px 0' }} />
              <button
                onClick={handleLogout}
                style={{ display:'flex', alignItems:'center', gap:10, width:'100%', background:'transparent', border:'none', padding:'9px 12px', borderRadius:8, cursor:'pointer', color:'var(--danger)', fontSize:13, textAlign:'left' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(224,82,82,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}
              >
                <span style={{ opacity:0.7, display:'flex' }}>{Icons.logout()}</span>
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
