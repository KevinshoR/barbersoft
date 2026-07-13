import { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import HelpButton from '../components/HelpButton'
import api from '../services/api'
import { requiredError, lengthError, numberRangeError, hasErrors } from '../utils/validators'
import { useToast } from '../context/ToastContext'
import ImageUpload, { resolveImageSrc } from '../components/ImageUpload'

const formatPrice = (p) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(p)

function validate(form) {
  const e = {}
  e.name = requiredError(form.name, 'El nombre') || lengthError(form.name, { min: 2, label: 'El nombre' })
  if (!form.duration_min) e.duration_min = 'La duración es obligatoria'
  else e.duration_min = numberRangeError(form.duration_min, { min: 5, max: 480, label: 'La duración' })
  if (!form.price) e.price = 'El precio es obligatorio'
  else e.price = numberRangeError(form.price, { min: 0, label: 'El precio' })
  Object.keys(e).forEach(k => { if (!e[k]) delete e[k] })
  return e
}

const Ic = {
  search: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  plus: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 5v14M5 12h14"/></svg>,
  eye: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>,
  pencil: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>,
  trash: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6"/></svg>,
  back: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  x: (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M18 6 6 18M6 6l12 12"/></svg>,
  clock: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  scissors: (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12"/></svg>,
}

function IconBtn({ icon, tooltip, onClick, danger }) {
  const [hover, setHover] = useState(false)
  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        style={{ width: 36, height: 36, borderRadius: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'var(--surface-1)', border: '1px solid var(--dark-4)', color: danger ? '#C97A7A' : 'var(--cream-dim)', transition: 'all 0.15s' }}
        onMouseOver={(e) => { e.currentTarget.style.borderColor = danger ? '#C97A7A' : 'var(--gold)'; e.currentTarget.style.color = danger ? '#D89090' : 'var(--gold)' }}
        onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--dark-4)'; e.currentTarget.style.color = danger ? '#C97A7A' : 'var(--cream-dim)' }}>
        {icon}
      </button>
      {hover && <span style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)', background: 'var(--dark-4)', color: 'var(--cream)', fontSize: 11, fontWeight: 600, padding: '4px 8px', borderRadius: 6, whiteSpace: 'nowrap', zIndex: 20, pointerEvents: 'none' }}>{tooltip}</span>}
    </div>
  )
}

function Thumb({ src, size = 56 }) {
  return src ? (
    <img src={src} alt="" style={{ width: size, height: size, borderRadius: 12, objectFit: 'cover', flexShrink: 0, border: '1px solid var(--dark-4)' }} onError={(e) => { e.target.style.display = 'none' }} />
  ) : (
    <div style={{ width: size, height: size, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--gold-dim) 0%, var(--dark-3) 100%)', border: '1px solid rgba(201,168,76,0.25)', color: 'var(--gold-light)', opacity: 0.6 }}>{Ic.scissors()}</div>
  )
}

const lbl = { display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--cream-dim)', marginBottom: 8 }
const optLbl = { color: 'var(--cream-dim)', fontWeight: 400, letterSpacing: 0, textTransform: 'none' }
const inp = { width: '100%', padding: '12px 15px', fontSize: 14, background: 'var(--surface-1)', color: 'var(--cream)', border: '1px solid var(--dark-4)', borderRadius: 10, outline: 'none' }

export default function Services() {
  const { pathname } = useLocation()
  const toast = useToast()
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('list')
  const [editing, setEditing] = useState(null)
  const [detail, setDetail] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [saving, setSaving] = useState(false)
  const [touched, setTouched] = useState({})
  const [form, setForm] = useState({ name: '', duration_min: '', price: '', image_url: '', description: '' })
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('recientes')

  const allErrors = validate(form)
  const errors = Object.keys(allErrors).reduce((a, k) => { if (touched[k]) a[k] = allErrors[k]; return a }, {})

  useEffect(() => { fetchServices() }, [])
  const fetchServices = () => {
    setLoading(true)
    api.get('/services').then(res => setServices(res.data.services))
      .catch(err => toast.error(err.response?.data?.error || 'No se pudieron cargar los servicios.'))
      .finally(() => setLoading(false))
  }
  const handleChange = (e) => { setForm({ ...form, [e.target.name]: e.target.value }); setTouched(t => ({ ...t, [e.target.name]: true })) }
  const openCreate = () => { setEditing(null); setForm({ name: '', duration_min: '', price: '', image_url: '', description: '' }); setTouched({}); setView('form') }
  const openEdit = (s) => { setEditing(s); setForm({ name: s.name || '', duration_min: String(s.duration_min || ''), price: String(s.price || ''), image_url: s.image_url || '', description: s.description || '' }); setTouched({}); setView('form') }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched({ name: true, duration_min: true, price: true })
    if (hasErrors(allErrors)) return
    setSaving(true)
    const payload = { name: form.name.trim(), duration_min: parseInt(form.duration_min), price: parseFloat(form.price), image_url: form.image_url.trim() || null, description: form.description.trim() || null }
    try {
      if (editing) { await api.put('/services/' + editing.id, payload); toast.success('Servicio actualizado') }
      else { await api.post('/services', payload); toast.success('Servicio agregado correctamente') }
      setView('list'); fetchServices()
    } catch (err) { toast.error(err.response?.data?.error || 'No se pudo guardar el servicio. Intenta de nuevo.') }
    finally { setSaving(false) }
  }
  const confirmDelete = async (id) => {
    if (deleteBusy) return
    setDeleteBusy(true)
    try { await api.delete('/services/' + id); fetchServices(); toast.success('Servicio eliminado') }
    catch (err) { toast.error(err.response?.data?.error || 'No se pudo eliminar el servicio.') }
    finally { setDeleteBusy(false); setDeleting(null) }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let arr = !q ? [...services] : services.filter(s => (s.name || '').toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q))
    if (sort === 'precio_asc') arr.sort((a, b) => Number(a.price) - Number(b.price))
    else if (sort === 'precio_desc') arr.sort((a, b) => Number(b.price) - Number(a.price))
    else if (sort === 'nombre') arr.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    return arr
  }, [services, search, sort])

  if (view === 'form') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--dark)', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 60px', flex: 1, width: '100%' }}>
          <button onClick={() => setView('list')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: 'var(--cream-dim)', cursor: 'pointer', fontSize: 13, fontWeight: 600, marginBottom: 24 }}>{Ic.back()} Volver a servicios</button>
          <p style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: '0.12em', fontWeight: 700, textTransform: 'uppercase' }}>{editing ? 'Editar' : 'Nuevo'}</p>
          <h1 style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: 34, fontWeight: 800, color: 'var(--cream)', marginTop: 4, marginBottom: 28 }}>{editing ? 'Editar servicio' : 'Nuevo servicio'}</h1>
          <form onSubmit={handleSubmit}>
            <div style={{ background: 'linear-gradient(135deg, var(--dark-2) 0%, var(--dark-3) 100%)', border: '1px solid var(--dark-4)', borderRadius: 16, padding: 26, marginBottom: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
              <div style={{ marginBottom: 20 }}>
                <label style={lbl}>NOMBRE DEL SERVICIO</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="Ej: Corte clásico + barba" style={{ ...inp, border: '1px solid ' + (errors.name ? '#C97A7A' : 'var(--dark-4)') }} />
                {errors.name && <p style={{ color: '#C97A7A', fontSize: 12, marginTop: 5 }}>{errors.name}</p>}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={lbl}>DURACIÓN</label>
                  <div style={{ position: 'relative' }}>
                    <input name="duration_min" type="number" value={form.duration_min} onChange={handleChange} placeholder="30" style={{ ...inp, paddingRight: 46, border: '1px solid ' + (errors.duration_min ? '#C97A7A' : 'var(--dark-4)') }} />
                    <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--cream-dim)', fontSize: 13, pointerEvents: 'none' }}>min</span>
                  </div>
                  {errors.duration_min && <p style={{ color: '#C97A7A', fontSize: 12, marginTop: 5 }}>{errors.duration_min}</p>}
                </div>
                <div>
                  <label style={lbl}>PRECIO</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--cream-dim)', fontSize: 14, pointerEvents: 'none' }}>$</span>
                    <input name="price" type="number" value={form.price} onChange={handleChange} placeholder="15000" style={{ ...inp, paddingLeft: 26, border: '1px solid ' + (errors.price ? '#C97A7A' : 'var(--dark-4)') }} />
                  </div>
                  {errors.price && <p style={{ color: '#C97A7A', fontSize: 12, marginTop: 5 }}>{errors.price}</p>}
                </div>
              </div>
            </div>

            <div style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-4)', borderRadius: 16, padding: 26, marginBottom: 20 }}>
              <label style={lbl}>DESCRIPCIÓN <span style={optLbl}>(opcional)</span></label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Cuéntale al cliente qué incluye este servicio..." style={{ ...inp, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }} />
            </div>

            <div style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-4)', borderRadius: 16, padding: 26, marginBottom: 26 }}>
              <label style={{ ...lbl, marginBottom: 12 }}>IMAGEN DE REFERENCIA <span style={optLbl}>(opcional)</span></label>
              <ImageUpload value={form.image_url} onChange={(url) => setForm(f => ({ ...f, image_url: url || '' }))} />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" onClick={() => setView('list')} style={{ flex: 1, padding: 14, borderRadius: 12, border: '1px solid var(--dark-4)', background: 'transparent', color: 'var(--cream-dim)', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
              <button type="submit" disabled={saving} style={{ flex: 2, padding: 14, borderRadius: 12, border: 'none', background: 'var(--gold)', color: 'var(--dark)', fontWeight: 700, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1, boxShadow: '0 4px 16px rgba(201,168,76,0.25)' }}>{saving ? 'Guardando...' : (editing ? 'Guardar cambios' : 'Crear servicio')}</button>
            </div>
          </form>
        </main>
        <Footer />
        <HelpButton path={pathname} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '32px 24px 60px', flex: 1, width: '100%' }}>
        <p style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: '0.12em', fontWeight: 700, textTransform: 'uppercase' }}>Catálogo</p>
        <h1 style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: 34, fontWeight: 800, color: 'var(--cream)', marginTop: 4, marginBottom: 24 }}>Servicios</h1>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--cream-dim)', display: 'flex' }}>{Ic.search()}</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar servicio..." style={{ width: '100%', padding: '12px 14px 12px 42px', background: 'var(--surface-1)', color: 'var(--cream)', border: '1px solid var(--dark-4)', borderRadius: 12, outline: 'none', fontSize: 14 }} />
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ padding: '12px 14px', background: 'var(--surface-1)', color: 'var(--cream)', border: '1px solid var(--dark-4)', borderRadius: 12, outline: 'none', cursor: 'pointer', fontSize: 14 }}>
            <option value="recientes">Más recientes</option>
            <option value="precio_asc">Precio: menor a mayor</option>
            <option value="precio_desc">Precio: mayor a menor</option>
            <option value="nombre">Nombre (A-Z)</option>
          </select>
          <button onClick={openCreate} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--gold)', color: 'var(--dark)', fontWeight: 700, fontSize: 14, padding: '12px 22px', border: 'none', borderRadius: 12, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(201,168,76,0.25)' }}>{Ic.plus()} Nuevo servicio</button>
        </div>

        {loading ? (
          <p style={{ color: 'var(--cream-dim)', textAlign: 'center', padding: 50 }}>Cargando...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed var(--dark-4)', borderRadius: 16 }}>
            <div style={{ color: 'var(--gold)', opacity: 0.4, display: 'flex', justifyContent: 'center', marginBottom: 12 }}>{Ic.scissors()}</div>
            <p style={{ color: 'var(--cream-dim)', fontSize: 14 }}>{services.length === 0 ? 'Aún no tienes servicios. Crea el primero.' : 'Sin resultados.'}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(s => (
              <div key={s.id} style={{ background: 'linear-gradient(135deg, var(--dark-2) 0%, rgba(31,31,31,0.6) 100%)', border: '1px solid var(--dark-4)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.25)' }}>
                <Thumb src={resolveImageSrc(s.image_url)} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: 17, fontWeight: 700, color: 'var(--cream)' }}>{s.name}</p>
                  <p style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--cream-dim)', fontSize: 13, marginTop: 3 }}>{Ic.clock()} {s.duration_min} min</p>
                  {s.description && <p style={{ color: 'var(--cream-dim)', fontSize: 12.5, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.8 }}>{s.description}</p>}
                </div>
                <span style={{ color: 'var(--gold)', fontFamily: 'var(--font-display, Georgia, serif)', fontWeight: 800, fontSize: 19, whiteSpace: 'nowrap' }}>{formatPrice(s.price)}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <IconBtn icon={Ic.eye()} tooltip="Ver detalle" onClick={() => setDetail(s)} />
                  <IconBtn icon={Ic.pencil()} tooltip="Editar" onClick={() => openEdit(s)} />
                  <IconBtn icon={Ic.trash()} tooltip="Eliminar" danger onClick={() => setDeleting(s.id)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="animate-fade-up" style={{ background: 'var(--dark-2)', borderRadius: 18, width: '100%', maxWidth: 480, maxHeight: '92vh', overflow: 'hidden', border: '1px solid var(--dark-4)', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ position: 'relative', height: 220, background: 'var(--dark-3)', flexShrink: 0 }}>
              {resolveImageSrc(detail.image_url) ? (
                <img src={resolveImageSrc(detail.image_url)} alt={detail.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', opacity: 0.25 }}>{Ic.scissors({ width: 56, height: 56 })}</div>
              )}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 50%)' }} />
              <button onClick={() => setDetail(null)} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(0,0,0,0.5)', border: 'none', color: 'var(--cream)', cursor: 'pointer', width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{Ic.x()}</button>
              <div style={{ position: 'absolute', bottom: 16, left: 24, right: 24 }}>
                <p style={{ color: 'var(--gold-light)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Servicio</p>
                <h2 style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: 26, fontWeight: 800, color: '#fff', marginTop: 2 }}>{detail.name}</h2>
              </div>
            </div>
            <div style={{ padding: 24, overflowY: 'auto' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: detail.description ? 20 : 0 }}>
                <div style={{ background: 'var(--surface-1)', border: '1px solid var(--dark-4)', borderRadius: 12, padding: 16 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--cream-dim)', textTransform: 'uppercase', marginBottom: 6 }}>Precio</p>
                  <p style={{ color: 'var(--gold)', fontWeight: 800, fontSize: 22, fontFamily: 'var(--font-display, Georgia, serif)' }}>{formatPrice(detail.price)}</p>
                </div>
                <div style={{ background: 'var(--surface-1)', border: '1px solid var(--dark-4)', borderRadius: 12, padding: 16 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--cream-dim)', textTransform: 'uppercase', marginBottom: 6 }}>Duración</p>
                  <p style={{ color: 'var(--cream)', fontWeight: 700, fontSize: 22, fontFamily: 'var(--font-display, Georgia, serif)' }}>{detail.duration_min} <span style={{ fontSize: 13, color: 'var(--cream-dim)' }}>min</span></p>
                </div>
              </div>
              {detail.description && (
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--cream-dim)', textTransform: 'uppercase', marginBottom: 8 }}>Descripción</p>
                  <p style={{ color: 'var(--cream)', fontSize: 14, lineHeight: 1.6 }}>{detail.description}</p>
                </div>
              )}
              <button onClick={() => { setDetail(null); openEdit(detail) }} style={{ width: '100%', marginTop: 22, padding: 13, borderRadius: 12, border: '1px solid var(--gold)', background: 'transparent', color: 'var(--gold)', fontWeight: 700, cursor: 'pointer' }}>Editar servicio</button>
            </div>
          </div>
        </div>
      )}

      {deleting && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="animate-fade-up" style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-4)', borderRadius: 16, padding: 30, maxWidth: 380, width: '100%', textAlign: 'center' }}>
            <div style={{ color: 'var(--gold)', display: 'flex', justifyContent: 'center', marginBottom: 12 }}>{Ic.trash({ width: 30, height: 30 })}</div>
            <h3 style={{ fontFamily: 'var(--font-display, Georgia, serif)', color: 'var(--cream)', fontSize: 19, marginBottom: 8 }}>¿Eliminar servicio?</h3>
            <p style={{ color: 'var(--cream-dim)', fontSize: 13, marginBottom: 24 }}>Esta acción no se puede deshacer.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setDeleting(null)} disabled={deleteBusy} style={{ flex: 1, padding: 11, borderRadius: 10, border: '1px solid var(--dark-4)', background: 'transparent', color: 'var(--cream-dim)', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={() => confirmDelete(deleting)} disabled={deleteBusy} style={{ flex: 1, padding: 11, borderRadius: 10, border: '1px solid #C97A7A', background: 'rgba(201,122,122,0.12)', color: '#D89090', fontWeight: 700, cursor: 'pointer', opacity: deleteBusy ? 0.6 : 1 }}>{deleteBusy ? 'Eliminando...' : 'Sí, eliminar'}</button>
            </div>
          </div>
        </div>
      )}

      <Footer />
      <HelpButton path={pathname} />
    </div>
  )
}