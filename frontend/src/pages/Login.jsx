import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'

export default function Login() {
  const location   = useLocation()
  const [isRegister, setIsRegister]     = useState(new URLSearchParams(location.search).get('register') === 'true')
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ name:'', email:'', password:'', phone:'', address:'' })

  const { login } = useAuth()
  const navigate  = useNavigate()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login'
      const res = await api.post(endpoint, form)
      login(res.data.token, res.data.barbershop)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Ocurrió un error. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--dark)', display:'flex', alignItems:'center', justifyContent:'center', padding:24, position:'relative', overflow:'hidden' }}>
      <div style={{ position:'absolute', top:-200, right:-200, width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle, rgba(201,168,76,0.06) 0%, transparent 70%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:-200, left:-200, width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(201,168,76,0.04) 0%, transparent 70%)', pointerEvents:'none' }} />

      <div className="animate-fade-up" style={{ width:'100%', maxWidth:420, position:'relative', zIndex:1 }}>

        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ fontSize:48, marginBottom:12, color:'var(--gold)' }}>✂</div>
          <h1 style={{ fontSize:36, fontWeight:900, color:'var(--cream)', marginBottom:6, letterSpacing:'-0.02em' }}>
            Barber<span style={{ color:'var(--gold)' }}>soft</span>
          </h1>
          <p style={{ color:'var(--cream-dim)', fontSize:14, letterSpacing:'0.06em' }}>
            {isRegister ? 'CREAR CUENTA — 14 DÍAS GRATIS' : 'BIENVENIDO DE NUEVO'}
          </p>
        </div>

        <div style={{ background:'var(--dark-2)', border:'1px solid var(--dark-4)', borderRadius:16, padding:32 }}>

          {error && (
            <div style={{ background:'rgba(224,82,82,0.1)', border:'1px solid rgba(224,82,82,0.3)', color:'var(--danger)', borderRadius:8, padding:'12px 16px', marginBottom:20, fontSize:13 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {isRegister && (
              <>
                <div>
                  <label style={{ display:'block', fontSize:11, letterSpacing:'0.08em', color:'var(--gold)', marginBottom:6, fontWeight:600 }}>NOMBRE DE LA BARBERÍA</label>
                  <input name="name" value={form.name} onChange={handleChange} placeholder="Ej: Barbería El Paisa" required style={{ width:'100%', padding:'12px 16px' }} />
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <div>
                    <label style={{ display:'block', fontSize:11, letterSpacing:'0.08em', color:'var(--gold)', marginBottom:6, fontWeight:600 }}>TELÉFONO</label>
                    <input name="phone" value={form.phone} onChange={handleChange} placeholder="3001234567" style={{ width:'100%', padding:'12px 16px' }} />
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:11, letterSpacing:'0.08em', color:'var(--gold)', marginBottom:6, fontWeight:600 }}>CIUDAD</label>
                    <input name="address" value={form.address} onChange={handleChange} placeholder="Medellín" style={{ width:'100%', padding:'12px 16px' }} />
                  </div>
                </div>
              </>
            )}

            <div>
              <label style={{ display:'block', fontSize:11, letterSpacing:'0.08em', color:'var(--gold)', marginBottom:6, fontWeight:600 }}>CORREO ELECTRÓNICO</label>
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="tucorreo@email.com" required style={{ width:'100%', padding:'12px 16px' }} />
            </div>

            <div>
              <label style={{ display:'block', fontSize:11, letterSpacing:'0.08em', color:'var(--gold)', marginBottom:6, fontWeight:600 }}>CONTRASEÑA</label>
              <div style={{ position:'relative' }}>
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  style={{ width:'100%', padding:'12px 48px 12px 16px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'var(--cream-dim)', fontSize:16, padding:0, lineHeight:1 }}
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ marginTop:8, width:'100%', padding:'14px 0', opacity: loading ? 0.6 : 1, fontSize:13 }}
            >
              {loading ? 'CARGANDO...' : isRegister ? 'CREAR CUENTA GRATIS' : 'INICIAR SESIÓN'}
            </button>
          </form>

          <p style={{ textAlign:'center', marginTop:16 }}>
            <button
              onClick={() => navigate('/forgot-password')}
              style={{ background:'none', border:'none', color:'var(--cream-dim)', fontSize:12, cursor:'pointer', opacity:0.6 }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </p>

          <div style={{ borderTop:'1px solid var(--dark-4)', marginTop:24, paddingTop:24, textAlign:'center' }}>
            <span style={{ color:'var(--cream-dim)', fontSize:13 }}>
              {isRegister ? '¿Ya tenés cuenta? ' : '¿No tenés cuenta? '}
            </span>
            <button
              onClick={() => { setIsRegister(!isRegister); setError('') }}
              style={{ background:'none', border:'none', color:'var(--gold)', fontSize:13, fontWeight:600, cursor:'pointer', textDecoration:'underline' }}
            >
              {isRegister ? 'Iniciá sesión' : 'Registrate gratis'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}