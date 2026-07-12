import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { phoneError } from '../utils/validators'
import ThemeToggle from '../components/ThemeToggle'
import { useToast } from '../context/ToastContext'

const formatPrice = (p) => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', minimumFractionDigits: 0
}).format(p)

const formatDateTime = (d) => new Date(d).toLocaleString('es-CO', {
  weekday: 'long', day: 'numeric', month: 'long',
  hour: '2-digit', minute: '2-digit'
})

const STATUS = {
  pending:   { label: 'Pendiente',  color: 'var(--gold)',      bg: 'rgba(201,168,76,0.12)'  },
  confirmed: { label: 'Confirmada', color: 'var(--cream)',     bg: 'rgba(245,240,232,0.10)' },
  done:      { label: 'Completada', color: 'var(--cream-dim)', bg: 'rgba(184,176,160,0.12)' },
  cancelled: { label: 'Cancelada',  color: 'var(--gold-dim)',  bg: 'rgba(139,105,20,0.18)'  },
}

export default function MyCitas() {
  const { slug }     = useParams()
  const navigate     = useNavigate()
  const toast = useToast()
  const [phone, setPhone]           = useState('')
  const [touched, setTouched]       = useState(false)
  const [searched, setSearched]     = useState(false)
  const [loading, setLoading]       = useState(false)
  const [appointments, setAppointments] = useState([])
  const [shopName, setShopName]     = useState('')
  const [cancelling, setCancelling] = useState(null)

  const phoneFieldError = phoneError(phone, { required: true })

  const handleSearch = async (e) => {
    e.preventDefault()
    setTouched(true)
    if (phoneFieldError) return
    const clean = phone.replace(/\D/g, '')
    setLoading(true)
    try {
      const res = await api.get(`/public/${slug}/mis-citas?phone=${clean}`)
      setAppointments(res.data.appointments)
      setShopName(res.data.shop.name)
      setSearched(true)
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudieron buscar tus citas. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async (id) => {
    setCancelling(id)
    try {
      await api.patch(`/public/${slug}/mis-citas/${id}/cancel`, {
        phone: phone.replace(/\D/g, '')
      })
      setAppointments(prev => prev.filter(a => a.id !== id))
      toast.success('Cita cancelada correctamente')
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo cancelar la cita. Intenta de nuevo.')
    } finally {
      setCancelling(null)
    }
  }

  const inp = {
    width: '100%',
    padding: '14px 18px',
    background: 'var(--surface-1)',
    border: '1px solid var(--border-soft)',
    color: 'var(--cream)',
    borderRadius: 10,
    fontSize: 16,
    fontFamily: 'var(--font-body)',
    outline: 'none',
    letterSpacing: '0.04em',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', fontFamily: 'var(--font-body)' }}>
      <ThemeToggle floating />

      {/* Header */}
      <div style={{ background: 'var(--dark-2)', borderBottom: '1px solid var(--dark-3)', padding: '28px 24px', textAlign: 'center' }}>
        <button
          onClick={() => navigate(`/reservar/${slug}`)}
          style={{ background: 'none', border: 'none', color: 'var(--cream-dim)', fontSize: 13, cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6, margin: '0 auto 16px' }}
        >
          ← Volver a reservar
        </button>
        <p style={{ fontSize: 40, color: 'var(--gold)', marginBottom: 8 }}>✂</p>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, color: 'var(--cream)', marginBottom: 4 }}>
          {shopName || 'Mis citas'}
        </h1>
        <p style={{ color: 'var(--cream-dim)', fontSize: 13 }}>
          Consulta y cancela tus citas
        </p>
      </div>

      <main style={{ maxWidth: 480, margin: '0 auto', padding: '40px 20px' }}>

        {!searched ? (
          /* Formulario búsqueda */
          <div className="animate-fade-up">
            <div style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-3)', borderRadius: 16, padding: 32, textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>
                📱
              </div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--cream)', marginBottom: 8 }}>
                ¿Cuál es tu número?
              </h2>
              <p style={{ color: 'var(--cream-dim)', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
                Ingresa el teléfono con el que hiciste la reserva y te mostramos tus citas.
              </p>

              <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  onBlur={() => setTouched(true)}
                  placeholder="3001234567"
                  style={{ ...inp, border: '1px solid ' + (touched && phoneFieldError ? 'var(--danger)' : 'var(--border-soft)') }}
                  autoFocus
                  inputMode="numeric"
                />
                {touched && phoneFieldError && (
                  <p style={{ color: 'var(--danger)', fontSize: 13, textAlign: 'left' }}>⚠ {phoneFieldError}</p>
                )}
                <button
                  type="submit"
                  disabled={loading || !!phoneFieldError}
                  style={{ background: (loading || phoneFieldError) ? 'var(--gold-dim)' : 'var(--gold)', color: 'var(--dark)', border: 'none', padding: '14px 0', borderRadius: 10, cursor: (loading || phoneFieldError) ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', fontFamily: 'var(--font-body)', transition: 'background 0.2s' }}
                >
                  {loading ? 'BUSCANDO...' : 'VER MIS CITAS'}
                </button>
              </form>
            </div>

            <p style={{ textAlign: 'center', color: 'var(--cream-dim)', fontSize: 12, marginTop: 16, opacity: 0.7 }}>
              No almacenamos contraseñas. Solo usamos tu número para identificarte.
            </p>
          </div>

        ) : appointments.length === 0 ? (
          /* Sin citas */
          <div className="animate-fade-up" style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>🗓</p>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--cream)', marginBottom: 8 }}>
              Sin citas pendientes
            </h3>
            <p style={{ color: 'var(--cream-dim)', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
              No encontramos citas activas para el número <strong style={{ color: 'var(--cream)' }}>{phone}</strong>.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => navigate(`/reservar/${slug}`)}
                style={{ background: 'var(--gold)', color: 'var(--dark)', border: 'none', padding: '13px 0', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', fontFamily: 'var(--font-body)' }}
              >
                RESERVAR UNA CITA
              </button>
              <button
                onClick={() => { setSearched(false); setPhone('') }}
                style={{ background: 'transparent', color: 'var(--cream-dim)', border: '1px solid var(--dark-3)', padding: '13px 0', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-body)' }}
              >
                Buscar con otro número
              </button>
            </div>
          </div>

        ) : (
          /* Lista de citas */
          <div className="animate-fade-up">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <p style={{ color: 'var(--cream-dim)', fontSize: 13 }}>
                {appointments.length} cita{appointments.length !== 1 ? 's' : ''} encontrada{appointments.length !== 1 ? 's' : ''}
              </p>
              <button
                onClick={() => { setSearched(false); setPhone('') }}
                style={{ background: 'none', border: 'none', color: 'var(--gold)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
              >
                Cambiar número
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {appointments.map(a => {
                const st = STATUS[a.status] || STATUS.pending
                const canCancel = a.status === 'pending' || a.status === 'confirmed'
                const isPast    = new Date(a.scheduled_at) < new Date()

                return (
                  <div
                    key={a.id}
                    className="animate-fade-up"
                    style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-3)', borderRadius: 14, overflow: 'hidden' }}
                  >
                    {/* Estado top bar */}
                    <div style={{ height: 3, background: st.color, opacity: 0.6 }} />

                    <div style={{ padding: '20px 20px 16px' }}>
                      {/* Estado badge */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                        <span style={{ background: st.bg, color: st.color, fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 20, letterSpacing: '0.08em' }}>
                          ● {st.label.toUpperCase()}
                        </span>
                        {isPast && (
                          <span style={{ color: 'var(--cream-dim)', fontSize: 11, opacity: 0.7 }}>Pasada</span>
                        )}
                      </div>

                      {/* Fecha */}
                      <p style={{ color: 'var(--gold)', fontSize: 15, fontWeight: 700, marginBottom: 10, lineHeight: 1.3, textTransform: 'capitalize' }}>
                        📅 {formatDateTime(a.scheduled_at)}
                      </p>

                      {/* Info */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--cream-dim)', fontSize: 13 }}>Servicio</span>
                          <span style={{ color: 'var(--cream)', fontSize: 13, fontWeight: 600 }}>{a.service_name}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--cream-dim)', fontSize: 13 }}>Barbero</span>
                          <span style={{ color: 'var(--cream)', fontSize: 13, fontWeight: 600 }}>{a.barber_name}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--cream-dim)', fontSize: 13 }}>Duración</span>
                          <span style={{ color: 'var(--cream)', fontSize: 13 }}>{a.duration_min} min</span>
                        </div>
                        <div style={{ height: 1, background: 'var(--dark-3)', margin: '4px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--cream-dim)', fontSize: 13 }}>Total</span>
                          <span style={{ color: 'var(--gold)', fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{formatPrice(a.price)}</span>
                        </div>
                      </div>

                      {/* Botón cancelar */}
                      {canCancel && !isPast && (
                        <button
                          onClick={() => handleCancel(a.id)}
                          disabled={cancelling === a.id}
                          style={{ width: '100%', background: 'transparent', border: '1px solid rgba(232,201,122,0.2)', color: 'var(--danger)', padding: '10px 0', borderRadius: 8, cursor: cancelling === a.id ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', fontFamily: 'var(--font-body)', opacity: cancelling === a.id ? 0.6 : 1, transition: 'all 0.2s' }}
                          onMouseEnter={e => { if (cancelling !== a.id) e.target.style.background = 'rgba(232,201,122,0.08)' }}
                          onMouseLeave={e => e.target.style.background = 'transparent'}
                        >
                          {cancelling === a.id ? 'CANCELANDO...' : 'CANCELAR CITA'}
                        </button>
                      )}

                      {a.notes && (
                        <p style={{ color: 'var(--cream-dim)', fontSize: 12, marginTop: 10, fontStyle: 'italic', opacity: 0.8 }}>
                          "{a.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <button
              onClick={() => navigate(`/reservar/${slug}`)}
              style={{ width: '100%', background: 'var(--gold)', color: 'var(--dark)', border: 'none', padding: '14px 0', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', fontFamily: 'var(--font-body)', marginTop: 20 }}
            >
              + RESERVAR OTRA CITA
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
