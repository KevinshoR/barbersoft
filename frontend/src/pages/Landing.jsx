import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ChatbotWidget from '../components/ChatbotWidget'

export default function Landing() {
  const navigate = useNavigate()

  useEffect(() => {
    // Navbar scroll
    const handleScroll = () => {
      const nav = document.getElementById('navbar')
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 40)
    }
    window.addEventListener('scroll', handleScroll)

    // Scroll reveal
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible') })
    }, { threshold: 0.1 })
    document.querySelectorAll('.fade-up').forEach(el => observer.observe(el))

    // Contadores
    function animateCount(el, target, suffix = '', duration = 1200) {
      const start = performance.now()
      const update = (time) => {
        const progress = Math.min((time - start) / duration, 1)
        const ease     = 1 - Math.pow(1 - progress, 3)
        el.textContent = Math.round(ease * target) + suffix
        if (progress < 1) requestAnimationFrame(update)
      }
      requestAnimationFrame(update)
    }
    const countObserver = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting && !e.target.dataset.counted) {
          e.target.dataset.counted = true
          animateCount(e.target, parseInt(e.target.dataset.count), e.target.dataset.suffix || '')
        }
      })
    }, { threshold: 0.5 })
    document.querySelectorAll('[data-count]').forEach(el => countObserver.observe(el))

    // Mockup: KPIs animados
    setTimeout(() => {
      const mc = document.getElementById('mock-count')
      const mb = document.getElementById('mock-barbers')
      const mr = document.getElementById('mock-revenue')
      if (mc) animateCount(mc, 8, '', 1000)
      if (mb) animateCount(mb, 3, '', 1200)
      if (mr) mr.textContent = '$1.240.000'
    }, 700)

    // Canvas partículas
    const canvas = document.getElementById('particles')
    if (canvas) {
      const ctx = canvas.getContext('2d')
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight
      window.addEventListener('resize', () => {
        canvas.width  = window.innerWidth
        canvas.height = window.innerHeight
      })
      class Particle {
        constructor() { this.reset() }
        reset() {
          this.x       = Math.random() * canvas.width
          this.y       = canvas.height + 10
          this.size    = Math.random() * 1.5 + 0.5
          this.speedY  = Math.random() * 0.4 + 0.2
          this.speedX  = (Math.random() - 0.5) * 0.3
          this.opacity = Math.random() * 0.4 + 0.1
          this.life    = 0
          this.maxLife = Math.random() * 300 + 200
        }
        update() {
          this.y -= this.speedY
          this.x += this.speedX
          this.life++
          if (this.life > this.maxLife || this.y < -10) this.reset()
        }
        draw() {
          ctx.save()
          ctx.globalAlpha = this.opacity * (1 - this.life / this.maxLife)
          ctx.fillStyle   = '#C9A84C'
          ctx.beginPath()
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        }
      }
      const particles = Array.from({ length: 60 }, () => {
        const p = new Particle()
        p.y    = Math.random() * canvas.height
        p.life = Math.random() * p.maxLife
        return p
      })
      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        particles.forEach(p => { p.update(); p.draw() })
        requestAnimationFrame(animate)
      }
      animate()
    }

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const goToRegister = () => navigate('/login?register=true')
  const goToLogin    = () => navigate('/login')

  return (
    <>
      <style>{`
        :root {
          --gold:#C9A84C; --gold-dim:#8B6914; --gold-glow:rgba(201,168,76,0.3);
          --dark:#0A0A0A; --dark-2:#111111; --dark-3:#1A1A1A; --dark-4:#242424;
          --cream:#F5F0E8; --cream-dim:#B8B0A0; --success:#C9A84C;
        }
        .landing-body { background:var(--dark); color:var(--cream); font-family:var(--font-body),sans-serif; overflow-x:hidden; }
        .landing-body h1,.landing-body h2,.landing-body h3 { font-family:var(--font-display),serif; }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
        @keyframes floaty   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes glowPul  { 0%,100%{box-shadow:0 0 30px rgba(201,168,76,0.12)} 50%{box-shadow:0 0 70px rgba(201,168,76,0.25)} }
        @keyframes drawLine { from{stroke-dashoffset:240} to{stroke-dashoffset:0} }
        .fade-up { opacity:0; transform:translateY(30px); transition:opacity 0.7s ease,transform 0.7s ease; }
        .fade-up.visible { opacity:1; transform:translateY(0); }
        .fade-up.delay-1{transition-delay:0.1s} .fade-up.delay-2{transition-delay:0.2s}
        .fade-up.delay-3{transition-delay:0.3s} .fade-up.delay-4{transition-delay:0.4s}
        #particles{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:0.4}

        /* ── Navbar ── */
        #navbar{position:fixed;top:0;left:0;right:0;z-index:1000;padding:0 clamp(16px,4vw,48px);height:68px;display:flex;align-items:center;justify-content:space-between;transition:all 0.3s}
        #navbar.scrolled{background:rgba(10,10,10,0.92);backdrop-filter:blur(20px);border-bottom:1px solid rgba(201,168,76,0.1)}
        .logo{font-family:var(--font-display),serif;font-size:22px;font-weight:900;color:var(--cream);display:flex;align-items:center;gap:10px;cursor:pointer}
        .logo-icon{color:var(--gold);font-size:20px}
        .logo span{color:var(--gold)}
        .nav-links{display:flex;align-items:center;gap:32px;list-style:none}
        .nav-links a{color:var(--cream-dim);text-decoration:none;font-size:13px;font-weight:500;letter-spacing:0.03em;transition:color 0.2s}
        .nav-links a:hover{color:var(--cream)}
        .btn-nav{background:var(--gold);color:var(--dark);border:none;padding:11px 22px;border-radius:9px;font-size:12px;font-weight:800;letter-spacing:0.06em;cursor:pointer;font-family:var(--font-body),sans-serif;transition:all 0.25s}
        .btn-nav:hover{background:#E8C97A;transform:translateY(-1px)}
        .btn-nav.ghost{background:transparent;color:var(--cream);border:1px solid rgba(255,255,255,0.16)}
        .btn-nav.ghost:hover{border-color:var(--gold);color:var(--gold);background:transparent}
        @media(max-width:820px){ .nav-links{display:none} }

        /* ── Hero dos columnas ── */
        .hero{min-height:100vh;display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:48px;align-items:center;max-width:1280px;margin:0 auto;padding:130px clamp(16px,4vw,48px) 70px;position:relative}
        .hero-badge{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(201,168,76,0.35);border-radius:999px;padding:8px 16px;font-size:11px;letter-spacing:0.12em;color:var(--gold);font-weight:700;margin-bottom:26px}
        .badge-dot{width:6px;height:6px;border-radius:50%;background:var(--gold);animation:pulse 2s infinite}
        .hero h1{font-size:clamp(44px,6.5vw,76px);line-height:1.02;font-weight:900;margin-bottom:22px;animation:fadeUp 0.8s ease both}
        .hero-line2{color:var(--gold)}
        .hero-sub{color:var(--cream-dim);font-size:clamp(15px,1.6vw,18px);line-height:1.6;max-width:480px;margin-bottom:30px;animation:fadeUp 0.8s ease 0.12s both}
        .hero-cta{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:26px;animation:fadeUp 0.8s ease 0.22s both}
        .btn-hero{display:inline-flex;align-items:center;gap:9px;padding:16px 28px;border-radius:11px;font-size:13px;font-weight:800;letter-spacing:0.07em;cursor:pointer;text-decoration:none;transition:all 0.25s;border:none;font-family:var(--font-body),sans-serif}
        .btn-hero-gold{background:var(--gold);color:var(--dark)}
        .btn-hero-gold:hover{background:#E8C97A;transform:translateY(-2px);box-shadow:0 12px 32px rgba(201,168,76,0.3)}
        .btn-hero-outline{background:transparent;color:var(--cream);border:1px solid rgba(255,255,255,0.18)}
        .btn-hero-outline:hover{border-color:var(--gold);color:var(--gold)}
        .hero-trust{display:flex;gap:20px;flex-wrap:wrap;animation:fadeUp 0.8s ease 0.32s both}
        .trust-item{display:inline-flex;align-items:center;gap:7px;color:var(--cream-dim);font-size:12.5px}
        .trust-item b{color:var(--gold);font-weight:800}

        /* ── Mockup dashboard ── */
        .mock-wrap{position:relative;animation:fadeUp 0.9s ease 0.25s both}
        .mock-window{background:var(--dark-2);border:1px solid var(--dark-4);border-radius:16px;overflow:hidden;animation:floaty 7s ease-in-out infinite,glowPul 5s ease-in-out infinite}
        .mock-top{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;background:var(--dark-3);border-bottom:1px solid var(--dark-4)}
        .mock-dots{display:flex;gap:6px}
        .mock-dot{width:9px;height:9px;border-radius:50%}
        .mock-brand{font-family:var(--font-display),serif;font-weight:800;font-size:12px;color:var(--cream)}
        .mock-brand span{color:var(--gold)}
        .mock-shop{font-size:9.5px;color:var(--cream-dim);display:flex;align-items:center;gap:5px}
        .mock-grid{display:grid;grid-template-columns:96px 1fr 118px;gap:0}
        .mock-side{background:var(--dark-3);border-right:1px solid var(--dark-4);padding:10px 7px;display:flex;flex-direction:column;gap:2px}
        .mock-side-item{font-size:8.5px;color:var(--cream-dim);padding:6px 8px;border-radius:6px;display:flex;align-items:center;gap:5px;white-space:nowrap}
        .mock-side-item.on{background:rgba(201,168,76,0.14);color:var(--gold);font-weight:700}
        .mock-main{padding:10px}
        .mock-kpis{display:grid;grid-template-columns:1fr 1.4fr 1fr;gap:6px;margin-bottom:9px}
        .mock-kpi{background:var(--dark-3);border:1px solid var(--dark-4);border-radius:9px;padding:8px}
        .mock-kpi-l{font-size:7px;letter-spacing:0.08em;color:var(--cream-dim);margin-bottom:3px}
        .mock-kpi-v{font-family:var(--font-display),serif;font-weight:800;font-size:15px;color:var(--gold)}
        .mock-agenda{background:var(--dark-3);border:1px solid var(--dark-4);border-radius:10px;padding:9px}
        .mock-ag-title{font-size:8px;letter-spacing:0.1em;color:var(--cream-dim);margin-bottom:7px;font-weight:700}
        .mock-row{display:flex;align-items:center;gap:8px;padding:5.5px 0;border-bottom:1px solid rgba(255,255,255,0.04)}
        .mock-row:last-child{border-bottom:none}
        .mock-time{font-size:9px;color:var(--gold);font-weight:800;width:30px;flex-shrink:0}
        .mock-cli{flex:1;min-width:0}
        .mock-cli-n{font-size:9.5px;color:var(--cream);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
        .mock-cli-s{font-size:7.5px;color:var(--cream-dim)}
        .mock-badge{font-size:6.5px;font-weight:800;letter-spacing:0.06em;padding:3px 7px;border-radius:99px;flex-shrink:0}
        .b-done{background:rgba(201,168,76,0.15);color:var(--gold)}
        .b-conf{background:rgba(201,168,76,0.25);color:#E8C97A}
        .b-pend{background:rgba(255,255,255,0.07);color:var(--cream-dim);animation:pulse 2s infinite}
        .mock-aside{background:var(--dark-3);border-left:1px solid var(--dark-4);padding:9px 8px;display:flex;flex-direction:column;gap:8px}
        .mock-card{background:var(--dark-2);border:1px solid var(--dark-4);border-radius:9px;padding:8px}
        .mock-card-l{font-size:7px;letter-spacing:0.08em;color:var(--gold);font-weight:800;margin-bottom:4px}
        .mock-card-t{font-size:10px;color:var(--cream);font-weight:700}
        .mock-card-s{font-size:7.5px;color:var(--cream-dim);margin-top:2px}
        .mock-rev{font-family:var(--font-display),serif;font-size:13px;font-weight:800;color:var(--gold)}
        .mock-up{font-size:7.5px;color:#8FBF7F}
        @media(max-width:520px){ .mock-grid{grid-template-columns:1fr} .mock-side,.mock-aside{display:none} }

        /* ── Features franja ── */
        .feat-band{max-width:1280px;margin:0 auto;padding:0 clamp(16px,4vw,48px) 40px}
        .feat-band-in{background:var(--dark-2);border:1px solid var(--dark-4);border-radius:18px;display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:0;overflow:hidden}
        .feat-cell{padding:26px 24px;display:flex;gap:14px;align-items:flex-start;border-right:1px solid var(--dark-4);transition:background 0.25s}
        .feat-cell:last-child{border-right:none}
        .feat-cell:hover{background:var(--dark-3)}
        .feat-ic{font-size:20px;color:var(--gold);flex-shrink:0;margin-top:2px}
        .feat-cell h3{font-size:15px;color:var(--gold);margin-bottom:5px;font-weight:700}
        .feat-cell p{font-size:12.5px;color:var(--cream-dim);line-height:1.5}
        @media(max-width:980px){ .feat-cell{border-right:none;border-bottom:1px solid var(--dark-4)} .feat-cell:last-child{border-bottom:none} }

        /* ── Secciones genéricas ── */
        .section-header{text-align:center;margin-bottom:54px}
        .section-eyebrow{display:block;font-size:11px;letter-spacing:0.22em;color:var(--gold);font-weight:800;margin-bottom:14px}
        .section-title{font-size:clamp(26px,3.6vw,40px);font-weight:900}

        /* ── 3 pasos ── */
        .steps3{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:28px;max-width:860px;margin:0 auto;position:relative}
        .step3{text-align:center;position:relative}
        .step3-circle{width:84px;height:84px;border-radius:50%;background:var(--dark-3);border:1px solid var(--dark-4);display:flex;align-items:center;justify-content:center;font-size:30px;margin:0 auto 20px;position:relative;transition:all 0.3s}
        .step3:hover .step3-circle{border-color:var(--gold);transform:translateY(-4px);box-shadow:0 12px 30px rgba(201,168,76,0.15)}
        .step3-num{position:absolute;top:-4px;left:-4px;width:26px;height:26px;border-radius:50%;background:var(--gold);color:var(--dark);font-size:12px;font-weight:900;display:flex;align-items:center;justify-content:center}
        .step3 h3{font-size:19px;margin-bottom:9px}
        .step3 p{color:var(--cream-dim);font-size:13.5px;line-height:1.55;max-width:230px;margin:0 auto}

        /* ── Enlace propio ── */
        .linkcard{max-width:1100px;margin:0 auto;background:var(--dark-2);border:1px solid var(--dark-4);border-radius:22px;padding:clamp(24px,4vw,48px);display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:40px;align-items:center}
        .phone{width:230px;margin:0 auto;background:#000;border:2px solid var(--dark-4);border-radius:28px;padding:10px;animation:floaty 6s ease-in-out infinite}
        .phone-scr{background:var(--dark-2);border-radius:20px;overflow:hidden}
        .phone-head{padding:14px 14px 8px;text-align:left}
        .phone-shop{font-family:var(--font-display),serif;font-weight:800;font-size:14px;color:var(--cream)}
        .phone-sub{font-size:9px;color:var(--cream-dim);margin-top:2px}
        .phone-svc{display:flex;align-items:center;gap:9px;background:#F5F0E8;margin:6px 10px;border-radius:10px;padding:8px 10px}
        .phone-svc-ic{width:24px;height:24px;border-radius:50%;background:#1A1A1A;color:#C9A84C;display:flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0}
        .phone-svc-n{font-size:9.5px;color:#1A1A1A;font-weight:800}
        .phone-svc-d{font-size:7.5px;color:#6B6356}
        .phone-btn{display:block;background:var(--gold);color:var(--dark);text-align:center;font-size:10px;font-weight:900;border-radius:9px;margin:10px;padding:9px 0;letter-spacing:0.05em}
        .link-h2{font-size:clamp(24px,3vw,34px);font-weight:900;margin-bottom:22px}
        .link-h2 span{color:var(--gold)}
        .link-url{display:flex;align-items:center;gap:10px;background:var(--dark-3);border:1px solid var(--dark-4);border-radius:11px;padding:13px 16px;margin-bottom:20px}
        .link-url code{flex:1;font-size:12.5px;color:var(--cream);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
        .link-url span{color:var(--gold);font-size:14px;flex-shrink:0}
        .link-row{display:flex;gap:22px;align-items:flex-start;flex-wrap:wrap}
        .link-qr{background:#fff;border-radius:12px;padding:8px;flex-shrink:0}
        .link-checks{display:flex;flex-direction:column;gap:10px}
        .link-check{display:flex;align-items:center;gap:9px;color:var(--cream);font-size:13.5px}
        .link-check b{color:var(--gold);font-weight:900}

        /* ── Franja de confianza ── */
        .trustband{max-width:1280px;margin:0 auto;padding:0 clamp(16px,4vw,48px) 90px;display:grid;grid-template-columns:2fr 1fr;gap:16px}
        .trustband-main{background:var(--dark-2);border:1px solid var(--dark-4);border-radius:16px;padding:28px 32px;display:flex;flex-direction:column;justify-content:center}
        .trustband-eyebrow{font-size:10.5px;letter-spacing:0.2em;color:var(--gold);font-weight:800;margin-bottom:14px}
        .trustband-items{display:flex;gap:clamp(16px,4vw,44px);flex-wrap:wrap}
        .trustband-item{font-family:var(--font-display),serif;font-size:clamp(15px,1.8vw,20px);font-weight:800;color:var(--cream-dim);transition:color 0.25s}
        .trustband-item:hover{color:var(--gold)}
        .trustband-side{background:var(--dark-2);border:1px solid var(--dark-4);border-radius:16px;padding:28px 32px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;gap:8px}
        .trustband-stars{color:var(--gold);font-size:19px;letter-spacing:3px}
        .trustband-side p{color:var(--cream-dim);font-size:12.5px}
        @media(max-width:820px){ .trustband{grid-template-columns:1fr} }

        /* ── Pricing ── */
        .pricing-cards{display:flex;justify-content:center}
        .price-card{background:var(--dark-2);border:1px solid var(--dark-4);border-radius:20px;padding:44px 40px;max-width:400px;width:100%;position:relative;text-align:center}
        .price-card.hot{border-color:rgba(201,168,76,0.5);box-shadow:0 0 60px rgba(201,168,76,0.08)}
        .hot-label{position:absolute;top:-13px;left:50%;transform:translateX(-50%);background:var(--gold);color:var(--dark);font-size:10.5px;font-weight:900;letter-spacing:0.1em;padding:6px 18px;border-radius:99px;white-space:nowrap}
        .price-title{font-size:12px;letter-spacing:0.18em;color:var(--cream-dim);font-weight:800;margin-bottom:12px}
        .price-amount{font-family:var(--font-display),serif;font-size:52px;font-weight:900;color:var(--gold)}
        .price-cop{color:var(--cream-dim);font-size:13px;margin-bottom:4px}
        .price-billing{color:var(--cream-dim);font-size:11.5px;opacity:0.7;margin-bottom:26px}
        .price-list{list-style:none;text-align:left;margin-bottom:30px;display:flex;flex-direction:column;gap:11px}
        .price-list li{color:var(--cream);font-size:13.5px;padding-left:26px;position:relative}
        .price-list li::before{content:'✓';position:absolute;left:0;color:var(--gold);font-weight:900}
        .btn-price{width:100%;padding:15px 0;border-radius:11px;font-size:13px;font-weight:800;letter-spacing:0.08em;cursor:pointer;border:none;font-family:var(--font-body),sans-serif;transition:all 0.25s}
        .btn-price-gold{background:var(--gold);color:var(--dark)}
        .btn-price-gold:hover{background:#E8C97A;transform:translateY(-2px)}

        /* ── CTA final ── */
        .cta-final{padding:120px 24px;text-align:center;position:relative;overflow:hidden}
        .cta-bg{position:absolute;inset:0;background:radial-gradient(ellipse at center,rgba(201,168,76,0.09) 0%,transparent 65%)}
        .cta-final h2{font-size:clamp(32px,5vw,54px);font-weight:900;margin:16px 0 14px;position:relative;z-index:1}
        .cta-final>div>p{color:var(--cream-dim);font-size:16px;margin-bottom:30px;position:relative;z-index:1}
        .cta-note{margin-top:22px;color:var(--cream-dim);font-size:13px;position:relative;z-index:1}
        .lnav{position:relative;z-index:1}

        /* ── Footer ── */
        .lfooter{border-top:1px solid var(--dark-4);padding:34px 24px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;max-width:1280px;margin:0 auto}
        .lfooter p{color:var(--cream-dim);font-size:12.5px}
        .footer-links{display:flex;gap:22px;align-items:center}
        .footer-links a{color:var(--cream-dim);font-size:12.5px;text-decoration:none}
        .footer-links a:hover{color:var(--gold)}
      `}</style>

      <div className="landing-body">
        <canvas id="particles"></canvas>

        {/* Navbar */}
        <nav id="navbar">
          <div className="logo" onClick={() => window.scrollTo({top:0,behavior:'smooth'})}>
            <span className="logo-icon">✂</span>
            Barber<span>soft</span>
          </div>
          <ul className="nav-links">
            <li><a href="#features">Funciones</a></li>
            <li><a href="#how">Cómo funciona</a></li>
            <li><a href="#pricing">Precios</a></li>
          </ul>
          <div style={{display:'flex', gap:10}}>
            <button className="btn-nav ghost" onClick={goToLogin}>ENTRAR</button>
            <button className="btn-nav" onClick={goToRegister}>EMPEZAR GRATIS →</button>
          </div>
        </nav>

        {/* ── HERO dos columnas ── */}
        <section className="hero">
          {/* Columna izquierda: texto */}
          <div>
            <div className="hero-badge"><span className="badge-dot"></span> SOFTWARE PARA BARBERÍAS EN COLOMBIA</div>
            <h1>Más citas.<br/><span className="hero-line2">Menos caos.</span></h1>
            <p className="hero-sub">Agenda, recuerda y gestiona tu barbería desde un solo lugar. Tus clientes reservan solos — tú solo cortas.</p>
            <div className="hero-cta">
              <button className="btn-hero btn-hero-gold" onClick={goToRegister}>PROBAR GRATIS 14 DÍAS →</button>
              <button className="btn-hero btn-hero-outline" onClick={() => navigate('/reservar')}>▷ VER DEMO</button>
            </div>
            <div className="hero-trust">
              <span className="trust-item"><b>✓</b> Sin tarjeta de crédito</span>
              <span className="trust-item"><b>✓</b> Configuración en minutos</span>
              <span className="trust-item"><b>✓</b> Cancela cuando quieras</span>
            </div>
          </div>

          {/* Columna derecha: mockup del dashboard */}
          <div className="mock-wrap">
            <div className="mock-window">
              <div className="mock-top">
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <div className="mock-dots">
                    <div className="mock-dot" style={{background:'#C9A84C'}}></div>
                    <div className="mock-dot" style={{background:'#8B6914'}}></div>
                    <div className="mock-dot" style={{background:'#4a3d1a'}}></div>
                  </div>
                  <span className="mock-brand">Barber<span>soft</span></span>
                </div>
                <span className="mock-shop">✂ Barbería El Paisa ▾</span>
              </div>
              <div className="mock-grid">
                {/* Sidebar del mockup */}
                <div className="mock-side">
                  <div className="mock-side-item on">⌂ Inicio</div>
                  <div className="mock-side-item">▤ Agenda</div>
                  <div className="mock-side-item">👤 Barberos</div>
                  <div className="mock-side-item">✂ Servicios</div>
                  <div className="mock-side-item">▦ Reportes</div>
                  <div className="mock-side-item">⚙ Configuración</div>
                </div>
                {/* Centro: KPIs + agenda */}
                <div className="mock-main">
                  <div className="mock-kpis">
                    <div className="mock-kpi"><div className="mock-kpi-l">CITAS HOY</div><div className="mock-kpi-v" id="mock-count">0</div></div>
                    <div className="mock-kpi"><div className="mock-kpi-l">INGRESOS MES</div><div className="mock-kpi-v" id="mock-revenue" style={{fontSize:12,paddingTop:2}}>$0</div></div>
                    <div className="mock-kpi"><div className="mock-kpi-l">BARBEROS</div><div className="mock-kpi-v" id="mock-barbers">0</div></div>
                  </div>
                  <div className="mock-agenda">
                    <div className="mock-ag-title">AGENDA DEL DÍA</div>
                    <div className="mock-row"><span className="mock-time">09:00</span><span className="mock-cli"><span className="mock-cli-n">Carlos Rodríguez</span><br/><span className="mock-cli-s">Corte clásico · Premium</span></span><span className="mock-badge b-done">COMPLETADA</span></div>
                    <div className="mock-row"><span className="mock-time">10:00</span><span className="mock-cli"><span className="mock-cli-n">Mateo Gómez</span><br/><span className="mock-cli-s">Corte + Barba · Deluxe</span></span><span className="mock-badge b-conf">CONFIRMADA</span></div>
                    <div className="mock-row"><span className="mock-time">11:00</span><span className="mock-cli"><span className="mock-cli-n">Andrés López</span><br/><span className="mock-cli-s">Corte · Clásico</span></span><span className="mock-badge b-conf">CONFIRMADA</span></div>
                    <div className="mock-row"><span className="mock-time">12:00</span><span className="mock-cli"><span className="mock-cli-n">Santiago Muñoz</span><br/><span className="mock-cli-s">Corte + Barba · Premium</span></span><span className="mock-badge b-pend">PENDIENTE</span></div>
                  </div>
                </div>
                {/* Derecha del mockup: próxima cita + ingresos */}
                <div className="mock-aside">
                  <div className="mock-card">
                    <div className="mock-card-l">PRÓXIMA CITA</div>
                    <div className="mock-card-t">Hoy, 15:00</div>
                    <div className="mock-card-s">Juan Camilo<br/>Corte clásico · Premium</div>
                  </div>
                  <div className="mock-card">
                    <div className="mock-card-s" style={{marginBottom:3}}>Ingresos este mes</div>
                    <div className="mock-rev">$1.240.000</div>
                    <div className="mock-up">+18% vs mes anterior</div>
                    <svg width="100%" height="34" viewBox="0 0 100 34" style={{marginTop:5}}>
                      <polyline
                        points="0,28 14,24 28,26 42,18 56,21 70,12 84,14 100,5"
                        fill="none" stroke="#C9A84C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                        style={{strokeDasharray:240, strokeDashoffset:240, animation:'drawLine 1.6s ease 0.9s forwards'}}
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Franja de 4 funciones ── */}
        <div className="feat-band fade-up" id="features">
          <div className="feat-band-in">
            <div className="feat-cell"><span className="feat-ic">🗓</span><div><h3>Agenda inteligente</h3><p>Organiza tus citas y evita horarios duplicados.</p></div></div>
            <div className="feat-cell"><span className="feat-ic">🔔</span><div><h3>Recordatorios automáticos</h3><p>Reduce inasistencias con confirmaciones y recordatorios por correo.</p></div></div>
            <div className="feat-cell"><span className="feat-ic">📊</span><div><h3>Reportes y estadísticas</h3><p>Conoce tu negocio y toma mejores decisiones.</p></div></div>
            <div className="feat-cell"><span className="feat-ic">🤝</span><div><h3>Clientes felices</h3><p>Reservan fácil, rápido y sin escribirte.</p></div></div>
          </div>
        </div>

        {/* ── Cómo funciona: 3 pasos ── */}
        <section id="how" style={{padding:'90px 24px'}}>
          <div className="section-header fade-up">
            <span className="section-eyebrow">CÓMO FUNCIONA</span>
            <h2 className="section-title">Tu barbería funcionando en 3 pasos</h2>
          </div>
          <div className="steps3">
            <div className="step3 fade-up"><div className="step3-circle">🏪<span className="step3-num">1</span></div><h3>Configura</h3><p>Agrega tus barberos, servicios, horarios y personaliza tu perfil.</p></div>
            <div className="step3 fade-up delay-1"><div className="step3-circle">🔗<span className="step3-num">2</span></div><h3>Comparte</h3><p>Obtén tu enlace y QR personalizado y compártelo.</p></div>
            <div className="step3 fade-up delay-2"><div className="step3-circle">📅<span className="step3-num">3</span></div><h3>Recibe citas</h3><p>Tus clientes reservan solos, tú recibes y administras.</p></div>
          </div>
        </section>

        {/* ── Tu enlace propio ── */}
        <section style={{padding:'40px 24px 90px'}}>
          <div className="linkcard fade-up">
            {/* Teléfono */}
            <div className="phone">
              <div className="phone-scr">
                <div className="phone-head">
                  <div className="phone-shop">Barbería El Paisa</div>
                  <div className="phone-sub">Reserva tu cita</div>
                </div>
                <div className="phone-svc"><span className="phone-svc-ic">✂</span><span><span className="phone-svc-n">Corte clásico</span><br/><span className="phone-svc-d">30 min · $25.000</span></span></div>
                <div className="phone-svc"><span className="phone-svc-ic">✂</span><span><span className="phone-svc-n">Corte + Barba</span><br/><span className="phone-svc-d">45 min · $35.000</span></span></div>
                <div className="phone-svc"><span className="phone-svc-ic">✂</span><span><span className="phone-svc-n">Barba</span><br/><span className="phone-svc-d">20 min · $15.000</span></span></div>
                <div className="phone-btn">Reservar ahora</div>
              </div>
            </div>
            {/* Texto + URL + QR */}
            <div>
              <h2 className="link-h2">Tu barbería<br/>tiene su propio <span>enlace</span></h2>
              <div className="link-url">
                <code>barbersoft.co/reservar/el-paisa</code>
                <span>⧉</span>
              </div>
              <div className="link-row">
                <div className="link-qr">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&margin=0&color=1A1A1A&bgcolor=FFFFFF&data=${encodeURIComponent(window.location.origin + '/reservar')}`}
                    alt="QR de reservas" width={110} height={110} style={{display:'block',borderRadius:6}}
                  />
                </div>
                <div className="link-checks">
                  <span className="link-check"><b>✓</b> Compártelo en Instagram</span>
                  <span className="link-check"><b>✓</b> Envíalo por WhatsApp</span>
                  <span className="link-check"><b>✓</b> Pónlo en tu local</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Franja de confianza ── */}
        <div className="trustband fade-up">
          <div className="trustband-main">
            <div className="trustband-eyebrow">HECHO PARA BARBERÍAS COLOMBIANAS</div>
            <div className="trustband-items">
              <span className="trustband-item">✂ Hecho en Medellín</span>
              <span className="trustband-item">🇨🇴 Precios en pesos</span>
              <span className="trustband-item">☁ 100% en la nube</span>
              <span className="trustband-item">💬 Soporte directo</span>
            </div>
          </div>
          <div className="trustband-side">
            <div className="trustband-stars">★★★★★</div>
            <p>Sé de las primeras barberías<br/>en crecer con Barbersoft</p>
          </div>
        </div>

        {/* ── Pricing ── */}
        <section id="pricing" style={{padding:'90px 24px',background:'var(--dark-2)',borderTop:'1px solid var(--dark-4)'}}>
          <div className="section-header fade-up">
            <span className="section-eyebrow">PRECIOS</span>
            <h2 className="section-title">Simple y transparente</h2>
          </div>
          <div className="pricing-cards fade-up delay-1">
            <div className="price-card hot">
              <div className="hot-label">★ PLAN BARBERSOFT</div>
              <p className="price-title">MENSUAL</p>
              <div className="price-amount">$50.000</div>
              <p className="price-cop">COP / mes</p>
              <p className="price-billing">Facturado mensualmente · cancela cuando quieras</p>
              <ul className="price-list">
                <li>Citas ilimitadas</li>
                <li>Barberos ilimitados</li>
                <li>Página de reservas pública</li>
                <li>Recordatorios automáticos por correo</li>
                <li>Panel con estadísticas del negocio</li>
                <li>Asistente con IA para tus clientes</li>
                <li>Soporte por WhatsApp</li>
              </ul>
              <button className="btn-price btn-price-gold" onClick={goToRegister}>EMPEZAR GRATIS</button>
            </div>
          </div>
          <p style={{textAlign:'center',color:'var(--cream-dim)',fontSize:12,marginTop:20,opacity:0.5}}>
            14 días gratis · Sin tarjeta · Cancelas cuando quieras
          </p>
        </section>

        {/* ── CTA final ── */}
        <section className="cta-final">
          <div className="cta-bg"></div>
          <div className="fade-up">
            <span className="section-eyebrow">EMPIEZA HOY</span>
            <h2>Tu barbería,<br/><span style={{color:'var(--gold)'}}>al siguiente nivel.</span></h2>
            <p>14 días gratis. Sin tarjeta. Sin complicaciones.</p>
            <div className="lnav">
              <button className="btn-hero btn-hero-gold" onClick={goToRegister}>CREAR CUENTA GRATIS →</button>
            </div>
            <p className="cta-note">✂ Hecho en Colombia, para barberías colombianas</p>
            <p style={{marginTop:12, position:'relative', zIndex:1}}>
              <span style={{color:'var(--cream-dim)', fontSize:13}}>¿Eres cliente de una barbería? </span>
              <span
                onClick={() => window.location.href='/reservar'}
                style={{color:'var(--gold)', fontSize:13, fontWeight:700, cursor:'pointer', textDecoration:'underline'}}
              >
                Reserva tu cita aquí →
              </span>
            </p>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="lfooter">
          <p>✂ Barbersoft 2026 · Software para barberías en Colombia</p>
          <div className="footer-links">
            <a href="#features">Funciones</a>
            <a href="#pricing">Precios</a>
            <span style={{cursor:'pointer',fontSize:12,color:'var(--cream-dim)',opacity:0.4}} onClick={goToLogin}>Entrar</span>
          </div>
        </footer>
      </div>
      <ChatbotWidget />
    </>
  )
}
