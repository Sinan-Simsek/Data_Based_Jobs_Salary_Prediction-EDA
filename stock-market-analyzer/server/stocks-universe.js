// Comprehensive US stock universe: ~150 stocks + popular ETFs
// Covers S&P 500 mega/large caps, popular mid-caps, and major ETFs

export const STOCKS = [
  // ===== MEGA CAP TECH =====
  'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'NVDA', 'META', 'TSLA', 'AVGO', 'ORCL',

  // ===== TECH / SEMICONDUCTORS =====
  'AMD', 'INTC', 'CRM', 'ADBE', 'NFLX', 'CSCO', 'QCOM', 'TXN', 'AMAT', 'MU',
  'LRCX', 'KLAC', 'MRVL', 'SNPS', 'CDNS', 'ARM', 'PANW', 'CRWD', 'FTNT', 'NOW',
  'SHOP', 'SQ', 'PYPL', 'UBER', 'ABNB', 'DASH', 'COIN', 'PLTR', 'SNOW', 'DDOG',
  'ZS', 'NET', 'TEAM', 'WDAY', 'HUBS', 'TTD', 'ROKU', 'SNAP', 'PINS', 'U',

  // ===== FINANCE =====
  'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'BLK', 'SCHW', 'AXP', 'V',
  'MA', 'COF', 'USB', 'PNC', 'TFC', 'BK', 'CME', 'ICE', 'SPGI', 'MCO',

  // ===== HEALTHCARE / PHARMA =====
  'UNH', 'JNJ', 'LLY', 'PFE', 'ABBV', 'MRK', 'TMO', 'ABT', 'DHR', 'BMY',
  'AMGN', 'GILD', 'ISRG', 'VRTX', 'REGN', 'MDT', 'SYK', 'BSX', 'ZTS', 'CI',

  // ===== CONSUMER / RETAIL =====
  'WMT', 'COST', 'HD', 'LOW', 'TGT', 'AMZN', 'NKE', 'SBUX', 'MCD', 'CMG',
  'TJX', 'ROST', 'DG', 'DLTR', 'YUM', 'DPZ', 'LULU', 'DECK', 'BKNG', 'MAR',

  // ===== INDUSTRIAL / DEFENSE =====
  'BA', 'CAT', 'GE', 'HON', 'RTX', 'LMT', 'NOC', 'GD', 'DE', 'UPS',
  'FDX', 'UNP', 'CSX', 'WM', 'EMR',

  // ===== ENERGY =====
  'XOM', 'CVX', 'COP', 'SLB', 'EOG', 'MPC', 'PSX', 'VLO', 'OXY', 'HAL',

  // ===== CONSUMER STAPLES =====
  'PG', 'KO', 'PEP', 'PM', 'MO', 'CL', 'EL', 'KHC', 'GIS', 'K',

  // ===== MEDIA / COMMUNICATION =====
  'DIS', 'CMCSA', 'NFLX', 'T', 'VZ', 'TMUS', 'CHTR', 'WBD', 'PARA', 'LYV',

  // ===== REAL ESTATE =====
  'PLD', 'AMT', 'CCI', 'EQIX', 'SPG', 'O', 'WELL', 'DLR', 'PSA', 'AVB',

  // ===== EV / CLEAN ENERGY =====
  'RIVN', 'LCID', 'NIO', 'LI', 'XPEV', 'ENPH', 'SEDG', 'FSLR',
]

export const ETFS = [
  // ===== MAJOR INDEX ETFs =====
  'SPY', 'QQQ', 'DIA', 'IWM', 'VTI', 'VOO',

  // ===== SECTOR ETFs =====
  'XLK', 'XLV', 'XLF', 'XLY', 'XLC', 'XLI', 'XLP', 'XLE', 'XLU', 'XLRE', 'XLB',

  // ===== THEMATIC / SPECIALTY ETFs =====
  'ARKK', 'ARKW', 'ARKG', 'SOXX', 'SMH', 'KWEB', 'TAN', 'LIT', 'HACK', 'BOTZ',
  'VGT', 'VHT', 'VFH', 'VCR', 'VNQ',

  // ===== BOND / COMMODITY / INTL ETFs =====
  'TLT', 'AGG', 'BND', 'HYG', 'GLD', 'SLV', 'USO', 'EEM', 'EFA', 'VWO', 'IEMG',

  // ===== LEVERAGED / INVERSE (popular) =====
  'TQQQ', 'SQQQ', 'SPXU', 'UPRO', 'SOXL', 'SOXS',
]

// Deduplicated full universe
export const ALL_SYMBOLS = [...new Set([...STOCKS, ...ETFS])]

// Subset for market movers (high-volume, widely followed)
export const MOVERS_UNIVERSE = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'AMD', 'INTC', 'NFLX',
  'JPM', 'BAC', 'GS', 'V', 'MA', 'DIS', 'BA', 'CRM', 'PYPL', 'UBER',
  'COIN', 'SQ', 'SNAP', 'RIVN', 'PLTR', 'SOFI', 'NIO', 'LCID', 'SHOP', 'ROKU',
  'PFE', 'ABBV', 'LLY', 'UNH', 'WMT', 'COST', 'HD', 'XOM', 'CVX', 'PG',
  'KO', 'MCD', 'SBUX', 'NKE', 'ABNB', 'DASH', 'CRWD', 'PANW', 'ARM', 'AVGO',
]
