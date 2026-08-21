import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { sampleStocks } from '../data/mockData';
import {
  Bell, Plus, Trash2, TrendingUp, TrendingDown, Percent, X, Search,
  AlertCircle, CheckCircle, Clock
} from 'lucide-react';

interface PriceAlert {
  id: string;
  symbol: string;
  stockName: string;
  currentPrice: number;
  targetPrice: number;
  alertType: 'above' | 'below' | 'change_percent';
  isActive: boolean;
  isTriggered: boolean;
  triggeredAt?: Date;
  createdAt: Date;
}

export function Alerts() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState('');
  const [alertType, setAlertType] = useState<'above' | 'below' | 'change_percent'>('above');
  const [targetPrice, setTargetPrice] = useState('');
  const [targetPercent, setTargetPercent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const mockAlerts: PriceAlert[] = [
    {
      id: '1',
      symbol: 'RELIANCE',
      stockName: 'Reliance Industries Ltd.',
      currentPrice: 2456.80,
      targetPrice: 2600,
      alertType: 'above',
      isActive: true,
      isTriggered: false,
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
    {
      id: '2',
      symbol: 'TCS',
      stockName: 'Tata Consultancy Services Ltd.',
      currentPrice: 3845.60,
      targetPrice: 3700,
      alertType: 'below',
      isActive: true,
      isTriggered: false,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
    {
      id: '3',
      symbol: 'TATASTEEL',
      stockName: 'Tata Steel Ltd.',
      currentPrice: 142.85,
      targetPrice: 150,
      alertType: 'above',
      isActive: false,
      isTriggered: true,
      triggeredAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    },
    {
      id: '4',
      symbol: 'HDFCBANK',
      stockName: 'HDFC Bank Ltd.',
      currentPrice: 1654.25,
      targetPrice: 1700,
      alertType: 'above',
      isActive: true,
      isTriggered: false,
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    },
  ];

  useEffect(() => {
    if (!user) {
      setAlerts(mockAlerts);
      setLoading(false);
      return;
    }

    const fetchAlerts = async () => {
      try {
        const { data } = await supabase
          .from('price_alerts')
          .select('*')
          .order('created_at', { ascending: false });

        if (data) {
          const formattedAlerts: PriceAlert[] = data.map(alert => {
            const stock = sampleStocks.find(s => s.symbol === alert.symbol);
            return {
              id: alert.id,
              symbol: alert.symbol,
              stockName: stock?.name || alert.symbol,
              currentPrice: stock?.currentPrice || 0,
              targetPrice: alert.target_price || 0,
              alertType: alert.alert_type,
              isActive: alert.is_active,
              isTriggered: alert.is_triggered,
              triggeredAt: alert.triggered_at ? new Date(alert.triggered_at) : undefined,
              createdAt: new Date(alert.created_at),
            };
          });
          setAlerts(formattedAlerts);
        }
      } catch {
        setAlerts(mockAlerts);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [user, mockAlerts]);

  const filteredStocks = sampleStocks.filter(stock =>
    stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
    stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 10);

  const createAlert = async () => {
    if (!selectedStock) return;

    const stock = sampleStocks.find(s => s.symbol === selectedStock);
    if (!stock) return;

    const target = alertType === 'change_percent'
      ? stock.currentPrice * (1 + parseFloat(targetPercent || '0') / 100)
      : parseFloat(targetPrice || '0');

    if (user) {
      try {
        await supabase
          .from('price_alerts')
          .insert({
            user_id: user.id,
            symbol: selectedStock,
            alert_type: alertType,
            target_price: target,
            is_active: true,
          });
      } catch (error) {
        console.error('Error creating alert:', error);
      }
    }

    const newAlert: PriceAlert = {
      id: Date.now().toString(),
      symbol: selectedStock,
      stockName: stock.name,
      currentPrice: stock.currentPrice,
      targetPrice: target,
      alertType,
      isActive: true,
      isTriggered: false,
      createdAt: new Date(),
    };

    setAlerts([newAlert, ...alerts]);
    setShowCreateModal(false);
    setSelectedStock('');
    setTargetPrice('');
    setTargetPercent('');
    setSearchQuery('');
    setAlertType('above');
  };

  const toggleAlert = async (id: string) => {
    const alert = alerts.find(a => a.id === id);
    if (!alert) return;

    if (user) {
      try {
        await supabase
          .from('price_alerts')
          .update({ is_active: !alert.isActive })
          .eq('id', id);
      } catch {
      }
    }

    setAlerts(alerts.map(a =>
      a.id === id ? { ...a, isActive: !a.isActive } : a
    ));
  };

  const deleteAlert = async (id: string) => {
    if (user) {
      try {
        await supabase
          .from('price_alerts')
          .delete()
          .eq('id', id);
      } catch {
      }
    }

    setAlerts(alerts.filter(a => a.id !== id));
  };

  const activeAlerts = alerts.filter(a => a.isActive && !a.isTriggered);
  const triggeredAlerts = alerts.filter(a => a.isTriggered);
  const inactiveAlerts = alerts.filter(a => !a.isActive && !a.isTriggered);

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Price Alerts</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Get notified when stocks reach your target price
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Alert</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Alerts</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{activeAlerts.length}</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
              <Bell className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Triggered</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{triggeredAlerts.length}</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Paused</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{inactiveAlerts.length}</p>
            </div>
            <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full">
              <Clock className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Condition</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Current Price</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Target</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {alerts.map(alert => {
                const progress = alert.alertType === 'change_percent' ? 50 :
                  Math.min(100, Math.max(0,
                    (alert.currentPrice / alert.targetPrice) * 100
                  ));
                const distance = ((alert.targetPrice - alert.currentPrice) / alert.currentPrice * 100).toFixed(2);

                return (
                  <tr key={alert.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => navigate(`/stock/${alert.symbol}`)}
                        className="text-left group"
                      >
                        <p className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {alert.symbol}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[180px]">
                          {alert.stockName}
                        </p>
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className={`p-1.5 rounded-lg ${alert.alertType === 'above' ? 'bg-green-100 dark:bg-green-900/30' :
                            alert.alertType === 'below' ? 'bg-red-100 dark:bg-red-900/30' :
                              'bg-blue-100 dark:bg-blue-900/30'
                          }`}>
                          {alert.alertType === 'above' ? (
                            <TrendingUp className="w-4 h-4 text-green-600 dark:text-green-400" />
                          ) : alert.alertType === 'below' ? (
                            <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                          ) : (
                            <Percent className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          )}
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {alert.alertType === 'above' ? 'Price Above' :
                            alert.alertType === 'below' ? 'Price Below' :
                              'Change %'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <p className="font-medium text-gray-900 dark:text-white">
                        ₹{alert.currentPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          ₹{alert.targetPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </p>
                        <p className={`text-xs ${parseFloat(distance) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {parseFloat(distance) > 0 ? '+' : ''}{distance}% away
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {alert.isTriggered ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Triggered
                        </span>
                      ) : alert.isActive ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400">
                          Paused
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {!alert.isTriggered && (
                          <button
                            onClick={() => toggleAlert(alert.id)}
                            className={`p-2 rounded-lg transition-colors ${alert.isActive
                                ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 hover:text-yellow-600 dark:hover:text-yellow-400'
                                : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50'
                              }`}
                            title={alert.isActive ? 'Pause alert' : 'Activate alert'}
                          >
                            {alert.isActive ? <Clock className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                          </button>
                        )}
                        <button
                          onClick={() => deleteAlert(alert.id)}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {alerts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full mb-3">
                        <Bell className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                      </div>
                      <p className="text-gray-600 dark:text-gray-400 font-medium">No alerts configured</p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                        Create your first price alert to get notified
                      </p>
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="mt-4 flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Create Alert</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Create Price Alert</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedStock('');
                  setTargetPrice('');
                  setSearchQuery('');
                }}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Select Stock
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search stocks..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    autoFocus
                  />
                </div>

                {searchQuery && (
                  <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                    {filteredStocks.map(stock => (
                      <button
                        key={stock.symbol}
                        onClick={() => {
                          setSelectedStock(stock.symbol);
                          setSearchQuery('');
                          setTargetPrice(stock.currentPrice.toString());
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{stock.symbol}</p>
                          <p className="text-xs text-gray-500">{stock.name}</p>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          ₹{stock.currentPrice.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </p>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Alert Condition
                </label>
                <div className="flex space-x-2">
                  {[
                    { type: 'above', label: 'Above', icon: TrendingUp, color: 'green' },
                    { type: 'below', label: 'Below', icon: TrendingDown, color: 'red' },
                    { type: 'change_percent', label: 'Change %', icon: Percent, color: 'blue' },
                  ].map(option => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.type}
                        onClick={() => setAlertType(option.type as 'above' | 'below' | 'change_percent')}
                        className={`flex-1 flex flex-col items-center p-3 rounded-lg border transition-colors ${alertType === option.type
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                      >
                        <Icon className={`w-5 h-5 ${option.type === 'above' ? 'text-green-500' :
                            option.type === 'below' ? 'text-red-500' : 'text-blue-500'
                          }`} />
                        <span className="text-xs mt-1 text-gray-700 dark:text-gray-300">{option.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {alertType === 'change_percent' ? 'Target Change %' : 'Target Price'}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                    {alertType === 'change_percent' ? '%' : '₹'}
                  </span>
                  <input
                    type="number"
                    value={alertType === 'change_percent' ? targetPercent : targetPrice}
                    onChange={(e) =>
                      alertType === 'change_percent'
                        ? setTargetPercent(e.target.value)
                        : setTargetPrice(e.target.value)
                    }
                    placeholder={alertType === 'change_percent' ? 'e.g., 5' : 'e.g., 2500'}
                    className="w-full pl-8 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                {selectedStock && alertType !== 'change_percent' && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Current price: ₹{sampleStocks.find(s => s.symbol === selectedStock)?.currentPrice.toFixed(2)}
                  </p>
                )}
              </div>

              <button
                onClick={createAlert}
                disabled={!selectedStock || (!targetPrice && !targetPercent)}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
