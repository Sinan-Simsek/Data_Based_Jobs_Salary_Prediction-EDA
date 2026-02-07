import 'dotenv/config'
import pool from './db.js'

const MIGRATION = `
-- Stocks cache table
CREATE TABLE IF NOT EXISTS stocks (
  symbol VARCHAR(10) PRIMARY KEY,
  name VARCHAR(255),
  sector VARCHAR(100),
  industry VARCHAR(100),
  description TEXT,
  ceo VARCHAR(100),
  employees INTEGER,
  founded INTEGER,
  hq VARCHAR(100),
  website VARCHAR(255),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Daily price history cache
CREATE TABLE IF NOT EXISTS stock_prices (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL,
  date DATE NOT NULL,
  open NUMERIC(12,2),
  high NUMERIC(12,2),
  low NUMERIC(12,2),
  close NUMERIC(12,2),
  volume BIGINT,
  UNIQUE(symbol, date)
);
CREATE INDEX IF NOT EXISTS idx_stock_prices_symbol_date ON stock_prices(symbol, date DESC);

-- Real-time quote cache (short TTL)
CREATE TABLE IF NOT EXISTS stock_quotes (
  symbol VARCHAR(10) PRIMARY KEY,
  price NUMERIC(12,2),
  change NUMERIC(12,2),
  change_percent NUMERIC(8,4),
  open NUMERIC(12,2),
  high NUMERIC(12,2),
  low NUMERIC(12,2),
  previous_close NUMERIC(12,2),
  volume BIGINT,
  avg_volume BIGINT,
  market_cap NUMERIC(20,0),
  pe NUMERIC(10,2),
  eps NUMERIC(10,2),
  beta NUMERIC(6,3),
  dividend NUMERIC(10,2),
  dividend_yield NUMERIC(8,4),
  high_52w NUMERIC(12,2),
  low_52w NUMERIC(12,2),
  target_price NUMERIC(12,2),
  analyst_rating VARCHAR(20),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- User watchlist
CREATE TABLE IF NOT EXISTS watchlist (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL UNIQUE,
  added_at TIMESTAMP DEFAULT NOW()
);

-- User portfolio
CREATE TABLE IF NOT EXISTS portfolio (
  id SERIAL PRIMARY KEY,
  symbol VARCHAR(10) NOT NULL UNIQUE,
  shares NUMERIC(12,4) NOT NULL,
  avg_price NUMERIC(12,2) NOT NULL,
  added_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Market news cache
CREATE TABLE IF NOT EXISTS market_news (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  source VARCHAR(100),
  summary TEXT,
  url TEXT,
  category VARCHAR(50),
  related_symbol VARCHAR(10),
  published_at TIMESTAMP,
  fetched_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_market_news_fetched ON market_news(fetched_at DESC);
`

async function migrate() {
  try {
    console.log('Running database migration...')
    await pool.query(MIGRATION)
    console.log('Migration completed successfully.')

    // Seed default watchlist
    const { rows } = await pool.query('SELECT COUNT(*) as cnt FROM watchlist')
    if (parseInt(rows[0].cnt) === 0) {
      const defaults = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA']
      for (const symbol of defaults) {
        await pool.query('INSERT INTO watchlist (symbol) VALUES ($1) ON CONFLICT DO NOTHING', [symbol])
      }
      console.log('Default watchlist seeded.')
    }

    // Seed default portfolio
    const { rows: pRows } = await pool.query('SELECT COUNT(*) as cnt FROM portfolio')
    if (parseInt(pRows[0].cnt) === 0) {
      const defaults = [
        ['AAPL', 50, 165.00],
        ['MSFT', 30, 380.00],
        ['GOOGL', 40, 140.00],
        ['NVDA', 20, 650.00],
        ['AMZN', 25, 155.00],
      ]
      for (const [symbol, shares, price] of defaults) {
        await pool.query(
          'INSERT INTO portfolio (symbol, shares, avg_price) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
          [symbol, shares, price]
        )
      }
      console.log('Default portfolio seeded.')
    }

    process.exit(0)
  } catch (err) {
    console.error('Migration failed:', err)
    process.exit(1)
  }
}

migrate()
