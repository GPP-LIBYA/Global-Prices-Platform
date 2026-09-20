import React, { useState, useEffect } from 'react';
import { ArrowRight, BarChart2, Globe2, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';

export const Hero = () => {
  const { t, language } = useLanguage();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const [heroImgFailed, setHeroImgFailed] = useState(false);

  useEffect(() => {
    setHeroImgFailed(false);
  }, [settings.heroLogoUrl, settings.siteLogo]);

  const handleExploreMarkets = () => {
    navigate('/markets');
  };

  const getHeroOrderClasses = () => {
    const vPos = settings.heroLogoVerticalPosition || 'top';
    if (vPos === 'center') {
      return {
        badge: 'order-1',
        title: 'order-2',
        logo: 'order-3',
        desc: 'order-4',
        buttons: 'order-5',
      };
    }
    if (vPos === 'bottom') {
      return {
        badge: 'order-1',
        title: 'order-2',
        desc: 'order-3',
        buttons: 'order-4',
        logo: 'order-5',
      };
    }
    // 'top' (default)
    return {
      badge: 'order-1',
      logo: 'order-2',
      title: 'order-3',
      desc: 'order-4',
      buttons: 'order-5',
    };
  };

  const getHeroHorizontalAlignClass = () => {
    const align = settings.heroLogoAlignment || 'center';
    if (align === 'right') {
      return language === 'ar' ? 'items-start text-right' : 'items-end text-right';
    }
    if (align === 'left') {
      return language === 'ar' ? 'items-end text-left' : 'items-start text-left';
    }
    return 'items-center text-center';
  };

  const orders = getHeroOrderClasses();
  const shouldRenderLogo = settings.heroLogoEnabled && !heroImgFailed;
  const heroLogoSrc = settings.heroLogoUrl || settings.siteLogo || 'https://i.postimg.cc/vTzC2Jbx/January-05-2026-1-removebg-preview.png';

  return (
    <section className="relative py-10 md:py-20 lg:py-32 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A1128] to-[#121E3D] z-0"></div>
      <div className="absolute top-0 left-0 w-full h-full opacity-10 z-0" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, #D4AF37 0%, transparent 50%)', backgroundSize: '100% 100%' }}></div>
      <div className="absolute right-0 top-1/4 w-96 h-96 bg-[#1C2E5A] rounded-full mix-blend-screen filter blur-3xl opacity-30 animate-pulse"></div>
      <div className="absolute left-1/4 bottom-1/4 w-72 h-72 bg-[#D4AF37] rounded-full mix-blend-screen filter blur-3xl opacity-10 animate-pulse delay-1000"></div>

      <div className="container mx-auto px-4 md:px-6 lg:px-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          {/* Badge */}
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1C2E5A] border border-[#2A4075] text-[#D4AF37] text-xs md:text-sm font-semibold mb-6 md:mb-8 shadow-lg ${orders.badge}`}>
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-ping"></span>
            {t('heroBadge')}
          </div>

          {/* Hero Logo Block */}
          {shouldRenderLogo && (
            <div className={`w-full flex flex-col ${getHeroHorizontalAlignClass()} ${orders.logo} mb-6 md:mb-8 transition-all`}>
              <div 
                className="flex flex-col items-center"
                style={{
                  transform: `translateY(${settings.heroLogoOffsetY || 0}px)`,
                  transition: 'transform 0.2s ease-out'
                }}
              >
                <img 
                  src={heroLogoSrc} 
                  alt="Logo" 
                  className="object-contain animate-pulse drop-shadow-[0_0_15px_rgba(212,175,55,0.5)]" 
                  style={{
                    width: `${settings.heroLogoSize || 160}px`,
                    height: 'auto',
                    maxWidth: '85vw',
                    objectFit: 'contain'
                  }}
                  onError={() => setHeroImgFailed(true)}
                  referrerPolicy="no-referrer" 
                />
                <p className="text-[#D4AF37] text-xs md:text-sm font-medium mt-2 tracking-wider uppercase">
                  {t('poweredBy')}
                </p>
              </div>
            </div>
          )}
          
          {/* Title */}
          <h1 className={`text-3xl md:text-5xl lg:text-7xl font-black text-white leading-tight mb-4 md:mb-6 tracking-tight ${orders.title}`}>
            {language === 'ar' ? settings.siteNameAr : settings.siteNameEn}
          </h1>
          
          {/* Description */}
          <p className={`text-sm md:text-xl text-gray-400 mb-8 md:mb-12 max-w-2xl mx-auto leading-relaxed font-light ${orders.desc}`}>
            {language === 'ar' ? settings.descriptionAr : settings.descriptionEn}
          </p>
          
          {/* Action Buttons */}
          <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 ${orders.buttons}`}>
            <button onClick={handleExploreMarkets} className="w-full sm:w-auto px-6 py-3 md:px-8 md:py-4 bg-gradient-to-r from-[#D4AF37] to-[#B5952F] hover:from-[#E5C158] hover:to-[#D4AF37] text-[#0A1128] font-bold rounded-lg transition-all shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center gap-2 text-base md:text-lg">
              {t('exploreMarkets')}
              <ArrowRight size={20} />
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mt-16 md:mt-24 max-w-5xl mx-auto">
          <div className="bg-[#121E3D]/80 backdrop-blur-sm p-5 rounded-2xl border border-[#1C2E5A] hover:border-[#D4AF37]/50 transition-colors group">
            <div className="w-10 h-10 rounded-lg bg-[#1C2E5A] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Globe2 size={20} className="text-[#D4AF37]" />
            </div>
            <h3 className="text-base md:text-lg font-bold text-white mb-2">{t('feat1Title')}</h3>
            <p className="text-gray-400 text-xs md:text-sm leading-relaxed">{t('feat1Desc')}</p>
          </div>
          <div className="bg-[#121E3D]/80 backdrop-blur-sm p-5 rounded-2xl border border-[#1C2E5A] hover:border-[#D4AF37]/50 transition-colors group">
            <div className="w-10 h-10 rounded-lg bg-[#1C2E5A] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BarChart2 size={20} className="text-[#D4AF37]" />
            </div>
            <h3 className="text-base md:text-lg font-bold text-white mb-2">{t('feat2Title')}</h3>
            <p className="text-gray-400 text-xs md:text-sm leading-relaxed">{t('feat2Desc')}</p>
          </div>
          <div className="bg-[#121E3D]/80 backdrop-blur-sm p-5 rounded-2xl border border-[#1C2E5A] hover:border-[#D4AF37]/50 transition-colors group">
            <div className="w-10 h-10 rounded-lg bg-[#1C2E5A] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ShieldCheck size={20} className="text-[#D4AF37]" />
            </div>
            <h3 className="text-base md:text-lg font-bold text-white mb-2">{t('feat3Title')}</h3>
            <p className="text-gray-400 text-xs md:text-sm leading-relaxed">{t('feat3Desc')}</p>
          </div>
        </div>
      </div>
    </section>
  );
};
