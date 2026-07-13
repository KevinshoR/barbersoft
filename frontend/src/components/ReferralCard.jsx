import { useEffect, useState } from 'react'
import api from '../services/api'
import { useToast } from '../context/ToastContext'

/* Sección "Invita y gana": muestra el código de referido de la barbería,
   permite copiarlo/compartirlo, y cuántos referidos ha traído. */
export default function ReferralCard() {
  const toast = useToast()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    api.get('/referrals/me')
      .then(res => setData(res.data))
      .catch(() => setData(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading || !data?.referral_code) return null

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
      const wa = `https://wa.me/?text=${encodeURIComponent(mensaje)}`
      window.open(wa, '_blank', 'noopener,noreferrer')
    }
  }

  return (
    <div style={{ background:'var(--dark-2)', border:'1px solid rgba(201,168,76,0.3)', borderRadius:14, padding:28, marginBottom:24 }}>
      <p style={{ color:'var(--gold)', fontSize:11, letterSpacing:'0.1em', fontWeight:600, marginBottom:6 }}>INVITA Y GANA</p>
      <h2 style={{ fontFamily:'var(--font-display, Georgia, serif)', fontSize:24, fontWeight:700, color:'var(--cream)', marginBottom:8 }}>
        Recomienda Barbersoft
      </h2>
      <p style={{ color:'var(--cream-dim)', fontSize:14, lineHeight:1.5, marginBottom:22, maxWidth:520 }}>
        Comparte tu código. Cuando un amigo se registre con él y active cualquier plan,
        <strong style={{ color:'var(--gold)' }}> ambos reciben 15 días gratis</strong> sumados a su suscripción.
      </p>

      {/* Código + copiar */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:12, alignItems:'stretch', marginBottom:20 }}>
        <div style={{ flex:1, minWidth:200, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, background:'var(--dark)', border:'1px dashed var(--gold)', borderRadius:10, padding:'14px 20px' }}>
          <span style={{ fontFamily:'var(--font-display, Georgia, serif)', fontSize:26, fontWeight:800, color:'var(--gold)', letterSpacing:'0.08em' }}>
            {data.referral_code}
          </span>
          <button onClick={copiar} style={{ background:'transparent', border:'none', color:'var(--cream-dim)', cursor:'pointer', fontSize:12, fontWeight:600, whiteSpace:'nowrap' }}>
            {copied ? '✓ Copiado' : 'Copiar'}
          </button>
        </div>
        <button onClick={compartir} style={{ background:'var(--gold)', color:'var(--dark)', border:'none', borderRadius:10, padding:'0 26px', fontWeight:700, fontSize:14, cursor:'pointer', whiteSpace:'nowrap' }}>
          Compartir
        </button>
      </div>

      {/* Contadores */}
      <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
        <div style={{ flex:1, minWidth:140, background:'var(--dark)', border:'1px solid var(--dark-4)', borderRadius:10, padding:'16px 20px' }}>
          <p style={{ color:'var(--cream)', fontFamily:'var(--font-display, Georgia, serif)', fontSize:28, fontWeight:800 }}>{data.total_referidos}</p>
          <p style={{ color:'var(--cream-dim)', fontSize:12, marginTop:2 }}>Personas que usaron tu código</p>
        </div>
        <div style={{ flex:1, minWidth:140, background:'var(--dark)', border:'1px solid var(--dark-4)', borderRadius:10, padding:'16px 20px' }}>
          <p style={{ color:'var(--gold)', fontFamily:'var(--font-display, Georgia, serif)', fontSize:28, fontWeight:800 }}>{data.referidos_con_pago}</p>
          <p style={{ color:'var(--cream-dim)', fontSize:12, marginTop:2 }}>Ya activaron su plan · te dieron días</p>
        </div>
      </div>
    </div>
  )
}