import { Router } from 'express'
import db from '../db.js'
import { getMarketIndices, getMarketMovers, getSectorPerformance, getNews } from '../services/yahoo.js'

const router = Router()

// Simple in-memory cache with TTL
const cache = new Map()

function getCached(key, ttlMs) {
  const entry = cache.get(key)
  if (entry && Date.now() - entry.time < ttlMs) return entry.data
  return null
}

function setCache(key, data) {
  cache.set(key, { data, time: Date.now() })
}

// Sector ETF mapping
const SECTOR_ETFS = [
  { symbol: 'XLK', name: 'Technology' },
  { symbol: 'XLV', name: 'Healthcare' },
  { symbol: 'XLF', name: 'Financial Services' },
  { symbol: 'XLY', name: 'Consumer Cyclical' },
  { symbol: 'XLC', name: 'Communication Services' },
  { symbol: 'XLI', name: 'Industrials' },
  { symbol: 'XLP', name: 'Consumer Defensive' },
  { symbol: 'XLE', name: 'Energy' },
  { symbol: 'XLU', name: 'Utilities' },
  { symbol: 'XLRE', name: 'Real Estate' },
  { symbol: 'XLB', name: 'Materials' },
]

// Market indices
router.get('/indices', async (req, res) => {
  try {
    const cached = getCached('indices', 10_000) // 10s cache
    if (cached) return res.json(cached)

    const data = await getMarketIndices()
    setCache('indices', data)
    res.json(data)
  } catch (err) {
    console.error('Indices error:', err)
    res.status(500).json({ error: 'Failed to fetch indices' })
  }
})

// Top movers
router.get('/movers', async (req, res) => {
  try {
    const cached = getCached('movers', 15_000) // 15s cache
    if (cached) return res.json(cached)

    const data = await getMarketMovers()
    setCache('movers', data)
    res.json(data)
  } catch (err) {
    console.error('Movers error:', err)
    res.status(500).json({ error: 'Failed to fetch movers' })
  }
})

// Sector performance (today only - from Yahoo Finance)
router.get('/sectors', async (req, res) => {
  try {
    const cached = getCached('sectors', 15_000) // 15s cache
    if (cached) return res.json(cached)

    const data = await getSectorPerformance()
    setCache('sectors', data)
    res.json(data)
  } catch (err) {
    console.error('Sectors error:', err)
    res.status(500).json({ error: 'Failed to fetch sectors' })
  }
})

// Multi-period sector performance (from DB historical data)
router.get('/sectors/history', async (req, res) => {
  try {
    const cached = getCached('sectors-history', 60_000) // 1 min cache
    if (cached) return res.json(cached)

    const periods = {
      '1w': 7,
      '1m': 30,
      '3m': 90,
      '6m': 180,
      '1y': 365,
      '5y': 1825,
    }

    // Get today's live data from Yahoo for 1d
    let todayData = []
    try {
      todayData = await getSectorPerformance()
    } catch {}

    const result = SECTOR_ETFS.map(etf => {
      const entry = { symbol: etf.symbol, name: etf.name, periods: {} }

      // 1d from live Yahoo data
      const live = todayData.find(s => s.symbol === etf.symbol)
      entry.periods['1d'] = live ? +live.change.toFixed(2) : null

      // Other periods from DB
      const latestRow = db.prepare(
        'SELECT close FROM stock_prices WHERE symbol = ? ORDER BY date DESC LIMIT 1'
      ).get(etf.symbol)

      if (!latestRow) {
        for (const key of Object.keys(periods)) entry.periods[key] = null
        return entry
      }

      const latestClose = latestRow.close

      for (const [key, days] of Object.entries(periods)) {
        const pastRow = db.prepare(
          `SELECT close FROM stock_prices WHERE symbol = ? AND date <= date('now', '-' || ? || ' days') ORDER BY date DESC LIMIT 1`
        ).get(etf.symbol, days)

        if (pastRow && pastRow.close) {
          entry.periods[key] = +((latestClose - pastRow.close) / pastRow.close * 100).toFixed(2)
        } else {
          entry.periods[key] = null
        }
      }

      return entry
    })

    setCache('sectors-history', result)
    res.json(result)
  } catch (err) {
    console.error('Sectors history error:', err)
    res.status(500).json({ error: 'Failed to fetch sector history' })
  }
})

// Tree map data - stocks grouped by sector with market cap and change %
router.get('/treemap', async (req, res) => {
  try {
    const cached = getCached('treemap', 15_000) // 15s cache
    if (cached) return res.json(cached)

    // Get all stocks that have both sector info and quote data
    const rows = db.prepare(`
      SELECT s.symbol, s.name, s.sector,
             q.price, q.change_percent, q.market_cap
      FROM stocks s
      JOIN stock_quotes q ON s.symbol = q.symbol
      WHERE s.sector IS NOT NULL AND s.sector != ''
        AND q.price IS NOT NULL AND q.market_cap IS NOT NULL
      ORDER BY q.market_cap DESC
    `).all()

    // Group by sector
    const sectorMap = {}
    for (const row of rows) {
      if (!sectorMap[row.sector]) {
        sectorMap[row.sector] = { name: row.sector, stocks: [] }
      }
      sectorMap[row.sector].stocks.push({
        symbol: row.symbol,
        name: row.name,
        price: row.price,
        changePercent: row.change_percent,
        marketCap: row.market_cap,
      })
    }

    // Convert to array, sort sectors by total market cap
    const data = Object.values(sectorMap)
      .map(sector => ({
        ...sector,
        totalMarketCap: sector.stocks.reduce((sum, s) => sum + (s.marketCap || 0), 0),
      }))
      .sort((a, b) => b.totalMarketCap - a.totalMarketCap)

    setCache('treemap', data)
    res.json(data)
  } catch (err) {
    console.error('Treemap error:', err)
    res.status(500).json({ error: 'Failed to fetch treemap data' })
  }
})

// Market news
router.get('/news', async (req, res) => {
  try {
    const { symbol } = req.query
    const cacheKey = `news-${symbol || 'general'}`
    const cached = getCached(cacheKey, 300_000) // 5 min cache
    if (cached) return res.json(cached)

    const data = await getNews(symbol || null)
    setCache(cacheKey, data)
    res.json(data)
  } catch (err) {
    console.error('News error:', err)
    res.status(500).json({ error: 'Failed to fetch news' })
  }
})

export default router
