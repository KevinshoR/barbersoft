import SearchBar from './SearchBar'

export default function ModuleHeader({ kicker, title, searchValue, onSearchChange, searchPlaceholder, filters, action }) {
  return (
    <div className="animate-fade-up">
      <p style={{ color: 'var(--gold)', fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'var(--font-body)' }}>{kicker}</p>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 34, fontWeight: 800, color: 'var(--cream)', marginTop: 4, marginBottom: 24 }}>{title}</h1>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, flexWrap: 'wrap' }}>
          {onSearchChange && (
            <SearchBar value={searchValue} onChange={onSearchChange} placeholder={searchPlaceholder} />
          )}
          {filters}
        </div>
        {action}
      </div>
    </div>
  )
}
