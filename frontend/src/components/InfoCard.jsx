export default function InfoCard({ icon, label, value }) {
  return (
    <div style={{ background: 'var(--surface-1)', border: '1px solid var(--border-soft)', borderRadius: 12, padding: 16 }}>
      <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--cream-dim)', textTransform: 'uppercase', marginBottom: 6, fontFamily: 'var(--font-body)' }}>
        {icon}{label}
      </p>
      <p style={{ color: 'var(--cream)', fontWeight: 700, fontSize: 18, fontFamily: 'var(--font-body)' }}>{value}</p>
    </div>
  )
}
