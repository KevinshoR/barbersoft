const { GoogleGenerativeAI } = require('@google/generative-ai')
const pool = require('../config/db')

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

// Protección básica: no dejamos crecer el historial ni los mensajes sin
// límite, para no gastar tokens de más ni recibir payloads gigantes.
const MAX_HISTORY = 12
const MAX_MESSAGE_LENGTH = 1000

const FALLBACK_REPLY =
  'En este momento no puedo responder, pero puedes reservar directamente en el botón de agendar o escribir a la barbería.'

function parseWorkDays(str) {
  if (!str) return []
  return String(str).split(',').map(Number).filter(n => !Number.isNaN(n))
}

function formatWorkDays(str) {
  const days = parseWorkDays(str)
  if (days.length === 0) return 'No especificado'
  return days.sort((a, b) => a - b).map(d => DAY_NAMES[d]).join(', ')
}

// Contexto real de la barbería: se arma con los mismos datos que ya expone
// la reserva pública (servicios activos, barberos activos, horarios).
async function buildShopContext(slug) {
  const shopResult = await pool.query(
    'SELECT id, name, address, department, municipality, phone FROM barbershops WHERE slug = $1',
    [slug]
  )
  const shop = shopResult.rows[0]
  if (!shop) return null

  const [servicesResult, barbersResult, hoursResult] = await Promise.all([
    pool.query(
      'SELECT name, duration_min, price FROM services WHERE barbershop_id = $1 AND active = true ORDER BY name ASC',
      [shop.id]
    ),
    pool.query(
      'SELECT name, specialty, work_days FROM barbers WHERE barbershop_id = $1 AND active = true ORDER BY name ASC',
      [shop.id]
    ),
    pool.query(
      'SELECT day_of_week, open_time, close_time, is_open FROM business_hours WHERE barbershop_id = $1 ORDER BY day_of_week ASC',
      [shop.id]
    ),
  ])

  const ubicacion = [shop.address, shop.municipality, shop.department].filter(Boolean).join(', ') || 'No especificada'

  const serviciosTxt = servicesResult.rows.length
    ? servicesResult.rows
        .map(s => `- ${s.name}: $${Number(s.price).toLocaleString('es-CO')} · ${s.duration_min} min`)
        .join('\n')
    : 'No hay servicios registrados todavía.'

  const barberosTxt = barbersResult.rows.length
    ? barbersResult.rows
        .map(b => `- ${b.name}${b.specialty ? ' (' + b.specialty + ')' : ''} · trabaja: ${formatWorkDays(b.work_days)}`)
        .join('\n')
    : 'No hay barberos activos registrados todavía.'

  const horariosTxt = hoursResult.rows.length
    ? hoursResult.rows
        .map(h => `- ${DAY_NAMES[h.day_of_week]}: ${h.is_open ? `${h.open_time.slice(0, 5)} a ${h.close_time.slice(0, 5)}` : 'Cerrado'}`)
        .join('\n')
    : 'Horario no configurado todavía.'

  return `Eres el asistente virtual de la barbería "${shop.name}".
Ubicación: ${ubicacion}${shop.phone ? `\nTeléfono: ${shop.phone}` : ''}

SERVICIOS Y PRECIOS:
${serviciosTxt}

BARBEROS:
${barberosTxt}

HORARIO DE ATENCIÓN:
${horariosTxt}`
}

// Contexto genérico para el chat del landing de Barbersoft (no es de una
// barbería en particular). No inventa precios de planes.
function buildLandingContext() {
  return `Eres el asistente virtual de Barbersoft, un software (SaaS) de reservas y gestión para barberías.

QUÉ ES BARBERSOFT:
- Permite a una barbería gestionar sus citas, barberos, servicios y horarios, y recibir reservas online de sus clientes desde una página pública propia.
- Incluye un panel de administración web y una app móvil para el dueño o administrador de la barbería.

CÓMO REGISTRARSE:
- Desde el botón de registro/crear cuenta en la página, con el nombre de la barbería, un email y una contraseña. Al registrarse arranca un período de prueba.

PLANES:
- No tengo el detalle exacto de los precios de los planes en este momento. Invita a la persona a revisar la sección de planes/suscripción en la página para ver los precios actualizados.`
}

function buildSystemPrompt(context) {
  return `Eres el asistente virtual de Barbersoft. Respondes siempre en español colombiano, con un tono amable y profesional.

Puedes: responder dudas sobre servicios, precios, horarios, barberos y ubicación; explicar cómo reservar una cita guiando al botón o formulario de reserva; dar soporte básico sobre el uso de la plataforma.

Nunca inventes datos (precios, horarios, nombres) que no estén en el contexto de abajo. Si no sabes algo, dilo con honestidad y sugiere contactar directamente a la barbería.

Responde de forma breve y clara, normalmente entre 2 y 4 frases.

CONTEXTO:
${context}`
}

function toGeminiRole(role) {
  return role === 'assistant' || role === 'model' || role === 'bot' ? 'model' : 'user'
}

function sanitizeMessages(messages) {
  if (!Array.isArray(messages)) return []
  return messages
    .slice(-MAX_HISTORY)
    .filter(m => m && typeof m.content === 'string' && m.content.trim())
    .map(m => ({
      role: toGeminiRole(m.role),
      content: m.content.trim().slice(0, MAX_MESSAGE_LENGTH),
    }))
}

// Gemini exige que el historial empiece en 'user' y que los roles alternen;
// normalizamos ambas cosas para no depender de que el cliente lo haga bien.
function toGeminiHistory(messages) {
  const trimmed = [...messages]
  while (trimmed.length > 0 && trimmed[0].role !== 'user') trimmed.shift()

  const merged = []
  for (const m of trimmed) {
    const last = merged[merged.length - 1]
    if (last && last.role === m.role) {
      last.parts[0].text += '\n' + m.content
    } else {
      merged.push({ role: m.role, parts: [{ text: m.content }] })
    }
  }
  return merged
}

async function askGemini({ systemPrompt, history, userMessage }) {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY no configurada')

  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    systemInstruction: systemPrompt,
  })
  const chat = model.startChat({ history })
  const result = await chat.sendMessage(userMessage)
  return result.response.text()
}

const ChatbotController = {
  async chat(req, res) {
    try {
      const { slug } = req.params
      const sanitized = sanitizeMessages(req.body?.messages)

      if (sanitized.length === 0) {
        return res.status(400).json({ error: 'Se requiere al menos un mensaje' })
      }
      const lastMessage = sanitized[sanitized.length - 1]
      if (lastMessage.role !== 'user') {
        return res.status(400).json({ error: 'El último mensaje debe ser del usuario' })
      }

      let context
      if (!slug || slug === 'landing') {
        context = buildLandingContext()
      } else {
        context = await buildShopContext(slug)
        if (!context) return res.status(404).json({ error: 'Barbería no encontrada' })
      }

      const systemPrompt = buildSystemPrompt(context)
      const geminiHistory = toGeminiHistory(sanitized.slice(0, -1))

      let reply
      try {
        reply = await askGemini({
          systemPrompt,
          history: geminiHistory,
          userMessage: lastMessage.content,
        })
      } catch (geminiErr) {
        console.error('[Chatbot] Error llamando a Gemini:', geminiErr.message)
        reply = FALLBACK_REPLY
      }

      res.json({ reply })
    } catch (err) {
      console.error('[Chatbot] Error inesperado:', err)
      res.json({ reply: FALLBACK_REPLY })
    }
  },
}

module.exports = ChatbotController
