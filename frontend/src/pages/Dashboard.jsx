import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import HelpButton from '../components/HelpButton'
import { useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts'

function formatDate() {
  return new Date().toLocaleDateString('es-CO', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}
function greeting() {
  const h = parseInt(new Intl.DateTimeFormat('en-US', { timeZone: 'America/Bogota', hour: '2-digit', hour12: false }).format(new Date()), 10)
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}
function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
}
function trialDaysLeft(trial_ends_at) {
  if (!trial_ends_at) return 0
  const diff = new Date(trial_ends_at) - new Date()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}
function formatPrice(p) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(p || 0)
}

const statusMeta = {
  pending:   { label: 'Pendiente',  color: 'var(--gold)',       bg: 'rgba(201,168,76,0.12)' },
  confirmed: { label: 'Confirmada', color: 'var(--gold-light)', bg: 'rgba(232,201,122,0.12)' },
  done:      { label: 'Completada', color: 'var(--cream-dim)',  bg: 'rgba(184,176,160,0.12)' },
  cancelled: { label: 'Cancelada',  color: 'var(--gold-dim)',   bg: 'rgba(139,105,20,0.18)' },
}

const DAY_ABBR = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function lastSevenDayKeys() {
  const keys = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    keys.push(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(d))
  }
  return keys
}

