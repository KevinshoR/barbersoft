const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
})

// Establecer zona horaria de Colombia en cada conexión
pool.on('connect', (client) => {
  client.query("SET TIME ZONE 'America/Bogota'")
})

pool.connect((err) => {
  if (err) {
    console.error('Error conectando a PostgreSQL:', err.message)
  } else {
    console.log('Conectado a PostgreSQL correctamente')
  }
})

module.exports = pool