// frontend/src/components/PushNotifications.jsx
// Toggle para que un barbero active/desactive las notificaciones push en el
// NAVEGADOR ACTUAL. Cada navegador/dispositivo tiene su propia suscripción,
// así el barbero puede activarlo en su celular Y en el PC de la barbería.
//
// Uso: <PushNotifications barberId={b.id} barberName={b.name} />

import { useState, useEffect } from 'react'
import api from '../services/api'
import { useToast } from '../context/ToastContext'

// Convierte la clave pública VAPID (base64url) a Uint8Array como pide el navegador
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw     = window.atob(base64)
  const out     = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

// Detección básica del entorno para dar mensajes claros al barbero
function detectEnv() {
  const ua      = navigator.userAgent
  const isiOS   = /iPad|iPhone|iPod/.test(ua) && !window.MSStream
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true // iOS PWA
  const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
  return { isiOS, isStandalone, supported }
}

export default function PushNotifications({ barberId, barberName }) {
  const [state, setState]         = useState('loading')  // loading | on | off | denied | unsupported | ios-needs-home
  const [busy, setBusy]           = useState(false)
  const toast = useToast()

  useEffect(() => {
    (async () => {
      const env = detectEnv()

      if (!env.supported) {
        setState('unsupported')
        return
      }
      // En iPhone, Web Push solo funciona si la web está instalada como PWA
      if (env.isiOS && !env.isStandalone) {
        setState('ios-needs-home')
        return
      }
      if (Notification.permission === 'denied') {
        setState('denied')
        return
      }

      // Ver si YA hay una suscripción en este navegador
      try {
        const reg = await navigator.serviceWorker.getRegistration('/sw.js')
        const sub = await reg?.pushManager.getSubscription()
        setState(sub ? 'on' : 'off')
      } catch {
        setState('off')
      }
    })()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [barberId])

  async function enable() {
    setBusy(true)
    try {
      // 1) Pedir permiso
      let permission = Notification.permission
      if (permission === 'default') permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setState('denied')
        toast.error('Debes permitir las notificaciones para activarlas.')
        return
      }

      // 2) Registrar el service worker
      const reg = await navigator.serviceWorker.register('/sw.js')
      await navigator.serviceWorker.ready

      // 3) Traer la clave pública VAPID del backend
      const keyRes = await api.get('/push/public-key')
      const applicationServerKey = urlBase64ToUint8Array(keyRes.data.publicKey)

      // 4) Suscribirse al Push Manager del navegador
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      })

      // 5) Mandarle la suscripción al backend
      await api.post('/push/subscribe', {
        barber_id: barberId,
        subscription: sub.toJSON(),
      })

      setState('on')
      toast.success(`Notificaciones activadas para ${barberName}`)
    } catch (err) {
      console.error(err)
      toast.error('No se pudieron activar las notificaciones. Intenta de nuevo.')
    } finally {
      setBusy(false)
    }
  }

  async function disable() {
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js')
      const sub = await reg?.pushManager.getSubscription()
      if (sub) {
        await api.post('/push/unsubscribe', { endpoint: sub.endpoint }).catch(() => {})
        await sub.unsubscribe()
      }
      setState('off')
      toast.success('Notificaciones desactivadas en este dispositivo')
    } catch (err) {
      toast.error('No se pudieron desactivar')
    } finally {
      setBusy(false)
    }
  }

  const label = 'Notificaciones al celular'

  if (state === 'loading') return null

  if (state === 'unsupported') {
    return <Info label={label} msg="Tu navegador no soporta notificaciones. Usa Chrome, Firefox o Edge." />
  }
  if (state === 'ios-needs-home') {
    return <Info label={label} msg="En iPhone: abre Barbersoft en Safari → Compartir → Agregar a pantalla de inicio. Luego actívalas desde ahí." warn />
  }
  if (state === 'denied') {
    return <Info label={label} msg="Bloqueaste las notificaciones. Habilítalas desde los ajustes del navegador para este sitio." warn />
  }

  const on = state === 'on'
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:14, padding:'14px 16px', background:'var(--dark-3)', border:'1px solid var(--dark-4)', borderRadius:12 }}>
      <div style={{ flex:1, minWidth:0 }}>
        <p style={{ color:'var(--cream)', fontSize:13.5, fontWeight:700, marginBottom:2 }}>{label}</p>
        <p style={{ color:'var(--cream-dim)', fontSize:11.5, lineHeight:1.4 }}>
          {on
            ? 'Este dispositivo recibirá avisos de citas nuevas y recordatorios 1 hora antes.'
            : 'Actívalas en este dispositivo para no perderte ninguna cita.'}
        </p>
      </div>
      <button
        onClick={on ? disable : enable}
        disabled={busy}
        style={{
          width: 44, height: 24, borderRadius: 999, border: 'none', cursor: busy ? 'default' : 'pointer',
          background: on ? 'var(--gold)' : 'var(--dark-4)',
          position:'relative', flexShrink: 0, transition: 'background 0.2s',
        }}
        aria-label={on ? 'Desactivar' : 'Activar'}
      >
        <span style={{
          position:'absolute', top:3, left: on ? 23 : 3, width:18, height:18, borderRadius:'50%',
          background: on ? 'var(--dark)' : 'var(--cream-dim)', transition: 'left 0.2s',
        }} />
      </button>
    </div>
  )
}

function Info({ label, msg, warn }) {
  return (
    <div style={{ padding:'12px 14px', background: warn ? 'rgba(201,168,76,0.06)' : 'var(--dark-3)', border:`1px solid ${warn ? 'rgba(201,168,76,0.3)' : 'var(--dark-4)'}`, borderRadius:12 }}>
      <p style={{ color:'var(--cream)', fontSize:13, fontWeight:700, marginBottom:2 }}>{label}</p>
      <p style={{ color:'var(--cream-dim)', fontSize:12, lineHeight:1.5 }}>{msg}</p>
    </div>
  )
}
