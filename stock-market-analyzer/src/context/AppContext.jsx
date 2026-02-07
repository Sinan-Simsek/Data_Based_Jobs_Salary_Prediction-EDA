import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import * as api from '../services/api'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [watchlist, setWatchlist] = useState([])
  const [portfolio, setPortfolio] = useState([])
  const [loading, setLoading] = useState(true)

  // Load watchlist and portfolio from PostgreSQL backend on mount
  useEffect(() => {
    async function load() {
      try {
        const [wl, pf] = await Promise.all([
          api.getWatchlist(),
          api.getPortfolio(),
        ])
        setWatchlist(wl)
        setPortfolio(pf)
      } catch (err) {
        console.error('Failed to load initial data:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const addToWatchlist = useCallback(async (symbol) => {
    try {
      await api.addToWatchlist(symbol)
      setWatchlist(prev => prev.includes(symbol) ? prev : [...prev, symbol])
    } catch (err) {
      console.error('Failed to add to watchlist:', err)
    }
  }, [])

  const removeFromWatchlist = useCallback(async (symbol) => {
    try {
      await api.removeFromWatchlist(symbol)
      setWatchlist(prev => prev.filter(s => s !== symbol))
    } catch (err) {
      console.error('Failed to remove from watchlist:', err)
    }
  }, [])

  const addToPortfolio = useCallback(async (symbol, shares, avgPrice) => {
    try {
      const result = await api.addToPortfolio(symbol, shares, avgPrice)
      setPortfolio(prev => {
        const exists = prev.find(p => p.symbol === symbol)
        if (exists) {
          return prev.map(p => p.symbol === symbol ? result : p)
        }
        return [...prev, result]
      })
    } catch (err) {
      console.error('Failed to add to portfolio:', err)
    }
  }, [])

  const removeFromPortfolio = useCallback(async (symbol) => {
    try {
      await api.removeFromPortfolio(symbol)
      setPortfolio(prev => prev.filter(p => p.symbol !== symbol))
    } catch (err) {
      console.error('Failed to remove from portfolio:', err)
    }
  }, [])

  return (
    <AppContext.Provider value={{
      watchlist,
      portfolio,
      loading,
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
