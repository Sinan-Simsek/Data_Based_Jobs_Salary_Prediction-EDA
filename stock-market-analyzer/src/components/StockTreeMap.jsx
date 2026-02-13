import { useState, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

function getColor(cp) {
  if (cp == null) return '#374151'
  const v = Math.max(-6, Math.min(6, cp))
  if (v > 0) {
    const t = Math.min(v / 4, 1)
    return `rgb(${Math.round(30 - 10 * t)},${Math.round(80 + 80 * t)},${Math.round(45 + 15 * t)})`
  }
  const t = Math.min(Math.abs(v) / 4, 1)
  return `rgb(${Math.round(120 + 70 * t)},${Math.round(30 - 10 * t)},${Math.round(30 - 10 * t)})`
}

// Squarified treemap layout
function squarify(items, x, y, w, h) {
  if (!items.length || w <= 0 || h <= 0) return []
  const total = items.reduce((s, i) => s + i.value, 0)
  if (total <= 0) return []

  const rects = []
  let rem = [...items], cx = x, cy = y, cw = w, ch = h

  while (rem.length > 0) {
    const wide = cw >= ch
    const side = wide ? ch : cw
    const remTotal = rem.reduce((s, i) => s + i.value, 0)

    let row = [rem[0]], rowVal = rem[0].value

    for (let i = 1; i < rem.length; i++) {
      const nv = rowVal + rem[i].value
      const rs = (nv / remTotal) * (wide ? cw : ch)
      // Worst ratio with new item
      let wr = 0
      for (const it of [...row, rem[i]]) {
        const is2 = (it.value / nv) * side
        wr = Math.max(wr, Math.max(rs / is2, is2 / rs))
      }
      // Worst ratio without
      const crs = (rowVal / remTotal) * (wide ? cw : ch)
      let cr = 0
      for (const it of row) {
        const is2 = (it.value / rowVal) * side
        cr = Math.max(cr, Math.max(crs / is2, is2 / crs))
      }
      if (wr <= cr) { row.push(rem[i]); rowVal = nv }
      else break
    }

    const rs = (rowVal / remTotal) * (wide ? cw : ch)
    let off = 0
    for (const it of row) {
      const is2 = (it.value / rowVal) * side
      if (wide) rects.push({ ...it, x: cx, y: cy + off, w: rs, h: is2 })
      else rects.push({ ...it, x: cx + off, y: cy, w: is2, h: rs })
      off += is2
    }
    if (wide) { cx += rs; cw -= rs } else { cy += rs; ch -= rs }
    rem = rem.slice(row.length)
  }
  return rects
}

export default function StockTreeMap({ data, height = 600 }) {
  const navigate = useNavigate()
  const containerRef = useRef(null)
  const [tooltip, setTooltip] = useState(null)

  const layout = useMemo(() => {
    if (!data || !data.length) return { sectors: [], stocks: [] }

    const W = 1000, H = 600
    const sectorItems = data.map(s => ({ ...s, value: s.totalMarketCap }))
    const sRects = squarify(sectorItems, 0, 0, W, H)

    const allStocks = []
    for (const sr of sRects) {
      const hdr = Math.max(16, Math.min(22, sr.h * 0.06))
      const pad = 2
      const ix = sr.x + pad, iy = sr.y + hdr + 1
      const iw = sr.w - pad * 2, ih = sr.h - hdr - pad - 1
      if (iw <= 0 || ih <= 0) continue

      const items = sr.stocks.filter(s => s.marketCap > 0).map(s => ({ ...s, value: s.marketCap, sector: sr.name }))
      const stockRects = squarify(items, ix, iy, iw, ih)
      allStocks.push(...stockRects)
    }
    return { sectors: sRects, stocks: allStocks, W, H }
  }, [data])

  if (!data || !data.length) {
    return <div className="flex items-center justify-center h-64 text-dark-400 text-sm">No tree map data. Run npm run sync first.</div>
  }

  const { sectors, stocks, W, H } = layout

  function handleMouseEnter(stock, e) {
    const rect = containerRef.current.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    setTooltip({ ...stock, left: mx, top: my })
  }

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden rounded-lg" style={{ height, background: '#0b1120' }}>
      {/* Sector backgrounds + labels */}
      {sectors.map(sr => {
        const hdr = Math.max(16, Math.min(22, sr.h / H * height * 0.06))
        return (
          <div key={sr.name} className="absolute" style={{
            left: `${sr.x / W * 100}%`, top: `${sr.y / H * 100}%`,
            width: `${sr.w / W * 100}%`, height: `${sr.h / H * 100}%`,
            borderRight: '1px solid #1e293b', borderBottom: '1px solid #1e293b',
          }}>
            {sr.w / W * 100 > 6 && sr.h / H * 100 > 5 && (
              <div className="absolute top-0 left-0 right-0 px-1.5 flex items-center" style={{ height: `${hdr / (sr.h / H * height) * 100}%` }}>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider truncate">
                  {sr.name.length > 20 ? sr.name.replace('Services', 'Svcs').replace('Communication', 'Comm') : sr.name}
                </span>
              </div>
            )}
          </div>
        )
      })}

      {/* Stock cells */}
      {stocks.map(sr => {
        const wp = sr.w / W * 100
        const hp = sr.h / H * 100
        const wPx = sr.w / W * (containerRef.current?.clientWidth || 1200)
        const hPx = sr.h / H * height
        const cp = sr.changePercent || 0

        // Determine what text to show based on pixel size
        const showSymbol = wPx > 28 && hPx > 20
        const showChange = wPx > 38 && hPx > 32
        const symbolSize = Math.max(8, Math.min(22, Math.min(wPx * 0.18, hPx * 0.22)))
        const changeSize = Math.max(7, symbolSize * 0.7)

        return (
          <div
            key={sr.symbol}
            className="absolute cursor-pointer transition-opacity hover:opacity-80 flex flex-col items-center justify-center overflow-hidden"
            style={{
              left: `${sr.x / W * 100}%`, top: `${sr.y / H * 100}%`,
              width: `${wp}%`, height: `${hp}%`,
              backgroundColor: getColor(sr.changePercent),
              border: '0.5px solid rgba(0,0,0,0.3)',
            }}
            onClick={() => navigate(`/stock/${sr.symbol}`)}
            onMouseEnter={(e) => handleMouseEnter(sr, e)}
            onMouseMove={(e) => {
              const rect = containerRef.current.getBoundingClientRect()
              setTooltip(prev => prev ? { ...prev, left: e.clientX - rect.left, top: e.clientY - rect.top } : null)
            }}
            onMouseLeave={() => setTooltip(null)}
          >
            {showSymbol && (
              <span className="font-bold text-white leading-none" style={{ fontSize: symbolSize }}>
                {sr.symbol}
              </span>
            )}
            {showChange && (
              <span className="text-white/80 leading-none mt-0.5" style={{ fontSize: changeSize }}>
                {cp >= 0 ? '+' : ''}{cp.toFixed(2)}%
              </span>
            )}
          </div>
        )
      })}

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute z-50 pointer-events-none bg-gray-900/95 border border-gray-600 rounded-lg px-3 py-2 shadow-2xl backdrop-blur-sm"
          style={{
            left: Math.min(tooltip.left + 12, (containerRef.current?.clientWidth || 800) - 180),
            top: Math.max(tooltip.top - 70, 4),
          }}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-bold text-white">{tooltip.symbol}</span>
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${tooltip.changePercent >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {tooltip.changePercent >= 0 ? '+' : ''}{tooltip.changePercent?.toFixed(2)}%
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mb-1">{tooltip.name}</p>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="text-gray-300">${tooltip.price?.toFixed(2)}</span>
            {tooltip.marketCap && (
              <span className="text-gray-500">MCap: ${(tooltip.marketCap / 1e9).toFixed(1)}B</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
