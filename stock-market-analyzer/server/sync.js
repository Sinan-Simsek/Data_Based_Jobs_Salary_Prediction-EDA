/**
 * Data Sync Script
 * Downloads historical price data and current quotes from Yahoo Finance
 * and stores them persistently in the SQLite database.
 *
 * Usage:
 *   npm run sync              # Sync all stocks (full universe)
 *   npm run sync -- --quick   # Sync only watchlist + portfolio stocks
 *   npm run sync -- --symbol AAPL MSFT   # Sync specific symbols
 */

import db from './db.js'
import { ALL_SYMBOLS } from './stocks-universe.js'
import YahooFinance from 'yahoo-finance2'

const yahooFinance = new YahooFinance()

// Parse CLI args
const args = process.argv.slice(2)
const isQuick = args.includes('--quick')
const symbolArgIdx = args.indexOf('--symbol')
const specificSymbols = symbolArgIdx !== -1 ? args.slice(symbolArgIdx + 1) : null

// Determine which symbols to sync
function getSymbolsToSync() {
  if (specificSymbols && specificSymbols.length > 0) {
    return specificSymbols.map(s => s.toUpperCase())
  }
  if (isQuick) {
    const wl = db.prepare('SELECT symbol FROM watchlist').all().map(r => r.symbol)
    const pf = db.prepare('SELECT symbol FROM portfolio').all().map(r => r.symbol)
    return [...new Set([...wl, ...pf])]
  }
  return ALL_SYMBOLS
}

// Fetch and store quote for a single symbol
async function syncQuote(symbol) {
  try {
    const result = await yahooFinance.quote(symbol)
    if (!result) return false

    db.prepare(`
      INSERT OR REPLACE INTO stock_quotes (symbol, price, change, change_percent, open, high, low,
        previous_close, volume, avg_volume, market_cap, pe, eps, beta,
        dividend, dividend_yield, high_52w, low_52w, target_price, analyst_rating, updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))
    `).run(
      result.symbol,
      result.regularMarketPrice,
      result.regularMarketChange,
      result.regularMarketChangePercent,
      result.regularMarketOpen,
      result.regularMarketDayHigh,
      result.regularMarketDayLow,
      result.regularMarketPreviousClose,
      result.regularMarketVolume,
      result.averageDailyVolume3Month,
      result.marketCap,
      result.trailingPE,
      result.epsTrailingTwelveMonths,
      result.beta,
      result.dividendRate,
      result.dividendYield ? result.dividendYield * 100 : null,
      result.fiftyTwoWeekHigh,
      result.fiftyTwoWeekLow,
      result.targetMeanPrice || null,
      result.recommendationKey || null
    )

    // Also store stock name/sector
    db.prepare(`
      INSERT OR REPLACE INTO stocks (symbol, name, sector, industry, updated_at)
      VALUES (?,?,?,?,datetime('now'))
    `).run(
      result.symbol,
      result.shortName || result.longName || symbol,
      result.sector || null,
      result.industry || null
    )

    return true
  } catch (err) {
    console.error(`  [QUOTE FAIL] ${symbol}: ${err.message}`)
    return false
  }
}

// Fetch and store historical data for a single symbol
async function syncHistory(symbol, years = 5) {
  try {
    const period1 = new Date()
    period1.setFullYear(period1.getFullYear() - years)

    const result = await yahooFinance.chart(symbol, {
      period1,
      period2: new Date(),
      interval: '1d',
    })

    if (!result || !result.quotes || result.quotes.length === 0) return 0

    const insert = db.prepare(`
      INSERT OR REPLACE INTO stock_prices (symbol, date, open, high, low, close, volume)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    const insertMany = db.transaction((quotes) => {
      let count = 0
      for (const q of quotes) {
        if (q.close == null) continue
        const date = q.date.toISOString().split('T')[0]
        insert.run(
          symbol, date,
          q.open ? +q.open.toFixed(2) : null,
          q.high ? +q.high.toFixed(2) : null,
          q.low ? +q.low.toFixed(2) : null,
          +q.close.toFixed(2),
          q.volume || 0
        )
        count++
      }
      return count
    })

    return insertMany(result.quotes)
  } catch (err) {
    console.error(`  [HISTORY FAIL] ${symbol}: ${err.message}`)
    return 0
  }
}

// Rate-limit helper: process in batches with delay
async function processBatch(symbols, batchSize, delayMs, fn) {
  const results = { success: 0, fail: 0 }
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize)
    const batchResults = await Promise.allSettled(batch.map(fn))
    for (const r of batchResults) {
      if (r.status === 'fulfilled' && r.value) results.success++
      else results.fail++
    }
    // Progress
    const done = Math.min(i + batchSize, symbols.length)
    process.stdout.write(`\r  Progress: ${done}/${symbols.length} (${Math.round(done / symbols.length * 100)}%)`)
    // Rate limit delay between batches
    if (i + batchSize < symbols.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs))
    }
  }
  console.log() // newline after progress
  return results
}

// Main sync function
async function main() {
  const symbols = getSymbolsToSync()
  const startTime = Date.now()

  console.log('='.repeat(60))
  console.log('MarketPulse Data Sync')
  console.log('='.repeat(60))
  console.log(`Mode: ${specificSymbols ? 'Specific symbols' : isQuick ? 'Quick (watchlist + portfolio)' : 'Full universe'}`)
  console.log(`Symbols to sync: ${symbols.length}`)
  console.log(`Date: ${new Date().toISOString()}`)
  console.log('-'.repeat(60))

  // Step 1: Sync quotes
  console.log('\n[1/2] Syncing current quotes...')
  const quoteResults = await processBatch(symbols, 5, 500, syncQuote)
  console.log(`  Quotes: ${quoteResults.success} success, ${quoteResults.fail} failed`)

  // Step 2: Sync historical data (5 years)
  console.log('\n[2/2] Syncing historical price data (5 years)...')
  let totalPrices = 0
  const histResults = await processBatch(symbols, 3, 1000, async (symbol) => {
    const count = await syncHistory(symbol, 5)
    totalPrices += count
    return count > 0
  })
  console.log(`  History: ${histResults.success} success, ${histResults.fail} failed`)
  console.log(`  Total price records stored: ${totalPrices.toLocaleString()}`)

  // Summary
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
  const totalQuotes = db.prepare('SELECT COUNT(*) as cnt FROM stock_quotes').get().cnt
  const totalPriceRows = db.prepare('SELECT COUNT(*) as cnt FROM stock_prices').get().cnt
  const totalStocks = db.prepare('SELECT COUNT(*) as cnt FROM stocks').get().cnt

  console.log('\n' + '='.repeat(60))
  console.log('Sync Complete!')
  console.log('-'.repeat(60))
  console.log(`Time elapsed: ${elapsed}s`)
  console.log(`Database stats:`)
  console.log(`  Stocks/ETFs tracked: ${totalStocks}`)
  console.log(`  Quote records:       ${totalQuotes}`)
  console.log(`  Price records:       ${totalPriceRows.toLocaleString()}`)
  console.log('='.repeat(60))
}

main().then(() => process.exit(0)).catch(err => {
  console.error('Sync failed:', err)
  process.exit(1)
})
