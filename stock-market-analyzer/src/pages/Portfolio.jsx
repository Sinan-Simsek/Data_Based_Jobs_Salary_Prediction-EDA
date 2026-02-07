import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import * as api from '../services/api'
import { useApp } from '../context/AppContext'
import { formatCurrency, formatPercent, formatLargeNumber } from '../utils/formatters'
import StockChart from '../components/StockChart'
import Loader from '../components/Loader'
import {
  PieChart as RePieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#f97316']

export default function Portfolio() {
  const { portfolio, removeFromPortfolio } = useApp()
  const [holdings, setHoldings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchQuotes() {
      if (portfolio.length === 0) {
        setHoldings([])
        setLoading(false)
        return
      }
      try {
        setLoading(true)
        const results = await Promise.all(
          portfolio.map(async (p) => {
            const quote = await api.getStockQuote(p.symbol)
            const currentValue = p.shares * quote.price
            const costBasis = p.shares * p.avgPrice
            const gain = currentValue - costBasis
            const gainPercent = (gain / costBasis) * 100
            return { ...p, quote, currentValue, costBasis, gain, gainPercent }
          })
        )
        setHoldings(results)
      } catch (err) {
        console.error('Failed to load portfolio quotes:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchQuotes()
  }, [portfolio])

  if (loading) return <Loader text="Loading portfolio..." />

  const totalValue = holdings.reduce((s, h) => s + h.currentValue, 0)
  const totalCost = holdings.reduce((s, h) => s + h.costBasis, 0)
  const totalGain = totalValue - totalCost
  const totalGainPercent = totalCost > 0 ? (totalGain / totalCost) * 100 : 0

  const pieData = holdings.map(h => ({
    name: h.symbol,
    value: h.currentValue,
  }))

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Briefcase className="w-6 h-6 text-primary-400" />
        Portfolio
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-dark-400 uppercase tracking-wider">Total Value</span>
            <DollarSign className="w-4 h-4 text-primary-400" />
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalValue)}</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-dark-400 uppercase tracking-wider">Total Cost</span>
            <DollarSign className="w-4 h-4 text-dark-400" />
          </div>
          <p className="text-2xl font-bold text-white">{formatCurrency(totalCost)}</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-dark-400 uppercase tracking-wider">Total Gain/Loss</span>
            {totalGain >= 0 ? <ArrowUpRight className="w-4 h-4 text-success" /> : <ArrowDownRight className="w-4 h-4 text-danger" />}
          </div>
          <p className={`text-2xl font-bold ${totalGain >= 0 ? 'text-success' : 'text-danger'}`}>{formatCurrency(totalGain)}</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-dark-400 uppercase tracking-wider">Return</span>
            {totalGainPercent >= 0 ? <TrendingUp className="w-4 h-4 text-success" /> : <TrendingDown className="w-4 h-4 text-danger" />}
          </div>
          <p className={`text-2xl font-bold ${totalGainPercent >= 0 ? 'text-success' : 'text-danger'}`}>{formatPercent(totalGainPercent)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Holdings Table */}
        <div className="lg:col-span-2 glass-card rounded-xl overflow-hidden">
          <div className="p-5 border-b border-dark-700/30">
            <h2 className="text-lg font-semibold text-white">Holdings</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700/30">
                  <th className="text-left text-xs font-medium text-dark-400 uppercase px-5 py-3">Stock</th>
                  <th className="text-right text-xs font-medium text-dark-400 uppercase px-5 py-3">Shares</th>
                  <th className="text-right text-xs font-medium text-dark-400 uppercase px-5 py-3">Avg Price</th>
                  <th className="text-right text-xs font-medium text-dark-400 uppercase px-5 py-3">Current</th>
                  <th className="text-right text-xs font-medium text-dark-400 uppercase px-5 py-3">Value</th>
                  <th className="text-right text-xs font-medium text-dark-400 uppercase px-5 py-3">Gain/Loss</th>
                  <th className="text-center text-xs font-medium text-dark-400 uppercase px-5 py-3">Chart</th>
                  <th className="text-center text-xs font-medium text-dark-400 uppercase px-3 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {holdings.map(h => (
                  <tr key={h.symbol} className="border-b border-dark-700/20 hover:bg-dark-800/30 transition-colors">
                    <td className="px-5 py-4">
                      <Link to={`/stock/${h.symbol}`} className="text-sm font-semibold text-primary-400 hover:text-primary-300">
                        {h.symbol}
                      </Link>
                      <p className="text-xs text-dark-400">{h.quote.name}</p>
                    </td>
                    <td className="px-5 py-4 text-right text-sm text-white">{h.shares}</td>
                    <td className="px-5 py-4 text-right text-sm text-dark-300">{formatCurrency(h.avgPrice)}</td>
                    <td className="px-5 py-4 text-right text-sm font-semibold text-white">{formatCurrency(h.quote.price)}</td>
                    <td className="px-5 py-4 text-right text-sm text-white">{formatCurrency(h.currentValue)}</td>
                    <td className="px-5 py-4 text-right">
                      <p className={`text-sm font-semibold ${h.gain >= 0 ? 'text-success' : 'text-danger'}`}>
                        {formatCurrency(h.gain)}
                      </p>
                      <p className={`text-xs ${h.gainPercent >= 0 ? 'text-success' : 'text-danger'}`}>
                        {formatPercent(h.gainPercent)}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-center">
                        <StockChart symbol={h.symbol} compact />
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <button
                        onClick={() => removeFromPortfolio(h.symbol)}
                        className="p-1.5 rounded-lg hover:bg-danger/10 text-dark-500 hover:text-danger transition-colors"
                        title="Remove from portfolio"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {holdings.length === 0 && (
            <div className="text-center py-12 text-dark-400">
              <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No holdings yet. Add stocks from the stock detail page.</p>
            </div>
          )}
        </div>

        {/* Allocation Pie Chart */}
        <div className="glass-card rounded-xl p-5">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-primary-400" />
            Allocation
          </h2>
          {pieData.length > 0 ? (
            <>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                    />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4">
                {holdings.map((h, i) => {
                  const pct = totalValue > 0 ? (h.currentValue / totalValue * 100) : 0
                  return (
                    <div key={h.symbol} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-dark-200">{h.symbol}</span>
                      </div>
                      <span className="text-dark-400">{pct.toFixed(1)}%</span>
                    </div>
                  )
                })}
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-dark-400">
              <p>No data to display</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
