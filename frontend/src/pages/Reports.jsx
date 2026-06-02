import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import HelpButton from '../components/HelpButton'
import api from '../services/api'

const formatPrice = (p) => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', minimumFractionDigits: 0
}).format(p || 0)

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background:'var(--dark-2)', border:'1px solid var(--dark-4)', borderRadius:12, padding:'24px 20px', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:color, opacity:0.6 }} />
      <p style={{ fontSize:11, letterSpacing:'0.08em', color:'var(--cream-dim)', fontWeight:600, marginBottom:10 }}>{label}</p>
      <p style={{ fontSize:28, fontWeight:900, color:color, lineHeight:1, fontFamily:'Playfair Display', marginBottom:6, wordBreak:'break-word' }}>{value}</p>
      {sub && <p style={{ fontSize:12, color:'var(--cream-dim)', opacity:0.7 }}>{sub}</p>}
    </div>
  )
}

function Bar({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ marginBottom:14 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
        <span style={{ color:'var(--cream)', fontSize:13 }}>{label}</span>
        <span style={{ color:color, fontSize:13, fontWeight:700 }}>{value}</span>
      </div>
      <div style={{ height:5, background:'var(--dark-3)', borderRadius:3, overflow:'hidden' }}>
        <div style={{ height:'100%', width:pct+'%', background:color, borderRadius:3, transition:'width 0.8s ease' }} />
      </div>
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

  const maxDaily = data && data.dailyAppointments.length > 0
    ? Math.max(...data.dailyAppointments.map(d => parseInt(d.count)))
    : 1

  return (
    <div style={{ minHeight:'100vh', background:'var(--dark)' }}>
      <Navbar />
      <main style={{ maxWidth:1000, margin:'0 auto', padding:'40px 24px' }}>

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
          <div style={{ background:'rgba(224,82,82,0.1)', border:'1px solid rgba(224,82,82,0.3)', color:'#E05252', borderRadius:10, padding:'14px 18px', marginBottom:24, fontSize:13 }}>
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
                color="var(--success)"
              />
              <StatCard
                label="SERVICIO TOP"
                value={data.topService?.name || '—'}
                sub={data.topService ? data.topService.count + ' veces' : 'Sin datos'}
                color="var(--gold)"
              />
              <StatCard
                label="MEJOR CLIENTE"
                value={data.topClient?.client_name || '—'}
                sub={data.topClient ? formatPrice(data.topClient.total) + ' · ' + data.topClient.visits + ' visitas' : 'Sin datos'}
                color="var(--cream)"
              />
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>

              {/* Estado de citas */}
              <div className="animate-fade-up delay-2" style={{ background:'var(--dark-2)', border:'1px solid var(--dark-4)', borderRadius:12, padding:24 }}>
                <p style={{ color:'var(--cream-dim)', fontSize:11, letterSpacing:'0.08em', fontWeight:600, marginBottom:20 }}>CITAS POR ESTADO</p>
                <Bar label="Completadas" value={data.statuses.done}      max={total} color="var(--success)" />
                <Bar label="Pendientes"  value={data.statuses.pending}   max={total} color="var(--gold)"    />
                <Bar label="Confirmadas" value={data.statuses.confirmed} max={total} color="var(--cream-dim)" />
                <Bar label="Canceladas"  value={data.statuses.cancelled} max={total} color="var(--danger)"  />
              </div>

              {/* Ingresos por servicio */}
              <div className="animate-fade-up delay-2" style={{ background:'var(--dark-2)', border:'1px solid var(--dark-4)', borderRadius:12, padding:24 }}>
                <p style={{ color:'var(--cream-dim)', fontSize:11, letterSpacing:'0.08em', fontWeight:600, marginBottom:20 }}>INGRESOS POR SERVICIO</p>
                {data.revenueByService.length === 0 ? (
                  <p style={{ color:'var(--cream-dim)', fontSize:13, textAlign:'center', padding:'24px 0', opacity:0.6 }}>Sin datos este mes</p>
                ) : data.revenueByService.map((s, i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom: i < data.revenueByService.length-1 ? '1px solid var(--dark-3)' : 'none' }}>
                    <div>
                      <p style={{ color:'var(--cream)', fontSize:13, fontWeight:500 }}>{s.name}</p>
                      <p style={{ color:'var(--cream-dim)', fontSize:11, marginTop:2 }}>{s.count} citas</p>
                    </div>
                    <p style={{ color:'var(--gold)', fontFamily:'Playfair Display', fontWeight:700, fontSize:15 }}>{formatPrice(s.total)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Citas por día */}
            <div className="animate-fade-up delay-3" style={{ background:'var(--dark-2)', border:'1px solid var(--dark-4)', borderRadius:12, padding:24 }}>
              <p style={{ color:'var(--cream-dim)', fontSize:11, letterSpacing:'0.08em', fontWeight:600, marginBottom:20 }}>CITAS POR DÍA</p>
              {data.dailyAppointments.length === 0 ? (
                <p style={{ color:'var(--cream-dim)', fontSize:13, textAlign:'center', padding:'24px 0', opacity:0.6 }}>Sin citas este mes</p>
              ) : (
                <div style={{ display:'flex', alignItems:'flex-end', gap:4, height:100 }}>
                  {data.dailyAppointments.map((d, i) => {
                    const pct = Math.round((parseInt(d.count) / maxDaily) * 100)
                    const day = new Date(d.date).getDate()
                    return (
                      <div key={i} title={`Día ${day}: ${d.count} cita(s)`} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4, cursor:'default' }}>
                        <div style={{ width:'100%', height:pct+'%', minHeight:4, background:'var(--gold)', borderRadius:'3px 3px 0 0', opacity:0.75, transition:'height 0.5s ease' }} />
                        <p style={{ color:'var(--cream-dim)', fontSize:9 }}>{day}</p>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}

        <Footer />
      </main>
      <HelpButton path={pathname} />
    </div>
  )
}