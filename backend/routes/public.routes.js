const router           = require('express').Router()
const rateLimit        = require('express-rate-limit')
const pool             = require('../config/db')
const AppointmentModel = require('../models/appointment.model')
const { enviarConfirmacionCliente, enviarAvisoBarbero } = require('../utils/mailer')

// Día de la semana en hora Colombia (0=Dom ... 6=Sáb), igual método que HoursModel.checkOpen
function getColombiaDayOfWeek(scheduled_at) {
  const date = new Date(scheduled_at)
  const diaCol = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Bogota', weekday: 'short' }).format(date)
  const mapaDias = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return mapaDias[diaCol]
}

// Validación básica de entrada para los endpoints públicos: no confiamos
// solo en el frontend. Los límites de longitud coinciden con las columnas
// de la tabla `appointments` (client_name VARCHAR(100), client_phone VARCHAR(20),
// client_email VARCHAR(100)) para evitar un 500 por truncamiento en la DB.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const isPositiveIntId = (v) => /^\d+$/.test(String(v))

// Limita reservas seguidas desde una misma IP para frenar spam de citas basura
const reservaPublicaLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Has hecho demasiadas reservas seguidas. Espera unos minutos.' },
})

// Búsqueda pública de barberías por departamento/municipio
// IMPORTANTE: debe ir antes de '/:slug' para que Express no lo confunda con un slug.
router.get('/search', async (req, res) => {
  try {
    const { department, municipality } = req.query
    if (!department) {
      return res.status(400).json({ error: 'El departamento es obligatorio' })
    }

    const conditions = ['department = $1']
    const params = [department]

    if (municipality) {
      params.push(municipality)
      conditions.push(`municipality = $${params.length}`)
    }

    const result = await pool.query(
      `SELECT id, name, slug, department, municipality
       FROM barbershops
       WHERE ${conditions.join(' AND ')}
       ORDER BY name ASC`,
      params
    )

    res.json({ barbershops: result.rows })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error buscando barberías' })
  }
})

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
      'SELECT id, name, duration_min, price, image_url, description FROM services WHERE barbershop_id = $1 AND active = true ORDER BY name ASC',
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
    if (!isPositiveIntId(barber_id)) {
      return res.status(400).json({ error: 'barber_id inválido' })
    }
    if (isNaN(new Date(date).getTime())) {
      return res.status(400).json({ error: 'date inválido' })
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
router.post('/:slug/book', reservaPublicaLimiter, async (req, res) => {
  try {
    const shopResult = await pool.query(
      'SELECT id, name, email FROM barbershops WHERE slug = $1',
      [req.params.slug]
    )
    const shop = shopResult.rows[0]
    if (!shop) return res.status(404).json({ error: 'No encontramos esta barbería. Verifica que el enlace sea correcto.' })

    const {
      barber_id, service_id,
      client_name, client_phone, client_email,
      scheduled_at, notes
    } = req.body

    if (!barber_id || !service_id || !client_name || !client_phone || !scheduled_at) {
      const faltantes = []
      if (!service_id)    faltantes.push('servicio')
      if (!barber_id)     faltantes.push('barbero')
      if (!client_name)   faltantes.push('nombre')
      if (!client_phone)  faltantes.push('teléfono')
      if (!scheduled_at)  faltantes.push('fecha y hora')
      return res.status(400).json({ error: `Faltan datos: por favor completa ${faltantes.join(', ')}.` })
    }

    if (!isPositiveIntId(barber_id) || !isPositiveIntId(service_id)) {
      return res.status(400).json({ error: 'Barbero o servicio inválido.' })
    }

    if (client_name.length > 100) {
      return res.status(400).json({ error: 'El nombre no puede tener más de 100 caracteres.' })
    }
    if (client_phone.length > 20) {
      return res.status(400).json({ error: 'El teléfono no puede tener más de 20 caracteres.' })
    }
    if (client_email && (client_email.length > 100 || !EMAIL_RE.test(client_email))) {
      return res.status(400).json({ error: 'El email no tiene un formato válido.' })
    }
    if (notes && notes.length > 1000) {
      return res.status(400).json({ error: 'Las notas no pueden tener más de 1000 caracteres.' })
    }

    if (new Date(scheduled_at) < new Date()) {
      return res.status(400).json({ error: 'No puedes reservar en una fecha u hora que ya pasó.' })
    }

    // Verificar horario de atención
const HoursModel = require('../models/hours.model')
const hoursCheck = await HoursModel.checkOpen(shop.id, scheduled_at)
if (!hoursCheck.open) {
  const reason = hoursCheck.reason === 'El negocio está cerrado ese día'
    ? 'La barbería no atiende el día que elegiste. Por favor elige otro día.'
    : `${hoursCheck.reason}. Por favor elige una hora dentro de ese horario.`
  return res.status(400).json({ error: reason })
}

    // Verificar que el barbero trabaje ese día de la semana
    const barberResult = await pool.query(
      'SELECT work_days FROM barbers WHERE id = $1 AND barbershop_id = $2',
      [barber_id, shop.id]
    )
    const workDaysRaw = barberResult.rows[0]?.work_days
    if (workDaysRaw) {
      const workDays = workDaysRaw.split(',').map(Number).filter(n => !Number.isNaN(n))
      const dayOfWeek = getColombiaDayOfWeek(scheduled_at)
      if (!workDays.includes(dayOfWeek)) {
        return res.status(400).json({ error: 'El barbero seleccionado no atiende ese día. Elige otro día u otro barbero.' })
      }
    }

    const available = await AppointmentModel.checkAvailability({
      barbershop_id: shop.id,
      barber_id,
      service_id,
      scheduled_at,
    })

    if (!available) {
      return res.status(409).json({ error: 'Ese horario ya está reservado. Por favor elige otra hora.' })
    }

    const appointment = await AppointmentModel.create({
      barbershop_id: shop.id,
      barber_id, service_id,
      client_name, client_phone, client_email,
      scheduled_at, notes
    })

    try {
      const infoResult = await pool.query(
        `SELECT b.name AS barber_name, s.name AS service_name
         FROM barbers b, services s
         WHERE b.id = $1 AND s.id = $2`,
        [barber_id, service_id]
      )
      const info = infoResult.rows[0]

      if (info) {
        await enviarConfirmacionCliente({
          clienteEmail:   client_email,
          clienteNombre:  client_name,
          barberiaNombre: shop.name,
          barberoNombre:  info.barber_name,
          servicioNombre: info.service_name,
          fechaHora:      scheduled_at,
        })

        await enviarAvisoBarbero({
          barberiaEmail:   shop.email,
          barberiaNombre:  shop.name,
          clienteNombre:   client_name,
          clienteTelefono: client_phone,
          servicioNombre:  info.service_name,
          fechaHora:       scheduled_at,
        })
      }
    } catch (mailErr) {
      console.error('[Correos] Error enviando notificaciones de cita:', mailErr.message)
    }

    res.status(201).json({ appointment, message: 'Cita reservada con éxito' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'No pudimos procesar tu reserva. Por favor intenta de nuevo en unos minutos.' })
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
    if (!isPositiveIntId(req.params.id)) {
      return res.status(400).json({ error: 'Cita no encontrada o no se puede cancelar' })
    }

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