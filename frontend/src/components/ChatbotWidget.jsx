import { useState, useRef, useEffect } from 'react'
import api from '../services/api'

/* ═══════════════════════════════════════════════════════════
   ChatbotWidget — asistente virtual de Barbersoft.
   Burbuja flotante dorada/negra, coherente con el diseño vintage.
   Uso: <ChatbotWidget slug={slug} shopName="Barberia X" />
   Si no se pasa slug, usa 'landing' (contexto general del producto).
═══════════════════════════════════════════════════════════ */

const Ic = {
  chat: (p) => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"/></svg>,
  x: (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M18 6 6 18M6 6l12 12"/></svg>,
  send: (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>,
  scissors: (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M20 4 8.12 15.88M14.47 14.48 20 20M8.12 8.12 12 12"/></svg>,
  sparkle: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" {...p}><path d="M12 2l1.9 5.8a2 2 0 0 0 1.3 1.3L21 11l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 20l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 11l5.8-1.9a2 2 0 0 0 1.3-1.3L12 2Z"/></svg>,
}

export default function ChatbotWidget({ slug = 'landing', shopName }) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showBubble, setShowBubble] = useState(true)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  const saludo = shopName
    ? `¡Hola! 👋 Soy el asistente de ${shopName}. Puedo contarte sobre nuestros servicios, precios, horarios y ayudarte a agendar tu cita. ¿En qué te ayudo?`
    : `¡Hola! 👋 Soy el asistente de Barbersoft. Puedo resolver tus dudas sobre el sistema, los planes y cómo digitalizar tu barbería. ¿Qué quieres saber?`

  // Mensaje de bienvenida al abrir por primera vez
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ role: 'assistant', content: saludo }])
    }
  }, [open]) // eslint-disable-line

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, loading])

  // Ocultar el globito tras unos segundos
  useEffect(() => {
    const t = setTimeout(() => setShowBubble(false), 8000)
    return () => clearTimeout(t)
  }, [])

  const sugerencias = shopName
    ? ['¿Qué servicios ofrecen?', '¿Cuáles son los horarios?', '¿Cómo agendo una cita?']
    : ['¿Qué es Barbersoft?', '¿Cuánto cuesta?', '¿Cómo empiezo?']

  const send = async (text) => {
    const content = (text ?? input).trim()
    if (!content || loading) return
    const nextMessages = [...messages, { role: 'user', content }]
    setMessages(nextMessages)
    setInput('')
    setLoading(true)
    try {
      const payload = nextMessages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .slice(-12)
        .map(m => ({ role: m.role, content: m.content }))
      const res = await api.post('/chatbot/' + slug, { messages: payload })
      const reply = res.data?.reply || 'Lo siento, no pude procesar eso. ¿Puedes reformularlo?'
      setMessages(m => [...m, { role: 'assistant', content: reply }])
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'En este momento no puedo responder. Puedes agendar directamente con el botón de reservar, o intentar de nuevo en un momento. 🙏' }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }

  return (
    <>
      {/* ─── Botón flotante ─── */}
      {!open && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 900, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
          {showBubble && (
            <div
              onClick={() => setOpen(true)}
              className="animate-fade-up"
              style={{ background: 'var(--dark-2)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: '14px 14px 4px 14px', padding: '12px 16px', maxWidth: 230, cursor: 'pointer', boxShadow: '0 8px 30px rgba(0,0,0,0.4)' }}
            >
              <p style={{ color: 'var(--gold)', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                {Ic.sparkle()} ASISTENTE VIRTUAL
              </p>
              <p style={{ color: 'var(--cream)', fontSize: 13, lineHeight: 1.4 }}>
                ¿Tienes dudas? Pregúntame lo que quieras 💬
              </p>
            </div>
          )}
          <button
            onClick={() => setOpen(true)}
            aria-label="Abrir asistente"
            style={{ width: 62, height: 62, borderRadius: '50%', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-dim) 100%)', color: 'var(--dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 30px rgba(201,168,76,0.4)', position: 'relative' }}
          >
            {Ic.chat()}
            <span style={{ position: 'absolute', top: 2, right: 2, width: 14, height: 14, borderRadius: '50%', background: '#4ADE80', border: '2px solid var(--dark)' }} />
          </button>
        </div>
      )}

      {/* ─── Ventana del chat ─── */}
      {open && (
        <div
          className="animate-fade-up"
          style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 900, width: 'min(380px, calc(100vw - 32px))', height: 'min(560px, calc(100vh - 48px))', background: 'var(--dark)', border: '1px solid var(--dark-4)', borderRadius: 20, display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
        >
          {/* Header */}
          <div style={{ background: 'linear-gradient(135deg, var(--dark-2) 0%, var(--dark-3) 100%)', borderBottom: '1px solid var(--dark-4)', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg, var(--gold) 0%, var(--gold-dim) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--dark)', flexShrink: 0 }}>
              {Ic.scissors()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ color: 'var(--cream)', fontFamily: 'var(--font-display, Georgia, serif)', fontSize: 16, fontWeight: 700, lineHeight: 1.1 }}>
                Asistente {shopName ? '' : 'Barbersoft'}
              </p>
              <p style={{ color: 'var(--gold-light)', fontSize: 11, display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ADE80', display: 'inline-block' }} />
                En línea · te respondo al instante
              </p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Cerrar" style={{ background: 'transparent', border: 'none', color: 'var(--cream-dim)', cursor: 'pointer', display: 'flex', padding: 4 }}>
              {Ic.x()}
            </button>
          </div>

          {/* Mensajes */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '82%', padding: '11px 14px', borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  background: m.role === 'user' ? 'linear-gradient(135deg, var(--gold) 0%, var(--gold-dim) 100%)' : 'var(--dark-2)',
                  color: m.role === 'user' ? 'var(--dark)' : 'var(--cream)',
                  border: m.role === 'user' ? 'none' : '1px solid var(--dark-4)',
                  fontSize: 13.5, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                }}>
                  {m.content}
                </div>
              </div>
            ))}

            {/* Sugerencias iniciales */}
            {messages.length === 1 && !loading && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                {sugerencias.map((s, i) => (
                  <button key={i} onClick={() => send(s)} style={{ textAlign: 'left', background: 'var(--surface-1)', border: '1px solid rgba(201,168,76,0.25)', borderRadius: 10, padding: '10px 14px', color: 'var(--gold-light)', fontSize: 13, cursor: 'pointer', transition: 'all 0.15s' }}
                    onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--gold)'}
                    onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(201,168,76,0.25)'}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Escribiendo... */}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{ padding: '12px 16px', borderRadius: '14px 14px 14px 4px', background: 'var(--dark-2)', border: '1px solid var(--dark-4)', display: 'flex', gap: 4 }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--gold)', animation: `chatDot 1.2s ${i * 0.2}s infinite ease-in-out` }} />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div style={{ borderTop: '1px solid var(--dark-4)', padding: 12, display: 'flex', gap: 8, background: 'var(--dark-2)' }}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') send() }}
              placeholder="Escribe tu mensaje..."
              maxLength={1000}
              style={{ flex: 1, background: 'var(--dark)', border: '1px solid var(--dark-4)', borderRadius: 12, padding: '11px 14px', color: 'var(--cream)', fontSize: 13.5, outline: 'none' }}
            />
            <button onClick={() => send()} disabled={loading || !input.trim()} aria-label="Enviar"
              style={{ width: 44, height: 44, borderRadius: 12, border: 'none', cursor: loading || !input.trim() ? 'default' : 'pointer', background: loading || !input.trim() ? 'var(--dark-4)' : 'var(--gold)', color: loading || !input.trim() ? 'var(--cream-dim)' : 'var(--dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
              {Ic.send()}
            </button>
          </div>

          {/* Firma */}
          <div style={{ background: 'var(--dark-2)', textAlign: 'center', paddingBottom: 8 }}>
            <p style={{ color: 'var(--cream-dim)', fontSize: 10, opacity: 0.6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              {Ic.sparkle({ width: 10, height: 10 })} Asistente con IA de Barbersoft
            </p>
          </div>
        </div>
      )}

      <style>{`@keyframes chatDot { 0%, 60%, 100% { transform: translateY(0); opacity: 0.5 } 30% { transform: translateY(-5px); opacity: 1 } }`}</style>
    </>
  )
}