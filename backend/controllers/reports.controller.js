const pool = require('../config/db')

const ReportsController = {
  async monthly(req, res) {
    try {
      const id    = req.barbershop.id
      const month = req.query.month || new Date().toISOString().slice(0, 7)  // 'YYYY-MM'

      // Rango del mes calculado con aritmética de STRINGS/enteros, sin pasar por
      // new Date('YYYY-MM-01') — esa forma se interpreta como medianoche UTC y,
      // en zona horaria Colombia (UTC-5), getFullYear()/getMonth() la leen como
      // el día anterior => el mes calculado quedaba mal y el rango salía vacío
      // (mismo tipo de bug de huso horario que ya se corrigió en hours.model.js).
      const [y, m] = month.split('-').map(Number)          // ej. 2026, 7
      const start  = month + '-01'                          // '2026-07-01'
      const nextY  = m === 12 ? y + 1 : y
      const nextM  = m === 12 ? 1 : m + 1
      const end    = `${nextY}-${String(nextM).padStart(2, '0')}-01`  // '2026-08-01'

      // Total de citas por estado
      const statusResult = await pool.query(
        `SELECT status, COUNT(*) as count
         FROM appointments
         WHERE barbershop_id = $1
           AND scheduled_at >= $2
           AND scheduled_at < $3
         GROUP BY status`,
        [id, start, end]
      )

      // Ingresos del mes (citas completadas)
      const revenueResult = await pool.query(
        `SELECT COALESCE(SUM(s.price), 0) as total
         FROM appointments a
         JOIN services s ON a.service_id = s.id
         WHERE a.barbershop_id = $1
           AND a.status = 'done'
           AND a.scheduled_at >= $2
           AND a.scheduled_at < $3`,
        [id, start, end]
      )

      // Barbero más solicitado
      const topBarberResult = await pool.query(
        `SELECT b.name, COUNT(*) as count
         FROM appointments a
         JOIN barbers b ON a.barber_id = b.id
         WHERE a.barbershop_id = $1
           AND a.scheduled_at >= $2
           AND a.scheduled_at < $3
           AND a.status != 'cancelled'
         GROUP BY b.name
         ORDER BY count DESC
         LIMIT 1`,
        [id, start, end]
      )

      // Servicio más pedido
      const topServiceResult = await pool.query(
        `SELECT s.name, COUNT(*) as count
         FROM appointments a
         JOIN services s ON a.service_id = s.id
         WHERE a.barbershop_id = $1
           AND a.scheduled_at >= $2
           AND a.scheduled_at < $3
           AND a.status != 'cancelled'
         GROUP BY s.name
         ORDER BY count DESC
         LIMIT 1`,
        [id, start, end]
      )
      const topClientResult = await pool.query(
  `SELECT a.client_name, a.client_phone, SUM(s.price) as total, COUNT(*) as visits
   FROM appointments a
   JOIN services s ON a.service_id = s.id
   WHERE a.barbershop_id = $1
     AND a.status = 'done'
     AND a.scheduled_at >= $2
     AND a.scheduled_at < $3
   GROUP BY a.client_name, a.client_phone
   ORDER BY total DESC
   LIMIT 1`,
  [id, start, end]
)

      // Citas por día del mes
      const dailyResult = await pool.query(
        `SELECT DATE(scheduled_at) as date, COUNT(*) as count
         FROM appointments
         WHERE barbershop_id = $1
           AND scheduled_at >= $2
           AND scheduled_at < $3
           AND status != 'cancelled'
         GROUP BY DATE(scheduled_at)
         ORDER BY date ASC`,
        [id, start, end]
      )

      // Ingresos por servicio
      const revenueByServiceResult = await pool.query(
        `SELECT s.name, COUNT(*) as count, SUM(s.price) as total
         FROM appointments a
         JOIN services s ON a.service_id = s.id
         WHERE a.barbershop_id = $1
           AND a.status = 'done'
           AND a.scheduled_at >= $2
           AND a.scheduled_at < $3
         GROUP BY s.name
         ORDER BY total DESC`,
        [id, start, end]
      )

      const statuses = {}
      statusResult.rows.forEach(r => { statuses[r.status] = parseInt(r.count) })

      res.json({
  month,
  revenue:           parseFloat(revenueResult.rows[0].total),
  statuses:          { pending:0, confirmed:0, done:0, cancelled:0, ...statuses },
  topBarber:         topBarberResult.rows[0]  || null,
  topService:        topServiceResult.rows[0] || null,
  topClient:         topClientResult.rows[0]  || null,
  dailyAppointments: dailyResult.rows,
  revenueByService:  revenueByServiceResult.rows,
})

    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Error generando reporte' })
    }
  }
}

module.exports = ReportsController