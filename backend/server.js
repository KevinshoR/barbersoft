const express = require('express')
const cors    = require('cors')
require('dotenv').config()

const app = express()

// En desarrollo se permite cualquier origen (la app móvil en Flutter Web
// corre en un puerto aleatorio que no se puede listar de antemano).
app.use(cors())
app.use(express.json())

// Rutas
app.use('/api/auth',         require('./routes/auth.routes'))
app.use('/api/appointments', require('./routes/appointments.routes'))
app.use('/api/services',     require('./routes/services.routes'))
app.use('/api/reports', require('./routes/reports.routes'))
app.use('/api/subscription',  require('./routes/subscription.routes'))
app.use('/api/barbers',      require('./routes/barbers.routes'))
app.use('/api/public',       require('./routes/public.routes'))
app.use('/api/hours', require('./routes/hours.routes'))
app.use('/api/sync',  require('./routes/sync.routes'))

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({ message: 'Barbería SaaS API funcionando' })
})

// Job de recordatorios
require('./jobs/reminder.job')

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`)
})  