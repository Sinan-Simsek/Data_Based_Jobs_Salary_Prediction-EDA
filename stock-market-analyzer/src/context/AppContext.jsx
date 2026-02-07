import { createContext, useContext, useState, useCallback } from 'react'

const AppContext = createContext(null)

const DEFAULT_WATCHLIST = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA']

export function AppProvider({ children }) {
  const [watchlist, setWatchlist] = useState(() => {
    const saved = localStorage.getItem('watchlist')
    return saved ? JSON.parse(saved) : DEFAULT_WATCHLIST
  })

  const [portfolio, setPortfolio] = useState(() => {
    const saved = localStorage.getItem('portfolio')
    return saved ? JSON.parse(saved) : [
      { symbol: 'AAPL', shares: 50, avgPrice: 165.00 },
      { symbol: 'MSFT', shares: 30, avgPrice: 380.00 },
      { symbol: 'GOOGL', shares: 40, avgPrice: 140.00 },
      { symbol: 'NVDA', shares: 20, avgPrice: 650.00 },
      { symbol: 'AMZN', shares: 25, avgPrice: 155.00 },
    ]
  })

  const [theme, setTheme] = useState('dark')

  const addToWatchlist = useCallback((symbol) => {
    setWatchlist(prev => {
      if (prev.includes(symbol)) return prev
      const next = [...prev, symbol]
      localStorage.setItem('watchlist', JSON.stringify(next))
      return next
    })
  }, [])

  const removeFromWatchlist = useCallback((symbol) => {
    setWatchlist(prev => {
      const next = prev.filter(s => s !== symbol)
      localStorage.setItem('watchlist', JSON.stringify(next))
      return next
    })
  }, [])

  const addToPortfolio = useCallback((symbol, shares, avgPrice) => {
    setPortfolio(prev => {
      const existing = prev.find(p => p.symbol === symbol)
      let next
      if (existing) {
        const totalShares = existing.shares + shares
        const totalCost = existing.shares * existing.avgPrice + shares * avgPrice
        next = prev.map(p => p.symbol === symbol
          ? { ...p, shares: totalShares, avgPrice: totalCost / totalShares }
          : p
        )
      } else {
        next = [...prev, { symbol, shares, avgPrice }]
      }
      localStorage.setItem('portfolio', JSON.stringify(next))
      return next
    })
  }, [])

  const removeFromPortfolio = useCallback((symbol) => {
    setPortfolio(prev => {
      const next = prev.filter(p => p.symbol !== symbol)
      localStorage.setItem('portfolio', JSON.stringify(next))
      return next
    })
  }, [])

  return (
    <AppContext.Provider value={{
      watchlist,
      portfolio,
      theme,
      setTheme,
      addToWatchlist,
      removeFromWatchlist,
      addToPortfolio,
      removeFromPortfolio,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
