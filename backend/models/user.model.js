const pool = require('../config/db')

const UserModel = {
  async create({ name, email, password, phone, address, slug }) {
    const result = await pool.query(
      `INSERT INTO barbershops (name, email, password, phone, address, slug)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, slug, subscription_status, trial_ends_at`,
      [name, email, password, phone, address, slug]
    )
    return result.rows[0]
  },

  async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM barbershops WHERE email = $1',
      [email]
    )
    return result.rows[0]
  },

  async findById(id) {
    const result = await pool.query(
      `SELECT id, name, email, phone, address, slug,
              subscription_status, trial_ends_at, subscription_ends_at
       FROM barbershops WHERE id = $1`,
      [id]
    )
    return result.rows[0]
  },

  async slugExists(slug) {
    const result = await pool.query(
      'SELECT id FROM barbershops WHERE slug = $1',
      [slug]
    )
    return result.rows.length > 0
  }
}

module.exports = UserModel