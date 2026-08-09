import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { getDepartments, getMunicipalities } from '../data/colombia'
import { isPasswordValid } from '../utils/passwordValidation'
import PasswordStrength from '../components/PasswordStrength'
import { requiredError, lengthError, emailError, phoneError, combine } from '../utils/validators'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

const registerSchema = {
  name: combine(v => requiredError(v, 'El nombre'), v => lengthError(v, { min: 2, max: 100, label: 'El nombre' })),
  phone: v => phoneError(v),
  department: v => requiredError(v, 'El departamento'),
  municipality: (v, form) => {
    if (!isRequired(v)) return 'Selecciona el municipio'
    if (form.department && !getMunicipalities(form.department).includes(v)) return 'Selecciona un municipio válido de la lista'
    return null
  },
}
function isRequired(v) { return v !== undefined && v !== null && String(v).trim() !== '' }

/* ---------- Iconos ---------- */
const Ic = {
  scissors: (s = 22) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/></svg>,
  store: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l1.5-5h15L21 9"/><path d="M4 9v11h16V9"/><path d="M3 9a3 3 0 006 0 3 3 0 006 0 3 3 0 006 0"/></svg>,
  phone: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.9v3a2 2 0 01-2.2 2 19.8 19.8 0 01-8.6-3.1 19.5 19.5 0 01-6-6A19.8 19.8 0 012.1 4.2 2 2 0 014.1 2h3a2 2 0 012 1.7c.1 1 .3 1.9.6 2.8a2 2 0 01-.5 2.1L8.1 9.9a16 16 0 006 6l1.3-1.1a2 2 0 012.1-.5c.9.3 1.8.5 2.8.6a2 2 0 011.7 2z"/></svg>,
  gift: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/><path d="M12 8S10.5 3 8 3a2.5 2.5 0 000 5M12 8s1.5-5 4-5a2.5 2.5 0 010 5"/></svg>,
  mail: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M2 7l10 6 10-6"/></svg>,
  lock: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>,
  user: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  tag: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20.6 13.4l-7.2 7.2a2 2 0 01-2.8 0l-8-8V3h9.6l8.4 8.4a2 2 0 010 2z"/><circle cx="7.5" cy="7.5" r="1.2"/></svg>,
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

function Campo({ label, icon, error: err, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label className="au-label">{label}</label>
      <div className="au-field">
        <span className="au-field-ic">{icon}</span>
        {children}
      </div>
      {err && <p className="au-err">⚠ {err}</p>}
    </div>
  )
}

const BENEFICIOS = [
  { icon: Ic.calendar, title: 'Agenda inteligente',      text: 'Organiza citas y recordatorios sin complicaciones.' },
  { icon: Ic.chart,    title: 'Reportes y estadísticas', text: 'Conoce tu negocio y toma mejores decisiones.' },
  { icon: Ic.users,    title: 'Clientes satisfechos',    text: 'Brinda una experiencia premium y fideliza clientes.' },
]

export default function Login() {
  const location = useLocation()
  const [isRegister, setIsRegister]     = useState(new URLSearchParams(location.search).get('register') === 'true')
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ name:'', email:'', password:'', phone:'', department:'', municipality:'', referral_code_usado:'' })
  const [touched, setTouched] = useState({})
  const [acceptedTerms, setAcceptedTerms] = useState(false)

  // Estado para el flujo Google (registro que necesita completar datos)
  const [googleFlow, setGoogleFlow] = useState(null) // { idToken, prefill:{name,email} } | null
  const [googleLoading, setGoogleLoading] = useState(false)
  const googleBtnRef = useRef(null)

  const { login } = useAuth()
  const navigate  = useNavigate()

  const emailErr = emailError(form.email, { required: true })
  const registerErrors = isRegister
    ? Object.keys(registerSchema).reduce((acc, field) => {
        const err = registerSchema[field](form[field], form)
        if (err) acc[field] = err
        return acc
      }, {})
    : {}

  const markTouched = (name) => setTouched(t => (t[name] ? t : { ...t, [name]: true }))

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

  // ─── Google Sign-In (Google Identity Services) ───────────────────
  // Cargamos el script de Google una sola vez y renderizamos el botón.
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return

    let script = document.getElementById('google-identity-script')
    if (!script) {
      script = document.createElement('script')
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.id = 'google-identity-script'
      document.body.appendChild(script)
    }

    const onReady = () => {
      if (!window.google?.accounts?.id || !googleBtnRef.current) return
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (response) => {
          if (!response?.credential) return
          setGoogleLoading(true)
          setError('')
          try {
            const res = await api.post('/auth/google/verify', { id_token: response.credential })
            if (res.data.mode === 'login') {
              // Login exitoso: guardamos token y al dashboard
              login(res.data.token, res.data.barbershop)
              navigate('/dashboard')
            } else if (res.data.mode === 'needs_registration') {
              // Cuenta nueva: mostrar modal para completar los 3 datos faltantes
              setGoogleFlow({
                idToken: response.credential,
                prefill: res.data.prefill,
              })
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
        type: 'standard',
        theme: 'filled_black',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: googleBtnRef.current.clientWidth || 320,
      })
    }

    if (window.google?.accounts?.id) onReady()
    else script.addEventListener('load', onReady)
    return () => script.removeEventListener('load', onReady)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setTouched(t => ({ ...t, name: true, email: true, phone: true, department: true, municipality: true, password: true }))
    if (emailErr) return
    if (isRegister) {
      if (Object.values(registerErrors).some(Boolean)) return
      if (!isPasswordValid(form.password, form.email)) {
        setError('La contraseña no cumple los requisitos de seguridad')
        return
      }
    }
    setLoading(true)
    try {
      const endpoint = isRegister ? '/auth/register' : '/auth/login'
      const payload = {
        ...form,
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        municipality: form.municipality.trim(),
        referral_code_usado: form.referral_code_usado.trim().toUpperCase() || undefined,
      }
      const res = await api.post(endpoint, payload)
      login(res.data.token, res.data.barbershop)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Ocurrió un error. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const isSubmitDisabled = loading
    || !!emailErr
    || (isRegister && (Object.values(registerErrors).some(Boolean) || !isPasswordValid(form.password, form.email) || !acceptedTerms))

  const cambiarModo = () => { setIsRegister(!isRegister); setError(''); setTouched({}) }

  return (
    <div className="au-wrap">
      <style>{`
        .au-wrap{min-height:100vh;display:grid;grid-template-columns:minmax(0,42fr) minmax(0,58fr);background:var(--dark);font-family:var(--font-body,sans-serif);color:var(--cream)}
        /* Panel izquierdo — presentación */
        .au-left{position:relative;padding:clamp(28px,4vw,56px);display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;background:linear-gradient(180deg,#0A0A0A 0%,#0E0E0E 100%)}
        .au-left::before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 30% 30%,rgba(201,168,76,0.09),transparent 60%);pointer-events:none}
        .au-brand{display:flex;align-items:center;gap:10px;color:var(--cream);text-decoration:none;font-family:var(--font-display,Georgia,serif);font-weight:800;font-size:22px;position:relative;z-index:1}
        .au-brand-ic{color:var(--gold)}
        .au-brand em{color:var(--gold);font-style:normal}
        .au-kicker{color:var(--gold);font-size:11px;font-weight:800;letter-spacing:0.18em;margin-bottom:14px;display:inline-flex;align-items:center;gap:8px}
        .au-kicker::before{content:"";width:14px;height:2px;background:var(--gold)}
        .au-headline{font-family:var(--font-display,Georgia,serif);font-size:clamp(34px,4vw,52px);font-weight:800;line-height:1.06;margin-bottom:18px}
        .au-headline em{color:var(--gold);font-style:normal;display:block}
        .au-lead{color:var(--cream-dim);font-size:15px;line-height:1.6;max-width:440px;margin-bottom:26px}
        .au-sep{height:1px;background:linear-gradient(90deg,rgba(201,168,76,0.35),transparent);margin-bottom:26px;width:80px}
        .au-benefits{display:flex;flex-direction:column;gap:16px;margin-bottom:28px;position:relative;z-index:1}
        .au-benefit{display:flex;gap:14px;align-items:flex-start;animation:fadeUp 0.6s ease both;opacity:0}
        .au-benefit.d0{animation-delay:0.05s} .au-benefit.d1{animation-delay:0.15s} .au-benefit.d2{animation-delay:0.25s}
        .au-benefit-ic{width:44px;height:44px;border-radius:11px;background:rgba(201,168,76,0.10);border:1px solid rgba(201,168,76,0.35);color:var(--gold);display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .au-benefit h4{font-family:var(--font-display,Georgia,serif);font-weight:800;color:var(--cream);font-size:16px;margin-bottom:2px}
        .au-benefit p{color:var(--cream-dim);font-size:13px;line-height:1.5}
        .au-testi{background:var(--dark-2);border:1px solid var(--dark-4);border-radius:16px;padding:20px 22px;position:relative;z-index:1;animation:fadeUp 0.7s ease 0.4s both;opacity:0}
        .au-testi-mark{color:var(--gold);font-size:26px;font-family:Georgia,serif;line-height:1;margin-bottom:4px}
        .au-testi p{color:var(--cream);font-size:14px;line-height:1.55;margin-bottom:12px;font-style:italic}
        .au-testi-who{display:flex;align-items:center;gap:10px}
        .au-testi-avatar{width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,var(--gold-dim),var(--gold));display:flex;align-items:center;justify-content:center;color:var(--dark);font-weight:900;font-size:14px;flex-shrink:0}
        .au-testi-who div{line-height:1.3}
        .au-testi-name{color:var(--cream);font-size:13px;font-weight:700}
        .au-testi-role{color:var(--cream-dim);font-size:11.5px}

        /* Panel derecho — formulario */
        .au-right{position:relative;padding:clamp(28px,4vw,56px);display:flex;align-items:center;justify-content:center;background:radial-gradient(ellipse at top,rgba(201,168,76,0.05),transparent 70%),var(--dark)}
        .au-help{position:absolute;top:24px;right:clamp(24px,4vw,48px);display:flex;align-items:center;gap:10px;color:var(--cream-dim);font-size:12.5px;text-decoration:none;background:transparent;border:none;cursor:pointer;font-family:inherit}
        .au-help:hover{color:var(--gold)}
        .au-help-ic{width:28px;height:28px;border-radius:50%;border:1px solid var(--dark-4);display:flex;align-items:center;justify-content:center;color:var(--cream-dim)}
        .au-help strong{color:var(--cream);font-weight:600}
        .au-help em{color:var(--gold);font-style:normal;font-weight:700}
        .au-card{width:100%;max-width:460px;background:var(--dark-2);border:1px solid var(--dark-4);border-radius:20px;padding:44px 40px 34px;position:relative;box-shadow:0 20px 60px rgba(0,0,0,0.35)}
        .au-crown{position:absolute;top:-32px;left:50%;transform:translateX(-50%);width:64px;height:64px;border-radius:50%;background:var(--dark-2);border:1px solid rgba(201,168,76,0.6);display:flex;align-items:center;justify-content:center;color:var(--gold);box-shadow:0 0 40px rgba(201,168,76,0.2)}
        .au-title{font-family:var(--font-display,Georgia,serif);font-size:30px;font-weight:800;text-align:center;color:var(--cream);margin:14px 0 6px}
        .au-sub{text-align:center;color:var(--gold);font-size:11.5px;letter-spacing:0.16em;font-weight:800;margin-bottom:6px}
        .au-hr{height:1px;background:linear-gradient(90deg,transparent,rgba(201,168,76,0.4),transparent);margin:14px 0 24px}
        .au-label{display:block;font-size:12.5px;color:var(--cream);font-weight:600;margin-bottom:7px}
        .au-field{position:relative;display:flex;align-items:center;background:var(--dark-3);border:1px solid var(--dark-4);border-radius:11px;transition:border-color 0.2s}
        .au-field:focus-within{border-color:var(--gold)}
        .au-field-ic{color:var(--gold);opacity:0.7;padding:0 12px;display:flex;align-items:center;flex-shrink:0}
        .au-field input,.au-field select{flex:1;background:transparent;border:none;outline:none;color:var(--cream);font-size:14px;padding:13px 12px 13px 4px;width:100%;font-family:inherit}
        .au-field select{appearance:none;padding-right:36px;cursor:pointer}
        .au-field select option{background:var(--dark-2);color:var(--cream)}
        .au-field-toggle{background:transparent;border:none;color:var(--gold);opacity:0.7;padding:0 12px;cursor:pointer;display:flex;align-items:center}
        .au-err{color:#E05252;font-size:11.5px;margin-top:5px}
        .au-row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:18px;flex-wrap:wrap}
        .au-remember{display:inline-flex;align-items:center;gap:8px;color:var(--cream);font-size:13px;cursor:pointer}
        .au-remember input{display:none}
        .au-remember-box{width:18px;height:18px;border:1px solid var(--gold);border-radius:5px;display:flex;align-items:center;justify-content:center;background:transparent;flex-shrink:0}
        .au-remember input:checked ~ .au-remember-box{background:var(--gold)}
        .au-remember input:checked ~ .au-remember-box::after{content:"✓";color:var(--dark);font-size:12px;font-weight:900}
        .au-link{color:var(--gold);font-size:13px;font-weight:700;background:transparent;border:none;cursor:pointer;padding:0;text-decoration:none}
        .au-link:hover{text-decoration:underline}
        .au-submit{width:100%;padding:16px 0;border-radius:12px;border:none;background:var(--gold);color:var(--dark);font-weight:800;letter-spacing:0.06em;font-size:14px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:10px;transition:all 0.2s;font-family:inherit}
        .au-submit:hover:not(:disabled){background:#E8C97A;transform:translateY(-1px);box-shadow:0 12px 32px rgba(201,168,76,0.28)}
        .au-submit:disabled{background:rgba(201,168,76,0.4);cursor:not-allowed;color:rgba(10,10,10,0.6)}
        .au-or{display:flex;align-items:center;gap:12px;color:var(--cream-dim);font-size:12px;margin:22px 0 16px;text-align:center;justify-content:center}
        .au-or::before,.au-or::after{content:"";flex:1;height:1px;background:var(--dark-4)}
        .au-google-wrap{display:flex;justify-content:center;min-height:48px}
        .au-google-fake{width:100%;padding:12px;border-radius:11px;background:var(--dark-3);border:1px solid var(--dark-4);color:var(--cream-dim);font-size:13px;text-align:center;font-weight:600}
        .au-bottom{margin-top:26px;text-align:center;color:var(--cream-dim);font-size:13px}
        .au-alert{background:rgba(224,82,82,0.09);border:1px solid rgba(224,82,82,0.35);color:#EAA;font-size:13px;padding:11px 14px;border-radius:10px;margin-bottom:16px;text-align:center}
        .au-trust{position:absolute;bottom:26px;left:0;right:0;display:flex;justify-content:center;gap:clamp(20px,4vw,50px);color:var(--cream-dim);font-size:12.5px;flex-wrap:wrap;padding:0 24px}
        .au-trust span{display:inline-flex;align-items:center;gap:6px;color:var(--cream-dim)}
        .au-trust span svg{color:var(--gold)}

        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }

        @media (max-width: 960px) {
          .au-wrap{grid-template-columns:1fr}
          .au-left{padding:28px 20px 30px;order:2}
          .au-right{padding:60px 16px 90px;order:1}
          .au-testi{display:none}
          .au-trust{position:static;margin-top:26px}
          .au-help{top:16px;right:16px}
        }
      `}</style>

      {/* ═══ Panel izquierdo — presentación ═══ */}
      <aside className="au-left">
        <div>
          <a href="/" className="au-brand">
            <span className="au-brand-ic">{Ic.scissors(24)}</span>
            Barber<em>soft</em>
          </a>
        </div>

        <div style={{ position:'relative', zIndex:1 }}>
          <p className="au-kicker"><span style={{ color:'var(--gold)' }}>◆</span> {isRegister ? 'ÚNETE A BARBERSOFT' : 'BIENVENIDO DE NUEVO'}</p>
          <h1 className="au-headline">
            {isRegister ? <>Empieza a organizar<br/><em>tu barbería hoy</em></> : <>Tu barbería,<br/><em>siempre organizada</em></>}
          </h1>
          <p className="au-lead">
            {isRegister
              ? 'Crea tu cuenta gratis y ten tu propia página de reservas online. Sin tarjeta, configuración en minutos.'
              : 'Entra a tu panel y continúa gestionando tus citas, servicios, barberos y clientes desde un solo lugar.'}
          </p>
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

      {/* ═══ Panel derecho — formulario ═══ */}
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

          <h2 className="au-title">{isRegister ? 'Crear cuenta' : 'Iniciar sesión'}</h2>
          <p className="au-sub">{isRegister ? '14 DÍAS GRATIS • SIN TARJETA' : 'ENTRA A TU PANEL DE BARBERSOFT'}</p>
          <div className="au-hr" />

          {error && <div className="au-alert">{error}</div>}

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <>
                <Campo label="Nombre de la barbería" icon={Ic.store()} err={touched.name && registerErrors.name}>
                  <input name="name" value={form.name} onChange={handleChange} onBlur={() => markTouched('name')} placeholder="Ej: Barbería El Paisa" required />
                </Campo>
                <Campo label="Teléfono" icon={Ic.phone()} err={touched.phone && registerErrors.phone}>
                  <input name="phone" value={form.phone} onChange={handleChange} onBlur={() => markTouched('phone')} placeholder="Ej: 300 123 4567" />
                </Campo>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <Campo label="Departamento" icon={Ic.tag()} err={touched.department && registerErrors.department}>
                    <select name="department" value={form.department} onChange={handleChange} onBlur={() => markTouched('department')} required>
                      <option value="">Selecciona</option>
                      {getDepartments().map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </Campo>
                  <Campo label="Municipio" icon={Ic.tag()} err={touched.municipality && registerErrors.municipality}>
                    <select name="municipality" value={form.municipality} onChange={handleChange} onBlur={() => markTouched('municipality')} disabled={!form.department} required>
                      <option value="">{form.department ? 'Selecciona' : 'Elige depto'}</option>
                      {getMunicipalities(form.department).map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </Campo>
                </div>
                <Campo label="Código de referido (opcional)" icon={Ic.gift()}>
                  <input name="referral_code_usado" value={form.referral_code_usado} onChange={handleChange} placeholder="Ej: KEVI-A7X9" />
                </Campo>
              </>
            )}

            <Campo label="Correo electrónico" icon={Ic.mail()} err={touched.email && emailErr}>
              <input name="email" type="email" value={form.email} onChange={handleChange} onBlur={() => markTouched('email')} placeholder="ejemplo@correo.com" required />
            </Campo>

            <Campo label="Contraseña" icon={Ic.lock()}>
              <input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange}
                onBlur={() => markTouched('password')}
                placeholder="••••••••••"
                required
                autoComplete={isRegister ? 'new-password' : 'current-password'}
              />
              <button type="button" className="au-field-toggle" onClick={() => setShowPassword(p => !p)} tabIndex={-1}>
                {showPassword ? Ic.eyeOff() : Ic.eye()}
              </button>
            </Campo>

            {isRegister && <PasswordStrength password={form.password} email={form.email} />}

            {!isRegister && (
              <div className="au-row">
                <label className="au-remember">
                  <input type="checkbox" />
                  <span className="au-remember-box"></span>
                  Recordarme en este dispositivo
                </label>
                <button type="button" className="au-link" onClick={() => navigate('/forgot-password')}>¿Olvidaste tu contraseña?</button>
              </div>
            )}

            {isRegister && (
              <label style={{ display:'flex', alignItems:'flex-start', gap:8, color:'var(--cream-dim)', fontSize:12.5, marginBottom:16, lineHeight:1.5, cursor:'pointer' }}>
                <input type="checkbox" checked={acceptedTerms} onChange={(e) => setAcceptedTerms(e.target.checked)} style={{ marginTop:3 }} />
                <span>Acepto los términos, condiciones y la política de privacidad.</span>
              </label>
            )}

            <button type="submit" className="au-submit" disabled={isSubmitDisabled}>
              {loading ? 'Procesando...' : <>{isRegister ? 'Crear cuenta gratis' : 'Entrar'} {Ic.arrow()}</>}
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
            {isRegister ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
            <button type="button" className="au-link" onClick={cambiarModo}>
              {isRegister ? 'Iniciar sesión' : 'Regístrate gratis'}
            </button>
          </p>
        </div>

        <div className="au-trust">
          <span>{Ic.shield()} Conexión segura</span>
          <span>{Ic.bolt()} Acceso rápido</span>
          <span>{Ic.cloud()} Respaldo automático</span>
        </div>
      </section>

      {/* ═══ Modal: completar datos tras login con Google ═══ */}
      {googleFlow && (
        <GoogleCompleteModal
          idToken={googleFlow.idToken}
          prefill={googleFlow.prefill}
          onClose={() => setGoogleFlow(null)}
          onDone={(token, barbershop) => {
            login(token, barbershop)
            navigate('/dashboard')
          }}
        />
      )}
    </div>
  )
}

/* ═══ Modal para completar datos de registro cuando el usuario entra con Google ═══ */
function GoogleCompleteModal({ idToken, prefill, onClose, onDone }) {
  const [form, setForm] = useState({
    name: prefill.name || '',
    phone: '',
    department: '',
    municipality: '',
    referral_code_usado: '',
  })
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const isValid =
    form.name.trim().length >= 2 &&
    form.phone.trim().length >= 7 &&
    form.department &&
    form.municipality

  const submit = async () => {
    if (!isValid) return
    setBusy(true)
    setErr('')
    try {
      const res = await api.post('/auth/google/register', {
        id_token: idToken,
        name: form.name.trim(),
        phone: form.phone.trim(),
        department: form.department,
        municipality: form.municipality,
        referral_code_usado: form.referral_code_usado.trim().toUpperCase() || undefined,
      })
      onDone(res.data.token, res.data.barbershop)
    } catch (e) {
      setErr(e.response?.data?.error || 'No se pudo completar el registro.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.82)', display:'flex', alignItems:'center', justifyContent:'center', padding:16, zIndex:1000 }}>
      <div style={{ background:'var(--dark-2)', border:'1px solid var(--dark-4)', borderRadius:16, padding:28, maxWidth:460, width:'100%' }}>
        <p style={{ color:'var(--gold)', fontSize:11, letterSpacing:'0.14em', fontWeight:800, textAlign:'center', marginBottom:6 }}>UN ÚLTIMO PASO</p>
        <h3 style={{ fontFamily:'var(--font-display, Georgia, serif)', color:'var(--cream)', fontSize:22, textAlign:'center', marginBottom:6 }}>Completa tu registro</h3>
        <p style={{ color:'var(--cream-dim)', fontSize:13, textAlign:'center', marginBottom:20 }}>Entrando como <strong style={{ color:'var(--cream)' }}>{prefill.email}</strong>. Solo faltan tres datos para crear tu barbería.</p>

        {err && <div style={{ background:'rgba(224,82,82,0.1)', border:'1px solid rgba(224,82,82,0.3)', color:'#EAA', padding:'9px 12px', borderRadius:9, fontSize:12.5, marginBottom:14, textAlign:'center' }}>{err}</div>}

        <label style={{ display:'block', fontSize:12, color:'var(--cream)', fontWeight:600, marginBottom:6 }}>Nombre de la barbería</label>
        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: Barbería El Paisa"
          style={{ width:'100%', background:'var(--dark-3)', border:'1px solid var(--dark-4)', borderRadius:10, padding:'11px 14px', color:'var(--cream)', fontSize:14, marginBottom:12 }} />

        <label style={{ display:'block', fontSize:12, color:'var(--cream)', fontWeight:600, marginBottom:6 }}>Teléfono</label>
        <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="300 123 4567"
          style={{ width:'100%', background:'var(--dark-3)', border:'1px solid var(--dark-4)', borderRadius:10, padding:'11px 14px', color:'var(--cream)', fontSize:14, marginBottom:12 }} />

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
          <div>
            <label style={{ display:'block', fontSize:12, color:'var(--cream)', fontWeight:600, marginBottom:6 }}>Departamento</label>
            <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value, municipality: '' })}
              style={{ width:'100%', background:'var(--dark-3)', border:'1px solid var(--dark-4)', borderRadius:10, padding:'11px 14px', color:'var(--cream)', fontSize:14 }}>
              <option value="">Selecciona</option>
              {getDepartments().map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display:'block', fontSize:12, color:'var(--cream)', fontWeight:600, marginBottom:6 }}>Municipio</label>
            <select value={form.municipality} onChange={e => setForm({ ...form, municipality: e.target.value })} disabled={!form.department}
              style={{ width:'100%', background:'var(--dark-3)', border:'1px solid var(--dark-4)', borderRadius:10, padding:'11px 14px', color:'var(--cream)', fontSize:14 }}>
              <option value="">{form.department ? 'Selecciona' : 'Elige depto'}</option>
              {getMunicipalities(form.department).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        <label style={{ display:'block', fontSize:12, color:'var(--cream)', fontWeight:600, marginBottom:6 }}>Código de referido (opcional)</label>
        <input value={form.referral_code_usado} onChange={e => setForm({ ...form, referral_code_usado: e.target.value })} placeholder="Ej: KEVI-A7X9"
          style={{ width:'100%', background:'var(--dark-3)', border:'1px solid var(--dark-4)', borderRadius:10, padding:'11px 14px', color:'var(--cream)', fontSize:14, marginBottom:20 }} />

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} disabled={busy}
            style={{ flex:1, padding:12, borderRadius:10, border:'1px solid var(--dark-4)', background:'transparent', color:'var(--cream-dim)', fontWeight:600, cursor:'pointer' }}>
            Cancelar
          </button>
          <button onClick={submit} disabled={!isValid || busy}
            style={{ flex:1.5, padding:12, borderRadius:10, border:'none', background:(!isValid||busy)?'rgba(201,168,76,0.4)':'var(--gold)', color:'var(--dark)', fontWeight:800, cursor:(!isValid||busy)?'not-allowed':'pointer' }}>
            {busy ? 'Creando...' : 'Crear mi barbería'}
          </button>
        </div>
      </div>
    </div>
  )
}
