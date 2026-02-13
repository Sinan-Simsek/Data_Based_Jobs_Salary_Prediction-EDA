import { Router } from 'express'
import db from '../db.js'

const router = Router()

// Get all watchlist symbols
router.get('/', async (req, res) => {
  try {
    const rows = db.prepare('SELECT symbol FROM watchlist ORDER BY added_at').all()
    res.json(rows.map(r => r.symbol))
  } catch (err) {
    console.error('Watchlist fetch error:', err)
    res.status(500).json({ error: 'Failed to fetch watchlist' })
  }
})

// Add to watchlist
router.post('/', async (req, res) => {
  try {
    const { symbol } = req.body
    if (!symbol) return res.status(400).json({ error: 'symbol is required' })

    db.prepare(
      'INSERT OR IGNORE INTO watchlist (symbol) VALUES (?)'
    ).run(symbol.toUpperCase())
    res.json({ success: true, symbol: symbol.toUpperCase() })
  } catch (err) {
    console.error('Watchlist add error:', err)
    res.status(500).json({ error: 'Failed to add to watchlist' })
  }
})

// Remove from watchlist
router.delete('/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase()
    db.prepare('DELETE FROM watchlist WHERE symbol = ?').run(symbol)
    res.json({ success: true })
  } catch (err) {
    console.error('Watchlist delete error:', err)
    res.status(500).json({ error: 'Failed to remove from watchlist' })
  }
})

export default router
