const router             = require('express').Router()
const ReportsController  = require('../controllers/reports.controller')
const authMiddleware     = require('../middleware/auth.middleware')
const subMiddleware      = require('../middleware/subscription.middleware')

router.use(authMiddleware)
router.use(subMiddleware)

router.get('/monthly', ReportsController.monthly)

module.exports = router