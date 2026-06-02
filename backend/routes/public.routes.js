const router           = require('express').Router()
const pool             = require('../config/db')
const AppointmentModel = require('../models/appointment.model')

// Info pública de la barbería por slug
router.get('/:slug', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, phone, address, slug
       FROM barbershops WHERE slug = $1`,
      [req.params.slug]
    )
    const shop = result.rows[0]
    if (!shop) return res.status(404).json({ error: 'Barbería no encontrada' })

    const barbers = await pool.query(
      'SELECT id, name, photo_url FROM barbers WHERE barbershop_id = $1 AND active = true ORDER BY name ASC',
      [shop.id]
    )

    const services = await pool.query(
      'SELECT id, name, duration_min, price FROM services WHERE barbershop_id = $1 AND active = true ORDER BY name ASC',
      [shop.id]
    )

    const hours = await pool.query(
      `SELECT day_of_week, open_time, close_time, is_open
       FROM business_hours
       WHERE barbershop_id = $1
       ORDER BY day_of_week ASC`,
      [shop.id]
    )

    const days = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
    const hoursFormatted = hours.rows.map(h => ({
      day:        days[h.day_of_week],
      day_of_week: h.day_of_week,
      open_time:  h.open_time.slice(0,5),
      close_time: h.close_time.slice(0,5),
      is_open:    h.is_open,
    }))

    res.json({
      shop,
      barbers:  barbers.rows,
      services: services.rows,
      hours:    hoursFormatted,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error obteniendo información' })
  }
})

// Horarios ocupados de un barbero en una fecha
router.get('/:slug/availability', async (req, res) => {
  try {
    const { barber_id, date } = req.query
    if (!barber_id || !date) {
      return res.status(400).json({ error: 'Faltan parámetros' })
    }

    const shopResult = await pool.query(
      'SELECT id FROM barbershops WHERE slug = $1',
      [req.params.slug]
    )
    const shop = shopResult.rows[0]
    if (!shop) return res.status(404).json({ error: 'Barbería no encontrada' })

    const result = await pool.query(
      `SELECT a.scheduled_at, s.duration_min
       FROM appointments a
       JOIN services s ON a.service_id = s.id
       WHERE a.barbershop_id = $1
         AND a.barber_id     = $2
         AND DATE(a.scheduled_at) = $3
         AND a.status NOT IN ('cancelled')
       ORDER BY a.scheduled_at ASC`,
      [shop.id, barber_id, date]
    )

    const occupied = result.rows.map(r => ({
      start:    r.scheduled_at,
      duration: r.duration_min,
    }))

    res.json({ occupied })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error obteniendo disponibilidad' })
  }
})

// Crear cita pública
router.post('/:slug/book', async (req, res) => {
  try {
    const shopResult = await pool.query(
      'SELECT id FROM barbershops WHERE slug = $1',
      [req.params.slug]
    )
    const shop = shopResult.rows[0]
    if (!shop) return res.status(404).json({ error: 'Barbería no encontrada' })

    const {
      barber_id, service_id,
      client_name, client_phone, client_email,
      scheduled_at, notes
    } = req.body

    if (!barber_id || !service_id || !client_name || !client_phone || !scheduled_at) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' })
    }

    if (new Date(scheduled_at) < new Date()) {
      return res.status(400).json({ error: 'La fecha no puede ser en el pasado' })
    }

    // Verificar horario de atención
const HoursModel = require('../models/hours.model')
const hoursCheck = await HoursModel.checkOpen(shop.id, scheduled_at)
if (!hoursCheck.open) {
  return res.status(400).json({ error: hoursCheck.reason })
}

    const available = await AppointmentModel.checkAvailability({
      barbershop_id: shop.id,
      barber_id,
      service_id,
      scheduled_at,
    })

    if (!available) {
      return res.status(409).json({ error: 'El barbero ya tiene una cita en ese horario. Por favor elegí otro horario.' })
    }

    const appointment = await AppointmentModel.create({
      barbershop_id: shop.id,
      barber_id, service_id,
      client_name, client_phone, client_email,
      scheduled_at, notes
    })

    res.status(201).json({ appointment, message: 'Cita reservada con éxito' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error creando la reserva' })
  }
})

// Citas del cliente por teléfono
router.get('/:slug/mis-citas', async (req, res) => {
  try {
    const { phone } = req.query
    if (!phone) return res.status(400).json({ error: 'Teléfono requerido' })

    const shopResult = await pool.query(
      'SELECT id, name FROM barbershops WHERE slug = $1',
      [req.params.slug]
    )
    const shop = shopResult.rows[0]
    if (!shop) return res.status(404).json({ error: 'Barbería no encontrada' })

    const cleanPhone = phone.replace(/\D/g, '')

    const result = await pool.query(
      `SELECT a.id, a.scheduled_at, a.status, a.notes,
              b.name AS barber_name,
              s.name AS service_name, s.duration_min, s.price
       FROM appointments a
       LEFT JOIN barbers  b ON a.barber_id  = b.id
       LEFT JOIN services s ON a.service_id = s.id
       WHERE a.barbershop_id = $1
         AND REGEXP_REPLACE(a.client_phone, '[^0-9]', '', 'g') = $2
         AND a.status NOT IN ('cancelled', 'done')
         AND a.scheduled_at > NOW()
       ORDER BY a.scheduled_at ASC`,
      [shop.id, cleanPhone]
    )

    res.json({ shop: { name: shop.name }, appointments: result.rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error obteniendo citas' })
  }
})

// Cancelar cita propia
router.patch('/:slug/mis-citas/:id/cancel', async (req, res) => {
  try {
    const { phone } = req.body
    if (!phone) return res.status(400).json({ error: 'Teléfono requerido' })

    const shopResult = await pool.query(
      'SELECT id FROM barbershops WHERE slug = $1',
      [req.params.slug]
    )
    const shop = shopResult.rows[0]
    if (!shop) return res.status(404).json({ error: 'Barbería no encontrada' })

    const cleanPhone = phone.replace(/\D/g, '')

    const result = await pool.query(
      `UPDATE appointments
       SET status = 'cancelled'
       WHERE id = $1
         AND barbershop_id = $2
         AND REGEXP_REPLACE(client_phone, '[^0-9]', '', 'g') = $3
         AND status NOT IN ('cancelled', 'done')
         AND scheduled_at > NOW()
       RETURNING id`,
      [req.params.id, shop.id, cleanPhone]
    )

    if (!result.rows[0]) {
      return res.status(404).json({ error: 'Cita no encontrada o no se puede cancelar' })
    }

    res.json({ message: 'Cita cancelada correctamente' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error cancelando cita' })
  }
})

module.exports = router