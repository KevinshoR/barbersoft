/* Paginación compacta: muestra 1 2 3 ... 13 14 en vez de todos los números.
   Uso: <Pagination page={page} totalPages={n} onChange={setPage} /> */
export default function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null

  // Construye la lista de páginas con elipsis
  const pages = []
  const push = (p) => pages.push(p)

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) push(i)
  } else {
    push(1)
    if (page > 3) push('…')
    const start = Math.max(2, page - 1)
    const end = Math.min(totalPages - 1, page + 1)
    for (let i = start; i <= end; i++) push(i)
    if (page < totalPages - 2) push('…')
    push(totalPages)
  }

  const btn = (active) => ({
    minWidth: 38, height: 38, padding: '0 12px', borderRadius: 9, cursor: 'pointer', fontSize: 13, fontWeight: active ? 700 : 500,
    background: active ? 'var(--gold)' : 'var(--dark-2)',
    color: active ? 'var(--dark)' : 'var(--cream-dim)',
    border: '1px solid ' + (active ? 'var(--gold)' : 'var(--dark-4)'),
    transition: 'all 0.15s',
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 24, flexWrap: 'wrap' }}>
      <button onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1}
        style={{ ...btn(false), color: page === 1 ? 'var(--dark-4)' : 'var(--cream-dim)', cursor: page === 1 ? 'not-allowed' : 'pointer' }}>←</button>

      {pages.map((p, i) => p === '…' ? (
        <span key={'e' + i} style={{ color: 'var(--cream-dim)', padding: '0 4px', userSelect: 'none' }}>…</span>
      ) : (
        <button key={p} onClick={() => onChange(p)} style={btn(p === page)}>{p}</button>
      ))}

      <button onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}
        style={{ ...btn(false), color: page === totalPages ? 'var(--dark-4)' : 'var(--cream-dim)', cursor: page === totalPages ? 'not-allowed' : 'pointer' }}>→</button>
    </div>
  )
}