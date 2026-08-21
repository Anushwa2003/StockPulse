import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sampleStocks, sampleNews, generateHistoricalData } from '../data/mockData';
import { calculateTechnicalIndicators, interpretRSI, interpretMACD, interpretPriceVsEma } from '../lib/technicalAnalysis';
import { generateAIPrediction, generateRiskScore, interpretRiskScore } from '../lib/aiAnalysis';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp, TrendingDown, Star, Bell, ArrowLeft, ChevronDown, ChevronUp,
  BarChart2, Target, Gauge, Newspaper, AlertTriangle, Activity, Clock
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid
} from 'recharts';
import { supabase } from '../lib/supabase';

function formatNumber(num: number): string {
  if (num >= 1000000000000) return `${(num / 1000000000000).toFixed(2)}T`;
  if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
  if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
  return num.toFixed(2);
}

export function StockDetail() {
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();
  const { user, isPremium } = useAuth();
  const [inWatchlist, setInWatchlist] = useState(false);
  const [alertPrice, setAlertPrice] = useState('');
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [timeRange, setTimeRange] = useState<'1M' | '3M' | '6M' | '1Y'>('3M');

  const stock = sampleStocks.find(s => s.symbol === symbol);

  const priceData = useMemo(() => {
    if (!stock) return [];
    const days = timeRange === '1M' ? 30 : timeRange === '3M' ? 90 : timeRange === '6M' ? 180 : 365;
    return generateHistoricalData(stock.currentPrice, days);
  }, [stock, timeRange]);

  const indicators = useMemo(() => {
    if (priceData.length < 50) return null;
    return calculateTechnicalIndicators(priceData);
  }, [priceData]);

  const prediction = useMemo(() => {
    if (!stock || !indicators) return null;
    return generateAIPrediction(stock, indicators, sampleNews.filter(n => n.stockId === stock.id));
  }, [stock, indicators]);

  const riskScore = useMemo(() => {
    if (!stock || !indicators) return null;
    return generateRiskScore(stock, indicators, []);
  }, [stock, indicators]);

  const relatedNews = useMemo(() => {
    if (!stock) return [];
    return sampleNews.filter(n => n.stockId === stock.id).slice(0, 5);
  }, [stock]);

  useEffect(() => {
    const checkWatchlist = async () => {
      if (!user || !symbol) return;
      const { data } = await supabase
        .from('watchlist_items')
        .select('id')
        .eq('symbol', symbol)
        .limit(1);
      setInWatchlist(Boolean(data && data.length > 0));
    };
    checkWatchlist();
  }, [user, symbol]);

  const toggleWatchlist = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (inWatchlist) {
      await supabase
        .from('watchlist_items')
        .delete()
        .eq('symbol', symbol);
      setInWatchlist(false);
    } else {
      const { data: watchlists } = await supabase
        .from('watchlists')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (!watchlists || watchlists.length === 0) {
        return;
      }

      await supabase
        .from('watchlist_items')
        .insert({
          watchlist_id: watchlists[0].id,
          symbol: symbol,
          company_name: stock?.name,
        });
      setInWatchlist(true);
    }
  };

  const createAlert = async () => {
    if (!user || !alertPrice || !stock) return;

    const { data: existingAlerts } = await supabase
      .from('price_alerts')
      .select('id')
      .eq('user_id', user.id)
      .eq('stock_id', stock.id)
      .eq('target_price', parseFloat(alertPrice))
      .limit(1);

    if (existingAlerts && existingAlerts.length > 0) {
      setShowAlertModal(false);
      setAlertPrice('');
      return;
    }

    const target = parseFloat(alertPrice);
    const alertType = target > stock.currentPrice ? 'above' : 'below';

    await supabase
      .from('price_alerts')
      .insert({
        user_id: user.id,
        stock_id: symbol,
        alert_type: alertType,
        target_price: target,
        symbol: symbol,
      });

    setShowAlertModal(false);
    setAlertPrice('');
  };

  if (!stock) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <p className="text-gray-600 dark:text-gray-400 mb-4">Stock not found</p>
        <button
          onClick={() => navigate('/search')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Back to Search
        </button>
      </div>
    );
  }

  const isPositive = stock.change >= 0;
  const rsiInterpretation = indicators ? interpretRSI(indicators.rsi) : 'N/A';
  const macdInterpretation = indicators ? interpretMACD(indicators.macd, indicators.macdSignal, indicators.macdHistogram) : 'N/A';
  const trendInterpretation = indicators ? interpretPriceVsEma(stock.currentPrice, indicators.ema20, indicators.ema50, indicators.ema200) : 'N/A';

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>

        <div className="flex-1">
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{stock.symbol}</h1>
            <span className="px-2 py-1 text-xs rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
              {stock.sector}
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400">{stock.name}</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={toggleWatchlist}
            className={`p-2 rounded-lg transition-colors ${inWatchlist
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
          >
            <Star className={`w-5 h-5 ${inWatchlist ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={() => setShowAlertModal(true)}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            <Bell className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6">
          <div>
            <p className="text-4xl font-bold text-gray-900 dark:text-white">
              ₹{stock.currentPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </p>
            <div className={`flex items-center space-x-2 mt-2 ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              <span className="text-lg font-medium">
                {isPositive ? '+' : ''}{stock.change.toFixed(2)} ({isPositive ? '+' : ''}{stock.changePercent.toFixed(2)}%)
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2 mt-4 md:mt-0">
            {(['1M', '3M', '6M', '1Y'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${timeRange === range
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={priceData.slice(-60)}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
              <XAxis dataKey="date" hide />
              <YAxis domain={['dataMin', 'dataMax']} hide />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  border: 'none',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                }}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke={isPositive ? '#10b981' : '#ef4444'}
                fill="url(#priceGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Open</p>
            <p className="font-medium text-gray-900 dark:text-white">{priceData[priceData.length - 1]?.open.toFixed(2) || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Day High</p>
            <p className="font-medium text-gray-900 dark:text-white">{stock.dayHigh.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Day Low</p>
            <p className="font-medium text-gray-900 dark:text-white">{stock.dayLow.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Volume</p>
            <p className="font-medium text-gray-900 dark:text-white">{formatNumber(stock.volume)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {prediction && (
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 dark:from-indigo-700 dark:to-purple-800 rounded-xl p-6 text-white">
            <div className="flex items-center space-x-2 mb-4">
              <Target className="w-5 h-5" />
              <h3 className="font-semibold">AI Prediction</h3>
            </div>

            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm text-indigo-200">Direction</p>
                <p className={`text-2xl font-bold ${prediction.direction === 'up' ? 'text-green-300' : prediction.direction === 'down' ? 'text-red-300' : 'text-white'}`}>
                  {prediction.direction.toUpperCase()}
                </p>
              </div>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center ${prediction.direction === 'up' ? 'bg-green-400/30' : prediction.direction === 'down' ? 'bg-red-400/30' : 'bg-white/20'
                }`}>
                <span className="text-2xl font-bold">
                  {prediction.probabilityUp.toFixed(0)}%
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-indigo-200">Probability Up</span>
                <span>{prediction.probabilityUp.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-indigo-200">Probability Down</span>
                <span>{prediction.probabilityDown.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-indigo-200">Confidence</span>
                <span>{(prediction.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>

            {!isPremium && (
              <button
                onClick={() => navigate('/premium')}
                className="mt-4 w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
              >
                Upgrade for Detailed Analysis
              </button>
            )}
          </div>
        )}

        {indicators && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <BarChart2 className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Technical Indicators</h3>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">RSI (14)</span>
                  <span className={`text-sm font-bold ${indicators.rsi > 70 ? 'text-red-500' : indicators.rsi < 30 ? 'text-green-500' : 'text-gray-700 dark:text-gray-300'}`}>
                    {indicators.rsi.toFixed(2)}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${indicators.rsi > 70 ? 'bg-red-500' : indicators.rsi < 30 ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min(100, indicators.rsi)}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{rsiInterpretation}</p>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">MACD</span>
                  <span className={`text-sm font-bold ${indicators.macdHistogram > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {indicators.macd.toFixed(4)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{macdInterpretation}</p>
              </div>

              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Trend Analysis</span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{trendInterpretation}</p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-600 dark:text-gray-400">
                  <span>EMA 20:</span>
                  <span className="float-right font-medium text-gray-900 dark:text-white">{indicators.ema20.toFixed(2)}</span>
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  <span>EMA 50:</span>
                  <span className="float-right font-medium text-gray-900 dark:text-white">{indicators.ema50.toFixed(2)}</span>
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  <span>EMA 200:</span>
                  <span className="float-right font-medium text-gray-900 dark:text-white">{indicators.ema200.toFixed(2)}</span>
                </div>
                <div className="text-gray-600 dark:text-gray-400">
                  <span>ATR:</span>
                  <span className="float-right font-medium text-gray-900 dark:text-white">{indicators.atr.toFixed(4)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {riskScore && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Gauge className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Risk Score</h3>
            </div>

            <div className="flex items-center justify-center mb-6">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="12"
                    className="text-gray-200 dark:text-gray-700"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="12"
                    strokeDasharray={`${riskScore.overall * 3.5} 352`}
                    className={riskScore.overall < 30 ? 'text-green-500' : riskScore.overall < 60 ? 'text-yellow-500' : riskScore.overall < 80 ? 'text-orange-500' : 'text-red-500'}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">{riskScore.overall.toFixed(0)}</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              {interpretRiskScore(riskScore.overall).level !== 'N/A' && (
                <div className={`text-center text-sm font-medium ${riskScore.overall < 30 ? 'text-green-600 dark:text-green-400' : riskScore.overall < 60 ? 'text-yellow-600 dark:text-yellow-400' : riskScore.overall < 80 ? 'text-orange-600 dark:text-orange-400' : 'text-red-600 dark:text-red-400'}`}>
                  {interpretRiskScore(riskScore.overall).level} Risk
                </div>
              )}

              <div className="text-center text-xs text-gray-500 dark:text-gray-400">
                {interpretRiskScore(riskScore.overall).description}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
              <div className="text-gray-600 dark:text-gray-400">
                <span>Volatility:</span>
                <span className="float-right font-medium text-gray-900 dark:text-white">{riskScore.volatility.toFixed(0)}</span>
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                <span>Beta Risk:</span>
                <span className="float-right font-medium text-gray-900 dark:text-white">{riskScore.beta.toFixed(0)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Activity className="w-5 h-5 text-green-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Key Metrics</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">Market Cap</p>
              <p className="font-semibold text-gray-900 dark:text-white">{formatNumber(stock.marketCap)}</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">P/E Ratio</p>
              <p className="font-semibold text-gray-900 dark:text-white">{stock.peRatio.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">EPS</p>
              <p className="font-semibold text-gray-900 dark:text-white">₹{stock.eps.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">Dividend Yield</p>
              <p className="font-semibold text-gray-900 dark:text-white">{stock.dividendYield.toFixed(2)}%</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">52W High</p>
              <p className="font-semibold text-gray-900 dark:text-white">₹{stock.week52High.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">52W Low</p>
              <p className="font-semibold text-gray-900 dark:text-white">₹{stock.week52Low.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">Avg Volume</p>
              <p className="font-semibold text-gray-900 dark:text-white">{formatNumber(stock.avgVolume)}</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">Beta</p>
              <p className="font-semibold text-gray-900 dark:text-white">{stock.beta.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Newspaper className="w-5 h-5 text-indigo-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Related News</h3>
            </div>
          </div>

          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {relatedNews.length > 0 ? relatedNews.map(article => (
              <div key={article.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-start space-x-3">
                  <div className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${article.sentimentLabel === 'positive' ? 'bg-green-500' : article.sentimentLabel === 'negative' ? 'bg-red-500' : 'bg-gray-400'}`} />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                      {article.title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                      {article.summary}
                    </p>
                    <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{article.source}</span>
                      <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                No recent news available
              </div>
            )}
          </div>
        </div>
      </div>

      {showAlertModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Create Price Alert</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Target Price
              </label>
              <input
                type="number"
                value={alertPrice}
                onChange={(e) => setAlertPrice(e.target.value)}
                placeholder={`Current: ${stock.currentPrice.toFixed(2)}`}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Alert will be triggered when price goes {alertPrice && parseFloat(alertPrice) > stock.currentPrice ? 'above' : 'below'} target
              </p>
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowAlertModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={createAlert}
                disabled={!alertPrice}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
              >
                Create Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
