import { useState, useMemo } from 'react'
import { fetchRecommendations } from '../api/client'

/* ─── All 54 African nations ─── */
const COUNTRIES = [
  { code: 'DZ', name: 'Algeria',              region: 'North Africa',    dependency: 'Oil & gas (95% of exports)' },
  { code: 'EG', name: 'Egypt',                region: 'North Africa',    dependency: 'Tourism & Suez revenue' },
  { code: 'LY', name: 'Libya',                region: 'North Africa',    dependency: 'Crude oil (98%)' },
  { code: 'MA', name: 'Morocco',              region: 'North Africa',    dependency: 'Phosphates & tourism' },
  { code: 'SD', name: 'Sudan',                region: 'North Africa',    dependency: 'Gold & agriculture' },
  { code: 'TN', name: 'Tunisia',              region: 'North Africa',    dependency: 'Phosphates & tourism' },
  { code: 'BJ', name: 'Benin',                region: 'West Africa',     dependency: 'Cotton & re-exports' },
  { code: 'BF', name: 'Burkina Faso',         region: 'West Africa',     dependency: 'Gold & cotton' },
  { code: 'CV', name: 'Cabo Verde',           region: 'West Africa',     dependency: 'Tourism (85% of GDP)' },
  { code: 'CI', name: "Côte d'Ivoire",        region: 'West Africa',     dependency: 'Cocoa (40% of exports)' },
  { code: 'GM', name: 'Gambia',               region: 'West Africa',     dependency: 'Tourism & groundnuts' },
  { code: 'GH', name: 'Ghana',                region: 'West Africa',     dependency: 'Gold & cocoa' },
  { code: 'GN', name: 'Guinea',               region: 'West Africa',     dependency: 'Bauxite (80% of exports)' },
  { code: 'GW', name: 'Guinea-Bissau',        region: 'West Africa',     dependency: 'Cashew nuts (90%)' },
  { code: 'LR', name: 'Liberia',              region: 'West Africa',     dependency: 'Iron ore & rubber' },
  { code: 'ML', name: 'Mali',                 region: 'West Africa',     dependency: 'Gold (70% of exports)' },
  { code: 'MR', name: 'Mauritania',           region: 'West Africa',     dependency: 'Iron ore & fisheries' },
  { code: 'NE', name: 'Niger',                region: 'West Africa',     dependency: 'Uranium & oil' },
  { code: 'NG', name: 'Nigeria',              region: 'West Africa',     dependency: 'Crude oil (81%)' },
  { code: 'SN', name: 'Senegal',              region: 'West Africa',     dependency: 'Fisheries & remittances' },
  { code: 'SL', name: 'Sierra Leone',         region: 'West Africa',     dependency: 'Iron ore & diamonds' },
  { code: 'TG', name: 'Togo',                 region: 'West Africa',     dependency: 'Phosphates & cotton' },
  { code: 'BI', name: 'Burundi',              region: 'East Africa',     dependency: 'Coffee & tea' },
  { code: 'KM', name: 'Comoros',              region: 'East Africa',     dependency: 'Vanilla & cloves' },
  { code: 'DJ', name: 'Djibouti',             region: 'East Africa',     dependency: 'Port services (80%)' },
  { code: 'ER', name: 'Eritrea',              region: 'East Africa',     dependency: 'Mining & subsistence' },
  { code: 'ET', name: 'Ethiopia',             region: 'East Africa',     dependency: 'Coffee & aid flows' },
  { code: 'KE', name: 'Kenya',                region: 'East Africa',     dependency: 'Tourism & tea' },
  { code: 'MG', name: 'Madagascar',           region: 'East Africa',     dependency: 'Vanilla & mining' },
  { code: 'MW', name: 'Malawi',               region: 'East Africa',     dependency: 'Tobacco (50% of exports)' },
  { code: 'MU', name: 'Mauritius',            region: 'East Africa',     dependency: 'Tourism & financial services' },
  { code: 'MZ', name: 'Mozambique',           region: 'East Africa',     dependency: 'Natural gas & coal' },
  { code: 'RW', name: 'Rwanda',               region: 'East Africa',     dependency: 'Agricultural inputs' },
  { code: 'SC', name: 'Seychelles',           region: 'East Africa',     dependency: 'Tourism (60% of GDP)' },
  { code: 'SO', name: 'Somalia',              region: 'East Africa',     dependency: 'Livestock & remittances' },
  { code: 'SS', name: 'South Sudan',          region: 'East Africa',     dependency: 'Crude oil (99%)' },
  { code: 'TZ', name: 'Tanzania',             region: 'East Africa',     dependency: 'Agriculture & tourism' },
  { code: 'UG', name: 'Uganda',               region: 'East Africa',     dependency: 'Coffee exports' },
  { code: 'AO', name: 'Angola',               region: 'Central Africa',  dependency: 'Crude oil (90%)' },
  { code: 'CM', name: 'Cameroon',             region: 'Central Africa',  dependency: 'Oil & cocoa' },
  { code: 'CF', name: 'Central African Rep.', region: 'Central Africa',  dependency: 'Diamonds & timber' },
  { code: 'TD', name: 'Chad',                 region: 'Central Africa',  dependency: 'Crude oil (80%)' },
  { code: 'CG', name: 'Congo (Republic)',     region: 'Central Africa',  dependency: 'Oil (70% of revenue)' },
  { code: 'CD', name: 'DR Congo',             region: 'Central Africa',  dependency: 'Cobalt & copper' },
  { code: 'GQ', name: 'Equatorial Guinea',    region: 'Central Africa',  dependency: 'Oil & gas (90%)' },
  { code: 'GA', name: 'Gabon',               region: 'Central Africa',  dependency: 'Oil & manganese' },
  { code: 'ST', name: 'São Tomé & Príncipe',  region: 'Central Africa',  dependency: 'Cocoa & tourism' },
  { code: 'BW', name: 'Botswana',             region: 'Southern Africa', dependency: 'Diamonds (70% of exports)' },
  { code: 'LS', name: 'Lesotho',              region: 'Southern Africa', dependency: 'Textiles & remittances' },
  { code: 'NA', name: 'Namibia',              region: 'Southern Africa', dependency: 'Mining & fishing' },
  { code: 'ZA', name: 'South Africa',         region: 'Southern Africa', dependency: 'Mining & minerals' },
  { code: 'SZ', name: 'Eswatini',             region: 'Southern Africa', dependency: 'Textiles & sugar' },
  { code: 'ZM', name: 'Zambia',               region: 'Southern Africa', dependency: 'Copper (70% of exports)' },
  { code: 'ZW', name: 'Zimbabwe',             region: 'Southern Africa', dependency: 'Tobacco & mining' },
]

