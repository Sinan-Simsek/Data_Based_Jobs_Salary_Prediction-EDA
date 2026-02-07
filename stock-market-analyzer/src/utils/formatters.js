export function formatCurrency(value, decimals = 2) {
  if (value == null || isNaN(value)) return '—'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatNumber(value, decimals = 2) {
  if (value == null || isNaN(value)) return '—'
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

export function formatLargeNumber(value) {
  if (value == null || isNaN(value)) return '—'
  const abs = Math.abs(value)
  if (abs >= 1e12) return (value / 1e12).toFixed(2) + 'T'
  if (abs >= 1e9) return (value / 1e9).toFixed(2) + 'B'
  if (abs >= 1e6) return (value / 1e6).toFixed(2) + 'M'
  if (abs >= 1e3) return (value / 1e3).toFixed(2) + 'K'
  return value.toFixed(2)
}

export function formatPercent(value, decimals = 2) {
  if (value == null || isNaN(value)) return '—'
  const sign = value >= 0 ? '+' : ''
  return `${sign}${value.toFixed(decimals)}%`
}

export function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}
