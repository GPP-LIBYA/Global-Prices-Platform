import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const FAQ = () => {
  const { t, language } = useLanguage();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    { q: t('q1'), a: t('a1') },
    { q: t('q2'), a: t('a2') },
    { q: t('q3'), a: t('a3') },
    { q: t('q4'), a: t('a4') },
  ];

  return (
    <div className="pt-16 sm:pt-24 pb-12 sm:pb-20 min-h-screen">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-[#1C2E5A] mb-4 sm:mb-6">
            <HelpCircle size={28} className="text-[#D4AF37]" />
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-4">{t('faqTitle')}</h1>
          <p className="text-sm sm:text-base text-gray-400">{t('faqSub')}</p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className="bg-[#121E3D] border border-[#1C2E5A] rounded-xl overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className={`w-full px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between ${language === 'ar' ? 'text-right' : 'text-left'} hover:bg-[#1C2E5A] transition-colors gap-4`}
              >
                <span className="text-base sm:text-lg font-semibold text-white">{faq.q}</span>
                {openIndex === index ? (
                  <ChevronUp size={20} className="text-[#D4AF37] shrink-0" />
                ) : (
                  <ChevronDown size={20} className="text-gray-400 shrink-0" />
                )}
              </button>
              
              {openIndex === index && (
                <div className="px-4 sm:px-6 py-4 sm:py-5 border-t border-[#1C2E5A] bg-[#0A1128]/50">
                  <p className="text-sm sm:text-base text-gray-300 leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
