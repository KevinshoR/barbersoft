import { useAuth } from '../context/AuthContext'
import { useLocation, useSearchParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import HelpButton from '../components/HelpButton'
import api from '../services/api'
import { useToast } from '../context/ToastContext'

function trialDaysLeft(trial_ends_at) {
  if (!trial_ends_at) return 0
  const diff = new Date(trial_ends_at) - new Date()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('es-CO', {
    year:'numeric', month:'long', day:'numeric'
  })
}

const PLANS = [
  {
    id:       'monthly',
    label:    'PLAN BARBERSOFT',
    price:    '$50.000',
    period:   'mes',
    billing:  'Facturado mensualmente · cancela cuando quieras',
    popular:  true,
    features: [
      'Citas ilimitadas',
      'Barberos ilimitados',
      'Página de reservas pública',
      'Recordatorios automáticos por correo',
      'Panel con estadísticas del negocio',
      'Asistente con IA para tus clientes',
      'Soporte por WhatsApp',
    ],
  },
]

export default function Subscription() {
const { barbershop, refreshBarbershop } = useAuth()
  const { pathname }      = useLocation()
  const navigate          = useNavigate()
  const [searchParams]    = useSearchParams()
  const toast = useToast()
  // loading eliminado: la suscripción ahora abre WhatsApp directo (sin llamada asíncrona a Mercado Pago)

  // Detectar retorno de Mercado Pago
  useEffect(() => {
  refreshBarbershop()
  const payment = searchParams.get('payment')
  const blocked = searchParams.get('blocked')
  if (payment === 'success') toast.success('¡Pago exitoso! Tu suscripción fue activada.')
  if (payment === 'failure') toast.error('El pago no se completó. Intenta de nuevo.')
  if (payment === 'pending') toast.warning('Pago pendiente. Te avisaremos cuando se confirme.')
  if (blocked === 'true')    toast.error('Tu suscripción venció. Elige un plan para continuar.')
}, [])

  // TODO: cuando la pasarela (Wompi) esté lista, restaurar el flujo automático:
  // const handleSubscribe = async (planId) => { ... api.post('/subscription/create-preference', ...) }
  const WHATSAPP_NUMBER = '573116735081'
  const handleSubscribe = () => {
    const nombre = barbershop?.name || 'mi barbería'
    const mensaje = `Hola, quiero activar mi suscripción de Barbersoft ($50.000/mes) para "${nombre}". Ya hice/voy a hacer la transferencia.`
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(mensaje)}`, '_blank', 'noopener,noreferrer')
  }

  const status    = barbershop?.subscription_status || 'trial'
  const daysLeft  = trialDaysLeft(barbershop?.trial_ends_at)

  const statusConfig = {
    trial:   { label:'PERÍODO DE PRUEBA', color:'var(--gold)',    bg:'rgba(201,168,76,0.12)',  border:'rgba(201,168,76,0.3)'  },
    active:  { label:'ACTIVA',            color:'#C9A84C',        bg:'rgba(201,168,76,0.12)',  border:'rgba(201,168,76,0.3)'  },
    blocked: { label:'BLOQUEADA',         color:'#E8C97A',        bg:'rgba(232,201,122,0.12)',   border:'rgba(232,201,122,0.3)'   },
  }
  const sc = statusConfig[status] || statusConfig['trial']

  return (
    <div style={{ minHeight:'100vh', background:'var(--dark)', display:'flex', flexDirection:'column' }}>
      <Navbar />
      <main style={{ maxWidth:860, margin:'0 auto', padding:'40px 24px', flex:1, width:'100%' }}>

        {/* Header */}
        <div className="animate-fade-up" style={{ marginBottom:40 }}>
          <p style={{ color:'var(--gold)', fontSize:11, letterSpacing:'0.1em', fontWeight:600, marginBottom:4 }}>BILLING</p>
          <h1 style={{ fontSize:36, fontWeight:900, color:'var(--cream)' }}>Suscripción</h1>
        </div>

        {/* Estado actual */}
        <div className="animate-fade-up delay-1" style={{ background:'var(--dark-2)', border:'1px solid var(--dark-4)', borderRadius:12, padding:28, marginBottom:32 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
            <p style={{ color:'var(--cream-dim)', fontSize:11, letterSpacing:'0.08em', fontWeight:600 }}>ESTADO ACTUAL</p>
            <span style={{ background:sc.bg, border:'1px solid '+sc.border, color:sc.color, fontSize:11, fontWeight:700, padding:'4px 14px', borderRadius:20, letterSpacing:'0.06em' }}>
              {sc.label}
            </span>
          </div>

          {status === 'trial' && (
            <div>
              <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:10 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize:52, fontWeight:900, color:'var(--gold)', lineHeight:1 }}>{daysLeft}</span>
                <span style={{ color:'var(--cream-dim)', fontSize:15 }}>días restantes de prueba gratuita</span>
              </div>
              <div style={{ height:5, background:'var(--dark-3)', borderRadius:3, marginBottom:14, overflow:'hidden' }}>
                <div style={{ height:'100%', width:(daysLeft/14*100)+'%', background:'linear-gradient(90deg, var(--gold-dim), var(--gold))', borderRadius:3, transition:'width 1s ease' }} />
              </div>
              <p style={{ color:'var(--cream-dim)', fontSize:13, lineHeight:1.6 }}>
                Tu período de prueba vence el{' '}
                <span style={{ color:'var(--cream)', fontWeight:600 }}>{formatDate(barbershop?.trial_ends_at)}</span>.
                Suscríbete para mantener el acceso sin interrupciones.
              </p>
            </div>
          )}
{!barbershop && (
  <p style={{ color:'var(--cream-dim)', fontSize:13 }}>Cargando información...</p>
)}
          {status === 'active' && (
            <div>
              <p style={{ color:'var(--cream)', fontSize:15, fontWeight:500, marginBottom:6 }}>
                Tu suscripción está activa hasta el{' '}
                <span style={{ color:'var(--gold)', fontWeight:700 }}>{formatDate(barbershop?.subscription_ends_at)}</span>
              </p>
              <p style={{ color:'var(--cream-dim)', fontSize:13 }}>
                Puedes cancelar en cualquier momento desde aquí.
              </p>
            </div>
          )}

          {status === 'blocked' && (
            <div>
              <p style={{ color:'#E8C97A', fontSize:15, fontWeight:600, marginBottom:6 }}>
                Tu cuenta está bloqueada por falta de pago.
              </p>
              <p style={{ color:'var(--cream-dim)', fontSize:13 }}>
                Tus datos están seguros. Realiza el pago para recuperar el acceso inmediatamente.
              </p>
            </div>
          )}
        </div>

        {/* Planes */}
        <p className="animate-fade-up delay-2" style={{ color:'var(--cream-dim)', fontSize:11, letterSpacing:'0.1em', fontWeight:600, marginBottom:16 }}>
          TU PLAN
        </p>

        <div className="animate-fade-up delay-3" style={{ display:'grid', gridTemplateColumns:'1fr', maxWidth:420, gap:16, marginBottom:32 }}>
          {PLANS.map(plan => (
            <div
              key={plan.id}
              style={{ background:'var(--dark-2)', border:'1px solid rgba(201,168,76,0.4)', borderRadius:14, padding:28, position:'relative', overflow:'hidden', transition:'transform 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform='translateY(-3px)'}
              onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}
            >
              <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg, transparent, var(--gold), transparent)' }} />

              <p style={{ color:'var(--cream-dim)', fontSize:11, letterSpacing:'0.1em', fontWeight:600, marginBottom:10 }}>{plan.label}</p>

              <div style={{ display:'flex', alignItems:'baseline', gap:4, marginBottom:4 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize:42, fontWeight:900, color: plan.popular ? 'var(--gold)' : 'var(--cream)', lineHeight:1 }}>
                  {plan.price}
                </span>
              </div>
              <p style={{ color:'var(--cream-dim)', fontSize:12, marginBottom:4 }}>COP / {plan.period}</p>
              <p style={{ color:'var(--cream-dim)', fontSize:11, marginBottom:24, opacity:0.6 }}>{plan.billing}</p>

              <ul style={{ listStyle:'none', marginBottom:28 }}>
                {plan.features.map(f => (
                  <li key={f} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10, color:'var(--cream)', fontSize:13 }}>
                    <span style={{ color:'#C9A84C', fontSize:14, fontWeight:700, flexShrink:0 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={handleSubscribe}
                disabled={status === 'active'}
                className={plan.popular ? 'btn-primary' : 'btn-secondary'}
                style={{ width:'100%', padding:'13px 0', display:'flex', alignItems:'center', justifyContent:'center', gap:8, fontSize:12 }}
              >
                {status === 'active'
                  ? '✓ PLAN ACTUAL'
                  : (<>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12c0 1.8.5 3.5 1.3 5L2 22l5.2-1.4c1.5.8 3.1 1.2 4.8 1.2 5.5 0 10-4.5 10-10S17.5 2 12 2Zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.3-.5.1-1 .1-1.7-.1-.4-.1-.9-.3-1.6-.6-2.7-1.2-4.5-3.9-4.6-4.1-.1-.2-1.1-1.5-1.1-2.8 0-1.3.7-2 1-2.2.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5.2.5.7 1.8.8 1.9.1.1.1.3 0 .5-.1.2-.1.3-.3.5-.1.2-.3.4-.4.5-.1.1-.3.3-.1.6.2.3.9 1.4 1.9 2.3 1.3 1.1 2.3 1.5 2.7 1.7.3.1.5.1.6-.1.2-.2.7-.8.9-1.1.2-.3.4-.2.6-.1.2.1 1.5.7 1.8.8.3.1.4.2.5.3.1.2.1.7-.1 1.3Z"/></svg>
                      SUSCRIBIRME POR WHATSAPP
                    </>)}
              </button>
            </div>
          ))}
        </div>

        {/* Cómo pagar (temporal, mientras se activa el pago automático) */}
        <div className="animate-fade-up delay-4" style={{ background:'var(--dark-2)', border:'1px solid var(--dark-4)', borderRadius:12, padding:24 }}>
          <p style={{ color:'var(--cream-dim)', fontSize:11, letterSpacing:'0.08em', fontWeight:600, marginBottom:16 }}>¿CÓMO FUNCIONA EL PAGO?</p>
          <p style={{ color:'var(--cream-dim)', fontSize:13, lineHeight:1.7 }}>
            Por ahora, la suscripción se activa de forma manual: escríbenos por{' '}
            <span style={{ color:'var(--gold)' }}>WhatsApp</span>, te compartimos los datos para
            transferir (Nequi o Bancolombia), y en cuanto confirmamos el pago activamos tu cuenta
            — normalmente en minutos. Muy pronto vas a poder pagar automáticamente desde aquí.
          </p>
        </div>

        {/* Invita y gana → vista dedicada */}
        <div
          onClick={() => navigate('/referrals')}
          style={{ marginTop:32, background:'var(--dark-2)', border:'1px solid rgba(201,168,76,0.3)', borderRadius:14, padding:'22px 26px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16, cursor:'pointer' }}
        >
          <div>
            <p style={{ color:'var(--gold)', fontSize:11, letterSpacing:'0.1em', fontWeight:600, marginBottom:4 }}>INVITA Y GANA</p>
            <p style={{ color:'var(--cream)', fontSize:15, fontWeight:600 }}>Recomienda Barbersoft y gana 15 días gratis por cada barbería que active su plan</p>
          </div>
          <span style={{ color:'var(--gold)', fontSize:22, flexShrink:0 }}>→</span>
        </div>

      </main>
      <Footer />
      <HelpButton path={pathname} />
    </div>
  )
}