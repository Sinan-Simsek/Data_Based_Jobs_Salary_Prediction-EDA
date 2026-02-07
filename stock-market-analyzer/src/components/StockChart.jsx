import { useState, useEffect } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import { getStockHistory } from '../services/api'
import { formatCurrency, formatDate, formatLargeNumber } from '../utils/formatters'
import { Activity } from 'lucide-react'

const TIME_RANGES = [
  { label: '1W', value: '1w' },
  { label: '1M', value: '1m' },
  { label: '3M', value: '3m' },
  { label: '6M', value: '6m' },
  { label: '1Y', value: '1y' },
  { label: '5Y', value: '5y' },
]

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const data = payload[0].payload
  return (
    <div className="bg-dark-800 border border-dark-600 rounded-lg px-4 py-3 shadow-xl">
      <p className="text-xs text-dark-400 mb-1">{formatDate(data.date)}</p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <span className="text-dark-400">Open</span>
        <span className="text-dark-100 font-medium">{formatCurrency(data.open)}</span>
        <span className="text-dark-400">High</span>
        <span className="text-success font-medium">{formatCurrency(data.high)}</span>
        <span className="text-dark-400">Low</span>
        <span className="text-danger font-medium">{formatCurrency(data.low)}</span>
        <span className="text-dark-400">Close</span>
        <span className="text-dark-100 font-semibold">{formatCurrency(data.close)}</span>
        <span className="text-dark-400">Volume</span>
        <span className="text-dark-100 font-medium">{formatLargeNumber(data.volume)}</span>
      </div>
    </div>
  )
}

export default function StockChart({ symbol, compact = false }) {
  const [range, setRange] = useState('1y')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getStockHistory(symbol, range)
      .then(d => { if (!cancelled) { setData(d); setLoading(false) } })
      .catch(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [symbol, range])

  const isPositive = data.length >= 2 && data[data.length - 1].close >= data[0].close
  const color = isPositive ? '#10b981' : '#ef4444'
  const gradientId = `gradient-${symbol}-${range}`

  if (compact) {
    if (loading || data.length === 0) {
      return <div className="h-16 w-32 bg-dark-800/30 rounded animate-pulse" />
    }
    return (
      <div className="h-16 w-32">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.slice(-30)}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="close"
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#${gradientId})`}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )
  }

  const minPrice = data.length > 0 ? Math.min(...data.map(d => d.low)) * 0.998 : 0
  const maxPrice = data.length > 0 ? Math.max(...data.map(d => d.high)) * 1.002 : 100

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-4">
        {TIME_RANGES.map(r => (
          <button
            key={r.value}
            onClick={() => setRange(r.value)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all
              ${range === r.value
                ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30'
                : 'text-dark-400 hover:text-dark-200 hover:bg-dark-800/50 border border-transparent'
              }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="h-80 flex items-center justify-center">
          <Activity className="w-6 h-6 text-primary-400 animate-spin" />
        </div>
      ) : data.length === 0 ? (
        <div className="h-80 flex items-center justify-center text-dark-400 text-sm">No data available</div>
      ) : (
        <>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.06)" />
                <XAxis
                  dataKey="date"
                  tickFormatter={(d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  stroke="#475569"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  domain={[minPrice, maxPrice]}
                  tickFormatter={(v) => `$${v.toFixed(0)}`}
                  stroke="#475569"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  width={60}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="close"
                  stroke={color}
                  strokeWidth={2}
                  fill={`url(#${gradientId})`}
                  animationDuration={800}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="h-24 mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <XAxis dataKey="date" hide />
                <YAxis hide />
                <Tooltip
                  formatter={(value) => [formatLargeNumber(value), 'Volume']}
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
                  labelFormatter={(label) => formatDate(label)}
                />
                <Bar dataKey="volume" fill="rgba(59,130,246,0.3)" radius={[1, 1, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}
