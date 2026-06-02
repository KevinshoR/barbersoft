const router           = require('express').Router()
const HoursController  = require('../controllers/hours.controller')
const authMiddleware   = require('../middleware/auth.middleware')
const subMiddleware    = require('../middleware/subscription.middleware')

router.use(authMiddleware)
router.use(subMiddleware)

router.get('/',         HoursController.getAll)
router.put('/:day_of_week', HoursController.update)

module.exports = router