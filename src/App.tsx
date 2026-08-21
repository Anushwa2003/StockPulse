import React, { Suspense, lazy } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { DarkModeProvider } from './context/DarkModeContext';
import { AuthProvider } from './context/AuthContext';
import { Header } from './components/Header';

const Dashboard = lazy(() => import('./components/Dashboard').then(m => ({ default: m.Dashboard })));
const StockSearch = lazy(() => import('./components/StockSearch').then(m => ({ default: m.StockSearch })));
const StockDetail = lazy(() => import('./components/StockDetail').then(m => ({ default: m.StockDetail })));
const Portfolio = lazy(() => import('./components/Portfolio').then(m => ({ default: m.Portfolio })));
const Watchlist = lazy(() => import('./components/Watchlist').then(m => ({ default: m.Watchlist })));
const Alerts = lazy(() => import('./components/Alerts').then(m => ({ default: m.Alerts })));
const Premium = lazy(() => import('./components/Premium').then(m => ({ default: m.Premium })));
const Auth = lazy(() => import('./components/Auth').then(m => ({ default: m.Auth })));

function AppContent() {
  const location = useLocation();
  const isAuthPage = location.pathname === '/auth';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {!isAuthPage && <Header />}
      <main className={!isAuthPage ? 'pt-[104px] md:pt-16 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto' : ''}>
        <Suspense fallback={
          <div className="flex items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        }>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/search" element={<StockSearch />} />
            <Route path="/stock/:symbol" element={<StockDetail />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/watchlist" element={<Watchlist />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/premium" element={<Premium />} />
            <Route path="/auth" element={<Auth />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

function App() {
  return (
    <DarkModeProvider>
      <AuthProvider>
        <HashRouter>
          <AppContent />
        </HashRouter>
      </AuthProvider>
    </DarkModeProvider>
  );
}

export default App;
