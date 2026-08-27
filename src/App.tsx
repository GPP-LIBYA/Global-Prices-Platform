import React, { Suspense, lazy } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { MarketProvider } from './context/MarketContext';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { LiveTicker } from './components/LiveTicker';
import { NewsTicker } from './components/NewsTicker';
import { ShieldAlert } from 'lucide-react';
import { VisitorTracker } from './components/VisitorTracker';
import { ScrollToTop } from './components/ScrollToTop';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useVisitorTracking } from './hooks/useVisitorTracking';

import { Home } from './pages/Home';
import { Auth } from './pages/Auth';

const Markets = lazy(() => import('./pages/Markets').then(m => ({ default: m.Markets })));
const Analytics = lazy(() => import('./pages/Analytics').then(m => ({ default: m.Analytics })));
const News = lazy(() => import('./pages/News').then(m => ({ default: m.News })));
const Reports = lazy(() => import('./pages/Reports').then(m => ({ default: m.Reports })));
const ResetPassword = lazy(() => import('./pages/ResetPassword').then(m => ({ default: m.ResetPassword })));
const LegalPage = lazy(() => import('./pages/LegalPage').then(m => ({ default: m.LegalPage })));
const Contact = lazy(() => import('./pages/Contact').then(m => ({ default: m.Contact })));
const FAQ = lazy(() => import('./pages/FAQ').then(m => ({ default: m.FAQ })));
const ServicesPage = lazy(() => import('./pages/ServicesPage').then(m => ({ default: m.ServicesPage })));

class AppErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("App Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050A18] flex flex-col items-center justify-center p-4">
          <div className="bg-[#121E3D] border border-red-500/30 p-12 rounded-[2rem] max-w-lg w-full text-center shadow-xl relative overflow-hidden">
            <h2 className="text-2xl font-black text-white mb-4 uppercase tracking-tighter" dir="rtl">حدث خطأ في المنصة</h2>
            <p className="text-gray-400 text-sm mb-8 font-mono break-all text-left overflow-auto max-h-48 whitespace-pre-wrap">
              {this.state.error?.toString()}
            </p>
            <button 
               onClick={() => { 
                 if (typeof (window as any).resetAppStorage === 'function') {
                  (window as any).resetAppStorage();
                } else {
                  localStorage.clear();
                  sessionStorage.clear();
                }
                window.location.href = window.location.pathname + '#/'; 
               }} 
               className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-xl font-bold uppercase text-sm transition-all shadow-lg"
            >
              إصلاح وفتح المنصة
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const MaintenanceMode = () => {
  const { settings } = useSettings();
  const { language } = useLanguage();

  return (
    <div className="min-h-screen bg-[#050A18] flex flex-col items-center justify-center p-4">
      <div className="bg-[#121E3D] border border-[#1C2E5A] p-12 rounded-[2rem] max-w-lg w-full text-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50"></div>
        {settings.siteLogo ? (
          <img src={settings.siteLogo} alt="Logo" className="h-24 mx-auto mb-8 object-contain" />
        ) : (
          <ShieldAlert className="text-[#D4AF37] mx-auto mb-8" size={80} />
        )}
        <h1 className="text-3xl font-black text-white mb-6 tracking-tight uppercase">
          {language === 'ar' ? (settings.maintenanceTitleAr || 'الموقع تحت الصيانة') : 'Site Under Maintenance'}
        </h1>
        <p className="text-gray-400 text-lg leading-relaxed font-bold">
          {language === 'ar' ? (settings.maintenanceMessageAr || 'نعمل حاليًا على تحديث منصة الأسعار العالمية GCP، يرجى العودة لاحقًا.') : 'We are currently updating the Global Pricing Platform, please check back later.'}
        </p>
      </div>
    </div>
  );
};

const AppRoutes = () => {
  const LoadingFallback = () => (
    <div className="min-h-[50vh] flex items-center justify-center py-20">
      <div className="w-12 h-12 border-4 border-[#1C2E5A] border-t-[#D4AF37] rounded-full animate-spin"></div>
    </div>
  );

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/markets" element={<Markets />} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/analysis" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/news" element={<News />} />
        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/services/api" element={<ServicesPage />} />
        <Route path="/services/data-export" element={<ServicesPage />} />
        <Route path="/services/subscriptions" element={<ServicesPage />} />
        <Route path="/services/support" element={<ServicesPage />} />
        <Route path="/services/:serviceId" element={<ServicesPage />} />
        <Route path="/privacy" element={<LegalPage />} />
        <Route path="/terms" element={<LegalPage />} />
        <Route path="/disclaimer" element={<LegalPage />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<Home />} />
      </Routes>
    </Suspense>
  );
};

function AppContent() {
  const { settings } = useSettings();
  
  useVisitorTracking();

  const isSiteClosed = settings.isSiteActive === false;
  
  if (isSiteClosed) {
    return <MaintenanceMode />;
  }

  return (
    <div className="min-h-screen bg-[#050A18] flex flex-col">
      <LiveTicker />
      <NewsTicker />
      <Header />
      <main className="flex-grow">
        <AppRoutes />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AppErrorBoundary>
      <SettingsProvider>
        <LanguageProvider>
          <AuthProvider>
            <MarketProvider>
              <VisitorTracker />
              <ScrollToTop />
              <AppContent />
            </MarketProvider>
          </AuthProvider>
        </LanguageProvider>
      </SettingsProvider>
    </AppErrorBoundary>
  );
}

export default App;
