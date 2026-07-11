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
      const formData = new FormData()
      formData.append('file', file)
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
        fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', fontFamily: 'DM Sans', transition: 'all 0.2s',
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
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={uploading}
            style={{ fontSize: 12, color: 'var(--cream-dim)', fontFamily: 'DM Sans' }}
          />
          {uploading && <p style={{ color: 'var(--gold)', fontSize: 12, marginTop: 6 }}>Subiendo...</p>}
          <p style={{ color: 'var(--cream-dim)', fontSize: 11, marginTop: 4, opacity: 0.6 }}>JPG, PNG o WEBP · máximo 2MB</p>
        </div>
      ) : (
        <div>
          <input
            value={linkDraft}
            onChange={handleLinkChange}
            placeholder="https://ejemplo.com/foto.jpg"
            style={{ width: '100%', padding: '12px 16px', background: 'var(--surface-1)', border: '1px solid ' + (linkInvalid ? 'var(--danger)' : 'var(--dark-4)'), color: 'var(--cream)', borderRadius: 10, fontSize: 14, fontFamily: 'DM Sans', outline: 'none' }}
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
            style={{ background: 'none', border: '1px solid var(--dark-4)', color: 'var(--cream-dim)', padding: '7px 14px', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', fontFamily: 'DM Sans' }}
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
