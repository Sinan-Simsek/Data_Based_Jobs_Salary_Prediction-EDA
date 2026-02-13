import YahooFinance from 'yahoo-finance2'

const yahooFinance = new YahooFinance()

export async function getQuote(symbol) {
  try {
    const result = await yahooFinance.quote(symbol)
    if (!result) return null
    return {
      symbol: result.symbol,
      name: result.shortName || result.longName || symbol,
      price: result.regularMarketPrice,
      change: result.regularMarketChange,
      changePercent: result.regularMarketChangePercent,
      open: result.regularMarketOpen,
      high: result.regularMarketDayHigh,
      low: result.regularMarketDayLow,
      previousClose: result.regularMarketPreviousClose,
      volume: result.regularMarketVolume,
      avgVolume: result.averageDailyVolume3Month,
      marketCap: result.marketCap,
      pe: result.trailingPE,
      eps: result.epsTrailingTwelveMonths,
      beta: result.beta,
      dividend: result.dividendRate,
      dividendYield: result.dividendYield ? result.dividendYield * 100 : null,
      high52: result.fiftyTwoWeekHigh,
      low52: result.fiftyTwoWeekLow,
      targetPrice: result.targetMeanPrice || null,
      analystRating: result.recommendationKey || null,
      sector: result.sector || null,
      industry: result.industry || null,
    }
  } catch (err) {
    console.error(`Error fetching quote for ${symbol}:`, err.message)
    return null
  }
}

export async function getQuotes(symbols) {
  try {
    const results = await Promise.allSettled(
      symbols.map(s => yahooFinance.quote(s))
    )
    return results
      .filter(r => r.status === 'fulfilled' && r.value)
      .map(r => {
        const q = r.value
        return {
          symbol: q.symbol,
          name: q.shortName || q.longName || q.symbol,
          price: q.regularMarketPrice,
          change: q.regularMarketChange,
          changePercent: q.regularMarketChangePercent,
          open: q.regularMarketOpen,
          high: q.regularMarketDayHigh,
          low: q.regularMarketDayLow,
          previousClose: q.regularMarketPreviousClose,
          volume: q.regularMarketVolume,
          avgVolume: q.averageDailyVolume3Month,
          marketCap: q.marketCap,
          pe: q.trailingPE,
          eps: q.epsTrailingTwelveMonths,
          sector: q.sector || null,
        }
      })
  } catch (err) {
    console.error('Error fetching multiple quotes:', err.message)
    return []
  }
}

export async function getHistoricalData(symbol, period = '1y') {
  try {
    const periodMap = {
      '1w': { period1: daysAgo(7) },
      '1m': { period1: daysAgo(30) },
      '3m': { period1: daysAgo(90) },
      '6m': { period1: daysAgo(180) },
      '1y': { period1: daysAgo(365) },
      '5y': { period1: daysAgo(1825) },
    }
    const params = periodMap[period] || periodMap['1y']
    const result = await yahooFinance.chart(symbol, {
      ...params,
      period2: new Date(),
      interval: period === '5y' ? '1wk' : '1d',
    })
    if (!result || !result.quotes) return []
    return result.quotes
      .filter(q => q.close != null)
      .map(q => ({
        date: q.date.toISOString().split('T')[0],
        open: round(q.open),
        high: round(q.high),
        low: round(q.low),
        close: round(q.close),
        volume: q.volume || 0,
      }))
  } catch (err) {
    console.error(`Error fetching history for ${symbol}:`, err.message)
    return []
  }
}

export async function searchStocks(query) {
  try {
    const result = await yahooFinance.search(query, { newsCount: 0 })
    if (!result || !result.quotes) return []
    return result.quotes
      .filter(q => q.quoteType === 'EQUITY' || q.quoteType === 'ETF')
      .slice(0, 10)
      .map(q => ({
        symbol: q.symbol,
        name: q.shortname || q.longname || q.symbol,
        type: q.quoteType,
        exchange: q.exchDisp || q.exchange,
      }))
  } catch (err) {
    console.error('Error searching stocks:', err.message)
    return []
  }
}

