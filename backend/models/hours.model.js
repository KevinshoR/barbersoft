const pool = require('../config/db')

const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

const HoursModel = {
  async findAll(barbershop_id) {
    const result = await pool.query(
      `SELECT id, day_of_week, open_time, close_time, is_open
       FROM business_hours
       WHERE barbershop_id = $1
       ORDER BY day_of_week ASC`,
      [barbershop_id]
    )
    return result.rows.map(r => ({
      ...r,
      day_name: days[r.day_of_week],
      open_time:  r.open_time.slice(0, 5),
      close_time: r.close_time.slice(0, 5),
    }))
  },

  async update(barbershop_id, day_of_week, { open_time, close_time, is_open }) {
    const result = await pool.query(
      `UPDATE business_hours
       SET open_time = $1, close_time = $2, is_open = $3
       WHERE barbershop_id = $4 AND day_of_week = $5
       RETURNING *`,
      [open_time, close_time, is_open, barbershop_id, day_of_week]
    )
    return result.rows[0]
  },

  async checkOpen(barbershop_id, scheduled_at) {
    const date      = new Date(scheduled_at)
    const dayOfWeek = date.getDay()
    const time      = date.toTimeString().slice(0, 5)

    const result = await pool.query(
      `SELECT is_open, open_time, close_time
       FROM business_hours
       WHERE barbershop_id = $1 AND day_of_week = $2`,
      [barbershop_id, dayOfWeek]
    )

    const hours = result.rows[0]
    if (!hours || !hours.is_open) return { open: false, reason: 'El negocio está cerrado ese día' }

    const openTime  = hours.open_time.slice(0, 5)
    const closeTime = hours.close_time.slice(0, 5)

    if (time < openTime || time >= closeTime) {
      return { open: false, reason: `El horario de atención es de ${openTime} a ${closeTime}` }
    }

    return { open: true }
  }
}

module.exports = HoursModel