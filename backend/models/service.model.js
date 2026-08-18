const pool = require('../config/db')

// Catálogo con el que arranca toda barbería nueva (recién registrada).
// Elegidos con base en los 3 servicios más solicitados de las barberías
// colombianas (según data de Fresha, Barbería Lords, La Barbería Bogotá):
//
//   1. Corte de cabello — el pan de todos los días
//   2. Corte + barba — el combo estrella, el más rentable
//   3. Arreglo de barba — segundo más pedido después del corte
//
// Precios: promedio de barbería de barrio con buen nivel en Colombia (2026).
// El dueño puede editarlos, eliminarlos o agregar más desde el panel Services.
// Las imágenes son fotos libres (Unsplash) — el dueño las reemplaza con las suyas.
const DEFAULT_SERVICES = [
  {
    name: 'Corte de cabello',
    duration_min: 30,
    price: 25000,
    description: 'Corte tradicional a máquina y tijera, degradado (fade) o clásico. Incluye lavado y peinado.',
    image_url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&h=800&fit=crop',
  },
  {
    name: 'Corte + Barba',
    duration_min: 45,
    price: 35000,
    description: 'Combo completo: corte de cabello, perfilado de barba con navaja y toalla caliente. El favorito.',
    image_url: 'https://images.unsplash.com/photo-1521490878406-4b1b8f38dfe4?w=800&h=800&fit=crop',
  },
  {
    name: 'Arreglo de barba',
    duration_min: 20,
    price: 15000,
    description: 'Perfilado de barba con navaja, toalla caliente y acabado con productos de cuidado.',
    image_url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&h=800&fit=crop',
  },
]

const ServiceModel = {
  async createDefaults(barbershop_id, db = pool) {
    const values = []
    const rows = DEFAULT_SERVICES.map((s, i) => {
      const base = i * 6
      values.push(barbershop_id, s.name, s.duration_min, s.price, s.description, s.image_url)
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`
    }).join(', ')

    const result = await db.query(
      `INSERT INTO services (barbershop_id, name, duration_min, price, description, image_url)
       VALUES ${rows}
       RETURNING id, name, duration_min, price, description, image_url, active`,
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
