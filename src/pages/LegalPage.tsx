import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { Shield, FileText, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useNavigate, useLocation } from 'react-router-dom';

export const LegalPage = () => {
  const { language } = useLanguage();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();

  const getPageType = () => {
    if (location.pathname.includes('privacy')) return 'privacy';
    if (location.pathname.includes('terms')) return 'terms';
    return 'disclaimer';
  };

  const type = getPageType();

  const content = {
    privacy: {
      title: language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy',
      icon: <Shield size={40} />,
      text: settings.privacyPolicyAr || (language === 'ar' ? 'نحن نلتزم بحماية خصوصية بياناتك ومعلوماتك الشخصية.' : 'We are committed to protecting the privacy of your data and personal information.')
    },
    terms: {
      title: language === 'ar' ? 'شروط الاستخدام' : 'Terms of Use',
      icon: <FileText size={40} />,
      text: settings.termsAr || (language === 'ar' ? 'باستخدامك لهذه المنصة، فإنك توافق على الالتزام بشروط الاستخدام المعمول بها.' : 'By using this platform, you agree to abide by the applicable terms of use.')
    },
    disclaimer: {
      title: language === 'ar' ? 'إخلاء المسؤولية' : 'Disclaimer',
      icon: <AlertCircle size={40} />,
      text: settings.disclaimerAr || (language === 'ar' ? 'جميع البيانات والتحاليل المقدمة في هذه المنصة هي لأغراض إعلامية فقط ولا تعتبر نصيحة استثمارية.' : 'All data and analysis provided on this platform are for informational purposes only and are not considered investment advice.')
    }
  };

  const page = content[type];

  return (
    <div className="pt-24 pb-20 min-h-screen bg-[#050A18]">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#121E3D] border border-[#1C2E5A] rounded-[3rem] p-8 md:p-16 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent opacity-50"></div>
          
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-400 hover:text-[#D4AF37] mb-12 transition-colors font-bold uppercase tracking-widest text-xs"
          >
            {language === 'ar' ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            {language === 'ar' ? 'العودة' : 'Back'}
          </button>

          <div className="flex items-center gap-6 mb-12">
            <div className="w-20 h-20 bg-[#0A1128] rounded-[2rem] border border-[#1C2E5A] flex items-center justify-center text-[#D4AF37] shadow-xl">
              {page.icon}
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
                {page.title}
              </h1>
              <div className="h-1 w-20 bg-[#D4AF37] mt-4 rounded-full"></div>
            </div>
          </div>

          <div className="prose prose-invert max-w-none">
            <p className="text-gray-300 text-lg leading-relaxed font-medium whitespace-pre-wrap">
              {page.text}
            </p>
          </div>

          <div className="mt-20 pt-12 border-t border-[#1C2E5A]">
            <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.4em] text-center">
              {language === 'ar' ? 'منصة الأسعار العالمية GCP - المكتب القانوني' : 'Global Pricing Platform - Legal Division'}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
