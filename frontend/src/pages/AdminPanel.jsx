import { useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import api from '../services/api'
import { useToast } from '../context/ToastContext'

/* ═══════════════════════════════════════════════════════════
   PANEL SUPER ADMIN — control de todas las barberías registradas.
   Se auto-protege: si el backend responde 403, no es super admin.
═══════════════════════════════════════════════════════════ */

const Ic = {
  search: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  crown: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M2 18h20l-2-9-5 4-3-7-3 7-5-4Z"/></svg>,
  plus: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 5v14M5 12h14"/></svg>,
  ban: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>,
  lock: (p) => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
}

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

export default function AdminPanel() {
  const { pathname } = useLocation()
  const toast = useToast()
  const [shops, setShops] = useState([])
  const [loading, setLoading] = useState(true)
  const [forbidden, setForbidden] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all') // all | active | inactive
  const [extending, setExtending] = useState(null) // barbershop siendo editado
  const [days, setDays] = useState('30')
  const [busy, setBusy] = useState(false)

  useEffect(() => { fetchShops() }, [])

  const fetchShops = () => {
    setLoading(true)
    api.get('/admin/barbershops')
      .then(res => setShops(res.data.barbershops))
      .catch(err => {
        if (err.response?.status === 403) setForbidden(true)
        else toast.error('No se pudo cargar el panel.')
      })
      .finally(() => setLoading(false))
  }

  const handleExtend = async () => {
    const n = parseInt(days)
    if (!n || n <= 0) { toast.error('Ingresa un número de días válido.'); return }
    setBusy(true)
    try {
      await api.post(`/admin/barbershops/${extending.id}/extend`, { days: n })
      toast.success(`+${n} días agregados a ${extending.name}`)
      setExtending(null)
      setDays('30')
      fetchShops()
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo extender la suscripción.')
    } finally {
      setBusy(false)
    }
  }

  const handleBlock = async (shop) => {
    if (!window.confirm(`¿Bloquear a "${shop.name}"? Perderá acceso al panel hasta que le agregues días.`)) return
    try {
      await api.post(`/admin/barbershops/${shop.id}/block`)
      toast.success(`${shop.name} fue bloqueada`)
      fetchShops()
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo bloquear la barbería.')
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return shops.filter(s => {
      const matchSearch = !q || (s.name || '').toLowerCase().includes(q) || (s.email || '').toLowerCase().includes(q)
      const matchFilter = filter === 'all' || (filter === 'active' ? s.is_active_now : !s.is_active_now)
      return matchSearch && matchFilter
    })
  }, [shops, search, filter])

  const stats = useMemo(() => ({
    total: shops.length,
    active: shops.filter(s => s.is_active_now).length,
    inactive: shops.filter(s => !s.is_active_now).length,
  }), [shops])

  if (forbidden) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--dark)', display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--gold)', opacity: 0.4, display: 'flex', justifyContent: 'center', marginBottom: 16 }}>{Ic.lock()}</div>
            <h1 style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: 24, color: 'var(--cream)', marginBottom: 8 }}>No autorizado</h1>
            <p style={{ color: 'var(--cream-dim)', fontSize: 14 }}>No tienes acceso a este panel.</p>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 60px', flex: 1, width: '100%' }}>

        <p style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: '0.12em', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
          {Ic.crown()} Panel de control
        </p>
        <h1 style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: 34, fontWeight: 800, color: 'var(--cream)', marginTop: 4, marginBottom: 24 }}>
          Barberías registradas
        </h1>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { label: 'TOTAL', value: stats.total, color: 'var(--cream)' },
            { label: 'ACTIVAS', value: stats.active, color: 'var(--gold)' },
            { label: 'INACTIVAS', value: stats.inactive, color: 'var(--cream-dim)' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-4)', borderRadius: 12, padding: '18px 20px' }}>
              <p style={{ color: 'var(--cream-dim)', fontSize: 10, letterSpacing: '0.08em', fontWeight: 700, marginBottom: 6 }}>{s.label}</p>
              <p style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: 30, fontWeight: 800, color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>

        {/* Barra: búsqueda + filtro */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--cream-dim)', display: 'flex' }}>{Ic.search()}</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o correo..."
              style={{ width: '100%', padding: '11px 14px 11px 42px', background: 'var(--surface-1)', color: 'var(--cream)', border: '1px solid var(--dark-4)', borderRadius: 10, outline: 'none', fontSize: 14 }} />
          </div>
          <div style={{ display: 'inline-flex', background: 'var(--dark-2)', border: '1px solid var(--dark-4)', borderRadius: 10, padding: 4, gap: 4 }}>
            {[['all', 'Todas'], ['active', 'Activas'], ['inactive', 'Inactivas']].map(([id, label]) => (
              <button key={id} onClick={() => setFilter(id)}
                style={{ padding: '8px 16px', borderRadius: 7, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                  background: filter === id ? 'var(--gold)' : 'transparent', color: filter === id ? 'var(--dark)' : 'var(--cream-dim)' }}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Listado */}
        {loading ? (
          <p style={{ color: 'var(--cream-dim)', textAlign: 'center', padding: 50 }}>Cargando...</p>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', border: '1px dashed var(--dark-4)', borderRadius: 16 }}>
            <p style={{ color: 'var(--cream-dim)', fontSize: 14 }}>No hay barberías que coincidan.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(s => (
              <div key={s.id} style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-4)', borderRadius: 12, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <p style={{ color: 'var(--cream)', fontWeight: 700, fontSize: 15, fontFamily: 'var(--font-display, Georgia, serif)' }}>{s.name}</p>
                    {s.is_super_admin && <span title="Super admin" style={{ color: 'var(--gold)' }}>{Ic.crown()}</span>}
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', padding: '2px 8px', borderRadius: 20, background: s.is_active_now ? 'rgba(201,168,76,0.15)' : 'var(--dark-4)', color: s.is_active_now ? 'var(--gold)' : 'var(--cream-dim)' }}>
                      {s.is_active_now ? 'ACTIVA' : 'INACTIVA'}
                    </span>
                  </div>
                  <p style={{ color: 'var(--cream-dim)', fontSize: 12.5, marginTop: 3 }}>{s.email}{s.phone ? ` · ${s.phone}` : ''}</p>
                </div>

                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  <div>
                    <p style={{ color: 'var(--cream-dim)', fontSize: 10, letterSpacing: '0.05em', fontWeight: 700 }}>ESTADO</p>
                    <p style={{ color: 'var(--cream)', fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>{s.subscription_status}</p>
                  </div>
                  <div>
                    <p style={{ color: 'var(--cream-dim)', fontSize: 10, letterSpacing: '0.05em', fontWeight: 700 }}>VENCE</p>
                    <p style={{ color: 'var(--cream)', fontSize: 13, fontWeight: 600 }}>
                      {s.subscription_status === 'trial' ? fmtDate(s.trial_ends_at) : fmtDate(s.subscription_ends_at)}
                    </p>
                  </div>
                  <div>
                    <p style={{ color: 'var(--cream-dim)', fontSize: 10, letterSpacing: '0.05em', fontWeight: 700 }}>REGISTRO</p>
                    <p style={{ color: 'var(--cream)', fontSize: 13, fontWeight: 600 }}>{fmtDate(s.created_at)}</p>
                  </div>
                </div>

                {!s.is_super_admin && (
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button onClick={() => { setExtending(s); setDays('30') }}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--gold)', color: 'var(--dark)', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      {Ic.plus()} Días
                    </button>
                    <button onClick={() => handleBlock(s)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'transparent', color: '#D89090', border: '1px solid #C97A7A', borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      {Ic.ban()} Bloquear
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal: agregar días */}
      {extending && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-4)', borderRadius: 16, padding: 28, maxWidth: 380, width: '100%' }}>
            <p style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: '0.1em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Agregar días</p>
            <h3 style={{ fontFamily: 'var(--font-display, Georgia, serif)', color: 'var(--cream)', fontSize: 20, marginBottom: 18 }}>{extending.name}</h3>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--cream-dim)', marginBottom: 8 }}>DÍAS A AGREGAR</label>
            <input type="number" min="1" value={days} onChange={(e) => setDays(e.target.value)}
              style={{ width: '100%', padding: '12px 15px', fontSize: 15, background: 'var(--surface-1)', color: 'var(--cream)', border: '1px solid var(--dark-4)', borderRadius: 10, outline: 'none', marginBottom: 10 }} />
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              {[15, 30, 90, 365].map(n => (
                <button key={n} onClick={() => setDays(String(n))} type="button"
                  style={{ flex: 1, padding: '7px 0', borderRadius: 7, border: '1px solid var(--dark-4)', background: 'var(--dark-3)', color: 'var(--cream-dim)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  {n}
                </button>
              ))}
            </div>
            <p style={{ color: 'var(--cream-dim)', fontSize: 12, marginBottom: 20, lineHeight: 1.4 }}>
              Si aún tiene tiempo vigente, los días se suman a lo que le queda (no se pierde el tiempo restante).
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setExtending(null)} disabled={busy}
                style={{ flex: 1, padding: 12, borderRadius: 10, border: '1px solid var(--dark-4)', background: 'transparent', color: 'var(--cream-dim)', fontWeight: 600, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={handleExtend} disabled={busy}
                style={{ flex: 1, padding: 12, borderRadius: 10, border: 'none', background: 'var(--gold)', color: 'var(--dark)', fontWeight: 700, cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.6 : 1 }}>
                {busy ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
