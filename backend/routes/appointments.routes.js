const router                 = require('express').Router()
const AppointmentsController = require('../controllers/appointments.controller')
const authMiddleware         = require('../middleware/auth.middleware')
const subscriptionMiddleware = require('../middleware/subscription.middleware')

router.use(authMiddleware)
router.use(subscriptionMiddleware)

router.get('/',          AppointmentsController.getAll)
router.post('/',         AppointmentsController.create)
router.put('/:id',       AppointmentsController.update)
router.patch('/:id',     AppointmentsController.updateStatus)
router.delete('/:id',    AppointmentsController.remove)
router.post('/:id/remind', AppointmentsController.remind)

module.exports = router