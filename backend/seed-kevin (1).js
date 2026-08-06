/**
 * SEED para la cuenta kevin@jtool.com — llena barberos, servicios y citas
 * (incluyendo varias de HOY) para ver el dashboard con datos reales.
 *
 * Uso:  node seed-kevin.js
 *
 * SEGURO: no crea ni borra la barbería. Solo busca la cuenta existente por
 * email, limpia SUS barberos/servicios/citas y crea datos nuevos.
 */
require('dotenv').config()
const pool = require('./config/db')

const EMAIL = 'kevin@jtool.com'

const BARBEROS = [
  { name: 'Santiago Marín',    specialty: 'Cortes clásicos y fades',  work_days: '1,2,3,4,5,6', photo_url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&h=400&fit=crop' },
  { name: 'Andrés Restrepo',   specialty: 'Barba y diseño',           work_days: '1,2,3,4,5,6', photo_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop' },
  { name: 'Camilo Zapata',     specialty: 'Degradados modernos',      work_days: '2,3,4,5,6',   photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop' },
  { name: 'Julián Vélez',      specialty: 'Cortes y color',           work_days: '1,2,3,4,5',   photo_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop' },
]

const SERVICIOS = [
  { name: 'Corte clásico',    duration_min: 30, price: 25000, description: 'Corte tradicional a tijera y máquina.',       image_url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&h=300&fit=crop' },
  { name: 'Corte + barba',    duration_min: 45, price: 35000, description: 'Corte completo con perfilado de barba.',       image_url: 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&h=300&fit=crop' },
  { name: 'Degradado',        duration_min: 40, price: 30000, description: 'Fade profesional a varios niveles.',           image_url: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=400&h=300&fit=crop' },
  { name: 'Diseño de cejas',  duration_min: 15, price: 12000, description: 'Perfilado y limpieza de cejas.',              image_url: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=400&h=300&fit=crop' },
  { name: 'Afeitado a navaja',duration_min: 30, price: 28000, description: 'Afeitado clásico con toalla caliente.',       image_url: 'https://images.unsplash.com/photo-1521490683712-35a1cb355a5f?w=400&h=300&fit=crop' },
]

const CLIENTES = [
  ['Sebastián Cardona', '3001112233', 'sebas@example.com'],
  ['Daniel Vélez',      '3116665544', 'daniel@example.com'],
  ['Mateo Restrepo',    '3009998877', 'mateo@example.com'],
  ['Juan Pérez',        '3001234567', 'juanp@example.com'],
  ['Miguel Rodríguez',  '3125557788', 'miguel@example.com'],
  ['Carlos Gómez',      '3134445566', 'carlosg@example.com'],
  ['Andrés Molina',     '3157778899', 'andresm@example.com'],
  ['Felipe Ríos',       '3002223344', 'felipe@example.com'],
]

async function main() {
  // Permite pasar el email como argumento: node seed-kevin.js micorreo@ejemplo.com
  // Si no se pasa, usa el EMAIL por defecto.
  const targetEmail = process.argv[2] || EMAIL

  // 1. Buscar la cuenta (no crearla)
  const shopRes = await pool.query('SELECT id, name FROM barbershops WHERE email = $1', [targetEmail])
  if (!shopRes.rows.length) {
    console.error(`✗ No existe una barbería con el correo ${targetEmail}.`)
    console.error(`  Tip: córrelo así -> node seed-kevin.js TU_CORREO_DE_LOGIN`)
    // Mostrar las barberías disponibles para ayudar
    const all = await pool.query('SELECT email, name FROM barbershops ORDER BY id')
    if (all.rows.length) {
      console.error('\n  Barberías registradas:')
      all.rows.forEach(r => console.error(`   - ${r.email}  (${r.name})`))
    }
    return pool.end()
  }
  const shopId = shopRes.rows[0].id
  console.log(`✓ Barbería encontrada: "${shopRes.rows[0].name}" (id=${shopId})`)

  // 2. Limpiar datos previos de ESTA barbería (en orden por llaves foráneas)
  await pool.query('DELETE FROM appointments WHERE barbershop_id = $1', [shopId])
  await pool.query('DELETE FROM barbers WHERE barbershop_id = $1', [shopId])
  await pool.query('DELETE FROM services WHERE barbershop_id = $1', [shopId])
  console.log('✓ Datos previos limpiados (barberos, servicios, citas)')

  // 3. Horarios: Lun-Sáb abierto 9-19, domingo cerrado (si tu tabla los usa)
  try {
    for (let d = 0; d <= 6; d++) {
      const isOpen = d !== 0 // domingo (0) cerrado
      await pool.query(
        `INSERT INTO business_hours (barbershop_id, day_of_week, open_time, close_time, is_open)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (barbershop_id, day_of_week)
         DO UPDATE SET open_time=$3, close_time=$4, is_open=$5`,
        [shopId, d, '09:00', '19:00', isOpen]
      )
    }
    console.log('✓ Horarios configurados (Lun-Sáb 9-19, domingo cerrado)')
  } catch (e) {
    console.log('· Horarios: se omite (' + e.message.split('\n')[0] + ')')
  }

  // 4. Barberos
  const barberIds = []
  for (const b of BARBEROS) {
    const r = await pool.query(
      `INSERT INTO barbers (barbershop_id, name, specialty, work_days, photo_url, active)
       VALUES ($1,$2,$3,$4,$5,true) RETURNING id`,
      [shopId, b.name, b.specialty, b.work_days, b.photo_url]
    )
    barberIds.push(r.rows[0].id)
  }
  console.log(`✓ ${barberIds.length} barberos creados`)

  // 5. Servicios
  const serviceIds = []
  for (const s of SERVICIOS) {
    const r = await pool.query(
      `INSERT INTO services (barbershop_id, name, duration_min, price, description, image_url, active)
       VALUES ($1,$2,$3,$4,$5,$6,true) RETURNING id`,
      [shopId, s.name, s.duration_min, s.price, s.description, s.image_url]
    )
    serviceIds.push(r.rows[0].id)
  }
  console.log(`✓ ${serviceIds.length} servicios creados`)

  const rnd = (arr) => arr[Math.floor(Math.random() * arr.length)]
  const estados = ['pending', 'confirmed', 'done', 'done', 'done', 'done', 'cancelled']
  const hoy = new Date()
  const diaDeHoy = hoy.getDate()
  let creadas = 0

  // 6. Citas repartidas del día 1 hasta hoy (histórico del mes)
  for (let i = 0; i < 45; i++) {
    const cliente = rnd(CLIENTES)
    const fecha = new Date()
    fecha.setDate(Math.floor(Math.random() * diaDeHoy) + 1)
    fecha.setHours(9 + Math.floor(Math.random() * 9), Math.random() < 0.5 ? 0 : 30, 0, 0)
    try {
      await pool.query(
        `INSERT INTO appointments (barbershop_id, barber_id, service_id, client_name, client_phone, client_email, scheduled_at, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [shopId, rnd(barberIds), rnd(serviceIds), cliente[0], cliente[1], cliente[2], fecha, rnd(estados)]
      )
      creadas++
    } catch { /* choques de horario: se saltan */ }
  }

  // 7. Citas GARANTIZADAS para HOY (para que el dashboard tenga datos vivos)
  const citasHoy = [
    { h: 9,  m: 0,  status: 'confirmed' },
    { h: 10, m: 0,  status: 'pending'   },
    { h: 10, m: 30, status: 'confirmed' },
    { h: 11, m: 30, status: 'pending'   },
    { h: 14, m: 0,  status: 'confirmed' },
    { h: 15, m: 30, status: 'done'      },
    { h: 16, m: 30, status: 'done'      },
    { h: 17, m: 0,  status: 'confirmed' },
  ]
  for (const c of citasHoy) {
    const cliente = rnd(CLIENTES)
    const fecha = new Date()
    fecha.setHours(c.h, c.m, 0, 0)
    try {
      await pool.query(
        `INSERT INTO appointments (barbershop_id, barber_id, service_id, client_name, client_phone, client_email, scheduled_at, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [shopId, rnd(barberIds), rnd(serviceIds), cliente[0], cliente[1], cliente[2], fecha, c.status]
      )
      creadas++
    } catch { /* choques: se saltan */ }
  }

  console.log(`✓ ${creadas} citas creadas (incluyendo varias de HOY)`)
  console.log('\n✅ Listo. Refresca el dashboard de kevin@jtool.com para ver los datos.')
  await pool.end()
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1) })
