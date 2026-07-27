import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { requiredError, lengthError, emailError, phoneError, hasErrors } from '../utils/validators'
import ThemeToggle from '../components/ThemeToggle'
import { useToast } from '../context/ToastContext'
import { EyeIcon } from '../components/Icons'
import DetailModal from '../components/DetailModal'
import ChatbotWidget from '../components/ChatbotWidget'

const DAY_ABBR = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

// "1,2,3,4,5,6" -> [1,2,3,4,5,6]. Si viene vacío/undefined, null (sin dato = no restringe).
function parseWorkDays(value) {
  if (!value) return null
  const days = value.split(',').map(Number).filter(n => !Number.isNaN(n))
  return days.length ? days : null
}

// Las imágenes internas (/uploads/...) se sirven desde el host del backend, no desde /api.
const API_ORIGIN = (api.defaults.baseURL || '').replace(/\/api\/?$/, '')
function resolveImg(url) {
  if (!url) return null
  if (url.startsWith('/uploads/')) return API_ORIGIN + url
  return url
}

// Agrupa los días abiertos consecutivos con el mismo horario, ej: "Lun a Sáb: 08:00–18:00"
function summarizeHours(hours) {
  if (!hours || !hours.length) return null
  const dayAbbr = DAY_ABBR
  const groups = []
  hours.forEach(h => {
    if (!h.is_open) return
    const key  = h.open_time + '-' + h.close_time
    const last = groups[groups.length - 1]
    if (last && last.key === key && last.days[last.days.length - 1] === h.day_of_week - 1) {
      last.days.push(h.day_of_week)
    } else {
      groups.push({ key, days: [h.day_of_week], open: h.open_time, close: h.close_time })
    }
  })
  if (!groups.length) return null
  return groups.map(g => {
    const label = g.days.length > 1
      ? `${dayAbbr[g.days[0]]} a ${dayAbbr[g.days[g.days.length - 1]]}`
      : dayAbbr[g.days[0]]
    return `${label}: ${g.open}–${g.close}`
  }).join(' · ')
}

function validate(form, hours, barberDays) {
  const errors = {}
  if (!form.scheduled_at) {
    errors.scheduled_at = 'La fecha y hora son obligatorias'
  } else {
    const selected = new Date(form.scheduled_at)
    const minDate  = new Date(Date.now() + 30 * 60 * 1000)        // 30 min desde ahora
    const maxDate  = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 1 mes
    if (selected < minDate) {
      errors.scheduled_at = 'La cita debe ser al menos 30 minutos desde ahora'
    } else if (selected > maxDate) {
      errors.scheduled_at = 'La cita no puede ser a más de 1 mes de distancia'
    } else if (hours && hours.length) {
      const dayHours = hours.find(h => h.day_of_week === selected.getDay())
      if (dayHours && !dayHours.is_open) {
        const openDays = hours.filter(h => h.is_open).map(h => DAY_ABBR[h.day_of_week]).join(', ')
        errors.scheduled_at = `La barbería no abre este día. Días de atención: ${openDays || 'consulta con el local'}.`
      } else if (barberDays && !barberDays.includes(selected.getDay())) {
        errors.scheduled_at = 'El barbero seleccionado no atiende este día. Elige otro día u otro barbero.'
      } else if (dayHours && dayHours.is_open) {
        const time = selected.toTimeString().slice(0, 5)
        if (time < dayHours.open_time || time >= dayHours.close_time) {
          errors.scheduled_at = `Ese horario está fuera de atención. Este día abrimos de ${dayHours.open_time} a ${dayHours.close_time}.`
        }
      }
    }
  }
  errors.client_name  = requiredError(form.client_name, 'El nombre') || lengthError(form.client_name, { min: 2, label: 'El nombre' })
  errors.client_phone = phoneError(form.client_phone, { required: true })
  errors.client_email = emailError(form.client_email)
  Object.keys(errors).forEach(k => { if (!errors[k]) delete errors[k] })
  return errors
}

// Construye un mapa día_de_semana -> horario, para consultar rápido
function buildHoursMap(hours) {
  const map = {}
  ;(hours || []).forEach(h => { map[h.day_of_week] = h })
  return map
}

