const router = require('express').Router()
const rateLimit = require('express-rate-limit')
const ChatbotController = require('../controllers/chatbot.controller')

// Endpoint público (sin auth): lo usa el widget de chat tanto en el landing
// como en la reserva pública de una barbería.
const chatbotLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados mensajes seguidos. Espera un momento.' },
})

router.post('/:slug', chatbotLimiter, ChatbotController.chat)

module.exports = router
