import { useRef, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

/* ─── Media ─── */
const MEDIA = {
  // Cinematic aerial Africa / landscape videos from Pexels
  heroVideo:  'https://videos.pexels.com/video-files/2169880/2169880-uhd_2560_1440_25fps.mp4',
  heroVideo2: 'https://videos.pexels.com/video-files/1851190/1851190-hd_1920_1080_25fps.mp4',
  heroVideo3: 'https://videos.pexels.com/video-files/4125305/4125305-uhd_2560_1440_25fps.mp4',
  poster:     'https://images.pexels.com/photos/2098427/pexels-photo-2098427.jpeg?auto=compress&cs=tinysrgb&w=1400',
  market:     'https://images.pexels.com/photos/3943716/pexels-photo-3943716.jpeg?auto=compress&cs=tinysrgb&w=1200',
  trade:      'https://images.pexels.com/photos/3943897/pexels-photo-3943897.jpeg?auto=compress&cs=tinysrgb&w=1200',
  data:       'https://images.pexels.com/photos/7681091/pexels-photo-7681091.jpeg?auto=compress&cs=tinysrgb&w=1200',
  city:       'https://images.pexels.com/photos/6169659/pexels-photo-6169659.jpeg?auto=compress&cs=tinysrgb&w=1200',
  aerial:     'https://images.pexels.com/photos/3222686/pexels-photo-3222686.jpeg?auto=compress&cs=tinysrgb&w=1600',
}

const STATS = [
  { value: 54,  suffix: '',  prefix: '',  label: 'Nations Monitored', sub: 'Full continental coverage' },
  { value: 3.1, suffix: 'T', prefix: '$', label: 'GDP Tracked',        sub: 'Live macroeconomic data'  },
  { value: 847, suffix: '',  prefix: '',  label: 'Daily Risk Signals', sub: 'WB-powered detection'     },
  { value: 94,  suffix: '%', prefix: '',  label: 'Forecast Accuracy',  sub: 'Validated on holdout data'},
]

const CAPABILITIES = [
  {
    id: '01', tag: 'Early Warning',
    title: 'Supply Chain Risk Intelligence',
    body:  'Our models monitor 200+ trade corridors continuously, surfacing fragility weeks before collapse. When ports slow, commodity prices deviate, or political risk sharpens — Sentinel flags it first.',
    img:   MEDIA.trade, accent: '#00E5A0', stat: '72h ahead of the news',
  },
  {
    id: '02', tag: 'Economic Portrait',
    title: 'Resilience Index',
    body:  'A composite score built from economic, institutional, and social data. Not a ranking — a living portrait of each economy\'s capacity to absorb shocks and adapt. Updated weekly.',
    img:   MEDIA.data, accent: '#FFB347', stat: '54 economies scored',
  },
  {
    id: '03', tag: 'Strategic Foresight',
    title: 'Diversification Engine',
    body:  'Maps each country\'s latent strengths to global demand curves. Shows policymakers the path beyond commodity dependency and the industries waiting to be built.',
    img:   MEDIA.city, accent: '#A78BFA', stat: '5 opportunities ranked',
  },
]

const TICKER = [
  { label: 'Rwanda GDP Growth',    value: '+9.4%',    color: '#00E5A0' },
  { label: 'Nigeria Risk Level',   value: 'ELEVATED', color: '#FF6B6B' },
  { label: 'Kenya Resilience',     value: '61 / 100', color: '#FFB347' },
  { label: 'Ghana Commodity Exp.', value: '63%',      color: '#FFB347' },
  { label: 'Morocco Trade Open.',  value: '72%',      color: '#00E5A0' },
  { label: 'Ethiopia Inflation',   value: '22.0%',    color: '#FF6B6B' },
  { label: 'Senegal FDI',         value: '3.4% GDP', color: '#00E5A0' },
  { label: 'South Africa',        value: 'STABLE',   color: '#00E5A0' },
  { label: 'Tanzania Growth',     value: '+6.1%',    color: '#00E5A0' },
  { label: "Côte d'Ivoire",       value: 'WATCH',    color: '#FFB347' },
]

/* ─── looks ─── */
function useInView(threshold = 0.1) {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); obs.disconnect() }
    }, { threshold })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, inView]
}

function useCountUp(target, duration = 1800) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  const fired = useRef(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !fired.current) {
        fired.current = true
        let start = null
        const tick = ts => {
          if (!start) start = ts
          const p = Math.min((ts - start) / duration, 1)
          const eased = 1 - Math.pow(1 - p, 3)
          setVal(parseFloat((eased * target).toFixed(1)))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
        obs.disconnect()
      }
    }, { threshold: 0.4 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [target, duration])
  return [val, ref]
}

