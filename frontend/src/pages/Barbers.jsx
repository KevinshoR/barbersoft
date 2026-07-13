import { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import HelpButton from '../components/HelpButton'
import api from '../services/api'
import { useToast } from '../context/ToastContext'
import ImageUpload, { resolveImageSrc } from '../components/ImageUpload'

const DIAS = [
  { n: 1, corto: 'Lun' }, { n: 2, corto: 'Mar' }, { n: 3, corto: 'Mié' },
  { n: 4, corto: 'Jue' }, { n: 5, corto: 'Vie' }, { n: 6, corto: 'Sáb' }, { n: 0, corto: 'Dom' },
]
const parseDays = (str) => (str ? String(str).split(',').filter(x => x !== '').map(Number) : [])

const Ic = {
  search: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  plus: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 5v14M5 12h14"/></svg>,
  eye: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>,
  pencil: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>,
  trash: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6"/></svg>,
  back: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M19 12H5M12 19l-7-7 7-7"/></svg>,
  x: (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M18 6 6 18M6 6l12 12"/></svg>,
  scissors: (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12"/></svg>,
}

function Avatar({ src, name, size = 52 }) {
  const initial = (name || '?').charAt(0).toUpperCase()
  return src ? (
    <img src={src} alt={name} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid var(--dark-4)' }} onError={(e) => { e.target.style.display = 'none' }} />
  ) : (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, var(--gold-dim) 0%, var(--dark-3) 100%)', border: '2px solid rgba(201,168,76,0.3)', color: 'var(--gold-light)', fontFamily: 'var(--font-display, Georgia, serif)', fontWeight: 800, fontSize: size * 0.4 }}>{initial}</div>
  )
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

function Switch({ on, onClick, busy }) {
  return (
    <div onClick={busy ? undefined : onClick} style={{ width: 46, height: 26, borderRadius: 14, background: on ? 'var(--gold)' : 'var(--dark-4)', cursor: busy ? 'wait' : 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0, opacity: busy ? 0.6 : 1 }}>
      <div style={{ position: 'absolute', top: 3, left: on ? 23 : 3, width: 20, height: 20, borderRadius: '50%', background: on ? 'var(--dark)' : 'var(--cream-dim)', transition: 'left 0.2s' }} />
    </div>
  )
}

const lbl = { display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--cream-dim)', marginBottom: 8 }
const optLbl = { color: 'var(--cream-dim)', fontWeight: 400, letterSpacing: 0, textTransform: 'none' }
const input = { width: '100%', padding: '12px 15px', fontSize: 14, background: 'var(--surface-1)', color: 'var(--cream)', border: '1px solid var(--dark-4)', borderRadius: 10, outline: 'none' }

export default function Barbers() {
  const { pathname } = useLocation()
  const toast = useToast()
  const [barbers, setBarbers] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('list')
  const [editing, setEditing] = useState(null)
  const [detail, setDetail] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [toggling, setToggling] = useState(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [name, setName] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [specialty, setSpecialty] = useState('')
  const [workDays, setWorkDays] = useState([1, 2, 3, 4, 5, 6])
  const [nameError, setNameError] = useState('')

  useEffect(() => { fetchBarbers() }, [])
  const fetchBarbers = () => {
    setLoading(true)
    api.get('/barbers').then(res => setBarbers(res.data.barbers))
      .catch(err => toast.error(err.response?.data?.error || 'No se pudieron cargar los barberos.'))
      .finally(() => setLoading(false))
  }
  const openCreate = () => { setEditing(null); setName(''); setPhotoUrl(''); setSpecialty(''); setWorkDays([1,2,3,4,5,6]); setNameError(''); setView('form') }
  const openEdit = (b) => { setEditing(b); setName(b.name || ''); setPhotoUrl(b.photo_url || ''); setSpecialty(b.specialty || ''); setWorkDays(b.work_days ? parseDays(b.work_days) : [1,2,3,4,5,6]); setNameError(''); setView('form') }
  const toggleDay = (n) => setWorkDays(prev => prev.includes(n) ? prev.filter(d => d !== n) : [...prev, n])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim() || name.trim().length < 2) { setNameError('El nombre debe tener al menos 2 caracteres'); return }
    setSaving(true)
    const payload = { name: name.trim(), photo_url: photoUrl.trim() || null, specialty: specialty.trim() || null, work_days: workDays.sort((a,b)=>a-b).join(',') }
    try {
      if (editing) { await api.put('/barbers/' + editing.id, payload); toast.success('Barbero actualizado') }
      else { await api.post('/barbers', payload); toast.success('Barbero agregado correctamente') }
      setView('list'); fetchBarbers()
    } catch (err) { toast.error(err.response?.data?.error || 'No se pudo guardar el barbero. Intenta de nuevo.') }
    finally { setSaving(false) }
  }
  const handleToggle = async (b) => {
    setToggling(b.id)
    try { await api.put('/barbers/' + b.id, { active: !b.active }); fetchBarbers(); toast.success(b.active ? 'Barbero desactivado' : 'Barbero activado') }
    catch (err) { toast.error(err.response?.data?.error || 'No se pudo actualizar el barbero.') }
    finally { setToggling(null) }
  }
  const confirmDelete = async (id) => {
    if (deleteBusy) return
    setDeleteBusy(true)
    try { await api.delete('/barbers/' + id); fetchBarbers(); toast.success('Barbero eliminado') }
    catch (err) { toast.error(err.response?.data?.error || 'No se pudo eliminar el barbero.') }
    finally { setDeleteBusy(false); setDeleting(null) }
  }
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return barbers
    return barbers.filter(b => (b.name || '').toLowerCase().includes(q) || (b.specialty || '').toLowerCase().includes(q))
  }, [barbers, search])

  if (view === 'form') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--dark)', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main style={{ maxWidth: 720, margin: '0 auto', padding: '32px 24px 60px', flex: 1, width: '100%' }}>
          <button onClick={() => setView('list')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: 'var(--cream-dim)', cursor: 'pointer', fontSize: 13, fontWeight: 600, marginBottom: 24 }}>{Ic.back()} Volver a barberos</button>
          <p style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: '0.12em', fontWeight: 700, textTransform: 'uppercase' }}>{editing ? 'Editar' : 'Nuevo'}</p>
          <h1 style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: 34, fontWeight: 800, color: 'var(--cream)', marginTop: 4, marginBottom: 28 }}>{editing ? 'Editar barbero' : 'Nuevo barbero'}</h1>
          <form onSubmit={handleSubmit}>
            <div style={{ background: 'linear-gradient(135deg, var(--dark-2) 0%, var(--dark-3) 100%)', border: '1px solid var(--dark-4)', borderRadius: 16, padding: 26, marginBottom: 20, boxShadow: '0 4px 24px rgba(0,0,0,0.3)' }}>
              <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 22 }}>
                <Avatar src={resolveImageSrc(photoUrl)} name={name} size={72} />
                <div style={{ flex: 1 }}>
                  <label style={lbl}>NOMBRE DEL BARBERO</label>
                  <input value={name} onChange={(e) => { setName(e.target.value); setNameError('') }} placeholder="Ej: Carlos Ramírez" style={{ ...input, border: '1px solid ' + (nameError ? '#C97A7A' : 'var(--dark-4)') }} />
                  {nameError && <p style={{ color: '#C97A7A', fontSize: 12, marginTop: 5 }}>{nameError}</p>}
                </div>
              </div>
              <div>
                <label style={lbl}>ESPECIALIDAD <span style={optLbl}>(opcional)</span></label>
                <input value={specialty} maxLength={120} onChange={(e) => setSpecialty(e.target.value)} placeholder="Ej: Fades y diseño de barba · 8 años de experiencia" style={input} />
                <p style={{ color: 'var(--cream-dim)', fontSize: 11, marginTop: 5, textAlign: 'right', opacity: 0.6 }}>{specialty.length}/120</p>
              </div>
            </div>
            <div style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-4)', borderRadius: 16, padding: 26, marginBottom: 20 }}>
              <label style={{ ...lbl, marginBottom: 14 }}>DÍAS QUE TRABAJA</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {DIAS.map(d => {
                  const on = workDays.includes(d.n)
                  return <button type="button" key={d.n} onClick={() => toggleDay(d.n)} style={{ padding: '10px 18px', borderRadius: 10, cursor: 'pointer', fontWeight: 700, fontSize: 13, background: on ? 'var(--gold)' : 'transparent', color: on ? 'var(--dark)' : 'var(--cream-dim)', border: '1px solid ' + (on ? 'var(--gold)' : 'var(--dark-4)'), transition: 'all 0.15s' }}>{d.corto}</button>
                })}
              </div>
              <p style={{ color: 'var(--cream-dim)', fontSize: 12, marginTop: 12, lineHeight: 1.4 }}>Los clientes solo podrán reservar con este barbero en los días marcados.</p>
            </div>
            <div style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-4)', borderRadius: 16, padding: 26, marginBottom: 26 }}>
              <label style={{ ...lbl, marginBottom: 12 }}>FOTO DE PERFIL <span style={optLbl}>(opcional)</span></label>
              <ImageUpload value={photoUrl} onChange={(url) => setPhotoUrl(url || '')} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="button" onClick={() => setView('list')} style={{ flex: 1, padding: 14, borderRadius: 12, border: '1px solid var(--dark-4)', background: 'transparent', color: 'var(--cream-dim)', fontWeight: 600, cursor: 'pointer' }}>Cancelar</button>
              <button type="submit" disabled={saving} style={{ flex: 2, padding: 14, borderRadius: 12, border: 'none', background: 'var(--gold)', color: 'var(--dark)', fontWeight: 700, cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.6 : 1, boxShadow: '0 4px 16px rgba(201,168,76,0.25)' }}>{saving ? 'Guardando...' : (editing ? 'Guardar cambios' : 'Crear barbero')}</button>
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
        <p style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: '0.12em', fontWeight: 700, textTransform: 'uppercase' }}>Tu equipo</p>
        <h1 style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: 34, fontWeight: 800, color: 'var(--cream)', marginTop: 4, marginBottom: 24 }}>Barberos</h1>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--cream-dim)', display: 'flex' }}>{Ic.search()}</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o especialidad..." style={{ width: '100%', padding: '12px 14px 12px 42px', background: 'var(--surface-1)', color: 'var(--cream)', border: '1px solid var(--dark-4)', borderRadius: 12, outline: 'none', fontSize: 14 }} />
          </div>
          <button onClick={openCreate} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'var(--gold)', color: 'var(--dark)', fontWeight: 700, fontSize: 14, padding: '12px 22px', border: 'none', borderRadius: 12, cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 4px 16px rgba(201,168,76,0.25)' }}>{Ic.plus()} Nuevo barbero</button>
        </div>
        {loading ? (
          <p style={{ color: 'var(--cream-dim)', textAlign: 'center', padding: 50 }}>Cargando...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', border: '1px dashed var(--dark-4)', borderRadius: 16 }}>
            <div style={{ color: 'var(--gold)', opacity: 0.4, display: 'flex', justifyContent: 'center', marginBottom: 12 }}>{Ic.scissors()}</div>
            <p style={{ color: 'var(--cream-dim)', fontSize: 14 }}>{barbers.length === 0 ? 'Aún no tienes barberos. Agrega el primero.' : 'Sin resultados.'}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(b => {
              const dias = parseDays(b.work_days)
              return (
                <div key={b.id} style={{ background: 'linear-gradient(135deg, var(--dark-2) 0%, rgba(31,31,31,0.6) 100%)', border: '1px solid var(--dark-4)', borderRadius: 14, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.25)', opacity: b.active ? 1 : 0.6, transition: 'all 0.2s' }}>
                  <Avatar src={resolveImageSrc(b.photo_url)} name={b.name} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <p style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: 17, fontWeight: 700, color: 'var(--cream)' }}>{b.name}</p>
                      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', padding: '3px 8px', borderRadius: 20, background: b.active ? 'rgba(201,168,76,0.15)' : 'var(--dark-4)', color: b.active ? 'var(--gold)' : 'var(--cream-dim)' }}>{b.active ? 'ACTIVO' : 'INACTIVO'}</span>
                    </div>
                    {b.specialty && <p style={{ color: 'var(--cream-dim)', fontSize: 13, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.specialty}</p>}
                    {dias.length > 0 && (
                      <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                        {DIAS.filter(d => dias.includes(d.n)).map(d => <span key={d.n} style={{ fontSize: 10, fontWeight: 600, color: 'var(--gold-light)', background: 'rgba(201,168,76,0.1)', padding: '2px 7px', borderRadius: 5 }}>{d.corto}</span>)}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <Switch on={b.active} busy={toggling === b.id} onClick={() => handleToggle(b)} />
                    <IconBtn icon={Ic.eye()} tooltip="Ver detalle" onClick={() => setDetail(b)} />
                    <IconBtn icon={Ic.pencil()} tooltip="Editar" onClick={() => openEdit(b)} />
                    <IconBtn icon={Ic.trash()} tooltip="Eliminar" danger onClick={() => setDeleting(b.id)} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {detail && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="animate-fade-up" style={{ background: 'var(--dark-2)', borderRadius: 18, width: '100%', maxWidth: 440, overflow: 'hidden', border: '1px solid var(--dark-4)', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ background: 'linear-gradient(135deg, var(--gold-dim) 0%, var(--dark) 130%)', padding: '32px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
              <button onClick={() => setDetail(null)} style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(0,0,0,0.4)', border: 'none', color: 'var(--cream)', cursor: 'pointer', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{Ic.x()}</button>
              <Avatar src={resolveImageSrc(detail.photo_url)} name={detail.name} size={96} />
              <h2 style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: 24, fontWeight: 800, color: '#fff', marginTop: 14 }}>{detail.name}</h2>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', padding: '4px 12px', borderRadius: 20, background: detail.active ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)', color: '#fff', marginTop: 8 }}>{detail.active ? 'ACTIVO' : 'INACTIVO'}</span>
            </div>
            <div style={{ padding: 26 }}>
              {detail.specialty && (
                <div style={{ marginBottom: 20 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--cream-dim)', textTransform: 'uppercase', marginBottom: 6 }}>Especialidad</p>
                  <p style={{ color: 'var(--cream)', fontSize: 14, lineHeight: 1.5 }}>{detail.specialty}</p>
                </div>
              )}
              <div>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--cream-dim)', textTransform: 'uppercase', marginBottom: 8 }}>Días que trabaja</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {DIAS.map(d => {
                    const on = parseDays(detail.work_days).includes(d.n)
                    return <span key={d.n} style={{ fontSize: 12, fontWeight: 600, padding: '6px 12px', borderRadius: 8, background: on ? 'rgba(201,168,76,0.15)' : 'var(--dark-3)', color: on ? 'var(--gold)' : 'var(--dark-4)', border: '1px solid ' + (on ? 'rgba(201,168,76,0.3)' : 'transparent') }}>{d.corto}</span>
                  })}
                </div>
              </div>
              <button onClick={() => { setDetail(null); openEdit(detail) }} style={{ width: '100%', marginTop: 24, padding: 13, borderRadius: 12, border: '1px solid var(--gold)', background: 'transparent', color: 'var(--gold)', fontWeight: 700, cursor: 'pointer' }}>Editar barbero</button>
            </div>
          </div>
        </div>
      )}

      {deleting && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 110, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="animate-fade-up" style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-4)', borderRadius: 16, padding: 30, maxWidth: 380, width: '100%', textAlign: 'center' }}>
            <div style={{ color: 'var(--gold)', display: 'flex', justifyContent: 'center', marginBottom: 12 }}>{Ic.trash({ width: 30, height: 30 })}</div>
            <h3 style={{ fontFamily: 'var(--font-display, Georgia, serif)', color: 'var(--cream)', fontSize: 19, marginBottom: 8 }}>¿Eliminar barbero?</h3>
            <p style={{ color: 'var(--cream-dim)', fontSize: 13, marginBottom: 24 }}>Esta acción no se puede deshacer. Solo puedes eliminar barberos que no tengan citas asociadas.</p>
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