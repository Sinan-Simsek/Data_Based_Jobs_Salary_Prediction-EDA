import express from 'express'
import cors from 'cors'
import stocksRouter from './routes/stocks.js'
import marketRouter from './routes/market.js'
import portfolioRouter from './routes/portfolio.js'
import watchlistRouter from './routes/watchlist.js'

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`MarketPulse API server running on http://localhost:${PORT}`)
})
