import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import HelpButton from '../components/HelpButton'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { getDepartments, getMunicipalities } from '../data/colombia'
import { requiredError, lengthError, phoneError, combine } from '../utils/validators'
import { useToast } from '../context/ToastContext'
import ReferralCard from '../components/ReferralCard'

const infoSchema = {
  name: combine(v => requiredError(v, 'El nombre'), v => lengthError(v, { min: 2, max: 100, label: 'El nombre' })),
  phone: v => phoneError(v),
  municipality: (v, form) => {
    if (v && form.department && !getMunicipalities(form.department).includes(v)) {
      return 'Selecciona un municipio válido de la lista del departamento elegido'
    }
    return null
  },
}

export default function Settings() {
  const { barbershop, login } = useAuth()
  const { pathname }          = useLocation()
  const toast = useToast()
  const [saving, setSaving]   = useState(false)
  const [subscribing, setSubscribing] = useState(null)
  const [tab, setTab]         = useState('info')
  const [form, setForm]       = useState({
    name:         barbershop?.name         || '',
    phone:        barbershop?.phone        || '',
    department:   barbershop?.department   || '',
    municipality: barbershop?.municipality || '',
  })
  const [touched, setTouched] = useState({})

  const infoErrors = Object.keys(infoSchema).reduce((acc, field) => {
    const err = infoSchema[field](form[field], form)
    if (err) acc[field] = err
    return acc
  }, {})
  const hasInfoErrors = Object.values(infoErrors).some(Boolean)

  const markTouched = (name) => setTouched(t => (t[name] ? t : { ...t, [name]: true }))

  const handleChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); markTouched(e.target.name) }
  const handleDepartmentChange = (e) => { setForm({ ...form, department: e.target.value, municipality: '' }); markTouched('department') }

  const handleSaveInfo = async () => {
    setTouched(t => ({ ...t, name: true, phone: true, municipality: true }))
    if (hasInfoErrors) return
    setSaving(true)
    try {
      const res = await api.put('/auth/profile', {
        ...form,
        name: form.name.trim(),
        phone: form.phone.trim(),
        municipality: form.municipality.trim(),
      })
      login(localStorage.getItem('token'), { ...barbershop, ...res.data.barbershop })
      toast.success('Información actualizada correctamente')
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudieron guardar los cambios. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const trialDaysLeft = () => {
    if (!barbershop?.trial_ends_at) return 0
    const diff = new Date(barbershop.trial_ends_at) - new Date()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  const statusConfig = {
    trial:   { label:'Período de prueba', color:'var(--gold)',    bg:'rgba(201,168,76,0.12)'  },
    active:  { label:'Activa',            color:'#C9A84C',        bg:'rgba(201,168,76,0.12)'  },
    blocked: { label:'Bloqueada',         color:'#E8C97A',        bg:'rgba(232,201,122,0.12)'   },
  }

  const status = barbershop?.subscription_status || 'trial'
  const sc     = statusConfig[status]

  const tabs = [
    { id:'info',     label:'Mi barbería' },
    { id:'sub',      label:'Suscripción' },
    { id:'referrals', label:'Referidos' },
  ]

  const inp = { width:'100%', padding:'12px 16px' }

  return (
    <div style={{ minHeight:'100vh', background:'var(--dark)', display:'flex', flexDirection:'column' }}>
      <Navbar />
      <main style={{ maxWidth:720, margin:'0 auto', padding:'40px 24px', flex:1, width:'100%' }}>

        <div className="animate-fade-up" style={{ marginBottom:32 }}>
          <p style={{ color:'var(--gold)', fontSize:11, letterSpacing:'0.1em', fontWeight:600, marginBottom:4 }}>AJUSTES</p>
          <h1 style={{ fontSize:36, fontWeight:900, color:'var(--cream)' }}>Configuración</h1>
        </div>

        {/* Tabs */}
        <div className="animate-fade-up delay-1" style={{ display:'flex', gap:4, background:'var(--dark-2)', border:'1px solid var(--dark-4)', borderRadius:10, padding:4, marginBottom:24 }}>
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{ flex:1, padding:'9px 0', borderRadius:7, border:'none', background: tab === t.id ? 'var(--gold)' : 'transparent', color: tab === t.id ? 'var(--dark)' : 'var(--cream-dim)', fontSize:12, fontWeight:700, letterSpacing:'0.06em', cursor:'pointer', transition:'all 0.2s', fontFamily: 'var(--font-body)' }}
            >
              {t.label.toUpperCase()}
            </button>
          ))}
        </div>

        {/* ── Tab: Info ── */}
        {tab === 'info' && (
          <div className="animate-fade-up" style={{ background:'var(--dark-2)', border:'1px solid var(--dark-4)', borderRadius:12, padding:28 }}>
            <p style={{ color:'var(--gold)', fontSize:11, letterSpacing:'0.08em', fontWeight:600, marginBottom:20 }}>DATOS DE LA BARBERÍA</p>

            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div>
                <label style={{ display:'block', fontSize:11, letterSpacing:'0.07em', color:'var(--cream-dim)', marginBottom:6, fontWeight:600 }}>NOMBRE</label>
                <input name="name" value={form.name} onChange={handleChange} onBlur={() => markTouched('name')} placeholder="Nombre de tu barbería" style={{ ...inp, border: '1px solid ' + (touched.name && infoErrors.name ? '#E8C97A' : 'var(--dark-4)') }} />
                {touched.name && infoErrors.name && <p style={{ color:'#E8C97A', fontSize:12, marginTop:6 }}>⚠ {infoErrors.name}</p>}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <div>
                  <label style={{ display:'block', fontSize:11, letterSpacing:'0.07em', color:'var(--cream-dim)', marginBottom:6, fontWeight:600 }}>TELÉFONO</label>
                  <input name="phone" value={form.phone} onChange={handleChange} onBlur={() => markTouched('phone')} placeholder="3001234567" style={{ ...inp, border: '1px solid ' + (touched.phone && infoErrors.phone ? '#E8C97A' : 'var(--dark-4)') }} />
                  {touched.phone && infoErrors.phone && <p style={{ color:'#E8C97A', fontSize:12, marginTop:6 }}>⚠ {infoErrors.phone}</p>}
                </div>
                <div>
                  <label style={{ display:'block', fontSize:11, letterSpacing:'0.07em', color:'var(--cream-dim)', marginBottom:6, fontWeight:600 }}>EMAIL</label>
                  <input value={barbershop?.email || ''} disabled style={{ ...inp, opacity:0.4, cursor:'not-allowed' }} />
                  <p style={{ color:'var(--cream-dim)', fontSize:11, marginTop:4, opacity:0.5 }}>El email no se puede cambiar</p>
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <div>
                  <label style={{ display:'block', fontSize:11, letterSpacing:'0.07em', color:'var(--cream-dim)', marginBottom:6, fontWeight:600 }}>DEPARTAMENTO</label>
                  <select name="department" value={form.department} onChange={handleDepartmentChange} style={inp}>
                    <option value="">Selecciona...</option>
                    {getDepartments().map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:11, letterSpacing:'0.07em', color:'var(--cream-dim)', marginBottom:6, fontWeight:600 }}>MUNICIPIO</label>
                  <input
                    name="municipality"
                    list="municipios-settings"
                    value={form.municipality}
                    onChange={handleChange}
                    onBlur={() => markTouched('municipality')}
                    disabled={!form.department}
                    placeholder={form.department ? 'Escribe para buscar...' : 'Elige un departamento primero'}
                    autoComplete="off"
                    style={{ ...inp, opacity: form.department ? 1 : 0.5, border: '1px solid ' + (touched.municipality && infoErrors.municipality ? '#E8C97A' : 'var(--dark-4)') }}
                  />
                  <datalist id="municipios-settings">
                    {getMunicipalities(form.department).map(m => <option key={m} value={m} />)}
                  </datalist>
                  {touched.municipality && infoErrors.municipality && <p style={{ color:'#E8C97A', fontSize:12, marginTop:6 }}>⚠ {infoErrors.municipality}</p>}
                </div>
              </div>

              <div style={{ background:'var(--dark-3)', border:'1px solid var(--dark-4)', borderRadius:10, padding:'12px 16px' }}>
                <p style={{ color:'var(--cream-dim)', fontSize:11, letterSpacing:'0.07em', fontWeight:600, marginBottom:4 }}>LINK DE RESERVAS PÚBLICO</p>
                <p style={{ color:'var(--gold)', fontSize:13, fontFamily:'monospace' }}>
                  /reservar/{barbershop?.slug}
                </p>
                <p style={{ color:'var(--cream-dim)', fontSize:11, marginTop:4, opacity:0.6 }}>
                  Comparte este link con tus clientes para que reserven su cita
                </p>
              </div>

              <button
                onClick={handleSaveInfo}
                disabled={saving || hasInfoErrors}
                className="btn-primary"
                style={{ opacity: (saving || hasInfoErrors) ? 0.6 : 1, alignSelf:'flex-start' }}
              >
                {saving ? 'GUARDANDO...' : 'GUARDAR CAMBIOS'}
              </button>
            </div>
          </div>
        )}

        {/* ── Tab: Suscripción ── */}
        {tab === 'sub' && (
          <div className="animate-fade-up">
            <div style={{ background:'var(--dark-2)', border:'1px solid var(--dark-4)', borderRadius:12, padding:28, marginBottom:16 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
                <p style={{ color:'var(--gold)', fontSize:11, letterSpacing:'0.08em', fontWeight:600 }}>ESTADO DE TU PLAN</p>
                <span style={{ background:sc.bg, color:sc.color, fontSize:11, fontWeight:700, padding:'4px 12px', borderRadius:20, letterSpacing:'0.06em' }}>
                  {sc.label.toUpperCase()}
                </span>
              </div>

              {status === 'trial' && (
                <div>
                  <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:8 }}>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize:48, fontWeight:900, color:'var(--gold)', lineHeight:1 }}>{trialDaysLeft()}</span>
                    <span style={{ color:'var(--cream-dim)', fontSize:14 }}>días restantes de prueba</span>
                  </div>
                  <div style={{ height:4, background:'var(--dark-3)', borderRadius:2, marginBottom:12, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:(trialDaysLeft()/14*100)+'%', background:'linear-gradient(90deg, var(--gold-dim), var(--gold))', borderRadius:2 }} />
                  </div>
                  <p style={{ color:'var(--cream-dim)', fontSize:13, lineHeight:1.6 }}>
                    Tu prueba gratuita vence el{' '}
                    <strong style={{ color:'var(--cream)' }}>
                      {new Date(barbershop?.trial_ends_at).toLocaleDateString('es-CO', { day:'numeric', month:'long', year:'numeric' })}
                    </strong>
                  </p>
                </div>
              )}

              {status === 'active' && (
                <p style={{ color:'var(--cream)', fontSize:14 }}>
                  Suscripción activa hasta el{' '}
                  <strong style={{ color:'var(--gold)' }}>
                    {new Date(barbershop?.subscription_ends_at).toLocaleDateString('es-CO', { day:'numeric', month:'long', year:'numeric' })}
                  </strong>
                </p>
              )}

              {status === 'blocked' && (
                <p style={{ color:'#E8C97A', fontSize:14 }}>
                  Tu cuenta está bloqueada. Realiza el pago para reactivar el acceso.
                </p>
              )}
            </div>

            {/* Plan */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr', maxWidth:360, gap:16 }}>
              {[
                { label:'PLAN BARBERSOFT', price:'$50.000', billing:'Facturado mensualmente · cancela cuando quieras', features:['Citas ilimitadas','Barberos ilimitados','Página de reservas pública','Recordatorios automáticos por correo','Panel con estadísticas del negocio','Asistente con IA para tus clientes','Soporte por WhatsApp'] },
              ].map(plan => (
                <div key={plan.label} style={{ background:'var(--dark-2)', border:'1px solid rgba(201,168,76,0.35)', borderRadius:12, padding:24, position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg, transparent, var(--gold), transparent)' }} />
                  <p style={{ color:'var(--cream-dim)', fontSize:11, letterSpacing:'0.1em', fontWeight:600, marginBottom:8 }}>{plan.label}</p>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize:32, fontWeight:900, color:'var(--gold)', marginBottom:2 }}>{plan.price}</p>
                  <p style={{ color:'var(--cream-dim)', fontSize:11, marginBottom:16, opacity:0.6 }}>{plan.billing}</p>
                  <ul style={{ listStyle:'none', marginBottom:20 }}>
                    {plan.features.map(f => (
                      <li key={f} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'var(--cream)', marginBottom:6 }}>
                        <span style={{ color:'#C9A84C', fontWeight:700 }}>✓</span>{f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => {
  setSubscribing('monthly')
  api.post('/subscription/create-preference', { plan: 'monthly' })
    .then(res => { window.location.href = res.data.sandbox_point })
    .catch(err => {
      toast.error(err.response?.data?.error || 'No se pudo iniciar el pago. Intenta de nuevo.')
      setSubscribing(null)
    })
}}
                    disabled={subscribing === 'monthly' || status === 'active'}
                    className="btn-primary"
                    style={{ width:'100%', padding:'11px 0', fontSize:11, opacity: subscribing === 'monthly' ? 0.6 : 1 }}
                  >
                    {subscribing === 'monthly'
                      ? 'REDIRIGIENDO...'
                      : status === 'active'
                      ? 'PLAN ACTUAL'
                      : 'SUSCRIBIRME'}
                  </button>
                </div>
              ))}
            </div>

            <p style={{ textAlign:'center', color:'var(--cream-dim)', fontSize:12, marginTop:16, opacity:0.5 }}>
              Pagos procesados de forma segura · PSE · Nequi · Tarjeta
            </p>
          </div>
        )}

        {/* ── Tab: Referidos ── */}
        {tab === 'referrals' && (
          <div className="animate-fade-up">
            <ReferralCard />
          </div>
        )}

      </main>
      <Footer />
      <HelpButton path={pathname} />
    </div>
  )
}