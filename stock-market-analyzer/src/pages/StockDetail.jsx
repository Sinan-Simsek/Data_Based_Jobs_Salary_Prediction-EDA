import { useEffect, useState } from 'react'
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
} from 'lucide-react'
import * as api from '../services/api'
import { useApp } from '../context/AppContext'
import { formatCurrency, formatPercent, formatLargeNumber, formatNumber } from '../utils/formatters'
import StockChart from '../components/StockChart'
import Loader from '../components/Loader'

export default function StockDetail() {
  const { symbol } = useParams()
  const { watchlist, addToWatchlist, removeFromWatchlist, addToPortfolio } = useApp()
  const [quote, setQuote] = useState(null)
  const [loading, setLoading] = useState(true)
  const isWatched = watchlist.includes(symbol)
  const [showAddPortfolio, setShowAddPortfolio] = useState(false)
  const [shares, setShares] = useState('')
  const [price, setPrice] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([api.getStockQuote(symbol), api.getStockInfo(symbol)])
      .then(([quoteData, infoData]) => {
        if (!cancelled) {
          setQuote({ ...quoteData, ...infoData })
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [symbol])

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
    { label: 'Target Price', value: formatCurrency(quote.targetPrice) },
    { label: 'Analyst Rating', value: quote.analystRating },
  ]

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
              <input
                type="number"
                value={shares}
                onChange={e => setShares(e.target.value)}
                className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white w-32 focus:outline-none focus:border-primary-500"
                placeholder="100"
                min="0"
                step="any"
              />
            </div>
            <div>
              <label className="text-xs text-dark-400 block mb-1">Avg Price</label>
              <input
                type="number"
                value={price}
                onChange={e => setPrice(e.target.value)}
                className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white w-32 focus:outline-none focus:border-primary-500"
                placeholder={quote.price.toString()}
                min="0"
                step="any"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-all"
            >
              Add
            </button>
          </form>
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