// Íconos SVG (línea, estilo consistente con el resto de la app)
const Ic = {
  calendar: (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
  check: (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>,
  clock: (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  money: (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
}

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
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date())
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
  const todayRevenue = appointments.filter(a => a.status === 'done').reduce((sum, a) => sum + parseFloat(a.price || 0), 0)
  const isTrial   = barbershop?.subscription_status === 'trial'
  const daysLeft  = trialDaysLeft(barbershop?.trial_ends_at)

  // Ocupación de hoy: citas activas (no canceladas) sobre una jornada estándar
  // de referencia. Es una estimación visual, no un dato del backend.
  const activeToday = appointments.filter(a => a.status !== 'cancelled').length
  const CAPACITY_REF = 16 // franja de referencia para el % (no inventa datos, solo escala)
  const occupancy = Math.min(100, Math.round((activeToday / CAPACITY_REF) * 100))

  // KPIs superiores
  const kpis = [
    { label: 'Citas hoy',     value: appointments.length, icon: Ic.calendar, tint: 'var(--gold)' },
    { label: 'Confirmadas',   value: confirmed,           icon: Ic.check,    tint: 'var(--gold-light)', sub: appointments.length ? Math.round((confirmed / appointments.length) * 100) + '% del total' : null },
    { label: 'Pendientes',    value: pending,             icon: Ic.clock,    tint: 'var(--gold)', sub: pending ? 'Requieren revisión' : null },
    { label: 'Ingresos hoy',  value: formatPrice(todayRevenue), icon: Ic.money, tint: 'var(--gold-light)', isMoney: true },
  ]

  // Gráfico de ingresos últimos 7 días
  const dayKeys = lastSevenDayKeys()
  const weeklyData = dayKeys.map(key => {
    const dayAppts = weekAppointments.filter(a => a.scheduled_at.slice(0, 10) === key)
    const revenue  = dayAppts.filter(a => a.status === 'done').reduce((sum, a) => sum + parseFloat(a.price || 0), 0)
    const d = new Date(key + 'T00:00:00')
    return { label: DAY_ABBR[d.getDay()], revenue }
  })
  const weekTotal = weeklyData.reduce((s, d) => s + d.revenue, 0)
  const hasWeekRevenue = weekTotal > 0

  // Servicios más vendidos (del reporte mensual)
  const topServices = (monthly?.revenueByService || [])
    .slice()
    .sort((a, b) => parseInt(b.count) - parseInt(a.count))
    .slice(0, 5)
  const maxServiceCount = topServices.length ? parseInt(topServices[0].count) : 1

  const reservarUrl = window.location.origin + '/reservar/' + (barbershop?.slug || '')
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=0&color=C9A84C&bgcolor=161616&data=${encodeURIComponent(reservarUrl)}`

  const card = { background: 'var(--dark-2)', border: '1px solid var(--dark-4)', borderRadius: 14 }
  const sectionTitle = { color: 'var(--cream)', fontSize: 15, fontWeight: 700 }
  const kicker = { color: 'var(--gold)', fontSize: 11, letterSpacing: '0.08em', fontWeight: 700 }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 24px 60px', flex: 1, width: '100%' }}>

        {/* Banner trial */}
        {isTrial && (
          <div className="animate-fade-up" style={{ background: 'linear-gradient(135deg, rgba(201,168,76,0.15), rgba(201,168,76,0.05))', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 12, padding: '16px 24px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <p style={{ color: 'var(--gold)', fontWeight: 600, fontSize: 14 }}>◆ Período de prueba — {daysLeft} días restantes</p>
              <p style={{ color: 'var(--cream-dim)', fontSize: 12, marginTop: 2 }}>Activa tu suscripción para mantener el acceso a todas las funciones</p>
            </div>
            <a href="/subscription" style={{ background: 'var(--gold)', color: 'var(--dark)', padding: '8px 20px', borderRadius: 8, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textDecoration: 'none' }}>VER PLANES</a>
          </div>
        )}

        {/* Header */}
        <div className="animate-fade-up delay-1" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 34, fontWeight: 900, color: 'var(--cream)', letterSpacing: '-0.02em', lineHeight: 1.1, fontFamily: 'var(--font-display)' }}>
              {greeting()}, {barbershop?.name?.split(' ').slice(-1)[0] || barbershop?.name} 👋
            </h1>
            <p style={{ color: 'var(--cream-dim)', fontSize: 13, marginTop: 6, textTransform: 'capitalize' }}>{formatDate()}</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Link to="/appointments" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--gold)', color: 'var(--dark)', padding: '11px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
              <span style={{ fontSize: 16 }}>+</span> Nueva cita
            </Link>
            <Link to="/appointments" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--dark-2)', border: '1px solid var(--dark-4)', color: 'var(--cream)', padding: '11px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
              Ver agenda
            </Link>
          </div>
        </div>

        {/* KPIs */}
        <div className="animate-fade-up delay-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
          {kpis.map(k => (
            <div key={k.label} style={{ ...card, padding: '20px 22px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(201,168,76,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: k.tint, flexShrink: 0 }}>
                {k.icon()}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: k.isMoney ? 24 : 30, fontWeight: 800, color: 'var(--cream)', lineHeight: 1.1, letterSpacing: '-0.01em' }}>{k.value}</p>
                <p style={{ fontSize: 13, color: 'var(--cream-dim)', marginTop: 4 }}>{k.label}</p>
                {k.sub && <p style={{ fontSize: 11, color: 'var(--gold)', marginTop: 5, fontWeight: 600 }}>{k.sub}</p>}
              </div>
            </div>
          ))}
        </div>

        {/* Fila media: Agenda de hoy | Resumen del día | QR reservas */}
        <div className="animate-fade-up delay-2" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: 16, marginBottom: 24 }}>

          {/* Agenda de hoy */}
          <div style={{ ...card, overflow: 'hidden' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--dark-4)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h2 style={sectionTitle}>Agenda de hoy</h2>
              <Link to="/appointments" style={{ fontSize: 12, color: 'var(--gold)', textDecoration: 'none', fontWeight: 600 }}>Ver completa →</Link>
            </div>
            <div style={{ padding: '8px 0' }}>
              {!loaded ? (
                <p style={{ color: 'var(--cream-dim)', fontSize: 13, textAlign: 'center', padding: '40px 0' }}>Cargando...</p>
              ) : appointments.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <p style={{ color: 'var(--cream)', fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-display)' }}>Sin citas hoy</p>
                  <p style={{ color: 'var(--cream-dim)', fontSize: 12, marginTop: 4 }}>Comparte tu link de reservas para llenar la agenda.</p>
                </div>
              ) : (
                appointments.slice(0, 6).map((a, i) => {
                  const meta = statusMeta[a.status] || statusMeta.pending
                  return (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 22px', borderBottom: i < Math.min(appointments.length, 6) - 1 ? '1px solid var(--dark-3)' : 'none' }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
                      <div style={{ minWidth: 52 }}>
                        <p style={{ color: 'var(--gold)', fontSize: 14, fontWeight: 700 }}>{formatTime(a.scheduled_at)}</p>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: 'var(--cream)', fontWeight: 600, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.client_name}</p>
                        <p style={{ color: 'var(--cream-dim)', fontSize: 12, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.service_name} · {a.barber_name}</p>
                      </div>
                      <span style={{ background: meta.bg, color: meta.color, fontSize: 10.5, fontWeight: 700, padding: '4px 10px', borderRadius: 20, letterSpacing: '0.04em', flexShrink: 0 }}>
                        {meta.label}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Resumen del día */}
          <div style={{ ...card, padding: '18px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <p style={kicker}>RESUMEN DEL DÍA</p>
              <Link to="/appointments" style={{ fontSize: 11, color: 'var(--gold)', textDecoration: 'none' }}>Ver más</Link>
            </div>

            <p style={{ color: 'var(--cream-dim)', fontSize: 12, marginBottom: 6 }}>Ocupación</p>
            <p style={{ fontSize: 32, fontWeight: 800, color: 'var(--gold)', lineHeight: 1, letterSpacing: '-0.01em' }}>{occupancy}%</p>
            <div style={{ height: 8, background: 'var(--dark-3)', borderRadius: 20, marginTop: 10, marginBottom: 20, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: occupancy + '%', background: 'linear-gradient(90deg, var(--gold-dim), var(--gold))', borderRadius: 20 }} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, textAlign: 'center' }}>
              <div>
                <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--cream)' }}>{appointments.length}</p>
                <p style={{ fontSize: 10.5, color: 'var(--cream-dim)', marginTop: 2 }}>Totales</p>
              </div>
              <div>
                <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--cream)' }}>{confirmed}</p>
                <p style={{ fontSize: 10.5, color: 'var(--cream-dim)', marginTop: 2 }}>Confirmadas</p>
              </div>
              <div>
                <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--cream)' }}>{pending}</p>
                <p style={{ fontSize: 10.5, color: 'var(--cream-dim)', marginTop: 2 }}>Pendientes</p>
              </div>
            </div>
          </div>

          {/* QR + link de reservas */}
          <div style={{ ...card, padding: '18px 22px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <p style={{ ...kicker, alignSelf: 'flex-start', marginBottom: 14 }}>TU ENLACE DE RESERVAS</p>
            <div style={{ background: 'var(--dark-3)', padding: 10, borderRadius: 12, border: '1px solid var(--dark-4)' }}>
              <img src={qrSrc} alt="QR de reservas" width={150} height={150} style={{ display: 'block', borderRadius: 6 }} />
            </div>
            <p style={{ color: 'var(--cream-dim)', fontSize: 11.5, fontFamily: 'monospace', marginTop: 12, wordBreak: 'break-all', lineHeight: 1.4 }}>
              /reservar/{barbershop?.slug}
            </p>
            <button
              onClick={() => { navigator.clipboard.writeText(reservarUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
              style={{ marginTop: 12, width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: copied ? 'rgba(201,168,76,0.15)' : 'var(--gold)', color: copied ? 'var(--gold)' : 'var(--dark)', border: copied ? '1px solid rgba(201,168,76,0.3)' : 'none', padding: '10px 0', borderRadius: 10, cursor: 'pointer', fontSize: 12.5, fontWeight: 700, letterSpacing: '0.04em' }}
            >
              {copied ? '✓ Copiado' : '🔗 Copiar enlace'}
            </button>
          </div>
        </div>

        {/* Fila inferior: Ingresos 7 días | Servicios más vendidos */}
        <div className="animate-fade-up delay-3" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>

          {/* Ingresos últimos 7 días */}
          <div style={{ ...card, padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
              <p style={kicker}>INGRESOS · ÚLTIMOS 7 DÍAS</p>
            </div>
            <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--cream)', marginTop: 8, letterSpacing: '-0.01em' }}>{formatPrice(weekTotal)}</p>
            <p style={{ fontSize: 11, color: 'var(--cream-dim)', marginBottom: 12 }}>Total de la semana</p>
            {hasWeekRevenue ? (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={weeklyData} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="goldFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--gold)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="var(--gold)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--dark-4)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: 'var(--cream-dim)', fontSize: 11 }} axisLine={{ stroke: 'var(--dark-4)' }} tickLine={false} />
                  <YAxis tick={{ fill: 'var(--cream-dim)', fontSize: 10 }} axisLine={false} tickLine={false} width={44} tickFormatter={v => v >= 1000 ? '$' + (v / 1000) + 'K' : '$' + v} />
                  <Tooltip content={<ChartTooltip formatter={formatPrice} />} cursor={{ stroke: 'var(--dark-4)' }} />
                  <Area type="monotone" dataKey="revenue" name="Ingresos" stroke="var(--gold)" strokeWidth={2.5} fill="url(#goldFill)" dot={{ r: 3, fill: 'var(--gold)', strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ color: 'var(--cream-dim)', fontSize: 13, textAlign: 'center', padding: '48px 0', opacity: 0.6 }}>Aún no hay ingresos registrados esta semana</p>
            )}
          </div>

          {/* Servicios más vendidos */}
          <div style={{ ...card, padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <p style={kicker}>SERVICIOS MÁS VENDIDOS</p>
              <Link to="/services" style={{ fontSize: 11, color: 'var(--gold)', textDecoration: 'none' }}>Ver todos</Link>
            </div>
            {topServices.length === 0 ? (
              <p style={{ color: 'var(--cream-dim)', fontSize: 13, textAlign: 'center', padding: '40px 0', opacity: 0.6 }}>Sin datos del mes todavía</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {topServices.map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--dark-3)', color: 'var(--gold)', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                        <span style={{ color: 'var(--cream)', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                        <span style={{ color: 'var(--cream-dim)', fontSize: 13, fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>{s.count}</span>
                      </div>
                      <div style={{ height: 6, background: 'var(--dark-3)', borderRadius: 20, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: (parseInt(s.count) / maxServiceCount * 100) + '%', background: 'linear-gradient(90deg, var(--gold-dim), var(--gold))', borderRadius: 20 }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </main>
      <Footer />
      <HelpButton path={pathname} />
    </div>
  )
}