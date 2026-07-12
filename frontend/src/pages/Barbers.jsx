import { useState, useEffect, useMemo } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import HelpButton from '../components/HelpButton'
import { useLocation } from 'react-router-dom'
import api from '../services/api'
import { requiredError, lengthError, combine } from '../utils/validators'
import { useToast } from '../context/ToastContext'
import ImageUpload, { resolveImageSrc } from '../components/ImageUpload'
import ModuleHeader from '../components/ModuleHeader'
import IconButton from '../components/IconButton'
import RecordDetailModal from '../components/RecordDetailModal'
import InfoCard from '../components/InfoCard'

const validateName = combine(
  v => requiredError(v, 'El nombre'),
  v => lengthError(v, { min: 2, max: 60, label: 'El nombre' })
)

const DAY_ABBR = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const DEFAULT_WORK_DAYS = [1, 2, 3, 4, 5, 6]

function parseWorkDays(value) {
  if (!value) return []
  return value.split(',').map(Number).filter(n => !Number.isNaN(n))
}

export default function Barbers() {
  const { pathname } = useLocation()
  const toast = useToast()
  const [barbers, setBarbers]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [name, setName]         = useState('')
  const [nameError, setNameError] = useState('')
  const [photoUrl, setPhotoUrl]   = useState('')
  const [specialty, setSpecialty] = useState('')
  const [workDays, setWorkDays]   = useState(DEFAULT_WORK_DAYS)
  const [saving, setSaving]     = useState(false)
  const [toggling, setToggling] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [photoErrors, setPhotoErrors] = useState({})
  const [search, setSearch] = useState('')
  const [detail, setDetail] = useState(null)

  useEffect(() => { fetchBarbers() }, [])

  const filteredBarbers = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return barbers
    return barbers.filter(b => (b.name || '').toLowerCase().includes(q) || (b.specialty || '').toLowerCase().includes(q))
  }, [barbers, search])

  const fetchBarbers = () => {
    setLoading(true)
    api.get('/barbers')
      .then(res => setBarbers(res.data.barbers))
      .catch(err => toast.error(err.response?.data?.error || 'No se pudieron cargar los barberos.'))
      .finally(() => setLoading(false))
  }

  const resetForm = () => {
    setEditingId(null)
    setName('')
    setNameError('')
    setPhotoUrl('')
    setSpecialty('')
    setWorkDays(DEFAULT_WORK_DAYS)
  }

  const openCreateForm = () => {
    resetForm()
    setShowForm(true)
  }

  const openEditForm = (barber) => {
    setEditingId(barber.id)
    setName(barber.name)
    setNameError('')
    setPhotoUrl(barber.photo_url || '')
    setSpecialty(barber.specialty || '')
    setWorkDays(barber.work_days ? parseWorkDays(barber.work_days) : DEFAULT_WORK_DAYS)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleDay = (day) => {
    setWorkDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort((a, b) => a - b))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const err = validateName(name)
    if (err) { setNameError(err); return }
    setSaving(true)
    try {
      const payload = {
        name: name.trim(),
        photo_url: photoUrl.trim() || null,
        specialty: specialty.trim() || null,
        work_days: workDays.slice().sort((a, b) => a - b).join(','),
      }
      if (editingId) {
        await api.put('/barbers/' + editingId, payload)
        toast.success('Barbero actualizado correctamente')
      } else {
        await api.post('/barbers', payload)
        toast.success('Barbero agregado correctamente')
      }
      resetForm()
      setShowForm(false)
      fetchBarbers()
    } catch (err) {
      toast.error(err.response?.data?.error || (editingId ? 'No se pudo actualizar el barbero. Intenta de nuevo.' : 'No se pudo crear el barbero. Intenta de nuevo.'))
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (barber) => {
    if (toggling) return
    setToggling(barber.id)
    try {
      await api.put('/barbers/' + barber.id, { active: !barber.active })
      fetchBarbers()
      toast.success(barber.active ? 'Barbero desactivado' : 'Barbero activado')
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo actualizar el barbero.')
    } finally {
      setToggling(null)
    }
  }

  const handleDelete = async (barber) => {
    setDeleting(barber.id)
  }

  const confirmDelete = async (id) => {
    if (deleteBusy) return
    setDeleteBusy(true)
    try {
      await api.delete('/barbers/' + id)
      fetchBarbers()
      toast.success('Barbero eliminado')
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo eliminar el barbero.')
    } finally {
      setDeleteBusy(false)
      setDeleting(null)
    }
  }

  const inputStyle = (hasError) => ({
    width: '100%', padding: '12px 16px',
    border: '1px solid ' + (hasError ? '#E8C97A' : 'var(--dark-4)'),
    boxShadow: hasError ? '0 0 0 2px rgba(232,201,122,0.15)' : 'none'
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', display: 'flex', flexDirection: 'column' }}>

      {/* Modal confirmar eliminar */}
      {deleting && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="animate-fade-up" style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-4)', borderRadius: 16, padding: 32, maxWidth: 360, width: '90%', textAlign: 'center' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>⚠</p>
            <h3 style={{ color: 'var(--cream)', fontSize: 18, marginBottom: 8 }}>¿Eliminar barbero?</h3>
            <p style={{ color: 'var(--cream-dim)', fontSize: 13, marginBottom: 24 }}>Esta acción no se puede deshacer. Las citas asociadas quedarán sin barbero asignado.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button onClick={() => setDeleting(null)} disabled={deleteBusy} className="btn-secondary">
                Cancelar
              </button>
              <button onClick={() => confirmDelete(deleting)} disabled={deleteBusy} className="btn-danger" style={{ opacity: deleteBusy ? 0.6 : 1 }}>
                {deleteBusy ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ver detalle */}
      {detail && (
        <RecordDetailModal
          onClose={() => setDetail(null)}
          kicker="Detalle del barbero"
          title={detail.name}
          image={resolveImageSrc(detail.photo_url) || null}
          placeholderIcon={<span style={{ fontSize: 56, fontWeight: 900, fontFamily: 'var(--font-display)' }}>{detail.name.charAt(0).toUpperCase()}</span>}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <InfoCard label="Estado" value={detail.active ? 'Activo' : 'Inactivo'} />
            <InfoCard label="Especialidad" value={detail.specialty || 'Sin especificar'} />
          </div>
          <div>
            <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--cream-dim)', textTransform: 'uppercase', marginBottom: 8 }}>Días que trabaja</p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {DAY_ABBR.map((label, day) => {
                const works = parseWorkDays(detail.work_days).includes(day)
                return (
                  <span key={day} style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.02em', padding: '5px 10px', borderRadius: 10, background: works ? 'rgba(201,168,76,0.15)' : 'var(--dark-3)', color: works ? 'var(--gold)' : 'var(--cream-dim)', opacity: works ? 1 : 0.4 }}>
                    {label}
                  </span>
                )
              })}
            </div>
          </div>
        </RecordDetailModal>
      )}

      <Navbar />
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px', flex: 1, width: '100%' }}>

        <ModuleHeader
          kicker="Equipo"
          title="Barberos"
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Buscar barbero por nombre o especialidad..."
          action={
            <button
              onClick={() => { if (showForm) { setShowForm(false); resetForm() } else { openCreateForm() } }}
              className="btn-primary" style={{ opacity: showForm ? 0.6 : 1 }}
            >
              {showForm ? 'CANCELAR' : '+ AGREGAR'}
            </button>
          }
        />

        {showForm && (
          <form onSubmit={handleSubmit} className="animate-fade-up" style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-4)', borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <p style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: '0.08em', fontWeight: 600, marginBottom: 16 }}>
              {editingId ? 'EDITAR BARBERO' : 'NUEVO BARBERO'}
            </p>
            <div style={{ marginBottom: 6 }}>
              <input
                value={name}
                onChange={e => { const v = e.target.value; setName(v); setNameError(validateName(v) || '') }}
                onBlur={() => setNameError(validateName(name) || '')}
                placeholder="Nombre completo del barbero"
                style={inputStyle(nameError)}
                autoFocus
              />
              {nameError && <p style={{ color: '#E8C97A', fontSize: 12, marginTop: 6 }}>⚠ {nameError}</p>}
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'block', fontSize: 11, letterSpacing: '0.07em', color: 'var(--cream-dim)', marginBottom: 6, fontWeight: 600 }}>ESPECIALIDAD <span style={{ opacity: 0.7 }}>(OPCIONAL)</span></label>
              <input
                value={specialty}
                onChange={e => setSpecialty(e.target.value.slice(0, 120))}
                placeholder="Ej: Fades y barba, 10 años de experiencia"
                maxLength={120}
                style={inputStyle(false)}
              />
              <p style={{ color: 'var(--cream-dim)', fontSize: 11, marginTop: 5, textAlign: 'right', opacity: 0.7 }}>{specialty.length}/120</p>
            </div>

            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'block', fontSize: 11, letterSpacing: '0.07em', color: 'var(--cream-dim)', marginBottom: 8, fontWeight: 600 }}>DÍAS QUE TRABAJA</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {DAY_ABBR.map((label, day) => {
                  const active = workDays.includes(day)
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      style={{
                        padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, letterSpacing: '0.03em',
                        border: '1px solid ' + (active ? 'var(--gold)' : 'var(--dark-4)'),
                        background: active ? 'var(--gold)' : 'transparent',
                        color: active ? 'var(--dark)' : 'var(--cream-dim)',
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
              {workDays.length === 0 && (
                <p style={{ color: '#E8C97A', fontSize: 12, marginTop: 8 }}>⚠ Selecciona al menos un día si el barbero va a atender citas.</p>
              )}
            </div>

            <div style={{ marginTop: 16 }}>
              <ImageUpload
                label="Foto de perfil (opcional)"
                value={photoUrl}
                onChange={setPhotoUrl}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button type="submit" disabled={saving || !!validateName(name)} className="btn-primary" style={{ opacity: (saving || !!validateName(name)) ? 0.6 : 1 }}>
                {saving ? 'GUARDANDO...' : editingId ? 'GUARDAR CAMBIOS' : 'GUARDAR'}
              </button>
              {editingId && (
                <button type="button" onClick={() => { setShowForm(false); resetForm() }} className="btn-secondary">
                  Cancelar
                </button>
              )}
            </div>
          </form>
        )}

        {loading ? (
          <div className="animate-fade-up delay-2" style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-4)', borderRadius: 12 }}>
            <p style={{ color: 'var(--cream-dim)', textAlign: 'center', padding: '48px 0', fontSize: 14 }}>Cargando...</p>
          </div>
        ) : filteredBarbers.length === 0 ? (
          <div className="animate-fade-up delay-2" style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-4)', borderRadius: 12, textAlign: 'center', padding: '56px 0' }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>◈</p>
            <p style={{ color: 'var(--cream-dim)', fontSize: 14 }}>
              {barbers.length === 0 ? 'No hay barberos. Agrega el primero.' : 'Sin resultados para esa búsqueda.'}
            </p>
          </div>
        ) : (
          <div className="animate-fade-up delay-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 14 }}>
            {filteredBarbers.map(barber => {
              const photoSrc = resolveImageSrc(barber.photo_url)
              const barberWorkDays = parseWorkDays(barber.work_days)
              return (
                <div key={barber.id} style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-4)', borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    {photoSrc && !photoErrors[barber.id] ? (
                      <img
                        src={photoSrc}
                        alt={barber.name}
                        onError={() => setPhotoErrors(prev => ({ ...prev, [barber.id]: true }))}
                        style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--dark-4)' }}
                      />
                    ) : (
                      <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, var(--gold-dim), var(--gold))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 900, color: 'var(--dark)', fontFamily: 'var(--font-display)', flexShrink: 0 }}>
                        {barber.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ color: 'var(--cream)', fontWeight: 600, fontSize: 15 }}>{barber.name}</p>
                      {barber.specialty && (
                        <p style={{ color: 'var(--cream-dim)', fontSize: 12, marginTop: 2, opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {barber.specialty}
                        </p>
                      )}
                    </div>

                    {/* Switch de estado — dorado activo, gris inactivo */}
                    <div
                      role="switch"
                      aria-checked={barber.active}
                      aria-label={barber.active ? `Desactivar a ${barber.name}` : `Activar a ${barber.name}`}
                      title={barber.active ? 'Activo — clic para desactivar' : 'Inactivo — clic para activar'}
                      onClick={() => toggling !== barber.id && handleToggle(barber)}
                      style={{ width: 40, height: 22, borderRadius: 11, background: barber.active ? 'var(--gold)' : 'var(--dark-4)', cursor: toggling === barber.id ? 'not-allowed' : 'pointer', position: 'relative', flexShrink: 0, opacity: toggling === barber.id ? 0.5 : 1, transition: 'background 0.2s' }}
                    >
                      <div style={{ position: 'absolute', top: 2, left: barber.active ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: barber.active ? 'var(--dark)' : 'var(--cream-dim)', transition: 'left 0.2s' }} />
                    </div>
                  </div>

                  {/* Días que trabaja */}
                  {barberWorkDays.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                      {DAY_ABBR.map((label, day) => {
                        const works = barberWorkDays.includes(day)
                        return (
                          <span
                            key={day}
                            style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.02em', padding: '3px 7px', borderRadius: 10, background: works ? 'rgba(201,168,76,0.15)' : 'var(--dark-3)', color: works ? 'var(--gold)' : 'var(--cream-dim)', opacity: works ? 1 : 0.4 }}
                          >
                            {label}
                          </span>
                        )
                      })}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8 }}>
                    <IconButton variant="view" tooltip="Ver detalle" onClick={() => setDetail(barber)} />
                    <IconButton variant="edit" tooltip="Editar" onClick={() => openEditForm(barber)} />
                    <IconButton variant="delete" tooltip="Eliminar" onClick={() => handleDelete(barber)} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
      <Footer />
      <HelpButton path={pathname} />
    </div>
  )
}
