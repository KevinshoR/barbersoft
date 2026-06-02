import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import HelpButton from '../components/HelpButton'
import { useLocation } from 'react-router-dom'
import api from '../services/api'

function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [])
  const c = type === 'success'
    ? { bg: 'rgba(76,175,125,0.12)', border: 'rgba(76,175,125,0.4)', color: '#4CAF7D', icon: '✓' }
    : { bg: 'rgba(224,82,82,0.12)',  border: 'rgba(224,82,82,0.4)',  color: '#E05252', icon: '✕' }
  return (
    <div className="animate-fade-up" style={{ position: 'fixed', top: 24, right: 24, zIndex: 999, background: c.bg, border: '1px solid ' + c.border, color: c.color, borderRadius: 10, padding: '14px 20px', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10, minWidth: 260, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
      <span>{c.icon}</span>{message}
      <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 16, opacity: 0.6 }}>×</button>
    </div>
  )
}

export default function Hours() {
  const { pathname } = useLocation()
  const [hours, setHours]   = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(null)
  const [toast, setToast]     = useState(null)

  useEffect(() => { fetchHours() }, [])

  const showToast = (message, type = 'success') => setToast({ message, type })

  const fetchHours = () => {
    api.get('/hours')
      .then(res => setHours(res.data.hours))
      .catch(() => showToast('Error cargando horarios', 'error'))
      .finally(() => setLoading(false))
  }

  const handleChange = (day_of_week, field, value) => {
    setHours(prev => prev.map(h =>
      h.day_of_week === day_of_week ? { ...h, [field]: value } : h
    ))
  }

  const handleSave = async (hour) => {
    if (hour.is_open && hour.open_time >= hour.close_time) {
      showToast('La hora de apertura debe ser anterior al cierre', 'error')
      return
    }
    setSaving(hour.day_of_week)
    try {
      await api.put('/hours/' + hour.day_of_week, {
        open_time:  hour.open_time,
        close_time: hour.close_time,
        is_open:    hour.is_open,
      })
      showToast('Horario guardado')
    } catch (err) {
      showToast(err.response?.data?.error || 'Error guardando horario', 'error')
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
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <Navbar />
      <main style={{ maxWidth: 700, margin: '0 auto', padding: '40px 24px' }}>

        <div className="animate-fade-up" style={{ marginBottom: 32 }}>
          <p style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: '0.1em', fontWeight: 600, marginBottom: 4 }}>CONFIGURACIÓN</p>
          <h1 style={{ fontSize: 36, fontWeight: 900, color: 'var(--cream)' }}>Horarios</h1>
          <p style={{ color: 'var(--cream-dim)', fontSize: 13, marginTop: 6 }}>
            Definí los días y horarios en que tu barbería atiende clientes.
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
          ) : hours.map((hour, i) => (
            <div
              key={hour.day_of_week}
              style={{ display: 'grid', gridTemplateColumns: '140px 1fr 1fr 80px 90px', gap: 12, alignItems: 'center', padding: '14px 24px', borderBottom: i < hours.length - 1 ? '1px solid var(--dark-3)' : 'none', opacity: hour.is_open ? 1 : 0.5, transition: 'opacity 0.2s' }}
            >
              <p style={{ color: 'var(--cream)', fontWeight: 600, fontSize: 14 }}>{hour.day_name}</p>

              <input
                type="time"
                value={hour.open_time}
                onChange={e => handleChange(hour.day_of_week, 'open_time', e.target.value)}
                disabled={!hour.is_open}
                style={{ ...inp, opacity: hour.is_open ? 1 : 0.4, cursor: hour.is_open ? 'auto' : 'not-allowed' }}
              />

              <input
                type="time"
                value={hour.close_time}
                onChange={e => handleChange(hour.day_of_week, 'close_time', e.target.value)}
                disabled={!hour.is_open}
                style={{ ...inp, opacity: hour.is_open ? 1 : 0.4, cursor: hour.is_open ? 'auto' : 'not-allowed' }}
              />

              {/* Toggle */}
              <div
                onClick={() => handleChange(hour.day_of_week, 'is_open', !hour.is_open)}
                style={{ width: 44, height: 24, borderRadius: 12, background: hour.is_open ? 'var(--gold)' : 'var(--dark-4)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0 }}
              >
                <div style={{ position: 'absolute', top: 3, left: hour.is_open ? 23 : 3, width: 18, height: 18, borderRadius: '50%', background: hour.is_open ? 'var(--dark)' : 'var(--cream-dim)', transition: 'left 0.2s' }} />
              </div>

              <button
                onClick={() => handleSave(hour)}
                disabled={saving === hour.day_of_week}
                className="btn-primary" style={{ opacity: saving === hour.day_of_week ? 0.6 : 1, padding: '7px 16px' }}
              >
                {saving === hour.day_of_week ? '...' : 'GUARDAR'}
              </button>
            </div>
          ))}
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