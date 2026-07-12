import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { emailError } from '../utils/validators'

export default function ForgotPassword() {
  const [email, setEmail]     = useState('')
  const [touched, setTouched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')
  const navigate              = useNavigate()

  const fieldError = emailError(email, { required: true })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched(true)
    if (fieldError) return
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/forgot-password', { email: email.trim() })
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Error enviando el email')
    } finally {
      setLoading(false)
    }
  }

  const s = {
    wrap: { minHeight:'100vh', background:'#0A0A0A', display:'flex', alignItems:'center', justifyContent:'center', padding:24, position:'relative', overflow:'hidden' },
    orb:  { position:'absolute', top:-200, left:'50%', transform:'translateX(-50%)', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)', pointerEvents:'none' },
    card: { background:'#161616', border:'1px solid #2A2A2A', borderRadius:16, padding:36, width:'100%', maxWidth:420, position:'relative', zIndex:1 },
    inp:  { width:'100%', padding:'13px 16px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', color:'#F5F0E8', borderRadius:10, fontSize:14, fontFamily:'DM Sans', outline:'none' },
    label: { display:'block', fontSize:11, letterSpacing:'0.08em', color:'#C9A84C', marginBottom:7, fontWeight:600 },
  }

  if (sent) return (
    <div style={s.wrap}>
      <div style={s.orb} />
      <div className="animate-fade-up" style={s.card}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:'rgba(201,168,76,0.1)', border:'1px solid rgba(201,168,76,0.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px', fontSize:28, color:'#C9A84C' }}>
          ✓
        </div>
        <h2 style={{ fontFamily:'Playfair Display', fontSize:24, color:'#F5F0E8', textAlign:'center', marginBottom:12 }}>
          Email enviado
        </h2>
        <p style={{ color:'#B8B0A0', fontSize:14, textAlign:'center', lineHeight:1.7, marginBottom:28 }}>
          Si ese email está registrado, vas a recibir un enlace para restablecer tu contraseña en los próximos minutos. Revisá también el spam.
        </p>
        <button
          onClick={() => navigate('/login')}
          style={{ width:'100%', background:'#C9A84C', color:'#0A0A0A', border:'none', padding:'13px 0', borderRadius:10, cursor:'pointer', fontSize:12, fontWeight:700, letterSpacing:'0.08em', fontFamily:'DM Sans' }}
        >
          VOLVER AL LOGIN
        </button>
      </div>
    </div>
  )

  return (
    <div style={s.wrap}>
      <div style={s.orb} />
      <div className="animate-fade-up" style={s.card}>

        <div style={{ textAlign:'center', marginBottom:32 }}>
          <p style={{ fontSize:36, color:'#C9A84C', marginBottom:10 }}>✂</p>
          <h1 style={{ fontFamily:'Playfair Display', fontSize:26, color:'#F5F0E8', marginBottom:6 }}>
            Recuperar contraseña
          </h1>
          <p style={{ color:'#B8B0A0', fontSize:13 }}>
            Ingresá tu email y te mandamos un enlace
          </p>
        </div>

        {error && (
          <div style={{ background:'rgba(232,201,122,0.1)', border:'1px solid rgba(232,201,122,0.3)', color:'#E8C97A', borderRadius:8, padding:'12px 16px', marginBottom:20, fontSize:13 }}>
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label style={s.label}>CORREO ELECTRÓNICO</label>
            <input
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError('') }}
              onBlur={() => setTouched(true)}
              placeholder="tucorreo@email.com"
              style={{ ...s.inp, border: '1px solid ' + (touched && fieldError ? '#E8C97A' : 'rgba(255,255,255,0.1)') }}
              autoFocus
            />
            {touched && fieldError && <p style={{ color:'#E8C97A', fontSize:12, marginTop:6 }}>⚠ {fieldError}</p>}
          </div>
          <button
            type="submit"
            disabled={loading || !!fieldError}
            style={{ background: (loading || fieldError) ? '#8B6914' : '#C9A84C', color:'#0A0A0A', border:'none', padding:'14px 0', borderRadius:10, cursor: (loading || fieldError) ? 'not-allowed' : 'pointer', fontSize:12, fontWeight:700, letterSpacing:'0.08em', fontFamily:'DM Sans', marginTop:4 }}
          >
            {loading ? 'ENVIANDO...' : 'ENVIAR ENLACE'}
          </button>
        </form>

        <p style={{ textAlign:'center', marginTop:24, fontSize:13, color:'#B8B0A0' }}>
          <button
            onClick={() => navigate('/login')}
            style={{ background:'none', border:'none', color:'#C9A84C', cursor:'pointer', fontSize:13, fontWeight:600 }}
          >
            ← Volver al login
          </button>
        </p>
      </div>
    </div>
  )
}