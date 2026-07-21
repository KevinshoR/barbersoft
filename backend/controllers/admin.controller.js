const pool = require('../config/db')

const AdminController = {
  async listBarbershops(req, res) {
    try {
      const result = await pool.query(
        `SELECT id, name, email, phone, subscription_status, trial_ends_at,
                subscription_ends_at, created_at, current_plan,
                (
                  (subscription_status = 'active' AND subscription_ends_at > NOW())
                  OR (subscription_status = 'trial' AND trial_ends_at > NOW())
                ) AS is_active_now
         FROM barbershops
         ORDER BY created_at DESC`
      )
      res.json({ barbershops: result.rows })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Error obteniendo barberías' })
    }
  },

  async extend(req, res) {
    try {
      const { id } = req.params
      const { days } = req.body
      const daysInt = parseInt(days)

      if (!Number.isInteger(daysInt) || daysInt <= 0) {
        return res.status(400).json({ error: 'days debe ser un entero positivo' })
      }

      const result = await pool.query(
        `UPDATE barbershops
         SET subscription_status = 'active',
             subscription_ends_at = CASE
               WHEN subscription_ends_at IS NULL OR subscription_ends_at < NOW()
               THEN NOW() + ($1 || ' days')::interval
               ELSE subscription_ends_at + ($1 || ' days')::interval
             END
         WHERE id = $2
         RETURNING *`,
        [daysInt, id]
      )

      const barbershop = result.rows[0]
      if (!barbershop) return res.status(404).json({ error: 'Barbería no encontrada' })

      res.json({ barbershop })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Error extendiendo suscripción' })
    }
  },

  async block(req, res) {
    try {
      const { id } = req.params
      const result = await pool.query(
        `UPDATE barbershops SET subscription_status = 'blocked' WHERE id = $1 RETURNING *`,
        [id]
      )

      const barbershop = result.rows[0]
      if (!barbershop) return res.status(404).json({ error: 'Barbería no encontrada' })

      res.json({ barbershop })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Error bloqueando barbería' })
    }
  },
}

module.exports = AdminController
