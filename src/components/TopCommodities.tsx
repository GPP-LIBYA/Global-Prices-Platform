import { useChartContainer } from '../hooks/useChartContainer';
import React, { useState } from 'react';
import { useMarketData } from '../context/MarketContext';
import { ArrowUpRight, ArrowDownRight, Activity } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, YAxis } from 'recharts';
import { useLanguage } from '../context/LanguageContext';
import { PriceDisplay } from './PriceDisplay';
import { CommodityHistoryModal } from './CommodityHistoryModal';


const MiniChart = ({ item, color }: { item: any, color: string }) => {
  const { containerRef, isReady } = useChartContainer();
  return (
    <div ref={containerRef} className="h-16 w-full mt-4 relative z-10">
      {isReady && item.history && item.history.length > 0 && (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={item.history}>
            <defs>
              <linearGradient id={`gradient-${item.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <YAxis domain={['dataMin', 'dataMax']} hide />
            <Area 
              type="monotone" 
              dataKey="price" 
              stroke={color} 
              strokeWidth={2}
              fillOpacity={1} 
              fill={`url(#gradient-${item.id})`} 
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};
export const TopCommodities = () => {
  const { data, pricesLoading: loading, error, isMockData } = useMarketData();
  const { t, language } = useLanguage();
  const [selectedCommodity, setSelectedCommodity] = useState<any>(null);

  const formatPrice = (val: number | string | undefined | null) => {
    if (val === null || val === undefined || val === '') return '---';
    const num = Number(val);
    if (isNaN(num)) return '---';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  
  if (loading && data.length === 0) {
    return (
      <section className="py-12 bg-[#0A1128]">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Activity className="text-[#D4AF37]" />
              {t('topCommoditiesTitle')}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-[#121E3D] rounded-2xl p-6 border border-[#1C2E5A] h-48 animate-pulse flex flex-col justify-between">
                <div className="flex justify-between">
                   <div className="w-24 h-6 bg-[#1C2E5A] rounded"></div>
                   <div className="w-12 h-6 bg-[#1C2E5A] rounded"></div>
                </div>
                <div className="w-32 h-10 bg-[#1C2E5A] rounded"></div>
                <div className="w-full h-16 bg-[#1C2E5A] rounded mt-4"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error && data.length === 0) {
     return (
        <section className="py-12 bg-[#0A1128]">
          <div className="container mx-auto px-4 text-center">
             <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 max-w-2xl mx-auto text-red-500">
                <Activity className="mx-auto mb-4" size={48} />
                <h3 className="text-xl font-bold mb-2">تعذر تحميل هذا الجزء مؤقتًا</h3>
                <p>{error}</p>
             </div>
          </div>
        </section>
     );
  }

  // Select key commodities to highlight (by id or symbol)
  const highlightKeys = ['brent', 'gold', 'wheat', 'copper', 'xau', 'wti'];
  let highlights = data.filter(c => 
    highlightKeys.includes(c.id.toLowerCase()) || 
    (c.symbol && highlightKeys.includes(c.symbol.toLowerCase()))
  );
  
  // Fallback to top 4 if empty
  if (highlights.length === 0 && data.length > 0) {
    highlights = data.slice(0, 4);
  } else if (highlights.length > 4) {
    // Limit to 4
    highlights = highlights.slice(0, 4);
  }

  if (highlights.length === 0) return null;

  return (
    <section className="py-12 bg-[#0A1128]">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col gap-1">
             <h2 className="text-2xl font-bold text-white flex items-center gap-3">
               <Activity className="text-[#D4AF37]" />
               {t('topCommoditiesTitle')}
             </h2>
             <div className="flex items-center gap-2 mt-1">
                {isMockData ? (
                  <span className="bg-yellow-500/10 text-yellow-500 text-[10px] px-2 py-0.5 rounded border border-yellow-500/20 font-medium tracking-wider uppercase">
                    {language === 'ar' ? 'بيانات تجريبية لمعاينة الواجهة' : 'Mock Data Preview'}
                  </span>
                ) : (
                  <span className="bg-green-500/10 text-green-500 text-[10px] px-2 py-0.5 rounded border border-green-500/20 font-medium tracking-wider uppercase flex items-center gap-1">
                     <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                    {language === 'ar' ? 'بيانات حية' : 'Live Data'}
                  </span>
                )}
             </div>
          </div>
          <a href="#table" className="text-[#D4AF37] hover:text-[#E5C158] text-sm font-medium flex items-center gap-1 transition-colors">
            {t('viewAll')}
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {highlights.map(item => {
            const isUp = item.trend === 'up';
            const color = isUp ? '#10B981' : '#EF4444';
            const bgColor = isUp ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
            const name = language === 'ar' ? item.nameAr : item.nameEn;
            const sector = language === 'ar' ? item.sectorAr : item.sectorEn;
            
            // Format unit with currency
            let rawUnit = language === 'ar' ? item.unitAr : item.unitEn;
            if (item.currency) {
                const currStr = language === 'ar' ? (item.currency === 'LYD' ? 'دينار' : item.currency === 'EUR' ? 'يورو' : item.currency === 'USD' ? 'دولار' : item.currency) : item.currency;
                rawUnit = currStr + ' / ' + rawUnit;
            }
            const unit = rawUnit;

            return (
              <div 
                key={item.id} 
                onClick={() => setSelectedCommodity(item)}
                className="bg-[#121E3D] rounded-2xl p-6 border border-[#1C2E5A] hover:border-[#D4AF37]/50 transition-all group relative overflow-hidden cursor-pointer"
              >
                {/* Background Glow */}
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full mix-blend-screen filter blur-3xl opacity-20 transition-opacity group-hover:opacity-40" style={{ backgroundColor: color }}></div>
                
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div>
                    <h3 className="text-lg font-bold text-white">{name}</h3>
                    <p className="text-xs text-gray-400 mt-1">{item.symbol} • {sector}</p>
                  </div>
                  <div className={`px-2 py-1 rounded-md text-xs font-bold flex items-center gap-1`} style={{ backgroundColor: bgColor, color: color }} dir="ltr">
                    {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {Math.abs(item.changePercent || 0).toFixed(2)}%
                  </div>
                </div>

                <div className="mb-4 relative z-10">
                  <PriceDisplay price={item.price} className="text-3xl font-black text-white block" />
                  <div className="flex justify-between items-center mt-2 text-[10px] uppercase tracking-wider text-gray-500 font-bold border-t border-[#1C2E5A] pt-2">
                    <div className="flex flex-col">
                       <span>{language === 'ar' ? 'الأعلى' : 'High'}</span>
                       <span className="text-gray-300">{formatPrice(item.high)}</span>
                    </div>
                    <div className="flex flex-col text-right">
                       <span>{language === 'ar' ? 'الأدنى' : 'Low'}</span>
                       <span className="text-gray-300">{formatPrice(item.low)}</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-400 mt-2">
                    {unit}
                  </div>
                </div>

                {/* Mini Chart */}
                <MiniChart item={item} color={color} />
              </div>
            );
          })}
        </div>
        
        {selectedCommodity && (
           <CommodityHistoryModal 
             commodity={selectedCommodity} 
             onClose={() => setSelectedCommodity(null)} 
           />
        )}
      </div>
    </section>
  );
};
