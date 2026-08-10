// backend/controllers/push.controller.js
// Gestión de suscripciones Web Push para los barberos de la barbería.
// Todas las rutas requieren estar autenticado como dueño de la barbería.

const pool = require('../config/db')

const PushController = {
  // Devuelve la clave pública VAPID para que el frontend pueda suscribirse.
  // Es SEGURA de exponer — sirve para verificar firma, no para firmar.
  async publicKey(req, res) {
    if (!process.env.VAPID_PUBLIC_KEY) {
      return res.status(500).json({ error: 'Web Push no está configurado en el servidor' })
    }
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY })
  },

  // Guardar (o actualizar) una suscripción del navegador para un barbero.
  // Body: { barber_id, subscription: { endpoint, keys: { p256dh, auth } } }
  async subscribe(req, res) {
    try {
      const { barber_id, subscription } = req.body || {}
      if (!Number.isInteger(barber_id)) {
        return res.status(400).json({ error: 'barber_id inválido' })
      }
      if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
        return res.status(400).json({ error: 'subscription inválida' })
      }

      // Verificar que el barbero es de ESTA barbería (evita que una barbería
      // suscriba a barberos de otra).
      const check = await pool.query(
        'SELECT id FROM barbers WHERE id = $1 AND barbershop_id = $2',
        [barber_id, req.barbershop.id]
      )
      if (check.rows.length === 0) {
        return res.status(404).json({ error: 'Barbero no encontrado en tu barbería' })
      }

      // Upsert por endpoint único: si el mismo navegador se re-suscribe,
      // actualizamos claves; si es nuevo, insertamos.
      await pool.query(
        `INSERT INTO push_subscriptions
            (barber_id, barbershop_id, endpoint, p256dh, auth, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (endpoint) DO UPDATE
            SET barber_id = EXCLUDED.barber_id,
                p256dh    = EXCLUDED.p256dh,
                auth      = EXCLUDED.auth,
                user_agent = EXCLUDED.user_agent`,
        [
          barber_id,
          req.barbershop.id,
          subscription.endpoint,
          subscription.keys.p256dh,
          subscription.keys.auth,
          (req.headers['user-agent'] || '').slice(0, 200),
        ]
      )
      res.status(201).json({ ok: true })
    } catch (err) {
      console.error('[push.subscribe] error:', err)
      res.status(500).json({ error: 'No se pudo guardar la suscripción' })
    }
  },

  // Eliminar suscripción (cuando el barbero desactiva notificaciones)
  async unsubscribe(req, res) {
    try {
      const { endpoint } = req.body || {}
      if (!endpoint) return res.status(400).json({ error: 'endpoint requerido' })
      await pool.query(
        `DELETE FROM push_subscriptions
          WHERE endpoint = $1 AND barbershop_id = $2`,
        [endpoint, req.barbershop.id]
      )
      res.json({ ok: true })
    } catch (err) {
      console.error('[push.unsubscribe] error:', err)
      res.status(500).json({ error: 'No se pudo eliminar la suscripción' })
    }
  },

  // Estado: para un barbero, ¿cuántas suscripciones tiene y cuáles?
  async status(req, res) {
    try {
      const barberId = parseInt(req.query.barber_id)
      if (!Number.isInteger(barberId)) return res.status(400).json({ error: 'barber_id requerido' })

      const check = await pool.query(
        'SELECT id FROM barbers WHERE id = $1 AND barbershop_id = $2',
        [barberId, req.barbershop.id]
      )
      if (check.rows.length === 0) return res.status(404).json({ error: 'Barbero no encontrado' })

      const { rows } = await pool.query(
        `SELECT id, user_agent, created_at, last_success
           FROM push_subscriptions
          WHERE barber_id = $1
          ORDER BY created_at DESC`,
        [barberId]
      )
      res.json({ subscriptions: rows })
    } catch (err) {
      console.error('[push.status] error:', err)
      res.status(500).json({ error: 'Error consultando suscripciones' })
    }
  },
}

module.exports = PushController
