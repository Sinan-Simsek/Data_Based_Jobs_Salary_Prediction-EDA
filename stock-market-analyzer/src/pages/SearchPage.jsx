import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, TrendingUp, TrendingDown } from 'lucide-react'
import * as api from '../services/api'
import { formatCurrency, formatPercent, formatLargeNumber } from '../utils/formatters'
import StockChart from '../components/StockChart'
import Loader from '../components/Loader'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [detailedResults, setDetailedResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [initialStocks, setInitialStocks] = useState([])
  const [initialLoading, setInitialLoading] = useState(true)

  // Load popular stocks on mount
  useEffect(() => {
    const popular = ['AAPL','MSFT','GOOGL','AMZN','TSLA','NVDA','META','JPM','V','JNJ','WMT','NFLX','AMD','BA','CRM','INTC','DIS','XOM','PG','UNH']
    Promise.all(popular.map(s => api.getStockQuote(s).catch(() => null)))
      .then(results => {
        setInitialStocks(results.filter(Boolean))
        setInitialLoading(false)
      })
      .catch(() => setInitialLoading(false))
  }, [])

  // Search with debounce
  useEffect(() => {
    if (query.length < 1) {
      setSearchResults([])
      setDetailedResults([])
      return
    }
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const results = await api.searchStocks(query)
        setSearchResults(results)
        // Fetch quotes for search results
        const quotes = await Promise.all(
          results.slice(0, 10).map(r => api.getStockQuote(r.symbol).catch(() => null))
        )
        setDetailedResults(quotes.filter(Boolean))
      } catch {
        setDetailedResults([])
      } finally {
        setLoading(false)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [query])

  const displayStocks = query ? detailedResults : initialStocks

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Stock Search</h1>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by symbol or company name..."
            className="w-full bg-dark-800/50 border border-dark-700/50 rounded-lg pl-10 pr-4 py-3 text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:border-primary-500/50 transition-all"
          />
        </div>
      </div>

      {(initialLoading && !query) ? (
        <Loader text="Loading stocks..." />
      ) : loading ? (
        <Loader text="Searching..." />
      ) : (
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700/50">
                  <th className="text-left text-xs font-medium text-dark-400 uppercase tracking-wider px-5 py-3">Symbol</th>
                  <th className="text-left text-xs font-medium text-dark-400 uppercase tracking-wider px-5 py-3">Company</th>
                  <th className="text-right text-xs font-medium text-dark-400 uppercase tracking-wider px-5 py-3">Price</th>
                  <th className="text-right text-xs font-medium text-dark-400 uppercase tracking-wider px-5 py-3">Change</th>
                  <th className="text-center text-xs font-medium text-dark-400 uppercase tracking-wider px-5 py-3">Chart</th>
                  <th className="text-right text-xs font-medium text-dark-400 uppercase tracking-wider px-5 py-3">Market Cap</th>
                  <th className="text-right text-xs font-medium text-dark-400 uppercase tracking-wider px-5 py-3">Volume</th>
                </tr>
              </thead>
              <tbody>
                {displayStocks.map(stock => (
                  <tr key={stock.symbol} className="border-b border-dark-700/20 hover:bg-dark-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <Link to={`/stock/${stock.symbol}`} className="text-sm font-semibold text-primary-400 hover:text-primary-300">
                        {stock.symbol}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <Link to={`/stock/${stock.symbol}`} className="text-sm text-dark-200 hover:text-white">
                        {stock.name}
                      </Link>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-sm font-semibold text-white">{formatCurrency(stock.price)}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className={`text-sm font-medium flex items-center justify-end gap-1 ${(stock.changePercent || 0) >= 0 ? 'text-success' : 'text-danger'}`}>
                        {(stock.changePercent || 0) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {formatPercent(stock.changePercent)}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-center">
                        <StockChart symbol={stock.symbol} compact />
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-sm text-dark-300">{formatLargeNumber(stock.marketCap)}</span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-sm text-dark-300">{formatLargeNumber(stock.volume)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {displayStocks.length === 0 && !loading && (
            <div className="text-center py-12 text-dark-400">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No stocks found matching your criteria</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
