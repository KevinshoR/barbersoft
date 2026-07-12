import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'

const formatPrice = (p) => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', minimumFractionDigits: 0
}).format(p)

const TODAY = new Date().getDay()

export default function ShopProfile() {
  const { slug }    = useParams()
  const navigate    = useNavigate()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    api.get('/public/' + slug)
      .then(res => setData(res.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#0A0A0A', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <p style={{ fontSize:40, color:'#C9A84C', marginBottom:12 }}>✂</p>
        <p style={{ color:'#B8B0A0', fontSize:13, letterSpacing:'0.1em' }}>CARGANDO...</p>
      </div>
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight:'100vh', background:'#0A0A0A', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <p style={{ fontSize:48, color:'#C9A84C', marginBottom:16 }}>✂</p>
        <h2 style={{ fontFamily:'Playfair Display', fontSize:28, color:'#F5F0E8', marginBottom:8 }}>Barbería no encontrada</h2>
        <p style={{ color:'#B8B0A0', fontSize:14 }}>Verificá que el enlace sea correcto</p>
      </div>
    </div>
  )

  const { shop, barbers, services, hours } = data
  const todayHours = hours?.find(h => h.day_of_week === TODAY)
  const isOpenToday = todayHours?.is_open

  return (
    <div style={{ minHeight:'100vh', background:'#0A0A0A', fontFamily:'DM Sans', paddingBottom:80 }}>

      {/* Header */}
      <div style={{ background:'#111', borderBottom:'1px solid #1A1A1A', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-80, left:'50%', transform:'translateX(-50%)', width:400, height:400, borderRadius:'50%', background:'radial-gradient(circle, rgba(201,168,76,0.08) 0%, transparent 70%)', pointerEvents:'none' }} />
        <div style={{ maxWidth:600, margin:'0 auto', padding:'48px 24px 36px', textAlign:'center', position:'relative', zIndex:1 }}>
          <div style={{ width:72, height:72, borderRadius:16, background:'rgba(201,168,76,0.1)', border:'1px solid rgba(201,168,76,0.25)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontSize:32, color:'#C9A84C' }}>
            ✂
          </div>
          <h1 style={{ fontFamily:'Playfair Display', fontSize:32, fontWeight:900, color:'#F5F0E8', marginBottom:10, letterSpacing:'-0.02em' }}>
            {shop.name}
          </h1>
          <div style={{ display:'flex', justifyContent:'center', gap:20, flexWrap:'wrap', marginBottom:16 }}>
            {shop.address && <p style={{ color:'#B8B0A0', fontSize:13 }}>📍 {shop.address}</p>}
            {shop.phone   && <p style={{ color:'#B8B0A0', fontSize:13 }}>📞 {shop.phone}</p>}
          </div>

          {/* Estado hoy */}
          {todayHours && (
            <div style={{ display:'inline-flex', alignItems:'center', gap:6, background: isOpenToday ? 'rgba(201,168,76,0.1)' : 'rgba(232,201,122,0.1)', border:'1px solid ' + (isOpenToday ? 'rgba(201,168,76,0.3)' : 'rgba(232,201,122,0.3)'), borderRadius:20, padding:'5px 14px', marginBottom:24 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background: isOpenToday ? '#C9A84C' : '#E8C97A' }} />
              <span style={{ color: isOpenToday ? '#C9A84C' : '#E8C97A', fontSize:12, fontWeight:700, letterSpacing:'0.06em' }}>
                {isOpenToday ? `ABIERTO HOY · ${todayHours.open_time} - ${todayHours.close_time}` : 'CERRADO HOY'}
              </span>
            </div>
          )}

          {/* Botones principales */}
          <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
            <button
              onClick={() => navigate(`/reservar/${slug}/cita`)}
              style={{ background:'#C9A84C', color:'#0A0A0A', border:'none', padding:'13px 32px', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:700, letterSpacing:'0.07em', fontFamily:'DM Sans', transition:'all 0.2s' }}
              onMouseEnter={e => { e.target.style.background='#E8C97A'; e.target.style.transform='translateY(-1px)' }}
              onMouseLeave={e => { e.target.style.background='#C9A84C'; e.target.style.transform='translateY(0)' }}
            >
              RESERVAR CITA →
            </button>
            <button
              onClick={() => navigate(`/reservar/${slug}/mis-citas`)}
              style={{ background:'transparent', color:'#B8B0A0', border:'1px solid #242424', padding:'13px 32px', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:600, letterSpacing:'0.07em', fontFamily:'DM Sans', transition:'all 0.2s' }}
              onMouseEnter={e => { e.target.style.borderColor='#C9A84C'; e.target.style.color='#C9A84C' }}
              onMouseLeave={e => { e.target.style.borderColor='#242424'; e.target.style.color='#B8B0A0' }}
            >
              VER MIS CITAS
            </button>
          </div>
        </div>
      </div>

      <main style={{ maxWidth:600, margin:'0 auto', padding:'32px 20px' }}>

        {/* Servicios */}
        <section style={{ marginBottom:36 }}>
          <p style={{ color:'#C9A84C', fontSize:11, letterSpacing:'0.1em', fontWeight:700, marginBottom:16 }}>SERVICIOS</p>
          <div style={{ background:'#111', border:'1px solid #1A1A1A', borderRadius:14, overflow:'hidden' }}>
            {services.length === 0 ? (
              <p style={{ color:'#B8B0A0', fontSize:13, padding:'24px', textAlign:'center' }}>Sin servicios disponibles</p>
            ) : services.map((s, i) => (
              <div
                key={s.id}
                style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom: i < services.length-1 ? '1px solid #1A1A1A' : 'none' }}
              >
                <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, color:'#C9A84C', flexShrink:0 }}>
                    ✦
                  </div>
                  <div>
                    <p style={{ color:'#F5F0E8', fontWeight:600, fontSize:15 }}>{s.name}</p>
                    <p style={{ color:'#B8B0A0', fontSize:12, marginTop:2 }}>⏱ {s.duration_min} minutos</p>
                  </div>
                </div>
                <p style={{ color:'#C9A84C', fontFamily:'Playfair Display', fontWeight:700, fontSize:18 }}>
                  {formatPrice(s.price)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Barberos */}
        {barbers.length > 0 && (
          <section style={{ marginBottom:36 }}>
            <p style={{ color:'#C9A84C', fontSize:11, letterSpacing:'0.1em', fontWeight:700, marginBottom:16 }}>NUESTRO EQUIPO</p>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:12 }}>
              {barbers.map(b => (
                <div
                  key={b.id}
                  style={{ background:'#111', border:'1px solid #1A1A1A', borderRadius:14, padding:'20px 16px', textAlign:'center', transition:'border-color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor='rgba(201,168,76,0.3)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor='#1A1A1A'}
                >
                  <div style={{ width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg, #8B6914, #C9A84C)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px', fontSize:22, fontFamily:'Playfair Display', fontWeight:900, color:'#0A0A0A' }}>
                    {b.name.charAt(0).toUpperCase()}
                  </div>
                  <p style={{ color:'#F5F0E8', fontWeight:600, fontSize:14 }}>{b.name}</p>
                  <p style={{ color:'#C9A84C', fontSize:10, fontWeight:700, letterSpacing:'0.06em', marginTop:4 }}>● DISPONIBLE</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Horarios */}
        {hours && hours.length > 0 && (
          <section style={{ marginBottom:36 }}>
            <p style={{ color:'#C9A84C', fontSize:11, letterSpacing:'0.1em', fontWeight:700, marginBottom:16 }}>HORARIOS</p>
            <div style={{ background:'#111', border:'1px solid #1A1A1A', borderRadius:14, overflow:'hidden' }}>
              {hours.map((h, i) => (
                <div
                  key={i}
                  style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', borderBottom: i < hours.length-1 ? '1px solid #1A1A1A' : 'none', background: h.day_of_week === TODAY ? 'rgba(201,168,76,0.04)' : 'transparent' }}
                >
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    {h.day_of_week === TODAY && (
                      <div style={{ width:6, height:6, borderRadius:'50%', background:'#C9A84C', flexShrink:0 }} />
                    )}
                    <p style={{ color: h.day_of_week === TODAY ? '#F5F0E8' : '#B8B0A0', fontSize:14, fontWeight: h.day_of_week === TODAY ? 600 : 400 }}>
                      {h.day}
                    </p>
                    {h.day_of_week === TODAY && (
                      <span style={{ fontSize:10, color:'#C9A84C', fontWeight:700, letterSpacing:'0.06em' }}>HOY</span>
                    )}
                  </div>
                  {h.is_open ? (
                    <p style={{ color:'#F5F0E8', fontSize:13, fontWeight:500 }}>
                      {h.open_time} – {h.close_time}
                    </p>
                  ) : (
                    <p style={{ color:'#E8C97A', fontSize:12, fontWeight:600, letterSpacing:'0.06em' }}>CERRADO</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA bottom */}
        <button
          onClick={() => navigate(`/reservar/${slug}/cita`)}
          style={{ width:'100%', background:'#C9A84C', color:'#0A0A0A', border:'none', padding:'16px 0', borderRadius:12, cursor:'pointer', fontSize:14, fontWeight:700, letterSpacing:'0.08em', fontFamily:'DM Sans', transition:'background 0.2s' }}
          onMouseEnter={e => e.target.style.background='#E8C97A'}
          onMouseLeave={e => e.target.style.background='#C9A84C'}
        >
          RESERVAR MI CITA →
        </button>
      </main>
    </div>
  )
}