import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'

const formatPrice = (p) => new Intl.NumberFormat('es-CO', {
  style: 'currency', currency: 'COP', minimumFractionDigits: 0
}).format(p)

const formatDateTime = (d) => new Date(d).toLocaleString('es-CO', {
  weekday: 'long', day: 'numeric', month: 'long',
  hour: '2-digit', minute: '2-digit'
})

const STATUS = {
  pending:   { label: 'Pendiente',  color: '#C9A84C', bg: 'rgba(201,168,76,0.12)'  },
  confirmed: { label: 'Confirmada', color: '#B8B0A0', bg: 'rgba(184,176,160,0.12)' },
  done:      { label: 'Completada', color: '#4CAF7D', bg: 'rgba(76,175,125,0.12)'  },
  cancelled: { label: 'Cancelada',  color: '#E05252', bg: 'rgba(224,82,82,0.12)'   },
}

export default function MyCitas() {
  const { slug }     = useParams()
  const navigate     = useNavigate()
  const [phone, setPhone]           = useState('')
  const [searched, setSearched]     = useState(false)
  const [loading, setLoading]       = useState(false)
  const [appointments, setAppointments] = useState([])
  const [shopName, setShopName]     = useState('')
  const [error, setError]           = useState('')
  const [cancelling, setCancelling] = useState(null)
  const [cancelSuccess, setCancelSuccess] = useState(null)

  const handleSearch = async (e) => {
    e.preventDefault()
    const clean = phone.replace(/\D/g, '')
    if (clean.length < 7) { setError('Ingresá un número válido'); return }
    setLoading(true)
    setError('')
    try {
      const res = await api.get(`/public/${slug}/mis-citas?phone=${clean}`)
      setAppointments(res.data.appointments)
      setShopName(res.data.shop.name)
      setSearched(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Error buscando citas')
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
      setCancelSuccess(id)
      setTimeout(() => setCancelSuccess(null), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Error cancelando cita')
    } finally {
      setCancelling(null)
    }
  }

  const inp = {
    width: '100%',
    padding: '14px 18px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    color: '#F5F0E8',
    borderRadius: 10,
    fontSize: 16,
    fontFamily: 'DM Sans',
    outline: 'none',
    letterSpacing: '0.04em',
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0A', fontFamily: 'DM Sans' }}>

      {/* Header */}
      <div style={{ background: '#111', borderBottom: '1px solid #1A1A1A', padding: '28px 24px', textAlign: 'center' }}>
        <button
          onClick={() => navigate(`/reservar/${slug}`)}
          style={{ background: 'none', border: 'none', color: '#B8B0A0', fontSize: 13, cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6, margin: '0 auto 16px' }}
        >
          ← Volver a reservar
        </button>
        <p style={{ fontSize: 40, color: '#C9A84C', marginBottom: 8 }}>✂</p>
        <h1 style={{ fontFamily: 'Playfair Display', fontSize: 26, color: '#F5F0E8', marginBottom: 4 }}>
          {shopName || 'Mis citas'}
        </h1>
        <p style={{ color: '#B8B0A0', fontSize: 13 }}>
          Consultá y cancelá tus citas
        </p>
      </div>

      <main style={{ maxWidth: 480, margin: '0 auto', padding: '40px 20px' }}>

        {/* Toast cancelación */}
        {cancelSuccess && (
          <div className="animate-fade-up" style={{ background: 'rgba(76,175,125,0.12)', border: '1px solid rgba(76,175,125,0.3)', color: '#4CAF7D', borderRadius: 10, padding: '14px 18px', marginBottom: 20, fontSize: 13, fontWeight: 600, textAlign: 'center' }}>
            ✓ Cita cancelada correctamente
          </div>
        )}

        {!searched ? (
          /* Formulario búsqueda */
          <div className="animate-fade-up">
            <div style={{ background: '#111', border: '1px solid #1A1A1A', borderRadius: 16, padding: 32, textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(201,168,76,0.08)', border: '1px solid rgba(201,168,76,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>
                📱
              </div>
              <h2 style={{ fontFamily: 'Playfair Display', fontSize: 22, color: '#F5F0E8', marginBottom: 8 }}>
                ¿Cuál es tu número?
              </h2>
              <p style={{ color: '#B8B0A0', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
                Ingresá el teléfono con el que hiciste la reserva y te mostramos tus citas.
              </p>

              <form onSubmit={handleSearch} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input
                  value={phone}
                  onChange={e => { setPhone(e.target.value); setError('') }}
                  placeholder="3001234567"
                  style={inp}
                  autoFocus
                  inputMode="numeric"
                />
                {error && (
                  <p style={{ color: '#E05252', fontSize: 13, textAlign: 'left' }}>⚠ {error}</p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  style={{ background: loading ? '#8B6914' : '#C9A84C', color: '#0A0A0A', border: 'none', padding: '14px 0', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', fontFamily: 'DM Sans', transition: 'background 0.2s' }}
                >
                  {loading ? 'BUSCANDO...' : 'VER MIS CITAS'}
                </button>
              </form>
            </div>

            <p style={{ textAlign: 'center', color: '#B8B0A0', fontSize: 12, marginTop: 16, opacity: 0.5 }}>
              No almacenamos contraseñas. Solo usamos tu número para identificarte.
            </p>
          </div>

        ) : appointments.length === 0 ? (
          /* Sin citas */
          <div className="animate-fade-up" style={{ textAlign: 'center', padding: '48px 0' }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>🗓</p>
            <h3 style={{ fontFamily: 'Playfair Display', fontSize: 22, color: '#F5F0E8', marginBottom: 8 }}>
              Sin citas pendientes
            </h3>
            <p style={{ color: '#B8B0A0', fontSize: 14, marginBottom: 28, lineHeight: 1.6 }}>
              No encontramos citas activas para el número <strong style={{ color: '#F5F0E8' }}>{phone}</strong>.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={() => navigate(`/reservar/${slug}`)}
                style={{ background: '#C9A84C', color: '#0A0A0A', border: 'none', padding: '13px 0', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', fontFamily: 'DM Sans' }}
              >
                RESERVAR UNA CITA
              </button>
              <button
                onClick={() => { setSearched(false); setPhone('') }}
                style={{ background: 'transparent', color: '#B8B0A0', border: '1px solid #1A1A1A', padding: '13px 0', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontFamily: 'DM Sans' }}
              >
                Buscar con otro número
              </button>
            </div>
          </div>

        ) : (
          /* Lista de citas */
          <div className="animate-fade-up">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <p style={{ color: '#B8B0A0', fontSize: 13 }}>
                {appointments.length} cita{appointments.length !== 1 ? 's' : ''} encontrada{appointments.length !== 1 ? 's' : ''}
              </p>
              <button
                onClick={() => { setSearched(false); setPhone('') }}
                style={{ background: 'none', border: 'none', color: '#C9A84C', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
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
                    style={{ background: '#111', border: '1px solid #1A1A1A', borderRadius: 14, overflow: 'hidden' }}
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
                          <span style={{ color: '#555', fontSize: 11 }}>Pasada</span>
                        )}
                      </div>

                      {/* Fecha */}
                      <p style={{ color: '#C9A84C', fontSize: 15, fontWeight: 700, marginBottom: 10, lineHeight: 1.3, textTransform: 'capitalize' }}>
                        📅 {formatDateTime(a.scheduled_at)}
                      </p>

                      {/* Info */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#666', fontSize: 13 }}>Servicio</span>
                          <span style={{ color: '#F5F0E8', fontSize: 13, fontWeight: 600 }}>{a.service_name}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#666', fontSize: 13 }}>Barbero</span>
                          <span style={{ color: '#F5F0E8', fontSize: 13, fontWeight: 600 }}>{a.barber_name}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#666', fontSize: 13 }}>Duración</span>
                          <span style={{ color: '#F5F0E8', fontSize: 13 }}>{a.duration_min} min</span>
                        </div>
                        <div style={{ height: 1, background: '#1A1A1A', margin: '4px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#666', fontSize: 13 }}>Total</span>
                          <span style={{ color: '#C9A84C', fontSize: 16, fontWeight: 700, fontFamily: 'Playfair Display' }}>{formatPrice(a.price)}</span>
                        </div>
                      </div>

                      {/* Botón cancelar */}
                      {canCancel && !isPast && (
                        <button
                          onClick={() => handleCancel(a.id)}
                          disabled={cancelling === a.id}
                          style={{ width: '100%', background: 'transparent', border: '1px solid rgba(224,82,82,0.2)', color: '#E05252', padding: '10px 0', borderRadius: 8, cursor: cancelling === a.id ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', fontFamily: 'DM Sans', opacity: cancelling === a.id ? 0.6 : 1, transition: 'all 0.2s' }}
                          onMouseEnter={e => { if (cancelling !== a.id) e.target.style.background = 'rgba(224,82,82,0.08)' }}
                          onMouseLeave={e => e.target.style.background = 'transparent'}
                        >
                          {cancelling === a.id ? 'CANCELANDO...' : 'CANCELAR CITA'}
                        </button>
                      )}

                      {a.notes && (
                        <p style={{ color: '#555', fontSize: 12, marginTop: 10, fontStyle: 'italic' }}>
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
              style={{ width: '100%', background: '#C9A84C', color: '#0A0A0A', border: 'none', padding: '14px 0', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', fontFamily: 'DM Sans', marginTop: 20 }}
            >
              + RESERVAR OTRA CITA
            </button>
          </div>
        )}
      </main>
    </div>
  )
}