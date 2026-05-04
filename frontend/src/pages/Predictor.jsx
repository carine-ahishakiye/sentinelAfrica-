import { useEffect, useState, useRef, useCallback } from 'react'
import { fetchSupplyChainRisks, fetchCountryRisk } from '../api/client'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from 'recharts'

/* ─── Risk palette ─── */
const RC = { high: '#FF6B6B', medium: '#FFB347', low: '#00E5A0' }
const RC_BG = { high: 'rgba(255,107,107,0.08)', medium: 'rgba(255,179,71,0.08)', low: 'rgba(0,229,160,0.08)' }

/* ─── Hero video (looping aerial Africa footage) ─── */
const HERO_VIDEO = 'https://videos.pexels.com/video-files/3571264/3571264-uhd_2560_1440_30fps.mp4'
const HERO_POSTER = 'https://images.pexels.com/photos/4429279/pexels-photo-4429279.jpeg?auto=compress&cs=tinysrgb&w=1400&q=80'

/* ─── Country narratives ─── */
const STORIES = {
  DZ:"Algeria's economy is dominated by hydrocarbons, making it highly vulnerable to oil price volatility. Diversification efforts remain slow, constraining resilience.",
  AO:"Angola relies heavily on oil exports, with debt restructuring and diversification critical for stability. Fiscal space is limited by external shocks.",
  BJ:"Benin's cotton exports drive growth, but reliance on agriculture and informal trade leaves it exposed to climate and market shifts.",
  BW:"Botswana's diamond wealth underpins stability. Yet overdependence on mining challenges long-term diversification.",
  BF:"Burkina Faso faces security risks that undermine investment. Agriculture dominates, but productivity remains fragile.",
  BI:"Burundi's subsistence agriculture and political instability constrain resilience. External aid remains a critical lifeline.",
  CV:"Cabo Verde's tourism-driven economy is highly exposed to global travel shocks. Limited resources heighten vulnerability.",
  CM:"Cameroon's diverse economy spans oil and agriculture. Regional instability and governance challenges weigh on resilience.",
  CF:"Central African Republic's fragile institutions and conflict risks overshadow economic potential. Aid dependency is high.",
  TD:"Chad's oil revenues dominate fiscal space. Security challenges and weak diversification amplify vulnerability.",
  KM:"Comoros depends on remittances and agriculture. Structural weaknesses and climate risks limit resilience.",
  CD:"DR Congo's vast mineral wealth drives exports, but governance challenges and conflict risks undermine stability.",
  CG:"Congo's oil dependence creates fiscal vulnerability. Diversification remains limited amid governance constraints.",
  CI:"Côte d'Ivoire's cocoa exports anchor growth. Commodity dependence and debt risks expose the economy to external shocks.",
  DJ:"Djibouti's strategic port drives growth, but reliance on external financing and regional instability pose risks.",
  EG:"Egypt's economy faces high inflation and debt pressures. Structural reforms aim to stabilize growth but create short-term pain.",
  GQ:"Equatorial Guinea's oil wealth masks inequality. Fiscal dependence on hydrocarbons leaves it exposed to price swings.",
  ER:"Eritrea's closed economy and political isolation constrain resilience. Agriculture and remittances remain critical lifelines.",
  SZ:"Eswatini's small economy depends on South Africa. Fiscal pressures and limited diversification heighten vulnerability.",
  ET:"Ethiopia's industrial parks are a bold bet, but inflation and political instability erode resilience.",
  GA:"Gabon's oil dependence dominates fiscal space. Efforts to diversify into services remain limited.",
  GM:"Gambia's tourism and agriculture drive growth. External shocks and climate risks constrain resilience.",
  GH:"Ghana's debt restructuring crisis revealed the cost of commodity dependence. Gold and cocoa dominate export earnings.",
  GN:"Guinea's bauxite wealth drives exports. Governance challenges and commodity dependence heighten vulnerability.",
  GW:"Guinea-Bissau's cashew exports dominate. Political instability and weak institutions constrain resilience.",
  KE:"Kenya's diversified economy is anchored by agriculture and services, yet inflation and commodity exposure pose risks.",
  LS:"Lesotho's textile exports and remittances drive growth. Dependence on South Africa creates external vulnerability.",
  LR:"Liberia's post-war recovery relies on aid and commodity exports. Institutional fragility remains a challenge.",
  LY:"Libya's oil wealth is undermined by conflict. Political instability constrains economic resilience.",
  MG:"Madagascar's vanilla exports dominate. Climate risks and governance challenges undermine resilience.",
  MW:"Malawi's agriculture-driven economy is highly climate-sensitive. Poverty and debt pressures constrain resilience.",
  ML:"Mali's gold exports anchor growth. Security challenges and governance risks undermine resilience.",
  MR:"Mauritania's iron ore and fisheries dominate exports. Commodity dependence and climate risks constrain resilience.",
  MU:"Mauritius' diversified economy relies on tourism and finance. External shocks expose vulnerabilities despite strong institutions.",
  MA:"Morocco's diversified, trade-open economy is a blueprint for resilience. Structural reforms underpin stability.",
  MZ:"Mozambique's gas projects promise transformation. Debt burdens and governance challenges remain risks.",
  NA:"Namibia's mining exports drive growth. Inequality and climate risks constrain resilience.",
  NE:"Niger's uranium exports dominate. Security challenges and climate risks undermine resilience.",
  NG:"Nigeria's oil dependence continues to dominate fiscal space. Efforts to diversify face challenges from debt and governance constraints.",
  RW:"Rwanda has achieved rapid growth through services and ICT, but remains vulnerable to external shocks due to high import dependency.",
  ST:"São Tomé and Príncipe's small economy relies on tourism and cocoa. External shocks and limited diversification heighten risks.",
  SN:"Senegal's offshore gas revenues arrive just in time. Strong institutions position it as West Africa's next success story.",
  SC:"Seychelles' tourism-driven economy is highly exposed to global travel shocks. Climate risks add vulnerability.",
  SL:"Sierra Leone's mineral exports dominate. Governance challenges and debt pressures constrain resilience.",
  SO:"Somalia's fragile institutions and conflict risks overshadow economic potential. Remittances remain critical.",
  ZA:"South Africa's sophisticated economy faces structural challenges: unemployment, energy crisis, and institutional fragility.",
  SS:"South Sudan's oil dependence and conflict risks dominate. Governance challenges undermine resilience.",
  SD:"Sudan's political instability and debt burdens constrain resilience. Agriculture remains critical.",
  TZ:"Tanzania's steady growth is built on agriculture and tourism. Diversification progress has been made, but institutional scores remain a ceiling.",
  TG:"Togo's phosphate exports drive growth. Governance challenges and debt pressures constrain resilience.",
  TN:"Tunisia's diversified economy faces debt and inflation pressures. Structural reforms aim to stabilize growth.",
  UG:"Uganda's oil discovery promised transformation. With production delayed, import dependency rises and fiscal buffers remain thin.",
  ZM:"Zambia's copper exports dominate. Debt restructuring and governance challenges constrain resilience.",
  ZW:"Zimbabwe's economy faces debt, inflation, and governance challenges. Agriculture and mining remain critical."
}

