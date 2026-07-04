const express = require('express')
const router = express.Router()
const SyncController = require('../controllers/sync.controller')

// Servidor-a-servidor (JTool Enterprise → Barbersoft). Protegido por x-sync-secret.
router.post('/subscription', SyncController.subscription)

module.exports = router