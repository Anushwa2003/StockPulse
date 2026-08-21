import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { sampleStocks } from '../data/mockData';
import { Plus, Trash2, Star, TrendingUp, TrendingDown, X, Search, Edit2 } from 'lucide-react';

interface WatchlistStock {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  addedAt: Date;
}

export function Watchlist() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stocks, setStocks] = useState<WatchlistStock[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const mockWatchlist: WatchlistStock[] = [
    {
      id: '1',
      symbol: 'BAJFINANCE',
      name: 'Bajaj Finance Ltd.',
      currentPrice: 7256.80,
      change: 38.30,
      changePercent: 0.53,
      addedAt: new Date(),
    },
    {
      id: '2',
      symbol: 'TATAMOTORS',
      name: 'Tata Motors Ltd.',
      currentPrice: 962.45,
      change: 13.65,
      changePercent: 1.44,
      addedAt: new Date(),
    },
    {
      id: '3',
      symbol: 'SUNPHARMA',
      name: 'Sun Pharmaceutical Industries Ltd.',
      currentPrice: 1586.40,
      change: 8.20,
      changePercent: 0.52,
      addedAt: new Date(),
    },
    {
      id: '4',
      symbol: 'TATASTEEL',
      name: 'Tata Steel Ltd.',
      currentPrice: 142.85,
      change: 4.25,
      changePercent: 3.07,
      addedAt: new Date(),
    },
    {
      id: '5',
      symbol: 'DMART',
      name: 'Avenue Supermarts Ltd.',
      currentPrice: 3856.80,
      change: 14.30,
      changePercent: 0.37,
      addedAt: new Date(),
    },
  ];

  useEffect(() => {
    if (!user) {
      setStocks(mockWatchlist);
      setLoading(false);
      return;
    }

    const fetchWatchlist = async () => {
      try {
        const { data } = await supabase
          .from('watchlist_items')
          .select('*')
          .order('added_at', { ascending: false });

        if (data) {
          const watchlistStocks = data.map(item => {
            const stock = sampleStocks.find(s => s.symbol === item.symbol);
            return {
              id: item.id,
              symbol: item.symbol,
              name: stock?.name || item.company_name || item.symbol,
              currentPrice: stock?.currentPrice || 0,
              change: stock?.change || 0,
              changePercent: stock?.changePercent || 0,
              addedAt: new Date(item.added_at),
            };
          });
          setStocks(watchlistStocks);
        }
      } catch {
        setStocks(mockWatchlist);
      } finally {
        setLoading(false);
      }
    };

    fetchWatchlist();
  }, [user, mockWatchlist]);

  const filteredStocks = sampleStocks.filter(stock =>
    !stocks.some(s => s.symbol === stock.symbol) &&
    (stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const addStock = async (symbol: string) => {
    const stock = sampleStocks.find(s => s.symbol === symbol);
    if (!stock) return;

    if (user) {
      try {
        const { data: watchlists } = await supabase
          .from('watchlists')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (watchlists && watchlists.length > 0) {
          await supabase
            .from('watchlist_items')
            .insert({
              watchlist_id: watchlists[0].id,
              symbol: symbol,
              company_name: stock.name,
            });
        }
      } catch (error) {
        console.error('Error adding to watchlist:', error);
      }
    }

    const newStock: WatchlistStock = {
      id: Date.now().toString(),
      symbol: stock.symbol,
      name: stock.name,
      currentPrice: stock.currentPrice,
      change: stock.change,
      changePercent: stock.changePercent,
      addedAt: new Date(),
    };

    setStocks([...stocks, newStock]);
    setShowAddModal(false);
    setSearchQuery('');
  };

  const removeStock = async (id: string, symbol: string) => {
    if (user) {
      try {
        await supabase
          .from('watchlist_items')
          .delete()
          .eq('symbol', symbol);
      } catch {
      }
    }

    setStocks(stocks.filter(s => s.id !== id));
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Watchlist</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {stocks.length} stocks in your watchlist
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Stock</span>
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Change
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Added On
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {stocks.map(stock => (
                <tr
                  key={stock.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => navigate(`/stock/${stock.symbol}`)}
                      className="text-left group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                          <Star className="w-4 h-4 text-yellow-600 dark:text-yellow-400 fill-current" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {stock.symbol}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                            {stock.name}
                          </p>
                        </div>
                      </div>
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <p className="font-medium text-gray-900 dark:text-white">
                      ₹{stock.currentPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className={`flex items-center justify-end space-x-1 ${stock.changePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {stock.changePercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span className="font-medium">
                        {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500 dark:text-gray-400">
                    {stock.addedAt.toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => removeStock(stock.id, stock.symbol)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {stocks.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full mb-3">
                        <Star className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 font-medium">Your watchlist is empty</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                        Add stocks to track their performance
                      </p>
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="mt-4 flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Your First Stock</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Add to Watchlist</h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSearchQuery('');
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search stocks..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>

            <div className="max-h-80 overflow-y-auto">
              {filteredStocks.length > 0 ? (
                filteredStocks.map(stock => (
                  <button
                    key={stock.symbol}
                    onClick={() => addStock(stock.symbol)}
                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between rounded-lg mb-1 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{stock.symbol}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{stock.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900 dark:text-white">
                        ₹{stock.currentPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </p>
                      <p className={`text-sm ${stock.changePercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                        {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                      </p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {searchQuery ? 'No stocks found matching your search' : 'All stocks are already in your watchlist'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
