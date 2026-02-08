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
    const cached = getCached('indices', 60_000) // 1 min cache
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
    const cached = getCached('movers', 120_000) // 2 min cache
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
    const cached = getCached('sectors', 120_000) // 2 min cache
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
    const cached = getCached('sectors-history', 300_000) // 5 min cache
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
