const pool        = require('../config/db')
const BarberModel = require('../models/barber.model')

// Limpia el teléfono: solo dígitos, máx 20 caracteres. Devuelve null si queda vacío.
function normalizePhone(raw) {
  if (raw === null || raw === undefined) return null
  const cleaned = String(raw).replace(/\D/g, '').slice(0, 20)
  return cleaned || null
}

const BarbersController = {

  async getAll(req, res) {
    try {
      const barbers = await BarberModel.findAll(req.barbershop.id)
      res.json({ barbers })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Error obteniendo barberos' })
    }
  },

  async create(req, res) {
    try {
      const { name, phone, photo_url, specialty, work_days } = req.body
      if (!name) return res.status(400).json({ error: 'El nombre es obligatorio' })

      const existing = await pool.query(
        'SELECT id FROM barbers WHERE barbershop_id = $1 AND LOWER(name) = LOWER($2)',
        [req.barbershop.id, name.trim()]
      )
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'Ya existe un barbero con ese nombre' })
      }

      const barber = await BarberModel.create({
        barbershop_id: req.barbershop.id,
        name: name.trim(),
        phone: normalizePhone(phone),
        photo_url: photo_url?.trim() || null,
        specialty: specialty?.trim() || null,
        work_days: work_days?.trim() || null,
      })
      res.status(201).json({ barber })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Error creando barbero' })
    }
  },

  async update(req, res) {
    try {
      // Normaliza phone si viene en el body (si no viene, no lo tocamos)
      const body = { ...req.body }
      if ('phone' in body) body.phone = normalizePhone(body.phone)

      const barber = await BarberModel.update(
        req.params.id,
        req.barbershop.id,
        body
      )
      if (!barber) return res.status(404).json({ error: 'Barbero no encontrado' })
      res.json({ barber })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Error actualizando barbero' })
    }
  },

  async remove(req, res) {
    try {
      const barberCheck = await pool.query(
        'SELECT id FROM barbers WHERE id = $1 AND barbershop_id = $2',
        [req.params.id, req.barbershop.id]
      )
      if (!barberCheck.rows[0]) return res.status(404).json({ error: 'Barbero no encontrado' })

      const citas = await pool.query(
        `SELECT COUNT(*) as total FROM appointments
         WHERE barber_id = $1 AND barbershop_id = $2`,
        [req.params.id, req.barbershop.id]
      )
      if (parseInt(citas.rows[0].total) > 0) {
        return res.status(400).json({
          error: 'No puedes eliminar este barbero porque tiene citas asociadas. Cancela o reasigna sus citas primero.'
        })
      }

      const barber = await BarberModel.delete(req.params.id, req.barbershop.id)
      if (!barber) return res.status(404).json({ error: 'Barbero no encontrado' })
      res.json({ message: 'Barbero eliminado' })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Error eliminando barbero' })
    }
  }
}

module.exports = BarbersController