export async function getStockProfile(symbol) {
  try {
    const result = await yahooFinance.quoteSummary(symbol, {
      modules: ['assetProfile', 'summaryProfile', 'financialData'],
    })
    const profile = result?.assetProfile || result?.summaryProfile || {}
    const fin = result?.financialData || {}
    return {
      sector: profile.sector || null,
      industry: profile.industry || null,
      description: profile.longBusinessSummary || null,
      ceo: profile.companyOfficers?.[0]?.name || null,
      employees: profile.fullTimeEmployees || null,
      hq: profile.city && profile.state ? `${profile.city}, ${profile.state}` : profile.city || null,
      website: profile.website || null,
      targetPrice: fin.targetMeanPrice || null,
      analystRating: fin.recommendationKey || null,
    }
  } catch (err) {
    console.error(`Error fetching profile for ${symbol}:`, err.message)
    return {}
  }
}

export async function getAnalystData(symbol) {
  try {
    const result = await yahooFinance.quoteSummary(symbol, {
      modules: ['recommendationTrend', 'financialData', 'upgradeDowngradeHistory'],
    })

    const fin = result?.financialData || {}
    const trends = result?.recommendationTrend?.trend || []
    const upgrades = result?.upgradeDowngradeHistory?.history || []

    // Current month recommendation distribution
    const current = trends.find(t => t.period === '0m') || trends[0] || {}

    // Build trend over months (0m = this month, -1m, -2m, -3m)
    const trendData = trends
      .filter(t => t.period)
      .map(t => ({
        period: t.period,
        strongBuy: t.strongBuy || 0,
        buy: t.buy || 0,
        hold: t.hold || 0,
        sell: t.sell || 0,
        strongSell: t.strongSell || 0,
      }))

    // Recent upgrades/downgrades (last 10)
    const recentActions = upgrades.slice(0, 10).map(u => ({
      firm: u.firm,
      toGrade: u.toGrade,
      fromGrade: u.fromGrade,
      action: u.action,
      date: u.epochGradeDate ? new Date(u.epochGradeDate * 1000).toISOString().split('T')[0] : null,
    }))

    const totalAnalysts = (current.strongBuy || 0) + (current.buy || 0) +
      (current.hold || 0) + (current.sell || 0) + (current.strongSell || 0)

    return {
      recommendation: fin.recommendationKey || null,
      recommendationMean: fin.recommendationMean || null,
      numberOfAnalysts: fin.numberOfAnalystOpinions || totalAnalysts || null,
      targetLow: fin.targetLowPrice || null,
      targetMean: fin.targetMeanPrice || null,
      targetMedian: fin.targetMedianPrice || null,
      targetHigh: fin.targetHighPrice || null,
      currentPrice: fin.currentPrice || null,
      distribution: {
        strongBuy: current.strongBuy || 0,
        buy: current.buy || 0,
        hold: current.hold || 0,
        sell: current.sell || 0,
        strongSell: current.strongSell || 0,
      },
      trend: trendData,
      recentActions,
    }
  } catch (err) {
    console.error(`Error fetching analyst data for ${symbol}:`, err.message)
    return null
  }
}

export async function getMarketIndices() {
  const symbols = ['^DJI', '^GSPC', '^IXIC', '^RUT', '^VIX', '^TNX']
  const names = {
    '^DJI': 'Dow Jones',
    '^GSPC': 'S&P 500',
    '^IXIC': 'NASDAQ',
    '^RUT': 'Russell 2000',
    '^VIX': 'VIX',
    '^TNX': '10-Yr Bond',
  }
  try {
    const results = await Promise.allSettled(
      symbols.map(s => yahooFinance.quote(s))
    )
    return results
      .filter(r => r.status === 'fulfilled' && r.value)
      .map(r => {
        const q = r.value
        return {
          symbol: q.symbol,
          name: names[q.symbol] || q.shortName || q.symbol,
          value: q.regularMarketPrice,
          change: q.regularMarketChange,
          changePercent: q.regularMarketChangePercent,
        }
      })
  } catch (err) {
    console.error('Error fetching market indices:', err.message)
    return []
  }
}

