require('dotenv').config()
const pool = require('./config/db')

/*
 * Crea una cita de prueba a 60 minutos de AHORA (centro de la ventana
 * del job de recordatorios: 55-65 min). Salta las validaciones del front.
 *
 * Uso: node cita-prueba.js <tu_celular_10_digitos>
 * Ej:  node cita-prueba.js 3001234567
 */
async function run() {
  const celular = process.argv[2]
  if (!celular) {
    console.error('Uso: node cita-prueba.js <tu_celular_10_digitos>')
    process.exit(1)
  }

  // La barbería de pruebas
  const shop = await pool.query("SELECT id, name FROM barbershops WHERE email = 'kevin@jtool.com'")
  if (!shop.rows[0]) { console.error('No existe la barbería kevin@jtool.com'); process.exit(1) }
  const shopId = shop.rows[0].id

  // Primer barbero y servicio de esa barbería
  const barber = await pool.query('SELECT id, name FROM barbers WHERE barbershop_id = $1 LIMIT 1', [shopId])
  const service = await pool.query('SELECT id, name FROM services WHERE barbershop_id = $1 LIMIT 1', [shopId])
  if (!barber.rows[0] || !service.rows[0]) {
    console.error('Falta crear al menos 1 barbero y 1 servicio en la barbería (hazlo desde el panel)')
    process.exit(1)
  }

  const cita = await pool.query(
    `INSERT INTO appointments
       (barbershop_id, barber_id, service_id, client_name, client_phone, client_email, scheduled_at, notes)
     VALUES ($1, $2, $3, 'Prueba Recordatorio', $4, null, NOW() + INTERVAL '60 minutes', 'cita de prueba del job')
     RETURNING id, scheduled_at, status, reminder_sent`,
    [shopId, barber.rows[0].id, service.rows[0].id, celular]
  )

  console.log('OK - Cita creada:', cita.rows[0])
  console.log('Barbero:', barber.rows[0].name, '| Servicio:', service.rows[0].name)
  console.log('Ahora reinicia el backend (Ctrl+C -> npm run dev) y mira la consola')
  process.exit()
}
run().catch((e) => { console.error('Error:', e.message); process.exit(1) })