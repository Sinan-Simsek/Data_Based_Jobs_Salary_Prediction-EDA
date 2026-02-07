import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Star, TrendingUp, TrendingDown, X } from 'lucide-react'
import * as api from '../services/api'
import { useApp } from '../context/AppContext'
import { formatCurrency, formatPercent, formatLargeNumber } from '../utils/formatters'
import StockChart from '../components/StockChart'
import Loader from '../components/Loader'

export default function Watchlist() {
  const { watchlist, removeFromWatchlist } = useApp()
  const [stocks, setStocks] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchQuotes() {
      if (watchlist.length === 0) {
        setStocks([])
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        const quotes = await Promise.all(
          watchlist.map(symbol =>
            api.getStockQuote(symbol).then(quote => ({ symbol, ...quote }))
          )
        )
        setStocks(quotes)
      } catch (err) {
        console.error('Failed to load watchlist quotes:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchQuotes()
  }, [watchlist])

  if (loading) return <Loader text="Loading watchlist..." />

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Star className="w-6 h-6 text-warning" />
          Watchlist
        </h1>
        <span className="text-sm text-dark-400">{stocks.length} stocks</span>
      </div>

      {stocks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stocks.map(stock => (
            <div key={stock.symbol} className="glass-card rounded-xl p-5 group">
              <div className="flex items-start justify-between mb-3">
                <Link to={`/stock/${stock.symbol}`}>
                  <h3 className="text-lg font-bold text-white group-hover:text-primary-400 transition-colors">{stock.symbol}</h3>
                  <p className="text-xs text-dark-400">{stock.name}</p>
                </Link>
                <button
                  onClick={() => removeFromWatchlist(stock.symbol)}
                  className="p-1.5 rounded-lg hover:bg-danger/10 text-dark-500 hover:text-danger transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove from watchlist"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-end justify-between mb-4">
                <div>
                  <p className="text-2xl font-bold text-white">{formatCurrency(stock.price)}</p>
                  <p className={`text-sm font-medium flex items-center gap-1 mt-1 ${stock.changePercent >= 0 ? 'text-success' : 'text-danger'}`}>
                    {stock.changePercent >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                    {formatCurrency(Math.abs(stock.change))} ({formatPercent(stock.changePercent)})
                  </p>
                </div>
                <StockChart symbol={stock.symbol} compact />
              </div>

              <div className="grid grid-cols-3 gap-3 pt-3 border-t border-dark-700/30">
                <div>
                  <p className="text-[10px] text-dark-400 uppercase">Market Cap</p>
                  <p className="text-xs font-semibold text-dark-200">{formatLargeNumber(stock.marketCap)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-dark-400 uppercase">P/E</p>
                  <p className="text-xs font-semibold text-dark-200">{stock.pe}</p>
                </div>
                <div>
                  <p className="text-[10px] text-dark-400 uppercase">Volume</p>
                  <p className="text-xs font-semibold text-dark-200">{formatLargeNumber(stock.volume)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-xl p-12 text-center">
          <Star className="w-12 h-12 mx-auto mb-4 text-dark-600" />
          <p className="text-dark-400 text-lg mb-2">Your watchlist is empty</p>
          <p className="text-dark-500 text-sm">Search for stocks and add them to your watchlist to track them here.</p>
          <Link to="/search" className="inline-block mt-4 px-4 py-2 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors">
            Search Stocks
          </Link>
        </div>
      )}
    </div>
  )
}