/* ─── Reveal wrapper ─── */
function Reveal({ children, delay = 0, from = 'bottom', className = '', style = {} }) {
  const [ref, inView] = useInView()
  const map = { bottom: 'translateY(44px)', left: 'translateX(-44px)', right: 'translateX(44px)' }
  return (
    <div ref={ref} className={className} style={{
      opacity: inView ? 1 : 0,
      transform: inView ? 'none' : (map[from] ?? map.bottom),
      transition: `opacity 1s cubic-bezier(.16,1,.3,1) ${delay}s, transform 1s cubic-bezier(.16,1,.3,1) ${delay}s`,
      ...style,
    }}>
      {children}
    </div>
  )
}

/* ─── Stat block ─── */
function StatBlock({ value, suffix, prefix, label, sub }) {
  const [v, ref] = useCountUp(value)
  const display = Number.isInteger(value) ? Math.round(v) : v.toFixed(1)
  return (
    <div ref={ref} style={{ padding: '2.8rem 1rem', textAlign: 'center' }}>
      <div style={{
        fontFamily: '"Playfair Display",serif',
        fontSize: 'clamp(2.6rem,4vw,3.8rem)', fontWeight: 700, lineHeight: 1, marginBottom: 12,
        background: 'linear-gradient(135deg,#FFD700 0%,#FF8C00 100%)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
      }}>
        {prefix}{display}{suffix}
      </div>
      <div style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 9, color: 'rgba(255,235,180,.55)', letterSpacing: '.2em', textTransform: 'uppercase', marginBottom: 5 }}>{label}</div>
      <div style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 9, color: 'rgba(255,235,180,.2)', letterSpacing: '.1em' }}>{sub}</div>
    </div>
  )
}

