const pool = require('../config/db')

const AdminController = {
  async listBarbershops(req, res) {
    try {
      const result = await pool.query(
        `SELECT id, name, email, phone, subscription_status, trial_ends_at,
                subscription_ends_at, created_at, current_plan, is_super_admin,
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

      const targetCheck = await pool.query(
        'SELECT is_super_admin FROM barbershops WHERE id = $1',
        [id]
      )
      if (targetCheck.rows[0]?.is_super_admin === true) {
        return res.status(400).json({ error: 'No puedes modificar la suscripción de una cuenta super admin.' })
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

      const targetCheck = await pool.query(
        'SELECT is_super_admin FROM barbershops WHERE id = $1',
        [id]
      )
      if (targetCheck.rows[0]?.is_super_admin === true) {
        return res.status(400).json({ error: 'No puedes modificar la suscripción de una cuenta super admin.' })
      }

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

  // ─────────────────────────────────────────────────────────────
  // Eliminar una barbería PERMANENTEMENTE.
  //
  // ⚠ Acción destructiva y no reversible. Borra en cascada (ON DELETE CASCADE)
  // sus servicios, barberos, horarios y todas sus citas. Por eso exige:
  //   1. Auth + super admin (ya lo aplica el middleware de la ruta).
  //   2. Que el super admin NO se elimine a sí mismo.
  //   3. Que la barbería objetivo NO sea también super admin.
  //   4. Confirmación por escrito: el body debe incluir { confirm_name }
  //      con el nombre EXACTO de la barbería (evita borrado por accidente).
  // ─────────────────────────────────────────────────────────────
  async remove(req, res) {
    try {
      const { id } = req.params
      const { confirm_name } = req.body || {}
      const targetId = parseInt(id)

      if (!Number.isInteger(targetId) || targetId <= 0) {
        return res.status(400).json({ error: 'ID de barbería inválido' })
      }

      // (2) Que no se autoelimine
      if (req.barbershop?.id === targetId) {
        return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta desde el panel.' })
      }

      // Traer la barbería objetivo (nombre real + si es super admin)
      const targetResult = await pool.query(
        'SELECT name, is_super_admin FROM barbershops WHERE id = $1',
        [targetId]
      )
      const target = targetResult.rows[0]
      if (!target) {
        return res.status(404).json({ error: 'Barbería no encontrada' })
      }

      // (3) No permitir eliminar otro super admin
      if (target.is_super_admin === true) {
        return res.status(400).json({ error: 'No puedes eliminar una cuenta super admin.' })
      }

      // (4) Confirmación por escrito con el nombre exacto
      if (typeof confirm_name !== 'string' || confirm_name.trim() !== target.name.trim()) {
        return res.status(400).json({
          error: 'Debes escribir el nombre exacto de la barbería para confirmar la eliminación.',
        })
      }

      // Ejecutar el borrado. Gracias a ON DELETE CASCADE, todas las tablas
      // dependientes (services, barbers, business_hours, appointments) se
      // limpian solas.
      const result = await pool.query(
        'DELETE FROM barbershops WHERE id = $1 RETURNING id, name',
        [targetId]
      )
      const deleted = result.rows[0]
      if (!deleted) {
        // Carrera improbable pero contemplada: alguien más la borró antes
        return res.status(404).json({ error: 'La barbería ya no existe' })
      }

      console.log(`[admin] SuperAdmin ${req.barbershop?.id} eliminó barbería ${deleted.id} (${deleted.name})`)
      res.json({ deleted })
    } catch (err) {
      console.error('[admin.remove] error:', err)
      res.status(500).json({ error: 'Error eliminando la barbería' })
    }
  },
}

module.exports = AdminController
