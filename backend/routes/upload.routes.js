const router        = require('express').Router()
const path           = require('path')
const fs             = require('fs')
const crypto         = require('crypto')
const multer         = require('multer')
const authMiddleware = require('../middleware/auth.middleware')

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads')
const ALLOWED_EXT  = ['.jpg', '.jpeg', '.png', '.webp']
const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp']
const MAX_SIZE = 2 * 1024 * 1024 // 2MB

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true })

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const unique = Date.now() + '-' + crypto.randomBytes(6).toString('hex')
    cb(null, unique + ext)
  },
})

function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase()
  if (!ALLOWED_EXT.includes(ext) || !ALLOWED_MIME.includes(file.mimetype)) {
    return cb(new Error('INVALID_TYPE'))
  }
  cb(null, true)
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE },
})

router.post('/', authMiddleware, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'La imagen no puede superar 2MB' })
      }
      if (err.message === 'INVALID_TYPE') {
        return res.status(400).json({ error: 'Solo se permiten imágenes JPG, PNG o WEBP' })
      }
      console.error(err)
      return res.status(400).json({ error: 'No se pudo subir la imagen' })
    }
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo' })
    }
    res.status(201).json({ url: '/uploads/' + req.file.filename })
  })
})

module.exports = router
