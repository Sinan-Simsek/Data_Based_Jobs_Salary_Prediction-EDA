import { useMemo } from 'react'
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
import { getMarketIndices, getTopMovers, getStockQuote, getSectorPerformance, getMarketNews } from '../services/stockData'
import { useApp } from '../context/AppContext'
import { formatCurrency, formatPercent, formatLargeNumber } from '../utils/formatters'
import StockChart from '../components/StockChart'

export default function Dashboard() {
  const { watchlist, portfolio } = useApp()
  const indices = getMarketIndices()
  const movers = useMemo(() => getTopMovers(), [])
  const sectors = useMemo(() => getSectorPerformance(), [])
  const news = useMemo(() => getMarketNews().slice(0, 5), [])

  const portfolioData = useMemo(() => {
    return portfolio.map(p => {
      const quote = getStockQuote(p.symbol)
      const currentValue = p.shares * quote.price
      const costBasis = p.shares * p.avgPrice
      const gain = currentValue - costBasis
      const gainPercent = (gain / costBasis) * 100
      return { ...p, quote, currentValue, costBasis, gain, gainPercent }
    })
  }, [portfolio])

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Watchlist */}
        <div className="lg:col-span-2 glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Watchlist</h2>
            <Link to="/watchlist" className="text-xs text-primary-400 hover:text-primary-300 font-medium">View All</Link>
          </div>
          <div className="space-y-2">
            {watchlist.slice(0, 6).map(symbol => {
              const quote = getStockQuote(symbol)
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
