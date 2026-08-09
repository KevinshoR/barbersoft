// backend/controllers/google.controller.js
// Login/registro con Google (One Tap / Sign in with Google).
//
// Flujo:
//   1) El frontend obtiene un ID token de Google (JWT firmado por Google) y lo
//      manda a /api/auth/google/verify.
//   2) Aquí verificamos ese token contra Google usando google-auth-library
//      (valida firma, audience = nuestro Client ID, y no expiración).
//   3) Si el email ya tiene barbería → devolvemos JWT propio (login exitoso).
//   4) Si NO existe → devolvemos { needsRegistration: true, prefill: {...} }
//      con nombre + email extraídos de Google. El frontend abre el formulario
//      de registro con esos campos prellenados y bloqueados, y el usuario
//      completa teléfono, departamento y municipio antes de registrarse.
//
// NO se crea la barbería a medias en este paso: mantiene la BD limpia y evita
// registros basura si el usuario abandona el flujo. Al enviar el formulario,
// el frontend llama a /api/auth/google/register con los datos completos + el
// mismo ID token de Google, y aquí se valida de nuevo y se crea la cuenta
// (sin password, con un flag google_linked = true).

const { OAuth2Client } = require('google-auth-library')
const jwt              = require('jsonwebtoken')
const bcrypt           = require('bcryptjs')
const crypto           = require('crypto')
const pool             = require('../config/db')
const UserModel        = require('../models/user.model')

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID
const client = new OAuth2Client(GOOGLE_CLIENT_ID)

// Slug único a partir del nombre (mismo criterio que el registro normal).
function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60) || 'barberia'
}

async function uniqueSlug(base) {
  let slug = base
  let n = 1
  while (true) {
    const r = await pool.query('SELECT 1 FROM barbershops WHERE slug = $1', [slug])
    if (r.rows.length === 0) return slug
    n += 1
    slug = `${base}-${n}`
  }
}

function generateReferralCode() {
  return crypto.randomBytes(4).toString('hex').toUpperCase().slice(0, 8)
}

// Valida el ID token de Google y devuelve el payload verificado, o lanza.
async function verifyGoogleToken(idToken) {
  if (!GOOGLE_CLIENT_ID) {
    const err = new Error('GOOGLE_CLIENT_ID no está configurado en el servidor')
    err.code = 'NO_CONFIG'
    throw err
  }
  const ticket = await client.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  })
  const payload = ticket.getPayload()
  if (!payload?.email) {
    const err = new Error('Token de Google sin email')
    err.code = 'BAD_TOKEN'
    throw err
  }
  if (payload.email_verified === false) {
    const err = new Error('El correo de Google no está verificado')
    err.code = 'UNVERIFIED_EMAIL'
    throw err
  }
  return payload
}

