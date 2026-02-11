import * as tf from '@tensorflow/tfjs'
import db from './db.js'

// ──────────────── Configuration ────────────────
const WINDOW_SIZE = 30     // lookback days
const EPOCHS = 15          // training epochs
const BATCH_SIZE = 16
const LEARNING_RATE = 0.001
const MIN_DATA_POINTS = 60 // minimum history needed
const PREDICTION_PERIODS = {
  '1d': 1,
  '3d': 3,
  '1w': 7,
  '1m': 22, // trading days in a month
}

// ──────────────── Technical Indicators ────────────────
function computeSMA(prices, period) {
  const sma = []
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) { sma.push(null); continue }
    let sum = 0
    for (let j = 0; j < period; j++) sum += prices[i - j]
    sma.push(sum / period)
  }
  return sma
}

function computeRSI(prices, period = 14) {
  const rsi = []
  for (let i = 0; i < period; i++) rsi.push(50) // neutral default

  for (let i = period; i < prices.length; i++) {
    let gains = 0, losses = 0
    for (let j = i - period + 1; j <= i; j++) {
      const diff = prices[j] - prices[j - 1]
      if (diff > 0) gains += diff
      else losses -= diff
    }
    const avgGain = gains / period
    const avgLoss = losses / period
    if (avgLoss === 0) { rsi.push(100); continue }
    const rs = avgGain / avgLoss
    rsi.push(100 - (100 / (1 + rs)))
  }
  return rsi
}

function computeMACD(prices) {
  const ema12 = computeEMA(prices, 12)
  const ema26 = computeEMA(prices, 26)
  return ema12.map((v, i) => (v != null && ema26[i] != null) ? v - ema26[i] : 0)
}

function computeEMA(prices, period) {
  const ema = []
  const multiplier = 2 / (period + 1)
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) { ema.push(null); continue }
    if (i === period - 1) {
      let sum = 0
      for (let j = 0; j < period; j++) sum += prices[j]
      ema.push(sum / period)
    } else {
      ema.push((prices[i] - ema[i - 1]) * multiplier + ema[i - 1])
    }
  }
  return ema
}

// ──────────────── Feature Engineering ────────────────
function buildFeatures(prices, volumes) {
  const sma5 = computeSMA(prices, 5)
  const sma20 = computeSMA(prices, 20)
  const rsi = computeRSI(prices, 14)
  const macd = computeMACD(prices)

  const features = []
  const startIdx = 25 // skip initial nulls from SMA20/EMA26

  for (let i = startIdx; i < prices.length; i++) {
    if (sma5[i] == null || sma20[i] == null) continue
    features.push([
      prices[i],                        // closing price
      volumes[i],                       // volume
      sma5[i] / prices[i],             // SMA5 ratio
      sma20[i] / prices[i],            // SMA20 ratio
      rsi[i] / 100,                     // normalized RSI
      macd[i],                          // MACD
    ])
  }
  return features
}

// ──────────────── Normalization ────────────────
function normalizeData(data) {
  const numFeatures = data[0].length
  const mins = new Array(numFeatures).fill(Infinity)
  const maxs = new Array(numFeatures).fill(-Infinity)

  for (const row of data) {
    for (let j = 0; j < numFeatures; j++) {
      if (row[j] < mins[j]) mins[j] = row[j]
      if (row[j] > maxs[j]) maxs[j] = row[j]
    }
  }

  const normalized = data.map(row =>
    row.map((val, j) => {
      const range = maxs[j] - mins[j]
      return range === 0 ? 0 : (val - mins[j]) / range
    })
  )

  return { normalized, mins, maxs }
}

function denormalizePrice(value, mins, maxs) {
  const range = maxs[0] - mins[0]
  return value * range + mins[0]
}

// ──────────────── Create Training Data ────────────────
function createSequences(data, windowSize) {
  const X = [], Y = []
  for (let i = 0; i < data.length - windowSize; i++) {
    X.push(data.slice(i, i + windowSize))
    Y.push(data[i + windowSize][0]) // predict next closing price (first feature)
  }
  return { X, Y }
}

// ──────────────── LSTM Model ────────────────
function buildModel(windowSize, numFeatures) {
  const model = tf.sequential()

  model.add(tf.layers.lstm({
    units: 64,
    returnSequences: true,
    inputShape: [windowSize, numFeatures],
  }))

  model.add(tf.layers.dropout({ rate: 0.2 }))

  model.add(tf.layers.lstm({
    units: 32,
    returnSequences: false,
  }))

  model.add(tf.layers.dropout({ rate: 0.2 }))

  model.add(tf.layers.dense({ units: 16, activation: 'relu' }))
  model.add(tf.layers.dense({ units: 1 }))

  model.compile({
    optimizer: tf.train.adam(LEARNING_RATE),
    loss: 'meanSquaredError',
  })

  return model
}

