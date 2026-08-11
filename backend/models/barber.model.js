const pool = require('../config/db')

const BarberModel = {
  async findAll(barbershop_id) {
    const result = await pool.query(
      `SELECT id, name, phone, photo_url, specialty, work_days, active
       FROM barbers
       WHERE barbershop_id = $1
       ORDER BY name ASC`,
      [barbershop_id]
    )
    return result.rows
  },

  async create({ barbershop_id, name, phone, photo_url, specialty, work_days }) {
    const result = await pool.query(
      `INSERT INTO barbers (barbershop_id, name, phone, photo_url, specialty, work_days)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, phone, photo_url, specialty, work_days, active`,
      [barbershop_id, name, phone || null, photo_url || null, specialty || null, work_days || '1,2,3,4,5,6']
    )
    return result.rows[0]
  },

  async update(id, barbershop_id, { name, phone, photo_url, specialty, work_days, active }) {
    const result = await pool.query(
      `UPDATE barbers
       SET name = COALESCE($1, name),
           phone = COALESCE($2, phone),
           photo_url = COALESCE($3, photo_url),
           specialty = COALESCE($4, specialty),
           work_days = COALESCE($5, work_days),
           active = COALESCE($6, active)
       WHERE id = $7 AND barbershop_id = $8
       RETURNING id, name, phone, photo_url, specialty, work_days, active`,
      [name, phone, photo_url, specialty, work_days, active, id, barbershop_id]
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
