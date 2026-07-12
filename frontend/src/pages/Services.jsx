import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import HelpButton from '../components/HelpButton'
import { useLocation } from 'react-router-dom'
import api from '../services/api'
import { requiredError, lengthError, numberRangeError, hasErrors } from '../utils/validators'
import { useToast } from '../context/ToastContext'
import ImageUpload, { resolveImageSrc } from '../components/ImageUpload'
import { TrashIcon } from '../components/Icons'

const PAGE_SIZE = 6

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
  const toast = useToast()
  const [services, setServices] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [touched, setTouched]   = useState({})
  const [form, setForm]         = useState({ name: '', duration_min: '', price: '', image_url: '', description: '' })
  const [imgErrors, setImgErrors] = useState({})
  const [page, setPage]         = useState(1)

  const allErrors = validate(form)
  const errors = Object.keys(allErrors).reduce((acc, k) => {
    if (touched[k]) acc[k] = allErrors[k]
    return acc
  }, {})

  useEffect(() => { fetchServices() }, [])

  const fetchServices = () => {
    setLoading(true)
    api.get('/services')
      .then(res => setServices(res.data.services))
      .catch(err => toast.error(err.response?.data?.error || 'No se pudieron cargar los servicios.'))
      .finally(() => setLoading(false))
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setTouched(t => ({ ...t, [e.target.name]: true }))
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
      setShowForm(false)
      fetchServices()
      toast.success('Servicio agregado correctamente')
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo crear el servicio. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async (id) => {
    if (deleteBusy) return
    setDeleteBusy(true)
    try {
      await api.delete('/services/' + id)
      fetchServices()
      toast.success('Servicio eliminado')
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo eliminar el servicio.')
    } finally {
      setDeleteBusy(false)
      setDeleting(null)
    }
  }

  const inp = (name) => ({
    width: '100%', padding: '12px 16px',
    border: '1px solid ' + (errors[name] ? '#E8C97A' : 'var(--dark-4)'),
    boxShadow: errors[name] ? '0 0 0 2px rgba(232,201,122,0.15)' : 'none'
  })

  const totalPages = Math.max(1, Math.ceil(services.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const paginated  = services.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', display: 'flex', flexDirection: 'column' }}>

      {deleting && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="animate-fade-up" style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-4)', borderRadius: 16, padding: 32, maxWidth: 360, width: '90%', textAlign: 'center' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>⚠</p>
            <h3 style={{ color: 'var(--cream)', fontSize: 18, marginBottom: 8 }}>¿Eliminar servicio?</h3>
            <p style={{ color: 'var(--cream-dim)', fontSize: 13, marginBottom: 24 }}>Esta acción no se puede deshacer.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => setDeleting(null)} disabled={deleteBusy} className="btn-secondary">Cancelar</button>
              <button onClick={() => confirmDelete(deleting)} disabled={deleteBusy} className="btn-danger" style={{ opacity: deleteBusy ? 0.6 : 1 }}>
                {deleteBusy ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Navbar />
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px', flex: 1, width: '100%' }}>
        <div className="animate-fade-up" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <p style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: '0.1em', fontWeight: 600, marginBottom: 4 }}>CATÁLOGO</p>
            <h1 style={{ fontSize: 36, fontWeight: 900, color: 'var(--cream)' }}>Servicios</h1>
          </div>
          <button onClick={() => { setShowForm(!showForm); setForm({ name: '', duration_min: '', price: '', image_url: '', description: '' }); setTouched({}) }} className="btn-primary" style={{ opacity: showForm ? 0.6 : 1 }}>
            {showForm ? 'CANCELAR' : '+ AGREGAR'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="animate-fade-up" style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-4)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <p style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: '0.08em', fontWeight: 600, marginBottom: 16 }}>NUEVO SERVICIO</p>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 11, letterSpacing: '0.07em', color: 'var(--cream-dim)', marginBottom: 6, fontWeight: 600 }}>NOMBRE</label>
              <input name="name" value={form.name} onChange={handleChange} onBlur={handleChange} placeholder="Ej: Corte clásico" style={inp('name')} autoFocus />
              {errors.name && <p style={{ color: '#E8C97A', fontSize: 12, marginTop: 6 }}>⚠ {errors.name}</p>}
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
                {errors.duration_min && <p style={{ color: '#E8C97A', fontSize: 12, marginTop: 6 }}>⚠ {errors.duration_min}</p>}
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 11, letterSpacing: '0.07em', color: 'var(--cream-dim)', marginBottom: 6, fontWeight: 600 }}>PRECIO (COP)</label>
                <input name="price" type="number" value={form.price} onChange={handleChange} onBlur={handleChange} placeholder="25000" min="0" style={inp('price')} />
                {errors.price && <p style={{ color: '#E8C97A', fontSize: 12, marginTop: 6 }}>⚠ {errors.price}</p>}
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <ImageUpload
                label="Imagen de referencia (opcional)"
                value={form.image_url}
                onChange={(url) => setForm(f => ({ ...f, image_url: url }))}
              />
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
              <p style={{ color: 'var(--cream-dim)', fontSize: 14 }}>No hay servicios. Agrega el primero.</p>
            </div>
          ) : paginated.map((s, i) => (
            <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: i < paginated.length - 1 ? '1px solid var(--dark-3)' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, minWidth: 0 }}>
                {s.image_url && !imgErrors[s.id] ? (
                  <img
                    src={resolveImageSrc(s.image_url)}
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
                <button onClick={() => setDeleting(s.id)} className="btn-danger" title="Eliminar" aria-label="Eliminar servicio" style={{ padding: '9px 11px', display: 'inline-flex' }}>
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20 }}>
            <button
              onClick={() => setPage(Math.max(1, safePage - 1))}
              disabled={safePage === 1}
              style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-4)', color: safePage === 1 ? 'var(--dark-4)' : 'var(--cream-dim)', padding: '8px 14px', borderRadius: 8, cursor: safePage === 1 ? 'not-allowed' : 'pointer', fontSize: 13, fontFamily: 'DM Sans' }}
            >
              ←
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
              <button
                key={n}
                onClick={() => setPage(n)}
                style={{ background: n === safePage ? 'var(--gold)' : 'var(--dark-2)', border: '1px solid ' + (n === safePage ? 'var(--gold)' : 'var(--dark-4)'), color: n === safePage ? 'var(--dark)' : 'var(--cream-dim)', padding: '8px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: n === safePage ? 700 : 400, fontFamily: 'DM Sans', minWidth: 38 }}
              >
                {n}
              </button>
            ))}

            <button
              onClick={() => setPage(Math.min(totalPages, safePage + 1))}
              disabled={safePage === totalPages}
              style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-4)', color: safePage === totalPages ? 'var(--dark-4)' : 'var(--cream-dim)', padding: '8px 14px', borderRadius: 8, cursor: safePage === totalPages ? 'not-allowed' : 'pointer', fontSize: 13, fontFamily: 'DM Sans' }}
            >
              →
            </button>

            <span style={{ color: 'var(--cream-dim)', fontSize: 12, marginLeft: 8 }}>
              {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, services.length)} de {services.length}
            </span>
          </div>
        )}

      </main>
      <Footer />
      <HelpButton path={pathname} />
    </div>
  )
}