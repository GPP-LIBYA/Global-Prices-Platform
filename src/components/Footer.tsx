import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { supabase } from '../lib/supabase';

interface FooterLogoItem {
  id: string | number;
  name?: string;
  storage_path: string;
  link_url?: string | null;
  display_order: number;
  logo_height?: number | null;
  imageUrl?: string;
}

export const Footer = () => {
  const { t, language } = useLanguage();
  const { settings } = useSettings();
  const [activeModal, setActiveModal] = useState<'terms' | 'privacy' | 'disclaimer' | null>(null);
  const [logos, setLogos] = useState<FooterLogoItem[]>([]);
  const [failedLogoIds, setFailedLogoIds] = useState<Record<string | number, boolean>>({});

  const getStoragePublicUrl = useCallback((path: string): string => {
    if (!path) return '';
    const trimmed = path.trim();
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    const cleanPath = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
    try {
      const { data } = supabase.storage.from('footer-logos').getPublicUrl(cleanPath);
      return data?.publicUrl || '';
    } catch {
      return '';
    }
  }, []);

  const fetchLogos = useCallback(async () => {
    try {
      console.log('[Footer] Executing query on public.footer_logos...');
      const { data, error } = await supabase
        .from('footer_logos')
        .select('id, name, storage_path, link_url, display_order, logo_height')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      console.log('[Footer] Supabase query data:', data);
      console.log('[Footer] Supabase query error:', error);

      if (error) {
        console.warn('[Footer] Supabase footer_logos query returned error (gracefully handled):', error.message || error);
        return;
      }

      if (!data || !Array.isArray(data) || data.length === 0) {
        setLogos([]);
        return;
      }

      const formattedLogos: FooterLogoItem[] = data.map((logo) => {
        let publicUrl = '';
        if (logo.storage_path) {
          const trimmed = logo.storage_path.trim();
          if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
            publicUrl = trimmed;
          } else {
            const cleanPath = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
            const { data: urlData } = supabase.storage
              .from('footer-logos')
              .getPublicUrl(cleanPath);
            publicUrl = urlData.publicUrl;
          }
        }
        console.log(`[Footer] Generated Public URL for logo '${logo.name || logo.id}':`, publicUrl);
        return {
          ...logo,
          imageUrl: publicUrl
        };
      });

      console.log('[Footer] Logos state updated with:', formattedLogos);
      setLogos(formattedLogos);
    } catch (err) {
      console.warn('[Footer] Exception in fetchLogos (gracefully handled):', err);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    fetchLogos();

    let channel: ReturnType<typeof supabase.channel> | null = null;
    try {
      channel = supabase
        .channel('public:footer_logos')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'footer_logos' },
          () => {
            if (isMounted) {
              fetchLogos();
            }
          }
        )
        .subscribe();
    } catch {
      // Realtime subscription error ignored safely
    }

    return () => {
      isMounted = false;
      if (channel) {
        channel.unsubscribe().catch(() => {});
      }
    };
  }, [fetchLogos]);

  const handleImageError = (id: string | number) => {
    setFailedLogoIds((prev) => ({ ...prev, [id]: true }));
  };

  const visibleLogos = logos.filter(
    (logo) => !failedLogoIds[logo.id] && logo.imageUrl && logo.imageUrl.trim() !== ''
  );

  const isExternalUrl = (url: string) => {
    return url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//');
  };

  const modalContent = {
    disclaimer: {
      titleAr: 'إخلاء المسؤولية',
      titleEn: 'Disclaimer',
      contentAr: settings.disclaimerAr || 'البيانات والأسعار المنشورة في منصة الأسعار العالمية GPP مخصصة لأغراض المتابعة والتحليل فقط، ولا تُعد توصية استثمارية أو تجارية. قد تختلف الأسعار حسب المصدر ووقت التحديث، ولا تتحمل المنصة أي مسؤولية عن القرارات المتخذة بناءً على هذه البيانات.',
      contentEn: 'The data and prices published on the Global Pricing Platform are for monitoring and analysis purposes only and do not constitute investment or commercial advice. Prices may vary by source and time of update, and the platform bears no responsibility for decisions made based on this data.'
    },
    terms: {
      titleAr: 'شروط الاستخدام',
      titleEn: 'Terms of Use',
      contentAr: settings.termsAr || 'باستخدامك للمنصة، فإنك توافق على استخدام البيانات بطريقة قانونية ومسؤولة، وعدم نسخ أو إعادة نشر المحتوى أو استغلاله تجاريًا دون إذن مسبق من إدارة المنصة.',
      contentEn: 'By using the platform, you agree to use the data in a legal and responsible manner, and not to copy, republish, or commercially exploit the content without prior permission from the platform administration.'
    },
    privacy: {
      titleAr: 'سياسة الخصوصية',
      titleEn: 'Privacy Policy',
      contentAr: settings.privacyPolicyAr || 'تحترم المنصة خصوصية المستخدمين، ولا تقوم ببيع بياناتهم الشخصية. تُستخدم البيانات فقط لأغراض تشغيل الحسابات، تحسين الخدمات، الحماية، والتحقق من الهوية عند الحاجة.',
      contentEn: 'The platform respects user privacy and does not sell their personal data. Data is used only for operating accounts, improving services, protection, and identity verification when necessary.'
    }
  };

  return (
    <footer className="bg-[#0A1128] border-t border-[#1C2E5A] pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <img 
                src={settings.siteLogo || "https://i.postimg.cc/vTzC2Jbx/January-05-2026-1-removebg-preview.png"} 
                alt="Logo" 
                className="w-12 h-12 object-contain" 
                referrerPolicy="no-referrer" 
              />
              <div>
                <h2 className="text-xl font-bold text-white tracking-wide">
                  {language === 'ar' ? settings.siteNameAr : settings.siteNameEn}
                </h2>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
              {language === 'ar' ? settings.descriptionAr : settings.descriptionEn}
            </p>
            <div className="flex items-center gap-4">
              {settings.twitterUrl && settings.twitterUrl !== '#' && (
                <a href={settings.twitterUrl} className="w-10 h-10 rounded-full bg-[#121E3D] border border-[#1C2E5A] flex items-center justify-center text-gray-400 hover:text-[#D4AF37] hover:border-[#D4AF37] transition-all">
                  <X size={18} />
                </a>
              )}
              {settings.linkedinUrl && settings.linkedinUrl !== '#' && (
                <a href={settings.linkedinUrl} className="w-10 h-10 rounded-full bg-[#121E3D] border border-[#1C2E5A] flex items-center justify-center text-gray-400 hover:text-[#D4AF37] hover:border-[#D4AF37] transition-all">
                  <Linkedin size={18} />
                </a>
              )}
              {settings.facebookUrl && settings.facebookUrl !== '#' && (
                <a href={settings.facebookUrl} className="w-10 h-10 rounded-full bg-[#121E3D] border border-[#1C2E5A] flex items-center justify-center text-gray-400 hover:text-[#D4AF37] hover:border-[#D4AF37] transition-all">
                  <Facebook size={18} />
                </a>
              )}
            </div>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-lg font-bold text-white mb-6 border-b border-[#1C2E5A] pb-2 inline-block">{t('quickLinks')}</h3>
            <ul className="space-y-3">
              <li><Link to="/" className="text-gray-400 hover:text-[#D4AF37] transition-colors text-sm">{t('home')}</Link></li>
              <li><Link to="/markets?sector=energy#table" className="text-gray-400 hover:text-[#D4AF37] transition-colors text-sm">{t('energyPrices')}</Link></li>
              <li><Link to="/markets?sector=metals#table" className="text-gray-400 hover:text-[#D4AF37] transition-colors text-sm">{t('metalsPrices')}</Link></li>
              <li><Link to="/markets?sector=commodities#table" className="text-gray-400 hover:text-[#D4AF37] transition-colors text-sm">{t('agriPrices')}</Link></li>
              <li><Link to="/faq" className="text-gray-400 hover:text-[#D4AF37] transition-colors text-sm">{t('faq')}</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-[#D4AF37] transition-colors text-sm">{t('contact')}</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="text-lg font-bold text-white mb-6 border-b border-[#1C2E5A] pb-2 inline-block">{t('corporateServices')}</h3>
            <ul className="space-y-3">
              <li><Link to="/services/api" className="text-gray-400 hover:text-[#D4AF37] transition-colors text-sm">{t('apiIntegration')}</Link></li>
              <li><Link to="/services/data-export" className="text-gray-400 hover:text-[#D4AF37] transition-colors text-sm">{t('customExport')}</Link></li>
              <li><Link to="/services/subscriptions" className="text-gray-400 hover:text-[#D4AF37] transition-colors text-sm">{t('premiumSubs')}</Link></li>
              <li><Link to="/services/support" className="text-gray-400 hover:text-[#D4AF37] transition-colors text-sm">{t('techSupport')}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold text-white mb-6 border-b border-[#1C2E5A] pb-2 inline-block">
              {t('aboutUs')} & {t('phoneTitle')}
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="text-[#D4AF37] mt-1 flex-shrink-0" />
                <span className="text-gray-400 text-sm">{language === 'ar' ? settings.contactAddressAr : settings.contactAddressEn}</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-[#D4AF37] flex-shrink-0" />
                <span className="text-gray-400 text-sm" dir="ltr">{settings.contactPhone}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-[#D4AF37] flex-shrink-0" />
                <span className="text-gray-400 text-sm">{settings.contactEmail}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright & Footer Logos Area */}
        <div className="border-t border-[#1C2E5A] pt-8 flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Right Section: Copyright & Footer Logos grouped together */}
          <div 
            id="footer-right-section"
            className="order-1 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 justify-center lg:justify-start"
          >
            <p className="text-gray-500 text-sm text-center lg:text-start">
              {language === 'ar' 
                ? (settings.footerTextAr || `© ${new Date().getFullYear()} ${settings.siteNameAr}. ${t('rights')}`)
                : (settings.footerTextEn || `© ${new Date().getFullYear()} ${settings.siteNameEn}. ${t('rights')}`)
              }
            </p>

            {/* Dynamic Footer Logos from Supabase */}
            {visibleLogos.length > 0 && (
              <div 
                id="footer-logos-container"
                className="flex items-center justify-center flex-wrap gap-3 sm:gap-4 relative z-10"
                style={{ display: 'flex', visibility: 'visible', opacity: 1 }}
                aria-label="Footer Logos"
              >
                {visibleLogos.map((logo) => {
                  const imageEl = (
                    <img
                      id={`footer-logo-img-${logo.id}`}
                      src={logo.imageUrl}
                      alt={logo.name || 'Footer Logo'}
                      title={logo.name || undefined}
                      className="max-w-full max-h-[85px] sm:max-h-[100px] transition-all duration-200 opacity-90 hover:opacity-100 hover:scale-105"
                      style={{
                        height: `${logo.logo_height || 36}px`,
                        width: 'auto',
                        objectFit: 'contain',
                        display: 'inline-block',
                        visibility: 'visible'
                      }}
                      loading="lazy"
                      onError={() => {
                        console.warn(`[Footer] Failed to render image for logo ID: ${logo.id}, URL: ${logo.imageUrl}`);
                        handleImageError(logo.id);
                      }}
                    />
                  );

                  if (logo.link_url && logo.link_url.trim() !== '') {
                    const url = logo.link_url.trim();
                    return (
                      <a
                        key={logo.id}
                        id={`footer-logo-link-${logo.id}`}
                        href={url}
                        target={isExternalUrl(url) ? '_blank' : undefined}
                        rel={isExternalUrl(url) ? 'noopener noreferrer' : undefined}
                        className="inline-flex items-center justify-center p-1 rounded transition-opacity hover:opacity-100"
                        title={logo.name || undefined}
                        aria-label={logo.name || 'Logo Link'}
                      >
                        {imageEl}
                      </a>
                    );
                  }

                  return (
                    <div key={logo.id} id={`footer-logo-wrapper-${logo.id}`} className="inline-flex items-center justify-center p-1">
                      {imageEl}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Left Section: Footer Links */}
          <div 
            id="footer-links-section"
            className="order-2 flex items-center gap-6 justify-center lg:justify-end"
          >
            <button onClick={() => setActiveModal('terms')} className="text-gray-500 hover:text-white text-sm transition-colors">{t('terms')}</button>
            <button onClick={() => setActiveModal('privacy')} className="text-gray-500 hover:text-white text-sm transition-colors">{t('privacy')}</button>
            <button onClick={() => setActiveModal('disclaimer')} className="text-gray-500 hover:text-white text-sm transition-colors">{t('disclaimer')}</button>
          </div>
        </div>
      </div>

      {/* Policy Modal */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setActiveModal(null)}>
          <div 
            className={`fixed top-0 bottom-0 ${language === 'ar' ? 'left-0 border-r animate-in slide-in-from-left' : 'right-0 border-l animate-in slide-in-from-right'} bg-[#0A1128] border-[#1C2E5A] w-full max-w-md overflow-hidden flex flex-col shadow-2xl duration-300`}
            onClick={(e) => e.stopPropagation()}
            dir={language === 'ar' ? 'rtl' : 'ltr'}
          >
            <div className="flex items-center justify-between p-6 border-b border-[#1C2E5A] bg-[#121E3D]">
              <h2 className="text-xl font-bold text-white">
                {language === 'ar' ? modalContent[activeModal].titleAr : modalContent[activeModal].titleEn}
              </h2>
              <button 
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-[#1C2E5A] rounded-full"
              >
                <X size={24} />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 leading-relaxed text-base">
                  {language === 'ar' ? modalContent[activeModal].contentAr : modalContent[activeModal].contentEn}
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-[#1C2E5A] bg-[#121E3D]">
              <button 
                onClick={() => setActiveModal(null)}
                className="w-full px-6 py-3 bg-[#D4AF37] text-[#0A1128] font-bold rounded-xl hover:bg-[#B5952F] transition-colors"
              >
                {language === 'ar' ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
};

