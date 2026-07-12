import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import HelpButton from '../components/HelpButton'
import { useLocation } from 'react-router-dom'
import api from '../services/api'
import { requiredError, lengthError, combine } from '../utils/validators'
import { useToast } from '../context/ToastContext'
import ImageUpload, { resolveImageSrc } from '../components/ImageUpload'

const validateName = combine(
  v => requiredError(v, 'El nombre'),
  v => lengthError(v, { min: 2, max: 60, label: 'El nombre' })
)

export default function Barbers() {
  const { pathname } = useLocation()
  const toast = useToast()
  const [barbers, setBarbers]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName]         = useState('')
  const [nameError, setNameError] = useState('')
  const [photoUrl, setPhotoUrl]   = useState('')
  const [specialty, setSpecialty] = useState('')
  const [saving, setSaving]     = useState(false)
  const [toggling, setToggling] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)
  const [photoErrors, setPhotoErrors] = useState({})

  useEffect(() => { fetchBarbers() }, [])

  const fetchBarbers = () => {
    setLoading(true)
    api.get('/barbers')
      .then(res => setBarbers(res.data.barbers))
      .catch(err => toast.error(err.response?.data?.error || 'No se pudieron cargar los barberos.'))
      .finally(() => setLoading(false))
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    const err = validateName(name)
    if (err) { setNameError(err); return }
    setSaving(true)
    try {
      await api.post('/barbers', {
        name: name.trim(),
        photo_url: photoUrl.trim() || null,
        specialty: specialty.trim() || null,
      })
      setName('')
      setPhotoUrl('')
      setSpecialty('')
      setShowForm(false)
      fetchBarbers()
      toast.success('Barbero agregado correctamente')
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo crear el barbero. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const handleToggle = async (barber) => {
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
    border: '1px solid ' + (hasError ? '#E05252' : 'var(--dark-4)'),
    boxShadow: hasError ? '0 0 0 2px rgba(224,82,82,0.15)' : 'none'
  })

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)' }}>

      {/* Modal confirmar eliminar */}
      {deleting && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="animate-fade-up" style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-4)', borderRadius: 16, padding: 32, maxWidth: 360, width: '90%', textAlign: 'center' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>⚠</p>
            <h3 style={{ color: 'var(--cream)', fontSize: 18, marginBottom: 8 }}>¿Eliminar barbero?</h3>
            <p style={{ color: 'var(--cream-dim)', fontSize: 13, marginBottom: 24 }}>Esta acción no se puede deshacer. Solo puedes eliminar barberos que no tengan citas asociadas.</p>
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

      <Navbar />
      <main style={{ maxWidth: 800, margin: '0 auto', padding: '40px 24px' }}>

        <div className="animate-fade-up" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <p style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: '0.1em', fontWeight: 600, marginBottom: 4 }}>EQUIPO</p>
            <h1 style={{ fontSize: 36, fontWeight: 900, color: 'var(--cream)' }}>Barberos</h1>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setName(''); setNameError(''); setPhotoUrl(''); setSpecialty('') }}
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

            <div style={{ marginTop: 6 }}>
              <ImageUpload
                label="Foto de perfil (opcional)"
                value={photoUrl}
                onChange={setPhotoUrl}
              />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button type="submit" disabled={saving || !!validateName(name)} className="btn-primary" style={{ opacity: (saving || !!validateName(name)) ? 0.6 : 1 }}>
                {saving ? 'GUARDANDO...' : 'GUARDAR'}
              </button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="animate-fade-up delay-2" style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-4)', borderRadius: 12 }}>
            <p style={{ color: 'var(--cream-dim)', textAlign: 'center', padding: '48px 0', fontSize: 14 }}>Cargando...</p>
          </div>
        ) : barbers.length === 0 ? (
          <div className="animate-fade-up delay-2" style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-4)', borderRadius: 12, textAlign: 'center', padding: '56px 0' }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>◈</p>
            <p style={{ color: 'var(--cream-dim)', fontSize: 14 }}>No hay barberos. Agrega el primero.</p>
          </div>
        ) : (
          <div className="animate-fade-up delay-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
            {barbers.map(barber => {
              const photoSrc = resolveImageSrc(barber.photo_url)
              return (
                <div key={barber.id} style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-4)', borderRadius: 14, padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    {photoSrc && !photoErrors[barber.id] ? (
                      <img
                        src={photoSrc}
                        alt={barber.name}
                        onError={() => setPhotoErrors(prev => ({ ...prev, [barber.id]: true }))}
                        style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '1px solid var(--dark-4)' }}
                      />
                    ) : (
                      <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg, var(--gold-dim), var(--gold))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 900, color: 'var(--dark)', fontFamily: 'Playfair Display', flexShrink: 0 }}>
                        {barber.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div style={{ minWidth: 0 }}>
                      <p style={{ color: 'var(--cream)', fontWeight: 600, fontSize: 15 }}>{barber.name}</p>
                      {barber.specialty && (
                        <p style={{ color: 'var(--cream-dim)', fontSize: 12, marginTop: 2, opacity: 0.8, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                          {barber.specialty}
                        </p>
                      )}
                      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: barber.active ? 'var(--success)' : 'var(--cream-dim)', marginTop: 4 }}>
                        {barber.active ? '● ACTIVO' : '○ INACTIVO'}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={() => handleToggle(barber)}
                      disabled={toggling === barber.id}
                      style={{ flex: 1, background: 'var(--dark-3)', border: '1px solid var(--dark-4)', color: 'var(--cream-dim)', padding: '7px 0', borderRadius: 6, cursor: toggling === barber.id ? 'not-allowed' : 'pointer', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', fontFamily: 'DM Sans', opacity: toggling === barber.id ? 0.6 : 1 }}
                    >
                      {toggling === barber.id ? '...' : barber.active ? 'DESACTIVAR' : 'ACTIVAR'}
                    </button>
                    <button onClick={() => handleDelete(barber)} className="btn-danger" style={{ flex: 1 }}>
                      ELIMINAR
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      <Footer />
      </main>
      <HelpButton path={pathname} />
    </div>
  )
}