import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { getDepartments, getMunicipalities } from '../data/colombia'
import { isPasswordValid } from '../utils/passwordValidation'
import PasswordStrength from '../components/PasswordStrength'
import { requiredError, lengthError, emailError, phoneError, combine } from '../utils/validators'

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

/* ---------- Iconos (trazo fino, heredan color) ---------- */
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
  calendar: (s = 20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 11h18"/></svg>,
  chart: (s = 20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M8 16v-4M12 16V9M16 16v-6"/></svg>,
  users: (s = 20) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 00-3-3.9"/><path d="M16 3.1a4 4 0 010 7.8"/></svg>,
  arrow: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
}

/* Campo con icono a la izquierda.
   Va FUERA del componente: si se declara dentro del render, React lo trata como
   un tipo nuevo en cada tecleo y remonta el input, perdiendo el foco. */
function Campo({ label, icon, error: err, children }) {
  return (
    <div>
      <label className="au-label">{label}</label>
      <div className="au-field">
        <span className="au-field-ic">{icon}</span>
        {children}
      </div>
      {err && <p className="au-err">⚠ {err}</p>}
    </div>
  )
}

/* Beneficios del panel izquierdo */
const BENEFICIOS = [
  { icon: Ic.calendar, title: 'Agenda inteligente',    text: 'Organiza citas y recordatorios sin complicaciones.' },
  { icon: Ic.chart,    title: 'Reportes y estadísticas', text: 'Conoce tu negocio y toma mejores decisiones.' },
  { icon: Ic.users,    title: 'Clientes satisfechos',  text: 'Brinda una experiencia premium y fideliza clientes.' },
]

export default function Login() {
  const location   = useLocation()
  const [isRegister, setIsRegister]     = useState(new URLSearchParams(location.search).get('register') === 'true')
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ name:'', email:'', password:'', phone:'', department:'', municipality:'', referral_code_usado:'' })
  const [touched, setTouched] = useState({})
  const [acceptedTerms, setAcceptedTerms] = useState(false)

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
      ...(name === 'department' ? { municipality: '' } : {})
    }))
    setError('')
    markTouched(name)
  }

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
        .au-wrap{min-height:100vh;display:grid;grid-template-columns:minmax(0,44fr) minmax(0,56fr);background:var(--dark);font-family:var(--font-body)}
        /* ---- Panel izquierdo ---- */
        .au-side{position:relative;padding:40px 48px;display:flex;flex-direction:column;overflow:hidden;
          background:
            radial-gradient(120% 80% at 20% 0%, rgba(201,168,76,0.16) 0%, transparent 55%),
            radial-gradient(90% 60% at 85% 75%, rgba(201,168,76,0.08) 0%, transparent 60%),
            linear-gradient(160deg,#141110 0%,#0D0D0D 55%,#100E0C 100%);
          border-right:1px solid var(--dark-4)}
        .au-side::after{content:'';position:absolute;inset:0;pointer-events:none;
          background:radial-gradient(60% 40% at 10% 10%, rgba(232,201,122,0.10) 0%, transparent 70%)}
        .au-side-in{position:relative;z-index:1;display:flex;flex-direction:column;height:100%}
        .au-logo{display:flex;align-items:center;gap:10px;background:none;border:none;padding:0;cursor:pointer;color:var(--gold);width:fit-content}
        .au-logo span{font-family:var(--font-display);font-size:26px;font-weight:700;color:var(--cream);letter-spacing:-.01em}
        .au-logo span i{color:var(--gold);font-style:normal}
        .au-kicker{color:var(--gold);font-size:11.5px;font-weight:700;letter-spacing:.16em;margin-bottom:14px}
        .au-h1{font-family:var(--font-display);font-size:40px;line-height:1.16;color:var(--cream);font-weight:700;letter-spacing:-.01em;margin:0 0 18px}
        .au-h1 em{font-style:normal;color:var(--gold)}
        .au-sub{color:var(--cream-dim);font-size:15px;line-height:1.6;max-width:400px;margin:0}
        .au-rule{width:64px;height:1px;background:var(--gold);opacity:.55;margin:30px 0}
        .au-benef{display:flex;gap:14px;margin-bottom:22px;max-width:420px}
        .au-benef-ic{flex-shrink:0;width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;
          background:rgba(201,168,76,0.10);border:1px solid rgba(201,168,76,0.28);color:var(--gold)}
        .au-benef h3{font-family:var(--font-display);font-size:16.5px;color:var(--cream);margin:2px 0 4px;font-weight:600}
        .au-benef p{color:var(--cream-dim);font-size:13.5px;line-height:1.55;margin:0}
        .au-quote{margin-top:auto;background:rgba(255,255,255,0.035);border:1px solid var(--dark-4);border-radius:14px;padding:20px 22px;max-width:400px}
        .au-quote-mark{font-family:var(--font-display);color:var(--gold);font-size:30px;line-height:1;margin-bottom:6px}
        .au-quote p{color:var(--cream);font-size:14px;line-height:1.6;margin:0 0 16px}
        .au-quote-who{display:flex;align-items:center;gap:11px}
        .au-avatar{width:36px;height:36px;border-radius:50%;background:var(--dark-3);border:1px solid var(--dark-4);display:flex;align-items:center;justify-content:center;color:var(--gold);font-weight:700;font-size:14px;flex-shrink:0}
        .au-quote-who b{display:block;color:var(--cream);font-size:13.5px;font-weight:600}
        .au-quote-who small{color:var(--cream-dim);font-size:12px}
        /* ---- Panel derecho ---- */
        .au-main{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:56px 32px 40px;overflow-y:auto}
        .au-card{position:relative;width:100%;max-width:560px;background:var(--dark-2);border:1px solid var(--dark-4);border-radius:20px;padding:52px 40px 34px;margin-top:34px}
        .au-badge{position:absolute;top:-34px;left:50%;transform:translateX(-50%);width:68px;height:68px;border-radius:50%;
          background:var(--dark);border:1px solid var(--gold);display:flex;align-items:center;justify-content:center;color:var(--gold)}
        .au-title{font-family:var(--font-display);font-size:34px;font-weight:700;color:var(--cream);text-align:center;margin:0 0 8px;letter-spacing:-.01em}
        .au-note{text-align:center;color:var(--gold);font-size:11.5px;font-weight:700;letter-spacing:.13em;margin:0 0 26px}
        /* stepper */
        .au-steps{display:flex;align-items:flex-start;justify-content:center;margin-bottom:28px}
        .au-step{display:flex;flex-direction:column;align-items:center;gap:8px;width:118px}
        .au-step-n{width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12.5px;font-weight:700;
          border:1px solid var(--dark-4);color:var(--cream-dim);background:var(--dark-3)}
        .au-step.on .au-step-n{background:var(--gold);border-color:var(--gold);color:var(--dark)}
        .au-step small{font-size:11.5px;color:var(--cream-dim);text-align:center;line-height:1.35}
        .au-step.on small{color:var(--cream)}
        .au-step-line{flex:1;height:1px;background:var(--dark-4);margin-top:14px;min-width:24px}
        .au-step-line.on{background:var(--gold)}
        /* secciones */
        .au-sec{display:flex;align-items:center;gap:9px;color:var(--gold);font-size:11.5px;font-weight:700;letter-spacing:.13em;margin:0 0 16px}
        .au-sec span{color:var(--cream-dim);font-weight:500;letter-spacing:0;font-size:11px}
        .au-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px 18px}
        .au-label{display:block;font-size:13px;color:var(--cream);margin-bottom:7px;font-weight:500}
        .au-field{position:relative;display:flex;align-items:center}
        .au-field-ic{position:absolute;left:14px;display:flex;color:var(--cream-dim);opacity:.75;pointer-events:none}
        .au-field input,.au-field select{width:100%;background:var(--dark-3);border:1px solid var(--dark-4);border-radius:10px;
          padding:13px 14px 13px 42px;color:var(--cream);font-size:14px;font-family:var(--font-body);outline:none;appearance:none}
        .au-field select{cursor:pointer;padding-right:38px}
        .au-field input:focus,.au-field select:focus{border-color:var(--gold)}
        .au-field input::placeholder{color:var(--cream-dim);opacity:.55}
        .au-field input:disabled,.au-field select:disabled{opacity:.45;cursor:not-allowed}
        .au-chev{position:absolute;right:14px;color:var(--cream-dim);pointer-events:none;font-size:11px}
        .au-eye{position:absolute;right:12px;background:none;border:none;cursor:pointer;color:var(--cream-dim);display:flex;padding:4px}
        .au-help{color:var(--cream-dim);font-size:11.5px;line-height:1.5;margin:7px 0 0}
        .au-err{color:var(--gold-light);font-size:12px;margin:6px 0 0}
        .au-div{height:1px;background:var(--dark-4);margin:26px 0}
        .au-submit{width:100%;margin-top:6px;padding:15px 0;border:none;border-radius:11px;cursor:pointer;
          background:linear-gradient(180deg,var(--gold-light) 0%,var(--gold) 100%);color:#1A1408;
          font-family:var(--font-body);font-size:14.5px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:9px}
        .au-submit:disabled{opacity:.5;cursor:not-allowed}
        .au-terms{text-align:center;color:var(--cream-dim);font-size:11.5px;line-height:1.6;margin:16px 0 0}
        .au-terms a{color:var(--gold);text-decoration:none}
        .au-terms a:hover{text-decoration:underline}
        .au-foot{margin-top:24px;color:var(--cream-dim);font-size:13.5px;text-align:center}
        .au-foot button{background:none;border:none;color:var(--gold);font-size:13.5px;font-weight:700;cursor:pointer;font-family:var(--font-body)}
        .au-foot button:hover{text-decoration:underline}
        .au-alert{background:rgba(232,201,122,0.10);border:1px solid rgba(232,201,122,0.32);color:var(--gold-light);
          border-radius:10px;padding:12px 15px;margin-bottom:20px;font-size:13px}
        .au-forgot{background:none;border:none;color:var(--cream-dim);font-size:12.5px;cursor:pointer;display:block;margin:14px auto 0;font-family:var(--font-body)}
        .au-forgot:hover{color:var(--cream)}
        .au-consent{display:flex;align-items:flex-start;gap:10px;margin-top:18px;cursor:pointer}
        .au-consent input{margin-top:2px;width:16px;height:16px;accent-color:var(--gold);cursor:pointer;flex-shrink:0}
        .au-consent span{color:var(--cream-dim);font-size:11.5px;line-height:1.6}
        .au-consent a{color:var(--gold);text-decoration:none}
        .au-consent a:hover{text-decoration:underline}
        @media (max-width:960px){
          .au-wrap{grid-template-columns:1fr}
          .au-side{display:none}
          .au-main{padding:40px 18px 32px}
          .au-card{padding:48px 22px 30px}
          .au-grid{grid-template-columns:1fr}
          .au-title{font-size:28px}
          .au-step{width:96px}
          .au-step small{font-size:10.5px}
        }
      `}</style>

      {/* ══════════ Panel izquierdo: marca y beneficios ══════════ */}
      <aside className="au-side">
        <div className="au-side-in">
          <button className="au-logo" onClick={() => navigate('/')} title="Ir al sitio de Barbersoft">
            {Ic.scissors(26)}
            <span>Barber<i>soft</i></span>
          </button>

          <div style={{ marginTop: 'clamp(36px,7vh,72px)' }}>
            <p className="au-kicker">{isRegister ? 'ÚNETE A BARBERSOFT' : 'BIENVENIDO DE NUEVO'}</p>
            <h1 className="au-h1">
              {isRegister ? <>Gestiona tu barbería<br /><em>como un profesional</em></> : <>Tu barbería,<br /><em>siempre organizada</em></>}
            </h1>
            <p className="au-sub">
              Agenda citas, administra servicios, controla tu equipo y haz crecer tu negocio desde un solo lugar.
            </p>
            <div className="au-rule" />

            {BENEFICIOS.map(b => (
              <div className="au-benef" key={b.title}>
                <div className="au-benef-ic">{b.icon()}</div>
                <div>
                  <h3>{b.title}</h3>
                  <p>{b.text}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="au-quote">
            <div className="au-quote-mark">”</div>
            <p>Desde que uso Barbersoft, mi barbería es más organizada y mis clientes están más felices.</p>
            <div className="au-quote-who">
              <div className="au-avatar">J</div>
              <div>
                <b>Juan C. — Barranquilla</b>
                <small>Barbería JC</small>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ══════════ Panel derecho: formulario ══════════ */}
      <main className="au-main">
        <div className="au-card">
          <div className="au-badge">{Ic.scissors(30)}</div>

          <h2 className="au-title">{isRegister ? 'Crear cuenta' : 'Iniciar sesión'}</h2>
          <p className="au-note">
            {isRegister ? '14 DÍAS GRATIS • SIN TARJETA DE CRÉDITO' : 'ENTRA A TU PANEL DE BARBERSOFT'}
          </p>

          {isRegister && (
            <div className="au-steps">
              <div className="au-step on">
                <div className="au-step-n">1</div>
                <small>Datos de tu barbería</small>
              </div>
              <div className="au-step-line on" />
              <div className="au-step">
                <div className="au-step-n">2</div>
                <small>Cuenta de acceso</small>
              </div>
              <div className="au-step-line" />
              <div className="au-step">
                <div className="au-step-n">3</div>
                <small>¡Listo!</small>
              </div>
            </div>
          )}

          {error && <div className="au-alert">{error}</div>}

          <form onSubmit={handleSubmit}>
            {isRegister && (
              <>
                <p className="au-sec">{Ic.store(15)} DATOS DE TU BARBERÍA</p>
                <div className="au-grid">
                  <Campo label="Nombre de la barbería" icon={Ic.store()} error={touched.name && registerErrors.name}>
                    <input name="name" value={form.name} onChange={handleChange} onBlur={() => markTouched('name')}
                      placeholder="Ej: Barbería El Paisa" required />
                  </Campo>

                  <Campo label="Teléfono" icon={Ic.phone()} error={touched.phone && registerErrors.phone}>
                    <input name="phone" value={form.phone} onChange={handleChange} onBlur={() => markTouched('phone')}
                      placeholder="Ej: 300 123 4567" />
                  </Campo>

                  <div>
                    <label className="au-label">Departamento</label>
                    <div className="au-field">
                      <span className="au-field-ic">{Ic.tag()}</span>
                      <select name="department" value={form.department} onChange={handleChange}
                        onBlur={() => markTouched('department')} required>
                        <option value="">Selecciona un departamento</option>
                        {getDepartments().map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <span className="au-chev">▼</span>
                    </div>
                    {touched.department && registerErrors.department && <p className="au-err">⚠ {registerErrors.department}</p>}
                  </div>

                  <div>
                    <label className="au-label">Municipio</label>
                    <div className="au-field">
                      <span className="au-field-ic">{Ic.tag()}</span>
                      <select name="municipality" value={form.municipality} onChange={handleChange}
                        onBlur={() => markTouched('municipality')} disabled={!form.department} required>
                        <option value="">{form.department ? 'Selecciona un municipio' : 'Elige un departamento'}</option>
                        {getMunicipalities(form.department).map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <span className="au-chev">▼</span>
                    </div>
                    {touched.municipality && registerErrors.municipality && <p className="au-err">⚠ {registerErrors.municipality}</p>}
                  </div>
                </div>

                <div className="au-div" />

                <p className="au-sec">{Ic.gift(15)} CÓDIGO DE REFERIDO <span>(OPCIONAL)</span></p>
                <div className="au-field">
                  <span className="au-field-ic">{Ic.gift()}</span>
                  <input
                    name="referral_code_usado"
                    value={form.referral_code_usado}
                    onChange={(e) => setForm(f => ({ ...f, referral_code_usado: e.target.value.toUpperCase() }))}
                    placeholder="Ej: KEVI-A7X9"
                    autoComplete="off"
                    style={{ letterSpacing: '0.05em' }}
                  />
                </div>
                <p className="au-help">¿Te recomendaron? Ingresa su código y ambos ganan 15 días gratis al activar tu plan.</p>

                <div className="au-div" />
              </>
            )}

            <p className="au-sec">{Ic.user(15)} CUENTA DE ACCESO</p>

            <div style={{ marginBottom: 14 }}>
              <label className="au-label">Correo electrónico</label>
              <div className="au-field">
                <span className="au-field-ic">{Ic.mail()}</span>
                <input name="email" type="email" value={form.email} onChange={handleChange}
                  onBlur={() => markTouched('email')} placeholder="ejemplo@correo.com" required />
              </div>
              {touched.email && emailErr && <p className="au-err">⚠ {emailErr}</p>}
            </div>

            <div>
              <label className="au-label">Contraseña</label>
              <div className="au-field">
                <span className="au-field-ic">{Ic.lock()}</span>
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder={isRegister ? 'Crea una contraseña segura' : '••••••••'}
                  required
                  style={{ paddingRight: 46 }}
                />
                <button type="button" className="au-eye" onClick={() => setShowPassword(p => !p)}
                  title={showPassword ? 'Ocultar' : 'Mostrar'}>
                  {showPassword ? Ic.eyeOff() : Ic.eye()}
                </button>
              </div>
              {isRegister && !form.password && <p className="au-help">Mínimo 8 caracteres, con letras y números.</p>}
              {isRegister && form.password && <PasswordStrength password={form.password} email={form.email} />}
            </div>

            {isRegister && (
              <label className="au-consent">
                <input type="checkbox" checked={acceptedTerms} onChange={e => setAcceptedTerms(e.target.checked)} />
                <span>
                  He leído y acepto los{' '}
                  <a href="/terminos" target="_blank" rel="noopener noreferrer">Términos y condiciones</a> y la{' '}
                  <a href="/privacidad" target="_blank" rel="noopener noreferrer">Política de privacidad</a>,
                  incluyendo el tratamiento de mis datos personales.
                </span>
              </label>
            )}

            <button type="submit" disabled={isSubmitDisabled} className="au-submit" style={{ marginTop: isRegister ? 20 : 22 }}>
              {loading ? 'Cargando...' : isRegister ? <>Crear cuenta {Ic.arrow()}</> : <>Entrar {Ic.arrow()}</>}
            </button>
          </form>

          {!isRegister && (
            <button className="au-forgot" onClick={() => navigate('/forgot-password')}>
              ¿Olvidaste tu contraseña?
            </button>
          )}
        </div>

        <p className="au-foot">
          {isRegister ? '¿Ya tienes cuenta?  ' : '¿No tienes cuenta?  '}
          <button onClick={cambiarModo}>{isRegister ? 'Iniciar sesión' : 'Regístrate gratis'}</button>
        </p>
      </main>
    </div>
  )
}
