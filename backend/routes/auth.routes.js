const router         = require('express').Router()
const AuthController = require('../controllers/auth.controller')
const authMiddleware = require('../middleware/auth.middleware')

router.post('/register',        AuthController.register)
router.post('/login',           AuthController.login)
router.get('/me',      authMiddleware, AuthController.me)
router.put('/profile', authMiddleware, AuthController.updateProfile)
router.post('/forgot-password', AuthController.forgotPassword)
router.post('/reset-password',  AuthController.resetPassword)

module.exports = router