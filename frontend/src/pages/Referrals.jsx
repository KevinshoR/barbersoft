import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import HelpButton from '../components/HelpButton'
import api from '../services/api'
import { useToast } from '../context/ToastContext'

/* ═══════════════════════════════════════════════════════════
   REFERIDOS — "Invita y gana". Vista dedicada donde el dueño
   ve su código, cómo funciona, sus estadísticas, y comparte.
═══════════════════════════════════════════════════════════ */

const Icon = {
  gift: (p) => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8S13 3 16.5 3a2.5 2.5 0 0 1 0 5"/></svg>,
  copy: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
  share: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4"/></svg>,
  users: (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  check: (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>,
  calendar: (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>,
}

export default function Referrals() {
  const { pathname } = useLocation()
  const toast = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    api.get('/referrals/me')
      .then(res => setData(res.data))
      .catch(() => toast.error('No se pudieron cargar tus referidos.'))
      .finally(() => setLoading(false))
  }, [])

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(data.referral_code)
      setCopied(true)
      toast.success('Código copiado')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('No se pudo copiar. Cópialo manualmente.')
    }
  }

  const compartir = async () => {
    const mensaje = `¡Únete a Barbersoft con mi código ${data.referral_code} y ambos ganamos 15 días gratis al activar tu plan! 💈`
    if (navigator.share) {
      try { await navigator.share({ title: 'Barbersoft', text: mensaje }) } catch { /* cancelado */ }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(mensaje)}`, '_blank', 'noopener,noreferrer')
    }
  }

  const pasos = [
    { n: '1', titulo: 'Comparte tu código', texto: 'Envíaselo a otros dueños de barbería que conozcas.' },
    { n: '2', titulo: 'Se registran con él', texto: 'Ponen tu código al crear su cuenta en Barbersoft.' },
    { n: '3', titulo: 'Ambos ganan', texto: 'Cuando activan cualquier plan, tú y ellos reciben 15 días gratis.' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'var(--dark)', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ maxWidth: 880, margin: '0 auto', padding: '40px 24px', flex: 1, width: '100%' }}>

        <p style={{ color: 'var(--gold)', fontSize: 11, letterSpacing: '0.1em', fontWeight: 600, marginBottom: 4 }}>PROGRAMA DE REFERIDOS</p>
        <h1 style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: 36, fontWeight: 900, color: 'var(--cream)', marginBottom: 8 }}>Invita y gana</h1>
        <p style={{ color: 'var(--cream-dim)', fontSize: 14, marginBottom: 32, maxWidth: 560, lineHeight: 1.5 }}>
          Recomienda Barbersoft a otras barberías. Por cada una que active su plan con tu código,
          <strong style={{ color: 'var(--gold)' }}> tú y ellos ganan 15 días gratis</strong>. Sin límite de invitaciones.
        </p>

        {loading ? (
          <p style={{ color: 'var(--cream-dim)', textAlign: 'center', padding: 60 }}>Cargando...</p>
        ) : !data?.referral_code ? (
          <p style={{ color: 'var(--cream-dim)', textAlign: 'center', padding: 60 }}>No pudimos cargar tu código de referido.</p>
        ) : (
          <>
            {/* Hero del código */}
            <div style={{ position: 'relative', background: 'linear-gradient(135deg, var(--dark-2) 0%, var(--dark-3) 100%)', border: '1px solid rgba(201,168,76,0.35)', borderRadius: 18, padding: '38px 32px', overflow: 'hidden', marginBottom: 24 }}>
              {/* Adorno */}
              <div style={{ position: 'absolute', top: -40, right: -30, color: 'rgba(201,168,76,0.07)' }}>
                {Icon.gift({ width: 180, height: 180 })}
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--gold)', marginBottom: 14 }}>
                  {Icon.gift()}
                  <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.08em' }}>TU CÓDIGO</span>
                </div>
                <p style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: 48, fontWeight: 800, color: 'var(--gold)', letterSpacing: '0.1em', lineHeight: 1, marginBottom: 24 }}>
                  {data.referral_code}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  <button onClick={copiar} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: copied ? 'var(--dark-4)' : 'var(--gold)', color: copied ? 'var(--gold)' : 'var(--dark)', border: 'none', borderRadius: 10, padding: '13px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all 0.2s' }}>
                    {Icon.copy()} {copied ? 'Copiado' : 'Copiar código'}
                  </button>
                  <button onClick={compartir} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'transparent', color: 'var(--cream)', border: '1px solid var(--dark-4)', borderRadius: 10, padding: '13px 24px', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                    {Icon.share()} Compartir
                  </button>
                </div>
              </div>
            </div>

            {/* Estadísticas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
              <div style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-4)', borderRadius: 14, padding: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ color: 'var(--cream-dim)', flexShrink: 0 }}>{Icon.users()}</div>
                <div>
                  <p style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: 30, fontWeight: 800, color: 'var(--cream)', lineHeight: 1 }}>{data.total_referidos}</p>
                  <p style={{ color: 'var(--cream-dim)', fontSize: 12.5, marginTop: 5 }}>Usaron tu código</p>
                </div>
              </div>
              <div style={{ background: 'var(--dark-2)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 14, padding: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ color: 'var(--gold)', flexShrink: 0 }}>{Icon.check()}</div>
                <div>
                  <p style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: 30, fontWeight: 800, color: 'var(--gold)', lineHeight: 1 }}>{data.referidos_con_pago}</p>
                  <p style={{ color: 'var(--cream-dim)', fontSize: 12.5, marginTop: 5 }}>Activaron su plan</p>
                </div>
              </div>
              <div style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-4)', borderRadius: 14, padding: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ color: 'var(--cream-dim)', flexShrink: 0 }}>{Icon.calendar()}</div>
                <div>
                  <p style={{ fontFamily: 'var(--font-display, Georgia, serif)', fontSize: 30, fontWeight: 800, color: 'var(--cream)', lineHeight: 1 }}>{data.referidos_con_pago * 15}</p>
                  <p style={{ color: 'var(--cream-dim)', fontSize: 12.5, marginTop: 5 }}>Días gratis ganados</p>
                </div>
              </div>
            </div>

            {/* Cómo funciona */}
            <p style={{ color: 'var(--cream)', fontFamily: 'var(--font-display, Georgia, serif)', fontSize: 22, fontWeight: 700, marginBottom: 18 }}>¿Cómo funciona?</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              {pasos.map(p => (
                <div key={p.n} style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-4)', borderRadius: 14, padding: 24 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', fontFamily: 'var(--font-display, Georgia, serif)', fontWeight: 800, fontSize: 18, marginBottom: 14 }}>{p.n}</div>
                  <p style={{ color: 'var(--cream)', fontWeight: 700, fontSize: 15, marginBottom: 6 }}>{p.titulo}</p>
                  <p style={{ color: 'var(--cream-dim)', fontSize: 13, lineHeight: 1.5 }}>{p.texto}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
      <Footer />
      <HelpButton path={pathname} />
    </div>
  )
}