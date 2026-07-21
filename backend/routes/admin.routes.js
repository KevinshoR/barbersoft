const router               = require('express').Router()
const AdminController      = require('../controllers/admin.controller')
const authMiddleware       = require('../middleware/auth.middleware')
const superAdminMiddleware = require('../middleware/superAdmin.middleware')

// Sin subscriptionMiddleware a propósito: un super admin debe poder entrar
// aunque su propia suscripción esté vencida.
router.use(authMiddleware)
router.use(superAdminMiddleware)

router.get('/barbershops',                AdminController.listBarbershops)
router.post('/barbershops/:id/extend',    AdminController.extend)
router.post('/barbershops/:id/block',     AdminController.block)

module.exports = router
