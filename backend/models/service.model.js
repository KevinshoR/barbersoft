const pool = require('../config/db')

// Catálogo con el que arranca toda barbería nueva (recién registrada). Son
// filas reales en `services`: el dueño las puede editar o eliminar desde
// Services.jsx como cualquier otra.
const DEFAULT_SERVICES = [
  { name: 'Corte clásico',     duration_min: 30, price: 25000 },
  { name: 'Corte + barba',     duration_min: 45, price: 35000 },
  { name: 'Arreglo de barba',  duration_min: 20, price: 15000 },
  { name: 'Tinte',             duration_min: 60, price: 50000 },
  { name: 'Cejas',             duration_min: 15, price: 10000 },
]

const ServiceModel = {
  async createDefaults(barbershop_id, db = pool) {
    const values = []
    const rows = DEFAULT_SERVICES.map((s, i) => {
      const base = i * 4
      values.push(barbershop_id, s.name, s.duration_min, s.price)
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4})`
    }).join(', ')

    const result = await db.query(
      `INSERT INTO services (barbershop_id, name, duration_min, price)
       VALUES ${rows}
       RETURNING id, name, duration_min, price, active`,
      values
    )
    return result.rows
  },

  async findAll(barbershop_id) {
    const result = await pool.query(
      `SELECT id, name, duration_min, price, active, image_url, description
       FROM services
       WHERE barbershop_id = $1
       ORDER BY name ASC`,
      [barbershop_id]
    )
    return result.rows
  },

  async create({ barbershop_id, name, duration_min, price, image_url, description }) {
    const result = await pool.query(
      `INSERT INTO services (barbershop_id, name, duration_min, price, image_url, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, duration_min, price, active, image_url, description`,
      [barbershop_id, name, duration_min, price, image_url, description]
    )
    return result.rows[0]
  },

  async update(id, barbershop_id, { name, duration_min, price, active, image_url, description }) {
    const result = await pool.query(
      `UPDATE services
       SET name         = COALESCE($1, name),
           duration_min = COALESCE($2, duration_min),
           price        = COALESCE($3, price),
           active       = COALESCE($4, active),
           image_url    = COALESCE($5, image_url),
           description  = COALESCE($6, description)
       WHERE id = $7 AND barbershop_id = $8
       RETURNING id, name, duration_min, price, active, image_url, description`,
      [name, duration_min, price, active, image_url, description, id, barbershop_id]
    )
    return result.rows[0]
  },

  async delete(id, barbershop_id) {
    const result = await pool.query(
      `DELETE FROM services
       WHERE id = $1 AND barbershop_id = $2
       RETURNING id`,
      [id, barbershop_id]
    )
    return result.rows[0]
  }
}

module.exports = ServiceModel