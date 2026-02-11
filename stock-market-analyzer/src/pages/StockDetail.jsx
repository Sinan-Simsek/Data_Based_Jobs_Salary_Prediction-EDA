import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import {
  TrendingUp,
  TrendingDown,
  Star,
  StarOff,
  Plus,
  Building2,
  Users,
  Calendar,
  MapPin,
  Target,
  BarChart3,
  ThumbsUp,
  ThumbsDown,
  ArrowRightLeft,
} from 'lucide-react'
import * as api from '../services/api'
import { useApp } from '../context/AppContext'
import { formatCurrency, formatPercent, formatLargeNumber, formatNumber } from '../utils/formatters'
import StockChart from '../components/StockChart'
import Loader from '../components/Loader'

const RATING_COLORS = {
  strongBuy:  { bg: 'bg-emerald-500', text: 'text-emerald-400', label: 'Strong Buy' },
  buy:        { bg: 'bg-green-500',   text: 'text-green-400',   label: 'Buy' },
  hold:       { bg: 'bg-yellow-500',  text: 'text-yellow-400',  label: 'Hold' },
  sell:       { bg: 'bg-orange-500',  text: 'text-orange-400',  label: 'Sell' },
  strongSell: { bg: 'bg-red-500',     text: 'text-red-400',     label: 'Strong Sell' },
}

const TREND_MONTHS = { '0m': 'This Month', '-1m': '1M Ago', '-2m': '2M Ago', '-3m': '3M Ago' }

function getActionColor(action) {
  if (!action) return 'text-dark-400'
  const a = action.toLowerCase()
  if (a === 'upgrade' || a === 'init') return 'text-emerald-400'
  if (a === 'downgrade') return 'text-red-400'
  return 'text-yellow-400'
}

function getActionIcon(action) {
  if (!action) return null
  const a = action.toLowerCase()
  if (a === 'upgrade') return <ThumbsUp className="w-3.5 h-3.5" />
  if (a === 'downgrade') return <ThumbsDown className="w-3.5 h-3.5" />
  return <ArrowRightLeft className="w-3.5 h-3.5" />
}

