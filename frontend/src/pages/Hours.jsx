import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import HelpButton from '../components/HelpButton'
import AgendaTabs from '../components/AgendaTabs'
import { useLocation } from 'react-router-dom'
import api from '../services/api'
import { useToast } from '../context/ToastContext'

// "14:30" -> "2:30 PM"  (para que el barbero no se confunda con hora militar)
function to12h(hhmm) {
  if (!hhmm || !/^\d{1,2}:\d{2}/.test(hhmm)) return ''
  const [h, m] = hhmm.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${h12}:${String(m).padStart(2, '0')} ${period}`
}

export default function Hours() {
  const { pathname } = useLocation()
  const toast = useToast()
  const [hours, setHours]   = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(null)

  useEffect(() => { fetchHours() }, [])

  const fetchHours = () => {
    api.get('/hours')
      .then(res => setHours(res.data.hours))
      .catch(err => toast.error(err.response?.data?.error || 'No se pudieron cargar los horarios.'))
      .finally(() => setLoading(false))
  }

  const handleChange = (day_of_week, field, value) => {
    setHours(prev => prev.map(h =>
      h.day_of_week === day_of_week ? { ...h, [field]: value } : h
    ))
  }

  const getRowError = (hour) =>
    (hour.is_open && hour.open_time && hour.close_time && hour.open_time >= hour.close_time)
      ? 'La hora de apertura debe ser anterior al cierre'
      : null

  const handleSave = async (hour) => {
    if (getRowError(hour)) {
      toast.error('La hora de apertura debe ser anterior al cierre')
      return
    }
    setSaving(hour.day_of_week)
    try {
      await api.put('/hours/' + hour.day_of_week, {
        open_time:  hour.open_time,
        close_time: hour.close_time,
        is_open:    hour.is_open,
      })
      toast.success(`Horario de ${hour.day_name} actualizado`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo guardar el horario. Intenta de nuevo.')
    } finally {
      setSaving(null)
    }
  }

  const inp = {
    padding: '8px 12px',
    width: 110,
    border: '1px solid var(--dark-4)',
    fontSize: 13,
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)' }}>
      <Navbar />
      <main style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px' }}>

        <p style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: '0.1em', fontWeight: 600, marginBottom: 16 }}>AGENDA</p>
        <AgendaTabs />

        <div className="animate-fade-up" style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: 'var(--cream)' }}>Horario de atención</h1>
          <p style={{ color: 'var(--cream-dim)', fontSize: 13, marginTop: 6 }}>
            Define los días y horarios en que tu barbería atiende clientes.
          </p>
        </div>

        <div className="animate-fade-up delay-1" style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-4)', borderRadius: 12, overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 1fr 80px 90px', gap: 12, padding: '12px 24px', borderBottom: '1px solid var(--dark-3)' }}>
            {['DÍA', 'APERTURA', 'CIERRE', 'ABIERTO', ''].map(h => (
              <p key={h} style={{ color: 'var(--cream-dim)', fontSize: 10, letterSpacing: '0.08em', fontWeight: 600 }}>{h}</p>
            ))}
          </div>

          {loading ? (
            <p style={{ color: 'var(--cream-dim)', textAlign: 'center', padding: '48px 0', fontSize: 14 }}>Cargando...</p>
          ) : hours.map((hour, i) => {
            const rowError = getRowError(hour)
            return (
            <div
              key={hour.day_of_week}
              style={{ borderBottom: i < hours.length - 1 ? '1px solid var(--dark-3)' : 'none', padding: '14px 24px' }}
            >
              <div
                style={{ display: 'grid', gridTemplateColumns: '140px 1fr 1fr 80px 90px', gap: 12, alignItems: 'center', opacity: hour.is_open ? 1 : 0.5, transition: 'opacity 0.2s' }}
              >
                <p style={{ color: 'var(--cream)', fontWeight: 600, fontSize: 14 }}>{hour.day_name}</p>

                <div>
                  <input
                    type="time"
                    value={hour.open_time}
                    onChange={e => handleChange(hour.day_of_week, 'open_time', e.target.value)}
                    disabled={!hour.is_open}
                    style={{ ...inp, opacity: hour.is_open ? 1 : 0.4, cursor: hour.is_open ? 'auto' : 'not-allowed', border: '1px solid ' + (rowError ? 'var(--gold)' : 'var(--dark-4)') }}
                  />
                  {hour.is_open && hour.open_time && (
                    <p style={{ fontSize: 11, color: 'var(--gold)', marginTop: 4, fontWeight: 600, letterSpacing: '0.02em' }}>{to12h(hour.open_time)}</p>
                  )}
                </div>

                <div>
                  <input
                    type="time"
                    value={hour.close_time}
                    onChange={e => handleChange(hour.day_of_week, 'close_time', e.target.value)}
                    disabled={!hour.is_open}
                    style={{ ...inp, opacity: hour.is_open ? 1 : 0.4, cursor: hour.is_open ? 'auto' : 'not-allowed', border: '1px solid ' + (rowError ? 'var(--gold)' : 'var(--dark-4)') }}
                  />
                  {hour.is_open && hour.close_time && (
                    <p style={{ fontSize: 11, color: 'var(--gold)', marginTop: 4, fontWeight: 600, letterSpacing: '0.02em' }}>{to12h(hour.close_time)}</p>
                  )}
                </div>

                {/* Toggle */}
                <div
                  onClick={() => handleChange(hour.day_of_week, 'is_open', !hour.is_open)}
                  style={{ width: 44, height: 24, borderRadius: 12, background: hour.is_open ? 'var(--gold)' : 'var(--dark-4)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}
                >
                  <div style={{ position: 'absolute', top: 3, left: hour.is_open ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: hour.is_open ? 'var(--dark)' : 'var(--cream-dim)', transition: 'left 0.2s' }} />
                </div>

                <button
                  onClick={() => handleSave(hour)}
                  disabled={saving === hour.day_of_week || !!rowError}
                  className="btn-primary" style={{ opacity: (saving === hour.day_of_week || rowError) ? 0.6 : 1, padding: '7px 16px' }}
                >
                  {saving === hour.day_of_week ? '...' : 'GUARDAR'}
                </button>
              </div>
              {rowError && <p style={{ color: '#E05252', fontSize: 12, marginTop: 8, marginLeft: 152 }}>⚠ {rowError}</p>}
            </div>
            )
          })}
        </div>

        <div className="animate-fade-up delay-2" style={{ background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.15)', borderRadius: 10, padding: '14px 20px', marginTop: 16 }}>
          <p style={{ color: 'var(--gold)', fontSize: 12, lineHeight: 1.6 }}>
            ◆ Los clientes solo podrán reservar citas dentro de estos horarios.
            Si un día está cerrado, no aparecerá disponible en la página de reservas.
          </p>
        </div>

      <Footer />
      </main>
      <HelpButton path={pathname} />
    </div>
  )
}