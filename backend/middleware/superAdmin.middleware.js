const pool = require('../config/db')

// Se monta DESPUÉS de authMiddleware (que ya dejó req.barbershop = { id, email }
// decodificado del JWT). El JWT no lleva is_super_admin, así que se verifica
// siempre contra la BD en vivo — evita que un token viejo conserve el permiso
// si a alguien se le quita el flag más adelante.
module.exports = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT is_super_admin FROM barbershops WHERE id = $1',
      [req.barbershop.id]
    )
    const shop = result.rows[0]
    if (!shop || !shop.is_super_admin) {
      return res.status(403).json({ error: 'No autorizado' })
    }
    next()
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error verificando permisos' })
  }
}
