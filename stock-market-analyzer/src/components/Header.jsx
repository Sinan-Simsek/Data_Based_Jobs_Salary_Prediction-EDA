import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Bell, TrendingUp, TrendingDown } from 'lucide-react'
import { searchStocks, getMarketIndices } from '../services/stockData'
import { formatPercent } from '../utils/formatters'

export default function Header() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [showResults, setShowResults] = useState(false)
  const inputRef = useRef(null)
  const resultsRef = useRef(null)
  const navigate = useNavigate()
  const indices = getMarketIndices()

  useEffect(() => {
    if (query.length >= 1) {
      setResults(searchStocks(query))
      setShowResults(true)
    } else {
      setResults([])
      setShowResults(false)
    }
  }, [query])

  useEffect(() => {
    function handleClickOutside(e) {
      if (resultsRef.current && !resultsRef.current.contains(e.target) && !inputRef.current.contains(e.target)) {
        setShowResults(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(symbol) {
    navigate(`/stock/${symbol}`)
    setQuery('')
    setShowResults(false)
  }

  return (
    <header className="sticky top-0 z-40 bg-dark-900/80 backdrop-blur-xl border-b border-dark-700/50">
      <div className="flex items-center justify-between h-14 px-6">
        {/* Market ticker */}
        <div className="hidden lg:flex items-center gap-6">
          {indices.slice(0, 4).map(idx => (
            <div key={idx.symbol} className="flex items-center gap-2 text-xs">
              <span className="text-dark-400 font-medium">{idx.name}</span>
              <span className="text-dark-100 font-semibold">{idx.value.toLocaleString()}</span>
              <span className={`flex items-center gap-0.5 font-medium ${idx.changePercent >= 0 ? 'text-success' : 'text-danger'}`}>
                {idx.changePercent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {formatPercent(idx.changePercent)}
              </span>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md mx-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stocks... (e.g., AAPL, Tesla)"
            className="w-full bg-dark-800/50 border border-dark-700/50 rounded-lg pl-10 pr-4 py-2 text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all"
          />
          {showResults && results.length > 0 && (
            <div ref={resultsRef} className="absolute top-full left-0 right-0 mt-1 bg-dark-800 border border-dark-700 rounded-lg shadow-xl overflow-hidden animate-slide-up">
              {results.map(stock => (
                <button
                  key={stock.symbol}
                  onClick={() => handleSelect(stock.symbol)}
                  className="flex items-center justify-between w-full px-4 py-3 hover:bg-dark-700/50 transition-colors text-left"
                >
                  <div>
                    <span className="text-sm font-semibold text-dark-100">{stock.symbol}</span>
                    <span className="text-xs text-dark-400 ml-2">{stock.name}</span>
                  </div>
                  <span className="text-xs text-dark-500">{stock.sector}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <button className="relative p-2 rounded-lg hover:bg-dark-800/50 transition-colors">
            <Bell className="w-5 h-5 text-dark-400" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary-500"></span>
          </button>
          <div className="flex items-center gap-2 pl-3 border-l border-dark-700/50">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
              <span className="text-xs font-bold text-white">MP</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
