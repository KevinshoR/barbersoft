import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { emailError } from '../utils/validators'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

/* ---------- Iconos ---------- */
const Ic = {
  scissors: (s = 22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>,
  mail: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 6 10-6"/></svg>,
  lock: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>,
  eye: (s = 17) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 12S5 5.5 12 5.5 22.5 12 22.5 12 19 18.5 12 18.5 1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3"/></svg>,
  eyeOff: (s = 17) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9.9 4.2A10.9 10.9 0 0112 4c7 0 10.5 6.5 10.5 6.5a18 18 0 01-3.2 4.2M6.6 6.6A18 18 0 001.5 10.5S5 17 12 17a10.8 10.8 0 004.1-.8"/><line x1="2" y1="2" x2="22" y2="22"/></svg>,
  arrow: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
  calendar: (s = 22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></svg>,
  chart: (s = 22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 16v-4M12 16V9M16 16v-6"/></svg>,
  users: (s = 22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.9"/><path d="M16 3.1a4 4 0 010 7.8"/></svg>,
  help: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 015.8 1c0 2-3 3-3 3M12 17h.01"/></svg>,
  shield: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  bolt: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9z"/></svg>,
  cloud: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H7a5 5 0 010-10 6 6 0 0111.6 2A4 4 0 0117.5 19z"/></svg>,
}

const BENEFICIOS = [
  { icon: Ic.calendar, title: 'Agenda inteligente',      text: 'Organiza citas y recordatorios sin complicaciones.' },
  { icon: Ic.chart,    title: 'Reportes y estadísticas', text: 'Conoce tu negocio y toma mejores decisiones.' },
  { icon: Ic.users,    title: 'Clientes satisfechos',    text: 'Brinda una experiencia premium y fideliza clientes.' },
]

export default function Login() {
  const location = useLocation()
  const navigate = useNavigate()
  const { login } = useAuth()

  // Retrocompat: si vienen de la Landing con ?register=true, mandarlos al Register
  useEffect(() => {
    if (new URLSearchParams(location.search).get('register') === 'true') {
      navigate('/register', { replace: true })
    }
  }, [location.search, navigate])

  const [form, setForm]                 = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [touched, setTouched]           = useState({})
  const [googleLoading, setGoogleLoading] = useState(false)
  const googleBtnRef = useRef(null)

  const emailErr = emailError(form.email, { required: true })
  const markTouched = (n) => setTouched(t => (t[n] ? t : { ...t, [n]: true }))

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
    markTouched(e.target.name)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched({ email: true, password: true })
    setError('')
    if (emailErr) return
    if (!form.password) { setError('La contraseña es obligatoria'); return }

    setLoading(true)
    try {
      const res = await api.post('/auth/login', {
        email: form.email.trim(),
        password: form.password,
      })
      login(res.data.token, res.data.barbershop)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  // Google Sign-In
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return
    let script = document.getElementById('google-identity-script')
    if (!script) {
      script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true; script.defer = true
      script.id = 'google-identity-script'
      document.body.appendChild(script)
    }
    const onReady = () => {
      if (!window.google?.accounts?.id || !googleBtnRef.current) return
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          if (!response?.credential) return
          setGoogleLoading(true); setError('')
          try {
            const res = await api.post('/auth/google/verify', { id_token: response.credential })
            if (res.data.mode === 'login') {
              login(res.data.token, res.data.barbershop)
              navigate('/dashboard')
            } else if (res.data.mode === 'needs_registration') {
              // Cuenta nueva → mandar al Register con el token de Google
              navigate('/register', { state: { googleToken: response.credential, prefill: res.data.prefill } })
            }
          } catch (err) {
            setError(err.response?.data?.error || 'No se pudo iniciar sesión con Google')
          } finally {
            setGoogleLoading(false)
          }
        },
      })
      googleBtnRef.current.innerHTML = ''
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        type: 'standard', theme: 'filled_black', size: 'large',
        text: 'continue_with', shape: 'rectangular', logo_alignment: 'left',
        width: Math.min(googleBtnRef.current.clientWidth || 320, 380),
      })
    }
    if (window.google?.accounts?.id) onReady()
    else script.addEventListener('load', onReady)
    return () => script.removeEventListener('load', onReady)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="au-wrap">
      <SharedStyles />

      <aside className="au-left">
        <div>
          <a href="/" className="au-brand">
            <span className="au-brand-ic">{Ic.scissors(24)}</span>
            Barber<em>soft</em>
          </a>
        </div>

        <div style={{ position:'relative', zIndex:1 }}>
          <p className="au-kicker"><span style={{ color:'var(--gold)' }}>◆</span> BIENVENIDO DE NUEVO</p>
          <h1 className="au-headline">Tu barbería,<br/><em>siempre organizada</em></h1>
          <p className="au-lead">Entra a tu panel y continúa gestionando tus citas, servicios, barberos y clientes desde un solo lugar.</p>
          <div className="au-sep" />

          <div className="au-benefits">
            {BENEFICIOS.map((b, i) => (
              <div key={b.title} className={`au-benefit d${i}`}>
                <span className="au-benefit-ic">{b.icon()}</span>
                <div>
                  <h4>{b.title}</h4>
                  <p>{b.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="au-testi">
            <div className="au-testi-mark">"</div>
            <p>Desde que uso Barbersoft, mi barbería es más organizada y mis clientes están más felices.</p>
            <div className="au-testi-who">
              <div className="au-testi-avatar">J</div>
              <div>
                <div className="au-testi-name">Juan C. — Barranquilla</div>
                <div className="au-testi-role">Barbería JC</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <section className="au-right">
        <a
          href="https://wa.me/573116735081?text=Hola,%20necesito%20ayuda%20con%20Barbersoft"
          target="_blank" rel="noopener noreferrer"
          className="au-help"
        >
          <span className="au-help-ic">{Ic.help()}</span>
          <span style={{ display:'flex', flexDirection:'column', lineHeight:1.2 }}>
            <strong>¿Necesitas ayuda?</strong>
            <span>Escríbenos por <em>WhatsApp</em></span>
          </span>
        </a>

        <div className="au-card">
          <div className="au-crown">{Ic.scissors(28)}</div>
          <h2 className="au-title">Iniciar sesión</h2>
          <p className="au-sub">ENTRA A TU PANEL DE BARBERSOFT</p>
          <div className="au-hr" />

          {error && <div className="au-alert">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 14 }}>
              <label className="au-label">Correo electrónico</label>
              <div className="au-field">
                <span className="au-field-ic">{Ic.mail()}</span>
                <input name="email" type="email" value={form.email} onChange={handleChange}
                  onBlur={() => markTouched('email')} placeholder="ejemplo@correo.com" required />
              </div>
              {touched.email && emailErr && <p className="au-err">⚠ {emailErr}</p>}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label className="au-label">Contraseña</label>
              <div className="au-field">
                <span className="au-field-ic">{Ic.lock()}</span>
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  onBlur={() => markTouched('password')}
                  placeholder="••••••••••"
                  required
                  autoComplete="current-password"
                />
                <button type="button" className="au-field-toggle" onClick={() => setShowPassword(p => !p)} tabIndex={-1}>
                  {showPassword ? Ic.eyeOff() : Ic.eye()}
                </button>
              </div>
            </div>

            <div className="au-row">
              <label className="au-remember">
                <input type="checkbox" />
                <span className="au-remember-box"></span>
                Recordarme en este dispositivo
              </label>
              <button type="button" className="au-link" onClick={() => navigate('/forgot-password')}>¿Olvidaste tu contraseña?</button>
            </div>

            <button type="submit" className="au-submit" disabled={loading || !!emailErr}>
              {loading ? 'Entrando...' : <>Entrar {Ic.arrow()}</>}
            </button>
          </form>

          <div className="au-or">O continúa con</div>
          <div className="au-google-wrap">
            {GOOGLE_CLIENT_ID
              ? <div ref={googleBtnRef} style={{ width:'100%' }} />
              : <div className="au-google-fake">Google Sign-In no está configurado</div>}
          </div>
          {googleLoading && <p style={{ textAlign:'center', color:'var(--cream-dim)', fontSize:12, marginTop:10 }}>Validando con Google...</p>}

          <p className="au-bottom">
            ¿No tienes cuenta?{' '}
            <button type="button" className="au-link" onClick={() => navigate('/register')}>Regístrate gratis</button>
          </p>
        </div>

        <div className="au-trust">
          <span>{Ic.shield()} Conexión segura</span>
          <span>{Ic.bolt()} Acceso rápido</span>
          <span>{Ic.cloud()} Respaldo automático</span>
        </div>
      </section>
    </div>
  )
}

/* ═══ Estilos compartidos entre Login y Register ═══ */
export function SharedStyles() {
  return (
    <style>{`
      .au-wrap{min-height:100vh;display:grid;grid-template-columns:minmax(0,42fr) minmax(0,58fr);background:var(--dark);font-family:var(--font-body,sans-serif);color:var(--cream)}
      .au-left{position:relative;padding:clamp(28px,4vw,52px);display:flex;flex-direction:column;gap:32px;overflow:hidden;background:linear-gradient(180deg,#0A0A0A 0%,#0E0E0E 100%)}
      .au-left::before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 30% 30%,rgba(201,168,76,0.09),transparent 60%);pointer-events:none}
      .au-brand{display:flex;align-items:center;gap:10px;color:var(--cream);text-decoration:none;font-family:var(--font-display,Georgia,serif);font-weight:800;font-size:22px;position:relative;z-index:1}
      .au-brand-ic{color:var(--gold)}
      .au-brand em{color:var(--gold);font-style:normal}
      .au-kicker{color:var(--gold);font-size:11px;font-weight:800;letter-spacing:0.18em;margin-bottom:14px;display:inline-flex;align-items:center;gap:8px}
      .au-kicker::before{content:"";width:14px;height:2px;background:var(--gold)}
      .au-headline{font-family:var(--font-display,Georgia,serif);font-size:clamp(30px,3.4vw,44px);font-weight:800;line-height:1.08;margin-bottom:18px}
      .au-headline em{color:var(--gold);font-style:normal;display:block}
      .au-lead{color:var(--cream-dim);font-size:15px;line-height:1.6;max-width:440px;margin-bottom:24px}
      .au-sep{height:1px;background:linear-gradient(90deg,rgba(201,168,76,0.35),transparent);margin-bottom:24px;width:80px}
      .au-benefits{display:flex;flex-direction:column;gap:14px;margin-bottom:24px;position:relative;z-index:1}
      .au-benefit{display:flex;gap:14px;align-items:flex-start;animation:fadeUp 0.6s ease both;opacity:0}
      .au-benefit.d0{animation-delay:0.05s} .au-benefit.d1{animation-delay:0.15s} .au-benefit.d2{animation-delay:0.25s}
      .au-benefit-ic{width:42px;height:42px;border-radius:10px;background:rgba(201,168,76,0.10);border:1px solid rgba(201,168,76,0.35);color:var(--gold);display:flex;align-items:center;justify-content:center;flex-shrink:0}
      .au-benefit h4{font-family:var(--font-display,Georgia,serif);font-weight:800;color:var(--cream);font-size:15.5px;margin-bottom:2px}
      .au-benefit p{color:var(--cream-dim);font-size:13px;line-height:1.5}
      .au-testi{background:var(--dark-2);border:1px solid var(--dark-4);border-radius:14px;padding:16px 18px;position:relative;z-index:1;animation:fadeUp 0.7s ease 0.4s both;opacity:0}
      .au-testi-mark{color:var(--gold);font-size:24px;font-family:Georgia,serif;line-height:1;margin-bottom:2px}
      .au-testi p{color:var(--cream);font-size:13px;line-height:1.55;margin-bottom:8px;font-style:italic}
      .au-testi-who{display:flex;align-items:center;gap:10px}
      .au-testi-avatar{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,var(--gold-dim),var(--gold));display:flex;align-items:center;justify-content:center;color:var(--dark);font-weight:900;font-size:13px;flex-shrink:0}
      .au-testi-who div{line-height:1.3}
      .au-testi-name{color:var(--cream);font-size:12.5px;font-weight:700}
      .au-testi-role{color:var(--cream-dim);font-size:11px}

      .au-right{position:relative;padding:clamp(28px,4vw,52px);display:flex;align-items:flex-start;justify-content:center;background:radial-gradient(ellipse at top,rgba(201,168,76,0.05),transparent 70%),var(--dark);min-height:100vh;overflow-y:auto}
      .au-help{position:absolute;top:22px;right:clamp(20px,4vw,42px);display:flex;align-items:center;gap:10px;color:var(--cream-dim);font-size:12.5px;text-decoration:none;background:transparent;border:none;cursor:pointer;font-family:inherit;z-index:2}
      .au-help:hover{color:var(--gold)}
      .au-help-ic{width:28px;height:28px;border-radius:50%;border:1px solid var(--dark-4);display:flex;align-items:center;justify-content:center;color:var(--cream-dim)}
      .au-help strong{color:var(--cream);font-weight:600}
      .au-help em{color:var(--gold);font-style:normal;font-weight:700}
      .au-card{width:100%;max-width:460px;background:var(--dark-2);border:1px solid var(--dark-4);border-radius:20px;padding:44px 38px 32px;position:relative;box-shadow:0 20px 60px rgba(0,0,0,0.35);margin:60px auto 60px}
      .au-crown{position:absolute;top:-32px;left:50%;transform:translateX(-50%);width:62px;height:62px;border-radius:50%;background:var(--dark-2);border:1px solid rgba(201,168,76,0.6);display:flex;align-items:center;justify-content:center;color:var(--gold);box-shadow:0 0 40px rgba(201,168,76,0.2)}
      .au-title{font-family:var(--font-display,Georgia,serif);font-size:27px;font-weight:800;text-align:center;color:var(--cream);margin:10px 0 6px}
      .au-sub{text-align:center;color:var(--gold);font-size:11.5px;letter-spacing:0.16em;font-weight:800;margin-bottom:6px}
      .au-hr{height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,0.4),transparent);margin:14px 0 22px}
      .au-label{display:block;font-size:12.5px;color:var(--cream);font-weight:600;margin-bottom:6px}
      .au-field{position:relative;display:flex;align-items:center;background:var(--dark-3);border:1px solid var(--dark-4);border-radius:11px;transition:border-color 0.2s}
      .au-field:focus-within{border-color:var(--gold)}
      .au-field-ic{color:var(--gold);opacity:0.7;padding:0 12px;display:flex;align-items:center;flex-shrink:0}
      .au-field input,.au-field select{flex:1;background:transparent;border:none;outline:none;color:var(--cream);font-size:14px;padding:12px 12px 12px 4px;width:100%;font-family:inherit;min-width:0}
      .au-field input:disabled{color:var(--cream-dim);opacity:0.75}
      .au-field select{appearance:none;padding-right:36px;cursor:pointer}
      .au-field select option{background:var(--dark-2);color:var(--cream)}
      .au-field-toggle{background:transparent;border:none;color:var(--gold);opacity:0.7;padding:0 12px;cursor:pointer;display:flex;align-items:center}
      .au-err{color:#E05252;font-size:11.5px;margin-top:5px}
      .au-row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;flex-wrap:wrap}
      .au-remember{display:inline-flex;align-items:center;gap:8px;color:var(--cream);font-size:13px;cursor:pointer}
      .au-remember input{display:none}
      .au-remember-box{width:18px;height:18px;border:1px solid var(--gold);border-radius:5px;display:flex;align-items:center;justify-content:center;background:transparent;flex-shrink:0}
      .au-remember input:checked ~ .au-remember-box{background:var(--gold)}
      .au-remember input:checked ~ .au-remember-box::after{content:"✓";color:var(--dark);font-size:12px;font-weight:900}
      .au-link{color:var(--gold);font-size:13px;font-weight:700;background:transparent;border:none;cursor:pointer;padding:0;text-decoration:none;font-family:inherit}
      .au-link:hover{text-decoration:underline}
      .au-submit{width:100%;padding:15px 0;border-radius:12px;border:none;background:var(--gold);color:var(--dark);font-weight:800;letter-spacing:0.05em;font-size:14px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:10px;transition:all 0.2s;font-family:inherit}
      .au-submit:hover:not(:disabled){background:#E8C97A;transform:translateY(-1px);box-shadow:0 12px 32px rgba(201,168,76,0.28)}
      .au-submit:disabled{background:rgba(201,168,76,0.4);cursor:not-allowed;color:rgba(10,10,10,0.6)}
      .au-secondary{width:100%;padding:13px 0;border-radius:12px;background:transparent;border:1px solid var(--dark-4);color:var(--cream);font-weight:700;font-size:13.5px;cursor:pointer;font-family:inherit}
      .au-secondary:hover{border-color:var(--gold);color:var(--gold)}
      .au-or{display:flex;align-items:center;gap:12px;color:var(--cream-dim);font-size:12px;margin:20px 0 14px;text-align:center;justify-content:center}
      .au-or::before,.au-or::after{content:"";flex:1;height:1px;background:var(--dark-4)}
      .au-google-wrap{display:flex;justify-content:center;min-height:44px}
      .au-google-fake{width:100%;padding:11px;border-radius:11px;background:var(--dark-3);border:1px solid var(--dark-4);color:var(--cream-dim);font-size:13px;text-align:center;font-weight:600}
      .au-bottom{margin-top:22px;text-align:center;color:var(--cream-dim);font-size:13px}
      .au-alert{background:rgba(224,82,82,0.09);border:1px solid rgba(224,82,82,0.35);color:#EAA;font-size:13px;padding:10px 14px;border-radius:10px;margin-bottom:14px;text-align:center}
      .au-trust{position:absolute;bottom:20px;left:0;right:0;display:flex;justify-content:center;gap:clamp(16px,4vw,42px);color:var(--cream-dim);font-size:12.5px;flex-wrap:wrap;padding:0 16px;pointer-events:none}
      .au-trust span{display:inline-flex;align-items:center;gap:6px;color:var(--cream-dim)}
      .au-trust span svg{color:var(--gold)}

      /* ── Barra de progreso del Register ── */
      .au-steps{display:flex;align-items:center;justify-content:center;gap:6px;margin-bottom:22px}
      .au-step{display:flex;align-items:center;gap:8px;color:var(--cream-dim);font-size:11.5px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase}
      .au-step.on{color:var(--gold)}
      .au-step-dot{width:24px;height:24px;border-radius:50%;background:var(--dark-3);border:1px solid var(--dark-4);display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900}
      .au-step.on .au-step-dot{background:var(--gold);color:var(--dark);border-color:var(--gold)}
      .au-step.done .au-step-dot{background:rgba(201,168,76,0.15);color:var(--gold);border-color:var(--gold)}
      .au-step-line{width:32px;height:1px;background:var(--dark-4)}
      .au-step-line.on{background:var(--gold)}

      /* ── Chip email (registro con Google) ── */
      .au-google-chip{display:flex;align-items:center;gap:10px;background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.35);padding:10px 14px;border-radius:11px;margin-bottom:18px}
      .au-google-chip svg{color:var(--gold);flex-shrink:0}
      .au-google-chip-txt{flex:1;min-width:0}
      .au-google-chip-txt p{color:var(--cream-dim);font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:2px}
      .au-google-chip-txt strong{color:var(--cream);font-size:13.5px;font-weight:600;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

      @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }

      @media (max-width: 960px) {
        .au-wrap{grid-template-columns:1fr;min-height:100vh}
        .au-left{padding:26px 20px 26px;order:2}
        .au-right{padding:50px 16px 90px;order:1;min-height:auto;align-items:center}
        .au-testi{display:none}
        .au-trust{position:static;margin-top:24px}
        .au-help{top:14px;right:14px}
        .au-card{margin:16px 0 20px}
      }
    `}</style>
  )
}