export async function getMarketMovers() {
  // Expanded universe of 50 high-volume stocks for better movers detection
  const symbols = [
    'AAPL','MSFT','GOOGL','AMZN','TSLA','NVDA','META','AMD','INTC','NFLX',
    'JPM','BAC','GS','V','MA','DIS','BA','CRM','PYPL','UBER',
    'COIN','SQ','SNAP','RIVN','PLTR','SOFI','NIO','LCID','SHOP','ROKU',
    'PFE','ABBV','LLY','UNH','WMT','COST','HD','XOM','CVX','PG',
    'KO','MCD','SBUX','NKE','ABNB','DASH','CRWD','PANW','ARM','AVGO',
  ]
  try {
    const quotes = await getQuotes(symbols)
    const sorted = [...quotes].sort((a, b) => Math.abs(b.changePercent || 0) - Math.abs(a.changePercent || 0))
    return {
      gainers: sorted.filter(q => (q.changePercent || 0) > 0).slice(0, 5),
      losers: sorted.filter(q => (q.changePercent || 0) < 0).slice(0, 5),
      mostActive: [...quotes].sort((a, b) => (b.volume || 0) - (a.volume || 0)).slice(0, 5),
    }
  } catch (err) {
    console.error('Error fetching movers:', err.message)
    return { gainers: [], losers: [], mostActive: [] }
  }
}

export async function getSectorPerformance() {
  // Sector ETFs as proxies for sector performance
  const sectorETFs = [
    { symbol: 'XLK', name: 'Technology' },
    { symbol: 'XLV', name: 'Healthcare' },
    { symbol: 'XLF', name: 'Financial Services' },
    { symbol: 'XLY', name: 'Consumer Cyclical' },
    { symbol: 'XLC', name: 'Communication Services' },
    { symbol: 'XLI', name: 'Industrials' },
    { symbol: 'XLP', name: 'Consumer Defensive' },
    { symbol: 'XLE', name: 'Energy' },
    { symbol: 'XLU', name: 'Utilities' },
    { symbol: 'XLRE', name: 'Real Estate' },
    { symbol: 'XLB', name: 'Materials' },
  ]
  try {
    const results = await Promise.allSettled(
      sectorETFs.map(s => yahooFinance.quote(s.symbol))
    )
    return results
      .filter(r => r.status === 'fulfilled' && r.value)
      .map((r, i) => ({
        name: sectorETFs[i].name,
        symbol: sectorETFs[i].symbol,
        change: r.value.regularMarketChangePercent,
        price: r.value.regularMarketPrice,
        marketCap: r.value.marketCap,
      }))
  } catch (err) {
    console.error('Error fetching sector performance:', err.message)
    return []
  }
}

export async function getNews(symbol) {
  try {
    if (symbol) {
      const result = await yahooFinance.search(symbol, {
        quotesCount: 0,
        newsCount: 10,
      })
      return (result.news || []).map(n => ({
        title: n.title,
        source: n.publisher,
        url: n.link,
        summary: n.title,
        publishedAt: n.providerPublishTime,
        relatedSymbol: symbol,
      }))
    } else {
      // General market news - search for "market"
      const result = await yahooFinance.search('stock market', {
        quotesCount: 0,
        newsCount: 15,
      })
      return (result.news || []).map(n => ({
        title: n.title,
        source: n.publisher,
        url: n.link,
        summary: n.title,
        publishedAt: n.providerPublishTime,
        relatedSymbol: null,
      }))
    }
  } catch (err) {
    console.error('Error fetching news:', err.message)
    return []
  }
}

function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d
}

function round(v) {
  return v != null ? +v.toFixed(2) : null
}
