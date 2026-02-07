import db from './db.js'

const TABLES = [
  `CREATE TABLE IF NOT EXISTS stocks (
    symbol TEXT PRIMARY KEY,
    name TEXT,
    sector TEXT,
    industry TEXT,
    description TEXT,
    ceo TEXT,
    employees INTEGER,
    founded INTEGER,
    hq TEXT,
    website TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS stock_prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    date TEXT NOT NULL,
    open REAL,
    high REAL,
    low REAL,
    close REAL,
    volume INTEGER,
    UNIQUE(symbol, date)
  )`,

  `CREATE INDEX IF NOT EXISTS idx_stock_prices_symbol_date ON stock_prices(symbol, date DESC)`,

  `CREATE TABLE IF NOT EXISTS stock_quotes (
    symbol TEXT PRIMARY KEY,
    price REAL,
    change REAL,
    change_percent REAL,
    open REAL,
    high REAL,
    low REAL,
    previous_close REAL,
    volume INTEGER,
    avg_volume INTEGER,
    market_cap REAL,
    pe REAL,
    eps REAL,
    beta REAL,
    dividend REAL,
    dividend_yield REAL,
    high_52w REAL,
    low_52w REAL,
    target_price REAL,
    analyst_rating TEXT,
    updated_at TEXT DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL UNIQUE,
    added_at TEXT DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS portfolio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL UNIQUE,
    shares REAL NOT NULL,
    avg_price REAL NOT NULL,
    added_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  )`,

  `CREATE TABLE IF NOT EXISTS market_news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    source TEXT,
    summary TEXT,
    url TEXT,
    category TEXT,
    related_symbol TEXT,
    published_at TEXT,
    fetched_at TEXT DEFAULT (datetime('now'))
  )`,

  `CREATE INDEX IF NOT EXISTS idx_market_news_fetched ON market_news(fetched_at DESC)`,
]

try {
  console.log('Running database migration...')

  for (const sql of TABLES) {
    db.exec(sql)
  }
  console.log('Tables created successfully.')

  // Seed default watchlist
  const wlCount = db.prepare('SELECT COUNT(*) as cnt FROM watchlist').get()
  if (wlCount.cnt === 0) {
    const insert = db.prepare('INSERT OR IGNORE INTO watchlist (symbol) VALUES (?)')
    for (const symbol of ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA']) {
      insert.run(symbol)
    }
    console.log('Default watchlist seeded.')
  }

  // Seed default portfolio
  const pfCount = db.prepare('SELECT COUNT(*) as cnt FROM portfolio').get()
  if (pfCount.cnt === 0) {
    const insert = db.prepare('INSERT OR IGNORE INTO portfolio (symbol, shares, avg_price) VALUES (?, ?, ?)')
    const defaults = [
      ['AAPL', 50, 165.00],
      ['MSFT', 30, 380.00],
      ['GOOGL', 40, 140.00],
      ['NVDA', 20, 650.00],
      ['AMZN', 25, 155.00],
    ]
    for (const [symbol, shares, price] of defaults) {
      insert.run(symbol, shares, price)
    }
    console.log('Default portfolio seeded.')
  }

  console.log('Migration completed successfully.')
  process.exit(0)
} catch (err) {
  console.error('Migration failed:', err)
  process.exit(1)
}
