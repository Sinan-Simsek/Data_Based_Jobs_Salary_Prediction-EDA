import { Router } from 'express'
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

// Sector performance
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
