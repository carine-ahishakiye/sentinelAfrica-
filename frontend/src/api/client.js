import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  timeout: 60000, // 60s — World Bank API calls can take 10-30s
})

export const fetchSupplyChainRisks = () => api.get('/api/predict/supply-chain')
export const fetchCountryRisk      = (code) => api.get(`/api/predict/supply-chain/${code}`)
export const fetchResilienceIndex  = () => api.get('/api/resilience/index')
export const fetchRecommendations  = (code) => api.get(`/api/recommend/${code}`)

export default api