import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp,
  TrendingDown,
  Globe,
  BarChart3,
  Zap,
} from 'lucide-react'
import * as api from '../services/api'
import { formatCurrency, formatPercent, formatLargeNumber } from '../utils/formatters'
import Loader from '../components/Loader'

export default function Markets() {
  const [indices, setIndices] = useState([])
  const [movers, setMovers] = useState({ gainers: [], losers: [], mostActive: [] })
  const [sectors, setSectors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [indicesData, moversData, sectorsData] = await Promise.all([
          api.getMarketIndices(),
          api.getMarketMovers(),
          api.getSectorPerformance(),
        ])
        setIndices(indicesData)
        setMovers(moversData)
        setSectors(sectorsData)
      } catch (err) {
        console.error('Failed to load market data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) return <Loader text="Loading market data..." />

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-white">Markets Overview</h1>

      {/* Market Indices */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary-400" />
          Market Indices
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {indices.map(idx => (
            <div key={idx.symbol} className="glass-card rounded-xl p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-dark-400">{idx.symbol}</span>
                {idx.changePercent >= 0
                  ? <TrendingUp className="w-4 h-4 text-success" />
                  : <TrendingDown className="w-4 h-4 text-danger" />
                }
              </div>
              <p className="text-lg font-bold text-white">{idx.name}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-xl font-bold text-white">{idx.value.toLocaleString()}</span>
                <span className={`text-sm font-semibold ${idx.changePercent >= 0 ? 'text-success' : 'text-danger'}`}>
                  {idx.change >= 0 ? '+' : ''}{idx.change.toFixed(2)} ({formatPercent(idx.changePercent)})
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top Movers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="glass-card rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-success" />
            Top Gainers
          </h2>
          <div className="space-y-2">
            {movers.gainers.map((stock, i) => (
              <Link key={stock.symbol} to={`/stock/${stock.symbol}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-dark-800/30 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-dark-500 w-5">{i + 1}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{stock.symbol}</p>
                    <p className="text-xs text-dark-400">{stock.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{formatCurrency(stock.price)}</p>
                  <p className="text-xs font-medium text-success">{formatPercent(stock.changePercent)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingDown className="w-5 h-5 text-danger" />
            Top Losers
          </h2>
          <div className="space-y-2">
            {movers.losers.map((stock, i) => (
              <Link key={stock.symbol} to={`/stock/${stock.symbol}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-dark-800/30 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-dark-500 w-5">{i + 1}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{stock.symbol}</p>
                    <p className="text-xs text-dark-400">{stock.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{formatCurrency(stock.price)}</p>
                  <p className="text-xs font-medium text-danger">{formatPercent(stock.changePercent)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-warning" />
            Most Active
          </h2>
          <div className="space-y-2">
            {movers.mostActive.map((stock, i) => (
              <Link key={stock.symbol} to={`/stock/${stock.symbol}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-dark-800/30 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-dark-500 w-5">{i + 1}</span>
                  <div>
                    <p className="text-sm font-semibold text-white">{stock.symbol}</p>
                    <p className="text-xs text-dark-400">{stock.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">{formatCurrency(stock.price)}</p>
                  <p className="text-xs text-dark-400">{formatLargeNumber(stock.volume)} vol</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Sector Performance */}
      <div className="glass-card rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-primary-400" />
          Sector Performance
        </h2>
        <div className="space-y-3">
          {sectors.map(sector => {
            const maxChange = Math.max(...sectors.map(s => Math.abs(s.change)))
            const width = (Math.abs(sector.change) / maxChange) * 100
            return (
              <div key={sector.name} className="flex items-center gap-4">
                <span className="text-sm text-dark-200 w-48 flex-shrink-0">{sector.name}</span>
                <div className="flex-1 h-6 bg-dark-800/50 rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${sector.change >= 0 ? 'bg-success/30' : 'bg-danger/30'}`}
                    style={{ width: `${width}%` }}
                  />
                  <span className={`absolute right-2 top-1/2 -translate-y-1/2 text-xs font-semibold ${sector.change >= 0 ? 'text-success' : 'text-danger'}`}>
                    {formatPercent(sector.change)}
                  </span>
                </div>
                <span className="text-xs text-dark-400 w-16 text-right">{sector.marketCap}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
