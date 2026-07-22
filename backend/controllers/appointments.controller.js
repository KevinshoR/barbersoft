const AppointmentModel = require('../models/appointment.model')
const pool              = require('../config/db')
const { enviarConfirmacionCliente, enviarAvisoBarbero, enviarRecordatorioCita } = require('../utils/mailer')
const { getColombiaDayOfWeek, toColombiaDate } = require('../utils/timezone')

// Valida que scheduled_at caiga dentro del horario de atención (día no
// cerrado) y que el barbero trabaje ese día de la semana. La usan tanto
// create() como update() para no duplicar (ni desincronizar) esta lógica.
// Devuelve null si es válido, o el mensaje de error a devolver al cliente.
async function validateSchedule(barbershop_id, barber_id, scheduled_at) {
  const HoursModel = require('../models/hours.model')
  const hoursCheck = await HoursModel.checkOpen(barbershop_id, scheduled_at)
  if (!hoursCheck.open) return hoursCheck.reason

  const barberResult = await pool.query(
    'SELECT work_days FROM barbers WHERE id = $1 AND barbershop_id = $2',
    [barber_id, barbershop_id]
  )
  const workDaysRaw = barberResult.rows[0]?.work_days
  if (workDaysRaw) {
    const workDays = workDaysRaw.split(',').map(Number).filter(n => !Number.isNaN(n))
    const dayOfWeek = getColombiaDayOfWeek(scheduled_at)
    if (!workDays.includes(dayOfWeek)) {
      return 'El barbero seleccionado no atiende ese día. Elige otro día u otro barbero.'
    }
  }

  return null
}

