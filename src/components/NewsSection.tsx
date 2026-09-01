import React, { useState, useEffect } from 'react';
import { Newspaper, ChevronLeft, ChevronRight, AlertTriangle, ExternalLink, Calendar } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { formatDisplayDate } from '../utils/formatDate';

export const NewsSection = ({ limit = 3 }: { limit?: number }) => {
  const { t, language } = useLanguage();
  const [news, setNews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchNews = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('news')
          .select('*')
          .eq('status', 'published')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (error) throw error;
        if (isMounted && data) {
          setNews(data);
        }
      } catch (err: any) {
        console.error('Failed to fetch news:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchNews();
    return () => { isMounted = false; };
  }, [limit]);

  return (
    <section className="py-10 sm:py-16 bg-[#0A1128]">
      <div className="container mx-auto px-4">
        <div className="flex flex-row items-center justify-between mb-6 sm:mb-8 gap-4">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5 sm:gap-3">
            <Newspaper className="text-[#D4AF37]" size={22} />
            <span>{t('news')}</span>
          </h2>
          {limit < 10 && (
            <Link to="/news" className="text-xs sm:text-sm font-medium text-[#D4AF37] hover:text-white transition-colors shrink-0">
              {language === 'ar' ? 'عرض كل الأخبار' : 'View All News'}
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {loading ? (
            Array(limit).fill(0).map((_, i) => (
              <div key={i} className="bg-[#121E3D] rounded-2xl p-4 sm:p-6 border border-[#1C2E5A] h-48 animate-pulse flex flex-col justify-between">
                <div className="flex justify-between">
                  <div className="w-16 h-6 bg-[#1C2E5A] rounded"></div>
                  <div className="w-16 h-4 bg-[#1C2E5A] rounded"></div>
                </div>
                <div className="w-full h-12 bg-[#1C2E5A] rounded mt-4"></div>
                <div className="w-24 h-4 bg-[#1C2E5A] rounded mt-auto"></div>
              </div>
            ))
          ) : news.length === 0 ? (
            <div className="col-span-full py-12 text-center flex flex-col items-center justify-center bg-[#121E3D] rounded-2xl border border-[#1C2E5A]">
              <Newspaper size={48} className="text-gray-600 mb-4 opacity-50" />
              <p className="text-gray-400 text-base sm:text-lg">
                {language === 'ar' ? 'لا توجد أخبار متاحة' : 'No news available'}
              </p>
            </div>
          ) : (
            news.map((item) => {
              const isAlert = item.is_urgent;
              const type = isAlert ? (language === 'ar' ? 'عاجل' : 'Breaking') : (language === 'ar' ? item.sector_ar : item.sector_en) || 'عام';
              
              return (
                <div key={item.id} className="bg-[#121E3D] rounded-2xl p-4 sm:p-6 border border-[#1C2E5A] hover:border-[#2A4075] transition-all group flex flex-col h-full relative overflow-hidden">
                  {isAlert && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#EF4444] to-transparent"></div>
                  )}
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <span className={`text-[10px] sm:text-xs font-bold px-2 py-1 rounded-md ${isAlert ? 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20' : 'bg-[#1C2E5A] text-[#D4AF37] border border-[#2A4075]'}`}>
                      {isAlert && <AlertTriangle size={11} className={`inline ${language === 'ar' ? 'ml-1' : 'mr-1'}`} />}
                      {type}
                    </span>
                    <span className="text-[10px] sm:text-xs text-gray-500 flex items-center gap-1">
                      <Calendar size={11} />
                      {formatDisplayDate(item.created_at)}
                    </span>
                  </div>
                  
                  <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed mb-2 group-hover:text-[#D4AF37] transition-colors line-clamp-2">
                    {language === 'ar' ? item.title_ar : item.title_en}
                  </h3>
                  
                  {(item.content_ar || item.content_en) && (
                    <p className="text-xs sm:text-sm text-gray-400 line-clamp-3 mb-4 flex-grow leading-relaxed">
                      {language === 'ar' ? item.content_ar : item.content_en}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
};
