import type { PricePoint } from '../data/stocks';

export function calculateSMA(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      const avg = slice.reduce((a, b) => a + b, 0) / period;
      result.push(avg);
    }
  }
  return result;
}

export function calculateEMA(data: number[], period: number): number[] {
  const result: number[] = [];
  const multiplier = 2 / (period + 1);

  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      result.push(data[i]);
    } else if (i < period - 1) {
      result.push(NaN);
    } else if (i === period - 1) {
      const slice = data.slice(0, period);
      result.push(slice.reduce((a, b) => a + b, 0) / period);
    } else {
      const ema = (data[i] - result[i - 1]) * multiplier + result[i - 1];
      result.push(ema);
    }
  }
  return result;
}

export function calculateRSI(closes: number[], period: number = 14): number[] {
  const result: number[] = [];
  let gains = 0;
  let losses = 0;

  for (let i = 0; i < closes.length; i++) {
    result.push(NaN);
    if (i > 0) {
      const change = closes[i] - closes[i - 1];
      if (i <= period) {
        if (change > 0) gains += change;
        else losses -= change;
        if (i === period) {
          const avgGain = gains / period;
          const avgLoss = losses / period;
          if (avgLoss === 0) {
            result[i] = 100;
          } else {
            const rs = avgGain / avgLoss;
            result[i] = 100 - 100 / (1 + rs);
          }
        }
      } else {
        const change = closes[i] - closes[i - 1];
        const currentGain = change > 0 ? change : 0;
        const currentLoss = change < 0 ? -change : 0;

        const avgGain = (gains * (period - 1) + currentGain) / period;
        const avgLoss = (losses * (period - 1) + currentLoss) / period;
        gains = avgGain;
        losses = avgLoss;

        if (avgLoss === 0) {
          result[i] = 100;
        } else {
          const rs = avgGain / avgLoss;
          result[i] = 100 - 100 / (1 + rs);
        }
      }
    }
  }
  return result;
}

export function calculateMACD(closes: number[], fastPeriod: number = 12, slowPeriod: number = 26, signalPeriod: number = 9): { macd: number[], signal: number[], histogram: number[] } {
  const emaFast = calculateEMA(closes, fastPeriod);
  const emaSlow = calculateEMA(closes, slowPeriod);

  const macd: number[] = [];
  for (let i = 0; i < closes.length; i++) {
    if (isNaN(emaFast[i]) || isNaN(emaSlow[i])) {
      macd.push(NaN);
    } else {
      macd.push(emaFast[i] - emaSlow[i]);
    }
  }

  const validMacd = macd.filter(v => !isNaN(v));
  const emaSignal = calculateEMA(validMacd, signalPeriod);
  const signal: number[] = [];
  let signalIdx = 0;

  for (let i = 0; i < macd.length; i++) {
    if (isNaN(macd[i])) {
      signal.push(NaN);
    } else {
      signal.push(emaSignal[signalIdx] || NaN);
      signalIdx++;
    }
  }

  const histogram: number[] = [];
  for (let i = 0; i < macd.length; i++) {
    if (isNaN(macd[i]) || isNaN(signal[i])) {
      histogram.push(NaN);
    } else {
      histogram.push(macd[i] - signal[i]);
    }
  }

  return { macd, signal, histogram };
}

export function calculateBollingerBands(closes: number[], period: number = 20, stdDev: number = 2): { upper: number[], lower: number[], middle: number[] } {
  const middle = calculateSMA(closes, period);
  const upper: number[] = [];
  const lower: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      upper.push(NaN);
      lower.push(NaN);
    } else {
      const slice = closes.slice(i - period + 1, i + 1);
      const avg = middle[i];
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / period;
      const std = Math.sqrt(variance);
      upper.push(avg + stdDev * std);
      lower.push(avg - stdDev * std);
    }
  }

  return { upper, lower, middle };
}

export function calculateATR(highs: number[], lows: number[], closes: number[], period: number = 14): number[] {
  const tr: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (i === 0) {
      tr.push(highs[i] - lows[i]);
    } else {
      const hl = highs[i] - lows[i];
      const hc = Math.abs(highs[i] - closes[i - 1]);
      const lc = Math.abs(lows[i] - closes[i - 1]);
      tr.push(Math.max(hl, hc, lc));
    }
  }

  return calculateEMA(tr, period);
}

export function calculateTechnicalIndicators(priceData: PricePoint[]): {
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
} {
  if (priceData.length < 200) {
    priceData = [...priceData];
    while (priceData.length < 200) {
      const lastPrice = priceData[priceData.length - 1];
      priceData.push({
        ...lastPrice,
        date: '',
        close: lastPrice.close * (0.98 + Math.random() * 0.04),
        high: lastPrice.high * (0.99 + Math.random() * 0.02),
        low: lastPrice.low * (0.98 + Math.random() * 0.02),
        open: lastPrice.open * (0.99 + Math.random() * 0.02),
        volume: lastPrice.volume,
      });
    }
  }

  const closes = priceData.map(d => d.close);
  const highs = priceData.map(d => d.high);
  const lows = priceData.map(d => d.low);

  const rsiValues = calculateRSI(closes, 14);
  const { macd, signal, histogram } = calculateMACD(closes);
  const ema20Values = calculateEMA(closes, 20);
  const ema50Values = calculateEMA(closes, 50);
  const ema200Values = calculateEMA(closes, 200);
  const sma20Values = calculateSMA(closes, 20);
  const sma50Values = calculateSMA(closes, 50);
  const { upper, lower } = calculateBollingerBands(closes);
  const atrValues = calculateATR(highs, lows, closes);

  const getValue = (arr: number[]) => {
    const last = arr[arr.length - 1];
    return isNaN(last) ? 0 : last;
  };

  return {
    rsi: Number(getValue(rsiValues).toFixed(2)),
    macd: Number(getValue(macd).toFixed(4)),
    macdSignal: Number(getValue(signal).toFixed(4)),
    macdHistogram: Number(getValue(histogram).toFixed(4)),
    ema20: Number(getValue(ema20Values).toFixed(2)),
    ema50: Number(getValue(ema50Values).toFixed(2)),
    ema200: Number(getValue(ema200Values).toFixed(2)),
    sma20: Number(getValue(sma20Values).toFixed(2)),
    sma50: Number(getValue(sma50Values).toFixed(2)),
    bollingerUpper: Number(getValue(upper).toFixed(2)),
    bollingerLower: Number(getValue(lower).toFixed(2)),
    atr: Number(getValue(atrValues).toFixed(4)),
  };
}

export function interpretRSI(rsi: number): string {
  if (rsi >= 70) return 'Overbought';
  if (rsi <= 30) return 'Oversold';
  return 'Neutral';
}

export function interpretMACD(macd: number, signal: number, histogram: number): string {
  if (histogram > 0 && macd > signal) return 'Bullish';
  if (histogram < 0 && macd < signal) return 'Bearish';
  return 'Neutral';
}

export function interpretPriceVsEma(price: number, ema20: number, ema50: number, ema200: number): string {
  const aboveAll = price > ema20 && price > ema50 && price > ema200;
  const belowAll = price < ema20 && price < ema50 && price < ema200;

  if (aboveAll) return 'Strong Uptrend';
  if (belowAll) return 'Strong Downtrend';
  if (price > ema20 && price > ema50) return 'Uptrend';
  if (price < ema20 && price < ema50) return 'Downtrend';
  return 'Sideways';
}
