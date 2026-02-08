const API_BASE = '/api'

async function fetchJSON(url) {
  const res = await fetch(`${API_BASE}${url}`)
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

async function postJSON(url, body) {
  const res = await fetch(`${API_BASE}${url}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

async function deleteJSON(url) {
  const res = await fetch(`${API_BASE}${url}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

// Stocks
export const searchStocks = (q) => fetchJSON(`/stocks/search?q=${encodeURIComponent(q)}`)
export const getStockQuote = (symbol) => fetchJSON(`/stocks/${symbol}/quote`)
export const getStockInfo = (symbol) => fetchJSON(`/stocks/${symbol}/info`)
export const getStockHistory = (symbol, range = '1y') => fetchJSON(`/stocks/${symbol}/history?range=${range}`)

// Market
export const getMarketIndices = () => fetchJSON('/market/indices')
export const getMarketMovers = () => fetchJSON('/market/movers')
export const getSectorPerformance = () => fetchJSON('/market/sectors')
export const getSectorHistory = () => fetchJSON('/market/sectors/history')
export const getMarketNews = (symbol) => fetchJSON(`/market/news${symbol ? `?symbol=${symbol}` : ''}`)

// Watchlist
export const getWatchlist = () => fetchJSON('/watchlist')
export const addToWatchlist = (symbol) => postJSON('/watchlist', { symbol })
export const removeFromWatchlist = (symbol) => deleteJSON(`/watchlist/${symbol}`)

// Portfolio
export const getPortfolio = () => fetchJSON('/portfolio')
export const addToPortfolio = (symbol, shares, avgPrice) => postJSON('/portfolio', { symbol, shares, avgPrice })
export const removeFromPortfolio = (symbol) => deleteJSON(`/portfolio/${symbol}`)
