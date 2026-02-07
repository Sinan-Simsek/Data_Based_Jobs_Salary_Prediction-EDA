import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Search, TrendingUp, TrendingDown, Filter } from 'lucide-react'
import { getAllStocks } from '../services/stockData'
import { formatCurrency, formatPercent, formatLargeNumber } from '../utils/formatters'
import StockChart from '../components/StockChart'

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [sectorFilter, setSectorFilter] = useState('All')
  const allStocks = useMemo(() => getAllStocks(), [])

  const sectors = useMemo(() => {
    const s = new Set(allStocks.map(stock => stock.sector))
    return ['All', ...Array.from(s).sort()]
  }, [allStocks])

  const filtered = useMemo(() => {
    let stocks = allStocks
    if (query) {
      const q = query.toUpperCase()
      stocks = stocks.filter(s => s.symbol.includes(q) || s.name.toUpperCase().includes(q))
    }
    if (sectorFilter !== 'All') {
      stocks = stocks.filter(s => s.sector === sectorFilter)
    }
    return stocks
  }, [allStocks, query, sectorFilter])

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
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-dark-400" />
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="bg-dark-800/50 border border-dark-700/50 rounded-lg px-3 py-3 text-sm text-dark-100 focus:outline-none focus:border-primary-500/50 transition-all"
          >
            {sectors.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700/50">
                <th className="text-left text-xs font-medium text-dark-400 uppercase tracking-wider px-5 py-3">Symbol</th>
                <th className="text-left text-xs font-medium text-dark-400 uppercase tracking-wider px-5 py-3">Company</th>
                <th className="text-left text-xs font-medium text-dark-400 uppercase tracking-wider px-5 py-3">Sector</th>
                <th className="text-right text-xs font-medium text-dark-400 uppercase tracking-wider px-5 py-3">Price</th>
                <th className="text-right text-xs font-medium text-dark-400 uppercase tracking-wider px-5 py-3">Change</th>
                <th className="text-center text-xs font-medium text-dark-400 uppercase tracking-wider px-5 py-3">Chart</th>
                <th className="text-right text-xs font-medium text-dark-400 uppercase tracking-wider px-5 py-3">Market Cap</th>
                <th className="text-right text-xs font-medium text-dark-400 uppercase tracking-wider px-5 py-3">Volume</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(stock => (
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
                  <td className="px-5 py-4">
                    <span className="text-xs text-dark-400 bg-dark-800/50 px-2 py-1 rounded">{stock.sector}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="text-sm font-semibold text-white">{formatCurrency(stock.price)}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className={`text-sm font-medium flex items-center justify-end gap-1 ${stock.changePercent >= 0 ? 'text-success' : 'text-danger'}`}>
                      {stock.changePercent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
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
        {filtered.length === 0 && (
          <div className="text-center py-12 text-dark-400">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No stocks found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  )
}
