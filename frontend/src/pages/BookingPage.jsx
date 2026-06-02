import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'

function validate(form) {
  const errors = {}
if (!form.scheduled_at) {
  errors.scheduled_at = 'La fecha y hora son obligatorias'
} else {
  const selected = new Date(form.scheduled_at)
  const minDate  = new Date(Date.now() + 30 * 60 * 1000)        // 30 min desde ahora
  const maxDate  = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 1 mes
  if (selected < minDate) errors.scheduled_at = 'La cita debe ser al menos 30 minutos desde ahora'
  if (selected > maxDate) errors.scheduled_at = 'La cita no puede ser a más de 1 mes de distancia'
}
  return errors
}

const formatPrice = (p) => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', minimumFractionDigits: 0
}).format(p)

const STEPS = ['Servicio', 'Barbero', 'Fecha', 'Tus datos']

export default function BookingPage() {
  const { slug } = useParams()
const navigate = useNavigate()
  const [shop, setShop]         = useState(null)
  const [barbers, setBarbers]   = useState([])
  const [services, setServices] = useState([])
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [success, setSuccess]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [step, setStep]         = useState(0)
  const [errors, setErrors]     = useState({})
  const [apiError, setApiError] = useState('')
  const [form, setForm] = useState({
    barber_id: '', service_id: '', client_name: '',
    client_phone: '', client_email: '', scheduled_at: '', notes: ''
  })

  useEffect(() => {
    api.get('/public/' + slug)
      .then(res => {
        setShop(res.data.shop)
        setBarbers(res.data.barbers)
        setServices(res.data.services)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  const handleChange = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: '' }))
    setApiError('')
  }

  const handleSubmit = async () => {
    const errs = validate(form)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    try {
      await api.post('/public/' + slug + '/book', {
        ...form,
        barber_id:  parseInt(form.barber_id),
        service_id: parseInt(form.service_id),
      })
      setSuccess(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setApiError(err.response?.data?.error || 'Error al reservar. Intentá de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const selectedService = services.find(s => s.id === parseInt(form.service_id))
  const selectedBarber  = barbers.find(b => b.id === parseInt(form.barber_id))

  const canNext = () => {
    if (step === 0) return !!form.service_id
    if (step === 1) return !!form.barber_id
    if (step === 2) return !!form.scheduled_at && new Date(form.scheduled_at) > new Date()
    return form.client_name.trim().length >= 2 && /^[0-9]{7,15}$/.test(form.client_phone.replace(/\s/g, ''))
  }

  const s = { // estilos base
    card: { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 20, cursor: 'pointer', transition: 'all 0.2s', marginBottom: 10 },
    cardSelected: { background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.5)', borderRadius: 14, padding: 20, cursor: 'pointer', transition: 'all 0.2s', marginBottom: 10 },
    inp: (name) => ({ width: '100%', padding: '13px 16px', background: 'rgba(255,255,255,0.05)', border: '1px solid ' + (errors[name] ? '#E05252' : 'rgba(255,255,255,0.1)'), color: '#F5F0E8', borderRadius: 10, fontSize: 14, fontFamily: 'DM Sans', outline: 'none' }),
    label: { display: 'block', fontSize: 11, letterSpacing: '0.07em', color: '#B8B0A0', marginBottom: 7, fontWeight: 600 },
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, color: '#C9A84C', marginBottom: 16, animation: 'fadeUp 0.5s ease forwards' }}>✂</div>
        <p style={{ color: '#B8B0A0', fontSize: 13, letterSpacing: '0.1em' }}>CARGANDO...</p>
      </div>
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 48, color: '#C9A84C', marginBottom: 16 }}>✂</p>
        <h2 style={{ color: '#F5F0E8', fontFamily: 'Playfair Display', fontSize: 28, marginBottom: 8 }}>Barbería no encontrada</h2>
        <p style={{ color: '#B8B0A0', fontSize: 14 }}>Verificá que el enlace sea correcto</p>
      </div>
    </div>
  )

  if (success) return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="animate-fade-up" style={{ background: '#161616', border: '1px solid #2A2A2A', borderRadius: 20, padding: '48px 40px', maxWidth: 440, width: '100%', textAlign: 'center' }}>

        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(76,175,125,0.12)', border: '1px solid rgba(76,175,125,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', fontSize: 36, color: '#4CAF7D' }}>✓</div>

        <h2 style={{ fontFamily: 'Playfair Display', fontSize: 32, color: '#F5F0E8', marginBottom: 10 }}>¡Reserva confirmada!</h2>
        <p style={{ color: '#B8B0A0', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
          Tu cita en <strong style={{ color: '#F5F0E8' }}>{shop.name}</strong> fue agendada. Te contactaremos para confirmar.
        </p>

        {selectedService && selectedBarber && (
          <div style={{ background: '#1F1F1F', borderRadius: 12, padding: '20px 24px', marginBottom: 28, textAlign: 'left' }}>
            <p style={{ color: '#B8B0A0', fontSize: 10, letterSpacing: '0.1em', fontWeight: 600, marginBottom: 14 }}>RESUMEN DE TU CITA</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#B8B0A0', fontSize: 13 }}>Servicio</span>
                <span style={{ color: '#F5F0E8', fontSize: 13, fontWeight: 600 }}>{selectedService.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#B8B0A0', fontSize: 13 }}>Barbero</span>
                <span style={{ color: '#F5F0E8', fontSize: 13, fontWeight: 600 }}>{selectedBarber.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#B8B0A0', fontSize: 13 }}>Duración</span>
                <span style={{ color: '#F5F0E8', fontSize: 13, fontWeight: 600 }}>{selectedService.duration_min} min</span>
              </div>
              <div style={{ height: 1, background: '#2A2A2A', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#B8B0A0', fontSize: 13 }}>Total</span>
                <span style={{ color: '#C9A84C', fontSize: 16, fontWeight: 700, fontFamily: 'Playfair Display' }}>{formatPrice(selectedService.price)}</span>
              </div>
            </div>
          </div>
        )}
<button
  onClick={() => navigate(`/reservar/${slug}/mis-citas`)}
  style={{ background: '#C9A84C', color: '#0A0A0A', border: 'none', padding: '13px 28px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', fontFamily: 'DM Sans', marginBottom: 12, width: '100%' }}
>
  VER MIS CITAS
</button>
        <button
          onClick={() => {
            setSuccess(false)
            setStep(0)
            setForm({ barber_id: '', service_id: '', client_name: '', client_phone: '', client_email: '', scheduled_at: '', notes: '' })
          }}
          style={{ background: 'transparent', border: '1px solid #2A2A2A', color: '#B8B0A0', padding: '11px 28px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', fontFamily: 'DM Sans' }}
        >
          HACER OTRA RESERVA
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', fontFamily: 'DM Sans' }}>

      {/* Header del local */}
      <div style={{ background: '#161616', borderBottom: '1px solid #1F1F1F', padding: '36px 24px 28px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ fontSize: 40, color: '#C9A84C', marginBottom: 10 }}>✂</div>
        <h1 style={{ fontFamily: 'Playfair Display', fontSize: 34, fontWeight: 900, color: '#F5F0E8', marginBottom: 8, letterSpacing: '-0.02em' }}>{shop.name}</h1>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
          {shop.address && <p style={{ color: '#B8B0A0', fontSize: 13 }}>📍 {shop.address}</p>}
          {shop.phone   && <p style={{ color: '#B8B0A0', fontSize: 13 }}>📞 {shop.phone}</p>}
        </div>
      </div>

      <main style={{ maxWidth: 520, margin: '0 auto', padding: '32px 20px 60px' }}>

        {/* Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
          {STEPS.map((label, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: i < step ? 'var(--success)' : i === step ? '#C9A84C' : '#1F1F1F', border: '1px solid ' + (i < step ? 'rgba(76,175,125,0.5)' : i === step ? 'rgba(201,168,76,0.5)' : '#2A2A2A'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: i <= step ? '#0D0D0D' : '#B8B0A0', fontWeight: 700, transition: 'all 0.3s' }}>
                  {i < step ? '✓' : i + 1}
                </div>
                <p style={{ fontSize: 10, color: i === step ? '#C9A84C' : '#B8B0A0', fontWeight: i === step ? 700 : 400, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{label.toUpperCase()}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 1, background: i < step ? 'rgba(76,175,125,0.3)' : '#1F1F1F', margin: '0 8px', marginBottom: 20, transition: 'background 0.3s' }} />
              )}
            </div>
          ))}
        </div>

        {apiError && (
          <div className="animate-fade-up" style={{ background: 'rgba(224,82,82,0.1)', border: '1px solid rgba(224,82,82,0.3)', color: '#E05252', borderRadius: 10, padding: '14px 18px', marginBottom: 20, fontSize: 13, fontWeight: 600 }}>
            ⚠ {apiError}
          </div>
        )}

        {/* PASO 0 — Elegir servicio */}
        {step === 0 && (
          <div className="animate-fade-up">
            <h2 style={{ fontFamily: 'Playfair Display', fontSize: 26, color: '#F5F0E8', marginBottom: 6 }}>¿Qué servicio querés?</h2>
            <p style={{ color: '#B8B0A0', fontSize: 13, marginBottom: 24 }}>Elegí el servicio que necesitás</p>
            {services.map(service => (
              <div
                key={service.id}
                onClick={() => handleChange('service_id', String(service.id))}
                style={form.service_id === String(service.id) ? s.cardSelected : s.card}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ color: '#F5F0E8', fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{service.name}</p>
                    <p style={{ color: '#B8B0A0', fontSize: 13 }}>⏱ {service.duration_min} minutos</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: '#C9A84C', fontFamily: 'Playfair Display', fontWeight: 700, fontSize: 20 }}>{formatPrice(service.price)}</p>
                    {form.service_id === String(service.id) && (
                      <p style={{ color: '#4CAF7D', fontSize: 11, fontWeight: 700, marginTop: 4 }}>✓ SELECCIONADO</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PASO 1 — Elegir barbero */}
        {step === 1 && (
          <div className="animate-fade-up">
            <h2 style={{ fontFamily: 'Playfair Display', fontSize: 26, color: '#F5F0E8', marginBottom: 6 }}>¿Con quién querés?</h2>
            <p style={{ color: '#B8B0A0', fontSize: 13, marginBottom: 24 }}>Elegí tu barbero de confianza</p>
            {barbers.map(barber => (
              <div
                key={barber.id}
                onClick={() => handleChange('barber_id', String(barber.id))}
                style={form.barber_id === String(barber.id) ? s.cardSelected : s.card}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: form.barber_id === String(barber.id) ? 'rgba(201,168,76,0.2)' : '#1F1F1F', border: '1px solid ' + (form.barber_id === String(barber.id) ? 'rgba(201,168,76,0.4)' : '#2A2A2A'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontFamily: 'Playfair Display', fontWeight: 900, color: '#C9A84C', flexShrink: 0 }}>
                    {barber.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: '#F5F0E8', fontWeight: 600, fontSize: 15 }}>{barber.name}</p>
                    {form.barber_id === String(barber.id) && (
                      <p style={{ color: '#4CAF7D', fontSize: 11, fontWeight: 700, marginTop: 3 }}>✓ SELECCIONADO</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PASO 2 — Elegir fecha y hora */}
        {step === 2 && (
          <div className="animate-fade-up">
            <h2 style={{ fontFamily: 'Playfair Display', fontSize: 26, color: '#F5F0E8', marginBottom: 6 }}>¿Cuándo venís?</h2>
            <p style={{ color: '#B8B0A0', fontSize: 13, marginBottom: 24 }}>Elegí el día y hora que mejor te quede</p>

            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 24 }}>
              <label style={s.label}>FECHA Y HORA</label>
              <input
                type="datetime-local"
                value={form.scheduled_at}
                onChange={e => handleChange('scheduled_at', e.target.value)}
                style={s.inp('scheduled_at')}
              />
              {errors.scheduled_at && <p style={{ color: '#E05252', fontSize: 12, marginTop: 6 }}>⚠ {errors.scheduled_at}</p>}
            </div>

            {selectedService && selectedBarber && form.scheduled_at && (
              <div className="animate-fade-up" style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 12, padding: '16px 20px', marginTop: 16 }}>
                <p style={{ color: '#B8B0A0', fontSize: 11, letterSpacing: '0.08em', fontWeight: 600, marginBottom: 10 }}>RESUMEN</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <p style={{ color: '#F5F0E8', fontSize: 13 }}>✦ {selectedService.name} — {selectedService.duration_min}min</p>
                  <p style={{ color: '#F5F0E8', fontSize: 13 }}>✂ {selectedBarber.name}</p>
                  <p style={{ color: '#C9A84C', fontSize: 13 }}>📅 {new Date(form.scheduled_at).toLocaleString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* PASO 3 — Datos personales */}
        {step === 3 && (
          <div className="animate-fade-up">
            <h2 style={{ fontFamily: 'Playfair Display', fontSize: 26, color: '#F5F0E8', marginBottom: 6 }}>Tus datos</h2>
            <p style={{ color: '#B8B0A0', fontSize: 13, marginBottom: 24 }}>Para confirmar y recordarte tu cita</p>

            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={s.label}>NOMBRE COMPLETO</label>
                <input value={form.client_name} onChange={e => handleChange('client_name', e.target.value)} placeholder="Juan Pérez" style={s.inp('client_name')} />
                {errors.client_name && <p style={{ color: '#E05252', fontSize: 12, marginTop: 6 }}>⚠ {errors.client_name}</p>}
              </div>
              <div>
                <label style={s.label}>TELÉFONO / WHATSAPP</label>
                <input value={form.client_phone} onChange={e => handleChange('client_phone', e.target.value)} placeholder="3001234567" style={s.inp('client_phone')} />
                {errors.client_phone && <p style={{ color: '#E05252', fontSize: 12, marginTop: 6 }}>⚠ {errors.client_phone}</p>}
              </div>
              <div>
                <label style={s.label}>EMAIL <span style={{ opacity: 0.5 }}>(OPCIONAL)</span></label>
                <input type="email" value={form.client_email} onChange={e => handleChange('client_email', e.target.value)} placeholder="tucorreo@email.com" style={s.inp('client_email')} />
                {errors.client_email && <p style={{ color: '#E05252', fontSize: 12, marginTop: 6 }}>⚠ {errors.client_email}</p>}
              </div>
              <div>
                <label style={s.label}>NOTAS <span style={{ opacity: 0.5 }}>(OPCIONAL)</span></label>
                <input value={form.notes} onChange={e => handleChange('notes', e.target.value)} placeholder="Alguna indicación especial..." style={s.inp('notes')} />
              </div>
            </div>

            {/* Resumen final */}
            {selectedService && selectedBarber && (
              <div style={{ background: '#161616', border: '1px solid #2A2A2A', borderRadius: 12, padding: '20px 24px', marginTop: 16 }}>
                <p style={{ color: '#B8B0A0', fontSize: 10, letterSpacing: '0.1em', fontWeight: 600, marginBottom: 14 }}>RESUMEN FINAL</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#B8B0A0', fontSize: 13 }}>Servicio</span>
                    <span style={{ color: '#F5F0E8', fontSize: 13, fontWeight: 600 }}>{selectedService.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#B8B0A0', fontSize: 13 }}>Barbero</span>
                    <span style={{ color: '#F5F0E8', fontSize: 13, fontWeight: 600 }}>{selectedBarber.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#B8B0A0', fontSize: 13 }}>Fecha</span>
                    <span style={{ color: '#F5F0E8', fontSize: 13, fontWeight: 600 }}>
                      {new Date(form.scheduled_at).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ height: 1, background: '#2A2A2A', margin: '4px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#B8B0A0', fontSize: 13 }}>Total</span>
                    <span style={{ color: '#C9A84C', fontSize: 18, fontWeight: 700, fontFamily: 'Playfair Display' }}>{formatPrice(selectedService.price)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Navegación */}
        <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              style={{ flex: 1, background: 'transparent', border: '1px solid #2A2A2A', color: '#B8B0A0', padding: '14px 0', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', fontFamily: 'DM Sans' }}
            >
              ← ATRÁS
            </button>
          )}

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => canNext() && setStep(step + 1)}
              disabled={!canNext()}
              style={{ flex: 2, background: canNext() ? '#C9A84C' : '#1F1F1F', color: canNext() ? '#0D0D0D' : '#B8B0A0', border: '1px solid ' + (canNext() ? '#C9A84C' : '#2A2A2A'), padding: '14px 0', borderRadius: 10, cursor: canNext() ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', fontFamily: 'DM Sans', transition: 'all 0.2s' }}
            >
              SIGUIENTE →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saving || !canNext()}
              style={{ flex: 2, background: saving ? '#8B6914' : '#C9A84C', color: '#0D0D0D', border: 'none', padding: '14px 0', borderRadius: 10, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', fontFamily: 'DM Sans', transition: 'background 0.2s' }}
            >
              {saving ? 'RESERVANDO...' : 'CONFIRMAR RESERVA ✓'}
            </button>
          )}
        </div>

        <p style={{ textAlign: 'center', color: '#B8B0A0', fontSize: 11, opacity: 0.6, marginTop: 20 }}>
          Al reservar aceptás que el local te contacte para confirmar tu cita.
        </p>

      </main>
    </div>
  )
}