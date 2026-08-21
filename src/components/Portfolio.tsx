import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { sampleStocks } from '../data/mockData';
import {
  Plus, PieChart, TrendingUp, TrendingDown, DollarSign, Percent,
  Briefcase, Trash2, Edit2, X, Search
} from 'lucide-react';
import { PieChart as RechartsPie, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface Holding {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  currentPrice: number;
  investment: number;
  currentValue: number;
  profitLoss: number;
  profitLossPercent: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export function Portfolio() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState('');
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [stockSearch, setStockSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const mockHoldings: Holding[] = useMemo(() => [
    {
      id: '1',
      symbol: 'RELIANCE',
      name: 'Reliance Industries Ltd.',
      quantity: 50,
      avgPrice: 2350,
      currentPrice: 2456.80,
      investment: 117500,
      currentValue: 122840,
      profitLoss: 5340,
      profitLossPercent: 4.55,
    },
    {
      id: '2',
      symbol: 'TCS',
      name: 'Tata Consultancy Services Ltd.',
      quantity: 25,
      avgPrice: 3700,
      currentPrice: 3845.60,
      investment: 92500,
      currentValue: 96140,
      profitLoss: 3640,
      profitLossPercent: 3.93,
    },
    {
      id: '3',
      symbol: 'HDFCBANK',
      name: 'HDFC Bank Ltd.',
      quantity: 100,
      avgPrice: 1580,
      currentPrice: 1654.25,
      investment: 158000,
      currentValue: 165425,
      profitLoss: 7425,
      profitLossPercent: 4.70,
    },
    {
      id: '4',
      symbol: 'INFY',
      name: 'Infosys Ltd.',
      quantity: 75,
      avgPrice: 1420,
      currentPrice: 1485.30,
      investment: 106500,
      currentValue: 111397.5,
      profitLoss: 4897.5,
      profitLossPercent: 4.60,
    },
    {
      id: '5',
      symbol: 'ICICIBANK',
      name: 'ICICI Bank Ltd.',
      quantity: 120,
      avgPrice: 980,
      currentPrice: 1086.45,
      investment: 117600,
      currentValue: 130374,
      profitLoss: 12774,
      profitLossPercent: 10.86,
    },
  ], []);

  useEffect(() => {
    if (!user) {
      setHoldings(mockHoldings);
      setLoading(false);
      return;
    }

    const fetchHoldings = async () => {
      try {
        const { data: portfolioData } = await supabase
          .from('portfolios')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (portfolioData) {
          const { data: holdingsData } = await supabase
            .from('portfolio_holdings')
            .select('*')
            .eq('portfolio_id', portfolioData.id);

          if (holdingsData) {
            const formattedHoldings = holdingsData.map(h => {
              const stock = sampleStocks.find(s => s.symbol === h.symbol);
              return {
                id: h.id,
                symbol: h.symbol,
                name: stock?.name || h.symbol,
                quantity: h.quantity,
                avgPrice: h.avg_buy_price,
                currentPrice: stock?.currentPrice || h.avg_buy_price,
                investment: h.total_investment,
                currentValue: h.quantity * (stock?.currentPrice || h.avg_buy_price),
                profitLoss: 0,
                profitLossPercent: 0,
              };
            });
            setHoldings(formattedHoldings);
          }
        }
      } catch {
        setHoldings(mockHoldings);
      } finally {
        setLoading(false);
      }
    };

    fetchHoldings();
  }, [user, mockHoldings]);

  const portfolioSummary = useMemo(() => {
    const totalInvestment = holdings.reduce((sum, h) => sum + h.investment, 0);
    const totalValue = holdings.reduce((sum, h) => sum + h.currentValue, 0);
    const totalProfitLoss = totalValue - totalInvestment;
    const totalProfitLossPercent = totalInvestment > 0 ? (totalProfitLoss / totalInvestment) * 100 : 0;

    return {
      totalInvestment,
      totalValue,
      totalProfitLoss,
      totalProfitLossPercent,
      dayChange: totalValue * 0.0058,
      dayChangePercent: 0.58,
    };
  }, [holdings]);

  const sectorAllocation = useMemo(() => {
    const sectors: Record<string, number> = {};
    holdings.forEach(h => {
      const stock = sampleStocks.find(s => s.symbol === h.symbol);
      const sector = stock?.sector || 'Other';
      sectors[sector] = (sectors[sector] || 0) + h.currentValue;
    });

    return Object.entries(sectors).map(([name, value], idx) => ({
      name,
      value,
      percentage: portfolioSummary.totalValue > 0 ? (value / portfolioSummary.totalValue) * 100 : 0,
      color: COLORS[idx % COLORS.length],
    }));
  }, [holdings, portfolioSummary.totalValue]);

  const filteredStocks = useMemo(() => {
    return sampleStocks.filter(s =>
      s.symbol.toLowerCase().includes(stockSearch.toLowerCase()) ||
      s.name.toLowerCase().includes(stockSearch.toLowerCase())
    ).slice(0, 10);
  }, [stockSearch]);

  const addHolding = async () => {
    if (!selectedStock || !quantity || !buyPrice) return;

    const stock = sampleStocks.find(s => s.symbol === selectedStock);
    if (!stock) return;

    const qty = parseFloat(quantity);
    const price = parseFloat(buyPrice);
    const newHolding: Holding = {
      id: Date.now().toString(),
      symbol: selectedStock,
      name: stock.name,
      quantity: qty,
      avgPrice: price,
      currentPrice: stock.currentPrice,
      investment: qty * price,
      currentValue: qty * stock.currentPrice,
      profitLoss: qty * (stock.currentPrice - price),
      profitLossPercent: ((stock.currentPrice - price) / price) * 100,
    };

    setHoldings([...holdings, newHolding]);
    setShowAddModal(false);
    setSelectedStock('');
    setQuantity('');
    setBuyPrice('');
    setStockSearch('');
  };

  const removeHolding = (id: string) => {
    setHoldings(holdings.filter(h => h.id !== id));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Portfolio</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Track your investments and performance</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Holding</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Value</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                ₹{portfolioSummary.totalValue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Investment</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                ₹{portfolioSummary.totalInvestment.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
              <Briefcase className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total P&L</p>
              <p className={`text-2xl font-bold mt-1 ${portfolioSummary.totalProfitLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {portfolioSummary.totalProfitLoss >= 0 ? '+' : ''}₹{Math.abs(portfolioSummary.totalProfitLoss).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
              <p className={`text-sm ${portfolioSummary.totalProfitLossPercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {portfolioSummary.totalProfitLossPercent >= 0 ? '+' : ''}{portfolioSummary.totalProfitLossPercent.toFixed(2)}%
              </p>
            </div>
            <div className={`p-3 rounded-full ${portfolioSummary.totalProfitLoss >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
              {portfolioSummary.totalProfitLoss >= 0 ? (
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              ) : (
                <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Day Change</p>
              <p className={`text-2xl font-bold mt-1 ${portfolioSummary.dayChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {portfolioSummary.dayChange >= 0 ? '+' : ''}₹{Math.abs(portfolioSummary.dayChange).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </p>
              <p className={`text-sm ${portfolioSummary.dayChangePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {portfolioSummary.dayChangePercent >= 0 ? '+' : ''}{portfolioSummary.dayChangePercent.toFixed(2)}%
              </p>
            </div>
            <div className={`p-3 rounded-full ${portfolioSummary.dayChange >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
              {portfolioSummary.dayChange >= 0 ? (
                <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
              ) : (
                <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Holdings</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Stock</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Qty</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Avg Price</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Current</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Investment</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">P&L</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {holdings.map(holding => (
                  <tr
                    key={holding.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigate(`/stock/${holding.symbol}`)}
                        className="text-left"
                      >
                        <p className="font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400">
                          {holding.symbol}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{holding.name}</p>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right text-gray-900 dark:text-white">{holding.quantity}</td>
                    <td className="px-6 py-4 text-right text-gray-900 dark:text-white">₹{holding.avgPrice.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-gray-900 dark:text-white">₹{holding.currentPrice.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right text-gray-900 dark:text-white">
                      ₹{holding.investment.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={`${holding.profitLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        <p className="font-medium">
                          {holding.profitLoss >= 0 ? '+' : ''}₹{holding.profitLoss.toFixed(0)}
                        </p>
                        <p className="text-xs">
                          {holding.profitLossPercent >= 0 ? '+' : ''}{holding.profitLossPercent.toFixed(2)}%
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => removeHolding(holding.id)}
                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}

                {holdings.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                      No holdings yet. Add your first stock to start tracking your portfolio.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <PieChart className="w-5 h-5 text-indigo-500" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Sector Allocation</h3>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={sectorAllocation}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                >
                  {sectorAllocation.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                />
                <Legend />
              </RechartsPie>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 space-y-2">
            {sectorAllocation.slice(0, 5).map(sector => (
              <div key={sector.name} className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: sector.color }} />
                  <span className="text-sm text-gray-600 dark:text-gray-400">{sector.name}</span>
                </div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {sector.percentage.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add Holding</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Stock
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={stockSearch}
                    onChange={(e) => setStockSearch(e.target.value)}
                    placeholder="Search stocks..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                {stockSearch && (
                  <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                    {filteredStocks.map(stock => (
                      <button
                        key={stock.symbol}
                        onClick={() => {
                          setSelectedStock(stock.symbol);
                          setStockSearch('');
                          setBuyPrice(stock.currentPrice.toString());
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{stock.symbol}</p>
                          <p className="text-xs text-gray-500">{stock.name}</p>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">₹{stock.currentPrice}</p>
                      </button>
                    ))}
                  </div>
                )}
                {selectedStock && (
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-medium text-blue-700 dark:text-blue-400">{selectedStock}</p>
                      <p className="text-xs text-blue-600 dark:text-blue-500">
                        {sampleStocks.find(s => s.symbol === selectedStock)?.name}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedStock('')}
                      className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded"
                    >
                      <X className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Buy Price
                  </label>
                  <input
                    type="number"
                    value={buyPrice}
                    onChange={(e) => setBuyPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              {selectedStock && quantity && buyPrice && (
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Total Investment</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      ₹{(parseFloat(quantity) * parseFloat(buyPrice)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
              )}

              <button
                onClick={addHolding}
                disabled={!selectedStock || !quantity || !buyPrice}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add to Portfolio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
