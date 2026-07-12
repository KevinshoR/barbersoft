import { XIcon } from './Icons'

export default function RecordDetailModal({ onClose, kicker, title, image, placeholderIcon, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }} onClick={onClose}>
      <div
        className="animate-fade-up"
        onClick={(e) => e.stopPropagation()}
        style={{ background: 'var(--dark-2)', borderRadius: 18, width: '100%', maxWidth: 480, maxHeight: '92vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid var(--border-soft)' }}
      >
        {image !== undefined ? (
          <div style={{ position: 'relative', height: 240, background: 'var(--dark-3)', flexShrink: 0 }}>
            {image ? (
              <img src={image} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gold)', opacity: 0.25 }}>
                {placeholderIcon}
              </div>
            )}
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 45%)' }} />
            <button type="button" onClick={onClose} title="Cerrar" aria-label="Cerrar" style={{ position: 'absolute', top: 14, right: 14, background: 'rgba(0,0,0,0.55)', border: 'none', color: 'var(--cream)', cursor: 'pointer', display: 'flex', width: 34, height: 34, borderRadius: '50%', alignItems: 'center', justifyContent: 'center' }}>
              <XIcon size={18} />
            </button>
            <div style={{ position: 'absolute', bottom: 16, left: 22, right: 22 }}>
              <p style={{ color: 'var(--gold-light)', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>{kicker}</p>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: '#fff', marginTop: 2, lineHeight: 1.1 }}>{title}</h2>
            </div>
          </div>
        ) : (
          <div style={{ background: 'var(--dark)', padding: '20px 26px', borderBottom: '1px solid var(--border-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <div>
              <p style={{ color: 'var(--gold)', fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>{kicker}</p>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 21, fontWeight: 700, color: 'var(--cream)', marginTop: 2 }}>{title}</h2>
            </div>
            <button type="button" onClick={onClose} title="Cerrar" aria-label="Cerrar" style={{ background: 'none', border: 'none', color: 'var(--cream-dim)', cursor: 'pointer', display: 'flex', flexShrink: 0 }}>
              <XIcon size={22} />
            </button>
          </div>
        )}

        <div style={{ padding: 24, overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  )
}
