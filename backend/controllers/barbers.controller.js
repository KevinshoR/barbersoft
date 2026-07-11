const pool        = require('../config/db')
const BarberModel = require('../models/barber.model')

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
      const { name, photo_url, specialty } = req.body
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
        photo_url: photo_url?.trim() || null,
        specialty: specialty?.trim() || null,
      })
      res.status(201).json({ barber })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Error creando barbero' })
    }
  },

  async update(req, res) {
    try {
      const barber = await BarberModel.update(
        req.params.id,
        req.barbershop.id,
        req.body
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
      const citas = await pool.query(
        `SELECT COUNT(*) as total FROM appointments
         WHERE barber_id = $1 AND status NOT IN ('cancelled', 'done')`,
        [req.params.id]
      )
      if (parseInt(citas.rows[0].total) > 0) {
        return res.status(400).json({
          error: `Este barbero tiene ${citas.rows[0].total} cita(s) activa(s). Cancelalas o completalas antes de eliminar.`
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