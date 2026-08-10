// backend/routes/push.routes.js
const router = require('express').Router()
const PushController = require('../controllers/push.controller')
const authMiddleware = require('../middleware/auth.middleware')

// Clave pública: abierta, es segura de exponer
router.get('/public-key', PushController.publicKey)

// Todas las demás requieren estar autenticado como barbería
router.use(authMiddleware)
router.post  ('/subscribe',   PushController.subscribe)
router.post  ('/unsubscribe', PushController.unsubscribe)
router.get   ('/status',      PushController.status)

module.exports = router