/* ─── Capability card ─── */
function CapCard({ item, index }) {
  const [hov, setHov] = useState(false)
  const [ref, inView] = useInView()
  return (
    <div
      ref={ref}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? (hov ? 'translateY(-10px)' : 'none') : 'translateY(52px)',
        transition: `opacity .85s cubic-bezier(.16,1,.3,1) ${index * .18}s, transform .5s cubic-bezier(.16,1,.3,1), box-shadow .4s, border-color .4s, background .4s`,
        background: hov ? 'linear-gradient(160deg,rgba(255,255,255,.06),rgba(255,255,255,.02))' : 'linear-gradient(160deg,rgba(255,255,255,.03),rgba(255,255,255,.01))',
        border: `1px solid ${hov ? item.accent + '55' : 'rgba(255,200,80,.1)'}`,
        borderRadius: 22, overflow: 'hidden',
        boxShadow: hov ? `0 36px 90px rgba(0,0,0,.65),0 0 48px ${item.accent}22` : '0 4px 24px rgba(0,0,0,.3)',
      }}
    >
      {/* Image */}
      <div style={{ height: 220, overflow: 'hidden', position: 'relative' }}>
        <img src={item.img} alt={item.title} loading="lazy" style={{
          width: '100%', height: '100%', objectFit: 'cover', display: 'block',
          filter: `brightness(${hov ? .6 : .28}) saturate(${hov ? .75 : .4})`,
          transform: hov ? 'scale(1.09)' : 'scale(1)',
          transition: 'all .75s cubic-bezier(.16,1,.3,1)',
        }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,#07091A 0%,transparent 58%)' }} />
        {hov && <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 110%,${item.accent}22,transparent 60%)` }} />}
        <div style={{ position: 'absolute', top: 20, left: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 9, color: item.accent, letterSpacing: '.2em' }}>{item.id}</span>
          <div style={{ width: 22, height: 1, background: item.accent, opacity: .4 }} />
          <span style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 8, color: 'rgba(255,235,180,.3)', letterSpacing: '.2em', textTransform: 'uppercase' }}>{item.tag}</span>
        </div>
      </div>
      {/* Text */}
      <div style={{ padding: '1.8rem 2rem 2rem' }}>
        <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: '1.32rem', fontWeight: 600, color: '#FFF8E7', lineHeight: 1.3, marginBottom: '.85rem' }}>{item.title}</h3>
        <p style={{ color: 'rgba(255,235,180,.42)', lineHeight: 1.82, fontSize: '.86rem', marginBottom: '1.5rem', fontFamily: '"Lato",sans-serif', fontWeight: 300 }}>{item.body}</p>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '5px 14px', borderRadius: 99,
          background: item.accent + '14', border: `1px solid ${item.accent}38`,
          color: item.accent, fontFamily: '"IBM Plex Mono",monospace', fontSize: 9, letterSpacing: '.1em',
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: item.accent, boxShadow: `0 0 8px ${item.accent}` }} />
          {item.stat}
        </div>
      </div>
    </div>
  )
}

/* ══════════════════════════════════════
   MAIN
══════════════════════════════════════ */
export default function Home() {
  const nav        = useNavigate()
  const videoRef   = useRef(null)
  const [videoReady, setVideoReady] = useState(false)
  const [scrollY,  setScrollY]  = useState(0)
  const [tickerX,  setTickerX]  = useState(0)
  const [mouseXY,  setMouseXY]  = useState({ x: .5, y: .5 })
  const mouseRef   = useRef({ x: .5, y: .5 })

  /* scroll */
  useEffect(() => {
    let ticking = false
    const fn = () => {
      if (!ticking) {
        requestAnimationFrame(() => { setScrollY(window.scrollY); ticking = false })
        ticking = true
      }
    }
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  /* mouse parallax */
  useEffect(() => {
    let raf
    const onMove = e => { mouseRef.current = { x: e.clientX / window.innerWidth, y: e.clientY / window.innerHeight } }
    const smooth = () => {
      setMouseXY(p => ({ x: p.x + (mouseRef.current.x - p.x) * .055, y: p.y + (mouseRef.current.y - p.y) * .055 }))
      raf = requestAnimationFrame(smooth)
    }
    window.addEventListener('mousemove', onMove)
    raf = requestAnimationFrame(smooth)
    return () => { window.removeEventListener('mousemove', onMove); cancelAnimationFrame(raf) }
  }, [])

  /* ticker */
  useEffect(() => {
    let pos = 0, last = null, raf
    const ITEM_W = 224
    const TOTAL  = TICKER.length * ITEM_W
    const loop = ts => {
      if (last) pos -= (ts - last) * .028
      if (pos < -TOTAL) pos = 0
      setTickerX(pos)
      last = ts
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  /* video rate */
  useEffect(() => {
    if (videoRef.current && videoReady) videoRef.current.playbackRate = .6
  }, [videoReady])

  const scrollTo = id => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  const tripled  = [...TICKER, ...TICKER, ...TICKER]

  const S = { /* shorthand bg color */ bg: '#07091A' }

  return (
    <div style={{ background: S.bg, color: '#FFF8E7', overflowX: 'hidden', fontFamily: '"Lato",sans-serif' }}>

      {/* ── Global styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Lato:wght@100;300;400;700&family=IBM+Plex+Mono:wght@300;400;500&display=swap');
        *,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
        html{scroll-behavior:smooth}

        @keyframes fadeUp   {from{opacity:0;transform:translateY(36px)}to{opacity:1;transform:none}}
        @keyframes fadeIn   {from{opacity:0}to{opacity:1}}
        @keyframes pulse    {0%,100%{opacity:1}50%{opacity:.15}}
        @keyframes float    {0%,100%{transform:translateY(0)}50%{transform:translateY(-16px)}}
        @keyframes shimmer  {0%{background-position:220% center}100%{background-position:-220% center}}
        @keyframes rotateCW {from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes rotateCCW{from{transform:rotate(0deg)}to{transform:rotate(-360deg)}}

        .live   {animation:pulse 2.4s ease infinite}
        .floaty {animation:float 7s ease-in-out infinite}

        .shimmer-text{
          background:linear-gradient(90deg,#FFD700 0%,#FFAA00 22%,#FF6B00 48%,#FFAA00 74%,#FFD700 100%);
          background-size:260% auto;
          -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
          animation:shimmer 5.5s linear infinite;
        }

        .btn-gold{
          padding:15px 42px;
          background:linear-gradient(135deg,#FFD700,#FF8C00 50%,#FFD700);
          background-size:210% auto;
          color:#07091A;border:none;border-radius:100px;
          font-family:"IBM Plex Mono",monospace;font-size:11px;font-weight:500;
          letter-spacing:.13em;text-transform:uppercase;cursor:pointer;
          box-shadow:0 8px 44px rgba(255,160,0,.42);
          transition:transform .25s,box-shadow .25s;
          animation:shimmer 4s linear infinite;
        }
        .btn-gold:hover{transform:translateY(-5px);box-shadow:0 22px 64px rgba(255,140,0,.58)}

        .btn-ghost{
          padding:15px 36px;background:transparent;
          color:rgba(255,235,180,.52);
          border:1px solid rgba(255,255,255,.11);border-radius:100px;
          font-family:"IBM Plex Mono",monospace;font-size:11px;
          letter-spacing:.13em;text-transform:uppercase;cursor:pointer;
          transition:all .25s;
        }
        .btn-ghost:hover{border-color:rgba(255,200,50,.45);color:#FFD060;background:rgba(255,180,0,.06);transform:translateY(-5px)}

        ::-webkit-scrollbar{width:4px}
        ::-webkit-scrollbar-track{background:#07091A}
        ::-webkit-scrollbar-thumb{background:rgba(255,160,0,.22);border-radius:2px}
      `}</style>

      {/* ════════════════════════
          HERO
      ════════════════════════ */}
      <section style={{ position: 'relative', height: '100vh', minHeight: 700, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

        {/* Poster fallback */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${MEDIA.poster})`,
          backgroundSize: 'cover', backgroundPosition: 'center 38%',
          filter: 'brightness(.16) saturate(.3)',
          opacity: videoReady ? 0 : 1,
          transition: 'opacity 2s ease',
        }} />

        {/* ── VIDEO BACKGROUND ── */}
        <video
          ref={videoRef}
          autoPlay muted loop playsInline preload="auto"
          onCanPlay={() => setVideoReady(true)}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover',
            filter: 'brightness(.22) saturate(.5) hue-rotate(6deg)',
            opacity: videoReady ? 1 : 0,
            transition: 'opacity 2s ease',
            transform: `translateY(${scrollY * .16}px)`,
          }}
        >
          <source src={MEDIA.heroVideo}  type="video/mp4" />
          <source src={MEDIA.heroVideo2} type="video/mp4" />
          <source src={MEDIA.heroVideo3} type="video/mp4" />
        </video>

        {/* Gradient curtains */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg,rgba(7,9,26,.96) 0%,rgba(7,9,26,.12) 28%,rgba(7,9,26,.08) 62%,rgba(7,9,26,1) 100%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 52% at 50% 48%,rgba(255,140,0,.048),transparent)', pointerEvents: 'none' }} />

        {/* Mouse-tracked orbs */}
        {[
          { top: '10%', left: '6%',   w: 520, bg: 'rgba(0,229,160,.072)',  blur: 70,  mx: 36,  my: 26 },
          { bottom: '16%', right: '5%', w: 580, bg: 'rgba(255,90,0,.062)', blur: 90,  mx: -30, my: -22 },
          { top: '40%', left: '42%',  w: 300, bg: 'rgba(255,180,0,.04)',   blur: 60,  mx: 18,  my: 14 },
        ].map((o, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: o.top, left: o.left, bottom: o.bottom, right: o.right,
            width: o.w, height: o.w, borderRadius: '50%',
            background: `radial-gradient(circle,${o.bg} 0%,transparent 70%)`,
            filter: `blur(${o.blur}px)`,
            transform: `translate(${(mouseXY.x - .5) * o.mx}px,${(mouseXY.y - .5) * o.my}px)`,
            transition: 'transform 1.8s cubic-bezier(.16,1,.3,1)',
            pointerEvents: 'none',
          }} />
        ))}

        {/* Fine grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(255,200,80,.022) 1px,transparent 1px),linear-gradient(90deg,rgba(255,200,80,.022) 1px,transparent 1px)',
          backgroundSize: '68px 68px', pointerEvents: 'none',
        }} />

        {/* Horizon lines */}
        <div style={{ position: 'absolute', top: '20%', left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(255,200,80,.18) 30%,rgba(255,200,80,.28) 50%,rgba(255,200,80,.18) 70%,transparent)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '22%', left: 0, right: 0, height: 1, background: 'linear-gradient(90deg,transparent,rgba(255,200,80,.1) 30%,rgba(255,200,80,.18) 50%,rgba(255,200,80,.1) 70%,transparent)', pointerEvents: 'none' }} />

        {/* Corner brackets */}
        {[
          { top: '1.6rem', left: '1.6rem' },
          { top: '1.6rem', right: '1.6rem', flipX: true },
          { bottom: '1.6rem', left: '1.6rem', flipY: true },
          { bottom: '1.6rem', right: '1.6rem', flipX: true, flipY: true },
        ].map((c, i) => (
          <div key={i} style={{ position: 'absolute', ...c, width: 20, height: 20, pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', [c.flipY ? 'bottom' : 'top']: 0, [c.flipX ? 'right' : 'left']: 0, width: 14, height: 1, background: 'rgba(255,200,80,.38)' }} />
            <div style={{ position: 'absolute', [c.flipY ? 'bottom' : 'top']: 0, [c.flipX ? 'right' : 'left']: 0, width: 1, height: 14, background: 'rgba(255,200,80,.38)' }} />
          </div>
        ))}

        {/* Decorative rotating ring — top-right */}
        <div style={{ position: 'absolute', top: '8%', right: '5%', width: 260, height: 260, pointerEvents: 'none', opacity: .13 }}>
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '1px solid rgba(255,200,80,.8)', animation: 'rotateCW 30s linear infinite' }}>
            <div style={{ position: 'absolute', top: -3, left: '50%', width: 5, height: 5, borderRadius: '50%', background: '#FFD060', transform: 'translateX(-50%)' }} />
          </div>
          <div style={{ position: 'absolute', inset: 28, borderRadius: '50%', border: '1px dashed rgba(255,200,80,.5)', animation: 'rotateCCW 22s linear infinite' }}>
            <div style={{ position: 'absolute', bottom: -3, left: '50%', width: 4, height: 4, borderRadius: '50%', background: '#00E5A0', transform: 'translateX(-50%)' }} />
          </div>
          <div style={{ position: 'absolute', inset: 56, borderRadius: '50%', border: '1px solid rgba(255,200,80,.3)', animation: 'rotateCW 18s linear infinite' }} />
        </div>

        {/* ── Hero content ── */}
        <div style={{ position: 'relative', zIndex: 5, textAlign: 'center', maxWidth: 980, padding: '0 2.5rem' }}>

          {/* Live badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '7px 22px', borderRadius: 100,
            background: 'rgba(0,229,160,.06)', border: '1px solid rgba(0,229,160,.22)',
            marginBottom: '2.6rem',
            animation: 'fadeIn .7s ease .1s both',
          }}>
            <span className="live" style={{ width: 6, height: 6, borderRadius: '50%', background: '#00E5A0', boxShadow: '0 0 10px #00E5A0', display: 'block', flexShrink: 0 }} />
            <span style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 9, color: 'rgba(255,235,180,.52)', letterSpacing: '.22em', textTransform: 'uppercase' }}>
              Live Intelligence · 54 Economies · Real-Time
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: '"Playfair Display",serif',
            fontSize: 'clamp(3rem,8vw,6.8rem)',
            fontWeight: 600, lineHeight: 1.02, letterSpacing: '-.022em',
            marginBottom: '1.5rem',
            animation: 'fadeUp .95s cubic-bezier(.16,1,.3,1) .28s both',
          }}>
            <span style={{ display: 'block', color: '#FFF8E7' }}>Africa's Horizon,</span>
            <span className="shimmer-text" style={{ display: 'block', fontStyle: 'italic', fontWeight: 500, lineHeight: 1.08 }}>
              Clear. Bold. United.
            </span>
          </h1>

          {/* Sub-headline */}
          <p style={{
            fontFamily: '"Lato",sans-serif',
            fontSize: 'clamp(1rem,1.7vw,1.12rem)',
            color: 'rgba(255,235,180,.45)',
            maxWidth: 530, margin: '0 auto 3.2rem',
            lineHeight: 1.9, fontWeight: 300,
            animation: 'fadeUp .88s cubic-bezier(.16,1,.3,1) .45s both',
          }}>
            Africa's economies move fast. Goods cross borders. Markets shift overnight. Risks emerge without warning. This platform transforms motion into intelligence — giving leaders and investors the clarity to act.
          </p>

          {/* CTAs */}
          <div style={{
            display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap',
            animation: 'fadeUp .88s cubic-bezier(.16,1,.3,1) .6s both',
          }}>
            <button className="btn-gold" onClick={() => nav('/dashboard')}>Open Dashboard</button>
            <button className="btn-ghost" onClick={() => scrollTo('story')}>How It Works</button>
          </div>

          {/* Data provenance */}
          <div style={{
            marginTop: '3.2rem',
            display: 'flex', justifyContent: 'center', gap: '2.8rem', flexWrap: 'wrap',
            animation: 'fadeIn 1s ease .95s both',
          }}>
            {['World Bank Data', 'IMF Verified', 'WB API Live'].map(t => (
              <span key={t} style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 9, color: 'rgba(255,235,180,.18)', letterSpacing: '.15em', textTransform: 'uppercase' }}>
                + {t}
              </span>
            ))}
          </div>
        </div>

        {/* Scroll cue */}
        <div style={{
          position: 'absolute', bottom: '2.5rem', left: '50%', transform: 'translateX(-50%)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          opacity: .2, animation: 'fadeIn 1.2s ease 1.3s both', pointerEvents: 'none',
        }}>
          <span style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 7, letterSpacing: '.42em', textTransform: 'uppercase' }}>Scroll</span>
          <div style={{ width: 1, height: 56, background: 'linear-gradient(to bottom,#FFD700,transparent)' }} />
        </div>
      </section>

      {/* ════════════════════════
          TICKER
      ════════════════════════ */}
      <div style={{
        borderTop: '1px solid rgba(255,200,80,.11)', borderBottom: '1px solid rgba(255,200,80,.11)',
        background: 'rgba(255,180,0,.018)',
        padding: '13px 0', overflow: 'hidden', whiteSpace: 'nowrap',
      }}>
        <div style={{ display: 'inline-flex', transform: `translateX(${tickerX}px)`, willChange: 'transform' }}>
          {tripled.map((item, i) => (
            <span key={i} style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              padding: '0 28px', flexShrink: 0,
              borderRight: '1px solid rgba(255,200,80,.07)',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: item.color, flexShrink: 0, boxShadow: `0 0 6px ${item.color}` }} />
              <span style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 9, color: 'rgba(255,235,180,.28)', letterSpacing: '.08em' }}>{item.label}</span>
              <span style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 9, color: item.color, letterSpacing: '.08em' }}>{item.value}</span>
            </span>
          ))}
        </div>
      </div>

      {/* ════════════════════════
          STATS
      ════════════════════════ */}
      <section style={{ background: 'linear-gradient(180deg,rgba(0,0,0,.32) 0%,rgba(255,120,0,.025) 100%)', borderBottom: '1px solid rgba(255,200,80,.07)' }}>
        <div style={{ maxWidth: 1120, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(4,1fr)' }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ borderRight: i < 3 ? '1px solid rgba(255,200,80,.07)' : 'none' }}>
              <StatBlock {...s} />
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════
          STORY
      ════════════════════════ */}
      <section id="story" style={{ padding: '9rem 2.5rem', maxWidth: 1150, margin: '0 auto' }}>
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: '5.5rem' }}>
            <div style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 8, letterSpacing: '.32em', color: 'rgba(255,180,0,.65)', textTransform: 'uppercase', marginBottom: '1.2rem' }}>
              The Context
            </div>
            <h2 style={{ fontFamily: '"Playfair Display",serif', fontSize: 'clamp(1.9rem,4vw,3.2rem)', fontWeight: 400, color: '#FFF8E7', lineHeight: 1.25 }}>
              Three truths that made<br />
              <span style={{ fontStyle: 'italic', color: '#FFD060' }}>SentinelAfrica necessary.</span>
            </h2>
          </div>
        </Reveal>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 3 }}>
          {[
            { n: '01', headline: 'A continent of 1.4 billion people.', body: 'Generating the next era of global economic expansion.', accent: '#00E5A0', hi: false },
            { n: '02', headline: '$270B lost in one pandemic year.',    body: 'Because no system existed to see it coming.',              accent: '#FF6B6B', hi: false },
            { n: '03', headline: 'That changes today.',                 body: 'SentinelAfrica detects the storm before it makes landfall.', accent: '#FFD060', hi: true  },
          ].map((s, i) => (
            <Reveal key={i} delay={i * .18}>
              <div style={{
                padding: '3.2rem 2.6rem', minHeight: 260,
                display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                position: 'relative', overflow: 'hidden', borderRadius: 20,
                background: s.hi
                  ? 'linear-gradient(148deg,rgba(255,180,0,.1),rgba(255,100,0,.055))'
                  : 'rgba(255,255,255,.022)',
                border: `1px solid ${s.hi ? 'rgba(255,180,0,.24)' : 'rgba(255,200,80,.08)'}`,
                transition: 'transform .4s',
              }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-6px)'}
                onMouseLeave={e => e.currentTarget.style.transform = ''}
              >
                {s.hi && <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 28% 82%,rgba(255,180,0,.1),transparent 55%)', pointerEvents: 'none' }} />}
                <div style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 9, color: s.accent, letterSpacing: '.22em', marginBottom: '1.8rem', opacity: .55 }}>{s.n}</div>
                <div style={{ width: 34, height: 2, background: s.accent, borderRadius: 1, marginBottom: '1.4rem', boxShadow: `0 0 10px ${s.accent}90` }} />
                <h3 style={{ fontFamily: '"Playfair Display",serif', fontSize: 'clamp(1.12rem,2vw,1.58rem)', fontWeight: 500, color: '#FFF8E7', lineHeight: 1.28, marginBottom: '.8rem' }}>{s.headline}</h3>
                <p style={{ color: 'rgba(255,235,180,.35)', fontSize: '.88rem', lineHeight: 1.72, fontWeight: 300 }}>{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ════════════════════════
          PROBLEM — SPLIT
      ════════════════════════ */}
      <section style={{
        borderTop: '1px solid rgba(255,200,80,.07)',
        padding: '9rem 2.5rem',
        background: 'linear-gradient(180deg,rgba(0,0,0,.28) 0%,rgba(255,80,0,.025) 100%)',
      }}>
        <div style={{ maxWidth: 1150, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '7rem', alignItems: 'center' }}>

          {/* Photo side */}
          <Reveal from="left">
            <div style={{ position: 'relative' }}>
              <div style={{ borderRadius: 20, overflow: 'hidden', aspectRatio: '4/3', boxShadow: '0 48px 110px rgba(0,0,0,.72)' }}>
                <img src={MEDIA.market} alt="African market" loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(.52) saturate(.46)', display: 'block' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,rgba(255,180,0,.08),transparent 52%)' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top,rgba(7,9,26,.68),transparent 50%)' }} />
              </div>
              {/* Accent top bar */}
              <div style={{ position: 'absolute', top: -1, left: -1, right: -1, height: 3, borderRadius: '20px 20px 0 0', background: 'linear-gradient(90deg,#FFD700,#FF6600,transparent)' }} />
              {/* Floating metric card */}
              <div className="floaty" style={{
                position: 'absolute', bottom: '-2.2rem', right: '-2.2rem',
                background: 'rgba(7,9,26,.93)',
                border: '1px solid rgba(255,200,80,.22)',
                borderRadius: 18, padding: '1.5rem 2rem',
                backdropFilter: 'blur(28px)',
                boxShadow: '0 28px 72px rgba(0,0,0,.65),0 0 44px rgba(255,160,0,.1)',
                minWidth: 195,
              }}>
                <div style={{
                  fontFamily: '"Playfair Display",serif',
                  fontSize: '2.8rem', fontWeight: 700, lineHeight: 1,
                  background: 'linear-gradient(135deg,#FFD700,#FF6600)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
                  marginBottom: 8,
                }}>$270B</div>
                <div style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 8, color: 'rgba(255,235,180,.36)', letterSpacing: '.08em' }}>Trade losses · 2020 alone</div>
              </div>
            </div>
          </Reveal>

          {/* Text side */}
          <Reveal from="right" delay={.22}>
            <div>
              <div style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 8, letterSpacing: '.32em', color: 'rgba(255,180,0,.6)', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
                The Problem
              </div>
              <h2 style={{ fontFamily: '"Playfair Display",serif', fontSize: 'clamp(1.8rem,3vw,2.7rem)', fontWeight: 400, lineHeight: 1.22, color: '#FFF8E7', marginBottom: '1.8rem' }}>
                Africa's economies are resilient.
                <br /><span style={{ color: '#FFD060', fontStyle: 'italic' }}>The data infrastructure has not caught up.</span>
              </h2>
              <p style={{ color: 'rgba(255,235,180,.42)', lineHeight: 1.96, fontSize: '.95rem', marginBottom: '1.2rem', fontWeight: 300 }}>
                When COVID-19 struck, African economies lost an estimated{' '}
                <strong style={{ color: 'rgba(255,235,180,.78)', fontWeight: 400 }}>$270 billion</strong>{' '}
                in trade flows. Governments had no early warning, no real-time visibility, and no map of the contagion spreading across supply chains.
              </p>
              <p style={{ color: 'rgba(255,235,180,.42)', lineHeight: 1.96, fontSize: '.95rem', marginBottom: '3rem', fontWeight: 300 }}>
                SentinelAfrica fuses World Bank indicators, trade data, and macroeconomic signals into a single intelligence layer — one that sees the storm before it makes landfall.
              </p>

              {/* Terminal widget */}
              <div style={{
                background: 'linear-gradient(148deg,#07101F,#0A1428)',
                border: '1px solid rgba(255,200,80,.14)',
                borderRadius: 16, padding: '1.6rem 2rem',
                fontFamily: '"IBM Plex Mono",monospace', fontSize: 11, lineHeight: 2.12,
                boxShadow: '0 24px 64px rgba(0,0,0,.5),inset 0 1px 0 rgba(255,200,80,.05)',
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.1rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,200,80,.08)' }}>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {['#FF5F57','#FFBD2E','#28CA41'].map(c => <span key={c} style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'block' }} />)}
                  </div>
                  <span style={{ fontSize: 9, color: 'rgba(255,235,180,.2)', letterSpacing: '.14em', marginLeft: 6 }}>SENTINEL · LIVE SIGNAL</span>
                  <span className="live" style={{ width: 6, height: 6, borderRadius: '50%', background: '#00E5A0', marginLeft: 'auto', boxShadow: '0 0 8px #00E5A0', display: 'block' }} />
                </div>
                {/* Rows */}
                {[
                  ['country',    '"Rwanda"',              null],
                  ['sector',     '"Agricultural Inputs"', null],
                  ['signal',     '"Import spike +34%"',   '#FFB347'],
                  ['confidence', '0.91',                  null],
                  ['window',     '"14 days"',             null],
                  ['status',     '"Alert dispatched"',    '#00E5A0'],
                ].map(([k, v, c]) => (
                  <div key={k} style={{ display: 'flex', gap: 6 }}>
                    <span style={{ color: '#00E5A0', minWidth: 84 }}>{k}</span>
                    <span style={{ color: 'rgba(255,235,180,.18)' }}>:</span>
                    <span style={{ color: c ?? 'rgba(255,235,180,.7)' }}>{v}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid rgba(255,200,80,.06)', marginTop: '1rem', paddingTop: '1rem', fontSize: 9, color: 'rgba(255,235,180,.12)' }}>
                  World Bank API · Updated 2m ago
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════════
          CAPABILITIES
      ════════════════════════ */}
      <section id="features" style={{ padding: '9rem 2.5rem', borderTop: '1px solid rgba(255,200,80,.07)' }}>
        <div style={{ maxWidth: 1150, margin: '0 auto' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: '5.5rem' }}>
              <div style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 8, letterSpacing: '.32em', color: 'rgba(255,180,0,.6)', textTransform: 'uppercase', marginBottom: '1.2rem' }}>
                Platform Capabilities
              </div>
              <h2 style={{ fontFamily: '"Playfair Display",serif', fontSize: 'clamp(1.9rem,4vw,3.2rem)', fontWeight: 400, color: '#FFF8E7', lineHeight: 1.2 }}>
                Three lenses. <span style={{ fontStyle: 'italic', color: '#FFD060' }}>One clear picture.</span>
              </h2>
            </div>
          </Reveal>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: '1.6rem' }}>
            {CAPABILITIES.map((item, i) => <CapCard key={i} item={item} index={i} />)}
          </div>
        </div>
      </section>

      {/* ════════════════════════
          QUOTE BANNER
      ════════════════════════ */}
      <section style={{ position: 'relative', overflow: 'hidden', minHeight: '56vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${MEDIA.aerial})`,
          backgroundSize: 'cover', backgroundPosition: 'center 40%',
          filter: 'brightness(.12) saturate(.28)',
          transform: `translateY(${(scrollY - 3200) * .07}px)`,
        }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(7,9,26,.97),rgba(7,9,26,.35) 50%,rgba(7,9,26,.97))' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 52% at 50% 50%,rgba(255,160,0,.04),transparent)' }} />

        <Reveal style={{ position: 'relative', zIndex: 5, textAlign: 'center', padding: '6rem 2rem', maxWidth: 780 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '2.8rem' }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right,transparent,rgba(255,200,80,.24))' }} />
            <span style={{ fontFamily: '"Playfair Display",serif', fontSize: '2.4rem', color: 'rgba(255,200,80,.2)' }}>"</span>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left,transparent,rgba(255,200,80,.24))' }} />
          </div>
          <blockquote style={{ fontFamily: '"Playfair Display",serif', fontSize: 'clamp(1.5rem,4vw,3rem)', fontWeight: 300, lineHeight: 1.46, color: '#FFF8E7', marginBottom: '2.8rem' }}>
            The continent is not waiting for the world.
            <br />
            <span style={{ color: '#FFD060', fontStyle: 'italic', fontWeight: 400 }}>The world is waiting for the continent.</span>
          </blockquote>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem', marginBottom: '1.5rem' }}>
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right,transparent,rgba(255,200,80,.18))' }} />
            <div style={{ width: 5, height: 5, borderRadius: '50%', border: '1px solid rgba(255,200,80,.32)' }} />
            <div style={{ flex: 1, height: 1, background: 'linear-gradient(to left,transparent,rgba(255,200,80,.18))' }} />
          </div>
          <p style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 9, color: 'rgba(255,235,180,.15)', letterSpacing: '.26em', textTransform: 'uppercase' }}>
            SentinelAfrica · 2024
          </p>
        </Reveal>
      </section>

      {/* ════════════════════════
          FINAL CTA — no email, navigate to dashboard
      ════════════════════════ */}
      <section style={{ position: 'relative', overflow: 'hidden', padding: '11rem 2.5rem', textAlign: 'center' }}>
        {/* Parallax image */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${MEDIA.aerial})`,
          backgroundSize: 'cover', backgroundPosition: 'center 55%',
          filter: 'brightness(.09) saturate(.22)',
        }} />
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 78% 68% at 50% 50%,rgba(255,180,0,.07),transparent)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom,rgba(7,9,26,.92),rgba(7,9,26,.55),rgba(7,9,26,.92))' }} />

        <Reveal style={{ position: 'relative', zIndex: 5, maxWidth: 620, margin: '0 auto' }}>
          <div style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 8, letterSpacing: '.32em', color: 'rgba(255,180,0,.6)', textTransform: 'uppercase', marginBottom: '1.6rem' }}>
            Get Started
          </div>
          <h2 style={{ fontFamily: '"Playfair Display",serif', fontSize: 'clamp(2rem,5vw,3.8rem)', fontWeight: 400, lineHeight: 1.14, color: '#FFF8E7', marginBottom: '1.6rem' }}>
            Ready to see Africa<br />
            <span style={{ fontStyle: 'italic', color: '#FFD060' }}>with new eyes?</span>
          </h2>
          <p style={{ color: 'rgba(255,235,180,.36)', lineHeight: 1.9, fontSize: '1rem', fontWeight: 300, maxWidth: 460, margin: '0 auto 3.5rem', fontFamily: '"Lato",sans-serif' }}>
            Built for analysts, policymakers, and investors who need Africa's economic pulse — live, accurate, and actionable.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-gold" onClick={() => nav('/dashboard')}>Open Dashboard</button>
            <button className="btn-ghost" onClick={() => scrollTo('features')}>See Capabilities</button>
          </div>
          {/* Dot pagination decoration */}
          <div style={{ marginTop: '4rem', display: 'flex', justifyContent: 'center', gap: 7 }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} style={{ width: i === 3 ? 22 : 4, height: 4, borderRadius: 2, background: `rgba(255,200,80,${i === 3 ? .55 : .1})`, transition: 'width .3s' }} />
            ))}
          </div>
        </Reveal>
      </section>

      {/* ════════════════════════
          FOOTER
      ════════════════════════ */}
      <footer style={{
        borderTop: '1px solid rgba(255,200,80,.07)',
        padding: '2.5rem 3.5rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem',
        background: 'rgba(0,0,0,.5)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="live" style={{ width: 6, height: 6, borderRadius: '50%', background: '#00E5A0', boxShadow: '0 0 8px #00E5A0', display: 'block' }} />
          <span style={{ fontFamily: '"Playfair Display",serif', fontSize: 17, color: 'rgba(255,235,180,.4)' }}>
            Sentinel<span style={{ color: '#FFD060' }}>Africa</span>
          </span>
        </div>
        <span style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 9, color: 'rgba(255,235,180,.12)', letterSpacing: '.1em' }}>
          © 2024 SentinelAfrica · Built for Africa's Future
        </span>
        <div style={{ display: 'flex', gap: '1.8rem' }}>
          {['World Bank','IMF','UNCTAD'].map(s => (
            <span key={s} style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 9, color: 'rgba(255,235,180,.14)', letterSpacing: '.08em' }}>{s}</span>
          ))}
        </div>
      </footer>
    </div>
  )
}