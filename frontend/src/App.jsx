import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import Predictor from './pages/Predictor'
import Recommender from './pages/Recommender'
import './index.css'

function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const location = useLocation()
  const isHome = location.pathname === '/'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      padding: '0 2.5rem', height: '72px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: scrolled || !isHome ? 'rgba(6,10,18,0.96)' : 'transparent',
      borderBottom: scrolled || !isHome ? '1px solid rgba(201,168,76,0.15)' : '1px solid transparent',
      backdropFilter: scrolled || !isHome ? 'blur(20px)' : 'none',
      transition: 'all 0.4s ease',
    }}>
      <NavLink to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '36px', height: '36px',
          background: 'linear-gradient(135deg, #C9A84C, #E8C97A)',
          borderRadius: '8px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '18px', fontWeight: '700', color: '#060A12',
          fontFamily: 'Cormorant Garamond, serif',
          boxShadow: '0 4px 20px rgba(201,168,76,0.35)',
        }}>S</div>
        <div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', fontWeight: '600', color: '#F0EBE1', letterSpacing: '0.02em', lineHeight: 1 }}>
            Sentinel<span style={{ color: '#C9A84C' }}>Africa</span>
          </div>
          <div style={{ fontSize: '9px', color: 'rgba(240,235,225,0.35)', letterSpacing: '0.18em', textTransform: 'uppercase', marginTop: '2px' }}>Economic Intelligence Platform</div>
        </div>
      </NavLink>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {[
          { to: '/', label: 'Overview', end: true },
          { to: '/dashboard', label: 'Dashboard' },
          { to: '/predictor', label: 'Risk Predictor' },
          { to: '/recommender', label: 'Opportunities' },
        ].map(({ to, label, end }) => (
          <NavLink key={to} to={to} end={end} style={({ isActive }) => ({
            padding: '7px 14px', fontSize: '13px', fontWeight: isActive ? '500' : '400',
            textDecoration: 'none',
            color: isActive ? '#E8C97A' : 'rgba(240,235,225,0.55)',
            borderRadius: '6px',
            background: isActive ? 'rgba(201,168,76,0.1)' : 'transparent',
            border: isActive ? '1px solid rgba(201,168,76,0.25)' : '1px solid transparent',
            transition: 'all 0.2s', letterSpacing: '0.01em',
          })}>
            {label}
          </NavLink>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ECBA0', boxShadow: '0 0 8px #4ECBA0', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: '11px', color: 'rgba(240,235,225,0.35)', letterSpacing: '0.08em', fontFamily: 'Space Mono, monospace' }}>LIVE</span>
        </div>
        <NavLink to="/dashboard" style={{
          padding: '9px 22px',
          background: 'linear-gradient(135deg, #C9A84C, #E8C97A)',
          color: '#060A12', borderRadius: '6px', fontSize: '13px', fontWeight: '600',
          textDecoration: 'none', letterSpacing: '0.02em',
          boxShadow: '0 4px 20px rgba(201,168,76,0.3)',
          transition: 'all 0.2s',
        }}>
          Launch Platform →
        </NavLink>
      </div>
    </nav>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/predictor" element={<Predictor />} />
        <Route path="/recommender" element={<Recommender />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App