function getRatingBadge(rating) {
  if (!rating) return null
  const r = rating.toLowerCase().replace(/[\s_-]/g, '')
  let color, label
  if (r === 'strongbuy') { color = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'; label = 'STRONG BUY' }
  else if (r === 'buy') { color = 'bg-green-500/15 text-green-400 border-green-500/30'; label = 'BUY' }
  else if (r === 'hold' || r === 'neutral') { color = 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30'; label = 'HOLD' }
  else if (r === 'sell' || r === 'underperform') { color = 'bg-orange-500/15 text-orange-400 border-orange-500/30'; label = 'SELL' }
  else if (r === 'strongsell') { color = 'bg-red-500/15 text-red-400 border-red-500/30'; label = 'STRONG SELL' }
  else { color = 'bg-dark-700/30 text-dark-300 border-dark-600/30'; label = rating.toUpperCase() }
  return <span className={`inline-block text-xs font-bold px-3 py-1.5 rounded-full border ${color}`}>{label}</span>
}

export default function StockDetail() {
  const { symbol } = useParams()
  const { watchlist, addToWatchlist, removeFromWatchlist, addToPortfolio } = useApp()
  const [quote, setQuote] = useState(null)
  const [analysts, setAnalysts] = useState(null)
  const [loading, setLoading] = useState(true)
  const isWatched = watchlist.includes(symbol)
  const [showAddPortfolio, setShowAddPortfolio] = useState(false)
  const [shares, setShares] = useState('')
  const [price, setPrice] = useState('')

  const fetchStockData = useCallback(async (showLoader) => {
    try {
      if (showLoader) setLoading(true)
      const [quoteData, infoData, analystData] = await Promise.all([
        api.getStockQuote(symbol),
        api.getStockInfo(symbol),
        api.getStockAnalysts(symbol).catch(() => null),
      ])
      setQuote({ ...quoteData, ...infoData })
      setAnalysts(analystData)
    } catch (err) {
      console.error('Failed to load stock data:', err)
    } finally {
      setLoading(false)
    }
  }, [symbol])

  useEffect(() => { fetchStockData(true) }, [fetchStockData])

  useEffect(() => {
    const interval = setInterval(() => fetchStockData(false), 10_000)
    return () => clearInterval(interval)
  }, [fetchStockData])

  if (loading || !quote) return <Loader />

  function handleAddPortfolio(e) {
    e.preventDefault()
    if (shares && price) {
      addToPortfolio(symbol, parseFloat(shares), parseFloat(price))
      setShares('')
      setPrice('')
      setShowAddPortfolio(false)
    }
  }

  const stats = [
    { label: 'Open', value: formatCurrency(quote.open) },
    { label: 'Previous Close', value: formatCurrency(quote.previousClose) },
    { label: 'Day High', value: formatCurrency(quote.high) },
    { label: 'Day Low', value: formatCurrency(quote.low) },
    { label: '52W High', value: formatCurrency(quote.high52) },
    { label: '52W Low', value: formatCurrency(quote.low52) },
    { label: 'Volume', value: formatLargeNumber(quote.volume) },
    { label: 'Avg Volume', value: formatLargeNumber(quote.avgVolume) },
    { label: 'Market Cap', value: formatLargeNumber(quote.marketCap) },
    { label: 'P/E Ratio', value: formatNumber(quote.pe) },
    { label: 'EPS', value: formatCurrency(quote.eps) },
    { label: 'Beta', value: formatNumber(quote.beta) },
    { label: 'Dividend', value: formatCurrency(quote.dividend) },
    { label: 'Div Yield', value: formatPercent(quote.dividendYield) },
  ]

  // Analyst distribution data
  const dist = analysts?.distribution || {}
  const totalAnalysts = (dist.strongBuy || 0) + (dist.buy || 0) + (dist.hold || 0) + (dist.sell || 0) + (dist.strongSell || 0)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold text-white">{symbol}</h1>
            <span className="text-sm text-dark-400 bg-dark-800 px-2 py-1 rounded">{quote.sector}</span>
          </div>
          <p className="text-dark-400 text-sm">{quote.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => isWatched ? removeFromWatchlist(symbol) : addToWatchlist(symbol)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all border
              ${isWatched
                ? 'bg-warning/10 text-warning border-warning/30 hover:bg-warning/20'
                : 'bg-dark-800/50 text-dark-300 border-dark-700/50 hover:border-dark-600'
              }`}
          >
            {isWatched ? <StarOff className="w-4 h-4" /> : <Star className="w-4 h-4" />}
            {isWatched ? 'Unwatch' : 'Watch'}
          </button>
          <button
            onClick={() => setShowAddPortfolio(!showAddPortfolio)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add to Portfolio
          </button>
        </div>
      </div>

      {/* Price */}
      <div className="glass-card rounded-xl p-6">
        <div className="flex items-end gap-4 mb-6">
          <span className="text-4xl font-bold text-white">{formatCurrency(quote.price)}</span>
          <div className={`flex items-center gap-1 text-lg font-semibold ${quote.changePercent >= 0 ? 'text-success' : 'text-danger'}`}>
            {quote.changePercent >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
            {formatCurrency(Math.abs(quote.change))} ({formatPercent(quote.changePercent)})
          </div>
        </div>
        <StockChart symbol={symbol} />
      </div>

      {/* Add to Portfolio Form */}
      {showAddPortfolio && (
        <div className="glass-card rounded-xl p-5 animate-slide-up">
          <h3 className="text-sm font-semibold text-white mb-3">Add to Portfolio</h3>
          <form onSubmit={handleAddPortfolio} className="flex items-end gap-4">
            <div>
              <label className="text-xs text-dark-400 block mb-1">Shares</label>
              <input type="number" value={shares} onChange={e => setShares(e.target.value)}
                className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white w-32 focus:outline-none focus:border-primary-500"
                placeholder="100" min="0" step="any" />
            </div>
            <div>
              <label className="text-xs text-dark-400 block mb-1">Avg Price</label>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)}
                className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white w-32 focus:outline-none focus:border-primary-500"
                placeholder={quote.price.toString()} min="0" step="any" />
            </div>
            <button type="submit"
              className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-all">
              Add
            </button>
          </form>
        </div>
      )}

      {/* Analyst Ratings Section */}
      {analysts && totalAnalysts > 0 && (
        <div className="glass-card rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-400" />
            Analyst Ratings
            <span className="text-xs text-dark-500 font-normal ml-2">
              {analysts.numberOfAnalysts || totalAnalysts} analysts
            </span>
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Consensus Rating + Distribution */}
            <div className="lg:col-span-2 space-y-5">
              {/* Consensus Badge */}
              <div className="flex items-center gap-4">
                {getRatingBadge(analysts.recommendation)}
                {analysts.recommendationMean && (
                  <span className="text-sm text-dark-400">
                    Score: <span className="text-white font-semibold">{analysts.recommendationMean.toFixed(2)}</span>
                    <span className="text-dark-500 text-xs ml-1">(1=Strong Buy, 5=Strong Sell)</span>
                  </span>
                )}
              </div>

              {/* Distribution Bars */}
              <div className="space-y-2.5">
                {Object.entries(RATING_COLORS).map(([key, cfg]) => {
                  const count = dist[key] || 0
                  const pct = totalAnalysts > 0 ? (count / totalAnalysts) * 100 : 0
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className={`text-xs font-medium w-24 text-right ${cfg.text}`}>{cfg.label}</span>
                      <div className="flex-1 h-6 bg-dark-800/50 rounded-lg overflow-hidden relative">
                        <div
                          className={`h-full rounded-lg ${cfg.bg} opacity-30 transition-all duration-500`}
                          style={{ width: `${Math.max(pct, 0)}%` }}
                        />
                        <span className="absolute inset-0 flex items-center px-3 text-xs font-bold text-white">
                          {count > 0 && `${count} (${pct.toFixed(0)}%)`}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-white w-8 text-right">{count}</span>
                    </div>
                  )
                })}
              </div>

              {/* Recommendation Trend Table */}
              {analysts.trend && analysts.trend.length > 1 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-dark-300 mb-3">Recommendation Trend</h3>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-dark-700/30">
                        <th className="text-left text-dark-400 py-2 pr-3 font-medium">Rating</th>
                        {analysts.trend.map(t => (
                          <th key={t.period} className="text-center text-dark-400 py-2 px-2 font-medium">
                            {TREND_MONTHS[t.period] || t.period}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(RATING_COLORS).map(([key, cfg]) => (
                        <tr key={key} className="border-b border-dark-700/20">
                          <td className={`py-2 pr-3 font-medium ${cfg.text}`}>{cfg.label}</td>
                          {analysts.trend.map(t => (
                            <td key={t.period} className="text-center py-2 px-2 text-dark-200 font-semibold">
                              {t[key] || 0}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Right: Target Price + Recent Actions */}
            <div className="space-y-5">
              {/* Target Price Range */}
              {analysts.targetMean && (
                <div>
                  <h3 className="text-sm font-semibold text-dark-300 mb-3">Price Target</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-dark-400">Low</span>
                      <span className="text-sm font-semibold text-red-400">{formatCurrency(analysts.targetLow)}</span>
                    </div>
                    {/* Visual range bar */}
                    <div className="relative h-8 bg-dark-800/50 rounded-lg overflow-hidden">
                      {analysts.targetLow && analysts.targetHigh && (() => {
                        const range = analysts.targetHigh - analysts.targetLow
                        if (range <= 0) return null
                        const currentPct = Math.max(0, Math.min(100, ((quote.price - analysts.targetLow) / range) * 100))
                        const meanPct = Math.max(0, Math.min(100, ((analysts.targetMean - analysts.targetLow) / range) * 100))
                        return (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-yellow-500/20 to-emerald-500/20 rounded-lg" />
                            <div className="absolute top-0 bottom-0 w-0.5 bg-white/60" style={{ left: `${currentPct}%` }} title="Current Price">
                              <div className="absolute -top-0.5 -left-1.5 w-3.5 h-3.5 rounded-full bg-primary-500 border-2 border-dark-900" />
                            </div>
                            <div className="absolute top-0 bottom-0 w-0.5 bg-yellow-400/50 border-dashed" style={{ left: `${meanPct}%` }} />
                          </>
                        )
                      })()}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-dark-400">High</span>
                      <span className="text-sm font-semibold text-emerald-400">{formatCurrency(analysts.targetHigh)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div className="p-3 rounded-lg bg-dark-800/30 text-center">
                        <p className="text-[10px] text-dark-400 uppercase">Mean Target</p>
                        <p className="text-sm font-bold text-white">{formatCurrency(analysts.targetMean)}</p>
                        {quote.price && analysts.targetMean && (
                          <p className={`text-[10px] font-medium ${analysts.targetMean > quote.price ? 'text-emerald-400' : 'text-red-400'}`}>
                            {((analysts.targetMean - quote.price) / quote.price * 100).toFixed(1)}% upside
                          </p>
                        )}
                      </div>
                      <div className="p-3 rounded-lg bg-dark-800/30 text-center">
                        <p className="text-[10px] text-dark-400 uppercase">Median Target</p>
                        <p className="text-sm font-bold text-white">{formatCurrency(analysts.targetMedian)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Recent Upgrades/Downgrades */}
              {analysts.recentActions && analysts.recentActions.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-dark-300 mb-3">Recent Analyst Actions</h3>
                  <div className="space-y-1.5 max-h-64 overflow-y-auto">
                    {analysts.recentActions.map((a, i) => (
                      <div key={i} className="flex items-start gap-2 py-2 px-2.5 rounded-lg bg-dark-800/20 hover:bg-dark-800/40 transition-colors">
                        <span className={`mt-0.5 ${getActionColor(a.action)}`}>
                          {getActionIcon(a.action)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-dark-200 truncate">{a.firm}</p>
                          <div className="flex items-center gap-1 text-[10px]">
                            {a.fromGrade && (
                              <>
                                <span className="text-dark-500">{a.fromGrade}</span>
                                <span className="text-dark-600">&rarr;</span>
                              </>
                            )}
                            <span className={getActionColor(a.action)}>{a.toGrade}</span>
                          </div>
                        </div>
                        <span className="text-[10px] text-dark-500 flex-shrink-0">{a.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Key Statistics */}
        <div className="lg:col-span-2 glass-card rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary-400" />
            Key Statistics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map(stat => (
              <div key={stat.label} className="p-3 rounded-lg bg-dark-800/30">
                <p className="text-xs text-dark-400 mb-1">{stat.label}</p>
                <p className="text-sm font-semibold text-white">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Company Info */}
        <div className="glass-card rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary-400" />
            Company Info
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Users className="w-4 h-4 text-dark-400" />
              <div>
                <p className="text-dark-400 text-xs">CEO</p>
                <p className="text-dark-100 font-medium">{quote.ceo || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Users className="w-4 h-4 text-dark-400" />
              <div>
                <p className="text-dark-400 text-xs">Employees</p>
                <p className="text-dark-100 font-medium">{quote.employees?.toLocaleString() || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-dark-400" />
              <div>
                <p className="text-dark-400 text-xs">Founded</p>
                <p className="text-dark-100 font-medium">{quote.founded || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <MapPin className="w-4 h-4 text-dark-400" />
              <div>
                <p className="text-dark-400 text-xs">Headquarters</p>
                <p className="text-dark-100 font-medium">{quote.hq || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Target className="w-4 h-4 text-dark-400" />
              <div>
                <p className="text-dark-400 text-xs">Industry</p>
                <p className="text-dark-100 font-medium">{quote.industry || 'N/A'}</p>
              </div>
            </div>
          </div>
          {quote.description && (
            <div className="mt-4 pt-4 border-t border-dark-700/30">
              <p className="text-xs text-dark-400 leading-relaxed">{quote.description}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