// ──────────────── Predict One Stock ────────────────
async function predictStock(symbol, prices, volumes) {
  const features = buildFeatures(prices, volumes)

  if (features.length < WINDOW_SIZE + 10) {
    return null // not enough data
  }

  const { normalized, mins, maxs } = normalizeData(features)
  const { X, Y } = createSequences(normalized, WINDOW_SIZE)

  if (X.length < 10) return null

  // Split: use all data for training (we're predicting future, not evaluating)
  const xTensor = tf.tensor3d(X)
  const yTensor = tf.tensor2d(Y, [Y.length, 1])

  const model = buildModel(WINDOW_SIZE, features[0].length)

  // Train
  const history = await model.fit(xTensor, yTensor, {
    epochs: EPOCHS,
    batchSize: BATCH_SIZE,
    shuffle: true,
    verbose: 0,
  })

  const finalLoss = history.history.loss[history.history.loss.length - 1]

  // Get last window for prediction
  let lastWindow = normalized.slice(-WINDOW_SIZE)
  const currentPrice = prices[prices.length - 1]
  const predictions = {}

  // Recursive multi-step prediction
  for (const [period, days] of Object.entries(PREDICTION_PERIODS)) {
    let window = lastWindow.map(row => [...row])

    for (let d = 0; d < days; d++) {
      const input = tf.tensor3d([window])
      const pred = model.predict(input)
      const predValue = pred.dataSync()[0]
      input.dispose()
      pred.dispose()

      // Create next step: shift window and append prediction
      const nextRow = [...window[window.length - 1]]
      nextRow[0] = predValue // update price feature
      window = [...window.slice(1), nextRow]
    }

    // Denormalize final prediction
    const predictedPrice = denormalizePrice(window[window.length - 1][0], mins, maxs)
    const change = predictedPrice - currentPrice
    const changePct = (change / currentPrice) * 100

    // Confidence: based on loss and prediction horizon
    const baseLossConfidence = Math.max(0, Math.min(100, (1 - finalLoss * 10) * 100))
    const horizonPenalty = Math.min(days * 2, 40) // longer = less confident
    const confidence = Math.max(10, Math.min(95, baseLossConfidence - horizonPenalty))

    predictions[period] = {
      predictedPrice: +predictedPrice.toFixed(2),
      change: +change.toFixed(2),
      changePct: +changePct.toFixed(2),
      confidence: +confidence.toFixed(1),
    }
  }

  // Generate overall signal based on average prediction
  const avgChange = Object.values(predictions).reduce((s, p) => s + p.changePct, 0) / Object.keys(predictions).length
  let signal
  if (avgChange > 5) signal = 'strong_buy'
  else if (avgChange > 2) signal = 'buy'
  else if (avgChange > -2) signal = 'hold'
  else if (avgChange > -5) signal = 'sell'
  else signal = 'strong_sell'

  // Cleanup
  xTensor.dispose()
  yTensor.dispose()
  model.dispose()

  return { predictions, signal, loss: finalLoss, currentPrice }
}

