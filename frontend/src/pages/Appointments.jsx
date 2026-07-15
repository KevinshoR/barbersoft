import { useState, useEffect, useRef } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import HelpButton from '../components/HelpButton'
import AgendaTabs from '../components/AgendaTabs'
import Pagination from '../components/Pagination'
import { useLocation } from 'react-router-dom'
import api from '../services/api'
import { requiredError, emailError, phoneError, hasErrors } from '../utils/validators'
import { useToast } from '../context/ToastContext'

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
  errors.barber_id    = requiredError(form.barber_id, 'El barbero')
  errors.service_id   = requiredError(form.service_id, 'El servicio')
  errors.client_name  = requiredError(form.client_name, 'El nombre del cliente')
  errors.client_phone = phoneError(form.client_phone, { required: true })
  errors.client_email = emailError(form.client_email)
  Object.keys(errors).forEach(k => { if (!errors[k]) delete errors[k] })
  return errors
}

const STATUS_CONFIG = {
  pending:   { label:'Pendiente',  bg:'#C9A84C', text:'#0D0D0D', dot:'#0D0D0D' },   // dorado pleno
  confirmed: { label:'Confirmada', bg:'#8B6914', text:'#F5F0E8', dot:'#E8C97A' },   // dorado oscuro
  done:      { label:'Completada', bg:'#3A3A3A', text:'#F5F0E8', dot:'#B8B0A0' },   // gris oscuro
  cancelled: { label:'Cancelada',  bg:'#242424', text:'#8A8A8A', dot:'#6A6A6A' },   // gris apagado
}

const TRANSITIONS = {
  pending:   ['confirmed', 'done', 'cancelled'],
  confirmed: ['done', 'cancelled'],
  done:      [],
  cancelled: [],
}

const PAGE_SIZE = 5

