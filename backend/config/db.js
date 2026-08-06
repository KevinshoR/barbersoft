const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // Fija la zona horaria a nivel de conexión de forma confiable.
  options: '-c timezone=America/Bogota',
  // SSL: los proveedores en la nube (Neon, Render) exigen conexión cifrada.
  // Se activa si DB_SSL=true, o en producción, o si el host es de Neon.
  ssl: (
    process.env.DB_SSL === 'true' ||
    process.env.NODE_ENV === 'production' ||
    (process.env.DB_HOST || '').includes('neon.tech')
  ) ? { rejectUnauthorized: false } : false,
  // Cierra conexiones inactivas antes de que Neon las corte, y no espera
  // eternamente si la BD está despertando (scale-to-zero).
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

// Sin este manejador, cuando Neon cierra una conexión inactiva (scale-to-zero),
// el pool emite un evento 'error' no manejado que tumba TODO el proceso.
// Con esto, solo se registra y el pool crea una conexión nueva en la siguiente
// consulta. El servidor sigue vivo.
pool.on('error', (err) => {
  console.error('Error inesperado en el pool de PostgreSQL (se recuperará solo):', err.message)
})

module.exports = pool