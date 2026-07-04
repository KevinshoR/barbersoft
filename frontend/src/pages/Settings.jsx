import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import HelpButton from '../components/HelpButton'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { getDepartments, getMunicipalities } from '../data/colombia'
import { requiredError, lengthError, phoneError, combine } from '../utils/validators'

function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [])
  const c = type === 'success'
    ? { bg:'rgba(76,175,125,0.12)', border:'rgba(76,175,125,0.4)', color:'#4CAF7D', icon:'✓' }
    : { bg:'rgba(224,82,82,0.12)',  border:'rgba(224,82,82,0.4)',  color:'#E05252', icon:'✕' }
  return (
    <div className="animate-fade-up" style={{ position:'fixed', top:80, right:24, zIndex:998, background:c.bg, border:'1px solid '+c.border, color:c.color, borderRadius:10, padding:'14px 20px', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:10, minWidth:260, boxShadow:'0 8px 32px rgba(0,0,0,0.4)' }}>
      <span>{c.icon}</span>{message}
      <button onClick={onClose} style={{ marginLeft:'auto', background:'none', border:'none', color:'inherit', cursor:'pointer', fontSize:16, opacity:0.6 }}>×</button>
    </div>
  )
}

const PAYMENT_METHODS = [
  { id:'nequi',    label:'Nequi',          icon:'📱', desc:'Pagos móviles Nequi' },
  { id:'pse',      label:'PSE',            icon:'🏦', desc:'Débito bancario en línea' },
  { id:'efectivo', label:'Efectivo',       icon:'💵', desc:'Pago en el local' },
  { id:'tarjeta',  label:'Tarjeta débito', icon:'💳', desc:'Débito o crédito' },
  { id:'transfer', label:'Transferencia',  icon:'🔄', desc:'Transferencia bancaria' },
]

const infoSchema = {
  name: combine(v => requiredError(v, 'El nombre'), v => lengthError(v, { min: 2, max: 100, label: 'El nombre' })),
  phone: v => phoneError(v),
  municipality: (v, form) => {
    if (v && form.department && !getMunicipalities(form.department).includes(v)) {
      return 'Seleccioná un municipio válido de la lista del departamento elegido'
    }
    return null
  },
}

