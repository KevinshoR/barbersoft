const pool = require('../config/db')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const UserModel = require('../models/user.model')

/* ═══════════════════════════════════════════════════════════
   Sincronización con JTool Enterprise (repo: Jtool_Enterprise).

   Cuando el super admin activa un mes de suscripción en JTool,
   ese backend llama a este endpoint para:
   - Crear la barbería automáticamente si no existe (aprovisionamiento)
   - Poner subscription_status = 'active' con la fecha de vencimiento
     que manda JTool (una sola fuente de verdad para las fechas)

   Seguridad: header 'x-sync-secret' debe coincidir con
   JTOOL_SYNC_SECRET del .env (el mismo valor en ambos backends).
═══════════════════════════════════════════════════════════ */

function generateSlug(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

/* Contraseña temporal legible: 10 caracteres sin ambiguos */
function tempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let out = ''
  const bytes = crypto.randomBytes(10)
  for (let i = 0; i < 10; i++) out += chars[bytes[i] % chars.length]
  return out + '!'
}

const SyncController = {
  async subscription(req, res) {
    // ── Autenticación entre servidores ──
    const secret = process.env.JTOOL_SYNC_SECRET
    if (!secret) {
      return res.status(500).json({ error: 'JTOOL_SYNC_SECRET no configurado en Barbersoft' })
    }
    if (req.headers['x-sync-secret'] !== secret) {
      return res.status(401).json({ error: 'No autorizado' })
    }

    const { email, name, phone, access_until, action = 'activate' } = req.body || {}

    if (!email) return res.status(400).json({ error: 'email es requerido' })

    try {
      const existing = await UserModel.findByEmail(email)

      // ── Bloqueo explícito (opcional, para cancelaciones inmediatas) ──
      if (action === 'block') {
        if (!existing) return res.status(404).json({ error: 'Barbería no encontrada' })
        await pool.query(
          `UPDATE barbershops SET subscription_status = 'blocked' WHERE id = $1`,
          [existing.id]
        )
        return res.json({ ok: true, blocked: true, slug: existing.slug })
      }

      // ── Activación ──
      const vence = new Date(access_until)
      if (!access_until || isNaN(vence.getTime())) {
        return res.status(400).json({ error: 'access_until inválido (ISO date requerido)' })
      }

      if (existing) {
        await pool.query(
          `UPDATE barbershops
           SET subscription_status = 'active', subscription_ends_at = $1
           WHERE id = $2`,
          [vence, existing.id]
        )
        return res.json({
          ok: true,
          created: false,
          slug: existing.slug,
          subscription_ends_at: vence,
        })
      }

      // ── No existe: aprovisionar la barbería completa ──
      if (!name) return res.status(400).json({ error: 'name es requerido para crear la barbería' })

      let slug = generateSlug(name)
      if (!slug) slug = `barberia-${Date.now()}`
      if (await UserModel.slugExists(slug)) slug = `${slug}-${Date.now()}`

      const clave = tempPassword()
      const hashed = await bcrypt.hash(clave, 10)

      const shop = await UserModel.create({
        name,
        email,
        password: hashed,
        phone: phone || null,
        address: null,
        slug,
      })

      await pool.query(
        `UPDATE barbershops
         SET subscription_status = 'active', subscription_ends_at = $1
         WHERE id = $2`,
        [vence, shop.id]
      )

      console.log(`✓ Barbería aprovisionada desde JTool: ${name} (${slug})`)

      return res.status(201).json({
        ok: true,
        created: true,
        slug,
        subscription_ends_at: vence,
        // Se devuelve UNA sola vez para que el admin se la entregue al cliente.
        // El cliente puede cambiarla luego con "¿Olvidaste tu contraseña?".
        temp_password: clave,
      })
    } catch (err) {
      console.error('Sync error:', err)
      res.status(500).json({ error: 'Error sincronizando la suscripción' })
    }
  },
}

module.exports = SyncController