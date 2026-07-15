import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import HelpButton from '../components/HelpButton'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

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

const statusColor = { pending: '#C9A84C', confirmed: '#F5F0E8', cancelled: '#8B6914', done: '#B8B0A0' }
const statusLabel = { pending: 'Pendiente', confirmed: 'Confirmada', cancelled: 'Cancelada', done: 'Completada' }
const statusBg    = { pending: 'rgba(201,168,76,0.12)', confirmed: 'rgba(245,240,232,0.10)', cancelled: 'rgba(139,105,20,0.18)', done: 'rgba(184,176,160,0.12)' }

const DAY_ABBR = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

// Últimos 7 días (incluye hoy), como claves YYYY-MM-DD en orden cronológico
function lastSevenDayKeys() {
  const keys = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    keys.push(d.toISOString().slice(0, 10))
  }
  return keys
}

function formatPrice(p) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(p || 0)
}

// Tooltip propio (tema oscuro/dorado) — el default de Recharts es blanco y no encaja
function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload || !payload.length) return null
  return (
    <div style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-4)', borderRadius: 8, padding: '8px 12px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
      <p style={{ color: 'var(--cream-dim)', fontSize: 11, marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: 'var(--cream)', fontSize: 13, fontWeight: 700 }}>
          {formatter ? formatter(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const { barbershop } = useAuth()
  const { pathname }   = useLocation()
  const [appointments, setAppointments] = useState([])
  const [weekAppointments, setWeekAppointments] = useState([])
  const [loaded, setLoaded]   = useState(false)
const [copied, setCopied]   = useState(false)
  const [monthly, setMonthly] = useState(null)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    api.get('/appointments?date=' + today)
      .then(res => { setAppointments(res.data.appointments); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [])

  useEffect(() => {
    api.get('/appointments')
      .then(res => setWeekAppointments(res.data.appointments))
      .catch(() => setWeekAppointments([]))
  }, [])

  useEffect(() => {
    api.get('/reports/monthly')
      .then(res => setMonthly(res.data))
      .catch(() => setMonthly(null))
  }, [])

  const pending   = appointments.filter(a => a.status === 'pending').length
  const confirmed = appointments.filter(a => a.status === 'confirmed').length
  const isTrial   = barbershop?.subscription_status === 'trial'
  const daysLeft  = trialDaysLeft(barbershop?.trial_ends_at)

  const stats = [
    { label: 'CITAS HOY',    value: appointments.length, color: 'var(--gold)' },
    { label: 'PENDIENTES',   value: pending,              color: 'var(--gold-light)' },
    { label: 'CONFIRMADAS',  value: confirmed,            color: 'var(--gold-dim)' },
  ]

  // Últimos 7 días: citas (sin canceladas) e ingresos (citas completadas)
  const dayKeys = lastSevenDayKeys()
  const weeklyData = dayKeys.map(key => {
    const dayAppts = weekAppointments.filter(a => a.scheduled_at.slice(0, 10) === key)
    const count    = dayAppts.filter(a => a.status !== 'cancelled').length
    const revenue  = dayAppts.filter(a => a.status === 'done').reduce((sum, a) => sum + parseFloat(a.price || 0), 0)
    const d = new Date(key + 'T00:00:00')
    return { label: DAY_ABBR[d.getDay()], count, revenue }
  })
  const hasWeekRevenue = weeklyData.some(d => d.revenue > 0)

  // Distribución de citas por estado, últimos 7 días
  const weekStatusCounts = { pending: 0, confirmed: 0, done: 0, cancelled: 0 }
  weekAppointments
    .filter(a => dayKeys.includes(a.scheduled_at.slice(0, 10)))
    .forEach(a => { if (weekStatusCounts[a.status] !== undefined) weekStatusCounts[a.status]++ })

  const statusDistribution = [
    { key: 'pending',   label: 'Pendientes',  value: weekStatusCounts.pending,   opacity: 1 },
    { key: 'confirmed', label: 'Confirmadas', value: weekStatusCounts.confirmed, opacity: 0.8 },
    { key: 'done',      label: 'Completadas', value: weekStatusCounts.done,      opacity: 0.6 },
    { key: 'cancelled', label: 'Canceladas',  value: weekStatusCounts.cancelled, opacity: 0.4 },
  ]
  const hasWeekAppointments = weekStatusCounts.pending + weekStatusCounts.confirmed + weekStatusCounts.done + weekStatusCounts.cancelled > 0

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 24px', flex: 1, width: '100%' }}>

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
    style={{ background: copied ? 'rgba(201,168,76,0.15)' : 'var(--dark-3)', border:'1px solid ' + (copied ? 'rgba(201,168,76,0.3)' : 'var(--dark-4)'), color: copied ? '#C9A84C' : 'var(--cream-dim)', padding:'4px 12px', borderRadius:6, cursor:'pointer', fontSize:11, fontWeight:700, letterSpacing:'0.06em', fontFamily: 'var(--font-body)', transition:'all 0.2s' }}
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
              <p style={{ fontSize: 48, fontWeight: 900, color: stat.color, lineHeight: 1, fontFamily: 'var(--font-display)' }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Resumen del mes (3 métricas rescatadas del extinto módulo Reportes) */}
        {monthly && (
          <div className="animate-fade-up delay-2" style={{ marginBottom: 32 }}>
            <p style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: '0.08em', fontWeight: 700, marginBottom: 12, fontFamily: 'var(--font-body)' }}>
              RESUMEN DEL MES
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              <div style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-4)', borderRadius: 12, padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--gold)', opacity: 0.6 }} />
                <p style={{ fontSize: 11, letterSpacing: '0.08em', color: 'var(--cream-dim)', fontWeight: 600, marginBottom: 10 }}>INGRESOS DEL MES</p>
                <p style={{ fontSize: 26, fontWeight: 900, color: 'var(--gold)', fontFamily: 'var(--font-display)' }}>{formatPrice(monthly.revenue)}</p>
              </div>
              <div style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-4)', borderRadius: 12, padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--gold)', opacity: 0.6 }} />
                <p style={{ fontSize: 11, letterSpacing: '0.08em', color: 'var(--cream-dim)', fontWeight: 600, marginBottom: 10 }}>BARBERO DEL MES</p>
                <p style={{ fontSize: 20, fontWeight: 900, color: 'var(--cream)', fontFamily: 'var(--font-display)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {monthly.topBarber?.name || '—'}
                </p>
                {monthly.topBarber && (
                  <p style={{ fontSize: 11, color: 'var(--cream-dim)', marginTop: 4 }}>{monthly.topBarber.count} citas</p>
                )}
              </div>
              <div style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-4)', borderRadius: 12, padding: '20px 24px', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: 'var(--gold)', opacity: 0.6 }} />
                <p style={{ fontSize: 11, letterSpacing: '0.08em', color: 'var(--cream-dim)', fontWeight: 600, marginBottom: 10 }}>SERVICIO TOP</p>
                <p style={{ fontSize: 20, fontWeight: 900, color: 'var(--cream)', fontFamily: 'var(--font-display)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {monthly.topService?.name || '—'}
                </p>
                {monthly.topService && (
                  <p style={{ fontSize: 11, color: 'var(--cream-dim)', marginTop: 4 }}>{monthly.topService.count} veces</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Gráficas */}
        <div className="animate-fade-up delay-2" style={{ display: 'grid', gridTemplateColumns: hasWeekRevenue ? '1fr 1fr 1fr' : '1fr 1fr', gap: 16, marginBottom: 32 }}>

          {/* Citas por día (última semana) */}
          <div style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-4)', borderRadius: 12, padding: '20px 20px 12px' }}>
            <p style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: '0.08em', fontWeight: 700, marginBottom: 16 }}>CITAS · ÚLTIMOS 7 DÍAS</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weeklyData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid stroke="var(--dark-4)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: 'var(--cream-dim)', fontSize: 11 }} axisLine={{ stroke: 'var(--dark-4)' }} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fill: 'var(--cream-dim)', fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(201,168,76,0.08)' }} />
                <Bar dataKey="count" name="Citas" fill="var(--gold)" radius={[4, 4, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Distribución por estado */}
          <div style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-4)', borderRadius: 12, padding: '20px 20px 12px' }}>
            <p style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: '0.08em', fontWeight: 700, marginBottom: 16 }}>ESTADO · ÚLTIMOS 7 DÍAS</p>
            {hasWeekAppointments ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={statusDistribution} layout="vertical" margin={{ top: 4, right: 16, left: 4, bottom: 0 }}>
                  <CartesianGrid stroke="var(--dark-4)" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fill: 'var(--cream-dim)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="label" tick={{ fill: 'var(--cream)', fontSize: 11 }} axisLine={false} tickLine={false} width={78} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(201,168,76,0.08)' }} />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={18}>
                    {statusDistribution.map(s => <Cell key={s.key} fill="var(--gold)" fillOpacity={s.opacity} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: 'var(--cream-dim)', fontSize: 13, textAlign: 'center', padding: '48px 0', opacity: 0.6 }}>Sin citas esta semana</p>
            )}
          </div>

          {/* Ingresos por día (solo si hay citas completadas con precio) */}
          {hasWeekRevenue && (
            <div style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-4)', borderRadius: 12, padding: '20px 20px 12px' }}>
              <p style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: '0.08em', fontWeight: 700, marginBottom: 16 }}>INGRESOS · ÚLTIMOS 7 DÍAS</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={weeklyData} margin={{ top: 4, right: 4, left: -12, bottom: 0 }}>
                  <CartesianGrid stroke="var(--dark-4)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: 'var(--cream-dim)', fontSize: 11 }} axisLine={{ stroke: 'var(--dark-4)' }} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--cream-dim)', fontSize: 10 }} axisLine={false} tickLine={false} width={40} tickFormatter={v => v >= 1000 ? (v / 1000) + 'K' : v} />
                  <Tooltip content={<ChartTooltip formatter={formatPrice} />} cursor={{ stroke: 'var(--dark-4)' }} />
                  <Line type="monotone" dataKey="revenue" name="Ingresos" stroke="var(--gold)" strokeWidth={2} dot={{ r: 3, fill: 'var(--gold)', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
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

      </main>
      <Footer />
      <HelpButton path={pathname} />
    </div>
  )
}