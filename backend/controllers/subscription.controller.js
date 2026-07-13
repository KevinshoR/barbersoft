const { MercadoPagoConfig, Preference, Payment } = require('mercadopago')
const pool = require('../config/db')

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN
})

const plans = {
  monthly: { title:'Barbersoft — Plan Mensual', price:89900, days:30  },
  annual:  { title:'Barbersoft — Plan Anual',   price:69900*12, days:365 },
}

const SubscriptionController = {

  async createPreference(req, res) {
    try {
      const { plan } = req.body
      if (!plans[plan]) return res.status(400).json({ error:'Plan inválido' })

      const selectedPlan = plans[plan]
      const shop = await pool.query(
        'SELECT id, name, email FROM barbershops WHERE id = $1',
        [req.barbershop.id]
      )
      const barbershop = shop.rows[0]
      if (!barbershop) return res.status(404).json({ error:'Barbería no encontrada' })

      const reference = `BARBERSOFT-${barbershop.id}-${plan}-${Date.now()}`

      const preference = new Preference(client)
      const response   = await preference.create({
        body: {
          items: [{
            title:      selectedPlan.title,
            quantity:   1,
            unit_price: selectedPlan.price,
            currency_id: 'COP',
          }],
          payer: { email: barbershop.email },
          external_reference: reference,
          back_urls: {
  success: `${process.env.FRONTEND_URL}/subscription?payment=success`,
  failure: `${process.env.FRONTEND_URL}/subscription?payment=failure`,
  pending: `${process.env.FRONTEND_URL}/subscription?payment=pending`,
},
notification_url: `${process.env.BACKEND_URL}/api/subscription/webhook`,
          payment_methods: {
            excluded_payment_types: [
              { id:'ticket' },
              { id:'atm' },
            ]
          }
        }
      })

      await pool.query(
        `INSERT INTO payment_attempts (barbershop_id, reference, plan, amount, status)
         VALUES ($1, $2, $3, $4, 'pending')
         ON CONFLICT (reference) DO NOTHING`,
        [barbershop.id, reference, plan, selectedPlan.price]
      )

      res.json({
        init_point:    response.init_point,
        sandbox_point: response.sandbox_init_point,
        reference,
      })

    } catch (err) {
      console.error('Error MP:', err)
      res.status(500).json({ error:'Error creando preferencia de pago' })
    }
  },

  async webhook(req, res) {
    try {
      const { type, data } = req.body
      if (type !== 'payment') return res.sendStatus(200)

      const payment = new Payment(client)
      const paymentData = await payment.get({ id: data.id })

      if (paymentData.status !== 'approved') return res.sendStatus(200)

      const reference = paymentData.external_reference
      const attempt   = await pool.query(
        'SELECT * FROM payment_attempts WHERE reference = $1',
        [reference]
      )

      if (!attempt.rows[0]) return res.sendStatus(200)

      const { barbershop_id, plan } = attempt.rows[0]
      const daysToAdd = plans[plan]?.days || 30
      const newEndDate = new Date()
      newEndDate.setDate(newEndDate.getDate() + daysToAdd)

      const dbClient = await pool.connect()
      try {
        await dbClient.query('BEGIN')

        await dbClient.query(
          `UPDATE barbershops
           SET subscription_status = 'active',
               subscription_ends_at = $1,
               current_plan = $2
           WHERE id = $3`,
          [newEndDate, plan, barbershop_id]
        )

        await dbClient.query(
          `UPDATE payment_attempts SET status = 'approved' WHERE reference = $1`,
          [reference]
        )

        // ── Bonus de referidos: +15 días para AMBAS barberías, solo en el
        // primer pago de la barbería referida (controlado por referral_bonus_given). ──
        const referredResult = await dbClient.query(
          'SELECT referred_by, referral_bonus_given FROM barbershops WHERE id = $1',
          [barbershop_id]
        )
        const referredRow = referredResult.rows[0]

        if (referredRow?.referred_by && !referredRow.referral_bonus_given) {
          const referrerResult = await dbClient.query(
            'SELECT id FROM barbershops WHERE referral_code = $1',
            [referredRow.referred_by]
          )
          const referrer = referrerResult.rows[0]

          if (referrer) {
            await dbClient.query(
              `UPDATE barbershops
               SET subscription_ends_at = COALESCE(subscription_ends_at, NOW()) + INTERVAL '15 days'
               WHERE id = $1`,
              [barbershop_id]
            )
            await dbClient.query(
              `UPDATE barbershops
               SET subscription_ends_at = COALESCE(subscription_ends_at, NOW()) + INTERVAL '15 days'
               WHERE id = $1`,
              [referrer.id]
            )
            await dbClient.query(
              `UPDATE barbershops SET referral_bonus_given = true WHERE id = $1`,
              [barbershop_id]
            )
            console.log(`✓ Bonus de referido: +15 días para barbershop_id ${barbershop_id} (referida) y ${referrer.id} (referidora, código ${referredRow.referred_by})`)
          } else {
            console.warn(`Referido: barbershop_id ${barbershop_id} tiene referred_by="${referredRow.referred_by}" pero no existe ninguna barbería con ese referral_code`)
          }
        }

        await dbClient.query('COMMIT')
      } catch (err) {
        await dbClient.query('ROLLBACK')
        throw err
      } finally {
        dbClient.release()
      }

      console.log('✓ Suscripción activada para barbershop_id:', barbershop_id)
      res.sendStatus(200)

    } catch (err) {
      console.error('Error webhook MP:', err)
      res.status(500).json({ error:'Error procesando pago' })
    }
  },

  async getStatus(req, res) {
    try {
      const result = await pool.query(
        `SELECT subscription_status, trial_ends_at, subscription_ends_at
         FROM barbershops WHERE id = $1`,
        [req.barbershop.id]
      )
      res.json(result.rows[0])
    } catch (err) {
      res.status(500).json({ error:'Error obteniendo estado' })
    }
  }
}

module.exports = SubscriptionController