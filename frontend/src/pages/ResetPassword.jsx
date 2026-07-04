import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import { isPasswordValid } from '../utils/passwordValidation'
import PasswordStrength from '../components/PasswordStrength'

export default function ResetPassword() {
  const [searchParams]          = useSearchParams()
  const token                   = searchParams.get('token')
  const navigate                = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [loading, setLoading]   = useState(false)
  const [done, setDone]         = useState(false)
  const [error, setError]       = useState('')

  const confirmError = confirm && password !== confirm ? 'Las contraseñas no coinciden' : ''

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isPasswordValid(password)) { setError('La contraseña no cumple los requisitos de seguridad'); return }
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/reset-password', { token, password })
      setDone(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Error actualizando contraseña')
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

  if (!token) return (
    <div style={s.wrap}>
      <div style={s.card}>
        <p style={{ color:'#E05252', textAlign:'center', fontSize:14 }}>
          ⚠ Enlace inválido. Solicitá uno nuevo desde el login.
        </p>
        <button onClick={() => navigate('/login')} style={{ width:'100%', marginTop:20, background:'#C9A84C', color:'#0A0A0A', border:'none', padding:'13px 0', borderRadius:10, cursor:'pointer', fontSize:12, fontWeight:700, letterSpacing:'0.08em', fontFamily:'DM Sans' }}>
          IR AL LOGIN
        </button>
      </div>
    </div>
  )

  if (done) return (
    <div style={s.wrap}>
      <div style={s.orb} />
      <div className="animate-fade-up" style={s.card}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:'rgba(76,175,125,0.1)', border:'1px solid rgba(76,175,125,0.3)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 24px', fontSize:28, color:'#4CAF7D' }}>✓</div>
        <h2 style={{ fontFamily:'Playfair Display', fontSize:24, color:'#F5F0E8', textAlign:'center', marginBottom:12 }}>¡Contraseña actualizada!</h2>
        <p style={{ color:'#B8B0A0', fontSize:14, textAlign:'center', lineHeight:1.7, marginBottom:28 }}>Ya podés iniciar sesión con tu nueva contraseña.</p>
        <button onClick={() => navigate('/login')} style={{ width:'100%', background:'#C9A84C', color:'#0A0A0A', border:'none', padding:'13px 0', borderRadius:10, cursor:'pointer', fontSize:12, fontWeight:700, letterSpacing:'0.08em', fontFamily:'DM Sans' }}>
          INICIAR SESIÓN
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
          <h1 style={{ fontFamily:'Playfair Display', fontSize:26, color:'#F5F0E8', marginBottom:6 }}>Nueva contraseña</h1>
          <p style={{ color:'#B8B0A0', fontSize:13 }}>Elegí una contraseña segura</p>
        </div>

        {error && (
          <div style={{ background:'rgba(224,82,82,0.1)', border:'1px solid rgba(224,82,82,0.3)', color:'#E05252', borderRadius:8, padding:'12px 16px', marginBottom:20, fontSize:13 }}>
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label style={s.label}>NUEVA CONTRASEÑA</label>
            <input
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              placeholder="••••••••"
              style={s.inp}
              autoFocus
            />
            <PasswordStrength password={password} />
          </div>
          <div>
            <label style={s.label}>CONFIRMAR CONTRASEÑA</label>
            <input
              type="password"
              value={confirm}
              onChange={e => { setConfirm(e.target.value); setError('') }}
              placeholder="Repetí la contraseña"
              style={{ ...s.inp, border: '1px solid ' + (confirmError ? '#E05252' : 'rgba(255,255,255,0.1)') }}
            />
            {confirmError && <p style={{ color:'#E05252', fontSize:12, marginTop:6 }}>⚠ {confirmError}</p>}
          </div>

          <button
            type="submit"
            disabled={loading || !isPasswordValid(password) || password !== confirm}
            style={{ background: (loading || !isPasswordValid(password) || password !== confirm) ? '#8B6914' : '#C9A84C', color:'#0A0A0A', border:'none', padding:'14px 0', borderRadius:10, cursor: (loading || !isPasswordValid(password) || password !== confirm) ? 'not-allowed' : 'pointer', fontSize:12, fontWeight:700, letterSpacing:'0.08em', fontFamily:'DM Sans', marginTop:4 }}
          >
            {loading ? 'GUARDANDO...' : 'GUARDAR CONTRASEÑA'}
          </button>
        </form>
      </div>
    </div>
  )
}