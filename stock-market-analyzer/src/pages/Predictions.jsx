import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Brain,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Filter,
  ChevronUp,
  ChevronDown,
  Info,
  Zap,
} from 'lucide-react'
import * as api from '../services/api'
import { formatCurrency, formatPercent } from '../utils/formatters'
import Loader from '../components/Loader'

const PERIODS = [
  { key: '1d', label: '1 Day' },
  { key: '3d', label: '3 Day' },
  { key: '1w', label: '1 Week' },
  { key: '1m', label: '1 Month' },
]

const SIGNAL_CONFIG = {
  strong_buy:  { label: 'Strong Buy',  color: 'text-emerald-400', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', icon: '🟢' },
  buy:         { label: 'Buy',         color: 'text-green-400',   bg: 'bg-green-500/15',   border: 'border-green-500/30',   icon: '🔵' },
  hold:        { label: 'Hold',        color: 'text-dark-300',    bg: 'bg-dark-700/30',    border: 'border-dark-600/30',    icon: '⚪' },
  sell:        { label: 'Sell',         color: 'text-orange-400',  bg: 'bg-orange-500/15',  border: 'border-orange-500/30',  icon: '🟠' },
  strong_sell: { label: 'Strong Sell',  color: 'text-red-400',     bg: 'bg-red-500/15',     border: 'border-red-500/30',     icon: '🔴' },
}

function getChangeCellColor(val) {
  if (val == null) return ''
  if (val > 5) return 'bg-emerald-500/20 text-emerald-400'
  if (val > 2) return 'bg-green-500/15 text-green-400'
  if (val > 0) return 'bg-green-500/10 text-green-300'
  if (val > -2) return 'bg-red-500/10 text-red-300'
  if (val > -5) return 'bg-red-500/15 text-orange-400'
  return 'bg-red-500/20 text-red-400'
}

function ConfidenceBar({ value }) {
  const color = value >= 70 ? 'bg-emerald-500' : value >= 50 ? 'bg-yellow-500' : 'bg-orange-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-dark-700/50 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[10px] text-dark-400 w-8 text-right">{value}%</span>
    </div>
  )
}

