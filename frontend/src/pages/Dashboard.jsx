import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import HelpButton from '../components/HelpButton'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

function formatDate() {
  return new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}

function trialDaysLeft(trial_ends_at) {
  if (!trial_ends_at) return 0
  const diff = new Date(trial_ends_at) - new Date()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

const statusColor = { pending: '#E8C97A', confirmed: '#5B8DEF', cancelled: '#E05252', done: '#4CAF7D' }
const statusLabel = { pending: 'Pendiente', confirmed: 'Confirmada', cancelled: 'Cancelada', done: 'Completada' }
const statusBg    = { pending: 'rgba(232,201,122,0.12)', confirmed: 'rgba(91,141,239,0.12)', cancelled: 'rgba(224,82,82,0.12)', done: 'rgba(76,175,125,0.12)' }

export default function Dashboard() {
  const { barbershop } = useAuth()
  const { pathname }   = useLocation()
  const [appointments, setAppointments] = useState([])
  const [loaded, setLoaded]   = useState(false)
const [copied, setCopied]   = useState(false)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    api.get('/appointments?date=' + today)
      .then(res => { setAppointments(res.data.appointments); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [])

  const pending   = appointments.filter(a => a.status === 'pending').length
  const confirmed = appointments.filter(a => a.status === 'confirmed').length
  const isTrial   = barbershop?.subscription_status === 'trial'
  const daysLeft  = trialDaysLeft(barbershop?.trial_ends_at)

  const stats = [
    { label: 'CITAS HOY',    value: appointments.length, color: 'var(--gold)' },
    { label: 'PENDIENTES',   value: pending,              color: '#E8C97A' },
    { label: 'CONFIRMADAS',  value: confirmed,            color: 'var(--success)' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)' }}>
      <Navbar />
      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px' }}>

        {/* Banner trial */}
        {isTrial && (
          <div className="animate-fade-up" style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05))', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 12, padding: '16px 24px', marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: 'var(--gold)', fontWeight: 600, fontSize: 14 }}>
                ◆ Período de prueba — {daysLeft} días restantes
              </p>
              <p style={{ color: 'var(--cream-dim)', fontSize: 12, marginTop: 2 }}>
                Activá tu suscripción para mantener el acceso a todas las funciones
              </p>
            </div>
            <a href="/subscription" style={{ background: 'var(--gold)', color: 'var(--dark)', padding: '8px 20px', borderRadius: 8, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textDecoration: 'none' }}>
              VER PLANES
            </a>
          </div>
        )}

        {/* Header */}
        <div className="animate-fade-up delay-1" style={{ marginBottom: 32 }}>
          <p style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: '0.1em', fontWeight: 600, marginBottom: 6 }}>
            {formatDate().toUpperCase()}
          </p>
          <h1 style={{ fontSize: 42, fontWeight: 900, color: 'var(--cream)', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
  Hola, {barbershop?.name?.split(' ')[0]}
</h1>

{/* Link de reservas */}
<div style={{ display:'flex', alignItems:'center', gap:10, marginTop:14, background:'var(--dark-2)', border:'1px solid var(--dark-4)', borderRadius:10, padding:'10px 16px', width:'fit-content' }}>
  <span style={{ color:'var(--cream-dim)', fontSize:12 }}>🔗</span>
  <span style={{ color:'var(--cream-dim)', fontSize:12, fontFamily:'monospace' }}>
    /reservar/{barbershop?.slug}
  </span>
  <button
    onClick={() => {
      navigator.clipboard.writeText(window.location.origin + '/reservar/' + barbershop?.slug)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }}
    style={{ background: copied ? 'rgba(76,175,125,0.15)' : 'var(--dark-3)', border:'1px solid ' + (copied ? 'rgba(76,175,125,0.3)' : 'var(--dark-4)'), color: copied ? '#4CAF7D' : 'var(--cream-dim)', padding:'4px 12px', borderRadius:6, cursor:'pointer', fontSize:11, fontWeight:700, letterSpacing:'0.06em', fontFamily:'DM Sans', transition:'all 0.2s' }}
  >
    {copied ? '✓ COPIADO' : 'COPIAR'}
  </button>
</div>
        </div>

        {/* Stats */}
        <div className="animate-fade-up delay-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          {stats.map((stat, i) => (
            <div key={stat.label} style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-4)', borderRadius: 12, padding: '24px 28px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: stat.color, opacity: 0.6 }} />
              <p style={{ fontSize: 11, letterSpacing: '0.08em', color: 'var(--cream-dim)', fontWeight: 600, marginBottom: 12 }}>{stat.label}</p>
              <p style={{ fontSize: 48, fontWeight: 900, color: stat.color, lineHeight: 1, fontFamily: 'Playfair Display' }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Citas de hoy */}
        <div className="animate-fade-up delay-3" style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-4)', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--dark-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 18, color: 'var(--cream)', fontWeight: 700 }}>Citas de hoy</h2>
            <a href="/appointments" style={{ fontSize: 12, color: 'var(--gold)', letterSpacing: '0.06em', textDecoration: 'none', fontWeight: 600 }}>VER TODAS →</a>
          </div>

          {!loaded ? (
            <p style={{ color: 'var(--cream-dim)', fontSize: 14, textAlign: 'center', padding: '48px 0' }}>Cargando...</p>
          ) : appointments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <p style={{ fontSize: 32, marginBottom: 12 }}>◷</p>
              <p style={{ color: 'var(--cream-dim)', fontSize: 14 }}>No hay citas para hoy</p>
            </div>
          ) : (
            appointments.map((a, i) => (
              <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 28px', borderBottom: i < appointments.length - 1 ? '1px solid var(--dark-3)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ background: 'var(--dark-3)', borderRadius: 8, padding: '8px 12px', textAlign: 'center', minWidth: 56 }}>
                    <p style={{ color: 'var(--gold)', fontSize: 15, fontWeight: 700 }}>{formatTime(a.scheduled_at)}</p>
                  </div>
                  <div>
                    <p style={{ color: 'var(--cream)', fontWeight: 600, fontSize: 14 }}>{a.client_name}</p>
                    <p style={{ color: 'var(--cream-dim)', fontSize: 12, marginTop: 2 }}>{a.service_name} · {a.barber_name}</p>
                  </div>
                </div>
                <span style={{ background: statusBg[a.status], color: statusColor[a.status], fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, letterSpacing: '0.06em' }}>
                  {statusLabel[a.status].toUpperCase()}
                </span>
              </div>
            ))
          )}
        </div>

      <Footer />
      </main>
      <HelpButton path={pathname} />
    </div>
  )
}