const pool = require('../config/db')

module.exports = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT subscription_status, trial_ends_at, subscription_ends_at, is_super_admin FROM barbershops WHERE id = $1',
      [req.barbershop.id]
    )

    const shop = result.rows[0]
    if (!shop) return res.status(404).json({ error: 'Barbería no encontrada' })

    // Un super admin nunca queda bloqueado por su propia suscripción.
    if (shop.is_super_admin === true) return next()

    const now = new Date()

    // Verificar trial activo
    if (shop.subscription_status === 'trial') {
      if (new Date(shop.trial_ends_at) > now) return next()
      // Trial vencido → bloquear
      await pool.query(
        "UPDATE barbershops SET subscription_status = 'blocked' WHERE id = $1",
        [req.barbershop.id]
      )
      return res.status(402).json({ error: 'Trial vencido. Activá tu suscripción.' })
    }

    // Suscripción activa
    if (shop.subscription_status === 'active') {
      if (new Date(shop.subscription_ends_at) > now) return next()
      await pool.query(
        "UPDATE barbershops SET subscription_status = 'blocked' WHERE id = $1",
        [req.barbershop.id]
      )
      return res.status(402).json({ error: 'Suscripción vencida. Renovála para continuar.' })
    }

    // Bloqueado
    return res.status(402).json({ error: 'Cuenta bloqueada. Realizá el pago para continuar.' })

  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Error verificando suscripción' })
  }
}