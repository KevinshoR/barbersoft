const pool = require('../config/db')

const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

// Horario con el que arranca toda barbería nueva: Lun-Sáb 09:00-18:00 abierto,
// Domingo cerrado. Sin estas 7 filas, HoursModel.update() devuelve 404 porque
// hace un UPDATE (no upsert) y asume que el día ya existe.
const DEFAULT_HOURS = [0, 1, 2, 3, 4, 5, 6].map(day_of_week => ({
  day_of_week,
  open_time:  '09:00',
  close_time: '18:00',
  is_open:    day_of_week !== 0, // domingo (0) cerrado
}))

const HoursModel = {
  async createDefaults(barbershop_id, db = pool) {
    const values = []
    const rows = DEFAULT_HOURS.map((h, i) => {
      const base = i * 5
      values.push(barbershop_id, h.day_of_week, h.open_time, h.close_time, h.is_open)
      return `($${base + 1}, $${base + 2}, $${base + 3}::time, $${base + 4}::time, $${base + 5})`
    }).join(', ')

    const result = await db.query(
      `INSERT INTO business_hours (barbershop_id, day_of_week, open_time, close_time, is_open)
       VALUES ${rows}
       RETURNING id, day_of_week, open_time, close_time, is_open`,
      values
    )
    return result.rows
  },

  async findAll(barbershop_id) {
    const result = await pool.query(
      `SELECT id, day_of_week, open_time, close_time, is_open
       FROM business_hours
       WHERE barbershop_id = $1
       ORDER BY day_of_week ASC`,
      [barbershop_id]
    )
    // Barbería sin sus 7 filas (ej. creada por un script que no llamó createDefaults):
    // se las creamos en el momento para que el módulo nunca aparezca vacío/cerrado.
    const rows = result.rows.length > 0 ? result.rows : await HoursModel.createDefaults(barbershop_id)
    return rows.map(r => ({
      ...r,
      day_name: days[r.day_of_week],
      open_time:  r.open_time.slice(0, 5),
      close_time: r.close_time.slice(0, 5),
    }))
  },

  // UPSERT: si la fila (barbershop_id, day_of_week) no existe todavía (barbería
  // huérfana sin sus 7 filas), la crea en vez de fallar con 404 como antes.
  async update(barbershop_id, day_of_week, { open_time, close_time, is_open }) {
    const result = await pool.query(
      `INSERT INTO business_hours (barbershop_id, day_of_week, open_time, close_time, is_open)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (barbershop_id, day_of_week)
       DO UPDATE SET open_time  = EXCLUDED.open_time,
                     close_time = EXCLUDED.close_time,
                     is_open    = EXCLUDED.is_open
       RETURNING *`,
      [barbershop_id, day_of_week, open_time || '09:00', close_time || '18:00', is_open]
    )
    return result.rows[0]
  },

  async checkOpen(barbershop_id, scheduled_at) {
    // IMPORTANTE: el día y la hora se calculan SIEMPRE en zona horaria de Colombia
    // (America/Bogota), sin importar la zona del servidor (Render corre en UTC).
    // Sin esto, una cita de la noche/madrugada colombiana se corría de día en UTC
    // y el sistema decía "cerrado ese día" por error.
    const date = new Date(scheduled_at)

    // Día de la semana en hora Colombia (0=Dom ... 6=Sáb)
    const diaCol = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Bogota', weekday: 'short',
    }).format(date)
    const mapaDias = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
    const dayOfWeek = mapaDias[diaCol]

    // Hora HH:MM en hora Colombia, formato 24h
    const time = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit', hour12: false,
    }).format(date)

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