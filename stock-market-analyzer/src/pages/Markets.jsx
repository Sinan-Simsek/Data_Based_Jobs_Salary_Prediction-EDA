import { useState, useEffect, useCallback } from 'react'
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

const PERIOD_LABELS = {
  '1d': '1D',
  '1w': '1W',
  '1m': '1M',
  '3m': '3M',
  '6m': '6M',
  '1y': '1Y',
  '5y': '5Y',
}

const PERIOD_KEYS = Object.keys(PERIOD_LABELS)

function getChangeColor(value) {
  if (value == null) return 'text-dark-500'
  if (value > 5) return 'text-emerald-400'
  if (value > 0) return 'text-green-400'
  if (value < -5) return 'text-red-400'
  if (value < 0) return 'text-orange-400'
  return 'text-dark-300'
}

function getChangeBg(value) {
  if (value == null) return 'bg-dark-800/30'
  if (value > 10) return 'bg-emerald-500/20'
  if (value > 5) return 'bg-emerald-500/15'
  if (value > 0) return 'bg-green-500/10'
  if (value < -10) return 'bg-red-500/20'
  if (value < -5) return 'bg-red-500/15'
  if (value < 0) return 'bg-red-500/10'
  return 'bg-dark-800/30'
}

export default function Markets() {
  const [indices, setIndices] = useState([])
  const [movers, setMovers] = useState({ gainers: [], losers: [], mostActive: [] })
  const [sectors, setSectors] = useState([])
  const [sectorHistory, setSectorHistory] = useState([])
  const [selectedPeriod, setSelectedPeriod] = useState('1d')
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const [indicesData, moversData, sectorsData, sectorHistData] = await Promise.all([
        api.getMarketIndices(),
        api.getMarketMovers(),
        api.getSectorPerformance(),
        api.getSectorHistory().catch(() => []),
      ])
      setIndices(indicesData)
      setMovers(moversData)
      setSectors(sectorsData)
      setSectorHistory(sectorHistData)
    } catch (err) {
      console.error('Failed to load market data:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10_000)
    return () => clearInterval(interval)
  }, [fetchData])

  if (loading) return <Loader text="Loading market data..." />

  // Bar chart data - use history if available, fallback to live
  const barData = sectorHistory.length > 0
    ? sectorHistory.map(s => ({
        name: s.name,
        symbol: s.symbol,
        change: s.periods[selectedPeriod],
      }))
    : sectors.map(s => ({ name: s.name, symbol: s.symbol, change: s.change }))

  const sortedBarData = [...barData].sort((a, b) => (b.change || 0) - (a.change || 0))
  const maxAbsChange = Math.max(...sortedBarData.map(s => Math.abs(s.change || 0)), 1)

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

      {/* Sector Performance - Bar Chart with Period Tabs */}
      <div className="glass-card rounded-xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-400" />
            Sector Performance
          </h2>
          {sectorHistory.length > 0 && (
            <div className="flex gap-1 bg-dark-800/50 rounded-lg p-1">
              {PERIOD_KEYS.map(key => (
                <button
                  key={key}
                  onClick={() => setSelectedPeriod(key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all
                    ${selectedPeriod === key
                      ? 'bg-primary-600 text-white shadow-lg'
                      : 'text-dark-400 hover:text-dark-200 hover:bg-dark-700/50'
                    }`}
                >
                  {PERIOD_LABELS[key]}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-2.5">
          {sortedBarData.map(sector => {
            const change = sector.change
            const width = change != null ? (Math.abs(change) / maxAbsChange) * 100 : 0
            const isPositive = change != null && change >= 0

            return (
              <div key={sector.name} className="flex items-center gap-3">
                <span className="text-sm text-dark-200 w-44 flex-shrink-0 truncate">{sector.name}</span>
                <div className="flex-1 h-8 bg-dark-800/30 rounded-lg overflow-hidden relative">
                  <div
                    className={`h-full rounded-lg transition-all duration-500 ease-out ${isPositive ? 'bg-emerald-500/25' : 'bg-red-500/25'}`}
                    style={{ width: `${Math.max(width, 2)}%` }}
                  />
                  <span className={`absolute inset-0 flex items-center px-3 text-xs font-bold ${getChangeColor(change)}`}>
                    {change != null ? formatPercent(change) : 'N/A'}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Sector Heat Map Table - All Periods at Once */}
      {sectorHistory.length > 0 && (
        <div className="glass-card rounded-xl p-5 overflow-x-auto">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-400" />
            Sector Heat Map
          </h2>
          <table className="w-full min-w-[700px]">
            <thead>
              <tr>
                <th className="text-left text-xs font-semibold text-dark-400 pb-3 pr-4">Sector</th>
                {PERIOD_KEYS.map(key => (
                  <th key={key} className="text-center text-xs font-semibold text-dark-400 pb-3 px-2">
                    {PERIOD_LABELS[key]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sectorHistory.map(sector => (
                <tr key={sector.symbol} className="border-t border-dark-800/50">
                  <td className="py-2.5 pr-4">
                    <span className="text-sm font-medium text-dark-100">{sector.name}</span>
                    <span className="text-xs text-dark-500 ml-2">{sector.symbol}</span>
                  </td>
                  {PERIOD_KEYS.map(key => {
                    const val = sector.periods[key]
                    return (
                      <td key={key} className="py-2.5 px-1.5">
                        <div className={`text-center text-xs font-bold py-2 px-2 rounded-md ${getChangeBg(val)} ${getChangeColor(val)}`}>
                          {val != null ? formatPercent(val) : '—'}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
