import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, TrendingUp, TrendingDown, SlidersHorizontal } from 'lucide-react'
import { getAllStocks } from '../services/stockData'
import { formatCurrency, formatPercent, formatLargeNumber } from '../utils/formatters'

export default function Screener() {
  const allStocks = useMemo(() => getAllStocks(), [])
  const [sortBy, setSortBy] = useState('marketCap')
  const [sortDir, setSortDir] = useState('desc')
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    minMarketCap: '',
    sector: 'All',
    minPE: '',
    maxPE: '',
  })

  const sectors = useMemo(() => {
    const s = new Set(allStocks.map(stock => stock.sector))
    return ['All', ...Array.from(s).sort()]
  }, [allStocks])

  const filtered = useMemo(() => {
    let stocks = [...allStocks]

    if (filters.minPrice) stocks = stocks.filter(s => s.price >= parseFloat(filters.minPrice))
    if (filters.maxPrice) stocks = stocks.filter(s => s.price <= parseFloat(filters.maxPrice))
    if (filters.minMarketCap) stocks = stocks.filter(s => s.marketCap >= parseFloat(filters.minMarketCap) * 1e9)
    if (filters.sector !== 'All') stocks = stocks.filter(s => s.sector === filters.sector)
    if (filters.minPE) stocks = stocks.filter(s => s.pe >= parseFloat(filters.minPE))
    if (filters.maxPE) stocks = stocks.filter(s => s.pe <= parseFloat(filters.maxPE))

    stocks.sort((a, b) => {
      const aVal = a[sortBy] || 0
      const bVal = b[sortBy] || 0
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal
    })

    return stocks
  }, [allStocks, filters, sortBy, sortDir])

  function handleSort(column) {
    if (sortBy === column) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortBy(column)
      setSortDir('desc')
    }
  }

  function SortIcon({ column }) {
    if (sortBy !== column) return null
    return sortDir === 'desc' ? <TrendingDown className="w-3 h-3 inline ml-1" /> : <TrendingUp className="w-3 h-3 inline ml-1" />
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <BarChart3 className="w-6 h-6 text-primary-400" />
        Stock Screener
      </h1>

      {/* Filters */}
      <div className="glass-card rounded-xl p-5">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-primary-400" />
          Filters
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div>
            <label className="text-xs text-dark-400 block mb-1">Min Price</label>
            <input
              type="number"
              value={filters.minPrice}
              onChange={e => setFilters(f => ({ ...f, minPrice: e.target.value }))}
              className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
              placeholder="$0"
            />
          </div>
          <div>
            <label className="text-xs text-dark-400 block mb-1">Max Price</label>
            <input
              type="number"
              value={filters.maxPrice}
              onChange={e => setFilters(f => ({ ...f, maxPrice: e.target.value }))}
              className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
              placeholder="$1000"
            />
          </div>
          <div>
            <label className="text-xs text-dark-400 block mb-1">Min Mkt Cap (B)</label>
            <input
              type="number"
              value={filters.minMarketCap}
              onChange={e => setFilters(f => ({ ...f, minMarketCap: e.target.value }))}
              className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-xs text-dark-400 block mb-1">Sector</label>
            <select
              value={filters.sector}
              onChange={e => setFilters(f => ({ ...f, sector: e.target.value }))}
              className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
            >
              {sectors.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-dark-400 block mb-1">Min P/E</label>
            <input
              type="number"
              value={filters.minPE}
              onChange={e => setFilters(f => ({ ...f, minPE: e.target.value }))}
              className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
              placeholder="0"
            />
          </div>
          <div>
            <label className="text-xs text-dark-400 block mb-1">Max P/E</label>
            <input
              type="number"
              value={filters.maxPE}
              onChange={e => setFilters(f => ({ ...f, maxPE: e.target.value }))}
              className="w-full bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
              placeholder="100"
            />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-dark-400">{filtered.length} stocks found</span>
          <button
            onClick={() => setFilters({ minPrice: '', maxPrice: '', minMarketCap: '', sector: 'All', minPE: '', maxPE: '' })}
            className="text-xs text-primary-400 hover:text-primary-300 font-medium"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-700/50">
                <th className="text-left text-xs font-medium text-dark-400 uppercase px-5 py-3">Symbol</th>
                <th className="text-left text-xs font-medium text-dark-400 uppercase px-5 py-3">Company</th>
                <th className="text-left text-xs font-medium text-dark-400 uppercase px-5 py-3">Sector</th>
                <th className="text-right text-xs font-medium text-dark-400 uppercase px-5 py-3 cursor-pointer hover:text-dark-200" onClick={() => handleSort('price')}>
                  Price<SortIcon column="price" />
                </th>
                <th className="text-right text-xs font-medium text-dark-400 uppercase px-5 py-3 cursor-pointer hover:text-dark-200" onClick={() => handleSort('changePercent')}>
                  Change<SortIcon column="changePercent" />
                </th>
                <th className="text-right text-xs font-medium text-dark-400 uppercase px-5 py-3 cursor-pointer hover:text-dark-200" onClick={() => handleSort('marketCap')}>
                  Market Cap<SortIcon column="marketCap" />
                </th>
                <th className="text-right text-xs font-medium text-dark-400 uppercase px-5 py-3 cursor-pointer hover:text-dark-200" onClick={() => handleSort('pe')}>
                  P/E<SortIcon column="pe" />
                </th>
                <th className="text-right text-xs font-medium text-dark-400 uppercase px-5 py-3 cursor-pointer hover:text-dark-200" onClick={() => handleSort('volume')}>
                  Volume<SortIcon column="volume" />
                </th>
                <th className="text-right text-xs font-medium text-dark-400 uppercase px-5 py-3">Rating</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(stock => (
                <tr key={stock.symbol} className="border-b border-dark-700/20 hover:bg-dark-800/30 transition-colors">
                  <td className="px-5 py-4">
                    <Link to={`/stock/${stock.symbol}`} className="text-sm font-semibold text-primary-400 hover:text-primary-300">{stock.symbol}</Link>
                  </td>
                  <td className="px-5 py-4 text-sm text-dark-200">{stock.name}</td>
                  <td className="px-5 py-4">
                    <span className="text-xs text-dark-400 bg-dark-800/50 px-2 py-1 rounded">{stock.sector}</span>
                  </td>
                  <td className="px-5 py-4 text-right text-sm font-semibold text-white">{formatCurrency(stock.price)}</td>
                  <td className="px-5 py-4 text-right">
                    <span className={`text-sm font-medium ${stock.changePercent >= 0 ? 'text-success' : 'text-danger'}`}>
                      {formatPercent(stock.changePercent)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right text-sm text-dark-300">{formatLargeNumber(stock.marketCap)}</td>
                  <td className="px-5 py-4 text-right text-sm text-dark-300">{stock.pe}</td>
                  <td className="px-5 py-4 text-right text-sm text-dark-300">{formatLargeNumber(stock.volume)}</td>
                  <td className="px-5 py-4 text-right">
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${
                      stock.analystRating === 'Strong Buy' ? 'bg-success/10 text-success' :
                      stock.analystRating === 'Buy' ? 'bg-success/10 text-success' :
                      stock.analystRating === 'Hold' ? 'bg-warning/10 text-warning' :
                      'bg-danger/10 text-danger'
                    }`}>
                      {stock.analystRating}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