const BEATS = [
  { icon: '◈', label: 'Intelligence Layer', value: '54', unit: 'Nations' },
  { icon: '⚡', label: 'Signal Speed',       value: '72h', unit: 'Ahead' },
  { icon: '◎', label: 'Daily Signals',       value: '847+', unit: 'Signals' },
  { icon: '▣', label: 'Accuracy',            value: '94%', unit: 'Validated' },
]

const VISIBLE_LIMIT = 8

export default function Predictor() {
  const [countries,     setCountries]     = useState([])
  const [selected,      setSelected]      = useState(null)
  const [detail,        setDetail]        = useState(null)
  const [loading,       setLoading]       = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [search,        setSearch]        = useState('')
  const [showAll,       setShowAll]       = useState(false)
  const [videoLoaded,   setVideoLoaded]   = useState(false)
  const videoRef = useRef(null)
  const abortRef = useRef(null)

  useEffect(() => {
    fetchSupplyChainRisks()
      .then(r => { setCountries(r.data.data ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  useEffect(() => { setShowAll(false) }, [search])

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = 0.55
  }, [videoLoaded])

  const select = useCallback((code) => {
    if (abortRef.current) abortRef.current()
    setSelected(code)
    setDetailLoading(true)
    let cancelled = false
    abortRef.current = () => { cancelled = true }
    fetchCountryRisk(code)
      .then(r => { if (!cancelled) { setDetail(r.data); setDetailLoading(false) } })
      .catch(() => { if (!cancelled) setDetailLoading(false) })
  }, [])

  const radarData = detail
    ? Object.entries(detail.factors).map(([k, v]) => ({
        factor: k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
        score: v.score, fullMark: 100,
      }))
    : []

  const riskColor = detail ? RC[detail.risk_level] : '#FFD700'

  const filteredCountries = countries.filter(c =>
    c.country.toLowerCase().includes(search.toLowerCase())
  )
  const visibleCountries = showAll ? filteredCountries : filteredCountries.slice(0, VISIBLE_LIMIT)
  const hasMore = filteredCountries.length > VISIBLE_LIMIT

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,600&family=Outfit:wght@200;300;400;500;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap');

        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }

        @keyframes fadeUp    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
        @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:.25} }
        @keyframes spin      { to{transform:rotate(360deg)} }
        @keyframes shimmer   { 0%{background-position:200% center} 100%{background-position:-200% center} }
        @keyframes scanline  { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
        @keyframes borderGlow{ 0%,100%{border-color:rgba(255,215,0,.18)} 50%{border-color:rgba(255,215,0,.4)} }

        .pred-live { animation: pulse 2s ease infinite; }
        .pred-spin { animation: spin 1.3s linear infinite; }

        .gold-shimmer {
          background: linear-gradient(90deg,#FFD700,#FFA500,#FFD700,#FF8C00,#FFD700);
          background-size: 300% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 5s linear infinite;
        }

        /* ── Video hero header ── */
        .pred-hero {
          position: relative;
          overflow: hidden;
          padding-top: 72px;
        }

        /* ── Glass panels ── */
        .glass {
          background: rgba(5,10,20,.72);
          border: 1px solid rgba(255,215,0,.14);
          border-radius: 16px;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
        }
        .glass:hover { animation: borderGlow 2s ease infinite; }

        /* ── Country rows ── */
        .pred-row {
          padding: 12px 1.25rem;
          cursor: pointer;
          border-bottom: 1px solid rgba(255,255,255,.03);
          border-left: 3px solid transparent;
          display: flex; align-items: center; justify-content: space-between;
          transition: background .15s, border-color .15s;
        }
        .pred-row:hover { background: rgba(255,215,0,.05); }
        .pred-row.active {
          border-left-color: #FFD700;
          background: rgba(255,215,0,.09) !important;
        }

        /* ── Beat cards ── */
        .beat-card {
          flex: 1; min-width: 120px;
          padding: 1.1rem 1.25rem;
          border: 1px solid rgba(255,215,0,.13);
          border-radius: 14px;
          background: rgba(5,10,20,.65);
          backdrop-filter: blur(14px);
          transition: border-color .25s, transform .25s, box-shadow .25s;
          cursor: default;
        }
        .beat-card:hover {
          border-color: rgba(255,215,0,.38);
          transform: translateY(-4px);
          box-shadow: 0 16px 48px rgba(0,0,0,.5), 0 0 30px rgba(255,215,0,.08);
        }

        /* ── Bar fill ── */
        .bar-fill { height:100%; border-radius:3px; transition: width .5s cubic-bezier(.4,0,.2,1); }

        /* ── Search ── */
        .pred-search {
          width: 100%; padding: 9px 12px;
          border-radius: 10px;
          border: 1px solid rgba(255,215,0,.2);
          background: rgba(5,10,20,.7);
          color: #FFF8E7;
          font-size: 12px;
          font-family: 'Space Mono', monospace;
          outline: none;
          transition: border-color .2s, box-shadow .2s;
        }
        .pred-search::placeholder { color: rgba(255,240,200,.22); }
        .pred-search:focus {
          border-color: rgba(255,215,0,.45);
          box-shadow: 0 0 0 3px rgba(255,215,0,.07);
        }

        /* ── Show more ── */
        .pred-more {
          width:100%; padding:11px 1.25rem;
          background:none; border:none;
          border-top:1px solid rgba(255,215,0,.07);
          color:rgba(255,215,0,.45);
          font-size:11px; font-family:'Space Mono',monospace;
          letter-spacing:.06em; cursor:pointer;
          display:flex; align-items:center; justify-content:center; gap:7px;
          transition: color .18s, background .18s;
        }
        .pred-more:hover { color:#FFD700; background:rgba(255,215,0,.04); }
        .pred-more-arrow { display:inline-block; transition:transform .25s; }
        .pred-more.expanded .pred-more-arrow { transform:rotate(180deg); }

        /* ── Detail enter animation ── */
        .detail-enter { animation: fadeUp .35s cubic-bezier(.25,.46,.45,.94) both; }

        /* ── Risk badge ── */
        .risk-badge {
          font-size:9px; font-weight:700; padding:3px 10px; border-radius:99px;
          text-transform:uppercase; font-family:'Space Mono',monospace;
          letter-spacing:.07em; flex-shrink:0;
        }

        /* Scrollbar */
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,215,0,.2); border-radius:3px; }
        ::-webkit-scrollbar-thumb:hover { background:rgba(255,215,0,.4); }

        /* ── Scanline overlay ── */
        .scanline {
          position: absolute; inset: 0; pointer-events: none; z-index: 1;
          background: repeating-linear-gradient(transparent, transparent 3px, rgba(0,0,0,.03) 3px, rgba(0,0,0,.03) 4px);
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#04080F', fontFamily: '"Outfit", sans-serif', color: '#FFF8E7', position: 'relative', paddingTop: 72 }}>

        {/* ═══════════════════════════════════════
            FIXED VIDEO BACKGROUND
        ═══════════════════════════════════════ */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 0 }}>
          {/* Poster fallback */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${HERO_POSTER})`,
            backgroundSize: 'cover', backgroundPosition: 'center 30%',
            filter: 'brightness(0.45) saturate(0.6)',
            opacity: videoLoaded ? 0 : 1,
            transition: 'opacity 1.5s ease',
          }} />

          {/* Video — clearly visible */}
          <video
            ref={videoRef}
            autoPlay muted loop playsInline preload="metadata"
            poster={HERO_POSTER}
            onCanPlay={() => setVideoLoaded(true)}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%', objectFit: 'cover',
              filter: 'brightness(0.52) saturate(0.75) contrast(1.05)',
              opacity: videoLoaded ? 1 : 0,
              transition: 'opacity 1.5s ease',
            }}
          >
            <source src={HERO_VIDEO} type="video/mp4" />
          </video>

          {/* Dark vignette only at very top and bottom — keeps video centre open */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(4,8,15,.85) 0%, rgba(4,8,15,.1) 15%, rgba(4,8,15,.1) 75%, rgba(4,8,15,.96) 100%)' }} />

          {/* Subtle gold tint in centre */}
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 50% at 50% 40%, rgba(255,180,0,.06), transparent)' }} />

          {/* Scanlines */}
          <div className="scanline" />
        </div>

        {/* ═══════════════════════════════════════
            HEADER BAND
        ═══════════════════════════════════════ */}
        <div style={{ position: 'relative', zIndex: 10, borderBottom: '1px solid rgba(255,215,0,.12)', padding: '2rem 2.5rem 1.75rem', background: 'rgba(4,8,15,.55)', backdropFilter: 'blur(24px)' }}>
          <div style={{ maxWidth: 1440, margin: '0 auto' }}>

            {/* Live pill */}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 16px', borderRadius: 99, border: '1px solid rgba(255,215,0,.22)', background: 'rgba(255,215,0,.07)', marginBottom: '1.25rem', animation: 'fadeIn .6s ease .1s both' }}>
              <span className="pred-live" style={{ width: 7, height: 7, borderRadius: '50%', background: '#00E5A0', boxShadow: '0 0 10px #00E5A0', display:'block', flexShrink:0 }} />
              <span style={{ fontSize: 10, letterSpacing: '.22em', color: '#FFD700', fontFamily: '"Space Mono", monospace', textTransform: 'uppercase' }}>Live · Deep Analysis Engine · 54 Nations</span>
            </div>

            {/* Title row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '2rem', alignItems: 'flex-end', marginBottom: '1.75rem' }}>
              <div style={{ animation: 'fadeUp .65s cubic-bezier(.25,.46,.45,.94) .15s both' }}>
                <h1 style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: 'clamp(1.9rem,3.5vw,3rem)', fontWeight: 500, lineHeight: 1.1, marginBottom: '.6rem' }}>
                  Supply Chain{' '}
                  <em className="gold-shimmer" style={{ fontStyle: 'italic', fontWeight: 400 }}>Risk Predictor</em>
                </h1>
                <p style={{ color: 'rgba(255,240,200,.45)', fontSize: '.9rem', lineHeight: 1.8, maxWidth: 560, fontWeight: 300 }}>
                  Every economy in Africa carries a hidden risk signature. Select any nation to reveal its vulnerability profile — built from trade data, institutional scores, commodity exposure, and macroeconomic signals, updated weekly.
                </p>
              </div>

              {/* Score badge — shown when a country is selected */}
              {detail && !detailLoading && (
                <div className="detail-enter glass" style={{
                  textAlign: 'center', padding: '1.25rem 1.75rem',
                  background: RC_BG[detail.risk_level],
                  border: `1px solid ${riskColor}30`,
                  minWidth: 120,
                }}>
                  <div style={{
                    fontFamily: '"Cormorant Garamond", serif',
                    fontSize: '3.2rem', fontWeight: 700, lineHeight: 1,
                    color: riskColor,
                    textShadow: `0 0 30px ${riskColor}60`,
                  }}>{detail.risk_score}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,240,200,.35)', marginTop: 4, fontFamily: '"Space Mono", monospace', letterSpacing: '.08em' }}>risk score</div>
                  <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '.12em', color: riskColor, marginTop: 6, fontFamily: '"Space Mono", monospace', fontWeight: 700 }}>{detail.risk_level}</div>
                </div>
              )}
            </div>

            {/* Beat cards */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', animation: 'fadeUp .65s cubic-bezier(.25,.46,.45,.94) .3s both' }}>
              {BEATS.map((b, i) => (
                <div key={i} className="beat-card">
                  <div style={{ fontSize: 9, color: 'rgba(255,240,200,.28)', fontFamily: '"Space Mono", monospace', letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 8 }}>
                    <span style={{ color: '#FFD700', marginRight: 5 }}>{b.icon}</span>{b.label}
                  </div>
                  <div style={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.9rem', color: '#FFD700', fontWeight: 600, lineHeight: 1, marginBottom: 3 }}>{b.value}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,240,200,.3)', fontFamily: '"Space Mono", monospace' }}>{b.unit}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════
            MAIN GRID
        ═══════════════════════════════════════ */}
        <div style={{ position: 'relative', zIndex: 10, maxWidth: 1440, margin: '0 auto', padding: '1.5rem 2.5rem 3rem', display: 'grid', gridTemplateColumns: '300px 1fr', gap: 16 }}>

          {/* ── Country sidebar ── */}
          <div className="glass" style={{ height: 'fit-content', overflow: 'hidden' }}>

            {/* Search */}
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(255,215,0,.09)' }}>
              <input
                className="pred-search"
                type="text"
                placeholder="Search country…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Count / spinner */}
            <div style={{ padding: '8px 1.25rem', borderBottom: '1px solid rgba(255,215,0,.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 10, color: 'rgba(255,240,200,.25)', textTransform: 'uppercase', letterSpacing: '.14em', fontFamily: '"Space Mono", monospace' }}>
                {loading ? 'Loading…' : `${filteredCountries.length} economies`}
              </span>
              {loading && (
                <svg className="pred-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="2">
                  <circle cx="12" cy="12" r="9" strokeOpacity=".2"/>
                  <path d="M12 3a9 9 0 0 1 9 9"/>
                </svg>
              )}
            </div>

            {/* Empty states */}
            {!loading && countries.length === 0 && (
              <div style={{ padding:'2.5rem 1.5rem', textAlign:'center', color:'rgba(255,240,200,.2)', fontSize:13, fontFamily:'"Cormorant Garamond", serif', fontStyle:'italic', lineHeight:1.7 }}>
                No data received from API.<br/>
                <span style={{ fontSize:11, fontFamily:'"Space Mono", monospace', fontStyle:'normal', opacity:.6 }}>Check fetchSupplyChainRisks()</span>
              </div>
            )}
            {!loading && countries.length > 0 && filteredCountries.length === 0 && (
              <div style={{ padding:'1.75rem', textAlign:'center', color:'rgba(255,240,200,.2)', fontSize:12, fontFamily:'"Space Mono", monospace' }}>
                No match for "{search}"
              </div>
            )}

            {/* Rows */}
            {visibleCountries.map(c => (
              <div
                key={c.country_code}
                className={`pred-row${selected === c.country_code ? ' active' : ''}`}
                onClick={() => select(c.country_code)}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: selected === c.country_code ? '#FFD700' : '#FFF8E7', lineHeight: 1.3 }}>{c.country}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,240,200,.24)', marginTop: 2, fontFamily: '"Space Mono", monospace' }}>Score: {c.risk_score}</div>
                </div>
                <span className="risk-badge" style={{ background: RC_BG[c.risk_level], color: RC[c.risk_level], border: `1px solid ${RC[c.risk_level]}35` }}>
                  {c.risk_level}
                </span>
              </div>
            ))}

            {hasMore && (
              <button className={`pred-more${showAll ? ' expanded' : ''}`} onClick={() => setShowAll(v => !v)}>
                {showAll ? 'Show less' : `+${filteredCountries.length - VISIBLE_LIMIT} more countries`}
                <span className="pred-more-arrow">↓</span>
              </button>
            )}
          </div>

          {/* ── Detail panel ── */}
          <div>

            {/* Empty state */}
            {!selected && (
              <div className="glass" style={{ minHeight: 480, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
                <div style={{ fontSize:'4rem', opacity:.08, lineHeight:1, fontFamily:'"Cormorant Garamond", serif' }}>◈</div>
                <div style={{ fontFamily:'"Cormorant Garamond", serif', fontSize:17, fontStyle:'italic', color:'rgba(255,240,200,.25)', textAlign:'center', maxWidth:300, lineHeight:1.7 }}>
                  Select an economy from the list to reveal its full risk story
                </div>
                <div style={{ display:'flex', gap:8, marginTop:4 }}>
                  {['HIGH','MEDIUM','LOW'].map(l => (
                    <span key={l} className="risk-badge" style={{ background:RC_BG[l.toLowerCase()], color:RC[l.toLowerCase()], border:`1px solid ${RC[l.toLowerCase()]}30` }}>{l}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Loading */}
            {detailLoading && selected && (
              <div className="glass" style={{ minHeight: 480, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:14 }}>
                <svg className="pred-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FFD700" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" strokeOpacity=".15"/>
                  <path d="M12 2a10 10 0 0 1 10 10"/>
                </svg>
                <div style={{ fontFamily:'"Cormorant Garamond", serif', fontSize:'1.15rem', fontStyle:'italic', color:'rgba(255,215,0,.5)' }}>
                  Analyzing {selected}…
                </div>
              </div>
            )}

            {/* Detail content */}
            {detail && !detailLoading && (
              <div className="detail-enter" style={{ display:'flex', flexDirection:'column', gap:14 }}>

                {/* ── Story card ── */}
                <div className="glass" style={{ padding:'2rem 2.25rem', position:'relative', overflow:'hidden' }}>
                  {/* Ambient glow matching risk level */}
                  <div style={{ position:'absolute', top:0, right:0, width:280, height:280, background:`radial-gradient(circle, ${riskColor}14, transparent 70%)`, pointerEvents:'none' }} />
                  <div style={{ position:'absolute', bottom:0, left:0, width:200, height:200, background:`radial-gradient(circle, rgba(255,215,0,.05), transparent 70%)`, pointerEvents:'none' }} />

                  <div style={{ position:'relative' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:'1rem' }}>
                      <div style={{ fontSize:9, color:'rgba(255,215,0,.5)', letterSpacing:'.25em', textTransform:'uppercase', fontFamily:'"Space Mono", monospace' }}>Risk Profile</div>
                      <div style={{ height:1, flex:1, background:'linear-gradient(to right,rgba(255,215,0,.2),transparent)' }} />
                      <div style={{ fontSize:9, color:'rgba(255,240,200,.2)', fontFamily:'"Space Mono", monospace' }}>{detail.country_code}</div>
                    </div>

                    <h2 style={{ fontFamily:'"Cormorant Garamond", serif', fontSize:'clamp(1.7rem,3vw,2.4rem)', fontWeight:500, marginBottom:'.85rem', lineHeight:1.1 }}>{detail.country}</h2>

                    <p style={{ fontSize:'.925rem', color:'rgba(255,240,200,.5)', lineHeight:1.85, maxWidth:640, fontWeight:300, marginBottom:'1.75rem' }}>
                      {STORIES[detail.country_code] || 'Economic intelligence data loaded successfully.'}
                    </p>

                    {/* Top 3 factor pills */}
                    <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                      {Object.entries(detail.factors).slice(0,3).map(([k,v]) => {
                        const c = v.score >= 65 ? RC.high : v.score >= 40 ? RC.medium : RC.low
                        return (
                          <div key={k} style={{ padding:'.7rem 1.1rem', background:'rgba(255,255,255,.04)', border:`1px solid rgba(255,215,0,.1)`, borderRadius:10, minWidth:110 }}>
                            <div style={{ fontSize:9, color:'rgba(255,240,200,.28)', textTransform:'capitalize', fontFamily:'"Space Mono", monospace', letterSpacing:'.08em', marginBottom:5 }}>{k.replace(/_/g,' ')}</div>
                            <div style={{ fontFamily:'"Cormorant Garamond", serif', fontSize:'1.4rem', color:c, fontWeight:600, lineHeight:1, textShadow:`0 0 20px ${c}50` }}>
                              {v.value}{v.unit}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* ── Charts row ── */}
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>

                  {/* Radar */}
                  <div className="glass" style={{ padding:'1.6rem' }}>
                    <div style={{ fontSize:10, color:'rgba(255,240,200,.35)', marginBottom:'1.1rem', fontFamily:'"Space Mono", monospace', textTransform:'uppercase', letterSpacing:'.14em' }}>
                      Vulnerability Radar
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                      <RadarChart data={radarData} margin={{ top:5, right:24, bottom:5, left:24 }}>
                        <PolarGrid stroke="rgba(255,215,0,.1)" />
                        <PolarAngleAxis
                          dataKey="factor"
                          tick={{ fontSize:9, fill:'rgba(255,240,200,.38)', fontFamily:'"Space Mono", monospace' }}
                        />
                        <Radar
                          dataKey="score"
                          stroke={riskColor}
                          fill={riskColor}
                          fillOpacity={0.12}
                          strokeWidth={1.5}
                          dot={{ r:2.5, fill:riskColor, strokeWidth:0 }}
                        />
                        <Tooltip
                          contentStyle={{ background:'rgba(4,8,15,.95)', border:`1px solid ${riskColor}30`, borderRadius:10, fontSize:11, fontFamily:'"Space Mono", monospace' }}
                          itemStyle={{ color:'#FFD700' }}
                          labelStyle={{ color:'rgba(255,240,200,.45)', fontSize:10 }}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Factor bars */}
                  <div className="glass" style={{ padding:'1.6rem' }}>
                    <div style={{ fontSize:10, color:'rgba(255,240,200,.35)', marginBottom:'1.25rem', fontFamily:'"Space Mono", monospace', textTransform:'uppercase', letterSpacing:'.14em' }}>
                      Factor Breakdown
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                      {Object.entries(detail.factors)
                        .sort((a,b) => b[1].score - a[1].score)
                        .map(([k,v]) => {
                          const c = v.score >= 65 ? RC.high : v.score >= 40 ? RC.medium : RC.low
                          return (
                            <div key={k}>
                              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6 }}>
                                <span style={{ fontSize:12, color:'rgba(255,240,200,.6)', textTransform:'capitalize', fontWeight:300 }}>{k.replace(/_/g,' ')}</span>
                                <span style={{ fontSize:12, fontFamily:'"Space Mono", monospace', color:c, fontWeight:700, textShadow:`0 0 12px ${c}60` }}>{v.score}</span>
                              </div>
                              <div style={{ height:5, background:'rgba(255,255,255,.06)', borderRadius:3, overflow:'hidden' }}>
                                <div className="bar-fill" style={{ width:`${v.score}%`, background:`linear-gradient(90deg, ${c}aa, ${c})`, boxShadow:`0 0 8px ${c}50` }} />
                              </div>
                              <div style={{ fontSize:10, color:'rgba(255,240,200,.2)', marginTop:4, fontFamily:'"Space Mono", monospace' }}>
                                {v.value}{v.unit} · weight {(v.weight * 100).toFixed(0)}%
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}