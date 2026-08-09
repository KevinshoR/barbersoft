const router         = require('express').Router()
const path           = require('path')
const multer         = require('multer')
const cloudinary     = require('cloudinary').v2
const authMiddleware = require('../middleware/auth.middleware')

// ─────────────────────────────────────────────────────────────
// Subida de imágenes a Cloudinary (almacenamiento permanente).
//
// Antes se guardaba en el disco local de Render, que es EFÍMERO: las
// imágenes desaparecían en cada redeploy. Ahora se suben a Cloudinary y
// se guarda la URL completa (https://res.cloudinary.com/...), que es
// permanente y se sirve rápido desde su CDN.
//
// Requiere 3 variables de entorno en Render:
//   CLOUDINARY_CLOUD_NAME
//   CLOUDINARY_API_KEY
//   CLOUDINARY_API_SECRET
// ─────────────────────────────────────────────────────────────

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
})

const ALLOWED_EXT  = ['.jpg', '.jpeg', '.png', '.webp']
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 5 * 1024 * 1024 // 5MB (el frontend ya comprime, esto es solo un tope de seguridad)

// Guardamos el archivo en MEMORIA (no en disco): lo mandamos directo a Cloudinary.
const storage = multer.memoryStorage()

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase()
  if (!ALLOWED_EXT.includes(ext) || !ALLOWED_MIME.includes(file.mimetype)) {
    return cb(new Error('INVALID_TYPE'))
  }
  cb(null, true)
}

const upload = multer({ storage, fileFilter, limits: { fileSize: MAX_SIZE } })

// Sube un buffer a Cloudinary usando un stream. Devuelve la info del recurso.
function subirACloudinary(buffer, barbershopId) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `barbersoft/${barbershopId || 'general'}`, // organiza por barbería
        resource_type: 'image',
        // Transformación de seguridad: nunca guardar algo gigante.
        transformation: [{ width: 1280, height: 1280, crop: 'limit', quality: 'auto:good' }],
      },
      (error, result) => {
        if (error) return reject(error)
        resolve(result)
      }
    )
    stream.end(buffer)
  })
}

router.post('/', authMiddleware, (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'La imagen no puede superar 5MB' })
      }
      if (err.message === 'INVALID_TYPE') {
        return res.status(400).json({ error: 'Solo se permiten imágenes JPG, PNG o WEBP' })
      }
      console.error('[upload] error de multer:', err)
      return res.status(400).json({ error: 'No se pudo procesar la imagen' })
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo' })
    }
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('[upload] Faltan las variables de Cloudinary en el entorno')
      return res.status(500).json({ error: 'El almacenamiento de imágenes no está configurado' })
    }

    try {
      // req.barbershop lo pone authMiddleware (mismo patrón que el resto de rutas)
      const barbershopId = req.barbershop?.id
      const result = await subirACloudinary(req.file.buffer, barbershopId)
      // Devolvemos la URL completa y permanente de Cloudinary.
      res.status(201).json({ url: result.secure_url })
    } catch (e) {
      console.error('[upload] error subiendo a Cloudinary:', e.message)
      res.status(502).json({ error: 'No se pudo subir la imagen. Intenta de nuevo.' })
    }
  })
})

module.exports = router

// ─────────────────────────────────────────────────────────────
// RUTA TEMPORAL DE DIAGNÓSTICO — /api/upload/ping
// Abre https://barbersoft-ga2u.onrender.com/api/upload/ping en el navegador.
// Le hace ping a Cloudinary con tus credenciales y muestra el resultado o el
// error EXACTO. QUITAR esta ruta una vez resuelto (no dejarla en producción).
// ─────────────────────────────────────────────────────────────
router.get('/ping', async (req, res) => {
  const cfg = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '(vacío)',
    api_key_len: (process.env.CLOUDINARY_API_KEY || '').length,
    api_secret_len: (process.env.CLOUDINARY_API_SECRET || '').length,
  }
  try {
    const result = await cloudinary.api.ping()
    res.json({ ok: true, cloudinary: result, config: cfg })
  } catch (e) {
    res.status(500).json({
      ok: false,
      config: cfg,
      error_message: e.message,
      http_code: e.error?.http_code || e.http_code,
      full: e.error || e,
    })
  }
})