function signAppToken(barbershop) {
  return jwt.sign(
    { id: barbershop.id, email: barbershop.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  )
}

const GoogleController = {
  // POST /api/auth/google/verify
  // Body: { id_token }
  // Decide entre login (si ya existe) o requiere completar registro.
  async verify(req, res) {
    try {
      const { id_token } = req.body || {}
      if (!id_token) return res.status(400).json({ error: 'Falta id_token' })

      const payload = await verifyGoogleToken(id_token)
      const email   = payload.email.toLowerCase().trim()
      const name    = payload.name || (payload.given_name ? `${payload.given_name} ${payload.family_name || ''}`.trim() : '')

      const existing = await UserModel.findByEmail(email)
      if (existing) {
        // Login exitoso: devolvemos JWT propio, igual que el login normal.
        const token = signAppToken(existing)
        const { password: _, ...barbershopData } = existing
        return res.json({ token, barbershop: barbershopData, mode: 'login' })
      }

      // Cuenta nueva: aún no la creamos. El frontend debe pedir los campos
      // que faltan (teléfono, departamento, municipio) y llamar a /register.
      return res.json({
        mode: 'needs_registration',
        prefill: {
          name:  name || 'Mi Barbería',
          email,
        },
      })
    } catch (err) {
      if (err.code === 'NO_CONFIG')      return res.status(500).json({ error: 'Google Sign-In no está configurado en el servidor' })
      if (err.code === 'UNVERIFIED_EMAIL') return res.status(400).json({ error: 'Tu correo de Google no está verificado' })
      console.error('[auth/google/verify] error:', err.message)
      return res.status(401).json({ error: 'No se pudo validar la sesión con Google' })
    }
  },

  // POST /api/auth/google/register
  // Body: { id_token, name, phone, department, municipality, referral_code_usado? }
  // Crea la barbería usando el email verificado por Google (sin password).
  async register(req, res) {
    const { id_token, name, phone, department, municipality, referral_code_usado } = req.body || {}

    if (!id_token) return res.status(400).json({ error: 'Falta id_token' })
    if (!name || !name.trim()) return res.status(400).json({ error: 'El nombre de la barbería es obligatorio' })
    if (!department || !String(department).trim()) return res.status(400).json({ error: 'El departamento es obligatorio' })
    if (!municipality || !String(municipality).trim()) return res.status(400).json({ error: 'El municipio es obligatorio' })
    if (!phone || phone.trim().length < 7) return res.status(400).json({ error: 'Teléfono inválido' })

    let payload
    try {
      payload = await verifyGoogleToken(id_token)
    } catch (err) {
      if (err.code === 'NO_CONFIG')        return res.status(500).json({ error: 'Google Sign-In no está configurado en el servidor' })
      if (err.code === 'UNVERIFIED_EMAIL') return res.status(400).json({ error: 'Tu correo de Google no está verificado' })
      return res.status(401).json({ error: 'No se pudo validar la sesión con Google' })
    }
    const email = payload.email.toLowerCase().trim()

    // Referido opcional: solo se acepta si existe otra barbería con ese código.
    let referredByCode = null
    if (referral_code_usado && String(referral_code_usado).trim()) {
      const codeUp = String(referral_code_usado).trim().toUpperCase()
      const referrer = await pool.query('SELECT id FROM barbershops WHERE referral_code = $1', [codeUp])
      if (referrer.rows.length > 0) referredByCode = codeUp
    }

    const client_ = await pool.connect()
    try {
      await client_.query('BEGIN')

      const existing = await client_.query('SELECT id FROM barbershops WHERE email = $1', [email])
      if (existing.rows.length > 0) {
        await client_.query('ROLLBACK')
        // Si ya existe, tratamos como login (no error) — mismo trato que /verify.
        const user  = await UserModel.findByEmail(email)
        const token = signAppToken(user)
        const { password: _, ...barbershopData } = user
        return res.json({ token, barbershop: barbershopData, mode: 'login' })
      }

      const slug = await uniqueSlug(slugify(name))

      // Password aleatoria (Google es la fuente de verdad para autenticar).
      // Guardamos hash igual, para que el registro no dependa de columnas nuevas.
      const randomPass = crypto.randomBytes(24).toString('base64')
      const hash       = await bcrypt.hash(randomPass, 10)

      const inserted = await client_.query(
        `INSERT INTO barbershops (name, email, password, phone, slug, department, municipality)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, name, email, phone, slug, department, municipality,
                   subscription_status, trial_ends_at, is_super_admin`,
        [name.trim(), email, hash, phone.trim(), slug, department, municipality]
      )
      const barbershop = inserted.rows[0]

      // Referral code propio + campo referred_by (igual que en registro normal)
      const referralCode = generateReferralCode()
      await client_.query(
        'UPDATE barbershops SET referral_code = $1, referred_by = $2 WHERE id = $3',
        [referralCode, referredByCode, barbershop.id]
      )
      barbershop.referral_code = referralCode
      barbershop.referred_by   = referredByCode

      // Semilla mínima para que la barbería tenga sus filas base
      // (mismo criterio que el registro normal — 1 barbero, 1 servicio, horarios).
      // El backend ya tiene esa lógica en auth.controller; si prefieres no repetirla,
      // este endpoint solo crea la barbería y el usuario configura desde el panel.
      // Aquí lo dejamos mínimo para mantener el archivo autónomo:
      for (let dow = 0; dow < 7; dow++) {
        const isOpen = dow >= 1 && dow <= 6 // Lunes a sábado
        await client_.query(
          `INSERT INTO business_hours (barbershop_id, day_of_week, open_time, close_time, is_open)
           VALUES ($1, $2, '09:00', '19:00', $3)`,
          [barbershop.id, dow, isOpen]
        )
      }

      await client_.query('COMMIT')

      const token = signAppToken(barbershop)
      res.status(201).json({ token, barbershop, mode: 'register' })
    } catch (err) {
      await client_.query('ROLLBACK')
      console.error('[auth/google/register] error:', err)
      res.status(500).json({ error: 'No se pudo crear la barbería con Google' })
    } finally {
      client_.release()
    }
  },
}

module.exports = GoogleController
