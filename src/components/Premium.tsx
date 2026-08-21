import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Check, Crown, Zap, BarChart2, Bell, Globe, Shield,
  TrendingUp, Target, Star, ChevronRight, ArrowLeft
} from 'lucide-react';

export function Premium() {
  const navigate = useNavigate();
  const { user, isPremium } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(false);

  const plans = [
    {
      name: 'Free',
      price: { monthly: 0, yearly: 0 },
      description: 'For casual investors',
      features: [
        { text: 'Real-time stock prices', available: true },
        { text: 'Basic search & watchlist', available: true },
        { text: 'Market overview', available: true },
        { text: 'AI predictions (limited)', available: false },
        { text: 'Advanced technical indicators', available: false },
        { text: 'Price alerts (3 max)', available: false },
        { text: 'Portfolio analytics', available: false },
        { text: 'Risk scoring', available: false },
      ],
      highlight: false,
      buttonText: 'Current Plan',
    },
    {
      name: 'Pro',
      price: { monthly: 999, yearly: 8999 },
      description: 'For serious investors',
      features: [
        { text: 'Real-time stock prices', available: true },
        { text: 'Unlimited search & watchlist', available: true },
        { text: 'Market overview', available: true },
        { text: 'AI predictions (unlimited)', available: true },
        { text: 'Advanced technical indicators', available: true },
        { text: 'Price alerts (unlimited)', available: true },
        { text: 'Portfolio analytics', available: true },
        { text: 'Risk scoring', available: true },
      ],
      highlight: true,
      buttonText: 'Upgrade to Pro',
    },
    {
      name: 'Enterprise',
      price: { monthly: 4999, yearly: 44999 },
      description: 'For professional traders',
      features: [
        { text: 'Everything in Pro', available: true },
        { text: 'API access', available: true },
        { text: 'Custom dashboards', available: true },
        { text: 'Priority support', available: true },
        { text: 'Multi-portfolio management', available: true },
        { text: 'Advanced backtesting', available: true },
        { text: 'Team collaboration', available: true },
        { text: 'Custom integrations', available: true },
      ],
      highlight: false,
      buttonText: 'Contact Sales',
    },
  ];

  const handleSubscribe = async (plan: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setLoading(true);

    // Simulate Stripe checkout
    setTimeout(() => {
      setLoading(false);
      alert(`In a real implementation, this would redirect to Stripe checkout for the ${plan} plan.`);
    }, 1000);
  };

  const features = [
    {
      icon: Target,
      title: 'AI-Powered Predictions',
      description: 'Our machine learning models analyze technical indicators, sentiment, and market patterns to predict stock movements with high accuracy.',
    },
    {
      icon: BarChart2,
      title: 'Advanced Technical Analysis',
      description: 'Access RSI, MACD, EMAs, Bollinger Bands, and more with real-time calculations and clear interpretations.',
    },
    {
      icon: Shield,
      title: 'Risk Scoring',
      description: 'Comprehensive risk assessment for every stock and your entire portfolio, helping you make informed decisions.',
    },
    {
      icon: Bell,
      title: 'Smart Alerts',
      description: 'Set unlimited price alerts and get notified instantly when your targets are reached.',
    },
    {
      icon: TrendingUp,
      title: 'Portfolio Analytics',
      description: 'Deep insights into your portfolio performance, sector allocation, and optimization suggestions.',
    },
    {
      icon: Globe,
      title: 'News Sentiment Analysis',
      description: 'AI analyzes thousands of news articles daily to provide sentiment scores that impact stock prices.',
    },
  ];

  return (
    <div className="space-y-12 pb-12">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium">Back</span>
      </button>

      <div className="text-center">
        {isPremium && (
          <div className="inline-flex items-center space-x-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 rounded-full mb-4">
            <Crown className="w-4 h-4" />
            <span className="text-sm font-medium">You are a Premium Member</span>
          </div>
        )}
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Upgrade to StockPulse Pro
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Unlock AI-powered predictions, advanced analytics, and unlimited alerts to make smarter investment decisions.
        </p>
      </div>

      <div className="flex justify-center">
        <div className="inline-flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${billingCycle === 'monthly'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
              }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${billingCycle === 'yearly'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400'
              }`}
          >
            Yearly
            <span className="ml-2 text-xs text-green-600 dark:text-green-400">Save 25%</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto px-4">
        {plans.map((plan, idx) => (
          <div
            key={plan.name}
            className={`relative rounded-2xl p-6 ${plan.highlight
                ? 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white ring-2 ring-blue-500 scale-105'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
              }`}
          >
            {plan.highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="px-3 py-1 bg-yellow-500 text-yellow-900 text-xs font-bold rounded-full">
                  MOST POPULAR
                </span>
              </div>
            )}

            <div className="mb-6">
              <h3 className={`text-xl font-bold ${plan.highlight ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                {plan.name}
              </h3>
              <p className={`text-sm mt-1 ${plan.highlight ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>
                {plan.description}
              </p>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline">
                <span className={`text-4xl font-bold ${plan.highlight ? 'text-white' : 'text-gray-900 dark:text-white'}`}>
                  {plan.price[billingCycle] === 0 ? 'Free' : `₹${plan.price[billingCycle].toLocaleString()}`}
                </span>
                {plan.price[billingCycle] > 0 && (
                  <span className={`ml-2 text-sm ${plan.highlight ? 'text-blue-200' : 'text-gray-500 dark:text-gray-400'}`}>
                    /{billingCycle === 'monthly' ? 'month' : 'year'}
                  </span>
                )}
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, fidx) => (
                <li key={fidx} className="flex items-start space-x-3">
                  <div className={`mt-0.5 ${feature.available
                      ? plan.highlight ? 'text-green-300' : 'text-green-500'
                      : plan.highlight ? 'text-blue-300/50' : 'text-gray-300 dark:text-gray-600'
                    }`}>
                    <Check className="w-5 h-5" />
                  </div>
                  <span className={`text-sm ${feature.available
                      ? plan.highlight ? 'text-white' : 'text-gray-700 dark:text-gray-300'
                      : plan.highlight ? 'text-blue-200/70' : 'text-gray-400 dark:text-gray-500'
                    }`}>
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleSubscribe(plan.name)}
              disabled={loading || (isPremium && plan.name !== 'Enterprise') || plan.price[billingCycle] === 0}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${plan.highlight
                  ? 'bg-white text-blue-700 hover:bg-gray-100'
                  : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? 'Processing...' :
                plan.price[billingCycle] === 0 ? (isPremium ? 'Downgrade' : 'Current Plan') :
                  plan.name === 'Enterprise' ? 'Contact Sales' :
                    plan.buttonText}
            </button>
          </div>
        ))}
      </div>

      <div className="max-w-6xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">
          Why Upgrade to Pro?
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-shadow"
              >
                <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg w-fit mb-4">
                  <Icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4">
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 text-center">
          <Zap className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Start Your 7-Day Free Trial
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Try all Pro features free for 7 days. No credit card required.
          </p>
          <button
            onClick={() => handleSubscribe('Pro')}
            className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Start Free Trial
            <ChevronRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </div>
    </div>
  );
}
