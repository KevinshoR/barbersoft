const router         = require('express').Router()
const rateLimit      = require('express-rate-limit')
const AuthController = require('../controllers/auth.controller')
const authMiddleware = require('../middleware/auth.middleware')

// Limita intentos de acceso/registro para frenar fuerza bruta
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de acceso. Espera unos minutos e intenta de nuevo.' },
})

router.post('/register',        authLimiter, AuthController.register)
router.post('/login',           authLimiter, AuthController.login)
router.get('/me',      authMiddleware, AuthController.me)
router.put('/profile', authMiddleware, AuthController.updateProfile)
router.post('/forgot-password', authLimiter, AuthController.forgotPassword)
router.post('/reset-password',  authLimiter, AuthController.resetPassword)

module.exports = router