import { SearchIcon } from './Icons'

export default function SearchBar({ value, onChange, placeholder = 'Buscar...', maxWidth = 360 }) {
  return (
    <div style={{ position: 'relative', flex: 1, minWidth: 220, maxWidth }}>
      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--cream-dim)', display: 'flex', pointerEvents: 'none' }}>
        <SearchIcon size={16} />
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', padding: '11px 14px 11px 42px', fontSize: 14, background: 'var(--surface-1)', color: 'var(--cream)', border: '1px solid var(--border-soft)', borderRadius: 10, outline: 'none', fontFamily: 'var(--font-body)' }}
      />
    </div>
  )
}
