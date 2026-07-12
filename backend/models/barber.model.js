const pool = require('../config/db')

const BarberModel = {
  async findAll(barbershop_id) {
    const result = await pool.query(
      `SELECT id, name, photo_url, specialty, work_days, active
       FROM barbers
       WHERE barbershop_id = $1
       ORDER BY name ASC`,
      [barbershop_id]
    )
    return result.rows
  },

  async create({ barbershop_id, name, photo_url, specialty, work_days }) {
    const result = await pool.query(
      `INSERT INTO barbers (barbershop_id, name, photo_url, specialty, work_days)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, name, photo_url, specialty, work_days, active`,
      [barbershop_id, name, photo_url || null, specialty || null, work_days || '1,2,3,4,5,6']
    )
    return result.rows[0]
  },

  async update(id, barbershop_id, { name, photo_url, specialty, work_days, active }) {
    const result = await pool.query(
      `UPDATE barbers
       SET name = COALESCE($1, name),
           photo_url = COALESCE($2, photo_url),
           specialty = COALESCE($3, specialty),
           work_days = COALESCE($4, work_days),
           active = COALESCE($5, active)
       WHERE id = $6 AND barbershop_id = $7
       RETURNING id, name, photo_url, specialty, work_days, active`,
      [name, photo_url, specialty, work_days, active, id, barbershop_id]
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