const express   = require('express')
const cors      = require('cors')
const helmet    = require('helmet')
const rateLimit = require('express-rate-limit')
const path      = require('path')
require('dotenv').config()

const app = express()

app.use(helmet())

// Lista blanca de orígenes permitidos (separados por comas en CORS_ORIGINS).
// En desarrollo se permiten peticiones sin origin (curl/Postman) para no
// romper pruebas; en producción se exige que el origin esté en la lista.
const allowedOrigins = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    if (!origin && process.env.NODE_ENV !== 'production') return callback(null, true)
    if (origin && allowedOrigins.includes(origin)) return callback(null, true)
    return callback(new Error('Origen no permitido por CORS'))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))
app.use(express.json())

// Límite general de peticiones por IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas peticiones. Intenta más tarde.' },
})
app.use('/api', generalLimiter)

// Archivos subidos (imágenes de servicios y barberos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

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
app.use('/api/upload', require('./routes/upload.routes'))
app.use('/api/referrals', require('./routes/referrals.routes'))
app.use('/api/chatbot', require('./routes/chatbot.routes'))
app.use('/api/admin', require('./routes/admin.routes'))

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