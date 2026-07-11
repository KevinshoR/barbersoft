const AppointmentModel = require('../models/appointment.model')
const pool              = require('../config/db')
const { enviarConfirmacionCliente, enviarAvisoBarbero } = require('../utils/mailer')

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

    if (new Date(scheduled_at) < new Date()) {
      return res.status(400).json({ error: 'La fecha de la cita no puede ser en el pasado' })
    }

    // Verificar horario de atención
    const HoursModel = require('../models/hours.model')
    const hoursCheck = await HoursModel.checkOpen(req.barbershop.id, scheduled_at)
    if (!hoursCheck.open) {
      return res.status(400).json({ error: hoursCheck.reason })
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
  }
}

module.exports = AppointmentsController