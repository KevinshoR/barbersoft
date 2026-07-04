import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import HelpButton from '../components/HelpButton'
import { useLocation } from 'react-router-dom'
import api from '../services/api'
import { requiredError, lengthError, combine } from '../utils/validators'

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [])

  const colors = {
    success: { bg: 'rgba(76,175,125,0.12)', border: 'rgba(76,175,125,0.4)', color: '#4CAF7D', icon: '✓' },
    error:   { bg: 'rgba(224,82,82,0.12)',  border: 'rgba(224,82,82,0.4)',  color: '#E05252', icon: '✕' },
  }
  const c = colors[type]

  return (
    <div className="animate-fade-up" style={{
      position: 'fixed', top: 24, right: 24, zIndex: 999,
      background: c.bg, border: '1px solid ' + c.border,
      color: c.color, borderRadius: 10, padding: '14px 20px',
      fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10,
      minWidth: 260, boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
    }}>
      <span style={{ fontSize: 16 }}>{c.icon}</span>
      {message}
      <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 16, opacity: 0.6 }}>×</button>
    </div>
  )
}

const validateName = combine(
  v => requiredError(v, 'El nombre'),
  v => lengthError(v, { min: 2, max: 60, label: 'El nombre' })
)

export default function Barbers() {
  const { pathname } = useLocation()
  const [barbers, setBarbers]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName]         = useState('')
  const [nameError, setNameError] = useState('')
  const [saving, setSaving]     = useState(false)
  const [toast, setToast]       = useState(null)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => { fetchBarbers() }, [])

  const showToast = (message, type = 'success') => setToast({ message, type })

  const fetchBarbers = () => {
    setLoading(true)
    api.get('/barbers')
      .then(res => setBarbers(res.data.barbers))
      .catch(() => showToast('Error cargando barberos', 'error'))
      .finally(() => setLoading(false))
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    const err = validateName(name)
    if (err) { setNameError(err); return }
    setSaving(true)
    try {
      await api.post('/barbers', { name: name.trim() })
      setName('')
      setShowForm(false)
      fetchBarbers()
      showToast('Barbero agregado correctamente')
    } catch (err) {
      showToast(err.response?.data?.error || 'Error creando barbero', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (barber) => {
    try {
      await api.put('/barbers/' + barber.id, { active: !barber.active })
      fetchBarbers()
      showToast(barber.active ? 'Barbero desactivado' : 'Barbero activado')
    } catch {
      showToast('Error actualizando barbero', 'error')
    }
  }

  const handleDelete = async (barber) => {
    setDeleting(barber.id)
  }

  const confirmDelete = async (id) => {
    try {
      await api.delete('/barbers/' + id)
      fetchBarbers()
      showToast('Barbero eliminado')
    } catch {
      showToast('Error eliminando barbero', 'error')
    } finally {
      setDeleting(null)
    }
  }

  const inputStyle = (hasError) => ({
    width: '100%', padding: '12px 16px',
    border: '1px solid ' + (hasError ? '#E05252' : 'var(--dark-4)'),
    boxShadow: hasError ? '0 0 0 2px rgba(224,82,82,0.15)' : 'none'
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Modal confirmar eliminar */}
      {deleting && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="animate-fade-up" style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-4)', borderRadius: 16, padding: 32, maxWidth: 360, width: '90%', textAlign: 'center' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>⚠</p>
            <h3 style={{ color: 'var(--cream)', fontSize: 18, marginBottom: 8 }}>¿Eliminar barbero?</h3>
            <p style={{ color: 'var(--cream-dim)', fontSize: 13, marginBottom: 24 }}>Esta acción no se puede deshacer. Las citas asociadas quedarán sin barbero asignado.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => setDeleting(null)} className="btn-secondary">
                Cancelar
              </button>
              <button onClick={() => confirmDelete(deleting)} className="btn-danger">
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      <Navbar />
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>

        <div className="animate-fade-up" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <p style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: '0.1em', fontWeight: 600, marginBottom: 4 }}>EQUIPO</p>
            <h1 style={{ fontSize: 36, fontWeight: 900, color: 'var(--cream)' }}>Barberos</h1>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setName(''); setNameError('') }}
            className="btn-primary" style={{ opacity: showForm ? 0.6 : 1 }}
          >
            {showForm ? 'CANCELAR' : '+ AGREGAR'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="animate-fade-up" style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-4)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <p style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: '0.08em', fontWeight: 600, marginBottom: 16 }}>NUEVO BARBERO</p>
            <div style={{ marginBottom: 6 }}>
              <input
                value={name}
                onChange={e => { const v = e.target.value; setName(v); setNameError(validateName(v) || '') }}
                onBlur={() => setNameError(validateName(name) || '')}
                placeholder="Nombre completo del barbero"
                style={inputStyle(nameError)}
                autoFocus
              />
              {nameError && <p style={{ color: '#E05252', fontSize: 12, marginTop: 6 }}>⚠ {nameError}</p>}
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button type="submit" disabled={saving || !!validateName(name)} className="btn-primary" style={{ opacity: (saving || !!validateName(name)) ? 0.6 : 1 }}>
                {saving ? 'GUARDANDO...' : 'GUARDAR'}
              </button>
            </div>
          </form>
        )}

        <div className="animate-fade-up delay-2" style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-4)', borderRadius: 12, overflow: 'hidden' }}>
          {loading ? (
            <p style={{ color: 'var(--cream-dim)', textAlign: 'center', padding: '48px 0', fontSize: 14 }}>Cargando...</p>
          ) : barbers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '56px 0' }}>
              <p style={{ fontSize: 36, marginBottom: 12 }}>◈</p>
              <p style={{ color: 'var(--cream-dim)', fontSize: 14 }}>No hay barberos. Agregá el primero.</p>
            </div>
          ) : barbers.map((barber, i) => (
            <div key={barber.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 24px', borderBottom: i < barbers.length - 1 ? '1px solid var(--dark-3)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg, var(--gold-dim), var(--gold))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: 'var(--dark)', fontFamily: 'Playfair Display' }}>
                  {barber.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p style={{ color: 'var(--cream)', fontWeight: 600, fontSize: 15 }}>{barber.name}</p>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: barber.active ? 'var(--success)' : 'var(--cream-dim)', marginTop: 2 }}>
                    {barber.active ? '● ACTIVO' : '○ INACTIVO'}
                  </p>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => handleToggle(barber)} style={{ background: 'var(--dark-3)', border: '1px solid var(--dark-4)', color: 'var(--cream-dim)', padding: '7px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', fontFamily: 'DM Sans' }}>
                  {barber.active ? 'DESACTIVAR' : 'ACTIVAR'}
                </button>
                <button onClick={() => handleDelete(barber)} className="btn-danger">
                  ELIMINAR
                </button>
              </div>
            </div>
          ))}
        </div>
      <Footer />
      </main>
      <HelpButton path={pathname} />
    </div>
  )
}