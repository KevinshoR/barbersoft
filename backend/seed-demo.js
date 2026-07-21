// ═══════════════════════════════════════════════════════════════
//  DEMO PARA VIDEO — Barbersoft
//  Crea una barbería nueva, lista y con suscripción activa, con
//  barberos y servicios que tienen FOTOS REALES (Unsplash), nombres
//  y datos que se ven creíbles — pensada para grabar el video
//  publicitario sin que se note que son datos de prueba.
//
//  Uso:  node seed-demo.js
//  (usa el pool de conexión ya configurado en backend/config/db.js,
//   igual que create-user.js)
// ═══════════════════════════════════════════════════════════════
require('dotenv').config()
const bcrypt = require('bcryptjs')
const pool = require('./config/db')

const EMAIL    = 'contacto@barberiaelclasico.co'
const PASSWORD = 'Demo2026*'
const NOMBRE   = 'Barbería El Clásico'

async function run() {
  console.log('Creando barbería demo para el video...\n')

  const hash = await bcrypt.hash(PASSWORD, 10)
  const slug = 'barberia-el-clasico-demo'

  // 1) Limpia una demo previa con el mismo slug (si ya la corriste antes)
  const existente = await pool.query('SELECT id FROM barbershops WHERE slug = $1', [slug])
  if (existente.rows.length > 0) {
    await pool.query('DELETE FROM barbershops WHERE id = $1', [existente.rows[0].id])
    console.log('• Se eliminó una demo anterior con el mismo slug (barberos/servicios/citas se borraron en cascada).')
  }

  // 2) Crea la barbería con suscripción ACTIVA (para que no salga el banner de prueba en el video)
  const shop = await pool.query(
    `INSERT INTO barbershops (name, email, password, phone, address, slug, department, municipality, subscription_status, subscription_ends_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'active', NOW() + INTERVAL '1 year')
     RETURNING id`,
    [NOMBRE, EMAIL, hash, '3001234567', 'Cra 43A #10-20, El Poblado', slug, 'Antioquia', 'Medellín']
  )
  const shopId = shop.rows[0].id
  console.log(`✓ Barbería creada: "${NOMBRE}" (id=${shopId}, slug=${slug})`)

  // 3) Horarios: Lun-Sáb 9am-7pm, domingo cerrado
  const dias = [
    { d: 0, abierto: false, o: '09:00', c: '19:00' }, // Domingo
    { d: 1, abierto: true,  o: '09:00', c: '19:00' },
    { d: 2, abierto: true,  o: '09:00', c: '19:00' },
    { d: 3, abierto: true,  o: '09:00', c: '19:00' },
    { d: 4, abierto: true,  o: '09:00', c: '19:00' },
    { d: 5, abierto: true,  o: '09:00', c: '20:00' },
    { d: 6, abierto: true,  o: '08:00', c: '17:00' }, // Sábado
  ]
  for (const h of dias) {
    await pool.query(
      `INSERT INTO business_hours (barbershop_id, day_of_week, open_time, close_time, is_open)
       VALUES ($1,$2,$3,$4,$5)`,
      [shopId, h.d, h.o, h.c, h.abierto]
    )
  }
  console.log('✓ Horarios configurados (Lun-Sáb, domingo cerrado)')

  // 4) Barberos — fotos reales de Unsplash (retratos masculinos, licencia libre)
  const barberos = [
    { name: 'Andrés Felipe Restrepo', specialty: 'Fades y diseño de barba · 9 años de experiencia', photo: 'https://images.unsplash.com/photo-1618077360395-f3068be8e001?w=400&q=80', days: '1,2,3,4,5,6' },
    { name: 'Camilo Zapata',          specialty: 'Cortes clásicos y afeitado a navaja',              photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&q=80', days: '1,2,3,4,5' },
    { name: 'Juan David Osorio',      specialty: 'Especialista en degradados y diseños',             photo: 'https://images.unsplash.com/photo-1600180758890-6b94519a8ba6?w=400&q=80', days: '2,3,4,5,6' },
    { name: 'Santiago Marín',         specialty: 'Barbería tradicional y color',                     photo: 'https://images.unsplash.com/photo-1601412436009-d964bd02edbc?w=400&q=80', days: '1,3,4,5,6' },
  ]
  const barberIds = []
  for (const b of barberos) {
    const r = await pool.query(
      `INSERT INTO barbers (barbershop_id, name, specialty, photo_url, work_days, active)
       VALUES ($1,$2,$3,$4,$5,true) RETURNING id`,
      [shopId, b.name, b.specialty, b.photo, b.days]
    )
    barberIds.push(r.rows[0].id)
  }
  console.log(`✓ ${barberos.length} barberos creados (con foto real)`)

  // 5) Servicios — fotos reales de cortes/barbería en Unsplash
  const servicios = [
    { name: 'Corte clásico',      duration: 30, price: 25000, desc: 'Corte tradicional con tijera y máquina, incluye lavado y peinado.', img: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=500&q=80' },
    { name: 'Corte + barba',      duration: 45, price: 38000, desc: 'Corte completo más perfilado y arreglo de barba con toalla caliente.', img: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=500&q=80' },
    { name: 'Afeitado a navaja',  duration: 30, price: 28000, desc: 'Afeitado clásico con toalla caliente, espuma y navaja.',              img: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&q=80' },
    { name: 'Degradado (fade)',   duration: 40, price: 32000, desc: 'Degradado profesional a tu gusto, con diseño opcional.',              img: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=500&q=80' },
    { name: 'Diseño de cejas',    duration: 15, price: 12000, desc: 'Perfilado y diseño de cejas con navaja.',                             img: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?w=500&q=80' },
  ]
  for (const s of servicios) {
    await pool.query(
      `INSERT INTO services (barbershop_id, name, duration_min, price, description, image_url, active)
       VALUES ($1,$2,$3,$4,$5,$6,true)`,
      [shopId, s.name, s.duration, s.price, s.desc, s.img]
    )
  }
  console.log(`✓ ${servicios.length} servicios creados (con foto real)`)

  // 6) Citas — repartidas en el mes actual, nombres colombianos creíbles, estados variados
  const clientes = [
    ['Juan Esteban Gómez', '3012345678', 'juan.gomez@gmail.com'],
    ['María José Restrepo', '3109876543', 'mariajose.r@hotmail.com'],
    ['Carlos Andrés Lopez', '3153456789', 'carlosalopez@gmail.com'],
    ['Valentina Ríos',      '3187654321', 'valentina.rios@outlook.com'],
    ['Sebastián Cardona',   '3001112233', 'sebas.cardona@gmail.com'],
    ['Isabella Muñoz',      '3209998877', 'isa.munoz@gmail.com'],
    ['Daniel Vélez',        '3116665544', 'daniel.velez@yahoo.com'],
    ['Mariana Betancur',    '3053334455', 'mariana.b@gmail.com'],
    ['Alejandro Correa',    '3178889900', 'alejo.correa@gmail.com'],
    ['Laura Sofía Jiménez', '3021237890', 'laurasofia.j@hotmail.com'],
    ['Felipe Arango',       '3134567123', 'felipe.arango@gmail.com'],
    ['Camila Ochoa',        '3196547890', 'camila.ochoa@gmail.com'],
  ]

  const servicioIds = (await pool.query('SELECT id FROM services WHERE barbershop_id = $1', [shopId])).rows.map(r => r.id)
  const estados = ['pending', 'confirmed', 'done', 'done', 'done', 'done', 'cancelled']

  let creadas = 0
  for (let i = 0; i < 45; i++) {
    const cliente = clientes[Math.floor(Math.random() * clientes.length)]
    const barberId = barberIds[Math.floor(Math.random() * barberIds.length)]
    const serviceId = servicioIds[Math.floor(Math.random() * servicioIds.length)]
    const status = estados[Math.floor(Math.random() * estados.length)]
    const diaOffset = Math.floor(Math.random() * 26) + 1 // día 1-26 del mes actual
    const hora = 9 + Math.floor(Math.random() * 9) // 9am - 5pm
    const min = Math.random() < 0.5 ? 0 : 30

    const fecha = new Date()
    fecha.setDate(diaOffset)
    fecha.setHours(hora, min, 0, 0)

    try {
      await pool.query(
        `INSERT INTO appointments (barbershop_id, barber_id, service_id, client_name, client_phone, client_email, scheduled_at, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [shopId, barberId, serviceId, cliente[0], cliente[1], cliente[2], fecha, status]
      )
      creadas++
    } catch { /* si cae en fecha ya usada por el mismo barbero, se salta */ }
  }
  console.log(`✓ ${creadas} citas creadas en el mes actual (estados variados)`)

  console.log('\n═══════════════════════════════════════')
  console.log('LISTO — datos para iniciar sesión y grabar:')
  console.log('  Email:    ' + EMAIL)
  console.log('  Password: ' + PASSWORD)
  console.log('  Reserva pública: /reservar/' + slug)
  console.log('═══════════════════════════════════════')

  await pool.end()
}

run().catch(err => { console.error('ERROR:', err.message); process.exit(1) })
