import { useState, useEffect, useMemo } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import HelpButton from '../components/HelpButton'
import api from '../services/api'
import { requiredError, lengthError, numberRangeError, hasErrors } from '../utils/validators'
import { useToast } from '../context/ToastContext'
import ImageUpload, { resolveImageSrc } from '../components/ImageUpload'
import { XIcon, TrashIcon } from '../components/Icons'
import ModuleHeader from '../components/ModuleHeader'
import IconButton from '../components/IconButton'
import RecordDetailModal from '../components/RecordDetailModal'
import InfoCard from '../components/InfoCard'

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

/* ── Íconos SVG (sin dependencias) ── */
const Icon = {
  plus: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 5v14M5 12h14"/></svg>,
  clock: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  scissors: (p) => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12"/></svg>,
}

export default function Services() {
  const toast = useToast()
  const [services, setServices] = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing]   = useState(null)
  const [saving, setSaving]     = useState(false)
  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [detail, setDetail]     = useState(null)
  const [touched, setTouched]   = useState({})
  const [form, setForm]         = useState({ name: '', duration_min: '', price: '', image_url: '', description: '' })
  const [search, setSearch]     = useState('')
  const [sort, setSort]         = useState('recientes')
  const [page, setPage]         = useState(1)

  const allErrors = validate(form)
  const errors = Object.keys(allErrors).reduce((acc, k) => { if (touched[k]) acc[k] = allErrors[k]; return acc }, {})

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

  const openCreate = () => {
    setEditing(null)
    setForm({ name: '', duration_min: '', price: '', image_url: '', description: '' })
    setTouched({})
    setShowForm(true)
  }

  const openEdit = (s) => {
    setEditing(s)
    setForm({
      name: s.name || '', duration_min: String(s.duration_min || ''), price: String(s.price || ''),
      image_url: s.image_url || '', description: s.description || '',
    })
    setTouched({})
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setTouched({ name: true, duration_min: true, price: true })
    if (hasErrors(allErrors)) return
    setSaving(true)
    const payload = {
      name: form.name.trim(),
      duration_min: parseInt(form.duration_min),
      price: parseFloat(form.price),
      image_url: form.image_url.trim() || null,
      description: form.description.trim() || null,
    }
    try {
      if (editing) {
        await api.put('/services/' + editing.id, payload)
        toast.success('Servicio actualizado')
      } else {
        await api.post('/services', payload)
        toast.success('Servicio agregado correctamente')
      }
      setShowForm(false)
      setEditing(null)
      setForm({ name: '', duration_min: '', price: '', image_url: '', description: '' })
      setTouched({})
      fetchServices()
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo guardar el servicio. Intenta de nuevo.')
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    let arr = !q ? [...services] : services.filter(s => (s.name || '').toLowerCase().includes(q) || (s.description || '').toLowerCase().includes(q))
    if (sort === 'precio_asc') arr.sort((a, b) => Number(a.price) - Number(b.price))
    else if (sort === 'precio_desc') arr.sort((a, b) => Number(b.price) - Number(a.price))
    else if (sort === 'nombre') arr.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    return arr
  }, [services, search, sort])

  useEffect(() => { setPage(1) }, [search, sort])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage   = Math.min(page, totalPages)
  const paginated  = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  const inpStyle = (name) => ({
    width: '100%', padding: '11px 14px', fontSize: 14,
    background: 'var(--surface-1)', color: 'var(--cream)',
    border: '1px solid ' + (errors[name] ? '#C97A7A' : 'var(--border-soft)'),
    borderRadius: 10, outline: 'none', fontFamily: 'var(--font-body)',
  })
  const labelStyle = { display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--cream-dim)', marginBottom: 6, letterSpacing: '0.02em' }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--dark)' }}>
      <Navbar />

      <div style={{ flex: 1, maxWidth: 1100, width: '100%', margin: '0 auto', padding: '32px 24px 60px' }}>
        <ModuleHeader
          kicker="Catálogo"
          title="Servicios"
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar servicio por nombre o descripción..."
          filters={
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              style={{ padding: '11px 14px', fontSize: 14, background: 'var(--surface-1)', color: 'var(--cream)', border: '1px solid var(--border-soft)', borderRadius: 10, outline: 'none', cursor: 'pointer' }}
            >
              <option value="recientes">Más recientes</option>
              <option value="precio_asc">Precio: menor a mayor</option>
              <option value="precio_desc">Precio: mayor a menor</option>
              <option value="nombre">Nombre (A-Z)</option>
            </select>
          }
          action={
            <button
              onClick={openCreate}
              className="btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '11px 20px', fontSize: 14, whiteSpace: 'nowrap' }}
            >
              {Icon.plus()} Nuevo servicio
            </button>
          }
        />

        {/* Listado */}
        {loading ? (
          <p style={{ color: 'var(--cream-dim)', textAlign: 'center', padding: 40 }}>Cargando servicios...</p>
        ) : paginated.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed var(--border-soft)', borderRadius: 16 }}>
            <div style={{ color: 'var(--gold)', opacity: 0.4, display: 'flex', justifyContent: 'center', marginBottom: 12 }}>{Icon.scissors()}</div>
            <p style={{ color: 'var(--cream-dim)', fontSize: 14 }}>
              {services.length === 0 ? 'Aún no tienes servicios. Crea el primero.' : 'Sin resultados para esa búsqueda.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
            {paginated.map(s => (
              <div key={s.id} style={{ background: 'var(--surface-1)', border: '1px solid var(--border-soft)', borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {/* Imagen o placeholder */}
                <div style={{ height: 150, background: 'var(--dark-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                  {resolveImageSrc(s.image_url) ? (
                    <img src={resolveImageSrc(s.image_url)} alt={s.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none' }} />
                  ) : (
                    <div style={{ color: 'var(--gold)', opacity: 0.3 }}>{Icon.scissors()}</div>
                  )}
                </div>
                {/* Info */}
                <div style={{ padding: 16, flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: 'var(--cream)', lineHeight: 1.2 }}>{s.name}</h3>
                    <span style={{ color: 'var(--gold)', fontWeight: 800, fontSize: 16, whiteSpace: 'nowrap' }}>{formatPrice(s.price)}</span>
                  </div>
                  <p style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--cream-dim)', fontSize: 13, marginTop: 6 }}>
                    {Icon.clock()} {s.duration_min} min
                  </p>
                  {s.description && (
                    <p style={{ color: 'var(--cream-dim)', fontSize: 13, marginTop: 8, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{s.description}</p>
                  )}
                  {/* Acciones */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 14 }}>
                    <IconButton variant="view" tooltip="Ver detalle" onClick={() => setDetail(s)} />
                    <IconButton variant="edit" tooltip="Editar" onClick={() => openEdit(s)} />
                    <IconButton variant="delete" tooltip="Eliminar" onClick={() => setDeleting(s.id)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 28 }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                style={{ width: 36, height: 36, borderRadius: 9, cursor: 'pointer', fontWeight: 700, fontSize: 14,
                  background: p === safePage ? 'var(--gold)' : 'var(--surface-1)',
                  color: p === safePage ? 'var(--dark)' : 'var(--cream-dim)',
                  border: '1px solid ' + (p === safePage ? 'var(--gold)' : 'var(--border-soft)') }}>
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ─────── Modal crear/editar ─────── */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="animate-fade-up" style={{ background: 'var(--dark-2)', borderRadius: 18, width: '100%', maxWidth: 520, maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid var(--border-soft)' }}>
            {/* Header */}
            <div style={{ background: 'var(--dark)', padding: '20px 26px', borderBottom: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: 'var(--gold)', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>{editing ? 'Editar' : 'Nuevo registro'}</p>
                <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 700, color: 'var(--cream)', marginTop: 2 }}>{editing ? 'Editar servicio' : 'Nuevo servicio'}</h2>
              </div>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', color: 'var(--cream-dim)', cursor: 'pointer', display: 'flex' }}><XIcon size={22} /></button>
            </div>

            {/* Cuerpo */}
            <form onSubmit={handleSubmit} style={{ padding: '24px 26px 26px', overflowY: 'auto' }}>
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>NOMBRE DEL SERVICIO</label>
                <input name="name" value={form.name} onChange={handleChange} placeholder="Ej: Corte clásico + barba" style={inpStyle('name')} />
                {errors.name && <p style={{ color: '#C97A7A', fontSize: 12, marginTop: 5 }}>{errors.name}</p>}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
                <div>
                  <label style={labelStyle}>DURACIÓN</label>
                  <div style={{ position: 'relative' }}>
                    <input name="duration_min" type="number" value={form.duration_min} onChange={handleChange} placeholder="30" style={{ ...inpStyle('duration_min'), paddingRight: 46 }} />
                    <span style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--cream-dim)', fontSize: 13, pointerEvents: 'none' }}>min</span>
                  </div>
                  {errors.duration_min && <p style={{ color: '#C97A7A', fontSize: 12, marginTop: 5 }}>{errors.duration_min}</p>}
                </div>
                <div>
                  <label style={labelStyle}>PRECIO</label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--cream-dim)', fontSize: 14, pointerEvents: 'none' }}>$</span>
                    <input name="price" type="number" value={form.price} onChange={handleChange} placeholder="15000" style={{ ...inpStyle('price'), paddingLeft: 26 }} />
                  </div>
                  {errors.price && <p style={{ color: '#C97A7A', fontSize: 12, marginTop: 5 }}>{errors.price}</p>}
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>DESCRIPCIÓN <span style={{ color: 'var(--cream-dim)', fontWeight: 400, textTransform: 'none' }}>(opcional)</span></label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={3} placeholder="Cuéntale al cliente qué incluye este servicio..." style={{ ...inpStyle('description'), resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }} />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={labelStyle}>IMAGEN DE REFERENCIA <span style={{ color: 'var(--cream-dim)', fontWeight: 400, textTransform: 'none' }}>(opcional)</span></label>
                <ImageUpload value={form.image_url} onChange={(url) => setForm(f => ({ ...f, image_url: url || '' }))} />
                <p style={{ fontSize: 11.5, color: 'var(--cream-dim)', marginTop: 8, lineHeight: 1.4 }}>Sube una foto del resultado o pega un enlace. Ayuda al cliente a saber qué esperar.</p>
              </div>

              <div style={{ display: 'flex', gap: 12, borderTop: '1px solid var(--border-soft)', paddingTop: 20 }}>
                <button type="button" onClick={() => setShowForm(false)} style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid var(--border-soft)', background: 'transparent', color: 'var(--cream-dim)', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={saving} style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', background: 'var(--gold)', color: 'var(--dark)', fontWeight: 700, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1 }}>
                  {saving ? 'Guardando...' : (editing ? 'Guardar cambios' : 'Crear servicio')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─────── Modal ver detalle ─────── */}
      {detail && (
        <RecordDetailModal
          onClose={() => setDetail(null)}
          kicker="Detalle del servicio"
          title={detail.name}
          image={resolveImageSrc(detail.image_url) || null}
          placeholderIcon={Icon.scissors({ width: 56, height: 56 })}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: detail.description ? 20 : 0 }}>
            <InfoCard label="Precio" value={formatPrice(detail.price)} />
            <InfoCard label="Duración" value={<>{detail.duration_min} <span style={{ fontSize: 13, color: 'var(--cream-dim)' }}>min</span></>} />
          </div>
          {detail.description && (
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--cream-dim)', textTransform: 'uppercase', marginBottom: 8 }}>Descripción</p>
              <p style={{ color: 'var(--cream)', fontSize: 14, lineHeight: 1.6 }}>{detail.description}</p>
            </div>
          )}
        </RecordDetailModal>
      )}

      {/* ─────── Confirmar eliminar ─────── */}
      {deleting && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="animate-fade-up" style={{ background: 'var(--dark-2)', border: '1px solid var(--border-soft)', borderRadius: 16, padding: 30, maxWidth: 360, width: '100%', textAlign: 'center' }}>
            <div style={{ color: 'var(--gold)', display: 'flex', justifyContent: 'center', marginBottom: 12 }}><TrashIcon size={30} /></div>
            <h3 style={{ fontFamily: 'var(--font-display)', color: 'var(--cream)', fontSize: 19, marginBottom: 8 }}>¿Eliminar servicio?</h3>
            <p style={{ color: 'var(--cream-dim)', fontSize: 13, marginBottom: 24 }}>Esta acción no se puede deshacer.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setDeleting(null)} disabled={deleteBusy} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1px solid var(--border-soft)', background: 'transparent', color: 'var(--cream-dim)', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
              <button onClick={() => confirmDelete(deleting)} disabled={deleteBusy} style={{ flex: 1, padding: '11px', borderRadius: 10, border: '1px solid #C97A7A', background: 'rgba(201,122,122,0.12)', color: '#D89090', fontWeight: 700, cursor: 'pointer', opacity: deleteBusy ? 0.6 : 1 }}>
                {deleteBusy ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
      <HelpButton />
    </div>
  )
}