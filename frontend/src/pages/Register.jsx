import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { getDepartments, getMunicipalities } from '../data/colombia'
import { isPasswordValid } from '../utils/passwordValidation'
import PasswordStrength from '../components/PasswordStrength'
import { requiredError, lengthError, emailError, phoneError, combine } from '../utils/validators'
import { SharedStyles } from './Login'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

/* ---------- Iconos (mismos que Login) ---------- */
const Ic = {
  scissors: (s = 22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>,
  store: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l1.5-5h15L21 9"/><path d="M4 9v11h16V9"/><path d="M3 9a3 3 0 006 0 3 3 0 006 0 3 3 0 006 0"/></svg>,
  mail: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 6 10-6"/></svg>,
  phone: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .3 1.9.6 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.1a2 2 0 012.1-.5c.9.3 1.8.5 2.8.6a2 2 0 011.7 2z"/></svg>,
  lock: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>,
  eye: (s = 17) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 12S5 5.5 12 5.5 22.5 12 22.5 12 19 18.5 12 18.5 1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3"/></svg>,
  eyeOff: (s = 17) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9.9 4.2A10.9 10.9 0 0112 4c7 0 10.5 6.5 10.5 6.5a18 18 0 01-3.2 4.2M6.6 6.6A18 18 0 001.5 10.5S5 17 12 17a10.8 10.8 0 004.1-.8"/><line x1="2" y1="2" x2="22" y2="22"/></svg>,
  gift: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/><path d="M12 8S10.5 3 8 3a2.5 2.5 0 000 5M12 8s1.5-5 4-5a2.5 2.5 0 010 5"/></svg>,
  map: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>,
  arrow: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
  back: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M11 18l-6-6 6-6"/></svg>,
  gcolor: () => <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.3l6.7-6.7C35.6 2.1 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6.1C12.3 13.7 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.2-3.1-.5-4.5H24v9h12.7c-.5 2.9-2.2 5.4-4.7 7l7.6 5.9c4.4-4 7-10 7-17.4z"/><path fill="#FBBC05" d="M10.4 28.7c-.5-1.5-.8-3.1-.8-4.7s.3-3.2.8-4.7l-7.8-6.1C.9 16.4 0 20.1 0 24s.9 7.6 2.6 10.8l7.8-6.1z"/><path fill="#34A853" d="M24 48c6.2 0 11.5-2 15.3-5.6l-7.6-5.9c-2.1 1.4-4.8 2.3-7.7 2.3-6.3 0-11.7-4.2-13.6-10l-7.8 6.1C6.5 42.6 14.6 48 24 48z"/></svg>,
  calendar: (s = 22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></svg>,
  chart: (s = 22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 16v-4M12 16V9M16 16v-6"/></svg>,
  users: (s = 22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.9"/><path d="M16 3.1a4 4 0 010 7.8"/></svg>,
  help: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 015.8 1c0 2-3 3-3 3M12 17h.01"/></svg>,
  shield: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  bolt: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2 3 14h9l-1 8 10-12h-9z"/></svg>,
  cloud: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H7a5 5 0 010-10 6 6 0 0111.6 2A4 4 0 0117.5 19z"/></svg>,
}

const BENEFICIOS = [
  { icon: Ic.calendar, title: '14 días gratis',            text: 'Sin tarjeta de crédito. Cancelas cuando quieras.' },
  { icon: Ic.chart,    title: 'Todo listo en 10 minutos',  text: 'Barberos, servicios y horarios de una sola vez.' },
  { icon: Ic.users,    title: 'Tu página de reservas',     text: 'Un enlace propio y un QR para compartir con tus clientes.' },
]

const schema = {
  name:  combine(v => requiredError(v, 'El nombre'), v => lengthError(v, { min: 2, max: 100, label: 'El nombre' })),
  phone: v => phoneError(v),
}

export default function Register() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  // Si venimos del Login tras "Continuar con Google" (usuario nuevo), traemos
  // { googleToken, prefill } en location.state — se prellena y bloquean campos.
  const googleState = location.state?.googleToken ? {
    token: location.state.googleToken,
    prefill: location.state.prefill || {},
  } : null

  const [step, setStep] = useState(1) // 1 = Cuenta, 2 = Ubicación
  const [form, setForm] = useState({
    name:  googleState?.prefill.name  || '',
    email: googleState?.prefill.email || '',
    password: '',
    phone: '',
    department: '',
    municipality: '',
    referral_code_usado: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [touched, setTouched] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)
  const googleBtnRef = useRef(null)

  const isGoogle = !!googleState

  // Validaciones
  const nameErr    = schema.name(form.name)
  const emailErr   = emailError(form.email, { required: true })
  const phoneErr   = schema.phone(form.phone)
  const passOk     = isGoogle || isPasswordValid(form.password, form.email)
  const step1Valid = !nameErr && !emailErr && (isGoogle || passOk)
  const step2Valid = !phoneErr && form.department && form.municipality && acceptedTerms

  const markTouched = (n) => setTouched(t => (t[n] ? t : { ...t, [n]: true }))
  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'department' ? { municipality: '' } : {}),
    }))
    setError('')
    markTouched(name)
  }

  const goToStep2 = () => {
    setTouched(t => ({ ...t, name: true, email: true, password: true }))
    if (!step1Valid) return
    setStep(2)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched(t => ({ ...t, phone: true, department: true, municipality: true }))
    if (!step2Valid) return

    setLoading(true); setError('')
    try {
      const payload = {
        name:  form.name.trim(),
        phone: form.phone.trim(),
        department: form.department,
        municipality: form.municipality.trim(),
        referral_code_usado: form.referral_code_usado.trim().toUpperCase() || undefined,
      }

      let res
      if (isGoogle) {
        res = await api.post('/auth/google/register', { ...payload, id_token: googleState.token })
      } else {
        res = await api.post('/auth/register', {
          ...payload,
          email: form.email.trim(),
          password: form.password,
        })
      }
      login(res.data.token, res.data.barbershop)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo crear tu cuenta. Intenta de nuevo.')
      // Si el error es del email, devolver al paso 1 para que lo pueda editar
      if (err.response?.data?.error?.toLowerCase().includes('email')) setStep(1)
    } finally {
      setLoading(false)
    }
  }

  // Google Sign-In (solo si no venimos ya con un token)
  useEffect(() => {
    if (isGoogle || !GOOGLE_CLIENT_ID) return
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
              // Rellenar el formulario con los datos de Google y quedarse aquí
              setForm(prev => ({
                ...prev,
                name:  res.data.prefill.name || prev.name,
                email: res.data.prefill.email || prev.email,
              }))
              // "Convertir" el registro en modo Google guardando el token en state
              navigate('/register', { replace: true, state: { googleToken: response.credential, prefill: res.data.prefill } })
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
        text: 'signup_with', shape: 'rectangular', logo_alignment: 'left',
        width: Math.min(googleBtnRef.current.clientWidth || 320, 380),
      })
    }
    if (window.google?.accounts?.id) onReady()
    else script.addEventListener('load', onReady)
    return () => script.removeEventListener('load', onReady)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGoogle])

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
          <p className="au-kicker"><span style={{ color:'var(--gold)' }}>◆</span> ÚNETE A BARBERSOFT</p>
          <h1 className="au-headline">Empieza a<br/><em>organizar tu barbería</em></h1>
          <p className="au-lead">Crea tu cuenta y ten tu página de reservas online en minutos. Tus clientes reservan solos, tú solo cortas.</p>
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
            <p>Configuré todo en menos de 15 minutos. A los pocos días ya me llegaban reservas por el enlace.</p>
            <div className="au-testi-who">
              <div className="au-testi-avatar">C</div>
              <div>
                <div className="au-testi-name">Carlos M. — Medellín</div>
                <div className="au-testi-role">Barbería El Patrón</div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <section className="au-right">
        <a
          href="https://wa.me/573116735081?text=Hola,%20necesito%20ayuda%20para%20registrarme%20en%20Barbersoft"
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
          <h2 className="au-title">Crear cuenta</h2>
          <p className="au-sub">14 DÍAS GRATIS · SIN TARJETA</p>
          <div className="au-hr" />

          {/* Progreso */}
          <div className="au-steps">
            <div className={`au-step ${step === 1 ? 'on' : 'done'}`}>
              <div className="au-step-dot">{step > 1 ? '✓' : '1'}</div>
              <span>Cuenta</span>
            </div>
            <div className={`au-step-line ${step > 1 ? 'on' : ''}`} />
            <div className={`au-step ${step === 2 ? 'on' : ''}`}>
              <div className="au-step-dot">2</div>
              <span>Ubicación</span>
            </div>
          </div>

          {error && <div className="au-alert">{error}</div>}

          {/* Chip de Google si venimos con token */}
          {isGoogle && (
            <div className="au-google-chip">
              {Ic.gcolor()}
              <div className="au-google-chip-txt">
                <p>Entrando con Google</p>
                <strong>{form.email}</strong>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <>
                <div style={{ marginBottom: 14 }}>
                  <label className="au-label">Nombre de la barbería</label>
                  <div className="au-field">
                    <span className="au-field-ic">{Ic.store()}</span>
                    <input name="name" value={form.name} onChange={handleChange}
                      onBlur={() => markTouched('name')} placeholder="Ej: Barbería El Paisa" required />
                  </div>
                  {touched.name && nameErr && <p className="au-err">⚠ {nameErr}</p>}
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label className="au-label">Correo electrónico</label>
                  <div className="au-field">
                    <span className="au-field-ic">{Ic.mail()}</span>
                    <input name="email" type="email" value={form.email} onChange={handleChange}
                      onBlur={() => markTouched('email')} placeholder="ejemplo@correo.com" required disabled={isGoogle} />
                  </div>
                  {touched.email && emailErr && <p className="au-err">⚠ {emailErr}</p>}
                </div>

                {!isGoogle && (
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
                        placeholder="Mínimo 8 caracteres"
                        required
                        autoComplete="new-password"
                      />
                      <button type="button" className="au-field-toggle" onClick={() => setShowPassword(p => !p)} tabIndex={-1}>
                        {showPassword ? Ic.eyeOff() : Ic.eye()}
                      </button>
                    </div>
                    <PasswordStrength password={form.password} email={form.email} />
                  </div>
                )}

                <button type="button" className="au-submit" onClick={goToStep2}
                  disabled={!step1Valid}>
                  Continuar {Ic.arrow()}
                </button>

                {!isGoogle && (
                  <>
                    <div className="au-or">O regístrate con</div>
                    <div className="au-google-wrap">
                      {GOOGLE_CLIENT_ID
                        ? <div ref={googleBtnRef} style={{ width:'100%' }} />
                        : <div className="au-google-fake">Google Sign-In no está configurado</div>}
                    </div>
                    {googleLoading && <p style={{ textAlign:'center', color:'var(--cream-dim)', fontSize:12, marginTop:10 }}>Validando con Google...</p>}
                  </>
                )}
              </>
            )}

            {step === 2 && (
              <>
                <div style={{ marginBottom: 14 }}>
                  <label className="au-label">Teléfono de contacto</label>
                  <div className="au-field">
                    <span className="au-field-ic">{Ic.phone()}</span>
                    <input name="phone" type="tel" value={form.phone} onChange={handleChange}
                      onBlur={() => markTouched('phone')} placeholder="Ej: 300 123 4567" required />
                  </div>
                  {touched.phone && phoneErr && <p className="au-err">⚠ {phoneErr}</p>}
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label className="au-label">Departamento</label>
                  <div className="au-field">
                    <span className="au-field-ic">{Ic.map()}</span>
                    <select name="department" value={form.department} onChange={handleChange}
                      onBlur={() => markTouched('department')} required>
                      <option value="">Selecciona tu departamento</option>
                      {getDepartments().map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: 14 }}>
                  <label className="au-label">Municipio</label>
                  <div className="au-field">
                    <span className="au-field-ic">{Ic.map()}</span>
                    <select name="municipality" value={form.municipality} onChange={handleChange}
                      onBlur={() => markTouched('municipality')} disabled={!form.department} required>
                      <option value="">{form.department ? 'Selecciona tu municipio' : 'Primero elige el departamento'}</option>
                      {getMunicipalities(form.department).map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: 18 }}>
                  <label className="au-label">Código de referido <span style={{ color:'var(--cream-dim)', fontWeight:400 }}>(opcional)</span></label>
                  <div className="au-field">
                    <span className="au-field-ic">{Ic.gift()}</span>
                    <input name="referral_code_usado" value={form.referral_code_usado} onChange={handleChange}
                      placeholder="Ej: KEVI-A7X9" />
                  </div>
                </div>

                <label style={{ display:'flex', alignItems:'flex-start', gap:10, color:'var(--cream-dim)', fontSize:12.5, marginBottom:18, lineHeight:1.5, cursor:'pointer' }}>
                  <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} style={{ marginTop:3, accentColor:'var(--gold)' }} />
                  <span>Acepto los términos, condiciones y la política de privacidad de Barbersoft.</span>
                </label>

                <div style={{ display:'flex', gap:10 }}>
                  <button type="button" className="au-secondary" onClick={() => setStep(1)} style={{ flex:1 }}>
                    ← Atrás
                  </button>
                  <button type="submit" className="au-submit" disabled={loading || !step2Valid} style={{ flex:1.6 }}>
                    {loading ? 'Creando cuenta...' : <>Crear mi cuenta {Ic.arrow()}</>}
                  </button>
                </div>
              </>
            )}
          </form>

          <p className="au-bottom">
            ¿Ya tienes cuenta?{' '}
            <button type="button" className="au-link" onClick={() => navigate('/login')}>Iniciar sesión</button>
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
