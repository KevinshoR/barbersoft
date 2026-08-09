const router           = require('express').Router()
const rateLimit        = require('express-rate-limit')
const AuthController   = require('../controllers/auth.controller')
const GoogleController = require('../controllers/google.controller')
const authMiddleware   = require('../middleware/auth.middleware')

// Limita intentos de acceso/registro para frenar fuerza bruta.
// skipSuccessfulRequests: los accesos correctos NO cuentan, solo los fallidos,
// así un usuario legítimo nunca se bloquea por entrar y salir varias veces.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  message: { error: 'Demasiados intentos de acceso. Espera unos minutos e intenta de nuevo.' },
})

router.post('/register',        authLimiter, AuthController.register)
router.post('/login',           authLimiter, AuthController.login)
router.get('/me',      authMiddleware, AuthController.me)
router.put('/profile', authMiddleware, AuthController.updateProfile)
router.post('/forgot-password', authLimiter, AuthController.forgotPassword)
router.post('/reset-password',  authLimiter, AuthController.resetPassword)

// Google Sign-In (One Tap): verifica el ID token contra Google y hace
// login o inicia el flujo de registro con datos prellenados.
router.post('/google/verify',   authLimiter, GoogleController.verify)
router.post('/google/register', authLimiter, GoogleController.register)

module.exports = router
