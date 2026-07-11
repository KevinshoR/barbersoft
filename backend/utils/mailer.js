const nodemailer = require('nodemailer')

const GOLD  = '#C9A84C'
const BLACK = '#0D0D0D'
const CREAM = '#F5F0E8'

let transporter = null

if (process.env.MAIL_USER && process.env.MAIL_PASS) {
  transporter = nodemailer.createTransport({
    host:   'smtp.gmail.com',
    port:   465,
    secure: true,
    auth: {
      user: process.env.MAIL_USER,
      pass: (process.env.MAIL_PASS || '').replace(/\s/g, ''),
    },
  })
} else {
  console.log('Gmail SMTP sin configurar — correo no enviado')
}

function formatFecha(fechaHora) {
  return new Date(fechaHora).toLocaleString('es-CO', {
    weekday: 'long',
    day:     'numeric',
    month:   'long',
    hour:    '2-digit',
    minute:  '2-digit',
  })
}

function layout({ barberiaNombre, bodyHtml }) {
  return `
    <div style="font-family:'DM Sans',Arial,sans-serif;max-width:480px;margin:0 auto;background:${BLACK};border-radius:16px;overflow:hidden">
      <div style="background:#161616;padding:32px;text-align:center;border-bottom:1px solid #2A2A2A">
        <p style="font-size:32px;margin:0 0 8px">✂</p>
        <h1 style="font-size:22px;font-weight:900;color:${CREAM};margin:0">${barberiaNombre}</h1>
      </div>
      <div style="padding:36px 32px;background:${CREAM};color:#1A1A1A">
        ${bodyHtml}
      </div>
      <div style="padding:18px 32px;text-align:center;font-size:12px;color:#8A8A8A;background:${BLACK}">
        ${barberiaNombre} · vía Barbersoft
      </div>
    </div>
  `
}

function detailRow(label, value, last) {
  return `
    <tr>
      <td style="padding:10px 0;${last ? '' : 'border-bottom:1px solid #E5DDD0;'}color:#6B6B6B;font-size:13px">${label}</td>
      <td style="padding:10px 0;${last ? '' : 'border-bottom:1px solid #E5DDD0;'}text-align:right;font-weight:700;color:#1A1A1A">${value}</td>
    </tr>
  `
}

async function enviarCorreo({ to, subject, html }) {
  if (!transporter) {
    console.log('Gmail SMTP sin configurar — correo no enviado')
    return
  }
  if (!to) return

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to,
    subject,
    html,
  })
}

async function enviarConfirmacionCliente({ clienteEmail, clienteNombre, barberiaNombre, barberoNombre, servicioNombre, fechaHora }) {
  const fecha = formatFecha(fechaHora)
  const bodyHtml = `
    <p style="font-size:16px;margin:0 0 20px">Hola <strong>${clienteNombre}</strong>, tu cita ha sido confirmada.</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
      ${detailRow('Servicio', servicioNombre)}
      ${detailRow('Barbero', barberoNombre)}
      ${detailRow('Fecha y hora', fecha, true)}
    </table>
    <p style="font-size:14px;color:#4A4A4A;margin:0">Te esperamos en <strong>${barberiaNombre}</strong>. ¡Gracias por confiar en nosotros!</p>
  `
  await enviarCorreo({
    to: clienteEmail,
    subject: `✂️ Tu cita en ${barberiaNombre} está confirmada`,
    html: layout({ barberiaNombre, bodyHtml }),
  })
}

async function enviarAvisoBarbero({ barberiaEmail, barberiaNombre, clienteNombre, clienteTelefono, servicioNombre, fechaHora }) {
  const fecha = formatFecha(fechaHora)
  const bodyHtml = `
    <p style="font-size:16px;margin:0 0 20px">Tienes una nueva cita.</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
      ${detailRow('Cliente', clienteNombre)}
      ${detailRow('Teléfono', clienteTelefono)}
      ${detailRow('Servicio', servicioNombre)}
      ${detailRow('Fecha y hora', fecha, true)}
    </table>
    <p style="font-size:14px;color:#4A4A4A;margin:0">Revisa tu agenda en Barbersoft para más detalles.</p>
  `
  await enviarCorreo({
    to: barberiaEmail,
    subject: `📅 Nueva reserva en ${barberiaNombre}`,
    html: layout({ barberiaNombre, bodyHtml }),
  })
}

async function enviarRecordatorioCita({ clienteEmail, clienteNombre, barberiaNombre, barberoNombre, servicioNombre, fechaHora }) {
  const fecha = formatFecha(fechaHora)
  const bodyHtml = `
    <p style="font-size:16px;margin:0 0 20px">Hola <strong>${clienteNombre}</strong>, te recordamos tu cita en una hora.</p>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
      ${detailRow('Servicio', servicioNombre)}
      ${detailRow('Barbero', barberoNombre)}
      ${detailRow('Fecha y hora', fecha, true)}
    </table>
    <p style="font-size:14px;color:#4A4A4A;margin:0">Te esperamos en <strong>${barberiaNombre}</strong>.</p>
  `
  await enviarCorreo({
    to: clienteEmail,
    subject: `⏰ Recordatorio de tu cita en ${barberiaNombre}`,
    html: layout({ barberiaNombre, bodyHtml }),
  })
}

module.exports = {
  enviarConfirmacionCliente,
  enviarAvisoBarbero,
  enviarRecordatorioCita,
}
