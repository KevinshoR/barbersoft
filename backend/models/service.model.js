const pool = require('../config/db')

const ServiceModel = {
  async findAll(barbershop_id) {
    const result = await pool.query(
      `SELECT id, name, duration_min, price, active
       FROM services
       WHERE barbershop_id = $1
       ORDER BY name ASC`,
      [barbershop_id]
    )
    return result.rows
  },

  async create({ barbershop_id, name, duration_min, price }) {
    const result = await pool.query(
      `INSERT INTO services (barbershop_id, name, duration_min, price)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, duration_min, price, active`,
      [barbershop_id, name, duration_min, price]
    )
    return result.rows[0]
  },

  async update(id, barbershop_id, { name, duration_min, price, active }) {
    const result = await pool.query(
      `UPDATE services
       SET name         = COALESCE($1, name),
           duration_min = COALESCE($2, duration_min),
           price        = COALESCE($3, price),
           active       = COALESCE($4, active)
       WHERE id = $5 AND barbershop_id = $6
       RETURNING id, name, duration_min, price, active`,
      [name, duration_min, price, active, id, barbershop_id]
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