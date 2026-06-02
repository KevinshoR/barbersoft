import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function FindShop() {
  const [slug, setSlug]       = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const navigate              = useNavigate()

  const handleSearch = async (e) => {
    e.preventDefault()
    const clean = slug.trim().toLowerCase().replace(/\s+/g, '-')
    if (!clean) { setError('Ingresá el nombre de la barbería'); return }
    setLoading(true)
    setError('')
    try {
      await api.get('/public/' + clean)
      navigate('/reservar/' + clean)
    } catch {
      setError('No encontramos esa barbería. Verificá el nombre e intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#0A0A0A', display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily:'DM Sans', position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:-150, left:'50%', transform:'translateX(-50%)', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)', pointerEvents:'none' }} />

      <div className="animate-fade-up" style={{ width:'100%', maxWidth:460, position:'relative', zIndex:1 }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ fontSize:40, color:'#C9A84C', marginBottom:10 }}>✂</div>
          <h1 style={{ fontFamily:'Playfair Display', fontSize:32, fontWeight:900, color:'#F5F0E8', marginBottom:8, letterSpacing:'-0.02em' }}>
            Barber<span style={{ color:'#C9A84C' }}>soft</span>
          </h1>
          <p style={{ color:'#B8B0A0', fontSize:14 }}>
            Reservá tu cita en tu barbería favorita
          </p>
        </div>

        {/* Card */}
        <div style={{ background:'#161616', border:'1px solid #2A2A2A', borderRadius:16, padding:32 }}>
          <p style={{ color:'#C9A84C', fontSize:11, letterSpacing:'0.1em', fontWeight:700, marginBottom:6 }}>BUSCAR BARBERÍA</p>
          <p style={{ color:'#B8B0A0', fontSize:13, marginBottom:24, lineHeight:1.6 }}>
            Ingresá el nombre de la barbería para encontrar su página de reservas.
          </p>

          {error && (
            <div style={{ background:'rgba(224,82,82,0.1)', border:'1px solid rgba(224,82,82,0.3)', color:'#E05252', borderRadius:8, padding:'12px 16px', marginBottom:16, fontSize:13 }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSearch} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <label style={{ display:'block', fontSize:11, letterSpacing:'0.08em', color:'#C9A84C', marginBottom:7, fontWeight:600 }}>
                NOMBRE DE LA BARBERÍA
              </label>
              <input
                value={slug}
                onChange={e => { setSlug(e.target.value); setError('') }}
                placeholder="Ej: barberia-el-paisa"
                style={{ width:'100%', padding:'13px 16px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#F5F0E8', borderRadius:10, fontSize:14, fontFamily:'DM Sans', outline:'none' }}
                autoFocus
              />
              <p style={{ color:'#B8B0A0', fontSize:11, marginTop:5, opacity:0.6 }}>
                Escribí el nombre tal como te lo compartió la barbería
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ background: loading ? '#8B6914' : '#C9A84C', color:'#0A0A0A', border:'none', padding:'14px 0', borderRadius:10, cursor: loading ? 'not-allowed' : 'pointer', fontSize:12, fontWeight:700, letterSpacing:'0.08em', fontFamily:'DM Sans', transition:'background 0.2s' }}
            >
              {loading ? 'BUSCANDO...' : 'BUSCAR BARBERÍA →'}
            </button>
          </form>
        </div>

        <p style={{ textAlign:'center', color:'#B8B0A0', fontSize:12, marginTop:20, opacity:0.5 }}>
          ¿Sos dueño de una barbería?{' '}
          <span
            onClick={() => window.location.href='/login'}
            style={{ color:'#C9A84C', cursor:'pointer', fontWeight:600 }}
          >
            Accedé al panel
          </span>
        </p>
      </div>
    </div>
  )
}