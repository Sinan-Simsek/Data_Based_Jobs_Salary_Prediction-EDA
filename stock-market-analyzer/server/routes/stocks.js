import { Router } from 'express'
import db from '../db.js'
import { getQuote, getHistoricalData, searchStocks, getStockProfile, getAnalystData } from '../services/yahoo.js'

const router = Router()

// Search stocks
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query
    if (!q || q.length < 1) return res.json([])
    const results = await searchStocks(q)
    res.json(results)
  } catch (err) {
    console.error('Search error:', err)
    res.status(500).json({ error: 'Search failed' })
  }
})

// Get stock quote (with DB caching - 1 min TTL)
router.get('/:symbol/quote', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase()

    // Check cache (10 second TTL)
    const cached = db.prepare(
      `SELECT * FROM stock_quotes WHERE symbol = ? AND updated_at > datetime('now', '-10 seconds')`
    ).get(symbol)

    if (cached) {
      return res.json(formatQuoteRow(cached))
    }

    // Fetch from Yahoo Finance
    const quote = await getQuote(symbol)
    if (!quote) return res.status(404).json({ error: 'Stock not found' })

    // Also fetch profile for additional data
    const profile = await getStockProfile(symbol)
    const merged = { ...quote, ...profile }

    // Cache in DB
    db.prepare(`
      INSERT OR REPLACE INTO stock_quotes (symbol, price, change, change_percent, open, high, low,
        previous_close, volume, avg_volume, market_cap, pe, eps, beta,
        dividend, dividend_yield, high_52w, low_52w, target_price, analyst_rating, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))
    `).run(symbol, merged.price, merged.change, merged.changePercent, merged.open,
        merged.high, merged.low, merged.previousClose, merged.volume, merged.avgVolume,
        merged.marketCap, merged.pe, merged.eps, merged.beta, merged.dividend,
        merged.dividendYield, merged.high52, merged.low52, merged.targetPrice,
        merged.analystRating)

    // Cache stock info
    db.prepare(`
      INSERT OR REPLACE INTO stocks (symbol, name, sector, industry, description, ceo, employees, hq, website, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,datetime('now'))
    `).run(symbol, merged.name, merged.sector, merged.industry, merged.description,
        merged.ceo, merged.employees, merged.hq, merged.website)

    res.json(merged)
  } catch (err) {
    console.error('Quote error:', err)
    res.status(500).json({ error: 'Failed to fetch quote' })
  }
})

// Get stock info (from DB cache)
router.get('/:symbol/info', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase()
    const row = db.prepare('SELECT * FROM stocks WHERE symbol = ?').get(symbol)
    if (!row) {
      const profile = await getStockProfile(symbol)
      return res.json(profile)
    }
    res.json(row)
  } catch (err) {
    console.error('Info error:', err)
    res.status(500).json({ error: 'Failed to fetch info' })
  }
})

// Get historical price data (with DB caching)
router.get('/:symbol/history', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase()
    const range = req.query.range || '1y'

    const daysMap = { '1w': 7, '1m': 30, '3m': 90, '6m': 180, '1y': 365, '5y': 1825 }
    const days = daysMap[range] || 365

    // Check cache
    const cached = db.prepare(
      `SELECT date, open, high, low, close, volume FROM stock_prices
       WHERE symbol = ? AND date >= date('now', '-' || ? || ' days')
       ORDER BY date ASC`
    ).all(symbol, days)

    if (cached.length > days * 0.5) {
      return res.json(cached)
    }

    // Fetch from Yahoo
    const data = await getHistoricalData(symbol, range)
    if (data.length === 0) return res.json([])

    // Cache in DB
    const insert = db.prepare(`
      INSERT OR REPLACE INTO stock_prices (symbol, date, open, high, low, close, volume)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    const insertMany = db.transaction((items) => {
      for (const d of items) {
        insert.run(symbol, d.date, d.open, d.high, d.low, d.close, d.volume)
      }
    })
    insertMany(data)

    res.json(data)
  } catch (err) {
    console.error('History error:', err)
    res.status(500).json({ error: 'Failed to fetch history' })
  }
})

// Get analyst ratings and recommendations
router.get('/:symbol/analysts', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase()
    const data = await getAnalystData(symbol)
    if (!data) return res.status(404).json({ error: 'No analyst data found' })
    res.json(data)
  } catch (err) {
    console.error('Analyst error:', err)
    res.status(500).json({ error: 'Failed to fetch analyst data' })
  }
})

function formatQuoteRow(row) {
  return {
    symbol: row.symbol,
    price: row.price,
    change: row.change,
    changePercent: row.change_percent,
    open: row.open,
    high: row.high,
    low: row.low,
    previousClose: row.previous_close,
    volume: row.volume,
    avgVolume: row.avg_volume,
    marketCap: row.market_cap,
    pe: row.pe,
    eps: row.eps,
    beta: row.beta,
    dividend: row.dividend,
    dividendYield: row.dividend_yield,
    high52: row.high_52w,
    low52: row.low_52w,
    targetPrice: row.target_price,
    analystRating: row.analyst_rating,
  }
}

export default router
