// Modal de detalle ampliado reutilizable — usado para "ver más" de servicio y de barbero
// en la reserva pública. Mismo esqueleto visual (negro/dorado) para que ambos se sientan
// coherentes entre sí.
export default function DetailModal({ onClose, image, imageFallback, title, subtitle, children, onSelect, selectLabel }) {
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="animate-fade-up"
        style={{ background: 'var(--dark-2)', border: '1px solid var(--dark-4)', borderRadius: 20, overflow: 'hidden', maxWidth: 420, width: '100%', maxHeight: '88vh', display: 'flex', flexDirection: 'column' }}
      >
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {image ? (
            <img src={image} alt={title} style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }} />
          ) : (
            <div style={{ width: '100%', height: 220, background: 'linear-gradient(135deg, var(--gold-dim), var(--gold))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {imageFallback}
            </div>
          )}
          <button
            onClick={onClose}
            aria-label="Cerrar"
            title="Cerrar"
            style={{ position: 'absolute', top: 14, right: 14, width: 34, height: 34, borderRadius: '50%', background: 'rgba(13,13,13,0.6)', border: '1px solid rgba(245,240,232,0.25)', color: 'var(--cream)', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}
          >
            ×
          </button>
        </div>

        <div style={{ padding: '24px 24px 0', overflowY: 'auto', flex: 1 }}>
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 900, color: 'var(--cream)', marginBottom: subtitle ? 4 : 16 }}>{title}</h3>
          {subtitle && <p style={{ color: 'var(--gold)', fontSize: 14, fontWeight: 700, marginBottom: 16 }}>{subtitle}</p>}
          {children}
        </div>

        <div style={{ display: 'flex', gap: 10, padding: 24, flexShrink: 0 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, background: 'transparent', border: '1px solid var(--dark-4)', color: 'var(--cream-dim)', padding: '13px 0', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', fontFamily: 'var(--font-body)' }}
          >
            CERRAR
          </button>
          <button
            onClick={onSelect}
            style={{ flex: 2, background: 'var(--gold)', color: 'var(--dark)', border: 'none', padding: '13px 0', borderRadius: 10, cursor: 'pointer', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', fontFamily: 'var(--font-body)' }}
          >
            {selectLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
