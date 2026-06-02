const cron             = require('node-cron')
const twilio           = require('twilio')
const AppointmentModel = require('../models/appointment.model')

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
)

const FROM = process.env.TWILIO_WHATSAPP_FROM

function formatDateTime(dateStr) {
  return new Date(dateStr).toLocaleString('es-CO', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
    hour:    '2-digit',
    minute:  '2-digit',
  })
}

async function sendReminders() {
  console.log('[Recordatorios] Revisando citas próximas...')
  try {
    const appointments = await AppointmentModel.findPendingReminders()
    if (appointments.length === 0) {
      console.log('[Recordatorios] No hay citas para recordar.')
      return
    }
    for (const appt of appointments) {
      const phone          = appt.client_phone.replace(/\D/g, '')
      const colombianPhone = phone.startsWith('57') ? phone : '57' + phone
      const to             = 'whatsapp:+' + colombianPhone
      const dateStr        = formatDateTime(appt.scheduled_at)

      const message =
        `✂ *${appt.barbershop_name}*\n\n` +
        `Hola ${appt.client_name}, te recordamos que tenés una cita mañana:\n\n` +
        `📅 *${dateStr}*\n\n` +
        `Si necesitás cancelar o reprogramar, contactanos directamente.\n\n` +
        `_BarberSaaS — Sistema de reservas_`

      try {
        await client.messages.create({ from: FROM, to, body: message })
        await AppointmentModel.markReminderSent(appt.id)
        console.log('[Recordatorios] Enviado a:', appt.client_name, to)
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