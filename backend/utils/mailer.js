// mailer.js
// Envío de correos vía API HTTP de Brevo (reemplaza el SMTP de Gmail).
// Motivo: Render bloquea los puertos SMTP salientes (25/465/587) como política
// anti-spam, así que era imposible enviar por SMTP. La API HTTP de Brevo sí sale.
// 0 dependencias nuevas: usa el fetch nativo de Node 18+.

const GOLD  = '#C9A84C'
const BLACK = '#0D0D0D'
const CREAM = '#F5F0E8'

// Remitente. IMPORTANTE: el email debe estar VALIDADO como remitente en Brevo.
// El correo con el que creaste la cuenta de Brevo ya viene validado por defecto.
// Config por variables de entorno en Render:
//   MAIL_FROM_EMAIL  → email remitente validado en Brevo
//   MAIL_FROM_NAME   → nombre que ve el cliente (opcional, default 'Barbersoft')
const FROM_EMAIL = process.env.MAIL_FROM_EMAIL || process.env.MAIL_USER || ''
const FROM_NAME  = process.env.MAIL_FROM_NAME  || 'Barbersoft'

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

// Núcleo de envío. Misma firma que antes: { to, subject, html }.
// Ningún otro archivo que llame a enviarCorreo necesita cambiar.
async function enviarCorreo({ to, subject, html }) {
  if (!process.env.BREVO_API_KEY) {
    console.log('Brevo sin configurar (falta BREVO_API_KEY) — correo no enviado')
    return
  }
  if (!FROM_EMAIL) {
    console.log('Remitente sin configurar (falta MAIL_FROM_EMAIL) — correo no enviado')
    return
  }
  if (!to) return

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept':       'application/json',
        'api-key':      process.env.BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        sender: { name: FROM_NAME, email: FROM_EMAIL },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    })

    if (!res.ok) {
      const body = await res.text()
      console.error(`[Mail] Brevo respondió ${res.status}: ${body}`)
      return
    }

    console.log(`[Mail] Correo enviado a ${to} vía Brevo`)
  } catch (err) {
    // No relanzamos: los correos van en segundo plano y un fallo de envío
    // no debe tumbar la operación (crear cita, etc.).
    console.error('[Mail] Error enviando por Brevo:', err.message)
  }
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
