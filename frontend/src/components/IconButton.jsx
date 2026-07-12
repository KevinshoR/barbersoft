import { useState } from 'react'
import { EyeIcon, PencilIcon, TrashIcon } from './Icons'

const VARIANT_ICONS = {
  view: EyeIcon,
  edit: PencilIcon,
  delete: TrashIcon,
}

export default function IconButton({ variant = 'default', icon: CustomIcon, tooltip, onClick, disabled, size = 16 }) {
  const [hover, setHover] = useState(false)
  const danger = variant === 'delete'
  const Icon = CustomIcon || VARIANT_ICONS[variant]

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={tooltip}
        aria-label={tooltip}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: 34, height: 34, borderRadius: 9, cursor: disabled ? 'not-allowed' : 'pointer',
          background: danger ? 'rgba(232,201,122,0.08)' : 'var(--surface-1)',
          border: '1px solid ' + (danger ? 'rgba(232,201,122,0.25)' : 'var(--border-soft)'),
          color: danger ? 'var(--danger)' : (hover ? 'var(--gold)' : 'var(--cream-dim)'),
          borderColor: hover && !danger ? 'var(--gold)' : (danger ? 'rgba(232,201,122,0.25)' : 'var(--border-soft)'),
          opacity: disabled ? 0.5 : 1,
          transition: 'all 0.15s',
          flexShrink: 0,
        }}
      >
        {Icon && <Icon size={size} />}
      </button>
      {hover && tooltip && (
        <span style={{
          position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)',
          background: 'var(--dark-4)', color: 'var(--cream)', fontSize: 11, fontWeight: 600,
          fontFamily: 'var(--font-body)', padding: '4px 8px', borderRadius: 6, whiteSpace: 'nowrap',
          zIndex: 20, pointerEvents: 'none',
        }}>{tooltip}</span>
      )}
    </div>
  )
}