export default function Settings() {
  const { barbershop, login } = useAuth()
  const { pathname }          = useLocation()
  const [toast, setToast]     = useState(null)
  const [saving, setSaving]   = useState(false)
  const [tab, setTab]         = useState('info')
  const [form, setForm]       = useState({
    name:         barbershop?.name         || '',
    phone:        barbershop?.phone        || '',
    department:   barbershop?.department   || '',
    municipality: barbershop?.municipality || '',
  })
  const [payments, setPayments] = useState({
    nequi: false, pse: false, efectivo: true,
    tarjeta: false, transfer: false,
    nequi_number: '', account_name: ''
  })
  const [touched, setTouched] = useState({})
  const [paymentsTouched, setPaymentsTouched] = useState({})

  const infoErrors = Object.keys(infoSchema).reduce((acc, field) => {
    const err = infoSchema[field](form[field], form)
    if (err) acc[field] = err
    return acc
  }, {})
  const hasInfoErrors = Object.values(infoErrors).some(Boolean)

  const nequiNumberError = payments.nequi ? phoneError(payments.nequi_number, { required: true }) : null
  const nequiNameError   = payments.nequi ? requiredError(payments.account_name, 'El nombre de la cuenta') : null
  const hasPaymentErrors = !!(nequiNumberError || nequiNameError)

  const showToast = (message, type = 'success') => setToast({ message, type })

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
      showToast('Información actualizada correctamente')
    } catch (err) {
      showToast(err.response?.data?.error || 'Error guardando cambios', 'error')
    } finally {
      setSaving(false)
    }
  }

  const togglePayment = (id) => {
    setPayments(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const trialDaysLeft = () => {
    if (!barbershop?.trial_ends_at) return 0
    const diff = new Date(barbershop.trial_ends_at) - new Date()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  const statusConfig = {
    trial:   { label:'Período de prueba', color:'var(--gold)',    bg:'rgba(201,168,76,0.12)'  },
    active:  { label:'Activa',            color:'#4CAF7D',        bg:'rgba(76,175,125,0.12)'  },
    blocked: { label:'Bloqueada',         color:'#E05252',        bg:'rgba(224,82,82,0.12)'   },
  }

  const status = barbershop?.subscription_status || 'trial'
  const sc     = statusConfig[status]

  const tabs = [
    { id:'info',     label:'Mi barbería' },
    { id:'payments', label:'Métodos de pago' },
    { id:'sub',      label:'Suscripción' },
  ]

  const inp = { width:'100%', padding:'12px 16px' }

  return (
    <div style={{ minHeight:'100vh', background:'var(--dark)' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <Navbar />
      <main style={{ maxWidth:720, margin:'0 auto', padding:'40px 24px' }}>

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
              style={{ flex:1, padding:'9px 0', borderRadius:7, border:'none', background: tab === t.id ? 'var(--gold)' : 'transparent', color: tab === t.id ? 'var(--dark)' : 'var(--cream-dim)', fontSize:12, fontWeight:700, letterSpacing:'0.06em', cursor:'pointer', transition:'all 0.2s', fontFamily:'DM Sans' }}
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
                <input name="name" value={form.name} onChange={handleChange} onBlur={() => markTouched('name')} placeholder="Nombre de tu barbería" style={{ ...inp, border: '1px solid ' + (touched.name && infoErrors.name ? '#E05252' : 'var(--dark-4)') }} />
                {touched.name && infoErrors.name && <p style={{ color:'#E05252', fontSize:12, marginTop:6 }}>⚠ {infoErrors.name}</p>}
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                <div>
                  <label style={{ display:'block', fontSize:11, letterSpacing:'0.07em', color:'var(--cream-dim)', marginBottom:6, fontWeight:600 }}>TELÉFONO</label>
                  <input name="phone" value={form.phone} onChange={handleChange} onBlur={() => markTouched('phone')} placeholder="3001234567" style={{ ...inp, border: '1px solid ' + (touched.phone && infoErrors.phone ? '#E05252' : 'var(--dark-4)') }} />
                  {touched.phone && infoErrors.phone && <p style={{ color:'#E05252', fontSize:12, marginTop:6 }}>⚠ {infoErrors.phone}</p>}
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
                    <option value="">Seleccioná...</option>
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
                    placeholder={form.department ? 'Escribí para buscar...' : 'Elegí un departamento primero'}
                    autoComplete="off"
                    style={{ ...inp, opacity: form.department ? 1 : 0.5, border: '1px solid ' + (touched.municipality && infoErrors.municipality ? '#E05252' : 'var(--dark-4)') }}
                  />
                  <datalist id="municipios-settings">
                    {getMunicipalities(form.department).map(m => <option key={m} value={m} />)}
                  </datalist>
                  {touched.municipality && infoErrors.municipality && <p style={{ color:'#E05252', fontSize:12, marginTop:6 }}>⚠ {infoErrors.municipality}</p>}
                </div>
              </div>

              <div style={{ background:'var(--dark-3)', border:'1px solid var(--dark-4)', borderRadius:10, padding:'12px 16px' }}>
                <p style={{ color:'var(--cream-dim)', fontSize:11, letterSpacing:'0.07em', fontWeight:600, marginBottom:4 }}>LINK DE RESERVAS PÚBLICO</p>
                <p style={{ color:'var(--gold)', fontSize:13, fontFamily:'monospace' }}>
                  /reservar/{barbershop?.slug}
                </p>
                <p style={{ color:'var(--cream-dim)', fontSize:11, marginTop:4, opacity:0.6 }}>
                  Compartí este link con tus clientes para que reserven su cita
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

        {/* ── Tab: Métodos de pago ── */}
        {tab === 'payments' && (
          <div className="animate-fade-up">
            <div style={{ background:'var(--dark-2)', border:'1px solid var(--dark-4)', borderRadius:12, padding:28, marginBottom:16 }}>
              <p style={{ color:'var(--gold)', fontSize:11, letterSpacing:'0.08em', fontWeight:600, marginBottom:6 }}>MÉTODOS DE PAGO ACEPTADOS</p>
              <p style={{ color:'var(--cream-dim)', fontSize:13, marginBottom:20, lineHeight:1.6 }}>
                Activá los métodos que aceptás. Tus clientes los verán en la página de reservas.
              </p>

              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {PAYMENT_METHODS.map(method => (
                  <div
                    key={method.id}
                    onClick={() => togglePayment(method.id)}
                    style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', background: payments[method.id] ? 'rgba(201,168,76,0.06)' : 'var(--dark-3)', border:'1px solid ' + (payments[method.id] ? 'rgba(201,168,76,0.25)' : 'var(--dark-4)'), borderRadius:10, cursor:'pointer', transition:'all 0.2s' }}
                  >
                    <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                      <span style={{ fontSize:22 }}>{method.icon}</span>
                      <div>
                        <p style={{ color:'var(--cream)', fontSize:14, fontWeight:600 }}>{method.label}</p>
                        <p style={{ color:'var(--cream-dim)', fontSize:12, marginTop:2 }}>{method.desc}</p>
                      </div>
                    </div>
                    <div style={{ width:44, height:24, borderRadius:12, background: payments[method.id] ? 'var(--gold)' : 'var(--dark-4)', position:'relative', transition:'background 0.2s', flexShrink:0 }}>
                      <div style={{ position:'absolute', top:3, left: payments[method.id] ? 23 : 3, width:18, height:18, borderRadius:'50%', background: payments[method.id] ? 'var(--dark)' : 'var(--cream-dim)', transition:'left 0.2s' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {payments.nequi && (
              <div className="animate-fade-up" style={{ background:'var(--dark-2)', border:'1px solid var(--dark-4)', borderRadius:12, padding:24 }}>
                <p style={{ color:'var(--gold)', fontSize:11, letterSpacing:'0.08em', fontWeight:600, marginBottom:16 }}>DATOS DE NEQUI</p>
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  <div>
                    <label style={{ display:'block', fontSize:11, color:'var(--cream-dim)', marginBottom:6, fontWeight:600, letterSpacing:'0.07em' }}>NÚMERO NEQUI</label>
                    <input
                      value={payments.nequi_number}
                      onChange={e => setPayments(p => ({ ...p, nequi_number: e.target.value }))}
                      onBlur={() => setPaymentsTouched(t => ({ ...t, nequi_number: true }))}
                      placeholder="3001234567"
                      style={{ ...inp, border: '1px solid ' + (paymentsTouched.nequi_number && nequiNumberError ? '#E05252' : 'var(--dark-4)') }}
                    />
                    {paymentsTouched.nequi_number && nequiNumberError && <p style={{ color:'#E05252', fontSize:12, marginTop:6 }}>⚠ {nequiNumberError}</p>}
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:11, color:'var(--cream-dim)', marginBottom:6, fontWeight:600, letterSpacing:'0.07em' }}>NOMBRE DE LA CUENTA</label>
                    <input
                      value={payments.account_name}
                      onChange={e => setPayments(p => ({ ...p, account_name: e.target.value }))}
                      onBlur={() => setPaymentsTouched(t => ({ ...t, account_name: true }))}
                      placeholder="Tu nombre completo"
                      style={{ ...inp, border: '1px solid ' + (paymentsTouched.account_name && nequiNameError ? '#E05252' : 'var(--dark-4)') }}
                    />
                    {paymentsTouched.account_name && nequiNameError && <p style={{ color:'#E05252', fontSize:12, marginTop:6 }}>⚠ {nequiNameError}</p>}
                  </div>
                </div>
              </div>
            )}

            <button
              className="btn-primary"
              style={{ marginTop:16, opacity: hasPaymentErrors ? 0.6 : 1 }}
              disabled={hasPaymentErrors}
              onClick={() => {
                setPaymentsTouched({ nequi_number: true, account_name: true })
                if (hasPaymentErrors) return
                showToast('Métodos de pago guardados')
              }}
            >
              GUARDAR MÉTODOS
            </button>
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
                    <span style={{ fontFamily:'Playfair Display', fontSize:48, fontWeight:900, color:'var(--gold)', lineHeight:1 }}>{trialDaysLeft()}</span>
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
                <p style={{ color:'#E05252', fontSize:14 }}>
                  Tu cuenta está bloqueada. Realizá el pago para reactivar el acceso.
                </p>
              )}
            </div>

            {/* Planes */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
              {[
                { label:'MENSUAL', price:'$89.900', billing:'Facturado mensualmente', features:['Citas ilimitadas','Barberos ilimitados','Reservas públicas','Recordatorios WhatsApp'] },
                { label:'ANUAL',   price:'$69.900', billing:'Facturado anualmente · 2 meses gratis', features:['Todo lo del mensual','Soporte prioritario','Funciones anticipadas','Reportes avanzados'], hot:true },
              ].map(plan => (
                <div key={plan.label} style={{ background:'var(--dark-2)', border:'1px solid ' + (plan.hot ? 'rgba(201,168,76,0.35)' : 'var(--dark-4)'), borderRadius:12, padding:24, position:'relative', overflow:'hidden' }}>
                  {plan.hot && <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg, transparent, var(--gold), transparent)' }} />}
                  <p style={{ color:'var(--cream-dim)', fontSize:11, letterSpacing:'0.1em', fontWeight:600, marginBottom:8 }}>{plan.label}</p>
                  <p style={{ fontFamily:'Playfair Display', fontSize:32, fontWeight:900, color: plan.hot ? 'var(--gold)' : 'var(--cream)', marginBottom:2 }}>{plan.price}</p>
                  <p style={{ color:'var(--cream-dim)', fontSize:11, marginBottom:16, opacity:0.6 }}>{plan.billing}</p>
                  <ul style={{ listStyle:'none', marginBottom:20 }}>
                    {plan.features.map(f => (
                      <li key={f} style={{ display:'flex', alignItems:'center', gap:8, fontSize:12, color:'var(--cream)', marginBottom:6 }}>
                        <span style={{ color:'#4CAF7D', fontWeight:700 }}>✓</span>{f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => {
  api.post('/subscription/create-preference', { plan: plan.label === 'MENSUAL' ? 'monthly' : 'annual' })
    .then(res => { window.location.href = res.data.sandbox_point })
    .catch(() => alert('Error iniciando el pago'))
}}
                    className={plan.hot ? 'btn-primary' : 'btn-secondary'}
                    style={{ width:'100%', padding:'11px 0', fontSize:11 }}
                  >
                    {status === 'active' ? 'PLAN ACTUAL' : 'SUSCRIBIRME'}
                  </button>
                </div>
              ))}
            </div>

            <p style={{ textAlign:'center', color:'var(--cream-dim)', fontSize:12, marginTop:16, opacity:0.5 }}>
              Pagos procesados de forma segura · PSE · Nequi · Tarjeta
            </p>
          </div>
        )}

        <Footer />
      </main>
      <HelpButton path={pathname} />
    </div>
  )
}