// ¿Ese día (Date) está disponible? (barbería abierta ese día de semana Y, si hay
// barbero elegido con días definidos, que el barbero también trabaje ese día)
function isDayAvailable(date, hoursMap, barberDays) {
  const dow = date.getDay()
  const dayHours = hoursMap[dow]
  if (!dayHours || !dayHours.is_open) return false
  if (barberDays && !barberDays.includes(dow)) return false
  return true
}

// Genera los próximos N días (Date, a medianoche local) a partir de hoy
function nextDays(n) {
  const days = []
  const base = new Date()
  base.setHours(0, 0, 0, 0)
  for (let i = 0; i < n; i++) {
    const d = new Date(base)
    d.setDate(base.getDate() + i)
    days.push(d)
  }
  return days
}

// Genera los horarios disponibles (cada 30 min) para un día específico,
// respetando el horario de apertura/cierre y, si es hoy, que sea con al
// menos 30 min de anticipación.
function timeSlotsFor(date, hoursMap) {
  const dayHours = hoursMap[date.getDay()]
  if (!dayHours || !dayHours.is_open) return []
  const [openH, openM]   = dayHours.open_time.split(':').map(Number)
  const [closeH, closeM] = dayHours.close_time.split(':').map(Number)
  const slots = []
  const cursor = new Date(date)
  cursor.setHours(openH, openM, 0, 0)
  const end = new Date(date)
  end.setHours(closeH, closeM, 0, 0)
  const minAllowed = new Date(Date.now() + 30 * 60 * 1000)
  while (cursor < end) {
    if (cursor >= minAllowed) {
      slots.push(new Date(cursor))
    }
    cursor.setMinutes(cursor.getMinutes() + 30)
  }
  return slots
}

// "2026-07-25" + Date con hora -> "2026-07-25T14:30" (formato que espera el form)
function toLocalDateTimeValue(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

const formatPrice = (p) => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', minimumFractionDigits: 0
}).format(p)

const STEPS = ['Servicio', 'Barbero', 'Fecha', 'Tus datos']

