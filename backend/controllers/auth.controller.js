const pool         = require('../config/db')
const bcrypt       = require('bcryptjs')
const jwt          = require('jsonwebtoken')
const UserModel    = require('../models/user.model')
const ServiceModel = require('../models/service.model')
const HoursModel   = require('../models/hours.model')
const { Resend } = require('resend')
const crypto    = require('crypto')

const resend = new Resend(process.env.RESEND_API_KEY)

// Convierte el nombre en slug: "Mi Barbería" → "mi-barberia"
function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

// Reglas de fuerza de contraseña (deben coincidir con
// frontend/src/utils/passwordValidation.js). Devuelve un mensaje de error
// describiendo qué falta, o null si la contraseña es válida. No confiamos
// solo en la validación del frontend.
function validatePassword(password, email) {
  if (!password) return 'La contraseña es obligatoria'

  const missing = []
  if (password.length < 8) missing.push('mínimo 8 caracteres')
  if (!/[A-Z]/.test(password)) missing.push('al menos 1 letra mayúscula')
  if (!/[a-z]/.test(password)) missing.push('al menos 1 letra minúscula')
  if (!/[0-9]/.test(password)) missing.push('al menos 1 número')
  if (!/[^A-Za-z0-9]/.test(password)) missing.push('al menos 1 carácter especial')

  if (missing.length > 0) {
    return `La contraseña debe tener ${missing.join(', ')}`
  }

  if (email && password.toLowerCase() === email.toLowerCase()) {
    return 'La contraseña no puede ser igual al email'
  }

  return null
}

const AuthController = {

  async register(req, res) {
    try {
      const { name, email, password, phone, address, department, municipality } = req.body

      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Nombre, email y contraseña son obligatorios' })
      }

      const passwordError = validatePassword(password, email)
      if (passwordError) {
        return res.status(400).json({ error: passwordError })
      }

      // Verificar si el email ya existe
      const existing = await UserModel.findByEmail(email)
      if (existing) {
        return res.status(400).json({ error: 'Ya existe una cuenta con ese email' })
      }

      // Generar slug único
      let slug = generateSlug(name)
      const slugTaken = await UserModel.slugExists(slug)
      if (slugTaken) slug = `${slug}-${Date.now()}`

      // Encriptar contraseña
      const hashedPassword = await bcrypt.hash(password, 10)

      // Barbería + servicios y horarios por defecto se crean de forma atómica:
      // si algo falla (p.ej. el insert de horarios), no debe quedar una
      // barbería a medias sin sus filas de servicios/horarios.
      const client = await pool.connect()
      let barbershop
      try {
        await client.query('BEGIN')

        barbershop = await UserModel.create({
          name, email,
          password: hashedPassword,
          phone, address, slug,
          department: department ?? null,
          municipality: municipality ?? null
        }, client)

        await ServiceModel.createDefaults(barbershop.id, client)
        await HoursModel.createDefaults(barbershop.id, client)

        await client.query('COMMIT')
      } catch (err) {
        await client.query('ROLLBACK')
        throw err
      } finally {
        client.release()
      }

      // Generar token
      const token = jwt.sign(
        { id: barbershop.id, email: barbershop.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      )

      res.status(201).json({ token, barbershop })

    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Error al registrar la barbería' })
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body

      if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son obligatorios' })
      }

      const barbershop = await UserModel.findByEmail(email)
      if (!barbershop) {
        return res.status(401).json({ error: 'Email o contraseña incorrectos' })
      }

      const validPassword = await bcrypt.compare(password, barbershop.password)
      if (!validPassword) {
        return res.status(401).json({ error: 'Email o contraseña incorrectos' })
      }

      const token = jwt.sign(
        { id: barbershop.id, email: barbershop.email },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      )

      // No devolver la contraseña
      const { password: _, ...barbershopData } = barbershop

      res.json({ token, barbershop: barbershopData })

    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Error al iniciar sesión' })
    }
  },
  async forgotPassword(req, res) {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ error: 'Email obligatorio' })

   const result = await pool.query(
  'SELECT id, name, email FROM barbershops WHERE email = $1',
  [email]
)

if (!result.rows[0]) {
  return res.status(404).json({ error: 'No encontramos ninguna cuenta con ese email. Verificá que sea el correcto o registrate.' })
}

