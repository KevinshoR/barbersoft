require('dotenv').config()
const bcrypt = require('bcryptjs')
const pool = require('./config/db')

// Uso: node create-user.js <email> <password> [nombre]
// Crea una barbería lista para entrar, con suscripción activa por 1 año.
async function run() {
  const [email, password, name = 'Barberia de Kevin'] = process.argv.slice(2)
  if (!email || !password) {
    console.error('Uso: node create-user.js <email> <password> [nombre]')
    process.exit(1)
  }
  const hash = await bcrypt.hash(password, 10)
  const slug =
    name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-') +
    '-' + Date.now().toString().slice(-4)

  const existe = await pool.query('SELECT id FROM barbershops WHERE email = $1', [email])
  if (existe.rows.length > 0) {
    await pool.query(
      `UPDATE barbershops SET password = $1, subscription_status = 'active',
       subscription_ends_at = NOW() + INTERVAL '1 year' WHERE email = $2`,
      [hash, email]
    )
    console.log('OK - Ya existia: contrasena actualizada y suscripcion activa 1 ano ->', email)
  } else {
    await pool.query(
      `INSERT INTO barbershops (name, email, password, slug, subscription_status, subscription_ends_at)
       VALUES ($1, $2, $3, $4, 'active', NOW() + INTERVAL '1 year')`,
      [name, email, hash, slug]
    )
    console.log('OK - Barberia creada y activa 1 ano ->', email, '| slug:', slug)
  }
  process.exit()
}
run().catch((e) => { console.error('Error:', e.message); process.exit(1) })