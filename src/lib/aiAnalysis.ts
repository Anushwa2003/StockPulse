import type { Stock, TechnicalIndicators, NewsArticle, AIPrediction } from '../data/stocks';

function normalize(value: number, min: number, max: number): number {
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

function calculateTechnicalScore(indicators: TechnicalIndicators, currentPrice: number): number {
  let score = 50;

  if (indicators.rsi < 30) {
    score += 20;
  } else if (indicators.rsi > 70) {
    score -= 20;
  } else if (indicators.rsi < 45) {
    score += 10;
  } else if (indicators.rsi > 55) {
    score -= 10;
  }

  if (indicators.macdHistogram > 0) {
    score += 15;
  } else if (indicators.macdHistogram < 0) {
    score -= 15;
  }

  if (currentPrice > indicators.ema20 && currentPrice > indicators.ema50) {
    score += 15;
  } else if (currentPrice < indicators.ema20 && currentPrice < indicators.ema50) {
    score -= 15;
  }

  if (currentPrice > indicators.ema200) {
    score += 10;
  } else {
    score -= 10;
  }

  if (currentPrice < indicators.bollingerLower) {
    score += 5;
  } else if (currentPrice > indicators.bollingerUpper) {
    score -= 5;
  }

  return Math.max(0, Math.min(100, score));
}

function calculateMomentumScore(change: number, changePercent: number): number {
  let score = 50;
  score += changePercent * 5;
  return Math.max(0, Math.min(100, score));
}

function calculateVolatilityScore(week52High: number, week52Low: number, currentPrice: number, atr: number): number {
  const range = week52High - week52Low;
  const volatilityRatio = atr / currentPrice;
  let riskScore = 50;

  if (volatilityRatio > 0.04) {
    riskScore += 20;
  } else if (volatilityRatio > 0.02) {
    riskScore += 10;
  } else {
    riskScore -= 10;
  }

  const positionInRange = (currentPrice - week52Low) / range;
  if (positionInRange > 0.8) {
    riskScore += 10;
  } else if (positionInRange < 0.2) {
    riskScore -= 10;
  }

  return Math.max(0, Math.min(100, riskScore));
}

export function calculateSentimentScore(news: NewsArticle[]): { score: number; label: 'positive' | 'negative' | 'neutral' } {
  if (news.length === 0) {
    return { score: 0, label: 'neutral' };
  }

  const totalScore = news.reduce((sum, article) => {
    const relevance = article.relevanceScore || 0.5;
    return sum + article.sentimentScore * relevance;
  }, 0);

  const avgScore = totalScore / news.length;

  let label: 'positive' | 'negative' | 'neutral' = 'neutral';
  if (avgScore > 0.1) label = 'positive';
  else if (avgScore < -0.1) label = 'negative';

  return { score: Number(avgScore.toFixed(3)), label };
}

export function generateAIPrediction(
  stock: Stock,
  indicators: TechnicalIndicators,
  news: NewsArticle[]
): AIPrediction {
  const technicalScore = calculateTechnicalScore(indicators, stock.currentPrice);
  const momentumScore = calculateMomentumScore(stock.change, stock.changePercent);
  const volatilityScore = calculateVolatilityScore(stock.week52High, stock.week52Low, stock.currentPrice, indicators.atr);
  const sentimentResult = calculateSentimentScore(news);

  const weights = {
    technical: 0.35,
    sentiment: 0.25,
    momentum: 0.25,
    volatility: 0.15,
  };

  const weightedScore =
    technicalScore * weights.technical +
    (0.5 + sentimentResult.score * 0.5) * 100 * weights.sentiment +
    momentumScore * weights.momentum +
    (100 - volatilityScore) * weights.volatility;

  let direction: 'up' | 'down' | 'neutral' = 'neutral';
  if (weightedScore > 55) direction = 'up';
  else if (weightedScore < 45) direction = 'down';

  const probabilityUp = Math.min(95, Math.max(5, 50 + 0.4 * (weightedScore - 50) + (Math.random() - 0.5) * 10));
  const probabilityDown = 100 - probabilityUp;
  const confidence = Math.min(0.95, Math.max(0.4, 0.6 + Math.abs(weightedScore - 50) / 100));

  return {
    direction,
    probabilityUp: Number(probabilityUp.toFixed(1)),
    probabilityDown: Number(probabilityDown.toFixed(1)),
    confidence: Number(confidence.toFixed(2)),
    sentimentScore: sentimentResult.score,
    sentimentLabel: sentimentResult.label,
    newsCount: news.length,
    factors: {
      technical: Number((technicalScore / 100).toFixed(2)),
      sentiment: Number((sentimentResult.score / 2 + 0.5).toFixed(2)),
      momentum: Number((momentumScore / 100).toFixed(2)),
      volatility: Number((volatilityScore / 100).toFixed(2)),
    },
  };
}

export function generateRiskScore(
  stock: Stock,
  indicators: TechnicalIndicators,
  holdings: { symbol: string; weight: number }[]
): {
  overall: number;
  volatility: number;
  liquidity: number;
  concentration: number;
  beta: number;
  sharpeRatio: number;
  maxDrawdown: number;
} {
  const volatilityScore = Math.min(100, Math.max(0,
    (indicators.atr / stock.currentPrice) * 5000
  ));

  const liquidityScore = Math.min(100, Math.max(0,
    100 - Math.sqrt(stock.volume / stock.avgVolume) * 50
  ));

  const concentrationRisk = holdings.length === 0 ? 50 :
    Math.min(100, holdings.reduce((max, h) => Math.max(max, h.weight * 100), 0));

  const betaRisk = Math.min(100, Math.max(0, stock.beta * 50));

  const annualReturn = stock.changePercent * 252;
  const riskFreeRate = 6.5;
  const volatility = Math.sqrt(252) * (indicators.atr / stock.currentPrice) * 100;
  const sharpeRatio = volatility > 0 ? (annualReturn - riskFreeRate) / volatility : 0;

  const maxDrawdown = Math.min(100, ((stock.week52High - stock.week52Low) / stock.week52Low) * 100);

  const overall = (
    volatilityScore * 0.3 +
    liquidityScore * 0.15 +
    concentrationRisk * 0.2 +
    betaRisk * 0.25 +
    maxDrawdown * 0.1
  );

  return {
    overall: Number(overall.toFixed(1)),
    volatility: Number(volatilityScore.toFixed(1)),
    liquidity: Number(liquidityScore.toFixed(1)),
    concentration: Number(concentrationRisk.toFixed(1)),
    beta: Number(betaRisk.toFixed(1)),
    sharpeRatio: Number(sharpeRatio.toFixed(2)),
    maxDrawdown: Number(maxDrawdown.toFixed(1)),
  };
}

export function interpretRiskScore(score: number): { level: string; color: string; description: string } {
  if (score < 30) {
    return { level: 'Low', color: 'green', description: 'Conservative investment with stable returns expected' };
  } else if (score < 60) {
    return { level: 'Medium', color: 'yellow', description: 'Moderate risk with balanced growth potential' };
  } else if (score < 80) {
    return { level: 'High', color: 'orange', description: 'Elevated risk, requires careful monitoring' };
  } else {
    return { level: 'Very High', color: 'red', description: 'Extreme volatility expected, suitable only for risk-tolerant investors' };
  }
}