export default function BookingPage() {
  const { slug } = useParams()
const navigate = useNavigate()
  const toast = useToast()
  const [shop, setShop]         = useState(null)
  const [barbers, setBarbers]   = useState([])
  const [services, setServices] = useState([])
  const [hours, setHours]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [success, setSuccess]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [step, setStep]         = useState(0)
  const [touched, setTouched]   = useState({})
  const [apiError, setApiError] = useState('')
  const submittingRef = useRef(false)
  const [emailOpen, setEmailOpen] = useState(false)
  const [notesOpen, setNotesOpen] = useState(false)
  const [detailService, setDetailService] = useState(null)
  const [detailBarber, setDetailBarber]   = useState(null)
  const [form, setForm] = useState({
    barber_id: '', service_id: '', client_name: '',
    client_phone: '', client_email: '', scheduled_at: '', notes: ''
  })
  const [pickedDay, setPickedDay] = useState(null) // Date del día elegido (sin hora), paso previo a elegir hora

  const selectedBarberForValidation = barbers.find(b => b.id === parseInt(form.barber_id))
  const barberDaysForValidation = parseWorkDays(selectedBarberForValidation?.work_days)
  const allErrors = validate(form, hours, barberDaysForValidation)
  const errors = Object.keys(allErrors).reduce((acc, k) => {
    if (touched[k]) acc[k] = allErrors[k]
    return acc
  }, {})

  useEffect(() => {
    api.get('/public/' + slug)
      .then(res => {
        setShop(res.data.shop)
        setBarbers(res.data.barbers)
        setServices(res.data.services)
        setHours(res.data.hours || [])
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  // Red de seguridad: si por algún motivo (datos desactualizados, etc.) queda
  // seleccionada una fecha/hora inválida, también avisa arriba (no solo debajo).
  // Con el selector de días/horas tocables esto no debería poder pasar en uso normal.
  useEffect(() => {
    if (step === 2 && touched.scheduled_at && errors.scheduled_at) {
      setApiError(errors.scheduled_at)
    }
  }, [step, touched.scheduled_at, errors.scheduled_at])

  const markTouched = (name) => setTouched(t => (t[name] ? t : { ...t, [name]: true }))

  const handleChange = (name, value) => {
    setForm(prev => ({ ...prev, [name]: value }))
    markTouched(name)
    setApiError('')
  }

  const handleSubmit = async () => {
    if (submittingRef.current) return
    setTouched(t => ({ ...t, client_name: true, client_phone: true, client_email: true, scheduled_at: true }))
    // Si abrió email/notas y los llenó mal, o falta algún dato, avisa CLARO (no morir en silencio)
    if (hasErrors(allErrors)) {
      const primerError = allErrors.scheduled_at || allErrors.client_name || allErrors.client_phone || allErrors.client_email || 'Revisa los datos marcados antes de continuar.'
      setApiError(primerError)
      toast.error(primerError)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    submittingRef.current = true
    setSaving(true)
    setApiError('')
    try {
      await api.post('/public/' + slug + '/book', {
        ...form,
        client_name:  form.client_name.trim(),
        client_phone: form.client_phone.trim(),
        client_email: form.client_email.trim(),
        notes:        form.notes.trim(),
        barber_id:    parseInt(form.barber_id),
        service_id:   parseInt(form.service_id),
      })
      setSuccess(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      const msg = err.response?.data?.error || 'No se pudo reservar tu cita. Intenta de nuevo.'
      setApiError(msg)
      toast.error(msg)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      submittingRef.current = false
      setSaving(false)
    }
  }

  const selectedService = services.find(s => s.id === parseInt(form.service_id))
  const selectedBarber  = barbers.find(b => b.id === parseInt(form.barber_id))

  const canNext = () => {
    if (step === 0) return !!form.service_id
    if (step === 1) return !!form.barber_id
    if (step === 2) return !allErrors.scheduled_at
    return !allErrors.scheduled_at && !allErrors.client_name && !allErrors.client_phone && !allErrors.client_email
  }

  const s = { // estilos base
    card: { background: 'var(--surface-1)', border: '1px solid var(--border-soft)', borderRadius: 14, padding: 20, cursor: 'pointer', transition: 'all 0.2s', marginBottom: 10 },
    cardSelected: { background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.5)', borderRadius: 14, padding: 20, cursor: 'pointer', transition: 'all 0.2s', marginBottom: 10 },
    inp: (name) => ({ width: '100%', padding: '13px 16px', background: 'var(--surface-1)', border: '1px solid ' + (errors[name] ? 'var(--danger)' : 'var(--border-soft)'), color: 'var(--cream)', borderRadius: 10, fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none' }),
    label: { display: 'block', fontSize: 11, letterSpacing: '0.07em', color: 'var(--cream-dim)', marginBottom: 7, fontWeight: 600 },
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <ThemeToggle floating />
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 40, color: 'var(--gold)', marginBottom: 16, animation: 'fadeUp 0.5s ease forwards' }}>✂</div>
        <p style={{ color: 'var(--cream-dim)', fontSize: 13, letterSpacing: '0.1em' }}>CARGANDO...</p>
      </div>
    </div>
  )

  if (notFound) return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <ThemeToggle floating />
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 48, color: 'var(--gold)', marginBottom: 16 }}>✂</p>
        <h2 style={{ color: 'var(--cream)', fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 8 }}>Barbería no encontrada</h2>
        <p style={{ color: 'var(--cream-dim)', fontSize: 14 }}>Verifica que el enlace sea correcto</p>
      </div>
    </div>
  )

  if (success) return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <ThemeToggle floating />
      <div className="animate-fade-up" style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-4)', borderRadius: 20, padding: '48px 40px', maxWidth: 440, width: '100%', textAlign: 'center' }}>

        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', fontSize: 36, color: 'var(--success)' }}>✓</div>

        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 32, color: 'var(--cream)', marginBottom: 10 }}>¡Reserva confirmada!</h2>
        <p style={{ color: 'var(--cream-dim)', fontSize: 14, lineHeight: 1.7, marginBottom: 28 }}>
          Tu cita en <strong style={{ color: 'var(--cream)' }}>{shop.name}</strong> quedó reservada.{' '}
          {form.client_email
            ? 'Te enviamos un correo de confirmación con los detalles.'
            : 'El local te contactará para confirmar tu cita.'}
        </p>

        {selectedService && selectedBarber && (
          <div style={{ background: 'var(--dark-3)', borderRadius: 12, padding: '20px 24px', marginBottom: 28, textAlign: 'left' }}>
            <p style={{ color: 'var(--cream-dim)', fontSize: 10, letterSpacing: '0.1em', fontWeight: 600, marginBottom: 14 }}>RESUMEN DE TU CITA</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--cream-dim)', fontSize: 13 }}>Servicio</span>
                <span style={{ color: 'var(--cream)', fontSize: 13, fontWeight: 600 }}>{selectedService.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--cream-dim)', fontSize: 13 }}>Barbero</span>
                <span style={{ color: 'var(--cream)', fontSize: 13, fontWeight: 600 }}>{selectedBarber.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--cream-dim)', fontSize: 13 }}>Duración</span>
                <span style={{ color: 'var(--cream)', fontSize: 13, fontWeight: 600 }}>{selectedService.duration_min} min</span>
              </div>
              <div style={{ height: 1, background: 'var(--dark-4)', margin: '4px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--cream-dim)', fontSize: 13 }}>Total</span>
                <span style={{ color: 'var(--gold)', fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{formatPrice(selectedService.price)}</span>
              </div>
            </div>
          </div>
        )}
<button
  onClick={() => navigate(`/reservar/${slug}/mis-citas`)}
  style={{ background: 'var(--gold)', color: 'var(--dark)', border: 'none', padding: '13px 28px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', fontFamily: 'var(--font-body)', marginBottom: 12, width: '100%' }}
>
  VER MIS CITAS
</button>
        <button
          onClick={() => {
            setSuccess(false)
            setStep(0)
            setEmailOpen(false)
            setNotesOpen(false)
            setForm({ barber_id: '', service_id: '', client_name: '', client_phone: '', client_email: '', scheduled_at: '', notes: '' })
          }}
          style={{ background: 'transparent', border: '1px solid var(--dark-4)', color: 'var(--cream-dim)', padding: '11px 28px', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', fontFamily: 'var(--font-body)' }}
        >
          HACER OTRA RESERVA
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', fontFamily: 'var(--font-body)' }}>
      <ThemeToggle floating />

      {/* Modal detalle de servicio */}
      {detailService && (
        <DetailModal
          onClose={() => setDetailService(null)}
          image={resolveImg(detailService.image_url)}
          imageFallback={<span style={{ fontSize: 48, color: 'var(--dark)' }}>✦</span>}
          title={detailService.name}
          selectLabel="ELEGIR ESTE SERVICIO"
          onSelect={() => { handleChange('service_id', String(detailService.id)); setDetailService(null) }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--dark-4)' }}>
            <span style={{ color: 'var(--cream-dim)', fontSize: 13 }}>⏱ {detailService.duration_min} minutos</span>
            <span style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 24 }}>{formatPrice(detailService.price)}</span>
          </div>
          {detailService.description && (
            <p style={{ color: 'var(--cream-dim)', fontSize: 14, lineHeight: 1.7, marginBottom: 16 }}>{detailService.description}</p>
          )}
        </DetailModal>
      )}

      {/* Modal detalle de barbero */}
      {detailBarber && (
        <DetailModal
          onClose={() => setDetailBarber(null)}
          image={resolveImg(detailBarber.photo_url)}
          imageFallback={<span style={{ fontFamily: 'var(--font-display)', fontSize: 56, fontWeight: 900, color: 'var(--dark)' }}>{detailBarber.name.charAt(0).toUpperCase()}</span>}
          title={detailBarber.name}
          subtitle={detailBarber.specialty}
          selectLabel="ELEGIR ESTE BARBERO"
          onSelect={() => { handleChange('barber_id', String(detailBarber.id)); setPickedDay(null); handleChange('scheduled_at', ''); setDetailBarber(null) }}
        >
          {parseWorkDays(detailBarber.work_days) && (
            <div style={{ marginBottom: 16 }}>
              <p style={{ color: 'var(--cream-dim)', fontSize: 11, letterSpacing: '0.06em', fontWeight: 600, marginBottom: 8 }}>DÍAS QUE TRABAJA</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {DAY_ABBR.map((label, day) => {
                  const works = parseWorkDays(detailBarber.work_days).includes(day)
                  return (
                    <span
                      key={day}
                      style={{
                        padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: works ? 'rgba(201,168,76,0.15)' : 'var(--dark-3)',
                        color:      works ? 'var(--gold)' : 'var(--cream-dim)',
                        border:     '1px solid ' + (works ? 'rgba(201,168,76,0.35)' : 'var(--dark-4)'),
                        opacity:    works ? 1 : 0.4,
                      }}
                    >
                      {label}
                    </span>
                  )
                })}
              </div>
            </div>
          )}
        </DetailModal>
      )}

      {/* Header del local */}
      <div style={{ background: 'var(--dark-2)', borderBottom: '1px solid var(--dark-3)', padding: '36px 24px 28px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ fontSize: 40, color: 'var(--gold)', marginBottom: 10 }}>✂</div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 900, color: 'var(--cream)', marginBottom: 8, letterSpacing: '-0.02em' }}>{shop.name}</h1>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, flexWrap: 'wrap' }}>
          {shop.address && <p style={{ color: 'var(--cream-dim)', fontSize: 13 }}>📍 {shop.address}</p>}
          {shop.phone   && <p style={{ color: 'var(--cream-dim)', fontSize: 13 }}>📞 {shop.phone}</p>}
        </div>
      </div>

      <main style={{ maxWidth: 520, margin: '0 auto', padding: '32px 20px 60px' }}>

        {/* Stepper */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32 }}>
          {STEPS.map((label, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 0 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: i < step ? 'var(--success)' : i === step ? 'var(--gold)' : 'var(--dark-3)', border: '1px solid ' + (i < step ? 'rgba(201,168,76,0.5)' : i === step ? 'rgba(201,168,76,0.5)' : 'var(--dark-4)'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: i <= step ? 'var(--dark)' : 'var(--cream-dim)', fontWeight: 700, transition: 'all 0.3s' }}>
                  {i < step ? '✓' : i + 1}
                </div>
                <p style={{ fontSize: 10, color: i === step ? 'var(--gold)' : 'var(--cream-dim)', fontWeight: i === step ? 700 : 400, letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{label.toUpperCase()}</p>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 1, background: i < step ? 'rgba(201,168,76,0.3)' : 'var(--dark-3)', margin: '0 8px', marginBottom: 20, transition: 'background 0.3s' }} />
              )}
            </div>
          ))}
        </div>

        {apiError && (
          <div className="animate-fade-up" role="alert" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', background: 'rgba(232,201,122,0.12)', border: '1px solid var(--danger)', borderRadius: 12, padding: '16px 18px', marginBottom: 20 }}>
            <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'rgba(232,201,122,0.2)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, flexShrink: 0 }}>!</div>
            <div>
              <p style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 700, marginBottom: 2 }}>No se pudo reservar tu cita</p>
              <p style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 500, lineHeight: 1.5 }}>{apiError}</p>
            </div>
          </div>
        )}

        {/* PASO 0 — Elegir servicio */}
        {step === 0 && (
          <div className="animate-fade-up">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--cream)', marginBottom: 6 }}>¿Qué servicio quieres?</h2>
            <p style={{ color: 'var(--cream-dim)', fontSize: 13, marginBottom: 24 }}>Elige el servicio que necesitas</p>
            {services.map(service => (
              <div
                key={service.id}
                onClick={() => handleChange('service_id', String(service.id))}
                style={form.service_id === String(service.id) ? s.cardSelected : s.card}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                    {resolveImg(service.image_url) && (
                      <img
                        src={resolveImg(service.image_url)}
                        alt={service.name}
                        style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--dark-4)' }}
                        onError={(e) => { e.target.style.display = 'none' }}
                      />
                    )}
                    <div style={{ minWidth: 0 }}>
                      <p style={{ color: 'var(--cream)', fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{service.name}</p>
                      <p style={{ color: 'var(--cream-dim)', fontSize: 13 }}>⏱ {service.duration_min} minutos</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setDetailService(service) }}
                    title="Ver más"
                    aria-label={`Ver más de ${service.name}`}
                    style={{ background: 'var(--dark-3)', border: '1px solid var(--dark-4)', color: 'var(--cream-dim)', width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                  >
                    <EyeIcon size={14} />
                  </button>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: 'var(--gold)', fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20 }}>{formatPrice(service.price)}</p>
                    {form.service_id === String(service.id) && (
                      <p style={{ color: 'var(--success)', fontSize: 11, fontWeight: 700, marginTop: 4 }}>✓ SELECCIONADO</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {!form.service_id && (
              <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>⚠ Selecciona un servicio para continuar.</p>
            )}
          </div>
        )}

        {/* PASO 1 — Elegir barbero */}
        {step === 1 && (
          <div className="animate-fade-up">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--cream)', marginBottom: 6 }}>¿Con quién quieres?</h2>
            <p style={{ color: 'var(--cream-dim)', fontSize: 13, marginBottom: 24 }}>Elige tu barbero de confianza</p>
            {barbers.map(barber => (
              <div
                key={barber.id}
                onClick={() => { handleChange('barber_id', String(barber.id)); setPickedDay(null); handleChange('scheduled_at', '') }}
                style={form.barber_id === String(barber.id) ? s.cardSelected : s.card}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  {resolveImg(barber.photo_url) ? (
                    <img
                      src={resolveImg(barber.photo_url)}
                      alt={barber.name}
                      style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid ' + (form.barber_id === String(barber.id) ? 'rgba(201,168,76,0.4)' : 'var(--dark-4)') }}
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                  ) : (
                    <div style={{ width: 48, height: 48, borderRadius: '50%', background: form.barber_id === String(barber.id) ? 'rgba(201,168,76,0.2)' : 'var(--dark-3)', border: '1px solid ' + (form.barber_id === String(barber.id) ? 'rgba(201,168,76,0.4)' : 'var(--dark-4)'), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontFamily: 'var(--font-display)', fontWeight: 900, color: 'var(--gold)', flexShrink: 0 }}>
                      {barber.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: 'var(--cream)', fontWeight: 600, fontSize: 15 }}>{barber.name}</p>
                    {barber.specialty && (
                      <p style={{ color: 'var(--cream-dim)', fontSize: 12, marginTop: 2 }}>{barber.specialty}</p>
                    )}
                    {form.barber_id === String(barber.id) && (
                      <p style={{ color: 'var(--success)', fontSize: 11, fontWeight: 700, marginTop: 3 }}>✓ SELECCIONADO</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setDetailBarber(barber) }}
                    title="Ver más"
                    aria-label={`Ver más de ${barber.name}`}
                    style={{ background: 'var(--dark-3)', border: '1px solid var(--dark-4)', color: 'var(--cream-dim)', width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                  >
                    <EyeIcon size={14} />
                  </button>
                </div>
              </div>
            ))}
            {!form.barber_id && (
              <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4 }}>⚠ Selecciona un barbero para continuar.</p>
            )}
          </div>
        )}

        {/* PASO 2 — Elegir fecha y hora */}
        {step === 2 && (() => {
          const hoursMap = buildHoursMap(hours)
          const barberDays = parseWorkDays(selectedBarber?.work_days)
          const days = nextDays(30)
          const slots = pickedDay ? timeSlotsFor(pickedDay, hoursMap) : []
          const sameDay = (a, b) => a && b && a.toDateString() === b.toDateString()
          const selectedDateTime = form.scheduled_at ? new Date(form.scheduled_at) : null

          const choosePickedDay = (d) => {
            setPickedDay(d)
            // Si ya había una hora elegida de OTRO día, la limpiamos para que elija de nuevo
            if (!sameDay(selectedDateTime, d)) handleChange('scheduled_at', '')
          }

          const chooseSlot = (slotDate) => {
            handleChange('scheduled_at', toLocalDateTimeValue(slotDate))
          }

          return (
            <div className="animate-fade-up">
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--cream)', marginBottom: 6 }}>¿Cuándo vienes?</h2>
              <p style={{ color: 'var(--cream-dim)', fontSize: 13, marginBottom: 24 }}>Elige el día y hora que mejor te quede</p>

              {summarizeHours(hours) && (
                <div style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 10, padding: '10px 16px', marginBottom: 16, fontSize: 12, color: 'var(--cream-dim)' }}>
                  🕒 Horario de atención: <strong style={{ color: 'var(--cream)' }}>{summarizeHours(hours)}</strong>
                  {barberDays && selectedBarber && (
                    <div style={{ marginTop: 4 }}>✂ {selectedBarber.name.split(' ')[0]} atiende: <strong style={{ color: 'var(--cream)' }}>{barberDays.slice().sort().map(d => DAY_ABBR[d]).join(', ')}</strong></div>
                  )}
                </div>
              )}

              {/* Selector de DÍA — los días cerrados están deshabilitados, no se pueden tocar */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ ...s.label, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <span style={{ fontSize: 13 }}>📅</span> ELIGE EL DÍA
                </label>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, WebkitOverflowScrolling: 'touch' }}>
                  {days.map((d, i) => {
                    const available = isDayAvailable(d, hoursMap, barberDays)
                    const active = sameDay(pickedDay, d)
                    return (
                      <button
                        key={i}
                        type="button"
                        disabled={!available}
                        onClick={() => available && choosePickedDay(d)}
                        title={!available ? 'No disponible este día' : ''}
                        style={{
                          flexShrink: 0, width: 56, padding: '10px 0', borderRadius: 12, textAlign: 'center',
                          cursor: available ? 'pointer' : 'not-allowed',
                          background: active ? 'var(--gold)' : available ? 'var(--surface-1)' : 'var(--dark-3)',
                          border: '1px solid ' + (active ? 'var(--gold)' : available ? 'var(--border-soft)' : 'var(--dark-4)'),
                          opacity: available ? 1 : 0.4,
                        }}
                      >
                        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.03em', color: active ? 'var(--dark)' : available ? 'var(--cream-dim)' : 'var(--cream-dim)' }}>
                          {DAY_ABBR[d.getDay()]}
                        </div>
                        <div style={{ fontSize: 17, fontWeight: 800, fontFamily: 'var(--font-display)', color: active ? 'var(--dark)' : available ? 'var(--cream)' : 'var(--cream-dim)', marginTop: 2 }}>
                          {d.getDate()}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Selector de HORA — solo aparecen horas dentro del horario de atención */}
              {pickedDay && (
                <div className="animate-fade-up" style={{ marginBottom: 16 }}>
                  <label style={{ ...s.label, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <span style={{ fontSize: 13 }}>🕐</span> ELIGE LA HORA
                  </label>
                  {slots.length === 0 ? (
                    <p style={{ color: 'var(--cream-dim)', fontSize: 13, background: 'var(--surface-1)', border: '1px solid var(--border-soft)', borderRadius: 12, padding: 16 }}>
                      No quedan horarios disponibles ese día. Elige otro día.
                    </p>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(78px, 1fr))', gap: 8 }}>
                      {slots.map((slot, i) => {
                        const active = selectedDateTime && slot.getTime() === selectedDateTime.getTime()
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => chooseSlot(slot)}
                            style={{
                              padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                              background: active ? 'var(--gold)' : 'var(--surface-1)',
                              border: '1px solid ' + (active ? 'var(--gold)' : 'var(--border-soft)'),
                              color: active ? 'var(--dark)' : 'var(--cream)',
                            }}
                          >
                            {slot.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Alerta de respaldo (no debería aparecer nunca con el selector nuevo, pero queda de red de seguridad) */}
              {errors.scheduled_at && touched.scheduled_at && (
                <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 6 }}>⚠ {errors.scheduled_at}</p>
              )}

              {selectedService && selectedBarber && form.scheduled_at && (
                <div className="animate-fade-up" style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 12, padding: '16px 20px', marginTop: 16 }}>
                  <p style={{ color: 'var(--cream-dim)', fontSize: 11, letterSpacing: '0.08em', fontWeight: 600, marginBottom: 10 }}>RESUMEN</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p style={{ color: 'var(--cream)', fontSize: 13 }}>✦ {selectedService.name} — {selectedService.duration_min}min</p>
                    <p style={{ color: 'var(--cream)', fontSize: 13 }}>✂ {selectedBarber.name}</p>
                    <p style={{ color: 'var(--gold)', fontSize: 13 }}>📅 {new Date(form.scheduled_at).toLocaleString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              )}
            </div>
          )
        })()}

        {/* PASO 3 — Datos personales */}
        {step === 3 && (
          <div className="animate-fade-up">
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--cream)', marginBottom: 6 }}>Tus datos</h2>
            <p style={{ color: 'var(--cream-dim)', fontSize: 13, marginBottom: 24 }}>Para confirmar y recordarte tu cita</p>

            <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-soft)', borderRadius: 14, padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={s.label}>NOMBRE COMPLETO</label>
                <input value={form.client_name} onChange={e => handleChange('client_name', e.target.value)} onBlur={() => markTouched('client_name')} placeholder="Juan Pérez" style={s.inp('client_name')} />
                {errors.client_name && <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 6 }}>⚠ {errors.client_name}</p>}
              </div>
              <div>
                <label style={s.label}>TELÉFONO / WHATSAPP</label>
                <input value={form.client_phone} onChange={e => handleChange('client_phone', e.target.value)} onBlur={() => markTouched('client_phone')} placeholder="3001234567" style={s.inp('client_phone')} />
                {errors.client_phone && <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 6 }}>⚠ {errors.client_phone}</p>}
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => setEmailOpen(o => !o)}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gold)', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)' }}
                >
                  <span>{emailOpen ? '－' : '＋'}</span> Correo electrónico
                </button>
                {!emailOpen && (
                  <p style={{ color: 'var(--cream-dim)', fontSize: 11, marginTop: 6, opacity: 0.7 }}>Agrégalo si quieres recibir el recordatorio de tu cita por correo.</p>
                )}
                {emailOpen && (
                  <div className="animate-fade-up" style={{ marginTop: 10 }}>
                    <input type="email" value={form.client_email} onChange={e => handleChange('client_email', e.target.value)} onBlur={() => markTouched('client_email')} placeholder="tucorreo@email.com" style={s.inp('client_email')} autoFocus />
                    {errors.client_email && <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 6 }}>⚠ {errors.client_email}</p>}
                    <p style={{ color: 'var(--cream-dim)', fontSize: 11, marginTop: 6, opacity: 0.7 }}>Agrégalo si quieres recibir el recordatorio de tu cita por correo.</p>
                  </div>
                )}
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => setNotesOpen(o => !o)}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: 'var(--gold)', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-body)' }}
                >
                  <span>{notesOpen ? '－' : '＋'}</span> Notas / indicaciones
                </button>
                {notesOpen && (
                  <div className="animate-fade-up" style={{ marginTop: 10 }}>
                    <input value={form.notes} onChange={e => handleChange('notes', e.target.value)} placeholder="Alguna indicación especial..." style={s.inp('notes')} autoFocus />
                  </div>
                )}
              </div>
            </div>

            {/* Resumen final */}
            {selectedService && selectedBarber && (
              <div style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-4)', borderRadius: 12, padding: '20px 24px', marginTop: 16 }}>
                <p style={{ color: 'var(--cream-dim)', fontSize: 10, letterSpacing: '0.1em', fontWeight: 600, marginBottom: 14 }}>RESUMEN FINAL</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--cream-dim)', fontSize: 13 }}>Servicio</span>
                    <span style={{ color: 'var(--cream)', fontSize: 13, fontWeight: 600 }}>{selectedService.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--cream-dim)', fontSize: 13 }}>Barbero</span>
                    <span style={{ color: 'var(--cream)', fontSize: 13, fontWeight: 600 }}>{selectedBarber.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--cream-dim)', fontSize: 13 }}>Fecha</span>
                    <span style={{ color: 'var(--cream)', fontSize: 13, fontWeight: 600 }}>
                      {new Date(form.scheduled_at).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ height: 1, background: 'var(--dark-4)', margin: '4px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--cream-dim)', fontSize: 13 }}>Total</span>
                    <span style={{ color: 'var(--gold)', fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{formatPrice(selectedService.price)}</span>
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
              style={{ flex: 1, background: 'transparent', border: '1px solid var(--dark-4)', color: 'var(--cream-dim)', padding: '14px 0', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', fontFamily: 'var(--font-body)' }}
            >
              ← ATRÁS
            </button>
          )}

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => canNext() && setStep(step + 1)}
              disabled={!canNext()}
              style={{ flex: 2, background: canNext() ? 'var(--gold)' : 'var(--dark-3)', color: canNext() ? 'var(--dark)' : 'var(--cream-dim)', border: '1px solid ' + (canNext() ? 'var(--gold)' : 'var(--dark-4)'), padding: '14px 0', borderRadius: 10, cursor: canNext() ? 'pointer' : 'not-allowed', fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', fontFamily: 'var(--font-body)', transition: 'all 0.2s' }}
            >
              SIGUIENTE →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={saving}
              style={{ flex: 2, background: saving ? 'var(--gold-dim)' : 'var(--gold)', color: 'var(--dark)', border: 'none', padding: '14px 0', borderRadius: 10, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', fontFamily: 'var(--font-body)', transition: 'background 0.2s' }}
            >
              {saving ? 'RESERVANDO...' : 'CONFIRMAR RESERVA ✓'}
            </button>
          )}
        </div>

        <p style={{ textAlign: 'center', color: 'var(--cream-dim)', fontSize: 11, opacity: 0.8, marginTop: 20 }}>
          Al reservar aceptas que el local te contacte para confirmar tu cita.
        </p>

      </main>
      {shop && <ChatbotWidget slug={slug} shopName={shop.name} />}
    </div>
  )
}