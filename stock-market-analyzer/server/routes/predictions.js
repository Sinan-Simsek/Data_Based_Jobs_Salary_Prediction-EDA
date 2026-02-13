import { Router } from 'express'
import db from '../db.js'

const router = Router()

// Get all predictions (latest run)
router.get('/', (req, res) => {
  try {
    const { sector, signal, sort, order } = req.query

    let sql = `
      SELECT p.symbol, p.period, p.current_price, p.predicted_price,
             p.predicted_change, p.predicted_change_pct, p.confidence,
             p.signal, p.model_loss, p.predicted_at,
             s.name, s.sector
      FROM stock_predictions p
      LEFT JOIN stocks s ON p.symbol = s.symbol
    `

    const conditions = []
    const params = []

    if (sector) {
      conditions.push('s.sector = ?')
      params.push(sector)
    }
    if (signal) {
      conditions.push('p.signal = ?')
      params.push(signal)
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ')
    }

    sql += ' ORDER BY p.symbol, p.period'

    const rows = db.prepare(sql).all(...params)

    // Group by symbol
    const symbolMap = {}
    for (const row of rows) {
      if (!symbolMap[row.symbol]) {
        symbolMap[row.symbol] = {
          symbol: row.symbol,
          name: row.name,
          sector: row.sector,
          currentPrice: row.current_price,
          signal: row.signal,
          modelLoss: row.model_loss,
          predictedAt: row.predicted_at,
          predictions: {},
        }
      }
      symbolMap[row.symbol].predictions[row.period] = {
        price: row.predicted_price,
        change: row.predicted_change,
        changePct: row.predicted_change_pct,
        confidence: row.confidence,
      }
    }

    let result = Object.values(symbolMap)

    // Sort
    const sortField = sort || 'symbol'
    const sortOrder = order === 'asc' ? 1 : -1

    if (sortField === 'symbol') {
      result.sort((a, b) => a.symbol.localeCompare(b.symbol) * sortOrder)
    } else if (sortField === 'signal') {
      const signalOrder = { strong_buy: 5, buy: 4, hold: 3, sell: 2, strong_sell: 1 }
      result.sort((a, b) => ((signalOrder[a.signal] || 0) - (signalOrder[b.signal] || 0)) * sortOrder)
    } else if (['1d', '3d', '1w', '1m'].includes(sortField)) {
      result.sort((a, b) => {
        const aVal = a.predictions[sortField]?.changePct || 0
        const bVal = b.predictions[sortField]?.changePct || 0
        return (aVal - bVal) * sortOrder
      })
    }

    res.json(result)
  } catch (err) {
    console.error('Predictions error:', err)
    res.status(500).json({ error: 'Failed to fetch predictions' })
  }
})

// Get prediction for a single stock
router.get('/:symbol', (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase()

    const rows = db.prepare(`
      SELECT p.*, s.name, s.sector
      FROM stock_predictions p
      LEFT JOIN stocks s ON p.symbol = s.symbol
      WHERE p.symbol = ?
      ORDER BY p.period
    `).all(symbol)

    if (rows.length === 0) {
      return res.status(404).json({ error: 'No predictions found for this stock' })
    }

    const first = rows[0]
    const result = {
      symbol: first.symbol,
      name: first.name,
      sector: first.sector,
      currentPrice: first.current_price,
      signal: first.signal,
      modelLoss: first.model_loss,
      predictedAt: first.predicted_at,
      predictions: {},
    }

    for (const row of rows) {
      result.predictions[row.period] = {
        price: row.predicted_price,
        change: row.predicted_change,
        changePct: row.predicted_change_pct,
        confidence: row.confidence,
      }
    }

    res.json(result)
  } catch (err) {
    console.error('Prediction detail error:', err)
    res.status(500).json({ error: 'Failed to fetch prediction' })
  }
})

// Get summary stats
router.get('/stats/summary', (req, res) => {
  try {
    const total = db.prepare('SELECT COUNT(DISTINCT symbol) as cnt FROM stock_predictions').get().cnt
    const lastRun = db.prepare('SELECT MAX(predicted_at) as t FROM stock_predictions').get()?.t

    const signals = db.prepare(`
      SELECT signal, COUNT(DISTINCT symbol) as cnt
      FROM stock_predictions
      GROUP BY signal
    `).all()

    const signalMap = {}
    for (const row of signals) {
      signalMap[row.signal] = row.cnt
    }

    const topBuy = db.prepare(`
      SELECT p.symbol, s.name, p.predicted_change_pct, p.signal
      FROM stock_predictions p
      LEFT JOIN stocks s ON p.symbol = s.symbol
      WHERE p.period = '1w'
      ORDER BY p.predicted_change_pct DESC
      LIMIT 5
    `).all()

    const topSell = db.prepare(`
      SELECT p.symbol, s.name, p.predicted_change_pct, p.signal
      FROM stock_predictions p
      LEFT JOIN stocks s ON p.symbol = s.symbol
      WHERE p.period = '1w'
      ORDER BY p.predicted_change_pct ASC
      LIMIT 5
    `).all()

    res.json({
      totalStocks: total,
      lastPrediction: lastRun,
      signals: signalMap,
      topBuy,
      topSell,
    })
  } catch (err) {
    console.error('Prediction stats error:', err)
    res.status(500).json({ error: 'Failed to fetch prediction stats' })
  }
})

// Get available sectors
router.get('/filters/sectors', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT DISTINCT s.sector
      FROM stock_predictions p
      JOIN stocks s ON p.symbol = s.symbol
      WHERE s.sector IS NOT NULL AND s.sector != ''
      ORDER BY s.sector
    `).all()
    res.json(rows.map(r => r.sector))
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sectors' })
  }
})

export default router
