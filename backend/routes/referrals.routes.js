const router             = require('express').Router()
const ReferralsController = require('../controllers/referrals.controller')
const authMiddleware      = require('../middleware/auth.middleware')

router.use(authMiddleware)

router.get('/me', ReferralsController.me)

module.exports = router