export default function Predictions() {
  const [predictions, setPredictions] = useState([])
  const [summary, setSummary] = useState(null)
  const [sectors, setSectors] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedSector, setSelectedSector] = useState('')
  const [selectedSignal, setSelectedSignal] = useState('')
  const [sortField, setSortField] = useState('1w')
  const [sortOrder, setSortOrder] = useState('desc')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchPredictions = useCallback(async () => {
    try {
      const params = {}
      if (selectedSector) params.sector = selectedSector
      if (selectedSignal) params.signal = selectedSignal
      params.sort = sortField
      params.order = sortOrder

      const [data, summaryData, sectorList] = await Promise.all([
        api.getPredictions(params),
        api.getPredictionsSummary().catch(() => null),
        api.getPredictionSectors().catch(() => []),
      ])
      setPredictions(data)
      setSummary(summaryData)
      setSectors(sectorList)
    } catch (err) {
      console.error('Failed to load predictions:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedSector, selectedSignal, sortField, sortOrder])

  useEffect(() => { fetchPredictions() }, [fetchPredictions])

  function handleSort(field) {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  function SortIcon({ field }) {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-dark-600" />
    return sortOrder === 'desc'
      ? <ChevronDown className="w-3 h-3 text-primary-400" />
      : <ChevronUp className="w-3 h-3 text-primary-400" />
  }

  if (loading) return <Loader text="Loading AI predictions..." />

  const filtered = searchQuery
    ? predictions.filter(p =>
        p.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : predictions

  const noPredictions = predictions.length === 0

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Brain className="w-6 h-6 text-purple-400" />
          AI Price Predictions
        </h1>
        {summary?.lastPrediction && (
          <span className="text-xs text-dark-400">
            Last updated: {new Date(summary.lastPrediction).toLocaleString()}
          </span>
        )}
      </div>

      {noPredictions ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <Brain className="w-16 h-16 mx-auto mb-4 text-dark-600" />
          <h2 className="text-xl font-semibold text-dark-300 mb-2">No Predictions Yet</h2>
          <p className="text-dark-400 mb-4 max-w-md mx-auto">
            Run the AI prediction engine to generate stock price forecasts using LSTM deep learning model.
          </p>
          <div className="glass-card rounded-lg p-4 max-w-sm mx-auto text-left">
            <p className="text-xs text-dark-400 mb-2">Run in terminal:</p>
            <code className="text-sm text-primary-400 font-mono">npm run predict</code>
            <p className="text-xs text-dark-500 mt-2">or for top 20 stocks only:</p>
            <code className="text-sm text-primary-400 font-mono">npm run predict:top</code>
          </div>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(SIGNAL_CONFIG).map(([key, cfg]) => {
                const count = summary.signals?.[key] || 0
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedSignal(selectedSignal === key ? '' : key)}
                    className={`glass-card rounded-xl p-4 text-center transition-all cursor-pointer border
                      ${selectedSignal === key ? cfg.border + ' ' + cfg.bg : 'border-transparent hover:bg-dark-800/30'}`}
                  >
                    <span className="text-lg">{cfg.icon}</span>
                    <p className={`text-xl font-bold mt-1 ${cfg.color}`}>{count}</p>
                    <p className="text-[10px] text-dark-400 uppercase tracking-wider mt-1">{cfg.label}</p>
                  </button>
                )
              })}
            </div>
          )}

          {/* Top Predictions Row */}
          {summary?.topBuy?.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="glass-card rounded-xl p-5">
                <h3 className="text-sm font-semibold text-success flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4" />
                  Top Predicted Gainers (1W)
                </h3>
                <div className="space-y-2">
                  {summary.topBuy.map(s => (
                    <Link key={s.symbol} to={`/stock/${s.symbol}`}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-dark-800/30 transition-colors">
                      <div>
                        <span className="text-sm font-semibold text-white">{s.symbol}</span>
                        <span className="text-xs text-dark-400 ml-2">{s.name}</span>
                      </div>
                      <span className="text-sm font-bold text-success">
                        +{s.predicted_change_pct.toFixed(2)}%
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
              <div className="glass-card rounded-xl p-5">
                <h3 className="text-sm font-semibold text-danger flex items-center gap-2 mb-3">
                  <TrendingDown className="w-4 h-4" />
                  Top Predicted Losers (1W)
                </h3>
                <div className="space-y-2">
                  {summary.topSell.map(s => (
                    <Link key={s.symbol} to={`/stock/${s.symbol}`}
                      className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-dark-800/30 transition-colors">
                      <div>
                        <span className="text-sm font-semibold text-white">{s.symbol}</span>
                        <span className="text-xs text-dark-400 ml-2">{s.name}</span>
                      </div>
                      <span className="text-sm font-bold text-danger">
                        {s.predicted_change_pct.toFixed(2)}%
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <input
                type="text"
                placeholder="Search symbol or name..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-dark-800/50 border border-dark-700/50 rounded-lg px-4 py-2 text-sm text-dark-100 placeholder-dark-500 focus:outline-none focus:border-primary-500/50"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-dark-400" />
              <select
                value={selectedSector}
                onChange={e => setSelectedSector(e.target.value)}
                className="bg-dark-800/50 border border-dark-700/50 rounded-lg px-3 py-2 text-sm text-dark-200 focus:outline-none focus:border-primary-500/50"
              >
                <option value="">All Sectors</option>
                {sectors.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <span className="text-xs text-dark-500">{filtered.length} stocks</span>
          </div>

          {/* Predictions Table */}
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className="border-b border-dark-700/50">
                    <th className="text-left px-4 py-3">
                      <button onClick={() => handleSort('symbol')}
                        className="flex items-center gap-1 text-xs font-semibold text-dark-400 uppercase hover:text-dark-200">
                        Stock <SortIcon field="symbol" />
                      </button>
                    </th>
                    <th className="text-right px-3 py-3 text-xs font-semibold text-dark-400 uppercase">Price</th>
                    {PERIODS.map(p => (
                      <th key={p.key} className="text-center px-2 py-3">
                        <button onClick={() => handleSort(p.key)}
                          className="flex items-center gap-1 text-xs font-semibold text-dark-400 uppercase hover:text-dark-200 mx-auto">
                          {p.label} <SortIcon field={p.key} />
                        </button>
                      </th>
                    ))}
                    <th className="text-center px-3 py-3">
                      <button onClick={() => handleSort('signal')}
                        className="flex items-center gap-1 text-xs font-semibold text-dark-400 uppercase hover:text-dark-200 mx-auto">
                        Signal <SortIcon field="signal" />
                      </button>
                    </th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-dark-400 uppercase">
                      Confidence
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(stock => {
                    const sig = SIGNAL_CONFIG[stock.signal] || SIGNAL_CONFIG.hold
                    const avgConfidence = PERIODS.reduce((sum, p) => {
                      return sum + (stock.predictions[p.key]?.confidence || 0)
                    }, 0) / PERIODS.length

                    return (
                      <tr key={stock.symbol} className="border-b border-dark-700/20 hover:bg-dark-800/20 transition-colors">
                        <td className="px-4 py-3">
                          <Link to={`/stock/${stock.symbol}`} className="group">
                            <span className="text-sm font-semibold text-primary-400 group-hover:text-primary-300">
                              {stock.symbol}
                            </span>
                            <p className="text-[11px] text-dark-500 truncate max-w-[140px]">{stock.name}</p>
                            {stock.sector && (
                              <span className="text-[9px] text-dark-600">{stock.sector}</span>
                            )}
                          </Link>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <span className="text-sm font-semibold text-white">
                            {formatCurrency(stock.currentPrice)}
                          </span>
                        </td>
                        {PERIODS.map(p => {
                          const pred = stock.predictions[p.key]
                          if (!pred) return <td key={p.key} className="px-2 py-3 text-center text-dark-600">—</td>
                          return (
                            <td key={p.key} className="px-1.5 py-2">
                              <div className={`text-center rounded-md py-1.5 px-2 ${getChangeCellColor(pred.changePct)}`}>
                                <div className="text-xs font-bold">
                                  {pred.changePct > 0 ? '+' : ''}{pred.changePct.toFixed(2)}%
                                </div>
                                <div className="text-[10px] opacity-70">
                                  {formatCurrency(pred.price)}
                                </div>
                              </div>
                            </td>
                          )
                        })}
                        <td className="px-3 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border ${sig.bg} ${sig.color} ${sig.border}`}>
                            {sig.label}
                          </span>
                        </td>
                        <td className="px-3 py-3 w-28">
                          <ConfidenceBar value={Math.round(avgConfidence)} />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-dark-800/30 border border-dark-700/30">
            <Info className="w-5 h-5 text-dark-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs text-dark-400 leading-relaxed">
                <strong className="text-dark-300">Disclaimer:</strong> Predictions are generated using LSTM (Long Short-Term Memory)
                deep learning model based on historical price data, technical indicators (SMA, RSI, MACD), and volume patterns.
                These are mathematical forecasts only and <strong className="text-dark-300">not financial advice</strong>.
                Stock markets are inherently unpredictable. Always do your own research before making investment decisions.
              </p>
              <p className="text-[10px] text-dark-500 mt-1 flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Model: LSTM (64→32 units) | Features: Price, Volume, SMA5, SMA20, RSI-14, MACD | TensorFlow.js
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