const AppointmentsController = {

  async getAll(req, res) {
    try {
      const { date } = req.query
      let appointments

      if (date) {
        appointments = await AppointmentModel.findByDate(req.barbershop.id, date)
      } else {
        appointments = await AppointmentModel.findAll(req.barbershop.id)
      }

      res.json({ appointments })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Error obteniendo citas' })
    }
  },

  async create(req, res) {
  try {
    const {
      barber_id, service_id,
      client_name, client_phone, client_email,
      scheduled_at, notes
    } = req.body

    if (!barber_id || !service_id || !client_name || !client_phone || !scheduled_at) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' })
    }

    if (toColombiaDate(scheduled_at) < new Date()) {
      return res.status(400).json({ error: 'La fecha de la cita no puede ser en el pasado' })
    }

    // Verificar horario de atención y que el barbero trabaje ese día
    const scheduleError = await validateSchedule(req.barbershop.id, barber_id, scheduled_at)
    if (scheduleError) {
      return res.status(400).json({ error: scheduleError })
    }

    // Verificar disponibilidad del barbero
    const available = await AppointmentModel.checkAvailability({
      barbershop_id: req.barbershop.id,
      barber_id, service_id, scheduled_at,
    })
    if (!available) {
      return res.status(409).json({ error: 'El barbero ya tiene una cita en ese horario. Elegí otro horario.' })
    }

    const appointment = await AppointmentModel.create({
      barbershop_id: req.barbershop.id,
      barber_id, service_id,
      client_name, client_phone, client_email,
      scheduled_at, notes
    })

    try {
      const infoResult = await pool.query(
        `SELECT b.name AS barber_name, s.name AS service_name,
                sh.name AS barbershop_name, sh.email AS barbershop_email
         FROM barbers b, services s, barbershops sh
         WHERE b.id = $1 AND s.id = $2 AND sh.id = $3`,
        [barber_id, service_id, req.barbershop.id]
      )
      const info = infoResult.rows[0]

      if (info) {
        await enviarConfirmacionCliente({
          clienteEmail:   client_email,
          clienteNombre:  client_name,
          barberiaNombre: info.barbershop_name,
          barberoNombre:  info.barber_name,
          servicioNombre: info.service_name,
          fechaHora:      scheduled_at,
        })

        await enviarAvisoBarbero({
          barberiaEmail:   info.barbershop_email,
          barberiaNombre:  info.barbershop_name,
          clienteNombre:   client_name,
          clienteTelefono: client_phone,
          servicioNombre:  info.service_name,
          fechaHora:       scheduled_at,
        })
      }
    } catch (mailErr) {
      console.error('[Correos] Error enviando notificaciones de cita:', mailErr.message)
    }

    res.status(201).json({ appointment })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error creando cita' })
  }
},

  async update(req, res) {
    try {
      const { id } = req.params
      const {
        barber_id, service_id,
        client_name, client_phone, client_email,
        scheduled_at, notes,
        // status NO se toca acá: eso ya lo maneja updateStatus() vía PATCH.
      } = req.body

      const existing = await pool.query(
        'SELECT id FROM appointments WHERE id = $1 AND barbershop_id = $2',
        [id, req.barbershop.id]
      )
      if (!existing.rows[0]) {
        return res.status(404).json({ error: 'Cita no encontrada' })
      }

      if (!barber_id || !service_id || !client_name || !client_phone || !scheduled_at) {
        return res.status(400).json({ error: 'Faltan campos obligatorios' })
      }

      if (toColombiaDate(scheduled_at) < new Date()) {
        return res.status(400).json({ error: 'La fecha de la cita no puede ser en el pasado' })
      }

      // Mismas validaciones que create(): horario de atención + día que trabaja el barbero
      const scheduleError = await validateSchedule(req.barbershop.id, barber_id, scheduled_at)
      if (scheduleError) {
        return res.status(400).json({ error: scheduleError })
      }

      // Disponibilidad del barbero, excluyendo esta misma cita del choque de horario
      const available = await AppointmentModel.checkAvailability({
        barbershop_id: req.barbershop.id,
        barber_id, service_id, scheduled_at,
        exclude_id: id,
      })
      if (!available) {
        return res.status(409).json({ error: 'El barbero ya tiene una cita en ese horario. Elegí otro horario.' })
      }

      const result = await pool.query(
        `UPDATE appointments
         SET barber_id = $1, service_id = $2, client_name = $3, client_phone = $4,
             client_email = $5, scheduled_at = $6, notes = $7
         WHERE id = $8 AND barbershop_id = $9
         RETURNING *`,
        [barber_id, service_id, client_name, client_phone, client_email, scheduled_at, notes, id, req.barbershop.id]
      )

      res.json({ appointment: result.rows[0] })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Error actualizando cita' })
    }
  },

  async updateStatus(req, res) {
    try {
      const { status } = req.body
      const validStatuses = ['pending', 'confirmed', 'cancelled', 'done']

      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Estado inválido' })
      }

      const appointment = await AppointmentModel.updateStatus(
        req.params.id,
        req.barbershop.id,
        status
      )

      if (!appointment) return res.status(404).json({ error: 'Cita no encontrada' })
      res.json({ appointment })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Error actualizando cita' })
    }
  },

  async remove(req, res) {
    try {
      const appointment = await AppointmentModel.delete(req.params.id, req.barbershop.id)
      if (!appointment) return res.status(404).json({ error: 'Cita no encontrada' })
      res.json({ message: 'Cita eliminada' })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Error eliminando cita' })
    }
  },

  async remind(req, res) {
    try {
      const infoResult = await pool.query(
        `SELECT a.client_name, a.client_email, a.scheduled_at,
                b.name AS barber_name, s.name AS service_name,
                sh.name AS barbershop_name
         FROM appointments a
         LEFT JOIN barbers   b  ON a.barber_id     = b.id
         LEFT JOIN services  s  ON a.service_id    = s.id
         JOIN barbershops    sh ON a.barbershop_id = sh.id
         WHERE a.id = $1 AND a.barbershop_id = $2`,
        [req.params.id, req.barbershop.id]
      )
      const appt = infoResult.rows[0]
      if (!appt) return res.status(404).json({ error: 'Cita no encontrada' })

      if (!appt.client_email) {
        return res.status(400).json({ error: 'Esta cita no tiene correo registrado. Agrega uno para poder enviar el recordatorio.' })
      }

      await enviarRecordatorioCita({
        clienteEmail:   appt.client_email,
        clienteNombre:  appt.client_name,
        barberiaNombre: appt.barbershop_name,
        barberoNombre:  appt.barber_name,
        servicioNombre: appt.service_name,
        fechaHora:      appt.scheduled_at,
      })

      res.json({ message: 'Recordatorio enviado' })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'No se pudo enviar el recordatorio. Intenta de nuevo.' })
    }
  }
}

module.exports = AppointmentsController