const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: '-c timezone=America/Bogota',
  ssl: (
    process.env.DB_SSL === 'true' ||
    process.env.NODE_ENV === 'production' ||
    (process.env.DB_HOST || '').includes('neon.tech')
  ) ? { rejectUnauthorized: false } : false,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
})

pool.connect((err, client, release) => {
  if (err) {
    console.error('Error conectando a PostgreSQL:', err.message)
  } else {
    console.log('Conectado a PostgreSQL correctamente')
    release()
  }
})

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL (se recuperará solo):', err.message)
})

module.exports = pool