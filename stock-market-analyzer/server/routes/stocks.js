import { Router } from 'express'
import pool from '../db.js'
import { getQuote, getHistoricalData, searchStocks, getStockProfile } from '../services/yahoo.js'

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

    // Check cache (1 minute TTL)
    const cached = await pool.query(
      `SELECT * FROM stock_quotes WHERE symbol = $1 AND updated_at > NOW() - INTERVAL '1 minute'`,
      [symbol]
    )
    if (cached.rows.length > 0) {
      const row = cached.rows[0]
      return res.json(formatQuoteRow(row))
    }

    // Fetch from Yahoo Finance
    const quote = await getQuote(symbol)
    if (!quote) return res.status(404).json({ error: 'Stock not found' })

    // Also fetch profile for additional data
    const profile = await getStockProfile(symbol)
    const merged = { ...quote, ...profile }

    // Cache in DB
    await pool.query(`
      INSERT INTO stock_quotes (symbol, price, change, change_percent, open, high, low,
        previous_close, volume, avg_volume, market_cap, pe, eps, beta,
        dividend, dividend_yield, high_52w, low_52w, target_price, analyst_rating, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,NOW())
      ON CONFLICT (symbol) DO UPDATE SET
        price=$2, change=$3, change_percent=$4, open=$5, high=$6, low=$7,
        previous_close=$8, volume=$9, avg_volume=$10, market_cap=$11, pe=$12,
        eps=$13, beta=$14, dividend=$15, dividend_yield=$16, high_52w=$17,
        low_52w=$18, target_price=$19, analyst_rating=$20, updated_at=NOW()
    `, [symbol, merged.price, merged.change, merged.changePercent, merged.open,
        merged.high, merged.low, merged.previousClose, merged.volume, merged.avgVolume,
        merged.marketCap, merged.pe, merged.eps, merged.beta, merged.dividend,
        merged.dividendYield, merged.high52, merged.low52, merged.targetPrice,
        merged.analystRating])

    // Cache stock info
    await pool.query(`
      INSERT INTO stocks (symbol, name, sector, industry, description, ceo, employees, hq, website, updated_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())
      ON CONFLICT (symbol) DO UPDATE SET
        name=$2, sector=$3, industry=$4, description=$5, ceo=$6, employees=$7, hq=$8, website=$9, updated_at=NOW()
    `, [symbol, merged.name, merged.sector, merged.industry, merged.description,
        merged.ceo, merged.employees, merged.hq, merged.website])

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
    const { rows } = await pool.query('SELECT * FROM stocks WHERE symbol = $1', [symbol])
    if (rows.length === 0) {
      const profile = await getStockProfile(symbol)
      return res.json(profile)
    }
    res.json(rows[0])
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

    // Check cache - see if we have recent data
    const daysMap = { '1w': 7, '1m': 30, '3m': 90, '6m': 180, '1y': 365, '5y': 1825 }
    const days = daysMap[range] || 365

    const cached = await pool.query(
      `SELECT date, open, high, low, close, volume FROM stock_prices
       WHERE symbol = $1 AND date >= CURRENT_DATE - $2::integer
       ORDER BY date ASC`,
      [symbol, days]
    )

    // If we have data and it's recent enough, use cache
    if (cached.rows.length > days * 0.5) {
      return res.json(cached.rows.map(r => ({
        ...r,
        date: r.date.toISOString().split('T')[0],
        open: +r.open, high: +r.high, low: +r.low, close: +r.close, volume: +r.volume,
      })))
    }

    // Fetch from Yahoo
    const data = await getHistoricalData(symbol, range)
    if (data.length === 0) return res.json([])

    // Cache in DB
    for (const d of data) {
      await pool.query(`
        INSERT INTO stock_prices (symbol, date, open, high, low, close, volume)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (symbol, date) DO UPDATE SET
          open=$3, high=$4, low=$5, close=$6, volume=$7
      `, [symbol, d.date, d.open, d.high, d.low, d.close, d.volume])
    }

    res.json(data)
  } catch (err) {
    console.error('History error:', err)
    res.status(500).json({ error: 'Failed to fetch history' })
  }
})

function formatQuoteRow(row) {
  return {
    symbol: row.symbol,
    price: +row.price,
    change: +row.change,
    changePercent: +row.change_percent,
    open: +row.open,
    high: +row.high,
    low: +row.low,
    previousClose: +row.previous_close,
    volume: +row.volume,
    avgVolume: +row.avg_volume,
    marketCap: +row.market_cap,
    pe: row.pe ? +row.pe : null,
    eps: row.eps ? +row.eps : null,
    beta: row.beta ? +row.beta : null,
    dividend: row.dividend ? +row.dividend : null,
    dividendYield: row.dividend_yield ? +row.dividend_yield : null,
    high52: row.high_52w ? +row.high_52w : null,
    low52: row.low_52w ? +row.low_52w : null,
    targetPrice: row.target_price ? +row.target_price : null,
    analystRating: row.analyst_rating,
  }
}

export default router