const REGIONS = ['All', 'North Africa', 'West Africa', 'East Africa', 'Central Africa', 'Southern Africa']

const REGION_HUE = {
  'North Africa':    { accent: '#E8C97A', dim: 'rgba(232,201,122,0.15)' },
  'West Africa':     { accent: '#4ED8A0', dim: 'rgba(78,216,160,0.15)'  },
  'East Africa':     { accent: '#7BA8F0', dim: 'rgba(123,168,240,0.15)' },
  'Central Africa':  { accent: '#F09070', dim: 'rgba(240,144,112,0.15)' },
  'Southern Africa': { accent: '#C090E8', dim: 'rgba(192,144,232,0.15)' },
}

const ICONS = {
  'AgriTech': '🌱', 'Tourism': '✈️', 'Tourism & Eco-tourism': '🦍',
  'Fintech': '💳', 'Fintech & Digital Finance': '💳',
  'Logistics Hub': '🚢', 'Logistics & Trade Hub': '✈️',
  'Green Energy': '⚡', 'Green Energy Transition': '⚡', 'Renewable Energy': '☀️',
  'Manufacturing': '🏭', 'Agriculture Value Chain': '🌾',
  'Solid Minerals': '⛏️', 'Creative Economy': '🎬', 'Tech & BPO': '💻',
  'Blue Economy': '🌊', 'Healthcare': '🏥', 'Healthcare Exports': '🏥',
  'Green Hydrogen': '🔬', 'Gold Value Addition': '🥇',
  'Agro-processing': '🌿', 'Petrochemicals': '🛢️',
  'Financial Services': '📈', 'Financial Services Export': '📈',
  'Ocean Economy': '🐳', 'Digital Infrastructure': '🌐',
  'Digital Services': '📱', 'Digital Services & ICT': '📱', 'Electric Vehicles': '🚗',
}