// ──────────────── Store Predictions ────────────────
function storePredictions(symbol, result) {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO stock_predictions
      (symbol, period, current_price, predicted_price, predicted_change, predicted_change_pct, confidence, signal, model_loss, predicted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `)

  const tx = db.transaction(() => {
    for (const [period, pred] of Object.entries(result.predictions)) {
      insert.run(
        symbol, period, result.currentPrice,
        pred.predictedPrice, pred.change, pred.changePct,
        pred.confidence, result.signal, result.loss
      )
    }
  })

  tx()
}

// ──────────────── Main ────────────────
async function main() {
  const args = process.argv.slice(2)
  let symbols = []
  let topN = 50 // default: top 50 by market cap

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--symbol' || args[i] === '-s') {
      while (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        symbols.push(args[++i].toUpperCase())
      }
    } else if (args[i] === '--top' || args[i] === '-t') {
      topN = parseInt(args[++i]) || 50
    } else if (args[i] === '--all' || args[i] === '-a') {
      topN = 9999
    }
  }

  // Get symbols with enough data
  if (symbols.length === 0) {
    const rows = db.prepare(`
      SELECT sp.symbol, COUNT(*) as cnt, sq.market_cap
      FROM stock_prices sp
      LEFT JOIN stock_quotes sq ON sp.symbol = sq.symbol
      GROUP BY sp.symbol
      HAVING cnt >= ?
      ORDER BY sq.market_cap DESC NULLS LAST
      LIMIT ?
    `).all(MIN_DATA_POINTS, topN)

    symbols = rows.map(r => r.symbol)
  }

  if (symbols.length === 0) {
    console.log('No stocks with enough historical data. Run "npm run sync" first.')
    process.exit(0)
  }

  console.log('╔══════════════════════════════════════════════════╗')
  console.log('║      MarketPulse AI Prediction Engine           ║')
  console.log('║      LSTM Deep Learning Model                   ║')
  console.log('╚══════════════════════════════════════════════════╝')
  console.log(`\nModel: LSTM (64→32 units) + Dropout + Dense`)
  console.log(`Features: Price, Volume, SMA5, SMA20, RSI-14, MACD`)
  console.log(`Window: ${WINDOW_SIZE} days | Epochs: ${EPOCHS} | Batch: ${BATCH_SIZE}`)
  console.log(`\nProcessing ${symbols.length} stocks...\n`)

  const startTime = Date.now()
  let success = 0, failed = 0
  const signals = { strong_buy: 0, buy: 0, hold: 0, sell: 0, strong_sell: 0 }

  // Ensure predictions table exists
  db.exec(`CREATE TABLE IF NOT EXISTS stock_predictions (
    symbol TEXT NOT NULL,
    period TEXT NOT NULL,
    current_price REAL,
    predicted_price REAL,
    predicted_change REAL,
    predicted_change_pct REAL,
    confidence REAL,
    signal TEXT,
    model_loss REAL,
    predicted_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (symbol, period)
  )`)

  for (let i = 0; i < symbols.length; i++) {
    const symbol = symbols[i]
    const progress = `[${i + 1}/${symbols.length}]`

    try {
      // Get historical data
      const rows = db.prepare(
        'SELECT close, volume FROM stock_prices WHERE symbol = ? ORDER BY date ASC'
      ).all(symbol)

      if (rows.length < MIN_DATA_POINTS) {
        console.log(`  ${progress} ${symbol} — skipped (only ${rows.length} data points)`)
        failed++
        continue
      }

      const prices = rows.map(r => r.close)
      const volumes = rows.map(r => r.volume || 0)

      const result = await predictStock(symbol, prices, volumes)

      if (!result) {
        console.log(`  ${progress} ${symbol} — skipped (insufficient features)`)
        failed++
        continue
      }

      storePredictions(symbol, result)
      signals[result.signal]++
      success++

      const p1d = result.predictions['1d']
      const arrow = p1d.changePct >= 0 ? '↑' : '↓'
      const color = p1d.changePct >= 0 ? '\x1b[32m' : '\x1b[31m'
      console.log(
        `  ${progress} ${symbol.padEnd(6)} ${color}${arrow} 1D: ${p1d.changePct > 0 ? '+' : ''}${p1d.changePct.toFixed(2)}%\x1b[0m` +
        ` | 1W: ${result.predictions['1w'].changePct > 0 ? '+' : ''}${result.predictions['1w'].changePct.toFixed(2)}%` +
        ` | Signal: ${result.signal.toUpperCase().replace('_', ' ')}` +
        ` | Loss: ${result.loss.toFixed(6)}`
      )

      // Force garbage collection periodically
      if (i % 10 === 0) {
        tf.disposeVariables()
        await tf.nextFrame?.() // give JS engine a breather
      }
    } catch (err) {
      console.log(`  ${progress} ${symbol} — error: ${err.message}`)
      failed++
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)

  console.log('\n╔══════════════════════════════════════════════════╗')
  console.log('║              Prediction Summary                  ║')
  console.log('╚══════════════════════════════════════════════════╝')
  console.log(`  Processed: ${success} stocks | Failed: ${failed}`)
  console.log(`  Time: ${elapsed}s`)
  console.log(`\n  Signals:`)
  console.log(`    🟢 Strong Buy:  ${signals.strong_buy}`)
  console.log(`    🔵 Buy:         ${signals.buy}`)
  console.log(`    ⚪ Hold:        ${signals.hold}`)
  console.log(`    🟠 Sell:        ${signals.sell}`)
  console.log(`    🔴 Strong Sell: ${signals.strong_sell}`)
  console.log(`\n  Predictions saved to database.`)
  console.log(`  View them at: http://localhost:5173/predictions\n`)

  process.exit(0)
}

main().catch(err => {
  console.error('Prediction failed:', err)
  process.exit(1)
})
