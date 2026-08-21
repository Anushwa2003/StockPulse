export interface Stock {
  id: string;
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  industry: string;
  marketCap: number;
  currentPrice: number;
  previousClose: number;
  dayHigh: number;
  dayLow: number;
  week52High: number;
  week52Low: number;
  peRatio: number;
  eps: number;
  dividendYield: number;
  volume: number;
  avgVolume: number;
  beta: number;
  change: number;
  changePercent: number;
}

export interface MarketIndex {
  symbol: string;
  name: string;
  currentValue: number;
  previousClose: number;
  change: number;
  changePercent: number;
  dayHigh: number;
  dayLow: number;
}

export interface PricePoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  rsi: number;
  macd: number;
  macdSignal: number;
  macdHistogram: number;
  ema20: number;
  ema50: number;
  ema200: number;
  sma20: number;
  sma50: number;
  bollingerUpper: number;
  bollingerLower: number;
  atr: number;
}

export interface AIPrediction {
  direction: 'up' | 'down' | 'neutral';
  probabilityUp: number;
  probabilityDown: number;
  confidence: number;
  sentimentScore: number;
  sentimentLabel: 'positive' | 'negative' | 'neutral';
  newsCount: number;
  factors: {
    technical: number;
    sentiment: number;
    momentum: number;
    volatility: number;
  };
}

export interface NewsArticle {
  id: string;
  stockId: string;
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
  sentimentScore: number;
  sentimentLabel: 'positive' | 'negative' | 'neutral';
  relevanceScore: number;
}

export interface Alert {
  id: string;
  stockId: string;
  stockSymbol: string;
  stockName: string;
  alertType: 'above' | 'below' | 'change_percent';
  targetPrice?: number;
  targetChangePercent?: number;
  isActive: boolean;
  isTriggered: boolean;
  triggeredAt?: Date;
  createdAt: Date;
}

export interface Watchlist {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  stockCount: number;
  createdAt: Date;
}

export interface WatchlistItem {
  id: string;
  watchlistId: string;
  stockId: string;
  stockSymbol: string;
  stockName: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  addedAt: Date;
  notes?: string;
}

export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  totalValue: number;
  cashBalance: number;
  holdings: PortfolioHolding[];
  createdAt: Date;
}

export interface PortfolioHolding {
  id: string;
  portfolioId: string;
  stockId: string;
  stockSymbol: string;
  stockName: string;
  quantity: number;
  avgBuyPrice: number;
  currentPrice: number;
  totalInvestment: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
  buyDate: Date;
}

export interface RiskScore {
  overall: number;
  volatility: number;
  liquidity: number;
  concentration: number;
  beta: number;
  sharpeRatio: number;
  maxDrawdown: number;
}
