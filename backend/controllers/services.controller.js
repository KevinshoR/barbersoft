const ServiceModel = require('../models/service.model')
const pool         = require('../config/db')

// Valida que la URL de la imagen tenga formato http/https
function isValidImageUrl(url) {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

const ServicesController = {
  async getAll(req, res) {
    try {
      const services = await ServiceModel.findAll(req.barbershop.id)
      res.json({ services })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Error obteniendo servicios' })
    }
  },

  async create(req, res) {
  try {
    const { name, duration_min, price, image_url, description } = req.body
    if (!name || !duration_min || !price) {
      return res.status(400).json({ error: 'Nombre, duración y precio son obligatorios' })
    }
    if (image_url && !isValidImageUrl(image_url)) {
      return res.status(400).json({ error: 'La URL de la imagen no es válida. Debe comenzar con http:// o https://' })
    }

    // Verificar nombre duplicado
    const existing = await pool.query(
      'SELECT id FROM services WHERE barbershop_id = $1 AND LOWER(name) = LOWER($2)',
      [req.barbershop.id, name.trim()]
    )
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Ya existe un servicio con ese nombre' })
    }

    const service = await ServiceModel.create({
      barbershop_id: req.barbershop.id,
      name: name.trim(), duration_min, price,
      image_url: image_url?.trim() || null,
      description: description?.trim() || null,
    })
    res.status(201).json({ service })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error creando servicio' })
  }
},

  async update(req, res) {
    try {
      const { image_url } = req.body
      if (image_url && !isValidImageUrl(image_url)) {
        return res.status(400).json({ error: 'La URL de la imagen no es válida. Debe comenzar con http:// o https://' })
      }

      const service = await ServiceModel.update(
        req.params.id,
        req.barbershop.id,
        req.body
      )
      if (!service) return res.status(404).json({ error: 'Servicio no encontrado' })
      res.json({ service })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Error actualizando servicio' })
    }
  },

  async remove(req, res) {
  try {
    // Verificar si tiene citas activas
    const citas = await pool.query(
      `SELECT COUNT(*) as total FROM appointments
       WHERE service_id = $1 AND status NOT IN ('cancelled', 'done')`,
      [req.params.id]
    )
    if (parseInt(citas.rows[0].total) > 0) {
      return res.status(400).json({
        error: `Este servicio tiene ${citas.rows[0].total} cita(s) activa(s). Cancelalas o completalas antes de eliminar.`
      })
    }

    const service = await ServiceModel.delete(req.params.id, req.barbershop.id)
    if (!service) return res.status(404).json({ error: 'Servicio no encontrado' })
    res.json({ message: 'Servicio eliminado' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error eliminando servicio' })
  }
}
}

module.exports = ServicesController