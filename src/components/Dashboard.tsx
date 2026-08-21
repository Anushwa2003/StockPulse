import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { sampleStocks, marketIndices, generateIndexHistoricalData, sampleNews } from '../data/mockData';
import { TrendingUp, TrendingDown, Activity, BarChart3, Newspaper, ArrowUpRight, ArrowDownRight, Clock, Crown } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Area, AreaChart, Tooltip } from 'recharts';
import { useAuth } from '../context/AuthContext';

function formatNumber(num: number): string {
  if (num >= 1000000000000) return `${(num / 1000000000000).toFixed(2)}T`;
  if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
  if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
  return num.toFixed(2);
}

function MiniChart({ data, color }: { data: { close: number }[]; color: string }) {
  const chartData = data.slice(-30).map((d, i) => ({ value: d.close, idx: i }));
  const min = Math.min(...chartData.map(d => d.value));
  const max = Math.max(...chartData.map(d => d.value));

  return (
    <div className="h-12 w-24">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="value" stroke={color} fill={`url(#gradient-${color})`} strokeWidth={1.5} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function Dashboard() {
  const navigate = useNavigate();
  const { isPremium } = useAuth();

  const niftyData = useMemo(() => generateIndexHistoricalData(marketIndices[0].currentValue), []);
  const sensexData = useMemo(() => generateIndexHistoricalData(marketIndices[1].currentValue), []);

  const topGainers = useMemo(() =>
    [...sampleStocks].sort((a, b) => b.changePercent - a.changePercent).slice(0, 5), []
  );

  const topLosers = useMemo(() =>
    [...sampleStocks].sort((a, b) => a.changePercent - b.changePercent).slice(0, 5), []
  );

  const mostActive = useMemo(() =>
    [...sampleStocks].sort((a, b) => b.volume - a.volume).slice(0, 5), []
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Market Overview</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            <Clock className="w-4 h-4 inline mr-1" />
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        {!isPremium && (
          <button
            onClick={() => navigate('/premium')}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-medium hover:from-yellow-600 hover:to-orange-600 transition-all"
          >
            <Crown className="w-4 h-4" />
            <span>Upgrade to Pro</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {marketIndices.map((index, idx) => {
          const data = idx === 0 ? niftyData : sensexData;
          const chartData = data.slice(-30);
          const isPositive = index.change >= 0;

          return (
            <div
              key={index.symbol}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {index.name}
                  </h3>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                    {index.currentValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                  </p>
                  <div className={`flex items-center mt-2 ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {isPositive ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
                    <span className="font-medium">
                      {isPositive ? '+' : ''}{index.change.toFixed(2)} ({isPositive ? '+' : ''}{index.changePercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500 dark:text-gray-400">
                  <div>High: {index.dayHigh.toLocaleString()}</div>
                  <div>Low: {index.dayLow.toLocaleString()}</div>
                </div>
              </div>

              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id={`area-${idx}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" hide />
                    <YAxis domain={['dataMin', 'dataMax']} hide />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255,255,255,0.95)',
                        border: 'none',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                      }}
                      labelStyle={{ color: '#374151' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="close"
                      stroke={isPositive ? '#10b981' : '#ef4444'}
                      fill={`url(#area-${idx})`}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-5 border border-green-200 dark:border-green-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-400">Advancing</p>
              <p className="text-2xl font-bold text-green-800 dark:text-green-300 mt-1">847</p>
            </div>
            <div className="p-3 bg-green-200 dark:bg-green-800 rounded-full">
              <TrendingUp className="w-6 h-6 text-green-700 dark:text-green-300" />
            </div>
          </div>
          <p className="text-xs text-green-600 dark:text-green-500 mt-2">+123 from yesterday</p>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-xl p-5 border border-red-200 dark:border-red-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-400">Declining</p>
              <p className="text-2xl font-bold text-red-800 dark:text-red-300 mt-1">621</p>
            </div>
            <div className="p-3 bg-red-200 dark:bg-red-800 rounded-full">
              <TrendingDown className="w-6 h-6 text-red-700 dark:text-red-300" />
            </div>
          </div>
          <p className="text-xs text-red-600 dark:text-red-500 mt-2">-78 from yesterday</p>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-400">Total Turnover</p>
              <p className="text-2xl font-bold text-blue-800 dark:text-blue-300 mt-1">82.4K Cr</p>
            </div>
            <div className="p-3 bg-blue-200 dark:bg-blue-800 rounded-full">
              <Activity className="w-6 h-6 text-blue-700 dark:text-blue-300" />
            </div>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-500 mt-2">+5.2% from average</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Top Gainers</h3>
            </div>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700">
            {topGainers.map(stock => (
              <button
                key={stock.id}
                onClick={() => navigate(`/stock/${stock.symbol}`)}
                className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{stock.symbol}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">{stock.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900 dark:text-white">{formatNumber(stock.currentPrice)}</p>
                  <p className="text-sm text-green-600 dark:text-green-400">+{stock.changePercent.toFixed(2)}%</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <TrendingDown className="w-5 h-5 text-red-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Top Losers</h3>
            </div>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700">
            {topLosers.map(stock => (
              <button
                key={stock.id}
                onClick={() => navigate(`/stock/${stock.symbol}`)}
                className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{stock.symbol}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">{stock.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900 dark:text-white">{formatNumber(stock.currentPrice)}</p>
                  <p className="text-sm text-red-600 dark:text-red-400">{stock.changePercent.toFixed(2)}%</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Most Active</h3>
            </div>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700">
            {mostActive.map(stock => (
              <button
                key={stock.id}
                onClick={() => navigate(`/stock/${stock.symbol}`)}
                className="w-full px-5 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{stock.symbol}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">{stock.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900 dark:text-white">{formatNumber(stock.volume)}</p>
                  <p className={`text-sm ${stock.changePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <Newspaper className="w-5 h-5 text-indigo-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Market News</h3>
          </div>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-gray-700">
          {sampleNews.slice(0, 5).map(article => (
            <div key={article.id} className="px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div className="flex items-start space-x-4">
                <div className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${article.sentimentLabel === 'positive' ? 'bg-green-500' : article.sentimentLabel === 'negative' ? 'bg-red-500' : 'bg-gray-400'
                  }`} />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">
                    {article.title}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {article.summary}
                  </p>
                  <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{article.source}</span>
                    <span>•</span>
                    <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
