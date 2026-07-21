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

    // FAQ
    const faqBtns = document.querySelectorAll('.faq-q')
    faqBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const item = btn.parentElement
        const wasOpen = item.classList.contains('open')
        document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'))
        if (!wasOpen) item.classList.add('open')
      })
    })

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

    // Mockup
    setTimeout(() => {
      const mc = document.getElementById('mock-count')
      const mr = document.getElementById('mock-revenue')
      const mb = document.getElementById('mock-barbers')
      if (mc) animateCount(mc, 8, '', 1000)
      if (mb) animateCount(mb, 3, '', 1200)
      if (mr) mr.textContent = '$1.240.000'
    }, 800)

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

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
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
        @keyframes float    { 0%,100%{transform:translateY(0) rotate(-1deg)} 50%{transform:translateY(-12px) rotate(1deg)} }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes shimmer  { 0%{background-position:-200% center} 100%{background-position:200% center} }
        @keyframes scanline { 0%{top:-100%} 100%{top:200%} }
        @keyframes glow     { 0%,100%{box-shadow:0 0 20px var(--gold-glow)} 50%{box-shadow:0 0 60px var(--gold-glow),0 0 100px rgba(201,168,76,0.1)} }
        .fade-up { opacity:0; transform:translateY(30px); transition:opacity 0.7s ease,transform 0.7s ease; }
        .fade-up.visible { opacity:1; transform:translateY(0); }
        .fade-up.delay-1{transition-delay:0.1s} .fade-up.delay-2{transition-delay:0.2s}
        .fade-up.delay-3{transition-delay:0.3s} .fade-up.delay-4{transition-delay:0.4s}
        #particles{position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:0.4}
        #navbar{position:fixed;top:0;left:0;right:0;z-index:1000;padding:0 48px;height:68px;display:flex;align-items:center;justify-content:space-between;transition:all 0.3s}
        #navbar.scrolled{background:rgba(10,10,10,0.92);backdrop-filter:blur(20px);border-bottom:1px solid rgba(201,168,76,0.1)}
        .logo{font-family:var(--font-display),serif;font-size:22px;font-weight:900;color:var(--cream);text-decoration:none;display:flex;align-items:center;gap:10px;cursor:pointer}
        .logo-icon{width:36px;height:36px;border-radius:9px;background:var(--gold);display:flex;align-items:center;justify-content:center;font-size:18px;color:var(--dark);flex-shrink:0}
        .logo span{color:var(--gold)}
        .nav-links{display:flex;align-items:center;gap:36px;list-style:none}
        .nav-links a{color:var(--cream-dim);text-decoration:none;font-size:13px;font-weight:500;letter-spacing:0.04em;transition:color 0.2s}
        .nav-links a:hover{color:var(--cream)}
        .btn-nav{background:var(--gold);color:var(--dark);border:none;padding:10px 24px;border-radius:8px;font-size:12px;font-weight:700;letter-spacing:0.08em;cursor:pointer;font-family:var(--font-body),sans-serif;transition:all 0.25s;position:relative;overflow:hidden}
        .btn-nav:hover{background:#E8C97A;transform:translateY(-1px)}
        .hero{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:120px 24px 80px;position:relative;overflow:hidden;text-align:center}
        .hero-orb{position:absolute;border-radius:50%;pointer-events:none;filter:blur(80px)}
        .hero-orb-1{width:600px;height:600px;top:-200px;left:50%;transform:translateX(-50%);background:radial-gradient(circle,rgba(201,168,76,0.12) 0%,transparent 70%);animation:glow 4s ease-in-out infinite}
        .hero-orb-2{width:300px;height:300px;bottom:0;right:-100px;background:radial-gradient(circle,rgba(201,168,76,0.06) 0%,transparent 70%)}
        .hero-content{position:relative;z-index:1;max-width:820px}
        .hero-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.2);border-radius:24px;padding:7px 18px;font-size:12px;font-weight:600;color:var(--gold);letter-spacing:0.08em;margin-bottom:32px;animation:fadeUp 0.6s ease forwards}
        .badge-dot{width:6px;height:6px;border-radius:50%;background:var(--gold);animation:pulse 1.5s ease-in-out infinite}
        .hero h1{font-size:clamp(48px,8vw,96px);font-weight:900;line-height:1.0;letter-spacing:-0.03em;color:var(--cream);margin-bottom:8px;animation:fadeUp 0.6s ease 0.1s both}
        .hero-line2{display:block;background:linear-gradient(135deg,#C9A84C 0%,#F5D47A 40%,#C9A84C 60%,#E8C97A 100%);background-size:200% auto;-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;animation:shimmer 4s linear infinite,fadeUp 0.6s ease 0.15s both}
        .hero-sub{font-size:clamp(16px,2vw,20px);color:var(--cream-dim);line-height:1.65;margin:24px auto 44px;max-width:520px;animation:fadeUp 0.6s ease 0.25s both;font-weight:300}
        .hero-cta{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;animation:fadeUp 0.6s ease 0.35s both;margin-bottom:64px}
        .btn-hero{padding:16px 40px;border-radius:10px;font-size:14px;font-weight:700;letter-spacing:0.07em;cursor:pointer;font-family:var(--font-body),sans-serif;text-decoration:none;transition:all 0.25s;display:inline-flex;align-items:center;gap:8px;position:relative;overflow:hidden;border:none}
        .btn-hero-gold{background:var(--gold);color:var(--dark);animation:glow 3s ease-in-out infinite}
        .btn-hero-gold:hover{background:#E8C97A;transform:translateY(-2px);box-shadow:0 12px 40px rgba(201,168,76,0.35)}
        .btn-hero-outline{background:transparent;color:var(--cream);border:1px solid rgba(255,255,255,0.15) !important}
        .btn-hero-outline:hover{border-color:var(--gold) !important;color:var(--gold);transform:translateY(-2px)}
        .mockup-wrapper{animation:float 6s ease-in-out infinite;display:inline-block;position:relative}
        .mockup-glow{position:absolute;inset:-30px;background:radial-gradient(ellipse,rgba(201,168,76,0.15) 0%,transparent 70%);border-radius:24px;pointer-events:none;animation:glow 4s ease-in-out infinite}
        .mockup-screen{width:min(680px,90vw);background:#111;border-radius:16px;border:1px solid rgba(201,168,76,0.2);overflow:hidden;box-shadow:0 40px 100px rgba(0,0,0,0.8),0 0 0 1px rgba(255,255,255,0.05),inset 0 1px 0 rgba(255,255,255,0.07);position:relative}
        .mockup-bar{background:#161616;padding:12px 16px;display:flex;align-items:center;gap:10px;border-bottom:1px solid #222}
        .mockup-dots{display:flex;gap:6px}
        .dot{width:10px;height:10px;border-radius:50%}
        .dot-r{background:#8B6914} .dot-y{background:#C9A84C} .dot-g{background:#E8C97A}
        .mockup-url{flex:1;background:#1F1F1F;border-radius:5px;padding:4px 12px;font-size:11px;color:#666;font-family:monospace}
        .mockup-body{padding:20px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
        .mock-stat{background:#161616;border:1px solid #222;border-radius:10px;padding:14px}
        .mock-stat-label{font-size:9px;color:#666;letter-spacing:0.1em;font-weight:600;margin-bottom:6px}
        .mock-stat-value{font-family:var(--font-display),serif;font-size:24px;font-weight:900;color:var(--gold)}
        .mockup-appointments{grid-column:1/-1;background:#161616;border:1px solid #222;border-radius:10px;overflow:hidden}
        .mock-appt-header{padding:12px 14px;border-bottom:1px solid #222;font-size:11px;font-weight:600;color:#555;letter-spacing:0.08em}
        .mock-appt{display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #1A1A1A}
        .mock-appt:last-child{border-bottom:none}
        .mock-time{font-size:12px;font-weight:700;color:var(--gold);width:48px;flex-shrink:0}
        .mock-info{flex:1;padding:0 12px}
        .mock-name{font-size:12px;font-weight:600;color:#E0DDD8}
        .mock-service{font-size:10px;color:#555;margin-top:2px}
        .mock-badge{font-size:9px;font-weight:700;padding:3px 8px;border-radius:12px;letter-spacing:0.05em}
        .mock-pending{background:rgba(201,168,76,0.12);color:#C9A84C}
        .mock-done{background:rgba(184,176,160,0.12);color:#B8B0A0}
        .mock-confirm{background:rgba(245,240,232,0.10);color:#F5F0E8}
        .mockup-scanline{position:absolute;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,rgba(201,168,76,0.3),transparent);animation:scanline 4s linear infinite;pointer-events:none}
        .stats-bar{background:var(--dark-2);border-top:1px solid rgba(201,168,76,0.1);border-bottom:1px solid rgba(201,168,76,0.1);padding:40px 24px}
        .stats-inner{max-width:900px;margin:0 auto;display:flex;justify-content:space-around;flex-wrap:wrap;gap:32px}
        .stat-number{font-family:var(--font-display),serif;font-size:48px;font-weight:900;color:var(--gold);line-height:1;display:block}
        .stat-label{font-size:11px;color:var(--cream-dim);letter-spacing:0.1em;font-weight:600;margin-top:6px;display:block}
        .section-header{text-align:center;margin-bottom:64px}
        .section-eyebrow{display:inline-block;color:var(--gold);font-size:11px;font-weight:700;letter-spacing:0.14em;margin-bottom:12px}
        .section-title{font-size:clamp(32px,4vw,52px);font-weight:900;color:var(--cream);line-height:1.1;letter-spacing:-0.02em}
        .features-grid{max-width:1080px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--dark-4);border:1px solid var(--dark-4);border-radius:16px;overflow:hidden}
        .feat{background:var(--dark-2);padding:36px 28px;transition:background 0.3s;cursor:default;position:relative;overflow:hidden}
        .feat:hover{background:#161616}
        .feat-icon{font-size:32px;margin-bottom:16px;display:block}
        .feat h3{font-family:var(--font-body),sans-serif;font-size:16px;font-weight:700;color:var(--cream);margin-bottom:8px}
        .feat p{font-size:13px;color:var(--cream-dim);line-height:1.65}
        .contrast-grid{max-width:900px;margin:48px auto 0;display:grid;grid-template-columns:1fr 1fr;gap:20px}
        .contrast-col{border-radius:14px;padding:28px}
        .contrast-col.bad{background:rgba(232,201,122,0.05);border:1px solid rgba(232,201,122,0.15)}
        .contrast-col.good{background:rgba(201,168,76,0.05);border:1px solid rgba(201,168,76,0.15)}
        .contrast-label{font-size:11px;font-weight:700;letter-spacing:0.1em;margin-bottom:20px;display:flex;align-items:center;gap:8px}
        .contrast-col.bad .contrast-label{color:#E8C97A}
        .contrast-col.good .contrast-label{color:var(--gold)}
        .contrast-item{display:flex;align-items:flex-start;gap:12px;margin-bottom:14px;font-size:14px}
        .contrast-col.bad .contrast-item{color:#B8B0A0}
        .contrast-col.good .contrast-item{color:var(--cream)}
        .steps-row{max-width:900px;margin:64px auto 0;display:grid;grid-template-columns:repeat(4,1fr);gap:0;position:relative}
        .steps-row::before{content:'';position:absolute;top:22px;left:calc(12.5%);width:75%;height:1px;background:linear-gradient(90deg,transparent,var(--gold-dim),transparent);opacity:0.3}
        .step{text-align:center;padding:0 16px}
        .step-num{width:44px;height:44px;border-radius:50%;background:var(--dark-3);border:1px solid rgba(201,168,76,0.3);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-family:var(--font-display),serif;font-size:18px;font-weight:900;color:var(--gold);position:relative;z-index:1;transition:all 0.3s}
        .step:hover .step-num{background:rgba(201,168,76,0.1);border-color:var(--gold);box-shadow:0 0 20px var(--gold-glow)}
        .step h3{font-family:var(--font-body),sans-serif;font-size:14px;font-weight:700;color:var(--cream);margin-bottom:8px}
        .step p{font-size:12px;color:var(--cream-dim);line-height:1.6}
        .pricing-cards{max-width:400px;margin:64px auto 0;display:grid;grid-template-columns:1fr;gap:20px}
        .price-card{background:var(--dark-3);border:1px solid var(--dark-4);border-radius:16px;padding:32px 28px;position:relative;overflow:hidden;transition:transform 0.3s,box-shadow 0.3s}
        .price-card:hover{transform:translateY(-4px);box-shadow:0 20px 60px rgba(0,0,0,0.4)}
        .price-card.hot{border-color:rgba(201,168,76,0.35);background:linear-gradient(160deg,#161616 0%,#111 100%)}
        .price-card.hot::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:linear-gradient(90deg,transparent,var(--gold),transparent)}
        .price-card.hot:hover{box-shadow:0 20px 60px rgba(0,0,0,0.4),0 0 40px rgba(201,168,76,0.1)}
        .hot-label{display:inline-block;background:rgba(201,168,76,0.1);border:1px solid rgba(201,168,76,0.2);color:var(--gold);font-size:10px;font-weight:700;padding:3px 12px;border-radius:20px;letter-spacing:0.08em;margin-bottom:16px}
        .price-title{font-size:11px;color:var(--cream-dim);letter-spacing:0.1em;font-weight:600;margin-bottom:12px}
        .price-amount{font-family:var(--font-display),serif;font-size:44px;font-weight:900;color:var(--cream);line-height:1}
        .price-card.hot .price-amount{color:var(--gold)}
        .price-cop{font-size:12px;color:var(--cream-dim);margin:4px 0 2px}
        .price-billing{font-size:11px;color:var(--cream-dim);opacity:0.5;margin-bottom:24px}
        .price-list{list-style:none;margin-bottom:28px}
        .price-list li{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--cream);padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.04)}
        .price-list li:last-child{border:none}
        .price-list li::before{content:'✓';color:var(--success);font-weight:700;font-size:13px;flex-shrink:0}
        .btn-price{display:block;width:100%;padding:13px 0;border-radius:8px;font-size:12px;font-weight:700;letter-spacing:0.08em;cursor:pointer;font-family:var(--font-body),sans-serif;text-decoration:none;text-align:center;transition:all 0.25s}
        .btn-price-outline{background:transparent;color:var(--cream);border:1px solid var(--dark-4)}
        .btn-price-outline:hover{border-color:var(--gold);color:var(--gold)}
        .btn-price-gold{background:var(--gold);color:var(--dark);border:none}
        .btn-price-gold:hover{background:#E8C97A}
        .faq-list{max-width:680px;margin:56px auto 0}
        .faq-item{border-bottom:1px solid var(--dark-4);overflow:hidden}
        .faq-q{width:100%;background:none;border:none;padding:20px 0;display:flex;align-items:center;justify-content:space-between;cursor:pointer;font-family:var(--font-body),sans-serif;font-size:15px;font-weight:600;color:var(--cream);text-align:left;gap:16px;transition:color 0.2s}
        .faq-q:hover{color:var(--gold)}
        .faq-icon{font-size:18px;color:var(--gold);transition:transform 0.3s;flex-shrink:0}
        .faq-item.open .faq-icon{transform:rotate(45deg)}
        .faq-a{max-height:0;overflow:hidden;transition:max-height 0.4s ease,padding 0.3s}
        .faq-item.open .faq-a{max-height:200px;padding-bottom:20px}
        .faq-a p{font-size:14px;color:var(--cream-dim);line-height:1.7}
        .cta-final{padding:120px 24px;text-align:center;position:relative;overflow:hidden}
        .cta-bg{position:absolute;inset:0;background:radial-gradient(ellipse 100% 80% at 50% 0%,rgba(201,168,76,0.07) 0%,transparent 60%);pointer-events:none}
        .cta-grid-bg{position:absolute;inset:0;background-image:linear-gradient(rgba(201,168,76,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(201,168,76,0.03) 1px,transparent 1px);background-size:48px 48px;pointer-events:none}
        .cta-final h2{font-size:clamp(36px,6vw,72px);font-weight:900;line-height:1.05;letter-spacing:-0.03em;margin-bottom:20px;position:relative;z-index:1}
        .cta-final p{font-size:16px;color:var(--cream-dim);margin-bottom:40px;line-height:1.7;position:relative;z-index:1}
        .lnav{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;position:relative;z-index:1}
        .cta-note{margin-top:20px;font-size:12px;color:var(--cream-dim);opacity:0.5;position:relative;z-index:1}
        .lfooter{background:var(--dark-2);border-top:1px solid var(--dark-4);padding:32px 48px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px}
        .lfooter p{font-size:12px;color:var(--cream-dim);opacity:0.4}
        .footer-links{display:flex;gap:24px}
        .footer-links a{font-size:12px;color:var(--cream-dim);opacity:0.4;text-decoration:none;transition:opacity 0.2s}
        .footer-links a:hover{opacity:0.8}
        @media(max-width:768px){
          #navbar{padding:0 20px}
          .nav-links{display:none}
          .features-grid{grid-template-columns:1fr}
          .contrast-grid{grid-template-columns:1fr}
          .steps-row{grid-template-columns:1fr 1fr}
          .steps-row::before{display:none}
          .pricing-cards{grid-template-columns:1fr}
          .lfooter{flex-direction:column;text-align:center}
        }
      `}</style>

      <div className="landing-body">
        <canvas id="particles"></canvas>

        {/* Navbar */}
        <nav id="navbar">
          <div className="logo" onClick={() => window.scrollTo({top:0,behavior:'smooth'})}>
        <div className="logo-icon">✂</div>
        Barber<span>soft</span>
          </div>
          <ul className="nav-links">
            <li><a href="#features">Funciones</a></li>
            <li><a href="#how">Cómo funciona</a></li>
            <li><a href="#pricing">Precios</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>
          <div style={{display:'flex', gap:10}}>
  <button className="btn-nav" style={{background:'transparent', color:'var(--cream)', border:'1px solid rgba(255,255,255,0.15)'}} onClick={goToLogin}>ENTRAR</button>
  <button className="btn-nav" onClick={goToRegister}>EMPEZAR GRATIS →</button>
</div>
        </nav>

        {/* Hero */}
        <section className="hero">
          <div className="hero-orb hero-orb-1"></div>
          <div className="hero-orb hero-orb-2"></div>
          <div className="hero-orb hero-orb-3"></div>
          <div className="hero-content">
            <div className="hero-badge">
              <div className="badge-dot"></div>
              SOFTWARE PARA BARBERÍAS EN COLOMBIA
            </div>
            <h1>Más citas.<br/><span className="hero-line2">Menos caos.</span></h1>
            <p className="hero-sub">Agenda, recuerda y gestiona tu barbería desde un solo lugar. Tus clientes reservan solos — tú solo cortas.</p>
            <div className="hero-cta">
              <button className="btn-hero btn-hero-gold" onClick={goToRegister}>
                PROBAR GRATIS 14 DÍAS <span style={{fontSize:16}}>→</span>
              </button>
              <a className="btn-hero btn-hero-outline" href="#how">Ver cómo funciona</a>
            </div>
            <div style={{animation:'fadeUp 0.8s ease 0.45s both'}}>
              <div className="mockup-wrapper">
                <div className="mockup-glow"></div>
                <div className="mockup-screen">
                  <div className="mockup-scanline"></div>
                  <div className="mockup-bar">
                    <div className="mockup-dots">
                      <div className="dot dot-r"></div>
                      <div className="dot dot-y"></div>
                      <div className="dot dot-g"></div>
                    </div>
                    <div className="mockup-url">Barbersoft.co/dashboard</div>
                  </div>
                  <div className="mockup-body">
                    <div className="mock-stat"><div className="mock-stat-label">CITAS HOY</div><div className="mock-stat-value" id="mock-count">0</div></div>
                    <div className="mock-stat"><div className="mock-stat-label">INGRESOS MES</div><div className="mock-stat-value" style={{fontSize:16,paddingTop:4}} id="mock-revenue">$0</div></div>
                    <div className="mock-stat"><div className="mock-stat-label">BARBEROS</div><div className="mock-stat-value" id="mock-barbers">0</div></div>
                    <div className="mockup-appointments">
                      <div className="mock-appt-header">AGENDA DEL DÍA</div>
                      <div className="mock-appt"><div className="mock-time">09:00</div><div className="mock-info"><div className="mock-name">Carlos Rodríguez</div><div className="mock-service">Corte clásico · Carlos</div></div><div className="mock-badge mock-done">COMPLETADA</div></div>
                      <div className="mock-appt"><div className="mock-time">10:30</div><div className="mock-info"><div className="mock-name">Juan Martínez</div><div className="mock-service">Corte + barba · Luis</div></div><div className="mock-badge mock-confirm">CONFIRMADA</div></div>
                      <div className="mock-appt"><div className="mock-time">11:00</div><div className="mock-info"><div className="mock-name">Andrés García</div><div className="mock-service">Corte clásico · Carlos</div></div><div className="mock-badge mock-pending">PENDIENTE</div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <div className="stats-bar">
          <div className="stats-inner">
            <div className="stat-item fade-up"><span className="stat-number" data-count="14">0</span><span className="stat-label">DÍAS GRATIS</span></div>
            <div className="stat-item fade-up delay-1"><span className="stat-number">∞</span><span className="stat-label">TARJETA REQUERIDA</span></div>
            <div className="stat-item fade-up delay-2"><span className="stat-number" data-count="10" data-suffix="min">0</span><span className="stat-label">PARA CONFIGURAR</span></div>
            <div className="stat-item fade-up delay-3"><span className="stat-number" data-count="100" data-suffix="%">0</span><span className="stat-label">EN LA NUBE</span></div>
          </div>
        </div>

        {/* Contraste */}
        <section style={{padding:'100px 24px',background:'var(--dark-2)',borderTop:'1px solid var(--dark-4)',borderBottom:'1px solid var(--dark-4)'}}>
          <div style={{maxWidth:900,margin:'0 auto'}}>
            <div className="section-header fade-up">
              <span className="section-eyebrow">EL PROBLEMA</span>
              <h2 className="section-title">¿Sigues manejando todo por WhatsApp?</h2>
            </div>
            <div className="contrast-grid">
              <div className="contrast-col bad fade-up">
                <div className="contrast-label"><span>✕</span> SIN Barbersoft</div>
                <div className="contrast-item"><span style={{fontSize:16}}>😤</span><span>Agenda por WhatsApp — mensajes perdidos</span></div>
                <div className="contrast-item"><span style={{fontSize:16}}>📋</span><span>Cuaderno o Excel sin acceso móvil</span></div>
                <div className="contrast-item"><span style={{fontSize:16}}>😞</span><span>Clientes que no llegan porque se olvidaron</span></div>
                <div className="contrast-item"><span style={{fontSize:16}}>🤷</span><span>Sin reportes ni datos del negocio</span></div>
              </div>
              <div className="contrast-col good fade-up delay-2">
                <div className="contrast-label"><span>✓</span> CON Barbersoft</div>
                <div className="contrast-item"><span style={{fontSize:16}}>📅</span><span>Reservas 24/7 — los clientes reservan solos</span></div>
                <div className="contrast-item"><span style={{fontSize:16}}>📱</span><span>Agenda digital desde cualquier dispositivo</span></div>
                <div className="contrast-item"><span style={{fontSize:16}}>💬</span><span>Recordatorio automático por WhatsApp 24h antes</span></div>
                <div className="contrast-item"><span style={{fontSize:16}}>📊</span><span>Reportes claros de ingresos y rendimiento</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" style={{padding:'100px 24px'}}>
          <div className="section-header fade-up">
            <span className="section-eyebrow">FUNCIONES</span>
            <h2 className="section-title">Todo lo que necesitas</h2>
          </div>
          <div className="features-grid fade-up delay-1">
            <div className="feat"><span className="feat-icon">📅</span><h3>Agenda inteligente</h3><p>Gestiona citas con un clic. Sin conflictos de horario.</p></div>
            <div className="feat"><span className="feat-icon">🔗</span><h3>Reservas públicas</h3><p>Link propio. Los clientes reservan solos, 24/7.</p></div>
            <div className="feat"><span className="feat-icon">💬</span><h3>WhatsApp automático</h3><p>Recordatorio 24h antes. Menos ausencias.</p></div>
            <div className="feat"><span className="feat-icon">✂</span><h3>Gestión de equipo</h3><p>Barberos, servicios y agendas separadas.</p></div>
            <div className="feat"><span className="feat-icon">📈</span><h3>Reportes del negocio</h3><p>Ingresos y rendimiento. Todo claro.</p></div>
            <div className="feat"><span className="feat-icon">⏰</span><h3>Horarios de atención</h3><p>Solo se reserva cuando estás abierto.</p></div>
          </div>
        </section>

        {/* Cómo funciona */}
        <section id="how" style={{padding:'100px 24px',background:'var(--dark-2)',borderTop:'1px solid var(--dark-4)'}}>
          <div className="section-header fade-up">
            <span className="section-eyebrow">CÓMO FUNCIONA</span>
            <h2 className="section-title">Listo en 10 minutos</h2>
          </div>
          <div className="steps-row">
            <div className="step fade-up"><div className="step-num">1</div><h3>Creas tu cuenta</h3><p>Nombre, dirección y listo. Sin tarjeta.</p></div>
            <div className="step fade-up delay-1"><div className="step-num">2</div><h3>Configuras el local</h3><p>Barberos, servicios y horarios.</p></div>
            <div className="step fade-up delay-2"><div className="step-num">3</div><h3>Compartes el link</h3><p>Los clientes reservan solos.</p></div>
            <div className="step fade-up delay-3"><div className="step-num">4</div><h3>Solo cortas</h3><p>El sistema hace el resto.</p></div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" style={{padding:'100px 24px',background:'var(--dark)',borderTop:'1px solid var(--dark-4)'}}>
          <div className="section-header fade-up">
            <span className="section-eyebrow">PRECIOS</span>
            <h2 className="section-title">Simple y transparente</h2>
          </div>
          <div className="pricing-cards">
            <div className="price-card hot fade-up">
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

        {/* FAQ */}
        <section id="faq" style={{padding:'100px 24px',background:'var(--dark-2)',borderTop:'1px solid var(--dark-4)'}}>
          <div className="section-header fade-up">
            <span className="section-eyebrow">PREGUNTAS FRECUENTES</span>
            <h2 className="section-title">Dudas comunes</h2>
          </div>
          <div className="faq-list">
            {[
              ['¿Necesito saber de tecnología para usarlo?', 'No. Si puedes usar WhatsApp, puedes usar Barbersoft. La configuración inicial toma menos de 10 minutos.'],
              ['¿Qué pasa cuando termina el período de prueba?', 'Puedes elegir un plan y seguir usando todo normalmente. Tus datos se mantienen siempre.'],
              ['¿Los clientes tienen que descargarse algo?', 'No. Reservan desde cualquier navegador en su celular. Solo abres el link.'],
              ['¿Funciona para barberías con varios barberos?', 'Sí. Puedes agregar todos los barberos que quieras, cada uno con su propia agenda.'],
            ].map(([q, a], i) => (
              <div className="faq-item fade-up" key={i}>
                <button className="faq-q">{q}<span className="faq-icon">+</span></button>
                <div className="faq-a"><p>{a}</p></div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Final */}
        <section className="cta-final">
          <div className="cta-bg"></div>
          <div className="cta-grid-bg"></div>
          <div className="fade-up">
            <span className="section-eyebrow">EMPIEZA HOY</span>
            <h2>Tu barbería,<br/><span style={{color:'var(--gold)'}}>al siguiente nivel.</span></h2>
            <p>14 días gratis. Sin tarjeta. Sin complicaciones.</p>
            <div className="lnav">
              <button className="btn-hero btn-hero-gold" onClick={goToRegister}>
                CREAR CUENTA GRATIS →
              </button>
            </div>
            <p className="cta-note">✂ Barberías en Medellín, Bogotá y Cali ya lo están usando</p>
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

        {/* Footer */}
        <footer className="lfooter">
  <p>✂ Barbersoft 2026 · Software para barberías en Colombia</p>
          <div className="footer-links">
            <a href="#features">Funciones</a>
            <a href="#pricing">Precios</a>
            <a href="#faq">FAQ</a>
            <span style={{cursor:'pointer',fontSize:12,color:'var(--cream-dim)',opacity:0.4}} onClick={goToLogin}>Entrar</span>
          </div>
        </footer>
      </div>
      <ChatbotWidget />
    </>
  )
}