const IcAppt = {
  eye: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>,
  trash: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M10 11v6M14 11v6"/></svg>,
  x: (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M18 6 6 18M6 6l12 12"/></svg>,
}

function IconBtn({ icon, tooltip, onClick, danger }) {
  const [hover, setHover] = useState(false)
  return (
    <div style={{ position:'relative', display:'inline-flex' }}>
      <button onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
        style={{ width:36, height:36, borderRadius:10, display:'inline-flex', alignItems:'center', justifyContent:'center', cursor:'pointer', background:'var(--surface-1)', border:'1px solid var(--dark-4)', color: danger ? '#C97A7A' : 'var(--cream-dim)', transition:'all 0.15s' }}
        onMouseOver={(e) => { e.currentTarget.style.borderColor = danger ? '#C97A7A' : 'var(--gold)'; e.currentTarget.style.color = danger ? '#D89090' : 'var(--gold)' }}
        onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--dark-4)'; e.currentTarget.style.color = danger ? '#C97A7A' : 'var(--cream-dim)' }}>
        {icon}
      </button>
      {hover && <span style={{ position:'absolute', bottom:'calc(100% + 6px)', left:'50%', transform:'translateX(-50%)', background:'var(--dark-4)', color:'var(--cream)', fontSize:11, fontWeight:600, padding:'4px 8px', borderRadius:6, whiteSpace:'nowrap', zIndex:20, pointerEvents:'none' }}>{tooltip}</span>}
    </div>
  )
}

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
      <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:current.bg, borderRadius:20, padding:'6px 13px' }}>
        <div style={{ width:6, height:6, borderRadius:'50%', background:current.dot }} />
        <span style={{ color:current.text, fontSize:11, fontWeight:700, letterSpacing:'0.06em' }}>{current.label.toUpperCase()}</span>
      </div>
    )
  }

  return (
    <div ref={ref} style={{ position:'relative', display:'inline-block', zIndex: open ? 200 : 50 }}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen(prev => !prev) }}
        style={{ display:'inline-flex', alignItems:'center', gap:6, background:current.bg, border:'none', borderRadius:20, padding:'6px 13px', cursor:'pointer', transition:'all 0.2s' }}
      >
        <div style={{ width:6, height:6, borderRadius:'50%', background:current.dot }} />
        <span style={{ color:current.text, fontSize:11, fontWeight:700, letterSpacing:'0.06em' }}>{current.label.toUpperCase()}</span>
        <span style={{ color:current.text, fontSize:9, opacity:0.7 }}>▾</span>
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
                <div style={{ width:10, height:10, borderRadius:'50%', background:cfg.bg, border:'1px solid rgba(255,255,255,0.2)', flexShrink:0 }} />
                <span style={{ color:'var(--cream)', fontSize:12, fontWeight:600 }}>{cfg.label}</span>
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
  const toast = useToast()
  const [appointments, setAppointments] = useState([])
  const [barbers, setBarbers]           = useState([])
  const [services, setServices]         = useState([])
  const [loading, setLoading]           = useState(true)
  const [showForm, setShowForm]         = useState(false)
  const [saving, setSaving]             = useState(false)
  const [deleting, setDeleting]         = useState(null)
  const [detail, setDetail]             = useState(null)
  const [deleteBusy, setDeleteBusy]     = useState(false)
  const [touched, setTouched]           = useState({})
  const [filterDate, setFilterDate]     = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch]             = useState('')
  const [page, setPage]                 = useState(1)
  const [form, setForm] = useState({
    barber_id:'', service_id:'', client_name:'',
    client_phone:'', client_email:'', scheduled_at:'', notes:''
  })

  const allErrors = validate(form)
  const errors = Object.keys(allErrors).reduce((acc, k) => {
    if (touched[k]) acc[k] = allErrors[k]
    return acc
  }, {})

  useEffect(() => {
    Promise.all([api.get('/barbers'), api.get('/services')])
      .then(([b, s]) => { setBarbers(b.data.barbers); setServices(s.data.services) })
      .catch(err => toast.error(err.response?.data?.error || 'No se pudieron cargar barberos y servicios.'))
  }, [])

  useEffect(() => { fetchAppointments() }, [])

  const fetchAppointments = () => {
    setLoading(true)
    api.get('/appointments')
      .then(res => setAppointments(res.data.appointments))
      .catch(err => toast.error(err.response?.data?.error || 'No se pudieron cargar las citas.'))
      .finally(() => setLoading(false))
  }

  // Filtros en el frontend
  const filtered = appointments.filter(a => {
    const matchDate   = filterDate   ? new Date(a.scheduled_at).toISOString().split('T')[0] === filterDate : true
    const matchStatus = filterStatus ? a.status === filterStatus : true
    const q = search.trim().toLowerCase()
    const matchSearch = !q || (a.client_name || '').toLowerCase().includes(q) || (a.client_phone || '').includes(q) || (a.barber_name || '').toLowerCase().includes(q) || (a.service_name || '').toLowerCase().includes(q)
    return matchDate && matchStatus && matchSearch
  })

  // Paginación
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  // Reset página cuando cambia filtro
  useEffect(() => { setPage(1) }, [filterDate, filterStatus, search])

  const markTouched = (name) => setTouched(t => (t[name] ? t : { ...t, [name]: true }))

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    markTouched(e.target.name)
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    setTouched({ barber_id: true, service_id: true, client_name: true, client_phone: true, client_email: true, scheduled_at: true })
    if (hasErrors(allErrors)) return
    setSaving(true)
    try {
      await api.post('/appointments', {
        ...form,
        client_name:  form.client_name.trim(),
        client_phone: form.client_phone.trim(),
        client_email: form.client_email.trim(),
        notes:        form.notes.trim(),
        barber_id:  parseInt(form.barber_id),
        service_id: parseInt(form.service_id),
      })
      setForm({ barber_id:'', service_id:'', client_name:'', client_phone:'', client_email:'', scheduled_at:'', notes:'' })
      setTouched({})
      setShowForm(false)
      fetchAppointments()
      toast.success('Cita creada correctamente')
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo crear la cita. Intenta de nuevo.')
    } finally {
      setSaving(false)
    }
  }

  const handleStatus = async (id, status) => {
    try {
      await api.patch('/appointments/' + id, { status })
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a))
      const msg = { confirmed:'Cita confirmada', done:'Cita completada', cancelled:'Cita cancelada' }
      toast.success(msg[status] || 'Estado actualizado')
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo actualizar el estado de la cita.')
    }
  }

  const confirmDelete = async (id) => {
    if (deleteBusy) return
    setDeleteBusy(true)
    try {
      await api.delete('/appointments/' + id)
      fetchAppointments()
      toast.success('Cita eliminada')
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo eliminar la cita.')
    } finally {
      setDeleteBusy(false)
      setDeleting(null)
    }
  }

  const inp = (name) => ({
    width:'100%', padding:'12px 16px',
    border:'1px solid ' + (errors[name] ? 'var(--gold)' : 'var(--dark-4)'),
    boxShadow: errors[name] ? '0 0 0 2px rgba(201,168,76,0.15)' : 'none'
  })

  const selectedService = services.find(s => s.id === parseInt(form.service_id))

  return (
    <div style={{ minHeight:'100vh', background:'var(--dark)' }}>

      {/* Modal ver detalle */}
      {detail && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div className="animate-fade-up" style={{ background:'var(--dark-2)', borderRadius:18, width:'100%', maxWidth:460, overflow:'hidden', border:'1px solid var(--dark-4)', boxShadow:'0 20px 60px rgba(0,0,0,0.5)' }}>
            <div style={{ background:'linear-gradient(135deg, var(--gold-dim) 0%, var(--dark) 130%)', padding:'26px 28px', position:'relative' }}>
              <button onClick={() => setDetail(null)} style={{ position:'absolute', top:14, right:14, background:'rgba(0,0,0,0.4)', border:'none', color:'var(--cream)', cursor:'pointer', width:32, height:32, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center' }}>{IcAppt.x()}</button>
              <p style={{ color:'var(--gold-light)', fontSize:11, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase' }}>Detalle de la cita</p>
              <h2 style={{ fontFamily:'var(--font-display, Georgia, serif)', fontSize:24, fontWeight:800, color:'#fff', marginTop:4 }}>{detail.client_name}</h2>
              <p style={{ color:'rgba(255,255,255,0.7)', fontSize:13, marginTop:4 }}>{formatDate(detail.scheduled_at)} · {formatTime(detail.scheduled_at)}</p>
            </div>
            <div style={{ padding:24 }}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
                {[
                  { l:'Servicio', v:detail.service_name },
                  { l:'Barbero', v:detail.barber_name },
                  { l:'Teléfono', v:detail.client_phone || '—' },
                  { l:'Correo', v:detail.client_email || '—' },
                ].map((f, idx) => (
                  <div key={idx} style={{ background:'var(--surface-1)', border:'1px solid var(--dark-4)', borderRadius:12, padding:14 }}>
                    <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', color:'var(--cream-dim)', textTransform:'uppercase', marginBottom:5 }}>{f.l}</p>
                    <p style={{ color:'var(--cream)', fontSize:14, fontWeight:600, wordBreak:'break-word' }}>{f.v}</p>
                  </div>
                ))}
              </div>
              {detail.notes && (
                <div style={{ marginBottom:4 }}>
                  <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.08em', color:'var(--cream-dim)', textTransform:'uppercase', marginBottom:6 }}>Notas</p>
                  <p style={{ color:'var(--cream)', fontSize:14, lineHeight:1.5, background:'var(--surface-1)', border:'1px solid var(--dark-4)', borderRadius:10, padding:14 }}>{detail.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal eliminar */}
      {deleting && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div className="animate-fade-up" style={{ background:'var(--dark-2)', border:'1px solid var(--dark-4)', borderRadius:16, padding:32, maxWidth:360, width:'90%', textAlign:'center' }}>
            <p style={{ fontSize:32, marginBottom:12 }}>⚠</p>
            <h3 style={{ color:'var(--cream)', fontSize:18, marginBottom:8 }}>¿Eliminar esta cita?</h3>
            <p style={{ color:'var(--cream-dim)', fontSize:13, marginBottom:24 }}>Esta acción no se puede deshacer.</p>
            <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
              <button onClick={() => setDeleting(null)} disabled={deleteBusy} className="btn-secondary">Cancelar</button>
              <button onClick={() => confirmDelete(deleting)} disabled={deleteBusy} className="btn-danger" style={{ opacity: deleteBusy ? 0.6 : 1 }}>
                {deleteBusy ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Navbar />
      <main style={{ maxWidth:900, margin:'0 auto', padding:'40px 24px' }}>

        <p style={{ color:'var(--gold)', fontSize:11, letterSpacing:'0.1em', fontWeight:600, marginBottom:16 }}>AGENDA</p>
        <AgendaTabs />

        {/* Header */}
        <div className="animate-fade-up" style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:32 }}>
          <div>
            <h1 style={{ fontSize:36, fontWeight:900, color:'var(--cream)' }}>Citas</h1>
            <p style={{ color:'var(--cream-dim)', fontSize:13, marginTop:4 }}>
              {appointments.length} en total · {filtered.length} con filtros
            </p>
          </div>
          <button
            onClick={() => { setShowForm(!showForm); setTouched({}) }}
            className="btn-primary"
            style={{ opacity: showForm ? 0.7 : 1 }}
          >
            {showForm ? 'CANCELAR' : '+ NUEVA CITA'}
          </button>
        </div>

        {/* Búsqueda */}
        <div className="animate-fade-up" style={{ position:'relative', marginBottom:16 }}>
          <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'var(--cream-dim)', display:'flex' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por cliente, teléfono, barbero o servicio..."
            style={{ width:'100%', padding:'12px 14px 12px 42px', background:'var(--surface-1)', color:'var(--cream)', border:'1px solid var(--dark-4)', borderRadius:12, outline:'none', fontSize:14 }} />
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

        {/* Modal nueva cita */}
        {showForm && (
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
            <form onSubmit={handleCreate} className="animate-fade-up" style={{ background:'var(--dark-2)', border:'1px solid var(--border-soft)', borderRadius:18, width:'100%', maxWidth:640, maxHeight:'94vh', display:'flex', flexDirection:'column', overflow:'hidden' }}>
              {/* Header */}
              <div style={{ background:'var(--dark)', padding:'20px 28px', borderBottom:'1px solid var(--border-soft)', display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0 }}>
                <div>
                  <p style={{ color:'var(--gold)', fontSize:11, fontWeight:700, letterSpacing:'0.14em', textTransform:'uppercase' }}>Agendar</p>
                  <h2 style={{ fontFamily:'var(--font-display, Georgia, serif)', fontSize:22, fontWeight:700, color:'var(--cream)', marginTop:2 }}>Nueva cita</h2>
                </div>
                <button type="button" onClick={() => { setShowForm(false); setTouched({}) }} style={{ background:'none', border:'none', color:'var(--cream-dim)', cursor:'pointer', fontSize:24, lineHeight:1 }}>✕</button>
              </div>

              {/* Cuerpo */}
              <div style={{ padding:'24px 28px', overflowY:'auto' }}>
                {/* Sección: servicio + barbero */}
                <p style={{ color:'var(--cream-dim)', fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:14 }}>Servicio y barbero</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:24 }}>
                  <div>
                    <label style={{ display:'block', fontSize:11, letterSpacing:'0.07em', color:'var(--cream-dim)', marginBottom:6, fontWeight:600 }}>SERVICIO</label>
                    <select name="service_id" value={form.service_id} onChange={handleChange} onBlur={() => markTouched('service_id')} style={inp('service_id')}>
                      <option value="">Selecciona un servicio</option>
                      {services.filter(s => s.active).map(s => <option key={s.id} value={s.id}>{s.name} — {s.duration_min}min</option>)}
                    </select>
                    {errors.service_id && <p style={{ color:'var(--gold)', fontSize:12, marginTop:5 }}>⚠ {errors.service_id}</p>}
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:11, letterSpacing:'0.07em', color:'var(--cream-dim)', marginBottom:6, fontWeight:600 }}>BARBERO</label>
                    <select name="barber_id" value={form.barber_id} onChange={handleChange} onBlur={() => markTouched('barber_id')} style={inp('barber_id')}>
                      <option value="">Selecciona un barbero</option>
                      {barbers.filter(b => b.active).map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                    {errors.barber_id && <p style={{ color:'var(--gold)', fontSize:12, marginTop:5 }}>⚠ {errors.barber_id}</p>}
                  </div>
                </div>

                {/* Sección: fecha */}
                <p style={{ color:'var(--cream-dim)', fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:14 }}>Fecha y hora</p>
                <div style={{ marginBottom:24 }}>
                  <input name="scheduled_at" type="datetime-local" value={form.scheduled_at} onChange={handleChange} onBlur={() => markTouched('scheduled_at')} style={inp('scheduled_at')} />
                  {errors.scheduled_at && <p style={{ color:'var(--gold)', fontSize:12, marginTop:5 }}>⚠ {errors.scheduled_at}</p>}
                </div>

                {/* Sección: datos del cliente */}
                <p style={{ color:'var(--cream-dim)', fontSize:11, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:14 }}>Datos del cliente</p>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
                  <div>
                    <label style={{ display:'block', fontSize:11, letterSpacing:'0.07em', color:'var(--cream-dim)', marginBottom:6, fontWeight:600 }}>NOMBRE</label>
                    <input name="client_name" value={form.client_name} onChange={handleChange} onBlur={() => markTouched('client_name')} placeholder="Juan Pérez" style={inp('client_name')} />
                    {errors.client_name && <p style={{ color:'var(--gold)', fontSize:12, marginTop:5 }}>⚠ {errors.client_name}</p>}
                  </div>
                  <div>
                    <label style={{ display:'block', fontSize:11, letterSpacing:'0.07em', color:'var(--cream-dim)', marginBottom:6, fontWeight:600 }}>TELÉFONO</label>
                    <input name="client_phone" value={form.client_phone} onChange={handleChange} onBlur={() => markTouched('client_phone')} placeholder="3001234567" style={inp('client_phone')} />
                    {errors.client_phone && <p style={{ color:'var(--gold)', fontSize:12, marginTop:5 }}>⚠ {errors.client_phone}</p>}
                  </div>
                </div>
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:'block', fontSize:11, letterSpacing:'0.07em', color:'var(--cream-dim)', marginBottom:6, fontWeight:600 }}>EMAIL <span style={{ textTransform:'none', color:'var(--cream-dim)', opacity:0.7 }}>(opcional)</span></label>
                  <input name="client_email" type="email" value={form.client_email} onChange={handleChange} onBlur={() => markTouched('client_email')} placeholder="cliente@email.com" style={inp('client_email')} />
                  {errors.client_email && <p style={{ color:'var(--gold)', fontSize:12, marginTop:5 }}>⚠ {errors.client_email}</p>}
                  <p style={{ color:'var(--cream-dim)', fontSize:11.5, marginTop:6, lineHeight:1.4, display:'flex', alignItems:'center', gap:5 }}>
                    <span style={{ color:'var(--gold)' }}>✉</span> Si agregas el correo, el cliente recibirá confirmación y recordatorio de su cita por email.
                  </p>
                </div>
                <div>
                  <label style={{ display:'block', fontSize:11, letterSpacing:'0.07em', color:'var(--cream-dim)', marginBottom:6, fontWeight:600 }}>NOTAS <span style={{ textTransform:'none', color:'var(--cream-dim)', opacity:0.7 }}>(opcional)</span></label>
                  <input name="notes" value={form.notes} onChange={handleChange} placeholder="Indicaciones especiales..." style={{ width:'100%', padding:'12px 16px' }} />
                </div>

                {/* Resumen del servicio elegido */}
                {selectedService && (
                  <div style={{ background:'var(--surface-1)', border:'1px solid var(--gold)', borderRadius:10, padding:'12px 18px', marginTop:20, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ color:'var(--cream)', fontSize:13, fontWeight:500 }}>{selectedService.name} · {selectedService.duration_min} min</span>
                    <span style={{ color:'var(--gold)', fontWeight:800, fontFamily:'var(--font-display, Georgia, serif)', fontSize:18 }}>{formatPrice(selectedService.price)}</span>
                  </div>
                )}
              </div>

              {/* Footer con acciones */}
              <div style={{ padding:'18px 28px', borderTop:'1px solid var(--border-soft)', display:'flex', gap:12, flexShrink:0, background:'var(--dark-2)' }}>
                <button type="button" onClick={() => { setShowForm(false); setTouched({}) }} style={{ flex:1, padding:'13px', borderRadius:10, border:'1px solid var(--border-soft)', background:'transparent', color:'var(--cream-dim)', fontWeight:600, cursor:'pointer' }}>Cancelar</button>
                <button type="submit" disabled={saving || hasErrors(allErrors)} style={{ flex:2, padding:'13px', borderRadius:10, border:'none', background:'var(--gold)', color:'var(--dark)', fontWeight:700, cursor:(saving || hasErrors(allErrors)) ? 'default' : 'pointer', opacity:(saving || hasErrors(allErrors)) ? 0.5 : 1 }}>
                  {saving ? 'Guardando...' : 'Crear cita'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de citas */}
        <div className="animate-fade-up delay-3" style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {loading ? (
            <p style={{ color:'var(--cream-dim)', textAlign:'center', padding:'48px 0', fontSize:14 }}>Cargando...</p>
          ) : paginated.length === 0 ? (
            <div style={{ textAlign:'center', padding:'56px 20px', border:'1px dashed var(--dark-4)', borderRadius:16 }}>
              <p style={{ fontSize:36, marginBottom:12, opacity:0.4 }}>◷</p>
              <p style={{ color:'var(--cream-dim)', fontSize:14 }}>
                {filtered.length === 0 && appointments.length > 0 ? 'No hay citas con esos filtros' : 'No hay citas todavía'}
              </p>
            </div>
          ) : paginated.map((a, idx) => (
            <div
              key={a.id}
              style={{ background:'linear-gradient(135deg, var(--dark-2) 0%, rgba(31,31,31,0.6) 100%)', border:'1px solid var(--dark-4)', borderRadius:14, padding:'16px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, position:'relative', boxShadow:'0 2px 12px rgba(0,0,0,0.25)', zIndex: paginated.length - idx }}
            >
              <div style={{ display:'flex', alignItems:'center', gap:16, flex:1, minWidth:0 }}>
                <div style={{ background:'linear-gradient(135deg, var(--gold-dim) 0%, var(--dark-3) 100%)', border:'1px solid rgba(201,168,76,0.25)', borderRadius:12, padding:'10px 14px', textAlign:'center', flexShrink:0, minWidth:76 }}>
                  <p style={{ color:'var(--gold-light)', fontSize:15, fontWeight:800, fontFamily:'var(--font-display, Georgia, serif)' }}>{formatTime(a.scheduled_at)}</p>
                  <p style={{ color:'var(--cream-dim)', fontSize:10, marginTop:2 }}>{formatDate(a.scheduled_at)}</p>
                </div>
                <div style={{ minWidth:0 }}>
                  <p style={{ color:'var(--cream)', fontWeight:700, fontSize:15, marginBottom:3, fontFamily:'var(--font-display, Georgia, serif)' }}>{a.client_name}</p>
                  <p style={{ color:'var(--cream-dim)', fontSize:12.5, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                    {a.service_name} · {a.barber_name} · {a.client_phone}
                  </p>
                </div>
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                <StatusSelector
                  status={a.status}
                  onUpdate={(newStatus) => handleStatus(a.id, newStatus)}
                />
                <IconBtn icon={IcAppt.eye()} tooltip="Ver detalle" onClick={() => setDetail(a)} />
                <IconBtn icon={IcAppt.trash()} tooltip="Eliminar" danger onClick={() => setDeleting(a.id)} />
              </div>
            </div>
          ))}
        </div>

        {/* Paginación */}
        <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        {totalPages > 1 && (
          <p style={{ color:'var(--cream-dim)', fontSize:12, textAlign:'center', marginTop:10 }}>
            {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, filtered.length)} de {filtered.length}
          </p>
        )}

      <Footer />
      </main>
      <HelpButton path={pathname} />
    </div>
  )
}