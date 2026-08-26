import React, { useState } from 'react';
import { TrendingUp, Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';

export const Footer = () => {
  const { t, language } = useLanguage();
  const { settings } = useSettings();
  const [activeModal, setActiveModal] = useState<'terms' | 'privacy' | 'disclaimer' | null>(null);

  const modalContent = {
    disclaimer: {
      titleAr: 'إخلاء المسؤولية',
      titleEn: 'Disclaimer',
      contentAr: settings.disclaimerAr || 'البيانات والأسعار المنشورة في منصة الأسعار العالمية GCP مخصصة لأغراض المتابعة والتحليل فقط، ولا تُعد توصية استثمارية أو تجارية. قد تختلف الأسعار حسب المصدر ووقت التحديث، ولا تتحمل المنصة أي مسؤولية عن القرارات المتخذة بناءً على هذه البيانات.',
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

        {/* Copyright */}
        <div className="border-t border-[#1C2E5A] pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-sm">
            {language === 'ar' 
              ? (settings.footerTextAr || `© ${new Date().getFullYear()} ${settings.siteNameAr}. ${t('rights')}`)
              : (settings.footerTextEn || `© ${new Date().getFullYear()} ${settings.siteNameEn}. ${t('rights')}`)
            }
          </p>
          <div className="flex items-center gap-6">
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

