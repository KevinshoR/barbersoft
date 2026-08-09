import { useRef, useState } from 'react'
import api from '../services/api'
import { useToast } from '../context/ToastContext'

// Las imágenes subidas (/uploads/...) se sirven desde el host del backend,
// no desde /api — quitamos el sufijo /api de la baseURL para armar la URL absoluta.
const API_ORIGIN = (api.defaults.baseURL || '').replace(/\/api\/?$/, '')

export function resolveImageSrc(url) {
  if (!url) return ''
  if (url.startsWith('/uploads/')) return API_ORIGIN + url
  return url
}

const isValidLink = (url) => /^https?:\/\/.+/i.test(url)

// Comprime/redimensiona la imagen EN EL NAVEGADOR antes de subirla.
// Motivo: las fotos de celular pesan 3-8MB y el backend solo acepta 2MB, así
// que casi todas fallaban. Esto redibuja la imagen en un canvas a un ancho
// máximo y la re-exporta como JPG con calidad ajustada, dejándola bien por
// debajo del límite. De paso convierte formatos raros (HEIC de iPhone que el
// navegador ya sabe mostrar) a JPG. Si por lo que sea la compresión falla,
// se sube el archivo original (mejor intentar que bloquear).
const MAX_DIMENSION = 1280   // ancho o alto máximo en px (suficiente para fotos de servicios/barberos)
const TARGET_BYTES  = 1.6 * 1024 * 1024  // apuntamos a ~1.6MB para ir con margen bajo el límite de 2MB

async function compressImage(file) {
  // Los GIF (animados) y SVG no se comprimen bien por canvas: se dejan tal cual.
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file

  try {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })

    const img = await new Promise((resolve, reject) => {
      const image = new Image()
      image.onload = () => resolve(image)
      image.onerror = reject
      image.src = dataUrl
    })

    // Calcular el nuevo tamaño respetando la proporción
    let { width, height } = img
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      if (width >= height) {
        height = Math.round(height * (MAX_DIMENSION / width))
        width = MAX_DIMENSION
      } else {
        width = Math.round(width * (MAX_DIMENSION / height))
        height = MAX_DIMENSION
      }
    }

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    // Fondo blanco para imágenes con transparencia (PNG → JPG no soporta alfa)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, width, height)
    ctx.drawImage(img, 0, 0, width, height)

    // Bajar la calidad hasta quedar bajo el objetivo de tamaño
    let quality = 0.85
    let blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', quality))
    while (blob && blob.size > TARGET_BYTES && quality > 0.4) {
      quality -= 0.15
      blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', quality))
    }

    if (!blob) return file  // el navegador no pudo exportar → subir original

    // Nombre con extensión .jpg
    const baseName = (file.name || 'foto').replace(/\.[^.]+$/, '')
    return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' })
  } catch {
    // Cualquier fallo (formato no legible, etc.) → subir el original sin comprimir
    return file
  }
}

export default function ImageUpload({ value, onChange, label }) {
  const toast = useToast()
  const [mode, setMode]           = useState('file')
  const [uploading, setUploading] = useState(false)
  const [linkDraft, setLinkDraft] = useState(value && !value.startsWith('/uploads/') ? value : '')
  const [imgError, setImgError]   = useState(false)
  const fileInputRef = useRef(null)

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setImgError(false)
    try {
      // Comprimir/redimensionar antes de subir (clave para fotos de celular).
      const toUpload = await compressImage(file)
      const formData = new FormData()
      formData.append('file', toUpload)
      // No fijar Content-Type a mano: el navegador debe generar el boundary del multipart.
      const res = await api.post('/upload', formData)
      onChange(res.data.url)
    } catch (err) {
      toast.error(err.response?.data?.error || 'No se pudo subir la imagen. Intenta de nuevo.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleLinkChange = (e) => {
    const v = e.target.value
    setLinkDraft(v)
    setImgError(false)
    if (!v || isValidLink(v)) onChange(v)
  }

  const handleRemove = () => {
    onChange('')
    setLinkDraft('')
    setImgError(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const tabBtn = (m, text) => (
    <button
      type="button"
      onClick={() => setMode(m)}
      style={{
        flex: 1, padding: '8px 0', borderRadius: 7, border: 'none', cursor: 'pointer',
        background: mode === m ? 'var(--gold)' : 'transparent',
        color: mode === m ? 'var(--dark)' : 'var(--cream-dim)',
        fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', fontFamily: 'var(--font-body)', transition: 'all 0.2s',
      }}
    >
      {text}
    </button>
  )

  const linkHasContent = linkDraft.length > 0
  const linkInvalid = linkHasContent && !isValidLink(linkDraft)

  return (
    <div>
      {label && (
        <label style={{ display: 'block', fontSize: 11, letterSpacing: '0.07em', color: 'var(--cream-dim)', marginBottom: 6, fontWeight: 600 }}>
          {label}
        </label>
      )}

      <div style={{ display: 'flex', gap: 4, background: 'var(--dark-3)', border: '1px solid var(--dark-4)', borderRadius: 9, padding: 4, marginBottom: 10, maxWidth: 280 }}>
        {tabBtn('file', 'SUBIR ARCHIVO')}
        {tabBtn('link', 'PEGAR LINK')}
      </div>

      {mode === 'file' ? (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            style={{ fontSize: 12, color: 'var(--cream-dim)', fontFamily: 'var(--font-body)' }}
          />
          {uploading && <p style={{ color: 'var(--gold)', fontSize: 12, marginTop: 6 }}>Optimizando y subiendo...</p>}
          <p style={{ color: 'var(--cream-dim)', fontSize: 11, marginTop: 4, opacity: 0.6 }}>Puedes subir una foto desde tu celular. Se optimiza sola.</p>
        </div>
      ) : (
        <div>
          <input
            value={linkDraft}
            onChange={handleLinkChange}
            placeholder="https://ejemplo.com/foto.jpg"
            style={{ width: '100%', padding: '12px 16px', background: 'var(--surface-1)', border: '1px solid ' + (linkInvalid ? 'var(--danger)' : 'var(--dark-4)'), color: 'var(--cream)', borderRadius: 10, fontSize: 14, fontFamily: 'var(--font-body)', outline: 'none' }}
          />
          {linkInvalid && <p style={{ color: 'var(--danger)', fontSize: 12, marginTop: 6 }}>⚠ El link debe empezar por http:// o https://</p>}
        </div>
      )}

      {value && !imgError && (
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src={resolveImageSrc(value)}
            alt="Vista previa"
            onError={() => setImgError(true)}
            style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--dark-4)' }}
          />
          <button
            type="button"
            onClick={handleRemove}
            style={{ background: 'none', border: '1px solid var(--dark-4)', color: 'var(--cream-dim)', padding: '7px 14px', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', fontFamily: 'var(--font-body)' }}
          >
            QUITAR
          </button>
        </div>
      )}
      {value && imgError && (
        <p style={{ color: 'var(--cream-dim)', fontSize: 12, marginTop: 8, opacity: 0.7 }}>No se pudo cargar la vista previa de esa imagen.</p>
      )}
    </div>
  )
}
