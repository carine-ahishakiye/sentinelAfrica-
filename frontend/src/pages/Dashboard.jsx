import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import { fetchSupplyChainRisks, fetchResilienceIndex } from '../api/client'

/* ── Colour tokens ── */
const R = { high: '#E24B4A', medium: '#EF9F27', low: '#1D9E75' }
const T = { strong: '#1D9E75', moderate: '#378ADD', developing: '#EF9F27', fragile: '#E24B4A' }
const TL = { strong: 'Strong', moderate: 'Moderate', developing: 'Developing', fragile: 'Fragile' }
const WS = { CONNECTING: 'connecting', LIVE: 'live', RECONNECTING: 'reconnecting', ERROR: 'error', CLOSED: 'closed' }

/* ── Animated counter ── */
function Num({ v, dec = 0, dur = 700 }) {
  const [d, setD] = useState(0)
  const p = useRef(0)
  useEffect(() => {
    if (v === '—' || v == null) { setD('—'); return }
    const from = p.current, to = parseFloat(v); p.current = to
    const steps = Math.ceil(dur / 16); let s = 0
    const id = setInterval(() => {
      s++; const e = 1 - Math.pow(1 - s / steps, 3)
      setD((from + (to - from) * e).toFixed(dec))
      if (s >= steps) { setD(to.toFixed(dec)); clearInterval(id) }
    }, 16)
    return () => clearInterval(id)
  }, [v, dec, dur])
  return <>{d}</>
}

/* ── Scroll reveal ── */
function useInView() {
  const ref = useRef(null); const [vis, setVis] = useState(false)
  useEffect(() => {
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVis(true); o.disconnect() } }, { threshold: 0.04 })
    if (ref.current) o.observe(ref.current)
    return () => o.disconnect()
  }, [])
  return [ref, vis]
}
function Fade({ children, delay = 0, y = 16 }) {
  const [ref, vis] = useInView()
  return (
    <div ref={ref} style={{ opacity: vis ? 1 : 0, transform: vis ? 'none' : `translateY(${y}px)`, transition: `opacity .55s ease ${delay}s, transform .55s ease ${delay}s` }}>
      {children}
    </div>
  )
}

/* ── Animated bar ── */
function Bar({ pct, color, h = 3 }) {
  const [w, setW] = useState(0)
  useEffect(() => { const t = setTimeout(() => setW(pct), 120); return () => clearTimeout(t) }, [pct])
  return (
    <div style={{ height: h, borderRadius: h, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', flex: 1, minWidth: 40, position: 'relative' }}>
      <div style={{ height: '100%', width: `${w}%`, borderRadius: h, background: color, transition: 'width .95s cubic-bezier(.4,0,.2,1)', boxShadow: `0 0 6px ${color}55` }} />
    </div>
  )
}

/* ── Risk pill ── */
function Pill({ label, color, sm }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: sm ? '2px 8px' : '3px 11px',
      borderRadius: 5,
      fontSize: sm ? 9 : 10,
      fontFamily: "'IBM Plex Mono', monospace",
      fontWeight: 600,
      letterSpacing: '.06em',
      textTransform: 'uppercase',
      background: color + '1a',
      color: color,
      border: `1px solid ${color}40`,
      whiteSpace: 'nowrap',
    }}>{label}</span>
  )
}

/* ── Section heading ── */
function SectionHead({ title, sub, right }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, padding: '1.15rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#F0EDE6', fontFamily: "'Outfit',sans-serif", letterSpacing: '.01em' }}>{title}</div>
        {sub && <div style={{ fontSize: 10.5, color: 'rgba(240,237,230,0.35)', fontFamily: "'IBM Plex Mono',monospace", marginTop: 2 }}>{sub}</div>}
      </div>
      {right && <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>{right}</div>}
    </div>
  )
}

