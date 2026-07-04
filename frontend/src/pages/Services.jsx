import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import HelpButton from '../components/HelpButton'
import { useLocation } from 'react-router-dom'
import api from '../services/api'
import { requiredError, lengthError, numberRangeError, hasErrors } from '../utils/validators'

function Toast({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [])
  const c = type === 'success'
    ? { bg: 'rgba(76,175,125,0.12)', border: 'rgba(76,175,125,0.4)', color: '#4CAF7D', icon: '✓' }
    : { bg: 'rgba(224,82,82,0.12)',  border: 'rgba(224,82,82,0.4)',  color: '#E05252', icon: '✕' }
  return (
    <div className="animate-fade-up" style={{ position: 'fixed', top: 24, right: 24, zIndex: 999, background: c.bg, border: '1px solid ' + c.border, color: c.color, borderRadius: 10, padding: '14px 20px', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 10, minWidth: 260, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
      <span style={{ fontSize: 16 }}>{c.icon}</span>
      {message}
      <button onClick={onClose} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 16, opacity: 0.6 }}>×</button>
    </div>
  )
}

function validate(form) {
  const errors = {}
  errors.name = requiredError(form.name, 'El nombre') || lengthError(form.name, { min: 2, label: 'El nombre' })
  if (!form.duration_min) errors.duration_min = 'La duración es obligatoria'
  else errors.duration_min = numberRangeError(form.duration_min, { min: 5, max: 480, label: 'La duración' })
  if (!form.price) errors.price = 'El precio es obligatorio'
  else errors.price = numberRangeError(form.price, { min: 0, label: 'El precio' })
  Object.keys(errors).forEach(k => { if (!errors[k]) delete errors[k] })
  return errors
}

const formatPrice = (price) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(price)

