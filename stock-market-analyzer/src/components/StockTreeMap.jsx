import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

function getColor(changePercent) {
  if (changePercent == null) return '#374151'
  const v = Math.max(-8, Math.min(8, changePercent))
  if (v > 0) {
    const intensity = Math.min(v / 5, 1)
    const r = Math.round(20 + (0 - 20) * intensity)
    const g = Math.round(83 + (170 - 83) * intensity)
    const b = Math.round(45 + (60 - 45) * intensity)
    return `rgb(${r},${g},${b})`
  } else {
    const intensity = Math.min(Math.abs(v) / 5, 1)
    const r = Math.round(127 + (200 - 127) * intensity)
    const g = Math.round(29 + (20 - 29) * intensity)
    const b = Math.round(29 + (20 - 29) * intensity)
    return `rgb(${r},${g},${b})`
  }
}

function getTextColor(changePercent) {
  if (changePercent == null) return '#9ca3af'
  return '#ffffff'
}

// Squarified treemap layout algorithm
function squarify(items, x, y, w, h) {
  if (items.length === 0 || w <= 0 || h <= 0) return []

  const totalValue = items.reduce((sum, item) => sum + item.value, 0)
  if (totalValue <= 0) return []

  const rects = []
  let remaining = [...items]
  let cx = x, cy = y, cw = w, ch = h

  while (remaining.length > 0) {
    const isWide = cw >= ch
    const side = isWide ? ch : cw
    const totalRemaining = remaining.reduce((sum, item) => sum + item.value, 0)

    // Find the best row
    let row = [remaining[0]]
    let rowValue = remaining[0].value
    let bestRatio = Infinity

    for (let i = 1; i < remaining.length; i++) {
      const testRow = [...row, remaining[i]]
      const testValue = rowValue + remaining[i].value
      const rowFraction = testValue / totalRemaining
      const rowSize = rowFraction * (isWide ? cw : ch)

      // Calculate worst aspect ratio in the row
      let worstRatio = 0
      for (const item of testRow) {
        const fraction = item.value / testValue
        const itemSize = fraction * side
        const ratio = Math.max(rowSize / itemSize, itemSize / rowSize)
        worstRatio = Math.max(worstRatio, ratio)
      }

      // Calculate current row's worst ratio
      let currentWorst = 0
      const currentRowSize = (rowValue / totalRemaining) * (isWide ? cw : ch)
      for (const item of row) {
        const fraction = item.value / rowValue
        const itemSize = fraction * side
        const ratio = Math.max(currentRowSize / itemSize, itemSize / currentRowSize)
        currentWorst = Math.max(currentWorst, ratio)
      }

      if (worstRatio <= currentWorst) {
        row.push(remaining[i])
        rowValue += remaining[i].value
        bestRatio = worstRatio
      } else {
        break
      }
    }

    // Layout the row
    const rowFraction = rowValue / totalRemaining
    const rowSize = rowFraction * (isWide ? cw : ch)

    let offset = 0
    for (const item of row) {
      const fraction = item.value / rowValue
      const itemSize = fraction * side

      if (isWide) {
        rects.push({
          ...item,
          x: cx,
          y: cy + offset,
          w: rowSize,
          h: itemSize,
        })
      } else {
        rects.push({
          ...item,
          x: cx + offset,
          y: cy,
          w: itemSize,
          h: rowSize,
        })
      }
      offset += itemSize
    }

    // Update remaining area
    if (isWide) {
      cx += rowSize
      cw -= rowSize
    } else {
      cy += rowSize
      ch -= rowSize
    }

    remaining = remaining.slice(row.length)
  }

  return rects
}

