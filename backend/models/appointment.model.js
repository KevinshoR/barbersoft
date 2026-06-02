const pool = require('../config/db')

const AppointmentModel = {
  async findAll(barbershop_id) {
    const result = await pool.query(
      `SELECT a.id, a.client_name, a.client_phone, a.client_email,
              a.scheduled_at, a.status, a.notes,
              b.name AS barber_name,
              s.name AS service_name, s.duration_min, s.price
       FROM appointments a
       LEFT JOIN barbers  b ON a.barber_id  = b.id
       LEFT JOIN services s ON a.service_id = s.id
       WHERE a.barbershop_id = $1
       ORDER BY a.scheduled_at ASC`,
      [barbershop_id]
    )
    return result.rows
  },

  async findByDate(barbershop_id, date) {
  const result = await pool.query(
    `SELECT a.id, a.client_name, a.client_phone, a.client_email,
            a.scheduled_at, a.status, a.notes,
            b.name AS barber_name,
            s.name AS service_name, s.duration_min, s.price
     FROM appointments a
     LEFT JOIN barbers  b ON a.barber_id  = b.id
     LEFT JOIN services s ON a.service_id = s.id
     WHERE a.barbershop_id = $1
       AND DATE(a.scheduled_at AT TIME ZONE 'America/Bogota') = $2
     ORDER BY a.scheduled_at ASC`,
    [barbershop_id, date]
  )
  return result.rows
},

  async create({ barbershop_id, barber_id, service_id, client_name, client_phone, client_email, scheduled_at, notes }) {
    const result = await pool.query(
      `INSERT INTO appointments
         (barbershop_id, barber_id, service_id, client_name, client_phone, client_email, scheduled_at, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       RETURNING *`,
      [barbershop_id, barber_id, service_id, client_name, client_phone, client_email, scheduled_at, notes]
    )
    return result.rows[0]
  },

  async checkAvailability({ barbershop_id, barber_id, scheduled_at, service_id, exclude_id }) {
    const serviceResult = await pool.query(
      'SELECT duration_min FROM services WHERE id = $1',
      [service_id]
    )
    const duration = serviceResult.rows[0]?.duration_min || 30

    const start = new Date(scheduled_at)
    const end   = new Date(start.getTime() + duration * 60000)

    const result = await pool.query(
      `SELECT a.id
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       WHERE a.barbershop_id = $1
         AND a.barber_id     = $2
         AND a.status        NOT IN ('cancelled')
         AND ($3::int IS NULL OR a.id != $3)
         AND (
           a.scheduled_at < $5
           AND (a.scheduled_at + (s.duration_min || ' minutes')::interval) > $4
         )`,
      [barbershop_id, barber_id, exclude_id || null, start, end]
    )

    return result.rows.length === 0
  },

  async updateStatus(id, barbershop_id, status) {
    const result = await pool.query(
      `UPDATE appointments
       SET status = $1
       WHERE id = $2 AND barbershop_id = $3
       RETURNING *`,
      [status, id, barbershop_id]
    )
    return result.rows[0]
  },

  async delete(id, barbershop_id) {
    const result = await pool.query(
      `DELETE FROM appointments
       WHERE id = $1 AND barbershop_id = $2
       RETURNING id`,
      [id, barbershop_id]
    )
    return result.rows[0]
  },

  async findPendingReminders() {
    const result = await pool.query(
      `SELECT a.id, a.client_name, a.client_phone, a.scheduled_at,
              b.name AS barbershop_name
       FROM appointments a
       JOIN barbershops b ON a.barbershop_id = b.id
       WHERE a.status        = 'pending'
         AND a.reminder_sent = false
         AND a.scheduled_at BETWEEN NOW() + INTERVAL '55 minutes'
                       AND NOW() + INTERVAL '65 minutes'`
    )
    return result.rows
  },

  async markReminderSent(id) {
    await pool.query(
      'UPDATE appointments SET reminder_sent = true WHERE id = $1',
      [id]
    )
  }
}

module.exports = AppointmentModel