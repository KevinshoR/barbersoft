const router                 = require('express').Router()
const BarbersController      = require('../controllers/barbers.controller')
const authMiddleware         = require('../middleware/auth.middleware')
const subscriptionMiddleware = require('../middleware/subscription.middleware')

router.use(authMiddleware)
router.use(subscriptionMiddleware)

router.get('/',       BarbersController.getAll)
router.post('/',      BarbersController.create)
router.put('/:id',    BarbersController.update)
router.delete('/:id', BarbersController.remove)

module.exports = router