export default function StockTreeMap({ data, height = 600 }) {
  const navigate = useNavigate()
  const [tooltip, setTooltip] = useState(null)

  const { sectorRects, stockRects } = useMemo(() => {
    if (!data || data.length === 0) return { sectorRects: [], stockRects: [] }

    const width = 100 // Use percentage-based coordinates
    const h = 100

    // First level: sectors
    const sectorItems = data.map(sector => ({
      ...sector,
      value: sector.totalMarketCap,
    }))

    const sRects = squarify(sectorItems, 0, 0, width, h)

    // Second level: stocks within each sector
    const allStockRects = []
    for (const sRect of sRects) {
      const padding = 0.3
      const headerHeight = Math.min(3.5, sRect.h * 0.15)
      const innerX = sRect.x + padding
      const innerY = sRect.y + headerHeight + padding * 0.5
      const innerW = sRect.w - padding * 2
      const innerH = sRect.h - headerHeight - padding * 1.5

      if (innerW <= 0 || innerH <= 0) continue

      const stockItems = sRect.stocks
        .filter(s => s.marketCap > 0)
        .map(s => ({ ...s, value: s.marketCap }))

      const stockLayouts = squarify(stockItems, innerX, innerY, innerW, innerH)
      allStockRects.push(...stockLayouts)
    }

    return { sectorRects: sRects, stockRects: allStockRects }
  }, [data])

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-dark-400 text-sm">
        No tree map data available. Run `npm run sync` first.
      </div>
    )
  }

  return (
    <div className="relative w-full" style={{ height }}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-full"
        style={{ fontSize: '1px' }}
      >
        {/* Sector backgrounds and labels */}
        {sectorRects.map(sr => (
          <g key={sr.name}>
            <rect
              x={sr.x}
              y={sr.y}
              width={sr.w}
              height={sr.h}
              fill="#111827"
              stroke="#1f2937"
              strokeWidth="0.15"
            />
            {sr.w > 5 && sr.h > 3 && (
              <text
                x={sr.x + 0.5}
                y={sr.y + 1.8}
                fill="#9ca3af"
                fontSize={Math.min(1.6, sr.w * 0.08)}
                fontWeight="700"
                fontFamily="system-ui, sans-serif"
              >
                {sr.name.toUpperCase()}
              </text>
            )}
          </g>
        ))}

        {/* Stock cells */}
        {stockRects.map(sr => {
          const cp = sr.changePercent || 0
          const showSymbol = sr.w > 2.5 && sr.h > 2
          const showChange = sr.w > 3 && sr.h > 3.5
          const fontSize = Math.min(
            sr.w * 0.22,
            sr.h * 0.2,
            2.2
          )
          const changeFontSize = fontSize * 0.7

          return (
            <g
              key={sr.symbol}
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(`/stock/${sr.symbol}`)}
              onMouseEnter={(e) => {
                const rect = e.currentTarget.closest('svg').getBoundingClientRect()
                const px = (sr.x + sr.w / 2) / 100 * rect.width
                const py = (sr.y) / 100 * rect.height
                setTooltip({
                  symbol: sr.symbol,
                  name: sr.name,
                  price: sr.price,
                  changePercent: sr.changePercent,
                  marketCap: sr.marketCap,
                  left: px,
                  top: py,
                })
              }}
              onMouseLeave={() => setTooltip(null)}
            >
              <rect
                x={sr.x + 0.08}
                y={sr.y + 0.08}
                width={Math.max(sr.w - 0.16, 0)}
                height={Math.max(sr.h - 0.16, 0)}
                fill={getColor(sr.changePercent)}
                rx="0.15"
                ry="0.15"
                opacity="0.9"
              />
              {showSymbol && (
                <text
                  x={sr.x + sr.w / 2}
                  y={sr.y + sr.h / 2 + (showChange ? -changeFontSize * 0.3 : fontSize * 0.35)}
                  fill={getTextColor(sr.changePercent)}
                  fontSize={fontSize}
                  fontWeight="700"
                  fontFamily="system-ui, sans-serif"
                  textAnchor="middle"
                >
                  {sr.symbol}
                </text>
              )}
              {showChange && (
                <text
                  x={sr.x + sr.w / 2}
                  y={sr.y + sr.h / 2 + fontSize * 0.7}
                  fill={getTextColor(sr.changePercent)}
                  fontSize={changeFontSize}
                  fontWeight="500"
                  fontFamily="system-ui, sans-serif"
                  textAnchor="middle"
                  opacity="0.85"
                >
                  {cp >= 0 ? '+' : ''}{cp.toFixed(2)}%
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-50 pointer-events-none bg-dark-800 border border-dark-600 rounded-lg px-3 py-2 shadow-xl"
          style={{
            left: tooltip.left,
            top: tooltip.top - 10,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <p className="text-sm font-bold text-white">{tooltip.symbol}</p>
          <p className="text-xs text-dark-400 mb-1">{tooltip.name}</p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-dark-200">${tooltip.price?.toFixed(2)}</span>
            <span className={`text-xs font-semibold ${tooltip.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {tooltip.changePercent >= 0 ? '+' : ''}{tooltip.changePercent?.toFixed(2)}%
            </span>
          </div>
          {tooltip.marketCap && (
            <p className="text-[10px] text-dark-500 mt-0.5">
              MCap: ${(tooltip.marketCap / 1e9).toFixed(1)}B
            </p>
          )}
        </div>
      )}
    </div>
  )
}
