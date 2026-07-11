const cron             = require('node-cron')
const pool              = require('../config/db')
const AppointmentModel = require('../models/appointment.model')
const { enviarRecordatorioCita } = require('../utils/mailer')

async function findPendingRemindersWithDetails() {
  const result = await pool.query(
    `SELECT a.id, a.client_name, a.client_email, a.scheduled_at,
            b.name  AS barber_name,
            s.name  AS service_name,
            sh.name AS barbershop_name
     FROM appointments a
     LEFT JOIN barbers   b  ON a.barber_id     = b.id
     LEFT JOIN services  s  ON a.service_id    = s.id
     JOIN barbershops    sh ON a.barbershop_id = sh.id
     WHERE a.status        = 'pending'
       AND a.reminder_sent = false
       AND a.scheduled_at BETWEEN NOW() + INTERVAL '55 minutes'
                     AND NOW() + INTERVAL '65 minutes'`
  )
  return result.rows
}

async function sendReminders() {
  console.log('[Recordatorios] Revisando citas próximas...')
  try {
    const appointments = await findPendingRemindersWithDetails()
    if (appointments.length === 0) {
      console.log('[Recordatorios] No hay citas para recordar.')
      return
    }
    for (const appt of appointments) {
      try {
        await enviarRecordatorioCita({
          clienteEmail:   appt.client_email,
          clienteNombre:  appt.client_name,
          barberiaNombre: appt.barbershop_name,
          barberoNombre:  appt.barber_name,
          servicioNombre: appt.service_name,
          fechaHora:      appt.scheduled_at,
        })
        await AppointmentModel.markReminderSent(appt.id)
        console.log('[Recordatorios] Enviado a:', appt.client_name, appt.client_email)
      } catch (err) {
        console.error('[Recordatorios] Error enviando a', appt.client_name, ':', err.message)
      }
    }
  } catch (err) {
    console.error('[Recordatorios] Error general:', err.message)
  }
}

cron.schedule('0 * * * *', sendReminders)

if (process.env.TEST_REMINDERS === 'true') {
  sendReminders()
}

console.log('[Recordatorios] Job iniciado — corre cada hora')

module.exports = { sendReminders }
