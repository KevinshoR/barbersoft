import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import HelpButton from '../components/HelpButton'
import api from '../services/api'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

const formatPrice = (p) => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', minimumFractionDigits: 0
}).format(p || 0)

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background:'var(--dark-2)', border:'1px solid var(--dark-4)', borderRadius:12, padding:'24px 20px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:color, opacity:0.6 }} />
      <p style={{ fontSize:11, letterSpacing:'0.08em', color:'var(--cream-dim)', fontWeight:600, marginBottom:10 }}>{label}</p>
      <p style={{ fontSize:28, fontWeight:900, color:color, lineHeight:1, fontFamily: 'var(--font-display)', marginBottom:6, wordBreak:'break-word' }}>{value}</p>
      {sub && <p style={{ fontSize:12, color:'var(--cream-dim)', opacity:0.7 }}>{sub}</p>}
    </div>
  )
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

export default function Reports() {
  const { pathname }    = useLocation()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')
  const [month, setMonth]     = useState(new Date().toISOString().slice(0, 7))

  useEffect(() => { fetchReport() }, [month])

  const fetchReport = () => {
    setLoading(true)
    setError('')
    api.get('/reports/monthly?month=' + month)
      .then(res => setData(res.data))
      .catch(() => setError('Error cargando el reporte. Verificá que el backend esté corriendo.'))
      .finally(() => setLoading(false))
  }

  const total = data
    ? (data.statuses.pending + data.statuses.confirmed + data.statuses.done + data.statuses.cancelled)
    : 0

  const statusChartData = data ? [
    { key: 'pending',   label: 'Pendientes',  value: data.statuses.pending,   opacity: 1 },
    { key: 'confirmed', label: 'Confirmadas', value: data.statuses.confirmed, opacity: 0.8 },
    { key: 'done',      label: 'Completadas', value: data.statuses.done,      opacity: 0.6 },
    { key: 'cancelled', label: 'Canceladas',  value: data.statuses.cancelled, opacity: 0.4 },
  ] : []

  const dailyChartData = data
    ? data.dailyAppointments.map(d => ({ day: new Date(d.date).getDate(), count: parseInt(d.count) }))
    : []

  const revenueByServiceChartData = data
    ? data.revenueByService.map(s => ({ name: s.name, total: parseFloat(s.total), count: s.count }))
    : []

  return (
    <div style={{ minHeight:'100vh', background:'var(--dark)', display:'flex', flexDirection:'column' }}>
      <Navbar />
      <main style={{ maxWidth:1000, margin:'0 auto', padding:'40px 24px', flex:1, width:'100%' }}>

        {/* Header */}
        <div className="animate-fade-up" style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:32 }}>
          <div>
            <p style={{ color:'var(--gold)', fontSize:11, letterSpacing:'0.1em', fontWeight:600, marginBottom:4 }}>ANÁLISIS</p>
            <h1 style={{ fontSize:36, fontWeight:900, color:'var(--cream)' }}>Reportes</h1>
          </div>
          <input
            type="month"
            value={month}
            onChange={e => setMonth(e.target.value)}
            style={{ padding:'10px 16px', fontSize:14 }}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{ background:'rgba(232,201,122,0.1)', border:'1px solid rgba(232,201,122,0.3)', color:'#E8C97A', borderRadius:10, padding:'14px 18px', marginBottom:24, fontSize:13 }}>
            ⚠ {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <p style={{ color:'var(--cream-dim)', textAlign:'center', padding:'80px 0', fontSize:14 }}>
            Cargando reporte...
          </p>
        )}

        {/* Contenido */}
        {!loading && data && (
          <>
            {/* Stats */}
            <div className="animate-fade-up delay-1" style={{ display:'grid', gridTemplateColumns:'repeat(5, 1fr)', gap:14, marginBottom:20 }}>
              <StatCard
                label="INGRESOS"
                value={formatPrice(data.revenue)}
                sub="Citas completadas"
                color="var(--gold)"
              />
              <StatCard
                label="TOTAL CITAS"
                value={total}
                sub={data.statuses.done + ' completadas'}
                color="var(--cream)"
              />
              <StatCard
                label="MEJOR BARBERO"
                value={data.topBarber?.name || '—'}
                sub={data.topBarber ? data.topBarber.count + ' citas' : 'Sin datos'}
                color="var(--gold)"
              />
              <StatCard
                label="SERVICIO TOP"
                value={data.topService?.name || '—'}
                sub={data.topService ? data.topService.count + ' veces' : 'Sin datos'}
                color="var(--gold-light)"
              />
              <StatCard
                label="MEJOR CLIENTE"
                value={data.topClient?.client_name || '—'}
                sub={data.topClient ? formatPrice(data.topClient.total) + ' · ' + data.topClient.visits + ' visitas' : 'Sin datos'}
                color="var(--cream-dim)"
              />
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>

              {/* Estado de citas */}
              <div className="animate-fade-up delay-2" style={{ background:'var(--dark-2)', border:'1px solid var(--dark-4)', borderRadius:12, padding:24 }}>
                <p style={{ color:'var(--gold)', fontSize:11, letterSpacing:'0.08em', fontWeight:700, marginBottom:20 }}>CITAS POR ESTADO</p>
                {total === 0 ? (
                  <p style={{ color:'var(--cream-dim)', fontSize:13, textAlign:'center', padding:'40px 0', opacity:0.6 }}>Sin citas este mes</p>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={statusChartData} layout="vertical" margin={{ top:4, right:16, left:4, bottom:0 }}>
                      <CartesianGrid stroke="var(--dark-4)" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fill:'var(--cream-dim)', fontSize:11 }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="label" tick={{ fill:'var(--cream)', fontSize:11 }} axisLine={false} tickLine={false} width={82} />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill:'rgba(201,168,76,0.08)' }} />
                      <Bar dataKey="value" radius={[0,4,4,0]} maxBarSize={18}>
                        {statusChartData.map(s => <Cell key={s.key} fill="var(--gold)" fillOpacity={s.opacity} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Ingresos por servicio */}
              <div className="animate-fade-up delay-2" style={{ background:'var(--dark-2)', border:'1px solid var(--dark-4)', borderRadius:12, padding:24 }}>
                <p style={{ color:'var(--gold)', fontSize:11, letterSpacing:'0.08em', fontWeight:700, marginBottom:20 }}>INGRESOS POR SERVICIO</p>
                {revenueByServiceChartData.length === 0 ? (
                  <p style={{ color:'var(--cream-dim)', fontSize:13, textAlign:'center', padding:'40px 0', opacity:0.6 }}>Sin datos este mes</p>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={revenueByServiceChartData} layout="vertical" margin={{ top:4, right:16, left:4, bottom:0 }}>
                      <CartesianGrid stroke="var(--dark-4)" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fill:'var(--cream-dim)', fontSize:10 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? (v/1000)+'K' : v} />
                      <YAxis type="category" dataKey="name" tick={{ fill:'var(--cream)', fontSize:11 }} axisLine={false} tickLine={false} width={90} />
                      <Tooltip content={<ChartTooltip formatter={formatPrice} />} cursor={{ fill:'rgba(201,168,76,0.08)' }} />
                      <Bar dataKey="total" fill="var(--gold)" radius={[0,4,4,0]} maxBarSize={18} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Citas por día */}
            <div className="animate-fade-up delay-3" style={{ background:'var(--dark-2)', border:'1px solid var(--dark-4)', borderRadius:12, padding:24 }}>
              <p style={{ color:'var(--gold)', fontSize:11, letterSpacing:'0.08em', fontWeight:700, marginBottom:20 }}>CITAS POR DÍA</p>
              {dailyChartData.length === 0 ? (
                <p style={{ color:'var(--cream-dim)', fontSize:13, textAlign:'center', padding:'24px 0', opacity:0.6 }}>Sin citas este mes</p>
              ) : (
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={dailyChartData} margin={{ top:4, right:4, left:-20, bottom:0 }}>
                    <CartesianGrid stroke="var(--dark-4)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fill:'var(--cream-dim)', fontSize:10 }} axisLine={{ stroke:'var(--dark-4)' }} tickLine={false} />
                    <YAxis allowDecimals={false} tick={{ fill:'var(--cream-dim)', fontSize:11 }} axisLine={false} tickLine={false} width={28} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill:'rgba(201,168,76,0.08)' }} />
                    <Bar dataKey="count" name="Citas" fill="var(--gold)" radius={[3,3,0,0]} maxBarSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </>
        )}

      </main>
      <Footer />
      <HelpButton path={pathname} />
    </div>
  )
}