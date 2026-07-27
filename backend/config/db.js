const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // Fija la zona horaria a nivel de conexión de forma confiable, sin disparar
  // un client.query() suelto en 'connect' (que causaba el DeprecationWarning
  // "client is already executing a query" y hacía que el SET TIME ZONE no se
  // aplicara de forma consistente). Esto se envía en el arranque de cada conexión.
  options: '-c timezone=America/Bogota',
})

pool.connect((err) => {
  if (err) {
    console.error('Error conectando a PostgreSQL:', err.message)
  } else {
    console.log('Conectado a PostgreSQL correctamente')
  }
})

module.exports = pool