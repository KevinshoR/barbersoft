import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { getDepartments, getMunicipalities } from '../data/colombia'
import { requiredError } from '../utils/validators'
import ThemeToggle from '../components/ThemeToggle'

export default function FindShop() {
  const [department, setDepartment]     = useState('')
  const [municipality, setMunicipality] = useState('')
  const [touched, setTouched]           = useState({})
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [results, setResults]           = useState(null)

  const [showSlugFallback, setShowSlugFallback] = useState(false)
  const [slug, setSlug]               = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [slugLoading, setSlugLoading] = useState(false)
  const [slugError, setSlugError]     = useState('')

  const navigate = useNavigate()

  const departmentFieldError = requiredError(department, 'El departamento')
  const municipalityFieldError = (municipality && department && !getMunicipalities(department).includes(municipality))
    ? 'Ese municipio no pertenece al departamento seleccionado. Elígelo de la lista.'
    : null
  const slugFieldError = requiredError(slug, 'El nombre de la barbería')

  const handleDepartmentChange = (e) => {
    setDepartment(e.target.value)
    setMunicipality('')
    setError('')
    setTouched(t => ({ ...t, department: true }))
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    setError('')
    setTouched({ department: true, municipality: true })
    if (departmentFieldError || municipalityFieldError) return
    setLoading(true)
    setResults(null)
    try {
      const res = await api.get('/public/search', { params: { department, municipality: municipality.trim() || undefined } })
      setResults(res.data.barbershops)
    } catch {
      setError('No pudimos buscar barberías. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleSlugSearch = async (e) => {
    e.preventDefault()
    setSlugTouched(true)
    if (slugFieldError) return
    const clean = slug.trim().toLowerCase().replace(/\s+/g, '-')
    setSlugLoading(true)
    setSlugError('')
    try {
      await api.get('/public/' + clean)
      navigate('/reservar/' + clean)
    } catch {
      setSlugError('No encontramos esa barbería. Verifica el nombre e intenta de nuevo.')
    } finally {
      setSlugLoading(false)
    }
  }

  const inputStyle = { width:'100%', padding:'13px 16px', background:'var(--surface-1)', border:'1px solid var(--border-soft)', color:'var(--cream)', borderRadius:10, fontSize:14, fontFamily: 'var(--font-body)', outline:'none' }

  return (
    <div style={{ minHeight:'100vh', background:'var(--dark)', display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily: 'var(--font-body)', position:'relative', overflow:'hidden' }}>
      <ThemeToggle floating />
      <div style={{ position:'absolute', top:-150, left:'50%', transform:'translateX(-50%)', width:500, height:500, borderRadius:'50%', background:'radial-gradient(circle, rgba(201,168,76,0.07) 0%, transparent 70%)', pointerEvents:'none' }} />

      <div className="animate-fade-up" style={{ width:'100%', maxWidth:520, position:'relative', zIndex:1 }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:40 }}>
          <div style={{ fontSize:40, color:'var(--gold)', marginBottom:10 }}>✂</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize:32, fontWeight:900, color:'var(--cream)', marginBottom:8, letterSpacing:'-0.02em' }}>
            Barber<span style={{ color:'var(--gold)' }}>soft</span>
          </h1>
          <p style={{ color:'var(--cream-dim)', fontSize:14 }}>
            Reserva tu cita en tu barbería favorita
          </p>
        </div>

        {/* Card */}
        <div style={{ background:'var(--dark-2)', border:'1px solid var(--dark-4)', borderRadius:16, padding:32 }}>
          <p style={{ color:'var(--gold)', fontSize:11, letterSpacing:'0.1em', fontWeight:700, marginBottom:6 }}>BUSCAR BARBERÍA POR UBICACIÓN</p>
          <p style={{ color:'var(--cream-dim)', fontSize:13, marginBottom:24, lineHeight:1.6 }}>
            Elige el departamento y, si quieres, el municipio para encontrar barberías cerca de ti.
          </p>

          {error && (
            <div style={{ background:'rgba(232,201,122,0.1)', border:'1px solid rgba(232,201,122,0.3)', color:'var(--danger)', borderRadius:8, padding:'12px 16px', marginBottom:16, fontSize:13 }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSearch} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <label style={{ display:'block', fontSize:11, letterSpacing:'0.08em', color:'var(--gold)', marginBottom:7, fontWeight:600 }}>
                DEPARTAMENTO
              </label>
              <select value={department} onChange={handleDepartmentChange} onBlur={() => setTouched(t => ({ ...t, department: true }))} style={{ ...inputStyle, border: '1px solid ' + (touched.department && departmentFieldError ? 'var(--danger)' : 'var(--border-soft)') }}>
                <option value="">Selecciona un departamento...</option>
                {getDepartments().map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {touched.department && departmentFieldError && <p style={{ color:'var(--danger)', fontSize:12, marginTop:6 }}>⚠ {departmentFieldError}</p>}
            </div>

            <div>
              <label style={{ display:'block', fontSize:11, letterSpacing:'0.08em', color:'var(--gold)', marginBottom:7, fontWeight:600 }}>
                MUNICIPIO (OPCIONAL)
              </label>
              <input
                list="municipios-findshop"
                value={municipality}
                onChange={e => { setMunicipality(e.target.value); setError(''); setTouched(t => ({ ...t, municipality: true })) }}
                onBlur={() => setTouched(t => ({ ...t, municipality: true }))}
                disabled={!department}
                placeholder={department ? 'Escribe para buscar...' : 'Elige un departamento primero'}
                autoComplete="off"
                style={{ ...inputStyle, opacity: department ? 1 : 0.5, border: '1px solid ' + (touched.municipality && municipalityFieldError ? 'var(--danger)' : 'var(--border-soft)') }}
              />
              <datalist id="municipios-findshop">
                {getMunicipalities(department).map(m => <option key={m} value={m} />)}
              </datalist>
              {touched.municipality && municipalityFieldError && <p style={{ color:'var(--danger)', fontSize:12, marginTop:6 }}>⚠ {municipalityFieldError}</p>}
            </div>

            <button
              type="submit"
              disabled={loading || !!departmentFieldError || !!municipalityFieldError}
              style={{ background: (loading || departmentFieldError || municipalityFieldError) ? 'var(--gold-dim)' : 'var(--gold)', color:'var(--dark)', border:'none', padding:'14px 0', borderRadius:10, cursor: (loading || departmentFieldError || municipalityFieldError) ? 'not-allowed' : 'pointer', fontSize:12, fontWeight:700, letterSpacing:'0.08em', fontFamily: 'var(--font-body)', transition:'background 0.2s' }}
            >
              {loading ? 'BUSCANDO...' : 'BUSCAR →'}
            </button>
          </form>

          {/* Resultados */}
          {results !== null && (
            <div className="animate-fade-up" style={{ marginTop:24 }}>
              {results.length === 0 ? (
                <p style={{ color:'var(--cream-dim)', fontSize:13, textAlign:'center', padding:'16px 0' }}>
                  No encontramos barberías registradas en esa ubicación todavía.
                </p>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {results.map(shop => (
                    <div key={shop.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, background:'var(--surface-1)', border:'1px solid var(--dark-4)', borderRadius:10, padding:'14px 16px' }}>
                      <div style={{ minWidth:0 }}>
                        <p style={{ color:'var(--cream)', fontWeight:600, fontSize:14 }}>{shop.name}</p>
                        <p style={{ color:'var(--cream-dim)', fontSize:12, marginTop:2 }}>{[shop.municipality, shop.department].filter(Boolean).join(', ')}</p>
                      </div>
                      <button
                        onClick={() => navigate('/reservar/' + shop.slug)}
                        style={{ background:'var(--gold)', color:'var(--dark)', border:'none', padding:'9px 16px', borderRadius:8, cursor:'pointer', fontSize:11, fontWeight:700, letterSpacing:'0.06em', fontFamily: 'var(--font-body)', flexShrink:0 }}
                      >
                        RESERVAR →
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Búsqueda por nombre/slug — fallback secundario */}
          <div style={{ borderTop:'1px solid var(--dark-4)', marginTop:24, paddingTop:20 }}>
            <button
              type="button"
              onClick={() => setShowSlugFallback(prev => !prev)}
              style={{ background:'none', border:'none', color:'var(--cream-dim)', fontSize:12, cursor:'pointer', padding:0, textDecoration:'underline' }}
            >
              {showSlugFallback ? '← Buscar por ubicación' : '¿Ya conoces el nombre o código de la barbería? Buscar por nombre'}
            </button>

            {showSlugFallback && (
              <div className="animate-fade-up" style={{ marginTop:16 }}>
                {slugError && (
                  <div style={{ background:'rgba(232,201,122,0.1)', border:'1px solid rgba(232,201,122,0.3)', color:'var(--danger)', borderRadius:8, padding:'12px 16px', marginBottom:14, fontSize:13 }}>
                    ⚠ {slugError}
                  </div>
                )}
                <form onSubmit={handleSlugSearch} style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  <input
                    value={slug}
                    onChange={e => { setSlug(e.target.value); setSlugError('') }}
                    onBlur={() => setSlugTouched(true)}
                    placeholder="Ej: barberia-el-paisa"
                    style={{ ...inputStyle, border: '1px solid ' + (slugTouched && slugFieldError ? 'var(--danger)' : 'var(--border-soft)') }}
                  />
                  {slugTouched && slugFieldError && <p style={{ color:'var(--danger)', fontSize:12, marginTop:-2 }}>⚠ {slugFieldError}</p>}
                  <button
                    type="submit"
                    disabled={slugLoading || !!slugFieldError}
                    style={{ background:'transparent', color:'var(--gold)', border:'1px solid rgba(201,168,76,0.4)', padding:'12px 0', borderRadius:10, cursor: (slugLoading || slugFieldError) ? 'not-allowed' : 'pointer', fontSize:12, fontWeight:700, letterSpacing:'0.06em', fontFamily: 'var(--font-body)', opacity: slugFieldError ? 0.6 : 1 }}
                  >
                    {slugLoading ? 'BUSCANDO...' : 'BUSCAR POR NOMBRE'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        <p style={{ textAlign:'center', color:'var(--cream-dim)', fontSize:12, marginTop:20, opacity:0.7 }}>
          ¿Eres dueño de una barbería?{' '}
          <span
            onClick={() => window.location.href='/login'}
            style={{ color:'var(--gold)', cursor:'pointer', fontWeight:600 }}
          >
            Accede al panel
          </span>
        </p>
      </div>
    </div>
  )
}
