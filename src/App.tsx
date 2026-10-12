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
import { ShieldAlert, RotateCw, AlertTriangle, Mail } from 'lucide-react';
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
  const { settings, refreshSettings } = useSettings();
  const { language } = useLanguage();
  const [checking, setChecking] = React.useState(false);

  const handleRefresh = async () => {
    setChecking(true);
    try {
      await refreshSettings();
    } finally {
      setTimeout(() => setChecking(false), 600);
    }
  };

  const logoUrl = settings.headerLogoUrl || settings.heroLogoUrl || settings.siteLogo;

  return (
    <div className="min-h-screen bg-[#050A18] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(28,46,90,0.4),rgba(5,10,24,0))] flex flex-col items-center justify-center p-4">
      <div className="relative max-w-xl w-full bg-[#0D1528]/95 border border-[#1C2E5A] rounded-3xl p-8 sm:p-12 text-center shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>
        
        {/* Brand Logo */}
        {logoUrl ? (
          <img 
            src={logoUrl} 
            alt="GPP Logo" 
            className="h-20 sm:h-24 max-w-[260px] mx-auto mb-6 object-contain drop-shadow-md" 
          />
        ) : (
          <div className="w-20 h-20 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center mx-auto mb-6 shadow-inner">
            <ShieldAlert className="text-[#D4AF37]" size={42} />
          </div>
        )}

        {/* Status Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/25 text-[#D4AF37] text-xs font-semibold mb-6 tracking-wide">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#D4AF37]"></span>
          </span>
          <span>{language === 'ar' ? 'وضع الصيانة المجدولة' : 'Scheduled Maintenance'}</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-black text-white mb-4 tracking-tight leading-snug">
          {language === 'ar' ? (settings.maintenanceTitleAr || 'الموقع تحت الصيانة') : 'Platform Under Maintenance'}
        </h1>

        {/* Message */}
        <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-8 max-w-md mx-auto whitespace-pre-line font-normal">
          {language === 'ar' 
            ? (settings.maintenanceMessageAr || 'نعمل حالياً على إجراء بعض التحسينات لتقديم تجربة أفضل.\n\nشكراً لتفهمكم') 
            : 'We are currently performing scheduled enhancements to provide a better experience.\n\nThank you for your patience.'}
        </p>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={checking}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-[#1C2E5A] hover:bg-[#253D77] border border-[#2B478B] text-white font-medium text-sm transition-all duration-200 active:scale-95 disabled:opacity-60 shadow-lg"
          >
            <RotateCw className={`w-4 h-4 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? (language === 'ar' ? 'جاري التحقق...' : 'Checking...') : (language === 'ar' ? 'التحقق من حالة المنصة' : 'Check Platform Status')}</span>
          </button>
        </div>

        {/* Contact info */}
        {settings.contactEmail && (
          <div className="mt-8 pt-6 border-t border-[#1C2E5A]/60 flex items-center justify-center gap-2 text-xs text-gray-400">
            <span>{language === 'ar' ? 'للتواصل والاستفسار:' : 'Contact Support:'}</span>
            <a 
              href={`mailto:${settings.contactEmail}`}
              className="inline-flex items-center gap-1.5 text-[#D4AF37] hover:underline font-mono"
              dir="ltr"
            >
              <Mail size={13} />
              <span>{settings.contactEmail}</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

const SettingsErrorView = ({ onRetry }: { onRetry: () => void }) => {
  const [retrying, setRetrying] = React.useState(false);
  const handleRetry = async () => {
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setTimeout(() => setRetrying(false), 500);
    }
  };

  return (
    <div className="min-h-screen bg-[#050A18] flex flex-col items-center justify-center p-4">
      <div className="bg-[#121E3D] border border-amber-500/30 p-8 sm:p-12 rounded-3xl max-w-md w-full text-center shadow-2xl relative overflow-hidden">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="text-amber-400" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-white mb-3" dir="rtl">
          تعذر التحقق من حالة المنصة
        </h2>
        <p className="text-gray-400 text-sm leading-relaxed mb-6" dir="rtl">
          حدث خطأ أثناء محاولة الاتصال بقاعدة البيانات للتحقق من جاهزية المنصة. يرجى التأكد من اتصالك بالإنترنت والمحاولة مجدداً.
        </p>
        <button
          onClick={handleRetry}
          disabled={retrying}
          className="w-full inline-flex items-center justify-center gap-2 bg-[#1C2E5A] hover:bg-[#253D77] border border-[#2B478B] text-white py-3 px-6 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 disabled:opacity-50"
          dir="rtl"
        >
          <RotateCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
          <span>{retrying ? 'جاري المحاولة...' : 'إعادة المحاولة'}</span>
        </button>
      </div>
    </div>
  );
};

const SettingsLoadingView = () => (
  <div className="min-h-screen bg-[#050A18] flex flex-col items-center justify-center p-4">
    <div className="flex flex-col items-center gap-4">
      <div className="w-14 h-14 border-4 border-[#1C2E5A] border-t-[#D4AF37] rounded-full animate-spin"></div>
      <p className="text-gray-400 font-medium text-sm tracking-wide" dir="rtl">
        جاري التحقق من حالة المنصة...
      </p>
    </div>
  </div>
);

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
  const { settings, settingsLoaded, fetchError, refreshSettings } = useSettings();
  
  useVisitorTracking();

  // 1. Initial loading & verification: prevent content flash until status is confirmed from Supabase
  if (!settingsLoaded) {
    if (fetchError) {
      return <SettingsErrorView onRetry={refreshSettings} />;
    }
    return <SettingsLoadingView />;
  }

  // 2. Check if platform is under maintenance
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
