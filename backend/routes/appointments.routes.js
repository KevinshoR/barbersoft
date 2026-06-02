const router                 = require('express').Router()
const AppointmentsController = require('../controllers/appointments.controller')
const authMiddleware         = require('../middleware/auth.middleware')
const subscriptionMiddleware = require('../middleware/subscription.middleware')

router.use(authMiddleware)
router.use(subscriptionMiddleware)

router.get('/',          AppointmentsController.getAll)
router.post('/',         AppointmentsController.create)
router.patch('/:id',     AppointmentsController.updateStatus)
router.delete('/:id',    AppointmentsController.remove)

module.exports = router