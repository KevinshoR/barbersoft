const pool = require('../config/db')

const ReferralsController = {
  async me(req, res) {
    try {
      const shopResult = await pool.query(
        'SELECT referral_code FROM barbershops WHERE id = $1',
        [req.barbershop.id]
      )
      const shop = shopResult.rows[0]
      if (!shop) return res.status(404).json({ error: 'Barbería no encontrada' })

      const countsResult = await pool.query(
        `SELECT COUNT(*)                                                as total_referidos,
                COUNT(*) FILTER (WHERE referral_bonus_given = true)     as referidos_con_pago
         FROM barbershops
         WHERE referred_by = $1`,
        [shop.referral_code]
      )
      const counts = countsResult.rows[0]

      res.json({
        referral_code:      shop.referral_code,
        total_referidos:    parseInt(counts.total_referidos),
        referidos_con_pago: parseInt(counts.referidos_con_pago),
      })
    } catch (err) {
      console.error(err)
      res.status(500).json({ error: 'Error obteniendo referidos' })
    }
  }
}

module.exports = ReferralsController