/* ══════════════════════════ MAIN ══════════════════════════ */
export default function Dashboard() {
  const [risks,      setRisks]       = useState([])
  const [resilience, setResilience]  = useState([])
  const [loading,    setLoading]     = useState(true)
  const [tick,       setTick]        = useState('—')
  const [wsState,    setWsState]     = useState(WS.CONNECTING)
  const [retryCount, setRetryCount]  = useState(0)
  const [error,      setError]       = useState(null)
  const [flash,      setFlash]       = useState(false)
  const [search,     setSearch]      = useState('')
  const [sortBy,     setSortBy]      = useState('risk')
  const [filter,     setFilter]      = useState('all')
  const [activeRow,  setActiveRow]   = useState(null)

  const wsRef = useRef(null); const retryTimer = useRef(null)
  const mountedRef = useRef(true); const connectRef = useRef(null)
  const doFlash = useCallback(() => { setFlash(true); setTimeout(() => setFlash(false), 500) }, [])

  const connectWS = useCallback(() => {
    if (!mountedRef.current) return
    if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close() }
    setWsState(WS.CONNECTING)
    const base = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/^http/, 'ws')
    const ws = new WebSocket(`${base}/ws/supply-chain`)
    wsRef.current = ws
    ws.onopen    = () => { if (!mountedRef.current) return; setWsState(WS.LIVE); setRetryCount(0); setError(null) }
    ws.onmessage = ev => {
      if (!mountedRef.current) return
      try {
        const p = JSON.parse(ev.data)
        if (p.warming) { setError(`Warming up… ${p.message || ''}`); return }
        if (p.error)   { setError(p.error); return }
        if (p.risk?.data)       { setError(null); setRisks(p.risk.data) }
        if (p.resilience?.data) setResilience(p.resilience.data)
        if (p.timestamp)        setTick(p.timestamp)
        setLoading(false); doFlash()
      } catch (e) { setError(e.message) }
    }
    ws.onerror = () => { if (!mountedRef.current) return; setWsState(WS.ERROR) }
    ws.onclose = e => {
      if (!mountedRef.current) { setWsState(WS.CLOSED); return }
      if (e.code === 1000)     { setWsState(WS.CLOSED); return }
      setWsState(WS.RECONNECTING)
      setRetryCount(c => { const n = c + 1; retryTimer.current = setTimeout(() => connectRef.current?.(), Math.min(3000 * n, 30000)); return n })
    }
  }, [doFlash])

  useEffect(() => { connectRef.current = connectWS }, [connectWS])

  useEffect(() => {
    mountedRef.current = true
    Promise.all([fetchSupplyChainRisks(), fetchResilienceIndex()])
      .then(([r1, r2]) => { if (!mountedRef.current) return; setRisks(r1.data.data ?? []); setResilience(r2.data.data ?? []); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
    connectWS()
    return () => { mountedRef.current = false; clearTimeout(retryTimer.current); if (wsRef.current) { wsRef.current.onclose = null; wsRef.current.close() } }
  }, []) // eslint-disable-line

  /* ── Derived ── */
  const highRisk    = risks.filter(r => r.risk_level === 'high').length
  const avgRisk     = risks.length ? (risks.reduce((s, r) => s + r.risk_score, 0) / risks.length).toFixed(1) : '—'
  const strongCount = resilience.filter(r => r.tier === 'strong').length
  const avgRes      = resilience.length ? (resilience.reduce((s, r) => s + r.composite_score, 0) / resilience.length).toFixed(1) : '—'

  const rows = useMemo(() => {
    const resMap = Object.fromEntries(resilience.map(r => [r.country_code, r]))
    let rs = risks.map(r => ({ ...r, res: resMap[r.country_code] ?? null }))
    if (search.trim()) { const q = search.toLowerCase(); rs = rs.filter(r => r.country.toLowerCase().includes(q) || r.country_code.toLowerCase().includes(q)) }
    if (filter !== 'all') rs = rs.filter(r => r.risk_level === filter)
    if (sortBy === 'risk')       rs.sort((a, b) => b.risk_score - a.risk_score)
    if (sortBy === 'resilience') rs.sort((a, b) => (b.res?.composite_score ?? 0) - (a.res?.composite_score ?? 0))
    if (sortBy === 'name')       rs.sort((a, b) => a.country.localeCompare(b.country))
    return rs
  }, [risks, resilience, search, filter, sortBy])

  const wsCfg = {
    connecting:   { c: '#EF9F27', l: 'Connecting' },
    live:         { c: '#1D9E75', l: 'Live' },
    reconnecting: { c: '#EF9F27', l: `Retry ${retryCount}` },
    error:        { c: '#E24B4A', l: 'Error' },
    closed:       { c: '#888',    l: 'Offline' },
  }[wsState] || { c: '#888', l: '—' }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&family=Cormorant+Garamond:ital,wght@0,600;1,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0 }

        :root {
          --bg:      #080d12;
          --s1:      #0d1520;
          --s2:      #111c2a;
          --s3:      #162135;
          --border:  rgba(255,255,255,0.06);
          --border2: rgba(255,255,255,0.13);
          --gold:    #C9A84C;
          --gold2:   #E8C97A;
          --text:    #F0EDE6;
          --muted:   rgba(240,237,230,0.38);
          --mono:    'IBM Plex Mono', monospace;
          --sans:    'Outfit', sans-serif;
        }

        body, #root {
          background: var(--bg);
          position: relative;
        }

        @keyframes bg-drift {
          0%   { transform: scale(1) translateY(0px) }
          100% { transform: scale(1.06) translateY(-20px) }
        }

        /* ── Floating orbs ── */
        @keyframes orb-float-1 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(40px,-60px) scale(1.08)} 66%{transform:translate(-30px,40px) scale(0.95)} }
        @keyframes orb-float-2 { 0%,100%{transform:translate(0,0) scale(1)} 33%{transform:translate(-50px,30px) scale(1.05)} 66%{transform:translate(35px,-45px) scale(0.97)} }
        @keyframes orb-float-3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(25px,55px) scale(1.06)} }
        @keyframes orb-float-4 { 0%,100%{transform:translate(0,0)} 40%{transform:translate(-40px,-30px)} 80%{transform:translate(20px,20px)} }

        /* ── Particles ── */
        @keyframes particle-rise {
          0%   { transform: translateY(0) translateX(0); opacity: 0 }
          10%  { opacity: 1 }
          90%  { opacity: 0.6 }
          100% { transform: translateY(-120vh) translateX(var(--dx)); opacity: 0 }
        }
        .particle {
          position: fixed; bottom: -10px; pointer-events: none; z-index: 1;
          width: var(--size); height: var(--size);
          border-radius: 50%;
          background: var(--pc);
          animation: particle-rise var(--dur) ease-in var(--delay) infinite;
        }

        /* ── Continent pulse ring ── */
        @keyframes ring-pulse {
          0%   { transform: translate(-50%,-50%) scale(0.92); opacity: 0.18 }
          50%  { transform: translate(-50%,-50%) scale(1.08); opacity: 0.06 }
          100% { transform: translate(-50%,-50%) scale(0.92); opacity: 0.18 }
        }
        @keyframes ring-pulse2 {
          0%   { transform: translate(-50%,-50%) scale(1); opacity: 0.10 }
          50%  { transform: translate(-50%,-50%) scale(1.18); opacity: 0.03 }
          100% { transform: translate(-50%,-50%) scale(1); opacity: 0.10 }
        }

        @keyframes spin         { to { transform: rotate(360deg) } }
        @keyframes fadein       { from { opacity:0; transform:translateY(10px) } to { opacity:1; transform:none } }
        @keyframes pulse-dot    { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.25;transform:scale(1.5)} }
        @keyframes ticker       { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes flash        { 0%,100%{opacity:1} 40%{opacity:.15} }
        @keyframes shimmer      { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes glow-badge   { 0%,100%{box-shadow:0 0 6px rgba(29,158,117,.3),0 0 18px rgba(29,158,117,.08)} 50%{box-shadow:0 0 12px rgba(29,158,117,.55),0 0 28px rgba(29,158,117,.18)} }
        @keyframes skel         { 0%{background-position:200%} 100%{background-position:-200%} }

        .spin   { animation: spin 1.2s linear infinite }
        .flash  { animation: flash .45s ease }

        .gold-text {
          background: linear-gradient(90deg, #C9A84C, #F5DC8A, #C9A84C, #E8C97A);
          background-size: 300% auto;
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 6s linear infinite;
        }

        /* ─────────────────────────────────────────────────────
           CARDS — reduced opacity so background bleeds through
           KEY FIXES:
             • .card background opacity 0.72 → 0.50
             • .kpi  background opacity 0.68 → 0.46
             • added subtle backdrop-filter for frosted glass look
        ───────────────────────────────────────────────────── */
        .card {
          /* ✅ FIXED: was rgba(13,21,32,0.72) — too opaque to see bg through */
          background: rgba(13,21,32,0.50);
          backdrop-filter: blur(22px);
          -webkit-backdrop-filter: blur(22px);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 16px;
          overflow: hidden;
          position: relative;
          transition: border-color .25s, box-shadow .25s;
        }
        .card::before {
          content: '';
          position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 55%);
          border-radius: 16px;
        }
        .card:hover {
          border-color: rgba(255,255,255,0.14);
          box-shadow: 0 0 0 1px rgba(201,168,76,.10), 0 24px 55px rgba(0,0,0,.45);
        }

        /* ── KPI cards ── */
        .kpi {
          /* ✅ FIXED: was rgba(13,21,32,0.68) — too opaque */
          background: rgba(13,21,32,0.46);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 16px;
          padding: 1.25rem 1.4rem 1.1rem;
          position: relative; overflow: hidden;
          transition: transform .25s, box-shadow .28s, border-color .25s;
          cursor: default;
        }
        .kpi::before {
          content: '';
          position: absolute; inset: 0; pointer-events: none;
          background: linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 60%);
        }
        .kpi:hover {
          transform: translateY(-4px);
          box-shadow: 0 22px 55px rgba(0,0,0,.50), 0 0 0 1px rgba(201,168,76,.18);
          border-color: rgba(201,168,76,.26);
        }

        /* ── Table rows ── */
        .tr { transition: background .12s; cursor: pointer; border-left: 2px solid transparent }
        .tr:hover { background: rgba(255,255,255,0.028) !important }
        .tr.act   { background: rgba(201,168,76,.07) !important; border-left: 2px solid var(--gold) }

        /* ── Search input ── */
        .srch {
          background: rgba(17,28,42,0.70);
          border: 1px solid var(--border);
          border-radius: 9px;
          padding: 8px 12px 8px 34px;
          color: var(--text);
          font-family: var(--mono);
          font-size: 12px;
          outline: none;
          width: 200px;
          transition: border-color .18s, width .28s, box-shadow .18s;
        }
        .srch:focus { border-color: rgba(201,168,76,.42); width: 240px; box-shadow: 0 0 0 3px rgba(201,168,76,.08) }
        .srch::placeholder { color: var(--muted) }

        /* ── Filter / sort buttons ── */
        .fbtn {
          padding: 5px 12px;
          border-radius: 7px;
          border: 1px solid var(--border);
          background: transparent;
          color: var(--muted);
          font-family: var(--mono);
          font-size: 10px;
          letter-spacing: .04em;
          cursor: pointer;
          transition: all .15s;
          white-space: nowrap;
        }
        .fbtn:hover { border-color: rgba(201,168,76,.42); color: var(--gold2); background: rgba(201,168,76,.07) }
        .fbtn.on    { border-color: rgba(201,168,76,.55); color: var(--gold2); background: rgba(201,168,76,.13); box-shadow: 0 0 10px rgba(201,168,76,.12) }

        /* ── Detail panel ── */
        .detail {
          background: linear-gradient(180deg, rgba(17,28,42,0.70) 0%, rgba(13,21,32,0.75) 100%);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-top: 1px solid var(--border);
          padding: 1.6rem 1.5rem;
          animation: fadein .22s ease;
        }

        /* ── Live dot ── */
        .live-dot { animation: pulse-dot 2s ease infinite }

        /* ── WS live badge glow ── */
        .ws-live { animation: glow-badge 3s ease infinite }

        /* ── Skeleton loader ── */
        .skel {
          background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 75%);
          background-size: 400% 100%;
          animation: skel 2s linear infinite;
          border-radius: 6px;
        }

        /* ── Scrollbar ── */
        ::-webkit-scrollbar { width: 3px; height: 3px }
        ::-webkit-scrollbar-track { background: transparent }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.09); border-radius: 4px }
        ::-webkit-scrollbar-thumb:hover { background: rgba(201,168,76,.3) }

        /* ── Ticker ── */
        .ticker-wrap  { overflow: hidden; border-bottom: 1px solid var(--border); background: rgba(8,13,18,0.60); backdrop-filter: blur(10px) }
        .ticker-inner { display: inline-flex; animation: ticker 60s linear infinite; white-space: nowrap }

        /* ── Row stagger ── */
        .row-in { animation: fadein .38s ease both }
      `}</style>

      {/* LAYER 0: real photo bg div — pseudo-elements are invisible in React/Vite */}
      <div aria-hidden="true" style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: "url('https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?w=1920&q=80&auto=format&fit=crop')",
        backgroundSize: 'cover', backgroundPosition: 'center 30%', backgroundRepeat: 'no-repeat',
        filter: 'brightness(0.55) saturate(0.85) hue-rotate(-5deg)',
        animation: 'bg-drift 30s ease-in-out infinite alternate',
        willChange: 'transform',
      }} />
      {/* LAYER 1: gradient overlay */}
      <div aria-hidden="true" style={{
        position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'linear-gradient(to bottom, rgba(8,13,18,0.18) 0%, rgba(8,13,18,0.45) 50%, rgba(8,13,18,0.75) 100%), radial-gradient(ellipse 70% 50% at 8% 0%, rgba(201,168,76,0.22) 0%, transparent 60%), radial-gradient(ellipse 55% 40% at 92% 100%, rgba(55,138,221,0.10) 0%, transparent 55%)',
      }} />
      {/* LAYER 2: orbs, particles, rings */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {/* Floating colour orbs — slightly more visible */}
        {[
          { top: '8%',  left: '6%',  size: 420, color: 'rgba(201,168,76,0.10)',  blur: 90, anim: 'orb-float-1 22s ease-in-out infinite' },
          { top: '55%', left: '78%', size: 360, color: 'rgba(55,138,221,0.09)',  blur: 80, anim: 'orb-float-2 28s ease-in-out infinite' },
          { top: '30%', left: '48%', size: 300, color: 'rgba(29,158,117,0.07)', blur: 70, anim: 'orb-float-3 34s ease-in-out infinite' },
          { top: '80%', left: '22%', size: 260, color: 'rgba(201,168,76,0.07)',  blur: 60, anim: 'orb-float-4 26s ease-in-out infinite' },
        ].map((o, i) => (
          <div key={i} style={{ position: 'absolute', top: o.top, left: o.left, width: o.size, height: o.size, borderRadius: '50%', background: o.color, filter: `blur(${o.blur}px)`, animation: o.anim, willChange: 'transform' }} />
        ))}
        {/* Rising particles */}
        {[
          { left: '8%',  size: '3px', pc: 'rgba(201,168,76,0.75)',  dur: '12s', delay: '0s',   dx: '30px'  },
          { left: '18%', size: '2px', pc: 'rgba(255,255,255,0.3)',   dur: '18s', delay: '3s',   dx: '-20px' },
          { left: '28%', size: '4px', pc: 'rgba(29,158,117,0.65)',  dur: '15s', delay: '1.5s', dx: '15px'  },
          { left: '40%', size: '2px', pc: 'rgba(201,168,76,0.5)',   dur: '20s', delay: '5s',   dx: '-35px' },
          { left: '52%', size: '3px', pc: 'rgba(255,255,255,0.25)',  dur: '14s', delay: '2s',   dx: '25px'  },
          { left: '63%', size: '2px', pc: 'rgba(55,138,221,0.6)',   dur: '16s', delay: '7s',   dx: '-15px' },
          { left: '74%', size: '4px', pc: 'rgba(201,168,76,0.55)',  dur: '22s', delay: '0.5s', dx: '40px'  },
          { left: '84%', size: '2px', pc: 'rgba(29,158,117,0.5)',  dur: '13s', delay: '4s',   dx: '-25px' },
          { left: '92%', size: '3px', pc: 'rgba(255,255,255,0.3)',  dur: '17s', delay: '8s',   dx: '10px'  },
        ].map((p, i) => (
          <div key={i} className="particle" style={{ '--size': p.size, '--pc': p.pc, '--dur': p.dur, '--delay': p.delay, '--dx': p.dx, left: p.left }} />
        ))}
        {/* Pulse rings centred on page */}
        <div style={{ position: 'absolute', top: '42%', left: '50%', width: 500,  height: 500,  borderRadius: '50%', border: '1px solid rgba(201,168,76,0.18)', animation: 'ring-pulse 8s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', top: '42%', left: '50%', width: 700,  height: 700,  borderRadius: '50%', border: '1px solid rgba(201,168,76,0.10)', animation: 'ring-pulse2 11s ease-in-out infinite' }} />
        <div style={{ position: 'absolute', top: '42%', left: '50%', width: 920,  height: 920,  borderRadius: '50%', border: '1px solid rgba(201,168,76,0.05)', animation: 'ring-pulse 15s ease-in-out infinite reverse' }} />
      </div>

      <div style={{ minHeight: '100vh', background: 'transparent', color: 'var(--text)', fontFamily: 'var(--sans)', paddingTop: 60, position: 'relative', zIndex: 1 }}>

        {/* ────────── Top nav ────────── */}
        <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2rem', background: 'rgba(8,13,18,0.70)', backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg,#C9A84C,#E8C97A)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(201,168,76,.4)' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#080d12" strokeWidth="2.5">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span style={{ fontFamily: 'var(--sans)', fontWeight: 700, fontSize: 14, color: 'var(--text)', letterSpacing: '.03em' }}>SentinelAfrica</span>
            <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)', marginLeft: 6, paddingLeft: 10, borderLeft: '1px solid var(--border)' }}>Economic Intelligence</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* WS status */}
            <div className={wsState === 'live' ? 'ws-live' : ''} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 13px', borderRadius: 20, border: `1px solid ${wsCfg.c}30`, background: `${wsCfg.c}0e`, transition: 'all .3s' }}>
              <span className={wsState === 'live' ? 'live-dot' : ''} style={{ width: 7, height: 7, borderRadius: '50%', background: wsCfg.c, flexShrink: 0 }} />
              <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: wsCfg.c, letterSpacing: '.07em', textTransform: 'uppercase' }}>{wsCfg.l}</span>
            </div>
            <span className={flash ? 'flash' : ''} style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--muted)' }}>{tick}</span>
            {(wsState === 'error' || wsState === 'closed') && (
              <button className="fbtn on" onClick={connectWS}>Reconnect</button>
            )}
          </div>
        </header>

        {/* ────────── Live ticker ────────── */}
        {risks.length > 0 && (
          <div className="ticker-wrap" style={{ padding: '7px 0' }}>
            <div className="ticker-inner">
              {[...risks, ...risks].map((r, i) => (
                <span key={i} style={{ padding: '0 18px', fontSize: 9.5, fontFamily: 'var(--mono)', color: 'var(--muted)', display: 'inline-flex', alignItems: 'center', gap: 6, borderRight: '1px solid var(--border)' }}>
                  <span style={{ color: R[r.risk_level], fontWeight: 600 }}>{r.country_code}</span>
                  <span style={{ color: R[r.risk_level], fontSize: 10.5, fontWeight: 600 }}>{r.risk_score}</span>
                  <span style={{ fontSize: 7.5, color: R[r.risk_level], opacity: .65, textTransform: 'uppercase', letterSpacing: '.08em' }}>{r.risk_level}</span>
                  <span style={{ fontSize: 7, color: 'rgba(255,255,255,.18)' }}>▸</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ────────── Main content ────────── */}
        <main style={{ maxWidth: 1380, margin: '0 auto', padding: '1.8rem 1.8rem 5rem', position: 'relative', zIndex: 1 }}>

          {/* Page header */}
          <Fade>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: '2rem' }}>
              <div>
                <div style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'rgba(201,168,76,.6)', letterSpacing: '.16em', textTransform: 'uppercase', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 18, height: 1, background: 'rgba(201,168,76,.4)', display: 'inline-block' }} />
                  Supply Chain Intelligence — Africa
                  <span style={{ width: 18, height: 1, background: 'rgba(201,168,76,.4)', display: 'inline-block' }} />
                </div>
                <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(1.9rem,3vw,2.7rem)', fontWeight: 600, lineHeight: 1.1, color: 'var(--text)' }}>
                  Economic Risk &amp;<br />
                  <em className="gold-text">Resilience Dashboard</em>
                </h1>
              </div>
              <div style={{ fontSize: 11, color: 'var(--muted)', fontFamily: 'var(--mono)', textAlign: 'right', lineHeight: 2.1 }}>
                <div style={{ color: 'var(--gold2)', opacity: .8 }}>{risks.length} economies monitored</div>
                <div style={{ opacity: .5 }}>Refreshes every 60s via WebSocket</div>
              </div>
            </div>
          </Fade>

          {/* Error banner */}
          {error && (
            <div style={{ background: 'rgba(226,75,74,.07)', border: '1px solid rgba(226,75,74,.22)', borderRadius: 10, padding: '10px 14px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 10, animation: 'fadein .3s ease' }}>
              <span style={{ fontSize: 14 }}>⚠</span>
              <span style={{ fontSize: 11, color: '#E24B4A', fontFamily: 'var(--mono)', flex: 1 }}>{error}</span>
              <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 15 }}>✕</button>
            </div>
          )}

          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, padding: '8rem 0', flexDirection: 'column' }}>
              <svg className="spin" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" strokeOpacity=".1" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
              <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: 'var(--muted)' }}>Fetching live data from World Bank API…</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 320, marginTop: 12 }}>
                {[80, 60, 70, 50].map((w, i) => <div key={i} className="skel" style={{ height: 14, width: `${w}%` }} />)}
              </div>
            </div>
          ) : <>

            {/* ── KPI row ── */}
            <Fade>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))', gap: 10, marginBottom: '1.25rem' }}>
                {[
                  { label: 'Economies Tracked',  val: risks.length || '—', sub: 'active monitoring',        c: 'var(--gold2)', accent: '#C9A84C' },
                  { label: 'High Risk Alerts',    val: highRisk,            sub: 'need immediate attention',  c: '#E24B4A',      accent: '#E24B4A' },
                  { label: 'Avg Risk Score',      val: avgRisk,             sub: 'vulnerability index',       c: '#EF9F27',      accent: '#EF9F27', dec: 1 },
                  { label: 'Strong Economies',    val: strongCount,         sub: 'top resilience tier',       c: '#1D9E75',      accent: '#1D9E75' },
                  { label: 'Avg Resilience',      val: avgRes,              sub: 'shock absorption capacity', c: '#378ADD',      accent: '#378ADD', dec: 1 },
                ].map(k => (
                  <div key={k.label} className="kpi">
                    <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 82% 12%, ${k.accent}16, transparent 55%)`, pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at 18% 88%, ${k.accent}08, transparent 42%)`, pointerEvents: 'none' }} />
                    <div style={{ fontSize: 9.5, fontFamily: 'var(--mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.12em', marginBottom: 12 }}>{k.label}</div>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 'clamp(2.1rem,3vw,2.6rem)', fontWeight: 600, color: k.c, lineHeight: 1, marginBottom: 5, textShadow: `0 0 28px ${k.accent}30` }}>
                      <Num v={k.val} dec={k.dec || 0} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 300 }}>{k.sub}</div>
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, borderRadius: '0 0 16px 16px', background: `linear-gradient(90deg, transparent, ${k.accent}, transparent)`, opacity: .38 }} />
                  </div>
                ))}
              </div>
            </Fade>

            {/* ── Overview bars ── */}
            <Fade delay={0.06}>
              <div className="card" style={{ marginBottom: '1.25rem' }}>
                <SectionHead
                  title="Risk vs Resilience — All Economies"
                  sub={`${risks.length} countries · bars update on each WebSocket push`}
                  right={
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      {[['High risk', R.high], ['Medium', R.medium], ['Low', R.low], ['Strong', T.strong], ['Moderate', T.moderate], ['Developing', T.developing]].map(([l, c]) => (
                        <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>
                          <span style={{ width: 7, height: 7, borderRadius: 2, background: c, display: 'inline-block', boxShadow: `0 0 5px ${c}66` }} />{l}
                        </span>
                      ))}
                    </div>
                  }
                />

                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 44px 1fr 44px', gap: 8, padding: '6px 1.5rem', background: 'rgba(255,255,255,0.018)', borderBottom: '1px solid var(--border)' }}>
                  {['Economy', 'Risk score', '', 'Resilience', ''].map((h, i) => (
                    <div key={i} style={{ fontSize: 8.5, color: 'var(--muted)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.1em' }}>{h}</div>
                  ))}
                </div>

                <div style={{ maxHeight: 420, overflowY: 'auto', padding: '4px 0' }}>
                  {risks.map((r, i) => {
                    const res = resilience.find(x => x.country_code === r.country_code)
                    const rc  = R[r.risk_level]
                    const tc  = res ? T[res.tier] : 'rgba(255,255,255,0.15)'
                    return (
                      <div key={r.country_code} className="row-in" style={{ display: 'grid', gridTemplateColumns: '140px 1fr 44px 1fr 44px', gap: 8, padding: '8px 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.025)', alignItems: 'center', animationDelay: `${i * .014}s` }}>
                        <div>
                          <div style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--text)', lineHeight: 1.3 }}>{r.country}</div>
                          <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--mono)', marginTop: 1 }}>{r.country_code}</div>
                        </div>
                        <Bar pct={r.risk_score} color={rc} />
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: rc, textAlign: 'right' }}>{r.risk_score}</div>
                        <Bar pct={res?.composite_score ?? 0} color={tc} />
                        <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: tc }}>{res?.composite_score ?? '—'}</div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </Fade>

            {/* ── Intelligence Table ── */}
            <Fade delay={0.1}>
              <div className="card">
                {/* Toolbar */}
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 1 }}>Country Intelligence</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)' }}>{rows.length} of {risks.length} shown · click row to expand</div>
                  </div>

                  {/* Search */}
                  <div style={{ position: 'relative' }}>
                    <svg style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', opacity: .35 }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--gold2)" strokeWidth="2">
                      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                    <input className="srch" placeholder="Search country…" value={search} onChange={e => setSearch(e.target.value)} />
                    {search && <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 13 }}>✕</button>}
                  </div>

                  {/* Risk filter */}
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[['all', 'All'], ['high', 'High'], ['medium', 'Med'], ['low', 'Low']].map(([v, l]) => (
                      <button key={v} className={`fbtn${filter === v ? ' on' : ''}`} onClick={() => setFilter(v)}>{l}</button>
                    ))}
                  </div>

                  {/* Sort */}
                  <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
                    <span style={{ fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)', alignSelf: 'center' }}>Sort:</span>
                    {[['risk', 'Risk ↓'], ['resilience', 'Resilience ↓'], ['name', 'A–Z']].map(([v, l]) => (
                      <button key={v} className={`fbtn${sortBy === v ? ' on' : ''}`} onClick={() => setSortBy(v)}>{l}</button>
                    ))}
                  </div>
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', background: 'rgba(255,255,255,0.018)' }}>
                        {['#', 'Economy', 'Risk Score', 'Level', 'Top Vulnerability', 'Resilience', 'Pillars', 'Tier'].map(h => (
                          <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 8.5, color: 'var(--muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '.1em', fontFamily: 'var(--mono)', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.length === 0 && (
                        <tr><td colSpan={8} style={{ padding: '3rem', textAlign: 'center', color: 'var(--muted)', fontFamily: 'var(--mono)', fontSize: 12 }}>No results match your filters</td></tr>
                      )}
                      {rows.map((r, idx) => {
                        const res = r.res
                        const top = r.factors ? Object.entries(r.factors).sort((a, b) => b[1].score - a[1].score)[0] : null
                        const rc  = R[r.risk_level]
                        const tc  = res ? T[res.tier] : 'rgba(255,255,255,0.2)'
                        const act = activeRow === r.country_code

                        return (
                          <React.Fragment key={r.country_code}>
                            <tr
                              className={`tr${act ? ' act' : ''}`}
                              onClick={() => setActiveRow(act ? null : r.country_code)}
                              style={{ borderBottom: '1px solid rgba(255,255,255,0.025)', animationDelay: `${idx * .018}s` }}
                            >
                              <td style={{ padding: '11px 14px', fontSize: 10, color: 'var(--muted)', fontFamily: 'var(--mono)', width: 36 }}>{idx + 1}</td>

                              <td style={{ padding: '11px 14px', minWidth: 150 }}>
                                <div style={{ fontSize: 13, fontWeight: 500 }}>{r.country}</div>
                                <div style={{ fontSize: 9, color: 'var(--muted)', fontFamily: 'var(--mono)', marginTop: 1 }}>{r.country_code}</div>
                              </td>

                              <td style={{ padding: '11px 14px', minWidth: 130 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <Bar pct={r.risk_score} color={rc} />
                                  <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600, color: rc, minWidth: 34, textAlign: 'right' }}>{r.risk_score}</span>
                                </div>
                              </td>

                              <td style={{ padding: '11px 14px' }}>
                                <Pill label={r.risk_level} color={rc} sm />
                              </td>

                              <td style={{ padding: '11px 14px', fontSize: 11, color: 'rgba(240,237,230,0.42)', maxWidth: 180, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {top ? <><span style={{ textTransform: 'capitalize' }}>{top[0].replace(/_/g, ' ')}</span> <span style={{ fontFamily: 'var(--mono)', color: rc, fontSize: 10 }}>({top[1].score})</span></> : '—'}
                              </td>

                              <td style={{ padding: '11px 14px', minWidth: 130 }}>
                                {res ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600, color: tc, minWidth: 30 }}>{res.composite_score}</span>
                                    <Bar pct={res.composite_score} color={tc} />
                                  </div>
                                ) : <span style={{ color: 'var(--muted)', fontSize: 11 }}>—</span>}
                              </td>

                              <td style={{ padding: '11px 14px', minWidth: 120 }}>
                                {res?.pillars ? (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    {Object.entries(res.pillars).map(([k, v]) => (
                                      <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                        <span style={{ fontSize: 8, fontFamily: 'var(--mono)', color: 'var(--muted)', width: 26, textTransform: 'capitalize' }}>{k.slice(0, 4)}</span>
                                        <div style={{ flex: 1, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                          <div style={{ height: '100%', width: `${v}%`, background: tc, transition: 'width .85s ease', boxShadow: `0 0 4px ${tc}44` }} />
                                        </div>
                                        <span style={{ fontSize: 8, fontFamily: 'var(--mono)', color: 'var(--muted)', width: 18, textAlign: 'right' }}>{v}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : <span style={{ color: 'var(--muted)', fontSize: 10 }}>—</span>}
                              </td>

                              <td style={{ padding: '11px 14px' }}>
                                {res && <Pill label={TL[res.tier] ?? res.tier} color={tc} sm />}
                              </td>
                            </tr>

                            {/* ── Expanded detail ── */}
                            {act && (
                              <tr>
                                <td colSpan={8} style={{ padding: 0 }}>
                                  <div className="detail">
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '1.5rem' }}>

                                      {/* Risk factors */}
                                      <div>
                                        <div style={{ fontSize: 9.5, fontFamily: 'var(--mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 12 }}>Risk Factor Breakdown</div>
                                        {r.factors && Object.entries(r.factors).map(([k, v]) => (
                                          <div key={k} style={{ marginBottom: 10 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                                              <span style={{ fontSize: 11, color: 'rgba(240,237,230,0.52)', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</span>
                                              <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: R[r.risk_level] }}>{v.value}{v.unit ? ` ${v.unit}` : ''}</span>
                                            </div>
                                            <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                              <div style={{ height: '100%', width: `${v.score}%`, background: R[r.risk_level], transition: 'width .65s ease', boxShadow: `0 0 5px ${R[r.risk_level]}44` }} />
                                            </div>
                                          </div>
                                        ))}
                                      </div>

                                      {/* Resilience pillars */}
                                      {res?.pillars && (
                                        <div>
                                          <div style={{ fontSize: 9.5, fontFamily: 'var(--mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 12 }}>Resilience Pillars</div>
                                          {Object.entries(res.pillars).map(([k, v]) => (
                                            <div key={k} style={{ marginBottom: 11 }}>
                                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                                <span style={{ fontSize: 12, color: 'rgba(240,237,230,0.62)', textTransform: 'capitalize', fontWeight: 500 }}>{k}</span>
                                                <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color: T[res.tier], fontWeight: 600 }}>{v}</span>
                                              </div>
                                              <div style={{ height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                                                <div style={{ height: '100%', width: `${v}%`, background: T[res.tier], transition: 'width .75s ease', boxShadow: `0 0 7px ${T[res.tier]}55` }} />
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}

                                      {/* Assessment card */}
                                      <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: '1rem', border: '1px solid rgba(255,255,255,0.07)' }}>
                                        <div style={{ fontSize: 9.5, fontFamily: 'var(--mono)', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.1em', marginBottom: 12 }}>Assessment</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                          {[
                                            ['Country',   r.country],
                                            ['Risk level', <Pill label={r.risk_level} color={R[r.risk_level]} sm />],
                                            ['Risk score', <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: R[r.risk_level], fontSize: 12 }}>{r.risk_score} / 100</span>],
                                            ...(res ? [
                                              ['Resilience tier',  <Pill label={TL[res.tier] ?? res.tier} color={T[res.tier]} sm />],
                                              ['Resilience score', <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: T[res.tier], fontSize: 12 }}>{res.composite_score} / 100</span>],
                                            ] : []),
                                          ].map(([label, val]) => (
                                            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                              <span style={{ fontSize: 11, color: 'var(--muted)' }}>{label}</span>
                                              <span style={{ fontSize: 12 }}>{val}</span>
                                            </div>
                                          ))}
                                        </div>
                                        <div style={{ marginTop: 12, padding: '9px 11px', background: `${R[r.risk_level]}0d`, border: `1px solid ${R[r.risk_level]}1e`, borderRadius: 8, fontSize: 11, color: 'rgba(240,237,230,0.42)', lineHeight: 1.65 }}>
                                          {r.risk_level === 'high'
                                            ? `⚠ ${r.country} shows elevated vulnerability. Immediate monitoring recommended.`
                                            : r.risk_level === 'medium'
                                            ? `▸ ${r.country} has moderate exposure. Key factors should be tracked this quarter.`
                                            : `✓ ${r.country} maintains a low risk profile with stable supply chain indicators.`}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </Fade>

            {/* Footer */}
            <div style={{ marginTop: '1.25rem', padding: '1rem 1.25rem', background: 'rgba(13,21,32,0.50)', backdropFilter: 'blur(16px)', border: '1px solid var(--border)', borderRadius: 12, display: 'flex', gap: 10 }}>
              <span style={{ fontSize: 13, flexShrink: 0 }}>ℹ</span>
              <span style={{ fontSize: 11, color: 'var(--muted)', lineHeight: 1.8 }}>
                Scores computed from World Bank API: GDP growth · Inflation · Trade openness · Import dependency · Commodity exposure · Export diversification · FDI inflows · Institutional quality · Social development index.
                SentinelAfrica proprietary risk model · stream refreshes every 60 seconds.
              </span>
            </div>

          </>}
        </main>
      </div>
    </>
  )
}