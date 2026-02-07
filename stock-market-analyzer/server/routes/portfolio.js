import { Router } from 'express'
import pool from '../db.js'

const router = Router()

// Get all portfolio holdings
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT symbol, shares, avg_price as "avgPrice", added_at as "addedAt" FROM portfolio ORDER BY added_at'
    )
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
    const existing = await pool.query('SELECT * FROM portfolio WHERE symbol = $1', [sym])

    if (existing.rows.length > 0) {
      const old = existing.rows[0]
      const totalShares = +old.shares + shares
      const totalCost = +old.shares * +old.avg_price + shares * avgPrice
      const newAvg = totalCost / totalShares

      await pool.query(
        'UPDATE portfolio SET shares = $1, avg_price = $2, updated_at = NOW() WHERE symbol = $3',
        [totalShares, newAvg, sym]
      )
    } else {
      await pool.query(
        'INSERT INTO portfolio (symbol, shares, avg_price) VALUES ($1, $2, $3)',
        [sym, shares, avgPrice]
      )
    }

    const { rows } = await pool.query(
      'SELECT symbol, shares, avg_price as "avgPrice" FROM portfolio WHERE symbol = $1',
      [sym]
    )
    res.json(rows[0])
  } catch (err) {
    console.error('Portfolio add error:', err)
    res.status(500).json({ error: 'Failed to add to portfolio' })
  }
})

// Remove a holding
router.delete('/:symbol', async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase()
    await pool.query('DELETE FROM portfolio WHERE symbol = $1', [symbol])
    res.json({ success: true })
  } catch (err) {
    console.error('Portfolio delete error:', err)
    res.status(500).json({ error: 'Failed to remove from portfolio' })
  }
})

export default router
