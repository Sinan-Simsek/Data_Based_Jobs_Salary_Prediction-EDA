import { Router } from 'express'
import db from '../db.js'

const router = Router()

// Get all portfolio holdings
router.get('/', async (req, res) => {
  try {
    const rows = db.prepare(
      'SELECT symbol, shares, avg_price as avgPrice, added_at as addedAt FROM portfolio ORDER BY added_at'
    ).all()
    res.json(rows.map(r => ({ ...r, shares: +r.shares, avgPrice: +r.avgPrice })))
  } catch (err) {
    console.error('Portfolio fetch error:', err)
    res.status(500).json({ error: 'Failed to fetch portfolio' })
  }
})

// Add or update a holding
router.post('/', async (req, res) => {
  try {
    const { symbol, shares, avgPrice } = req.body
    if (!symbol || !shares || !avgPrice) {
      return res.status(400).json({ error: 'symbol, shares, and avgPrice are required' })
    }

    const sym = symbol.toUpperCase()

    // Check if already exists
    const existing = db.prepare('SELECT * FROM portfolio WHERE symbol = ?').get(sym)

    if (existing) {
      const totalShares = +existing.shares + shares
      const totalCost = +existing.shares * +existing.avg_price + shares * avgPrice
      const newAvg = totalCost / totalShares

      db.prepare(
        "UPDATE portfolio SET shares = ?, avg_price = ?, updated_at = datetime('now') WHERE symbol = ?"
      ).run(totalShares, newAvg, sym)
    } else {
      db.prepare(
        'INSERT INTO portfolio (symbol, shares, avg_price) VALUES (?, ?, ?)'
      ).run(sym, shares, avgPrice)
    }

    const row = db.prepare(
      'SELECT symbol, shares, avg_price as avgPrice FROM portfolio WHERE symbol = ?'
    ).get(sym)
    res.json(row)
  } catch (err) {
    console.error('Portfolio add error:', err)
    res.status(500).json({ error: 'Failed to add to portfolio' })
  }
})

// Remove a holding
router.delete('/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase()
    db.prepare('DELETE FROM portfolio WHERE symbol = ?').run(symbol)
    res.json({ success: true })
  } catch (err) {
    console.error('Portfolio delete error:', err)
    res.status(500).json({ error: 'Failed to remove from portfolio' })
  }
})

export default router