// Friendly labels for WB indicator keys shown in data_inputs
const INDICATOR_LABELS = {
  gdp_growth:            'GDP Growth',
  inflation:             'Inflation',
  trade_openness:        'Trade Openness',
  fdi:                   'FDI (% GDP)',
  export_diversification:'Export Diversif.',
  import_dependency:     'Import Dependency',
  commodity_exposure:    'Commodity Exposure',
}

const BG = 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=1800&q=85&fit=crop'

// Format a data_inputs value for display
function fmtIndicator(key, val) {
  if (val === undefined || val === null) return '—'
  if (key === 'export_diversification' || key === 'commodity_exposure') {
    return `${(val * 100).toFixed(0)}%`
  }
  return `${val.toFixed(1)}%`
}

export default function Recommender() {
  const [selected,    setSelected]    = useState(null)
  const [recs,        setRecs]        = useState([])
  const [indicators,  setIndicators]  = useState({})   // ← real WB indicators from API
  const [loading,     setLoading]     = useState(false)
  const [search,      setSearch]      = useState('')
  const [region,      setRegion]      = useState('All')
  const [hovered,     setHovered]     = useState(null)
  const [expandedRec, setExpandedRec] = useState(null) // which rec card shows data_inputs

  const analyze = (country) => {
    setSelected(country)
    setRecs([])
    setIndicators({})
    setLoading(true)
    setExpandedRec(null)
    fetchRecommendations(country.code)
      .then(r => {
        setRecs(r.data.recommendations)
        setIndicators(r.data.indicators_used || {})  // ← capture real WB indicators
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  const filtered = useMemo(() => COUNTRIES.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q) || c.dependency.toLowerCase().includes(q)
    const matchRegion = region === 'All' || c.region === region
    return matchSearch && matchRegion
  }), [search, region])

  const grouped = useMemo(() => {
    if (region !== 'All') return { [region]: filtered }
    return REGIONS.slice(1).reduce((acc, r) => {
      const list = filtered.filter(c => c.region === r)
      if (list.length) acc[r] = list
      return acc
    }, {})
  }, [filtered, region])

  const scoreGrade = s => s >= 88 ? 'PRIME' : s >= 75 ? 'STRONG' : 'VIABLE'
  const scoreColor = s => s >= 88 ? '#4ED8A0' : s >= 75 ? '#E8C97A' : '#F09070'

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        :root {
          --gold: #C9A84C;
          --gold-light: #E8C97A;
          --cream: #F0EBE1;
          --bg: #06080F;
          --glass: rgba(8,12,24,0.68);
          --glass-hover: rgba(12,18,36,0.82);
          --border: rgba(201,168,76,0.14);
          --border-hover: rgba(201,168,76,0.38);
        }

        @keyframes fadeUp   { from { opacity:0; transform:translateY(18px) } to { opacity:1; transform:none } }
        @keyframes barGrow  { from { width:0 } to { width: var(--w) } }
        @keyframes spin     { to { transform: rotate(360deg) } }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.25} }

        .ccard {
          background: var(--glass);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 18px 20px;
          cursor: pointer;
          transition: all 0.22s cubic-bezier(.4,0,.2,1);
          position: relative;
          overflow: hidden;
          backdrop-filter: blur(16px) saturate(1.4);
          animation: fadeUp 0.38s ease both;
        }
        .ccard:hover {
          background: var(--glass-hover);
          border-color: var(--border-hover);
          transform: translateY(-3px) scale(1.01);
          box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.12);
        }
        .ccard-top-line {
          position: absolute; top: 0; left: 0; right: 0; height: 2px;
          opacity: 0; transition: opacity 0.22s;
        }
        .ccard:hover .ccard-top-line { opacity: 1; }

        .rbtn {
          padding: 7px 18px;
          border-radius: 99px;
          border: 1px solid rgba(201,168,76,0.18);
          background: transparent;
          color: rgba(240,235,225,0.45);
          font-size: 11.5px;
          font-family: 'DM Mono', monospace;
          letter-spacing: 0.04em;
          cursor: pointer;
          transition: all 0.18s;
          white-space: nowrap;
        }
        .rbtn:hover { border-color: rgba(201,168,76,0.4); color: #E8C97A; background: rgba(201,168,76,0.06); }
        .rbtn.on { background: rgba(201,168,76,0.13); border-color: rgba(201,168,76,0.5); color: #E8C97A; }

        .searchbox {
          background: rgba(6,8,15,0.7);
          border: 1px solid rgba(201,168,76,0.2);
          border-radius: 10px;
          padding: 11px 16px 11px 42px;
          color: #F0EBE1;
          font-size: 13.5px;
          font-family: 'DM Sans', sans-serif;
          width: 100%; outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          backdrop-filter: blur(12px);
        }
        .searchbox::placeholder { color: rgba(240,235,225,0.22); }
        .searchbox:focus { border-color: rgba(201,168,76,0.5); box-shadow: 0 0 0 3px rgba(201,168,76,0.07); }

        .reccard {
          background: var(--glass);
          border: 1px solid var(--border);
          border-radius: 14px;
          padding: 28px 32px;
          transition: border-color 0.22s;
          position: relative; overflow: hidden;
          backdrop-filter: blur(18px) saturate(1.4);
          animation: fadeUp 0.35s ease both;
        }
        .reccard:hover { border-color: rgba(201,168,76,0.28); }

        .bar-track { height: 4px; background: rgba(255,255,255,0.06); border-radius: 2px; overflow: hidden; margin-top: 10px; }
        .bar-fill  { height: 100%; border-radius: 2px; width: var(--w); animation: barGrow 0.8s cubic-bezier(.4,0,.2,1) both; }

        .spinner { animation: spin 1.1s linear infinite; }
        .live-dot { animation: pulse 2.2s ease infinite; }

        .backbtn {
          display: inline-flex; align-items: center; gap: 7px;
          padding: 9px 20px;
          background: rgba(201,168,76,0.06);
          border: 1px solid rgba(201,168,76,0.22);
          border-radius: 9px;
          color: rgba(240,235,225,0.55);
          font-size: 12px; font-family: 'DM Mono', monospace;
          cursor: pointer; transition: all 0.18s;
        }
        .backbtn:hover { background: rgba(201,168,76,0.13); color: #E8C97A; border-color: rgba(201,168,76,0.42); }

        .grade-badge {
          font-family: 'DM Mono', monospace;
          font-size: 9px; letter-spacing: 0.12em;
          padding: 3px 9px; border-radius: 4px;
          border: 1px solid; display: inline-block;
        }

        .data-chip {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 10px; border-radius: 6px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.07);
          font-family: 'DM Mono', monospace; font-size: 10px;
        }

        .toggle-inputs {
          background: none; border: none; cursor: pointer;
          font-family: 'DM Mono', monospace; font-size: 10px;
          color: rgba(201,168,76,0.45); letter-spacing: 0.06em;
          display: flex; align-items: center; gap: 5px;
          padding: 0; transition: color 0.15s;
        }
        .toggle-inputs:hover { color: #E8C97A; }

        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(201,168,76,0.25); border-radius: 3px; }
      `}</style>

      <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--cream)', fontFamily: "'DM Sans', sans-serif", position: 'relative', paddingTop: 72 }}>

        {/* ═══ BACKGROUND ═══ */}
        <div style={{ position: 'fixed', inset: 0, zIndex: 0, backgroundImage: `url(${BG})`, backgroundSize: 'cover', backgroundPosition: 'center 35%', backgroundAttachment: 'fixed' }} />
        <div style={{ position: 'fixed', inset: 0, zIndex: 1, background: 'linear-gradient(180deg, rgba(6,8,15,0.52) 0%, rgba(6,8,15,0.38) 30%, rgba(6,8,15,0.72) 70%, rgba(6,8,15,0.95) 100%)' }} />
        <div style={{ position: 'fixed', inset: 0, zIndex: 1, background: 'radial-gradient(ellipse 70% 40% at 50% 0%, rgba(201,168,76,0.06), transparent 60%)', pointerEvents: 'none' }} />

        {/* ═══ HERO HEADER ═══ */}
        <div style={{ position: 'relative', zIndex: 10, borderBottom: '1px solid rgba(201,168,76,0.1)', background: 'rgba(6,8,15,0.45)', backdropFilter: 'blur(24px)', padding: '3.5rem 2.5rem 2.5rem' }}>
          <div style={{ maxWidth: 1380, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
              <span className="live-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ED8A0', boxShadow: '0 0 10px #4ED8A0', flexShrink: 0 }} />
              <span style={{ fontSize: 10, letterSpacing: '0.22em', color: '#4ED8A0', textTransform: 'uppercase', fontFamily: "'DM Mono', monospace" }}>
                Live · World Bank Data Pipeline
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 24 }}>
              <div style={{ maxWidth: 640 }}>
                <p style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, letterSpacing: '0.2em', color: 'rgba(201,168,76,0.6)', textTransform: 'uppercase', marginBottom: 12 }}>
                  Economic Diversification Index
                </p>
                <h1 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 'clamp(2rem, 3.5vw, 3.2rem)', fontWeight: 400, lineHeight: 1.1, marginBottom: 16 }}>
                  Beyond Single-Resource<br />
                  <em style={{ color: '#C9A84C', fontStyle: 'italic' }}>Dependency</em>
                </h1>
                <p style={{ fontSize: 14, color: 'rgba(240,235,225,0.42)', lineHeight: 1.8, fontWeight: 300, maxWidth: 520 }}>
                  Select any of Africa's 54 economies to surface data-driven diversification pathways — scores computed live from World Bank macroeconomic indicators via a weighted sector model.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 32, flexShrink: 0, paddingBottom: 4 }}>
                {[['54', 'Nations'], ['7', 'WB Indicators'], ['6', 'Regions']].map(([v, l]) => (
                  <div key={l} style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Libre Baskerville', serif", fontSize: '2.4rem', fontWeight: 700, color: '#E8C97A', lineHeight: 1 }}>{v}</div>
                    <div style={{ fontSize: 10, color: 'rgba(240,235,225,0.28)', fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 5 }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ═══ COUNTRY BROWSER ═══ */}
        {!selected && (
          <div style={{ position: 'relative', zIndex: 10, maxWidth: 1380, margin: '0 auto', padding: '2.5rem 2.5rem 5rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 32, alignItems: 'center' }}>
              <div style={{ position: 'relative', minWidth: 240, maxWidth: 300, flex: 1 }}>
                <svg style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', opacity: 0.35, pointerEvents: 'none' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="2.2">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input className="searchbox" type="text" placeholder="Search country, code, dependency…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {REGIONS.map(r => (
                  <button key={r} className={`rbtn${region === r ? ' on' : ''}`} onClick={() => setRegion(r)}>
                    {r === 'All' ? `All · ${COUNTRIES.length}` : r.replace(' Africa', '')}
                  </button>
                ))}
              </div>
              <div style={{ marginLeft: 'auto', fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'rgba(240,235,225,0.22)' }}>
                {filtered.length} economies
              </div>
            </div>

            {Object.entries(grouped).map(([grp, countries]) => {
              const { accent, dim } = REGION_HUE[grp] || { accent: '#C9A84C', dim: 'rgba(201,168,76,0.12)' }
              return (
                <div key={grp} style={{ marginBottom: 36 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                    <div style={{ padding: '4px 14px', borderRadius: 99, border: `1px solid ${accent}44`, background: dim, color: accent, fontSize: 10, fontFamily: "'DM Mono', monospace", letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                      {grp}
                    </div>
                    <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${accent}28, transparent)` }} />
                    <span style={{ fontSize: 10, color: 'rgba(240,235,225,0.18)', fontFamily: "'DM Mono', monospace" }}>{countries.length}</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(195px, 1fr))', gap: 10 }}>
                    {countries.map((c, i) => {
                      const { accent: ca } = REGION_HUE[c.region] || { accent: '#C9A84C' }
                      return (
                        <div key={c.code} className="ccard" style={{ animationDelay: `${i * 0.025}s` }} onClick={() => analyze(c)} onMouseEnter={() => setHovered(c.code)} onMouseLeave={() => setHovered(null)}>
                          <div className="ccard-top-line" style={{ background: `linear-gradient(90deg, ${ca}, transparent)` }} />
                          <div style={{ position: 'absolute', top: 14, right: 14, fontFamily: "'DM Mono', monospace", fontSize: 10, color: ca, opacity: 0.55, letterSpacing: '0.06em' }}>{c.code}</div>
                          <div style={{ fontFamily: "'Libre Baskerville', serif", fontSize: '1.15rem', fontWeight: 400, lineHeight: 1.25, marginBottom: 6, paddingRight: 28 }}>{c.name}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 11 }}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: ca, flexShrink: 0 }} />
                            <span style={{ fontSize: 9, color: ca, fontFamily: "'DM Mono', monospace", textTransform: 'uppercase', letterSpacing: '0.12em' }}>{c.region.replace(' Africa', '')}</span>
                          </div>
                          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 10, fontSize: 11, color: 'rgba(240,235,225,0.3)', lineHeight: 1.55 }}>
                            <span style={{ color: 'rgba(240,235,225,0.15)' }}>Dep · </span>{c.dependency}
                          </div>
                          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 10, color: `${ca}88`, fontFamily: "'DM Mono', monospace", letterSpacing: '0.06em' }}>Analyse pathways</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ca} strokeWidth="2" opacity="0.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}

            {filtered.length === 0 && (
              <div style={{ padding: '6rem 2rem', textAlign: 'center', color: 'rgba(240,235,225,0.2)', fontFamily: "'Libre Baskerville', serif", fontSize: '1.3rem', fontStyle: 'italic' }}>
                No economies match "{search}"
              </div>
            )}
          </div>
        )}

        {/* ═══ RESULTS PANEL ═══ */}
        {selected && (
          <div style={{ position: 'relative', zIndex: 10, maxWidth: 1000, margin: '0 auto', padding: '2.5rem 2.5rem 5rem' }}>

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, marginBottom: 36, flexWrap: 'wrap' }}>
              <div>
                <button className="backbtn" onClick={() => { setSelected(null); setRecs([]); setIndicators({}) }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
                  All Economies
                </button>
              </div>
              <div style={{ flex: 1, minWidth: 220 }}>
                {(() => {
                  const { accent } = REGION_HUE[selected.region] || { accent: '#C9A84C' }
                  return (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{ padding: '3px 12px', borderRadius: 99, border: `1px solid ${accent}40`, background: `${accent}12`, color: accent, fontSize: 9, fontFamily: "'DM Mono', monospace", letterSpacing: '0.16em', textTransform: 'uppercase' }}>{selected.region}</div>
                        <span style={{ fontSize: 10, color: 'rgba(240,235,225,0.22)', fontFamily: "'DM Mono', monospace" }}>{selected.code}</span>
                      </div>
                      <h2 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 'clamp(1.8rem,3.5vw,2.6rem)', fontWeight: 400, lineHeight: 1.1, marginBottom: 8 }}>
                        {selected.name}<br /><em style={{ color: '#C9A84C' }}>Growth Pathways</em>
                      </h2>
                      <div style={{ fontSize: 12, color: 'rgba(240,235,225,0.28)', fontFamily: "'DM Mono', monospace" }}>
                        Current dependency · {selected.dependency}
                      </div>
                    </>
                  )
                })()}
              </div>
            </div>

            {/* ── WB Indicators strip (shows once data loads) ── */}
            {!loading && Object.keys(indicators).length > 0 && (
              <div style={{ marginBottom: 28, padding: '14px 20px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                <span style={{ fontSize: 9, fontFamily: "'DM Mono', monospace", color: 'rgba(240,235,225,0.25)', letterSpacing: '0.14em', textTransform: 'uppercase', marginRight: 4 }}>WB Live Inputs</span>
                {Object.entries(indicators).map(([key, val]) => (
                  <span key={key} className="data-chip">
                    <span style={{ color: 'rgba(240,235,225,0.35)' }}>{INDICATOR_LABELS[key] || key}</span>
                    <span style={{ color: '#E8C97A' }}>{fmtIndicator(key, val)}</span>
                  </span>
                ))}
              </div>
            )}

            {/* ── Loading ── */}
            {loading && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '6rem 0' }}>
                <svg className="spinner" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" strokeOpacity=".12"/>
                  <path d="M12 2a10 10 0 0 1 10 10"/>
                </svg>
                <div style={{ fontFamily: "'Libre Baskerville', serif", fontSize: '1.15rem', fontStyle: 'italic', color: 'rgba(201,168,76,0.4)' }}>
                  Fetching World Bank data for {selected.name}…
                </div>
              </div>
            )}

            {/* ── Recommendation cards ── */}
            {!loading && recs.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {recs.map((rec, i) => {
                  const sc = scoreColor(rec.score)
                  const gr = scoreGrade(rec.score)
                  const icon = ICONS[rec.sector] || '◈'
                  const isExpanded = expandedRec === i

                  return (
                    <div key={rec.sector} className="reccard" style={{ animationDelay: `${i * 0.08}s` }}>
                      {i === 0 && (
                        <div style={{ position: 'absolute', top: 0, right: 0, background: 'linear-gradient(135deg, #C9A84C, #E8C97A)', color: '#060810', fontSize: 8, fontWeight: 700, padding: '5px 16px', borderBottomLeftRadius: 10, letterSpacing: '0.18em', fontFamily: "'DM Mono', monospace" }}>TOP PICK</div>
                      )}

                      <div style={{ display: 'grid', gridTemplateColumns: '64px 1fr 110px', gap: 24, alignItems: 'center' }}>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '2.2rem', lineHeight: 1, marginBottom: 5 }}>{icon}</div>
                          <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 10, color: 'rgba(240,235,225,0.22)', letterSpacing: '0.06em' }}>#{i + 1}</div>
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 7 }}>
                            <h3 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: '1.35rem', fontWeight: 400 }}>{rec.sector}</h3>
                            <span className="grade-badge" style={{ color: sc, borderColor: `${sc}44`, background: `${sc}0F` }}>{gr}</span>
                          </div>
                          <p style={{ fontSize: 13.5, color: 'rgba(240,235,225,0.48)', lineHeight: 1.8, fontWeight: 300 }}>{rec.rationale}</p>

                          {/* Toggle to show which WB inputs drove this score */}
                          {rec.data_inputs && Object.keys(rec.data_inputs).length > 0 && (
                            <div style={{ marginTop: 12 }}>
                              <button className="toggle-inputs" onClick={() => setExpandedRec(isExpanded ? null : i)}>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  {isExpanded ? <path d="M18 15l-6-6-6 6"/> : <path d="M6 9l6 6 6-6"/>}
                                </svg>
                                {isExpanded ? 'Hide' : 'Show'} scoring inputs
                              </button>

                              {isExpanded && (
                                <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                  {Object.entries(rec.data_inputs).map(([key, val]) => (
                                    <span key={key} className="data-chip">
                                      <span style={{ color: 'rgba(240,235,225,0.35)' }}>{INDICATOR_LABELS[key] || key}</span>
                                      <span style={{ color: sc }}>{fmtIndicator(key, val)}</span>
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontFamily: "'Libre Baskerville', serif", fontSize: '3.2rem', fontWeight: 700, lineHeight: 1, color: sc }}>{rec.score}</div>
                          <div style={{ fontSize: 9, color: 'rgba(240,235,225,0.22)', fontFamily: "'DM Mono', monospace", letterSpacing: '0.1em', marginTop: 3 }}>OPP · SCORE</div>
                          <div className="bar-track">
                            <div className="bar-fill" style={{ '--w': `${rec.score}%`, background: `linear-gradient(90deg, ${sc}99, ${sc})`, animationDelay: `${i * 0.1 + 0.2}s` }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* ── Methodology footer — now accurate ── */}
                <div style={{ marginTop: 8, padding: '16px 22px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5" style={{ flexShrink: 0, marginTop: 2, opacity: 0.5 }}>
                    <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
                  </svg>
                  <span style={{ fontSize: 11, color: 'rgba(240,235,225,0.28)', lineHeight: 1.8 }}>
                    Scores computed from real World Bank API data (api.worldbank.org/v2) · Indicators: GDP growth, inflation, trade openness, FDI, export diversification, import dependency, commodity exposure · Each sector uses a weighted formula against relevant indicators · Regional fallbacks apply when live data is unavailable
                  </span>
                </div>
              </div>
            )}

            {!loading && recs.length === 0 && (
              <div style={{ padding: '5rem 2rem', textAlign: 'center' }}>
                <div style={{ fontFamily: "'Libre Baskerville', serif", fontSize: '1.1rem', fontStyle: 'italic', color: 'rgba(240,235,225,0.2)' }}>No data available for {selected.name}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}