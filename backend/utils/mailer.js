const nodemailer = require('nodemailer')
const dns        = require('dns')

const GOLD  = '#C9A84C'
const BLACK = '#0D0D0D'
const CREAM = '#F5F0E8'

let transporter = null

// Creamos el transporter de forma asíncrona: primero resolvemos la IP IPv4 de
// Gmail (smtp.gmail.com) y se la pasamos DIRECTA a nodemailer como host. Así
// nodemailer nunca hace DNS y no hay forma de que use IPv6.
// Esta es la solución al bug de Render donde IPv6 se resuelve pero no conecta.
async function initTransporter() {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.log('Gmail SMTP sin configurar — correo no enviado')
    return
  }

  try {
    // resolve4 devuelve SOLO direcciones IPv4 (a diferencia de lookup, que
    // puede devolver IPv6 según config del sistema).
    const ipv4Addresses = await dns.promises.resolve4('smtp.gmail.com')
    const smtpIP = ipv4Addresses[0]
    console.log(`[Mail] smtp.gmail.com resuelto a IPv4: ${smtpIP}`)

    transporter = nodemailer.createTransport({
      host:   smtpIP,                // ← IP directa IPv4, no hostname
      port:   465,
      secure: true,
      // Como usamos IP directa pero el certificado TLS es para 'smtp.gmail.com',
      // hay que decirle a TLS que valide contra el hostname, no la IP.
      tls: {
        servername: 'smtp.gmail.com',
      },
      auth: {
        user: process.env.MAIL_USER,
        pass: (process.env.MAIL_PASS || '').replace(/\s/g, ''),
      },
      connectionTimeout: 20000,
      greetingTimeout:   20000,
      socketTimeout:     30000,
      pool: true,
      maxConnections: 3,
    })

    // Verificamos que Gmail acepta el login.
    try {
      await transporter.verify()
      console.log('[Mail] Gmail SMTP verificado y listo para enviar')
    } catch (verifyErr) {
      console.error('[Mail] ⚠ Gmail SMTP falló la verificación:', verifyErr.message)
    }
  } catch (dnsErr) {
    console.error('[Mail] ⚠ No se pudo resolver smtp.gmail.com a IPv4:', dnsErr.message)
  }
}

// Ejecutamos el init pero no esperamos: el servidor arranca en paralelo.
// Si el correo llega antes de que initTransporter termine, enviarCorreo esperará.
const transporterReady = initTransporter()

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
  // Espera a que initTransporter termine (resolver IP + verify). Si ya terminó
  // hace tiempo, esto resuelve al instante. Si el correo llega justo al arrancar,
  // le da chance al init.
  await transporterReady

  if (!transporter) {
    console.log('Gmail SMTP sin configurar — correo no enviado')
    return
  }
  if (!to) return

  await transporter.sendMail({
    // Fallback: si no está definido MAIL_FROM, usa el propio usuario de Gmail
    // (Gmail rechaza el envío si el 'from' está vacío o no coincide).
    from: process.env.MAIL_FROM || `Barbersoft <${process.env.MAIL_USER}>`,
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
  enviarCorreo,
  enviarConfirmacionCliente,
  enviarAvisoBarbero,
  enviarRecordatorioCita,
}