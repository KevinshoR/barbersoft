const router              = require('express').Router()
const ServicesController  = require('../controllers/services.controller')
const authMiddleware       = require('../middleware/auth.middleware')
const subscriptionMiddleware = require('../middleware/subscription.middleware')

router.use(authMiddleware)
router.use(subscriptionMiddleware)

router.get('/',        ServicesController.getAll)
router.post('/',       ServicesController.create)
router.put('/:id',     ServicesController.update)
router.delete('/:id',  ServicesController.remove)

module.exports = router