// Obtener todos los admins (máximo 3)
const allAdmins = await pool.query(
  'SELECT email, name FROM barbershops ORDER BY created_at ASC LIMIT 3'
) 

    const shop  = result.rows[0]
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hora

    // Invalidar tokens anteriores
    await pool.query(
      'UPDATE password_resets SET used = true WHERE email = $1',
      [email]
    )

    await pool.query(
      'INSERT INTO password_resets (email, token, expires_at) VALUES ($1, $2, $3)',
      [email, token, expires]
    )

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`

    await resend.emails.send({
  from:    'Barbersoft <onboarding@resend.dev>',
  to:      allAdmins.rows.map(a => a.email),
  subject: 'Recuperar contraseña — Barbersoft',
      html: `
        <div style="font-family:'DM Sans',Arial,sans-serif;max-width:480px;margin:0 auto;background:#111;color:#F5F0E8;border-radius:16px;overflow:hidden">
          <div style="background:#161616;padding:32px;text-align:center;border-bottom:1px solid #2A2A2A">
            <p style="font-size:32px;margin:0 0 8px">✂</p>
            <h1 style="font-size:22px;font-weight:900;color:#F5F0E8;margin:0">Barber<span style="color:#C9A84C">SaaS</span></h1>
          </div>
          <div style="padding:36px 32px">
            <h2 style="font-size:20px;color:#F5F0E8;margin:0 0 12px">Hola, ${shop.name}</h2>
            <p style="color:#B8B0A0;font-size:14px;line-height:1.7;margin:0 0 28px">
              Recibimos una solicitud para restablecer la contraseña de tu cuenta.
              Si no fuiste vos, podés ignorar este email.
            </p>
            <a href="${resetUrl}"
               style="display:block;background:#C9A84C;color:#0A0A0A;text-align:center;padding:14px 0;border-radius:10px;font-size:13px;font-weight:700;letter-spacing:0.08em;text-decoration:none">
              RESTABLECER CONTRASEÑA
            </a>
            <p style="color:#555;font-size:12px;margin:20px 0 0;text-align:center">
              Este enlace vence en 1 hora.
            </p>
          </div>
          <div style="padding:20px 32px;border-top:1px solid #2A2A2A;text-align:center">
            <p style="color:#555;font-size:11px;margin:0">BarberSaaS · Software para barberías en Colombia</p>
          </div>
        </div>
      `
    })

    res.json({ message: 'Si ese email existe, recibirás un enlace en minutos.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error enviando el email' })
  }
},

async resetPassword(req, res) {
  try {
    const { token, password } = req.body

    if (!token || !password) {
      return res.status(400).json({ error: 'Token y contraseña son obligatorios' })
    }

    const result = await pool.query(
      `SELECT * FROM password_resets
       WHERE token = $1 AND used = false AND expires_at > NOW()`,
      [token]
    )

    if (!result.rows[0]) {
      return res.status(400).json({ error: 'El enlace es inválido o ya venció. Solicitá uno nuevo.' })
    }

    const reset = result.rows[0]

    const passwordError = validatePassword(password, reset.email)
    if (passwordError) {
      return res.status(400).json({ error: passwordError })
    }

    const hashed = await bcrypt.hash(password, 10)

    await pool.query(
      'UPDATE barbershops SET password = $1 WHERE email = $2',
      [hashed, reset.email]
    )

    await pool.query(
      'UPDATE password_resets SET used = true WHERE token = $1',
      [token]
    )

    res.json({ message: 'Contraseña actualizada correctamente. Ya podés iniciar sesión.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error actualizando la contraseña' })
  }
},

async updateProfile(req, res) {
  try {
    const { name, phone, address, department, municipality } = req.body
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'El nombre es obligatorio' })
    }

    const result = await pool.query(
      `UPDATE barbershops
       SET name         = $1,
           phone        = COALESCE($2, phone),
           address      = COALESCE($3, address),
           department   = COALESCE($4, department),
           municipality = COALESCE($5, municipality)
       WHERE id = $6
       RETURNING id, name, email, phone, address, slug, department, municipality,
                 subscription_status, trial_ends_at, subscription_ends_at`,
      [name.trim(), phone ?? null, address ?? null, department ?? null, municipality ?? null, req.barbershop.id]
    )

    res.json({ barbershop: result.rows[0] })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error actualizando perfil' })
  }
},

  async me(req, res) {
    try {
      const barbershop = await UserModel.findById(req.barbershop.id)
      if (!barbershop) {
        return res.status(404).json({ error: 'Barbería no encontrada' })
      }
      res.json({ barbershop })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Error obteniendo perfil' })
    }
    const result = await pool.query(
  `SELECT id, name, email, phone, address, slug,
          subscription_status, trial_ends_at, subscription_ends_at, current_plan
   FROM barbershops WHERE id = $1`,
  [id]
)
  }
  


}



module.exports = AuthController