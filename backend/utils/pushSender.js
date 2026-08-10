// backend/utils/pushSender.js
// Envío de notificaciones Web Push.
// Motivo: alertar al barbero cuando (a) le reservan una cita y (b) 1 hora antes.
// Usa las claves VAPID guardadas en variables de entorno.
//
// Si una suscripción devuelve 404/410 (barbero desinstaló la app o revocó
// permisos), la borramos de la BD para no seguir intentando.

const webpush = require('web-push')
const pool    = require('../config/db')

const VAPID_PUBLIC  = process.env.VAPID_PUBLIC_KEY
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:alejandrovinkeuno@gmail.com'

let configured = false
function ensureConfigured() {
  if (configured) return true
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    console.warn('[push] VAPID keys no configuradas — no se enviarán notificaciones push')
    return false
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE)
  configured = true
  return true
}

/**
 * Envía notificación push a TODOS los dispositivos suscritos de un barbero.
 * @param {number} barberId
 * @param {{title:string, body:string, url?:string, tag?:string}} payload
 */
async function pushToBarber(barberId, payload) {
  if (!ensureConfigured()) return { sent: 0 }

  const { rows: subs } = await pool.query(
    'SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE barber_id = $1',
    [barberId]
  )
  if (subs.length === 0) return { sent: 0 }

  const body = JSON.stringify({
    title: payload.title,
    body:  payload.body,
    url:   payload.url || '/appointments',
    tag:   payload.tag || 'cita',
  })

  let sent = 0
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        body
      )
      sent++
      pool.query('UPDATE push_subscriptions SET last_success = NOW() WHERE id = $1', [sub.id])
        .catch(() => {})
    } catch (err) {
      const status = err.statusCode
      if (status === 404 || status === 410) {
        // Suscripción muerta: el navegador ya no la reconoce → limpiar
        pool.query('DELETE FROM push_subscriptions WHERE id = $1', [sub.id]).catch(() => {})
        console.log(`[push] Suscripción ${sub.id} eliminada (status ${status})`)
      } else {
        pool.query('UPDATE push_subscriptions SET last_failure = NOW() WHERE id = $1', [sub.id])
          .catch(() => {})
        console.error(`[push] Error enviando a suscripción ${sub.id}:`, err.message)
      }
    }
  }

  return { sent, total: subs.length }
}

module.exports = { pushToBarber }
