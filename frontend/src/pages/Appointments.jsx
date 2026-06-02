import { useState, useEffect, useRef } from 'react'
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
    <div className="animate-fade-up" style={{ position:'fixed', top:24, right:24, zIndex:999, background:c.bg, border:'1px solid '+c.border, color:c.color, borderRadius:10, padding:'14px 20px', fontSize:13, fontWeight:600, display:'flex', alignItems:'center', gap:10, minWidth:260, boxShadow:'0 8px 32px rgba(0,0,0,0.4)' }}>
      <span>{c.icon}</span>{message}
      <button onClick={onClose} style={{ marginLeft:'auto', background:'none', border:'none', color:'inherit', cursor:'pointer', fontSize:16, opacity:0.6 }}>×</button>
    </div>
  )
}

function validate(form) {
  const errors = {}
if (!form.scheduled_at) {
  errors.scheduled_at = 'La fecha y hora son obligatorias'
} else {
  const selected = new Date(form.scheduled_at)
  const minDate  = new Date(Date.now() + 30 * 60 * 1000)        // 30 min desde ahora
  const maxDate  = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 1 mes
  if (selected < minDate) errors.scheduled_at = 'La cita debe ser al menos 30 minutos desde ahora'
  if (selected > maxDate) errors.scheduled_at = 'La cita no puede ser a más de 1 mes de distancia'
}
  return errors
}

const STATUS_CONFIG = {
  pending:   { label:'Pendiente',  color:'#C9A84C', bg:'rgba(201,168,76,0.12)',  dot:'#C9A84C' },
  confirmed: { label:'Confirmada', color:'#B8B0A0', bg:'rgba(184,176,160,0.12)', dot:'#B8B0A0' },
  done:      { label:'Completada', color:'#4CAF7D', bg:'rgba(76,175,125,0.12)',  dot:'#4CAF7D' },
  cancelled: { label:'Cancelada',  color:'#E05252', bg:'rgba(224,82,82,0.12)',   dot:'#E05252' },
}

const TRANSITIONS = {
  pending:   ['confirmed', 'done', 'cancelled'],
  confirmed: ['done', 'cancelled'],
  done:      [],
  cancelled: [],
}

const PAGE_SIZE = 5

