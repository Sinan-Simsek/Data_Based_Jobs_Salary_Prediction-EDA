import express from 'express'
import cors from 'cors'
import db from './db.js'
import stocksRouter from './routes/stocks.js'
import marketRouter from './routes/market.js'
import portfolioRouter from './routes/portfolio.js'
import watchlistRouter from './routes/watchlist.js'
import predictionsRouter from './routes/predictions.js'

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

// Request logging
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const ms = Date.now() - start
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${ms}ms`)
  })
  next()
})

// API routes
app.use('/api/stocks', stocksRouter)
app.use('/api/market', marketRouter)
app.use('/api/portfolio', portfolioRouter)
app.use('/api/watchlist', watchlistRouter)
app.use('/api/predictions', predictionsRouter)

// Health check + database stats
app.get('/api/health', (req, res) => {
  const stocks = db.prepare('SELECT COUNT(*) as cnt FROM stocks').get().cnt
  const quotes = db.prepare('SELECT COUNT(*) as cnt FROM stock_quotes').get().cnt
  const prices = db.prepare('SELECT COUNT(*) as cnt FROM stock_prices').get().cnt
  const oldestPrice = db.prepare('SELECT MIN(date) as d FROM stock_prices').get()?.d
  const newestPrice = db.prepare('SELECT MAX(date) as d FROM stock_prices').get()?.d
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: {
      stocks,
      quotes,
      priceRecords: prices,
      dateRange: oldestPrice && newestPrice ? `${oldestPrice} ~ ${newestPrice}` : 'No data synced yet',
    }
  })
})

app.listen(PORT, () => {
  console.log(`MarketPulse API server running on http://localhost:${PORT}`)
})
