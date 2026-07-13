import { useAuth } from '../context/AuthContext'
import { useLocation, useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import HelpButton from '../components/HelpButton'
import ReferralCard from '../components/ReferralCard'
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
    label:    'MENSUAL',
    price:    '$89.900',
    period:   'mes',
    billing:  'Facturado mensualmente',
    popular:  false,
    features: [
      'Citas ilimitadas',
      'Barberos ilimitados',
      'Página de reservas pública',
      'Recordatorios automáticos WhatsApp',
      'Reportes mensuales',
    ],
  },
  {
    id:       'annual',
    label:    'ANUAL',
    price:    '$69.900',
    period:   'mes',
    billing:  'Facturado anualmente · ahorrás $240.000',
    popular:  true,
    features: [
      'Todo lo del plan mensual',
      '2 meses gratis',
      'Soporte prioritario',
      'Acceso anticipado a funciones',
      'Reportes avanzados',
    ],
  },
]

export default function Subscription() {
const { barbershop, refreshBarbershop } = useAuth()
  const { pathname }      = useLocation()
  const [searchParams]    = useSearchParams()
  const toast = useToast()
  const [loading, setLoading] = useState(null)

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

  const handleSubscribe = async (planId) => {
    setLoading(planId)
    try {
      const res = await api.post('/subscription/create-preference', { plan: planId })
      window.location.href = res.data.sandbox_point
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo iniciar el pago. Intenta de nuevo.')
    } finally {
      setLoading(null)
    }
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
          ELIGE TU PLAN
        </p>

        <div className="animate-fade-up delay-3" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:32 }}>
          {PLANS.map(plan => (
            <div
              key={plan.id}
              style={{ background:'var(--dark-2)', border:'1px solid '+(plan.popular ? 'rgba(201,168,76,0.4)' : 'var(--dark-4)'), borderRadius:14, padding:28, position:'relative', overflow:'hidden', transition:'transform 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform='translateY(-3px)'}
              onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}
            >
              {plan.popular && (
                <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:'linear-gradient(90deg, transparent, var(--gold), transparent)' }} />
              )}

              {plan.popular && (
                <div style={{ display:'inline-block', background:'rgba(201,168,76,0.12)', border:'1px solid rgba(201,168,76,0.25)', color:'var(--gold)', fontSize:10, fontWeight:700, padding:'3px 12px', borderRadius:20, letterSpacing:'0.08em', marginBottom:14 }}>
                  ★ MÁS POPULAR
                </div>
              )}

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
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading === plan.id || status === 'active'}
                className={plan.popular ? 'btn-primary' : 'btn-secondary'}
                style={{ width:'100%', padding:'13px 0', opacity: loading === plan.id ? 0.6 : 1, fontSize:12 }}
              >
                {loading === plan.id
                  ? 'REDIRIGIENDO...'
                  : status === 'active'
                  ? '✓ PLAN ACTUAL'
                  : 'SUSCRIBIRME CON MERCADO PAGO'}
              </button>
            </div>
          ))}
        </div>

        {/* Métodos de pago */}
        <div className="animate-fade-up delay-4" style={{ background:'var(--dark-2)', border:'1px solid var(--dark-4)', borderRadius:12, padding:24 }}>
          <p style={{ color:'var(--cream-dim)', fontSize:11, letterSpacing:'0.08em', fontWeight:600, marginBottom:16 }}>MÉTODOS DE PAGO ACEPTADOS</p>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:14 }}>
            {['PSE', 'Nequi', 'Daviplata', 'Tarjeta débito', 'Tarjeta crédito'].map(m => (
              <span key={m} style={{ background:'var(--dark-3)', border:'1px solid var(--dark-4)', color:'var(--cream)', fontSize:12, padding:'6px 14px', borderRadius:6, fontWeight:500 }}>
                {m}
              </span>
            ))}
          </div>
          <p style={{ color:'var(--cream-dim)', fontSize:12, lineHeight:1.6, opacity:0.7 }}>
            Procesado de forma segura a través de{' '}
            <span style={{ color:'var(--gold)' }}>Mercado Pago</span>.
            Los datos de tu tarjeta nunca se almacenan en nuestros servidores.
            Puedes cancelar tu suscripción en cualquier momento.
          </p>
        </div>

        {/* Invita y gana */}
        <div style={{ marginTop:32 }}>
          <ReferralCard />
        </div>

      </main>
      <Footer />
      <HelpButton path={pathname} />
    </div>
  )
}