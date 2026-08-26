import React, { useState } from 'react';
import { Search, Menu, User, Globe, LogOut, X } from 'lucide-react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';

export const Header = () => {
  const { t, language, setLanguage } = useLanguage();
  const { settings, loading: settingsLoading } = useSettings();
  const { user, platformUser, authLoading, platformUserLoading, signOut } = useAuth();

  console.log('HEADER USER:', !!user);
  console.log('HEADER PLATFORM USER:', !!platformUser);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}#table`);
      setIsMobileMenuOpen(false);
    }
  };

  const handleLogin = () => {
    navigate('/auth');
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out', error);
    }
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `font-medium transition-colors ${
      isActive
        ? 'text-[#D4AF37] border-b-2 border-[#D4AF37] pb-1'
        : 'text-gray-300 hover:text-white'
    }`;

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block py-3 px-4 font-medium transition-colors ${
      isActive
        ? 'text-[#D4AF37] bg-[#1C2E5A]/50 rounded-lg'
        : 'text-gray-300 hover:text-white hover:bg-[#1C2E5A]/30 rounded-lg'
    }`;

  return (
    <header className="bg-[#0A1128] border-b border-[#1C2E5A] sticky top-0 z-50">
      <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <img
            src={
              settings.siteLogo ||
              'https://i.postimg.cc/vTzC2Jbx/January-05-2026-1-removebg-preview.png'
            }
            alt="Logo"
            className="w-12 h-12 object-contain"
            referrerPolicy="no-referrer"
          />

          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">
              {language === 'ar' ? settings.siteNameAr : settings.siteNameEn}
            </h1>
          </div>
        </Link>

        {/* Navigation - Desktop */}
        <nav className="hidden lg:flex items-center gap-8">
          <NavLink to="/" className={navLinkClass}>
            {t('home')}
          </NavLink>

          <NavLink to="/markets" className={navLinkClass}>
            {t('markets')}
          </NavLink>

          <NavLink to="/analytics" className={navLinkClass}>
            {t('analytics')}
          </NavLink>

          <NavLink to="/news" className={navLinkClass}>
            {t('news')}
          </NavLink>

          <NavLink to="/reports" className={navLinkClass}>
            {t('reports')}
          </NavLink>

          <NavLink to="/faq" className={navLinkClass}>
            {t('faq')}
          </NavLink>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex items-center bg-[#121E3D] rounded-full px-4 py-2 border border-[#1C2E5A] focus-within:border-[#D4AF37] transition-colors"
          >
            <Search size={18} className="text-gray-400 mx-2" />

            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="bg-transparent border-none outline-none text-sm text-white w-48 placeholder-gray-500"
            />
          </form>

          <button
            onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
            className="p-2 text-gray-300 hover:text-white transition-colors flex items-center gap-1 font-bold"
          >
            <Globe size={20} />
            <span className="text-xs uppercase">
              {language === 'ar' ? 'EN' : 'AR'}
            </span>
          </button>

          {/* Account & Auth Section */}
          {(() => {
            if (authLoading) {
              return (
                <div className="w-28 h-10 bg-[#121E3D] border border-[#1C2E5A] rounded-xl animate-pulse flex items-center justify-center">
                  <span className="text-xs text-gray-500 font-bold">...</span>
                </div>
              );
            }

            if (!user) {
              // If settings are still loading or auth UI is disabled, do not render the login button (prevent flicker)
              if (settingsLoading || !settings.authUiEnabled) {
                return null;
              }

              return (
                <button
                  onClick={handleLogin}
                  className="flex items-center gap-2 bg-[#D4AF37] hover:bg-[#E5C158] text-[#0A1128] transition-all px-4 sm:px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-[#D4AF37]/10"
                >
                  <User size={18} />
                  <span>{language === 'ar' ? 'دخول / تسجيل' : 'Login / Register'}</span>
                </button>
              );
            }

            const companyDisplayName = platformUser?.full_name || user?.user_metadata?.full_name || (language === 'ar' ? 'المستخدم' : 'User');

            if (platformUserLoading && !companyDisplayName) {
              return (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-[#121E3D] border border-[#1C2E5A] px-3 py-2 rounded-xl">
                    <div className="w-6 h-6 rounded-lg bg-[#1C2E5A] animate-pulse flex items-center justify-center text-[#D4AF37]">
                      <User size={14} />
                    </div>
                    <span className="text-xs font-bold text-gray-400 animate-pulse">...</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                    title={language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              );
            }

            return (
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="flex items-center gap-2 bg-[#121E3D] border border-[#1C2E5A] px-3 py-1.5 rounded-xl shadow-inner">
                  <div className="w-7 h-7 rounded-lg bg-[#1C2E5A] flex items-center justify-center text-[#D4AF37] shrink-0">
                    <User size={16} />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-white max-w-[130px] sm:max-w-[220px] truncate" title={companyDisplayName}>
                    {companyDisplayName}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all border border-[#1C2E5A] hover:border-red-500/30"
                  title={language === 'ar' ? 'تسجيل الخروج' : 'Logout'}
                >
                  <LogOut size={18} />
                </button>
              </div>
            );
          })()}

          <button
            className="lg:hidden p-2 text-gray-300 hover:text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden bg-[#0A1128] border-b border-[#1C2E5A] absolute top-20 left-0 w-full shadow-2xl overflow-hidden"
          >
            <nav className="flex flex-col p-4 gap-2">
              <NavLink
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                {t('home')}
              </NavLink>

              <NavLink
                to="/markets"
                onClick={() => setIsMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                {t('markets')}
              </NavLink>

              <NavLink
                to="/analytics"
                onClick={() => setIsMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                {t('analytics')}
              </NavLink>

              <NavLink
                to="/news"
                onClick={() => setIsMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                {t('news')}
              </NavLink>

              <NavLink
                to="/reports"
                onClick={() => setIsMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                {t('reports')}
              </NavLink>

              <NavLink
                to="/faq"
                onClick={() => setIsMobileMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                {t('faq')}
              </NavLink>

              <div className="mt-4 pt-4 border-t border-[#1C2E5A] flex flex-col gap-4">
                <form
                  onSubmit={handleSearchSubmit}
                  className="flex items-center bg-[#121E3D] rounded-full px-4 py-2 border border-[#1C2E5A] focus-within:border-[#D4AF37] transition-colors"
                >
                  <Search size={18} className="text-gray-400 mx-2 flex-shrink-0" />

                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('searchPlaceholder')}
                    className="bg-transparent border-none outline-none text-sm text-white w-full placeholder-gray-500"
                  />
                </form>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
