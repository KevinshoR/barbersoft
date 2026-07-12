import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

const ToastContext = createContext(null)

const TYPE_STYLES = {
  success: { icon: '✓', color: 'var(--success)', bg: 'rgba(201,168,76,0.15)' },
  error:   { icon: '✕', color: 'var(--danger)',  bg: 'rgba(232,201,122,0.15)'  },
  info:    { icon: 'i', color: 'var(--gold)',     bg: 'rgba(201,168,76,0.15)' },
  warning: { icon: '⚠', color: '#B8B0A0',         bg: 'rgba(184,176,160,0.15)' },
}

const AUTO_CLOSE_MS = 3500
const EXIT_MS       = 220

function ToastItem({ id, type, message, onClose }) {
  const [closing, setClosing] = useState(false)
  const cfg = TYPE_STYLES[type] || TYPE_STYLES.info

  const handleClose = useCallback(() => {
    setClosing(true)
    setTimeout(() => onClose(id), EXIT_MS)
  }, [id, onClose])

  useEffect(() => {
    const t = setTimeout(handleClose, AUTO_CLOSE_MS)
    return () => clearTimeout(t)
  }, [handleClose])

  return (
    <div
      role="status"
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 12,
        background: 'var(--dark-2)', border: '1px solid var(--dark-4)',
        borderLeft: '3px solid ' + cfg.color,
        borderRadius: 10, padding: '14px 16px', minWidth: 280, maxWidth: 380,
        boxShadow: '0 12px 32px rgba(0,0,0,0.45)', pointerEvents: 'auto',
        animation: (closing ? 'toastOut' : 'toastIn') + ' 0.22s ease forwards',
      }}
    >
      <div style={{ width: 22, height: 22, borderRadius: '50%', background: cfg.bg, color: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 900, flexShrink: 0, marginTop: 1 }}>
        {cfg.icon}
      </div>
      <p style={{ color: 'var(--cream)', fontSize: 13, fontWeight: 500, lineHeight: 1.5, flex: 1, margin: 0 }}>{message}</p>
      <button
        onClick={handleClose}
        aria-label="Cerrar aviso"
        style={{ background: 'none', border: 'none', color: 'var(--cream-dim)', cursor: 'pointer', fontSize: 16, lineHeight: 1, opacity: 0.6, flexShrink: 0 }}
      >
        ×
      </button>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const idRef = useRef(0)

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const push = useCallback((type, message) => {
    const id = ++idRef.current
    setToasts(prev => [...prev, { id, type, message }])
  }, [])

  const api = useMemo(() => ({
    success: (msg) => push('success', msg),
    error:   (msg) => push('error', msg),
    info:    (msg) => push('info', msg),
    warning: (msg) => push('warning', msg),
  }), [push])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <style>{`
        @keyframes toastIn  { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes toastOut { from { opacity: 1; transform: translateX(0); }    to { opacity: 0; transform: translateX(24px); } }
      `}</style>
      <div style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 10, pointerEvents: 'none' }}>
        {toasts.map(t => (
          <ToastItem key={t.id} id={t.id} type={t.type} message={t.message} onClose={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de <ToastProvider>')
  return ctx
}
