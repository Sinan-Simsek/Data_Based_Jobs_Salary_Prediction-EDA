import { useState, useEffect, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Zap,
} from 'lucide-react'
import * as api from '../services/api'
import { useApp } from '../context/AppContext'
import { formatCurrency, formatPercent, formatLargeNumber } from '../utils/formatters'
import StockChart from '../components/StockChart'
import StockTreeMap from '../components/StockTreeMap'
import Loader from '../components/Loader'

export default function Dashboard() {
  const { watchlist, portfolio } = useApp()

  const [indices, setIndices] = useState(null)
  const [movers, setMovers] = useState(null)
  const [sectors, setSectors] = useState(null)
  const [news, setNews] = useState(null)
  const [treeMapData, setTreeMapData] = useState(null)
  const [watchlistQuotes, setWatchlistQuotes] = useState({})
  const [portfolioData, setPortfolioData] = useState(null)
  const [loading, setLoading] = useState(true)

  const watchlistRef = useRef(watchlist)
  const portfolioRef = useRef(portfolio)
  watchlistRef.current = watchlist
  portfolioRef.current = portfolio

  // Load market data
  const loadMarketData = useCallback(async () => {
    try {
      const [indicesData, moversData, sectorsData, newsData, treeData] = await Promise.all([
        api.getMarketIndices(),
        api.getMarketMovers(),
        api.getSectorPerformance(),
        api.getMarketNews(),
        api.getTreeMap().catch(() => []),
      ])
      setIndices(indicesData)
      setMovers(moversData)
      setSectors(sectorsData)
      setNews(newsData.slice(0, 5))
      setTreeMapData(treeData)
    } catch (err) {
      console.error('Failed to load market data:', err)
    }
  }, [])

  // Load watchlist quotes
  const loadWatchlistQuotes = useCallback(async () => {
    const wl = watchlistRef.current
    if (wl.length === 0) { setWatchlistQuotes({}); return }
    try {
      const quotes = await Promise.all(
        wl.slice(0, 6).map(symbol => api.getStockQuote(symbol))
      )
      const map = {}
      wl.slice(0, 6).forEach((symbol, i) => { map[symbol] = quotes[i] })
      setWatchlistQuotes(map)
    } catch (err) {
      console.error('Failed to load watchlist quotes:', err)
    }
  }, [])

  // Load portfolio quotes
  const loadPortfolioData = useCallback(async () => {
    const pf = portfolioRef.current
    if (pf.length === 0) { setPortfolioData([]); return }
    try {
      const quotes = await Promise.all(
        pf.map(p => api.getStockQuote(p.symbol))
      )
      const data = pf.map((p, i) => {
        const quote = quotes[i]
        const currentValue = p.shares * quote.price
        const costBasis = p.shares * p.avgPrice
        const gain = currentValue - costBasis
        const gainPercent = (gain / costBasis) * 100
        return { ...p, quote, currentValue, costBasis, gain, gainPercent }
      })
      setPortfolioData(data)
    } catch (err) {
      console.error('Failed to load portfolio data:', err)
    }
  }, [])

  // Initial load + 10s auto-refresh
  useEffect(() => {
    loadMarketData()
    loadWatchlistQuotes()
    loadPortfolioData()
    const interval = setInterval(() => {
      loadMarketData()
      loadWatchlistQuotes()
      loadPortfolioData()
    }, 10_000)
    return () => clearInterval(interval)
  }, [loadMarketData, loadWatchlistQuotes, loadPortfolioData])

  // Re-fetch when watchlist/portfolio changes
  useEffect(() => { loadWatchlistQuotes() }, [watchlist, loadWatchlistQuotes])
  useEffect(() => { loadPortfolioData() }, [portfolio, loadPortfolioData])

  // Determine overall loading state
  useEffect(() => {
    if (indices && movers && sectors && news && portfolioData !== null) {
      setLoading(false)
    }
  }, [indices, movers, sectors, news, portfolioData])

  if (loading) {
    return <Loader text="Loading dashboard..." />
  }

  const totalValue = portfolioData.reduce((s, p) => s + p.currentValue, 0)
  const totalGain = portfolioData.reduce((s, p) => s + p.gain, 0)
  const totalGainPercent = portfolioData.length > 0 ? (totalGain / portfolioData.reduce((s, p) => s + p.costBasis, 0)) * 100 : 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-dark-400 uppercase tracking-wider">Portfolio Value</span>
            <DollarSign className="w-4 h-4 text-primary-400" />
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalValue)}</p>
          <p className={`text-sm mt-1 font-medium ${totalGain >= 0 ? 'text-success' : 'text-danger'}`}>
            {totalGain >= 0 ? <ArrowUpRight className="w-3 h-3 inline" /> : <ArrowDownRight className="w-3 h-3 inline" />}
            {' '}{formatCurrency(Math.abs(totalGain))} ({formatPercent(totalGainPercent)})
          </p>
        </div>

        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-dark-400 uppercase tracking-wider">S&P 500</span>
            <Activity className="w-4 h-4 text-success" />
          </div>
          <p className="text-2xl font-bold text-white">{indices[1].value.toLocaleString()}</p>
          <p className={`text-sm mt-1 font-medium ${indices[1].changePercent >= 0 ? 'text-success' : 'text-danger'}`}>
            {formatPercent(indices[1].changePercent)} today
          </p>
        </div>

        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-dark-400 uppercase tracking-wider">NASDAQ</span>
            <TrendingUp className="w-4 h-4 text-primary-400" />
          </div>
          <p className="text-2xl font-bold text-white">{indices[2].value.toLocaleString()}</p>
          <p className={`text-sm mt-1 font-medium ${indices[2].changePercent >= 0 ? 'text-success' : 'text-danger'}`}>
            {formatPercent(indices[2].changePercent)} today
          </p>
        </div>

        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-dark-400 uppercase tracking-wider">VIX</span>
            <Zap className="w-4 h-4 text-warning" />
          </div>
          <p className="text-2xl font-bold text-white">{indices[4].value}</p>
          <p className={`text-sm mt-1 font-medium ${indices[4].changePercent >= 0 ? 'text-danger' : 'text-success'}`}>
            {formatPercent(indices[4].changePercent)} today
          </p>
        </div>
      </div>

      {/* Stock Market Tree Map */}
      {treeMapData && treeMapData.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-400" />
              Stock Market Map
            </h2>
            <div className="flex items-center gap-4 text-[10px] text-dark-400">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-red-600 inline-block"></span> Losing</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-gray-600 inline-block"></span> Flat</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-sm bg-green-600 inline-block"></span> Gaining</span>
            </div>
          </div>
          <StockTreeMap data={treeMapData} height={550} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Watchlist */}
        <div className="lg:col-span-2 glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Watchlist</h2>
            <Link to="/watchlist" className="text-xs text-primary-400 hover:text-primary-300 font-medium">View All</Link>
          </div>
          <div className="space-y-2">
            {watchlist.slice(0, 6).map(symbol => {
              const quote = watchlistQuotes[symbol]
              if (!quote) return null
              return (
                <Link
                  key={symbol}
                  to={`/stock/${symbol}`}
                  className="flex items-center justify-between py-3 px-3 rounded-lg hover:bg-dark-800/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-semibold text-white">{symbol}</p>
                      <p className="text-xs text-dark-400">{quote.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <StockChart symbol={symbol} compact />
                    <div className="text-right min-w-[100px]">
                      <p className="text-sm font-semibold text-white">{formatCurrency(quote.price)}</p>
                      <p className={`text-xs font-medium ${quote.changePercent >= 0 ? 'text-success' : 'text-danger'}`}>
                        {formatPercent(quote.changePercent)}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Top Movers */}
        <div className="glass-card rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Top Movers</h2>
          <div className="mb-4">
            <h3 className="text-xs font-medium text-success uppercase tracking-wider mb-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Gainers
            </h3>
            {movers.gainers.slice(0, 3).map(stock => (
              <Link
                key={stock.symbol}
                to={`/stock/${stock.symbol}`}
                className="flex items-center justify-between py-2 hover:bg-dark-800/30 rounded px-2 transition-colors"
              >
                <div>
                  <span className="text-sm font-semibold text-white">{stock.symbol}</span>
                  <span className="text-xs text-dark-400 ml-2">{formatCurrency(stock.price)}</span>
                </div>
                <span className="text-xs font-semibold text-success bg-success/10 px-2 py-1 rounded">
                  {formatPercent(stock.changePercent)}
                </span>
              </Link>
            ))}
          </div>
          <div>
            <h3 className="text-xs font-medium text-danger uppercase tracking-wider mb-2 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" /> Losers
            </h3>
            {movers.losers.slice(0, 3).map(stock => (
              <Link
                key={stock.symbol}
                to={`/stock/${stock.symbol}`}
                className="flex items-center justify-between py-2 hover:bg-dark-800/30 rounded px-2 transition-colors"
              >
                <div>
                  <span className="text-sm font-semibold text-white">{stock.symbol}</span>
                  <span className="text-xs text-dark-400 ml-2">{formatCurrency(stock.price)}</span>
                </div>
                <span className="text-xs font-semibold text-danger bg-danger/10 px-2 py-1 rounded">
                  {formatPercent(stock.changePercent)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sector Performance */}
        <div className="lg:col-span-2 glass-card rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4">Sector Performance</h2>
          <div className="grid grid-cols-2 gap-3">
            {sectors.map(sector => (
              <div key={sector.name} className="flex items-center justify-between p-3 rounded-lg bg-dark-800/30">
                <div>
                  <p className="text-sm font-medium text-dark-200">{sector.name}</p>
                  <p className="text-xs text-dark-400">{sector.stocks} stocks</p>
                </div>
                <span className={`text-sm font-semibold ${sector.change >= 0 ? 'text-success' : 'text-danger'}`}>
                  {formatPercent(sector.change)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Latest News */}
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Latest News</h2>
            <Link to="/news" className="text-xs text-primary-400 hover:text-primary-300 font-medium">View All</Link>
          </div>
          <div className="space-y-3">
            {news.map(item => (
              <div key={item.id} className="pb-3 border-b border-dark-700/30 last:border-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-semibold text-primary-400 bg-primary-500/10 px-1.5 py-0.5 rounded">{item.category}</span>
                  <span className="text-[10px] text-dark-500">{item.time}</span>
                </div>
                <p className="text-sm text-dark-200 font-medium leading-snug">{item.title}</p>
                <p className="text-xs text-dark-500 mt-1">{item.source}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
