// Comprehensive US stock universe: ~350 stocks + popular ETFs
// Covers nearly all S&P 500 + popular mid-caps and ETFs

export const STOCKS = [
  // ===== MEGA CAP TECH =====
  'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'AMZN', 'NVDA', 'META', 'TSLA', 'AVGO', 'ORCL',

  // ===== TECH / SOFTWARE =====
  'CRM', 'ADBE', 'NOW', 'INTU', 'SNPS', 'CDNS', 'WDAY', 'TEAM', 'HUBS', 'ANSS',
  'PLTR', 'SNOW', 'DDOG', 'ZS', 'NET', 'CRWD', 'PANW', 'FTNT', 'TTD', 'PAYC',
  'SHOP', 'SQ', 'PYPL', 'UBER', 'ABNB', 'DASH', 'COIN', 'ROKU', 'SNAP', 'PINS',
  'U', 'SOFI', 'BILL', 'PCOR', 'MNDY', 'ZI', 'PATH', 'DKNG', 'APP', 'RBLX',

  // ===== SEMICONDUCTORS =====
  'AMD', 'INTC', 'QCOM', 'TXN', 'AMAT', 'MU', 'LRCX', 'KLAC', 'MRVL', 'ADI',
  'NXPI', 'ON', 'MCHP', 'MPWR', 'SWKS', 'ARM', 'STX', 'WDC', 'GFS', 'ENTG',

  // ===== NETWORKING / IT =====
  'CSCO', 'IBM', 'ACN', 'MSI', 'HPE', 'HPQ', 'DELL', 'ANET', 'JNPR', 'FFIV',
  'GDDY', 'AKAM', 'CTSH', 'IT', 'EPAM', 'LDOS', 'SAIC', 'BAH',

  // ===== FINANCE / BANKS =====
  'JPM', 'BAC', 'WFC', 'GS', 'MS', 'C', 'USB', 'PNC', 'TFC', 'FITB',
  'HBAN', 'KEY', 'CFG', 'RF', 'ZION', 'CMA', 'SIVB', 'FRC', 'NYCB',
  'BK', 'STT', 'NTRS',

  // ===== FINANCE / INSURANCE & ASSET MGMT =====
  'BRK-B', 'BLK', 'SCHW', 'AXP', 'COF', 'DFS', 'SYF', 'ALLY',
  'AIG', 'MET', 'PRU', 'AFL', 'PGR', 'CB', 'ALL', 'TRV', 'HIG',
  'MMC', 'AON', 'MARSH', 'WTW', 'AJG',

  // ===== FINANCE / EXCHANGES & DATA =====
  'V', 'MA', 'SPGI', 'MCO', 'MSCI', 'ICE', 'CME', 'NDAQ', 'CBOE', 'FIS',
  'FISV', 'GPN', 'WEX', 'FLUT',

  // ===== HEALTHCARE / PHARMA =====
  'UNH', 'JNJ', 'LLY', 'PFE', 'ABBV', 'MRK', 'TMO', 'ABT', 'DHR', 'BMY',
  'AMGN', 'GILD', 'VRTX', 'REGN', 'MRNA', 'BIIB', 'AZN', 'NVO', 'SNY', 'GSK',
  'ZTS', 'CI', 'CVS', 'ELV', 'HUM', 'CNC', 'MOH',

  // ===== HEALTHCARE / DEVICES & SERVICES =====
  'ISRG', 'MDT', 'SYK', 'BSX', 'EW', 'DXCM', 'IDXX', 'A', 'IQV', 'VEEV',
  'BDX', 'BAX', 'HOLX', 'ALGN', 'TFX', 'PODD',
  'HCA', 'THC', 'UHS', 'DVA', 'MCK', 'CAH', 'COR',

  // ===== CONSUMER CYCLICAL / RETAIL =====
  'AMZN', 'HD', 'LOW', 'TGT', 'WMT', 'COST', 'TJX', 'ROST', 'DG', 'DLTR',
  'BBY', 'KMX', 'AZO', 'ORLY', 'TSCO', 'FIVE', 'ULTA',
  'NKE', 'LULU', 'DECK', 'CROX', 'TPR', 'RL', 'PVH', 'HBI',

  // ===== CONSUMER / RESTAURANTS & TRAVEL =====
  'MCD', 'SBUX', 'CMG', 'YUM', 'DPZ', 'QSR', 'WING', 'DRI', 'TXRH',
  'BKNG', 'ABNB', 'MAR', 'HLT', 'H', 'RCL', 'CCL', 'NCLH', 'LYV', 'EXPE',

  // ===== CONSUMER / AUTO =====
  'TSLA', 'GM', 'F', 'RIVN', 'LCID', 'NIO', 'LI', 'XPEV',
  'CVNA', 'AN', 'LAD', 'GPC', 'AAP', 'LKQ',

  // ===== MEDIA / COMMUNICATION =====
  'DIS', 'CMCSA', 'NFLX', 'WBD', 'FOXA', 'FOX', 'OMC', 'IPG',
  'T', 'VZ', 'TMUS', 'CHTR', 'LBRDA',
  'EA', 'TTWO', 'RBLX', 'MTCH', 'IAC',

  // ===== INDUSTRIAL / DEFENSE =====
  'BA', 'CAT', 'GE', 'HON', 'RTX', 'LMT', 'NOC', 'GD', 'HII', 'TDG',
  'DE', 'EMR', 'ROK', 'ETN', 'PH', 'ITW', 'IR', 'AME', 'ROP', 'OTIS',
  'CARR', 'JCI', 'TT', 'LII', 'A', 'GNRC',

  // ===== INDUSTRIAL / TRANSPORT =====
  'UPS', 'FDX', 'UNP', 'CSX', 'NSC', 'CP', 'JBHT', 'XPO', 'CHRW',
  'DAL', 'UAL', 'LUV', 'AAL', 'JBLU',
  'GEV', 'WM', 'RSG', 'WCN', 'CLH',

  // ===== INDUSTRIAL / CONSTRUCTION =====
  'MMM', 'SWK', 'VMC', 'MLM', 'MAS', 'FAST',
  'DHI', 'LEN', 'PHM', 'NVR', 'TOL', 'KBH',

  // ===== ENERGY =====
  'XOM', 'CVX', 'COP', 'SLB', 'EOG', 'MPC', 'PSX', 'VLO', 'OXY', 'HAL',
  'DVN', 'HES', 'FANG', 'PXD', 'BKR', 'CTRA', 'EQT', 'OVV',
  'KMI', 'WMB', 'OKE', 'TRGP', 'ET',

  // ===== CONSUMER STAPLES =====
  'PG', 'KO', 'PEP', 'PM', 'MO', 'CL', 'EL', 'KHC', 'GIS', 'K',
  'HSY', 'MDLZ', 'MNST', 'KDP', 'STZ', 'BF-B', 'TAP', 'SAM',
  'SJM', 'CPB', 'HRL', 'TSN', 'ADM', 'BG',
  'SYY', 'COST', 'KR', 'WBA',

  // ===== UTILITIES =====
  'NEE', 'SO', 'DUK', 'D', 'AEP', 'SRE', 'EXC', 'XEL', 'WEC', 'ED',
  'PEG', 'ES', 'DTE', 'PPL', 'FE', 'CEG', 'VST', 'AES', 'ETR', 'CMS',

  // ===== REAL ESTATE =====
  'PLD', 'AMT', 'CCI', 'EQIX', 'SPG', 'O', 'WELL', 'DLR', 'PSA', 'AVB',
  'EQR', 'VTR', 'ARE', 'UDR', 'MAA', 'ESS', 'INVH', 'SUI', 'CPT', 'KIM',

  // ===== BASIC MATERIALS =====
  'LIN', 'APD', 'SHW', 'ECL', 'DD', 'DOW', 'NEM', 'FCX', 'NUE', 'STLD',
  'CF', 'MOS', 'ALB', 'PPG', 'IFF', 'CE', 'EMN', 'CRH',

  // ===== CLEAN ENERGY =====
  'ENPH', 'SEDG', 'FSLR', 'RUN', 'NOVA',
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
