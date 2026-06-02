const pool = require('../config/db')

const BarberModel = {
  async findAll(barbershop_id) {
    const result = await pool.query(
      `SELECT id, name, photo_url, active
       FROM barbers
       WHERE barbershop_id = $1
       ORDER BY name ASC`,
      [barbershop_id]
    )
    return result.rows
  },

  async create({ barbershop_id, name, photo_url }) {
    const result = await pool.query(
      `INSERT INTO barbers (barbershop_id, name, photo_url)
       VALUES ($1, $2, $3)
       RETURNING id, name, photo_url, active`,
      [barbershop_id, name, photo_url || null]
    )
    return result.rows[0]
  },

  async update(id, barbershop_id, { name, photo_url, active }) {
    const result = await pool.query(
      `UPDATE barbers
       SET name = COALESCE($1, name),
           photo_url = COALESCE($2, photo_url),
           active = COALESCE($3, active)
       WHERE id = $4 AND barbershop_id = $5
       RETURNING id, name, photo_url, active`,
      [name, photo_url, active, id, barbershop_id]
    )
    return result.rows[0]
  },

  async delete(id, barbershop_id) {
    const result = await pool.query(
      `DELETE FROM barbers
       WHERE id = $1 AND barbershop_id = $2
       RETURNING id`,
      [id, barbershop_id]
    )
    return result.rows[0]
  }
}

module.exports = BarberModel