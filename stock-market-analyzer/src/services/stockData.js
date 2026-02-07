// Simulated stock market data service
// In production, replace with real API calls to Alpha Vantage, Yahoo Finance, etc.

const STOCKS = {
  AAPL: { name: 'Apple Inc.', sector: 'Technology', industry: 'Consumer Electronics', employees: 164000, ceo: 'Tim Cook', founded: 1976, hq: 'Cupertino, CA', description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.' },
  MSFT: { name: 'Microsoft Corporation', sector: 'Technology', industry: 'Software', employees: 221000, ceo: 'Satya Nadella', founded: 1975, hq: 'Redmond, WA', description: 'Microsoft Corporation develops and supports software, services, devices, and solutions worldwide.' },
  GOOGL: { name: 'Alphabet Inc.', sector: 'Technology', industry: 'Internet Services', employees: 182502, ceo: 'Sundar Pichai', founded: 1998, hq: 'Mountain View, CA', description: 'Alphabet Inc. offers various products and platforms in the United States, Europe, the Middle East, Africa, the Asia-Pacific, Canada, and Latin America.' },
  AMZN: { name: 'Amazon.com Inc.', sector: 'Consumer Cyclical', industry: 'E-Commerce', employees: 1541000, ceo: 'Andy Jassy', founded: 1994, hq: 'Seattle, WA', description: 'Amazon.com, Inc. engages in the retail sale of consumer products, advertising, and subscription services through online and physical stores.' },
  TSLA: { name: 'Tesla Inc.', sector: 'Consumer Cyclical', industry: 'Auto Manufacturers', employees: 127855, ceo: 'Elon Musk', founded: 2003, hq: 'Austin, TX', description: 'Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems.' },
  NVDA: { name: 'NVIDIA Corporation', sector: 'Technology', industry: 'Semiconductors', employees: 29600, ceo: 'Jensen Huang', founded: 1993, hq: 'Santa Clara, CA', description: 'NVIDIA Corporation provides graphics and compute and networking solutions in the United States, Taiwan, China, Hong Kong, and internationally.' },
  META: { name: 'Meta Platforms Inc.', sector: 'Technology', industry: 'Social Media', employees: 67317, ceo: 'Mark Zuckerberg', founded: 2004, hq: 'Menlo Park, CA', description: 'Meta Platforms, Inc. engages in the development of products that enable people to connect and share with friends and family.' },
  JPM: { name: 'JPMorgan Chase & Co.', sector: 'Financial Services', industry: 'Banks', employees: 309926, ceo: 'Jamie Dimon', founded: 2000, hq: 'New York, NY', description: 'JPMorgan Chase & Co. operates as a financial services company worldwide.' },
  V: { name: 'Visa Inc.', sector: 'Financial Services', industry: 'Credit Services', employees: 26500, ceo: 'Ryan McInerney', founded: 1958, hq: 'San Francisco, CA', description: 'Visa Inc. operates as a payments technology company worldwide.' },
  JNJ: { name: 'Johnson & Johnson', sector: 'Healthcare', industry: 'Drug Manufacturers', employees: 131900, ceo: 'Joaquin Duato', founded: 1886, hq: 'New Brunswick, NJ', description: 'Johnson & Johnson researches, develops, manufactures, and sells various products in the healthcare field worldwide.' },
  WMT: { name: 'Walmart Inc.', sector: 'Consumer Defensive', industry: 'Discount Stores', employees: 2100000, ceo: 'Doug McMillon', founded: 1962, hq: 'Bentonville, AR', description: 'Walmart Inc. engages in the operation of retail, wholesale, and other units worldwide.' },
  UNH: { name: 'UnitedHealth Group', sector: 'Healthcare', industry: 'Healthcare Plans', employees: 400000, ceo: 'Andrew Witty', founded: 1977, hq: 'Minnetonka, MN', description: 'UnitedHealth Group Incorporated operates as a diversified health care company in the United States.' },
  XOM: { name: 'Exxon Mobil Corp.', sector: 'Energy', industry: 'Oil & Gas', employees: 62000, ceo: 'Darren Woods', founded: 1999, hq: 'Irving, TX', description: 'Exxon Mobil Corporation explores for and produces crude oil and natural gas.' },
  PG: { name: 'Procter & Gamble Co.', sector: 'Consumer Defensive', industry: 'Household Products', employees: 107000, ceo: 'Jon Moeller', founded: 1837, hq: 'Cincinnati, OH', description: 'The Procter & Gamble Company provides branded consumer packaged goods worldwide.' },
  DIS: { name: 'Walt Disney Co.', sector: 'Communication Services', industry: 'Entertainment', employees: 225000, ceo: 'Bob Iger', founded: 1923, hq: 'Burbank, CA', description: 'The Walt Disney Company operates as an entertainment company worldwide.' },
  NFLX: { name: 'Netflix Inc.', sector: 'Communication Services', industry: 'Entertainment', employees: 13000, ceo: 'Ted Sarandos', founded: 1997, hq: 'Los Gatos, CA', description: 'Netflix, Inc. provides entertainment services and is one of the world\'s leading streaming entertainment services.' },
  AMD: { name: 'Advanced Micro Devices', sector: 'Technology', industry: 'Semiconductors', employees: 26000, ceo: 'Lisa Su', founded: 1969, hq: 'Santa Clara, CA', description: 'Advanced Micro Devices, Inc. operates as a semiconductor company worldwide.' },
  BA: { name: 'Boeing Co.', sector: 'Industrials', industry: 'Aerospace & Defense', employees: 171000, ceo: 'Dave Calhoun', founded: 1916, hq: 'Arlington, VA', description: 'The Boeing Company designs, develops, manufactures, sells, and services commercial jetliners, military aircraft, satellites, missile defense, human space flight and launch systems.' },
  CRM: { name: 'Salesforce Inc.', sector: 'Technology', industry: 'Software', employees: 79000, ceo: 'Marc Benioff', founded: 1999, hq: 'San Francisco, CA', description: 'Salesforce, Inc. provides customer relationship management technology that brings companies and customers together worldwide.' },
  INTC: { name: 'Intel Corporation', sector: 'Technology', industry: 'Semiconductors', employees: 131500, ceo: 'Pat Gelsinger', founded: 1968, hq: 'Santa Clara, CA', description: 'Intel Corporation designs, develops, manufactures, markets, and sells computing and related products and services worldwide.' },
}

// Seed-based pseudo random for consistent data
function seededRandom(seed) {
  let x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

function generateBasePrice(symbol) {
  const prices = {
    AAPL: 189.84, MSFT: 420.72, GOOGL: 175.98, AMZN: 185.07, TSLA: 248.42,
    NVDA: 878.37, META: 505.95, JPM: 198.47, V: 281.36, JNJ: 156.74,
    WMT: 170.36, UNH: 527.18, XOM: 104.52, PG: 162.87, DIS: 111.75,
    NFLX: 628.42, AMD: 177.52, BA: 204.87, CRM: 272.65, INTC: 43.28,
  }
  return prices[symbol] || 100
}

function generateMarketCap(symbol) {
  const caps = {
    AAPL: 2.94e12, MSFT: 3.13e12, GOOGL: 2.17e12, AMZN: 1.92e12, TSLA: 790e9,
    NVDA: 2.17e12, META: 1.29e12, JPM: 571e9, V: 580e9, JNJ: 378e9,
    WMT: 460e9, UNH: 488e9, XOM: 440e9, PG: 383e9, DIS: 204e9,
    NFLX: 272e9, AMD: 287e9, BA: 127e9, CRM: 264e9, INTC: 182e9,
  }
  return caps[symbol] || 100e9
}

export function generateHistoricalData(symbol, days = 365) {
  const basePrice = generateBasePrice(symbol)
  const data = []
  const now = new Date()

  for (let i = days; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    if (date.getDay() === 0 || date.getDay() === 6) continue

    const seed = symbol.charCodeAt(0) * 1000 + i
    const change = (seededRandom(seed) - 0.48) * basePrice * 0.03
    const prevPrice = data.length > 0 ? data[data.length - 1].close : basePrice
    const open = prevPrice + (seededRandom(seed + 1) - 0.5) * 2
    const close = prevPrice + change
    const high = Math.max(open, close) + seededRandom(seed + 2) * basePrice * 0.015
    const low = Math.min(open, close) - seededRandom(seed + 3) * basePrice * 0.015
    const volume = Math.floor(20000000 + seededRandom(seed + 4) * 80000000)

    data.push({
      date: date.toISOString().split('T')[0],
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +close.toFixed(2),
      volume,
    })
  }
  return data
}

export function getStockQuote(symbol) {
  const history = generateHistoricalData(symbol, 30)
  const latest = history[history.length - 1]
  const prev = history[history.length - 2]
  const change = latest.close - prev.close
  const changePercent = (change / prev.close) * 100
  const info = STOCKS[symbol] || { name: symbol, sector: 'Unknown' }
  const marketCap = generateMarketCap(symbol)

  return {
    symbol,
    ...info,
    price: latest.close,
    change: +change.toFixed(2),
    changePercent: +changePercent.toFixed(2),
    open: latest.open,
    high: latest.high,
    low: latest.low,
    close: latest.close,
    previousClose: prev.close,
    volume: latest.volume,
    avgVolume: Math.floor(history.reduce((s, d) => s + d.volume, 0) / history.length),
    marketCap,
    pe: +(15 + seededRandom(symbol.charCodeAt(0)) * 35).toFixed(2),
    eps: +(latest.close / (15 + seededRandom(symbol.charCodeAt(0)) * 35)).toFixed(2),
    beta: +(0.5 + seededRandom(symbol.charCodeAt(1) || 1) * 1.5).toFixed(2),
    dividend: +(seededRandom(symbol.charCodeAt(0) + 100) * 3).toFixed(2),
    dividendYield: +(seededRandom(symbol.charCodeAt(0) + 200) * 4).toFixed(2),
    high52: +(latest.close * (1 + seededRandom(symbol.charCodeAt(0) + 300) * 0.3)).toFixed(2),
    low52: +(latest.close * (1 - seededRandom(symbol.charCodeAt(0) + 400) * 0.3)).toFixed(2),
    targetPrice: +(latest.close * (1 + (seededRandom(symbol.charCodeAt(0) + 500) - 0.3) * 0.4)).toFixed(2),
    analystRating: ['Strong Buy', 'Buy', 'Hold', 'Sell'][Math.floor(seededRandom(symbol.charCodeAt(0) + 600) * 3)],
  }
}

export function getMarketIndices() {
  return [
    { symbol: '^DJI', name: 'Dow Jones', value: 39131.53, change: 162.33, changePercent: 0.42 },
    { symbol: '^GSPC', name: 'S&P 500', value: 5137.08, change: 40.81, changePercent: 0.80 },
    { symbol: '^IXIC', name: 'NASDAQ', value: 16274.94, change: 196.95, changePercent: 1.22 },
    { symbol: '^RUT', name: 'Russell 2000', value: 2075.73, change: -8.42, changePercent: -0.40 },
    { symbol: '^VIX', name: 'VIX', value: 14.24, change: -0.78, changePercent: -5.19 },
    { symbol: '^TNX', name: '10-Yr Bond', value: 4.273, change: 0.032, changePercent: 0.75 },
  ]
}

export function getTopMovers() {
  const symbols = Object.keys(STOCKS)
  const quotes = symbols.map(s => getStockQuote(s))
  const sorted = [...quotes].sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
  return {
    gainers: sorted.filter(q => q.changePercent > 0).slice(0, 5),
    losers: sorted.filter(q => q.changePercent < 0).slice(0, 5),
    mostActive: [...quotes].sort((a, b) => b.volume - a.volume).slice(0, 5),
  }
}

export function searchStocks(query) {
  if (!query) return []
  const q = query.toUpperCase()
  return Object.entries(STOCKS)
    .filter(([symbol, info]) => symbol.includes(q) || info.name.toUpperCase().includes(q))
    .map(([symbol, info]) => ({ symbol, name: info.name, sector: info.sector }))
    .slice(0, 8)
}

export function getAllStocks() {
  return Object.entries(STOCKS).map(([symbol, info]) => ({
    symbol,
    ...info,
    ...getStockQuote(symbol),
  }))
}

export function getMarketNews() {
  return [
    { id: 1, title: 'Fed Signals Potential Rate Cuts Later This Year', source: 'Reuters', time: '2h ago', category: 'Economy', summary: 'Federal Reserve officials indicated they could begin cutting interest rates later this year if inflation continues to cool, minutes from the latest policy meeting showed.', symbol: null },
    { id: 2, title: 'NVIDIA Surpasses Expectations with Record Revenue', source: 'Bloomberg', time: '3h ago', category: 'Earnings', summary: 'NVIDIA reported quarterly revenue that exceeded analyst expectations, driven by surging demand for AI chips and data center products.', symbol: 'NVDA' },
    { id: 3, title: 'Apple Unveils New AI Features for iPhone', source: 'CNBC', time: '4h ago', category: 'Technology', summary: 'Apple announced a suite of new artificial intelligence features coming to the iPhone, iPad, and Mac, marking the company\'s biggest push into AI.', symbol: 'AAPL' },
    { id: 4, title: 'Tesla Deliveries Beat Estimates in Q4', source: 'MarketWatch', time: '5h ago', category: 'Automotive', summary: 'Tesla reported fourth-quarter deliveries that exceeded Wall Street estimates, helping to ease concerns about slowing demand for electric vehicles.', symbol: 'TSLA' },
    { id: 5, title: 'S&P 500 Hits New All-Time High', source: 'WSJ', time: '6h ago', category: 'Markets', summary: 'The S&P 500 index closed at a new record high, driven by strong earnings reports and optimism about the economy.', symbol: null },
    { id: 6, title: 'Microsoft Cloud Revenue Surges 30%', source: 'Financial Times', time: '7h ago', category: 'Earnings', summary: 'Microsoft reported a 30% increase in cloud revenue, driven by growing demand for Azure cloud services and AI integration.', symbol: 'MSFT' },
    { id: 7, title: 'Amazon Expands Same-Day Delivery Network', source: 'Reuters', time: '8h ago', category: 'Retail', summary: 'Amazon is expanding its same-day delivery network to more cities across the United States as competition in e-commerce intensifies.', symbol: 'AMZN' },
    { id: 8, title: 'Oil Prices Rise on Middle East Tensions', source: 'Bloomberg', time: '9h ago', category: 'Commodities', summary: 'Crude oil prices rose sharply as geopolitical tensions in the Middle East raised concerns about potential supply disruptions.', symbol: 'XOM' },
    { id: 9, title: 'Meta Reports Strong Ad Revenue Growth', source: 'CNBC', time: '10h ago', category: 'Earnings', summary: 'Meta Platforms reported better-than-expected advertising revenue, signaling a recovery in the digital advertising market.', symbol: 'META' },
    { id: 10, title: 'JPMorgan Forecasts Strong Banking Sector Outlook', source: 'WSJ', time: '11h ago', category: 'Finance', summary: 'JPMorgan Chase executives expressed confidence in the banking sector outlook, citing strong loan growth and improving net interest margins.', symbol: 'JPM' },
  ]
}

export function getSectorPerformance() {
  return [
    { name: 'Technology', change: 2.34, marketCap: '14.2T', stocks: 312 },
    { name: 'Healthcare', change: 0.87, marketCap: '7.1T', stocks: 245 },
    { name: 'Financial Services', change: 1.12, marketCap: '8.3T', stocks: 198 },
    { name: 'Consumer Cyclical', change: -0.45, marketCap: '5.6T', stocks: 176 },
    { name: 'Communication Services', change: 1.78, marketCap: '4.8T', stocks: 89 },
    { name: 'Industrials', change: 0.23, marketCap: '5.2T', stocks: 215 },
    { name: 'Consumer Defensive', change: -0.12, marketCap: '3.9T', stocks: 134 },
    { name: 'Energy', change: -1.34, marketCap: '3.1T', stocks: 98 },
    { name: 'Utilities', change: 0.56, marketCap: '1.5T', stocks: 67 },
    { name: 'Real Estate', change: -0.78, marketCap: '1.2T', stocks: 145 },
    { name: 'Materials', change: 0.34, marketCap: '1.8T', stocks: 112 },
  ]
}