function StatusSelector({ status, onUpdate }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const current = STATUS_CONFIG[status]
  const options = TRANSITIONS[status]

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    // Usar capture para cerrar antes de que otros elementos lo intercepten
    document.addEventListener('mousedown', handler, true)
    return () => document.removeEventListener('mousedown', handler, true)
  }, [])

  if (options.length === 0) {
    return (
      <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:current.bg, border:'1px solid '+current.color+'33', borderRadius:20, padding:'5px 12px' }}>
        <div style={{ width:6, height:6, borderRadius:'50%', background:current.dot }} />
        <span style={{ color:current.color, fontSize:11, fontWeight:700, letterSpacing:'0.06em' }}>{current.label.toUpperCase()}</span>
      </div>
    )
  }

  return (
    <div ref={ref} style={{ position:'relative', display:'inline-block', zIndex:50 }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(prev => !prev) }}
        style={{ display:'inline-flex', alignItems:'center', gap:6, background:current.bg, border:'1px solid '+current.color+'44', borderRadius:20, padding:'5px 12px', cursor:'pointer', transition:'all 0.2s' }}
      >
        <div style={{ width:6, height:6, borderRadius:'50%', background:current.dot }} />
        <span style={{ color:current.color, fontSize:11, fontWeight:700, letterSpacing:'0.06em' }}>{current.label.toUpperCase()}</span>
        <span style={{ color:current.color, fontSize:9, opacity:0.7 }}>▾</span>
      </button>

      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, background:'#1F1F1F', border:'1px solid #2A2A2A', borderRadius:10, padding:6, zIndex:999, minWidth:160, boxShadow:'0 8px 32px rgba(0,0,0,0.7)' }}>
          {options.map(opt => {
            const cfg = STATUS_CONFIG[opt]
            return (
              <button
                key={opt}
                onClick={(e) => { e.stopPropagation(); onUpdate(opt); setOpen(false) }}
                style={{ display:'flex', alignItems:'center', gap:8, width:'100%', background:'transparent', border:'none', padding:'8px 12px', borderRadius:7, cursor:'pointer', transition:'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background='#2A2A2A'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}
              >
                <div style={{ width:6, height:6, borderRadius:'50%', background:cfg.dot, flexShrink:0 }} />
                <span style={{ color:cfg.color, fontSize:12, fontWeight:600 }}>{cfg.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

const formatTime  = (d) => new Date(d).toLocaleTimeString('es-CO', { hour:'2-digit', minute:'2-digit' })
const formatDate  = (d) => new Date(d).toLocaleDateString('es-CO', { weekday:'short', day:'numeric', month:'short' })
const formatPrice = (p) => new Intl.NumberFormat('es-CO', { style:'currency', currency:'COP', minimumFractionDigits:0 }).format(p)

export default function Appointments() {
  const { pathname } = useLocation()
  const [appointments, setAppointments] = useState([])
  const [barbers, setBarbers]           = useState([])
  const [services, setServices]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [showForm, setShowForm]         = useState(false)
  const [saving, setSaving]             = useState(false)
  const [toast, setToast]               = useState(null)
  const [deleting, setDeleting]         = useState(null)
  const [errors, setErrors]             = useState({})
  const [filterDate, setFilterDate]     = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage]                 = useState(1)
  const [form, setForm] = useState({
    barber_id:'', service_id:'', client_name:'',
    client_phone:'', client_email:'', scheduled_at:'', notes:''
  })

  useEffect(() => {
    Promise.all([api.get('/barbers'), api.get('/services')])
      .then(([b, s]) => { setBarbers(b.data.barbers); setServices(s.data.services) })
      .catch(console.error)
  }, [])

  useEffect(() => { fetchAppointments() }, [])

  const showToast = (message, type = 'success') => setToast({ message, type })

  const fetchAppointments = () => {
    setLoading(true)
    api.get('/appointments')
      .then(res => setAppointments(res.data.appointments))
      .catch(() => showToast('Error cargando citas', 'error'))
      .finally(() => setLoading(false))
  }

  // Filtros en el frontend
  const filtered = appointments.filter(a => {
    const matchDate   = filterDate   ? new Date(a.scheduled_at).toISOString().split('T')[0] === filterDate : true
    const matchStatus = filterStatus ? a.status === filterStatus : true
    return matchDate && matchStatus
  })

  // Paginación
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Reset página cuando cambia filtro
  useEffect(() => { setPage(1) }, [filterDate, filterStatus])

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErrors({ ...errors, [e.target.name]: '' })
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    const errs = validate(form)
    if (Object.keys(errs).length) { setErrors(errs); return }
    setSaving(true)
    try {
      await api.post('/appointments', {
        ...form,
        barber_id:  parseInt(form.barber_id),
        service_id: parseInt(form.service_id),
      })
      setForm({ barber_id:'', service_id:'', client_name:'', client_phone:'', client_email:'', scheduled_at:'', notes:'' })
      setShowForm(false)
      fetchAppointments()
      showToast('Cita creada correctamente')
    } catch (err) {
      showToast(err.response?.data?.error || 'Error creando cita', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleStatus = async (id, status) => {
    try {
      await api.patch('/appointments/' + id, { status })
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a))
      const msg = { confirmed:'Cita confirmada', done:'Cita completada', cancelled:'Cita cancelada' }
      showToast(msg[status] || 'Estado actualizado')
    } catch {
      showToast('Error actualizando estado', 'error')
    }
  }

  const confirmDelete = async (id) => {
    try {
      await api.delete('/appointments/' + id)
      fetchAppointments()
      showToast('Cita eliminada')
    } catch {
      showToast('Error eliminando cita', 'error')
    } finally {
      setDeleting(null)
    }
  }

  const inp = (name) => ({
    width:'100%', padding:'12px 16px',
    border:'1px solid ' + (errors[name] ? '#E05252' : 'var(--dark-4)'),
    boxShadow: errors[name] ? '0 0 0 2px rgba(224,82,82,0.15)' : 'none'
  })

  const selectedService = services.find(s => s.id === parseInt(form.service_id))

  return (
    <div style={{ minHeight:'100vh', background:'var(--dark)' }}>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Modal eliminar */}
      {deleting && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div className="animate-fade-up" style={{ background:'var(--dark-2)', border:'1px solid var(--dark-4)', borderRadius:16, padding:32, maxWidth:360, width:'90%', textAlign:'center' }}>
            <p style={{ fontSize:32, marginBottom:12 }}>⚠</p>
            <h3 style={{ color:'var(--cream)', fontSize:18, marginBottom:8 }}>¿Eliminar esta cita?</h3>
            <p style={{ color:'var(--cream-dim)', fontSize:13, marginBottom:24 }}>Esta acción no se puede deshacer.</p>
            <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
              <button onClick={() => setDeleting(null)} className="btn-secondary">Cancelar</button>
              <button onClick={() => confirmDelete(deleting)} className="btn-danger">Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      <Navbar />
      <main style={{ maxWidth:900, margin:'0 auto', padding:'40px 24px' }}>

        {/* Header */}
        <div className="animate-fade-up" style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:32 }}>
          <div>
            <p style={{ color:'var(--gold)', fontSize:11, letterSpacing:'0.1em', fontWeight:600, marginBottom:4 }}>AGENDA</p>
            <h1 style={{ fontSize:36, fontWeight:900, color:'var(--cream)' }}>Citas</h1>
            <p style={{ color:'var(--cream-dim)', fontSize:13, marginTop:4 }}>
              {appointments.length} en total · {filtered.length} con filtros
            </p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setErrors({}) }}
            className="btn-primary"
            style={{ opacity: showForm ? 0.7 : 1 }}
          >
            {showForm ? 'CANCELAR' : '+ NUEVA CITA'}
          </button>
        </div>

        {/* Filtros */}
        <div className="animate-fade-up delay-1" style={{ background:'var(--dark-2)', border:'1px solid var(--dark-4)', borderRadius:12, padding:'16px 24px', marginBottom:20, display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
          <p style={{ color:'var(--gold)', fontSize:11, letterSpacing:'0.08em', fontWeight:600, flexShrink:0 }}>FILTROS</p>

          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <label style={{ color:'var(--cream-dim)', fontSize:12 }}>Fecha:</label>
            <input
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              style={{ padding:'7px 12px', width:'auto', fontSize:13 }}
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                style={{ background:'none', border:'none', color:'var(--cream-dim)', cursor:'pointer', fontSize:16, lineHeight:1 }}
              >×</button>
            )}
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <label style={{ color:'var(--cream-dim)', fontSize:12 }}>Estado:</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              style={{ padding:'7px 12px', width:'auto', fontSize:13 }}
            >
              <option value="">Todos</option>
              <option value="pending">Pendiente</option>
              <option value="confirmed">Confirmada</option>
              <option value="done">Completada</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>

          {(filterDate || filterStatus) && (
            <button
              onClick={() => { setFilterDate(''); setFilterStatus('') }}
              style={{ background:'none', border:'none', color:'var(--cream-dim)', cursor:'pointer', fontSize:12, marginLeft:'auto', letterSpacing:'0.06em', fontFamily:'DM Sans' }}
            >
              LIMPIAR FILTROS
            </button>
          )}
        </div>

        {/* Formulario nueva cita */}
        {showForm && (
          <form onSubmit={handleCreate} className="animate-fade-up" style={{ background:'var(--dark-2)', border:'1px solid var(--dark-4)', borderRadius:12, padding:24, marginBottom:20 }}>
            <p style={{ color:'var(--gold)', fontSize:11, letterSpacing:'0.08em', fontWeight:600, marginBottom:20 }}>NUEVA CITA</p>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              <div>
                <label style={{ display:'block', fontSize:11, letterSpacing:'0.07em', color:'var(--cream-dim)', marginBottom:6, fontWeight:600 }}>BARBERO</label>
                <select name="barber_id" value={form.barber_id} onChange={handleChange} style={inp('barber_id')}>
                  <option value="">Seleccioná un barbero</option>
                  {barbers.filter(b => b.active).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                {errors.barber_id && <p style={{ color:'#E05252', fontSize:12, marginTop:5 }}>⚠ {errors.barber_id}</p>}
              </div>
              <div>
                <label style={{ display:'block', fontSize:11, letterSpacing:'0.07em', color:'var(--cream-dim)', marginBottom:6, fontWeight:600 }}>SERVICIO</label>
                <select name="service_id" value={form.service_id} onChange={handleChange} style={inp('service_id')}>
                  <option value="">Seleccioná un servicio</option>
                  {services.filter(s => s.active).map(s => <option key={s.id} value={s.id}>{s.name} — {s.duration_min}min</option>)}
                </select>
                {errors.service_id && <p style={{ color:'#E05252', fontSize:12, marginTop:5 }}>⚠ {errors.service_id}</p>}
              </div>
              <div>
                <label style={{ display:'block', fontSize:11, letterSpacing:'0.07em', color:'var(--cream-dim)', marginBottom:6, fontWeight:600 }}>NOMBRE DEL CLIENTE</label>
                <input name="client_name" value={form.client_name} onChange={handleChange} placeholder="Juan Pérez" style={inp('client_name')} />
                {errors.client_name && <p style={{ color:'#E05252', fontSize:12, marginTop:5 }}>⚠ {errors.client_name}</p>}
              </div>
              <div>
                <label style={{ display:'block', fontSize:11, letterSpacing:'0.07em', color:'var(--cream-dim)', marginBottom:6, fontWeight:600 }}>TELÉFONO</label>
                <input name="client_phone" value={form.client_phone} onChange={handleChange} placeholder="3001234567" style={inp('client_phone')} />
                {errors.client_phone && <p style={{ color:'#E05252', fontSize:12, marginTop:5 }}>⚠ {errors.client_phone}</p>}
              </div>
              <div>
                <label style={{ display:'block', fontSize:11, letterSpacing:'0.07em', color:'var(--cream-dim)', marginBottom:6, fontWeight:600 }}>EMAIL (OPCIONAL)</label>
                <input name="client_email" type="email" value={form.client_email} onChange={handleChange} placeholder="cliente@email.com" style={inp('client_email')} />
                {errors.client_email && <p style={{ color:'#E05252', fontSize:12, marginTop:5 }}>⚠ {errors.client_email}</p>}
              </div>
              <div>
                <label style={{ display:'block', fontSize:11, letterSpacing:'0.07em', color:'var(--cream-dim)', marginBottom:6, fontWeight:600 }}>FECHA Y HORA</label>
                <input name="scheduled_at" type="datetime-local" value={form.scheduled_at} onChange={handleChange}   style={inp('scheduled_at')} />
                {errors.scheduled_at && <p style={{ color:'#E05252', fontSize:12, marginTop:5 }}>⚠ {errors.scheduled_at}</p>}
              </div>
              <div style={{ gridColumn:'1 / -1' }}>
                <label style={{ display:'block', fontSize:11, letterSpacing:'0.07em', color:'var(--cream-dim)', marginBottom:6, fontWeight:600 }}>NOTAS (OPCIONAL)</label>
                <input name="notes" value={form.notes} onChange={handleChange} placeholder="Indicaciones especiales..." style={{ width:'100%', padding:'12px 16px' }} />
              </div>
            </div>
            {selectedService && (
              <div style={{ background:'rgba(201,168,76,0.08)', border:'1px solid rgba(201,168,76,0.2)', borderRadius:8, padding:'10px 16px', marginTop:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ color:'var(--cream-dim)', fontSize:13 }}>{selectedService.name} · {selectedService.duration_min} min</span>
                <span style={{ color:'var(--gold)', fontWeight:700, fontFamily:'Playfair Display', fontSize:16 }}>{formatPrice(selectedService.price)}</span>
              </div>
            )}
            <button type="submit" disabled={saving} className="btn-primary" style={{ marginTop:20, opacity: saving ? 0.6 : 1 }}>
              {saving ? 'GUARDANDO...' : 'CREAR CITA'}
            </button>
          </form>
        )}

        {/* Lista de citas */}
        <div className="animate-fade-up delay-3" style={{ background:'var(--dark-2)', border:'1px solid var(--dark-4)', borderRadius:12, overflow:'visible' }}>
          {loading ? (
            <p style={{ color:'var(--cream-dim)', textAlign:'center', padding:'48px 0', fontSize:14 }}>Cargando...</p>
          ) : paginated.length === 0 ? (
            <div style={{ textAlign:'center', padding:'56px 0' }}>
              <p style={{ fontSize:36, marginBottom:12 }}>◷</p>
              <p style={{ color:'var(--cream-dim)', fontSize:14 }}>
                {filtered.length === 0 && appointments.length > 0 ? 'No hay citas con esos filtros' : 'No hay citas todavía'}
              </p>
            </div>
          ) : paginated.map((a, i) => (
            <div
              key={a.id}
              style={{ padding:'16px 24px', borderBottom: i < paginated.length-1 ? '1px solid var(--dark-3)' : 'none', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, position:'relative' }}
            >
              <div style={{ display:'flex', alignItems:'center', gap:16, flex:1, minWidth:0 }}>
                <div style={{ background:'var(--dark-3)', borderRadius:8, padding:'6px 12px', textAlign:'center', flexShrink:0, minWidth:70 }}>
                  <p style={{ color:'var(--gold)', fontSize:13, fontWeight:700, fontFamily:'Playfair Display' }}>{formatTime(a.scheduled_at)}</p>
                  <p style={{ color:'var(--cream-dim)', fontSize:10, marginTop:2 }}>{formatDate(a.scheduled_at)}</p>
                </div>
                <div style={{ minWidth:0 }}>
                  <p style={{ color:'var(--cream)', fontWeight:600, fontSize:14, marginBottom:3 }}>{a.client_name}</p>
                  <p style={{ color:'var(--cream-dim)', fontSize:12, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                    {a.service_name} · {a.barber_name} · {a.client_phone}
                  </p>
                </div>
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
                <StatusSelector
                  status={a.status}
                  onUpdate={(newStatus) => handleStatus(a.id, newStatus)}
                />
                <button
                  onClick={() => setDeleting(a.id)}
                  className="btn-danger"
                  style={{ padding:'5px 10px', fontSize:12 }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Paginación */}
        {totalPages > 1 && (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:20 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p-1))}
              disabled={page === 1}
              style={{ background:'var(--dark-2)', border:'1px solid var(--dark-4)', color: page === 1 ? 'var(--dark-4)' : 'var(--cream-dim)', padding:'8px 14px', borderRadius:8, cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize:13, fontFamily:'DM Sans' }}
            >
              ←
            </button>

            {Array.from({ length: totalPages }, (_, i) => i+1).map(n => (
              <button
                key={n}
                onClick={() => setPage(n)}
                style={{ background: n === page ? 'var(--gold)' : 'var(--dark-2)', border:'1px solid ' + (n === page ? 'var(--gold)' : 'var(--dark-4)'), color: n === page ? 'var(--dark)' : 'var(--cream-dim)', padding:'8px 14px', borderRadius:8, cursor:'pointer', fontSize:13, fontWeight: n === page ? 700 : 400, fontFamily:'DM Sans', minWidth:38 }}
              >
                {n}
              </button>
            ))}

            <button
              onClick={() => setPage(p => Math.min(totalPages, p+1))}
              disabled={page === totalPages}
              style={{ background:'var(--dark-2)', border:'1px solid var(--dark-4)', color: page === totalPages ? 'var(--dark-4)' : 'var(--cream-dim)', padding:'8px 14px', borderRadius:8, cursor: page === totalPages ? 'not-allowed' : 'pointer', fontSize:13, fontFamily:'DM Sans' }}
            >
              →
            </button>

            <span style={{ color:'var(--cream-dim)', fontSize:12, marginLeft:8 }}>
              {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, filtered.length)} de {filtered.length}
            </span>
          </div>
        )}

      <Footer />
      </main>
      <HelpButton path={pathname} />
    </div>
  )
}