export default function Services() {
  const { pathname } = useLocation()
  const [services, setServices] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [toast, setToast]       = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [touched, setTouched]   = useState({})
  const [form, setForm]         = useState({ name: '', duration_min: '', price: '', image_url: '', description: '' })
  const [previewError, setPreviewError] = useState(false)
  const [imgErrors, setImgErrors] = useState({})

  const allErrors = validate(form)
  const errors = Object.keys(allErrors).reduce((acc, k) => {
    if (touched[k]) acc[k] = allErrors[k]
    return acc
  }, {})

  useEffect(() => { fetchServices() }, [])

  const showToast = (message, type = 'success') => setToast({ message, type })

  const fetchServices = () => {
    setLoading(true)
    api.get('/services')
      .then(res => setServices(res.data.services))
      .catch(() => showToast('Error cargando servicios', 'error'))
      .finally(() => setLoading(false))
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setTouched(t => ({ ...t, [e.target.name]: true }))
    if (e.target.name === 'image_url') setPreviewError(false)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setTouched({ name: true, duration_min: true, price: true })
    if (hasErrors(allErrors)) return
    setSaving(true)
    try {
      await api.post('/services', {
        name: form.name.trim(),
        duration_min: parseInt(form.duration_min),
        price: parseFloat(form.price),
        image_url: form.image_url.trim() || null,
        description: form.description.trim() || null,
      })
      setForm({ name: '', duration_min: '', price: '', image_url: '', description: '' })
      setTouched({})
      setPreviewError(false)
      setShowForm(false)
      fetchServices()
      showToast('Servicio agregado correctamente')
    } catch (err) {
      showToast(err.response?.data?.error || 'Error creando servicio', 'error')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async (id) => {
    try {
      await api.delete('/services/' + id)
      fetchServices()
      showToast('Servicio eliminado')
    } catch {
      showToast('Error eliminando servicio', 'error')
    } finally {
      setDeleting(null)
    }
  }

  const inp = (name) => ({
    width: '100%', padding: '12px 16px',
    border: '1px solid ' + (errors[name] ? '#E05252' : 'var(--dark-4)'),
    boxShadow: errors[name] ? '0 0 0 2px rgba(224,82,82,0.15)' : 'none'
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {deleting && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="animate-fade-up" style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-4)', borderRadius: 16, padding: 32, maxWidth: 360, width: '90%', textAlign: 'center' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>⚠</p>
            <h3 style={{ color: 'var(--cream)', fontSize: 18, marginBottom: 8 }}>¿Eliminar servicio?</h3>
            <p style={{ color: 'var(--cream-dim)', fontSize: 13, marginBottom: 24 }}>Esta acción no se puede deshacer.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => setDeleting(null)} className="btn-secondary">Cancelar</button>
              <button onClick={() => confirmDelete(deleting)} className="btn-danger">Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      <Navbar />
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>
        <div className="animate-fade-up" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <p style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: '0.1em', fontWeight: 600, marginBottom: 4 }}>CATÁLOGO</p>
            <h1 style={{ fontSize: 36, fontWeight: 900, color: 'var(--cream)' }}>Servicios</h1>
          </div>
          <button onClick={() => { setShowForm(!showForm); setForm({ name: '', duration_min: '', price: '', image_url: '', description: '' }); setTouched({}); setPreviewError(false) }} className="btn-primary" style={{ opacity: showForm ? 0.6 : 1 }}>
            {showForm ? 'CANCELAR' : '+ AGREGAR'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="animate-fade-up" style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-4)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <p style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: '0.08em', fontWeight: 600, marginBottom: 16 }}>NUEVO SERVICIO</p>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, letterSpacing: '0.07em', color: 'var(--cream-dim)', marginBottom: 6, fontWeight: 600 }}>NOMBRE</label>
              <input name="name" value={form.name} onChange={handleChange} onBlur={handleChange} placeholder="Ej: Corte clásico" style={inp('name')} autoFocus />
              {errors.name && <p style={{ color: '#E05252', fontSize: 12, marginTop: 6 }}>⚠ {errors.name}</p>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, letterSpacing: '0.07em', color: 'var(--cream-dim)', marginBottom: 6, fontWeight: 600 }}>DURACIÓN (MINUTOS)</label>
                <input name="duration_min" type="number" value={form.duration_min} onChange={handleChange} onBlur={handleChange} placeholder="Ej: 45" min="5" max="480" style={inp('duration_min')} />
                {form.duration_min && (
  <p style={{ color:'var(--cream-dim)', fontSize:11, marginTop:5, opacity:0.7 }}>
    ⏱ Aproximadamente {form.duration_min} minutos por cita
  </p>
)}
                {errors.duration_min && <p style={{ color: '#E05252', fontSize: 12, marginTop: 6 }}>⚠ {errors.duration_min}</p>}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, letterSpacing: '0.07em', color: 'var(--cream-dim)', marginBottom: 6, fontWeight: 600 }}>PRECIO (COP)</label>
                <input name="price" type="number" value={form.price} onChange={handleChange} onBlur={handleChange} placeholder="25000" min="0" style={inp('price')} />
                {errors.price && <p style={{ color: '#E05252', fontSize: 12, marginTop: 6 }}>⚠ {errors.price}</p>}
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, letterSpacing: '0.07em', color: 'var(--cream-dim)', marginBottom: 6, fontWeight: 600 }}>URL DE IMAGEN (OPCIONAL)</label>
              <input name="image_url" value={form.image_url} onChange={handleChange} placeholder="https://ejemplo.com/foto.jpg" style={inp('image_url')} />
              {form.image_url && /^https?:\/\/.+/i.test(form.image_url) && !previewError && (
                <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img
                    src={form.image_url}
                    alt="Vista previa"
                    onError={() => setPreviewError(true)}
                    style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--dark-4)' }}
                  />
                  <span style={{ color: 'var(--cream-dim)', fontSize: 12 }}>Vista previa</span>
                </div>
              )}
              {form.image_url && /^https?:\/\/.+/i.test(form.image_url) && previewError && (
                <p style={{ color: 'var(--cream-dim)', fontSize: 12, marginTop: 6, opacity: 0.7 }}>No se pudo cargar la imagen desde esa URL</p>
              )}
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, letterSpacing: '0.07em', color: 'var(--cream-dim)', marginBottom: 6, fontWeight: 600 }}>DESCRIPCIÓN CORTA (OPCIONAL)</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                maxLength={200}
                rows={3}
                placeholder="Ej: Corte a máquina y tijera, incluye lavado"
                style={{ width: '100%', padding: '12px 16px', resize: 'vertical' }}
              />
              <p style={{ color: 'var(--cream-dim)', fontSize: 11, marginTop: 5, textAlign: 'right', opacity: 0.7 }}>{form.description.length}/200</p>
            </div>
            <button type="submit" disabled={saving || hasErrors(allErrors)} className="btn-primary" style={{ opacity: (saving || hasErrors(allErrors)) ? 0.6 : 1 }}>
              {saving ? 'GUARDANDO...' : 'GUARDAR SERVICIO'}
            </button>
          </form>
        )}

        <div className="animate-fade-up delay-2" style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-4)', borderRadius: 12, overflow: 'hidden' }}>
          {loading ? (
            <p style={{ color: 'var(--cream-dim)', textAlign: 'center', padding: '48px 0', fontSize: 14 }}>Cargando...</p>
          ) : services.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '56px 0' }}>
              <p style={{ fontSize: 36, marginBottom: 12 }}>✦</p>
              <p style={{ color: 'var(--cream-dim)', fontSize: 14 }}>No hay servicios. Agregá el primero.</p>
            </div>
          ) : services.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: i < services.length - 1 ? '1px solid var(--dark-3)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
                {s.image_url && !imgErrors[s.id] ? (
                  <img
                    src={s.image_url}
                    alt={s.name}
                    onError={() => setImgErrors(prev => ({ ...prev, [s.id]: true }))}
                    style={{ width: 42, height: 42, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                  />
                ) : (
                  <div style={{ width: 42, height: 42, borderRadius: 8, background: 'var(--dark-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'var(--gold)', flexShrink: 0 }}>✦</div>
                )}
                <div style={{ minWidth: 0 }}>
                  <p style={{ color: 'var(--cream)', fontWeight: 600, fontSize: 15 }}>{s.name}</p>
                  <p style={{ color: 'var(--cream-dim)', fontSize: 12, marginTop: 2 }}>{s.duration_min} minutos</p>
                  {s.description && (
                    <p style={{ color: 'var(--cream-dim)', fontSize: 12, marginTop: 2, opacity: 0.8, maxWidth: 360, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {s.description}
                    </p>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <p style={{ color: 'var(--gold)', fontFamily: 'Playfair Display', fontWeight: 700, fontSize: 18 }}>{formatPrice(s.price)}</p>
                <button onClick={() => setDeleting(s.id)} className="btn-danger">
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