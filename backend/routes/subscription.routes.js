const router                 = require('express').Router()
const SubscriptionController = require('../controllers/subscription.controller')
const authMiddleware         = require('../middleware/auth.middleware')

router.post('/create-preference', authMiddleware, SubscriptionController.createPreference)
router.post('/webhook',           SubscriptionController.webhook)
router.get('/status',             authMiddleware, SubscriptionController.getStatus)

module.exports = router