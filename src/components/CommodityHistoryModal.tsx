import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, TrendingUp, TrendingDown, Minus, Activity, Info, Calendar, Download } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../context/LanguageContext';
import { useChartContainer } from '../hooks/useChartContainer';
import { PriceDisplay } from './PriceDisplay';
import { exportChartToPNG } from '../utils/exportChart';
import { formatDisplayDate } from '../utils/formatDate';
import { aggregateDailyLastPrices } from '../utils/dailyPriceAggregator';

interface CommodityHistoryModalProps {
  commodity: any;
  onClose: () => void;
}

export const CommodityHistoryModal: React.FC<CommodityHistoryModalProps> = ({ commodity, onClose }) => {
  const { t, language } = useLanguage();
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<number | 'all'>(7); // days
  
  const { containerRef: chartRef, isReady } = useChartContainer();
  
  const [stats, setStats] = useState({
    firstPrice: 0,
    lastPrice: 0,
    highPrice: 0,
    lowPrice: 0,
    firstDate: '',
    lastDate: ''
  });

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        console.log('History symbol:', commodity.symbol);
        
        let query = supabase
          .from('commodity_price_history')
          .select('*')
          .eq('symbol', commodity.symbol)
          .order('recorded_at', { ascending: true });

        if (period !== 'all') {
          const date = new Date();
          date.setDate(date.getDate() - period);
          query = query.gte('recorded_at', date.toISOString());
        }

        const { data, error } = await query;

        if (error) throw error;

        if (data && data.length > 0) {
          // Aggregate to exactly 1 point per day with the chronologically last price
          const dailyPoints = aggregateDailyLastPrices(data, language as 'ar' | 'en');
          const formattedData = dailyPoints.map(item => ({
            ...item,
            time: item.dateLabel,
            price: item.price
          }));

          setHistoryData(formattedData);

          // Calculate stats based on daily aggregated records
          const prices = dailyPoints.map(d => d.price);
          setStats({
            firstPrice: prices[0],
            lastPrice: prices[prices.length - 1],
            highPrice: Math.max(...prices),
            lowPrice: Math.min(...prices),
            firstDate: dailyPoints[0].date,
            lastDate: dailyPoints[dailyPoints.length - 1].date
          });
        } else {
          setHistoryData([]);
        }
      } catch (err) {
        console.error("Error fetching history:", err);
      } finally {
        setLoading(false);
      }
    };

    if (commodity) {
      fetchHistory();
    }
  }, [commodity, period, language]);

  const periods = [
    { label: language === 'ar' ? '7 أيام' : '7 Days', value: 7 },
    { label: language === 'ar' ? '30 يومًا' : '30 Days', value: 30 },
    { label: language === 'ar' ? '3 أشهر' : '3 Months', value: 90 },
    { label: language === 'ar' ? '6 أشهر' : '6 Months', value: 180 },
    { label: language === 'ar' ? 'سنة' : '1 Year', value: 365 },
    { label: language === 'ar' ? 'الكل' : 'All', value: 'all' }
  ];

  if (!commodity) return null;

  const changeVal = stats.lastPrice - stats.firstPrice;
  const changePct = stats.firstPrice > 0 ? (changeVal / stats.firstPrice) * 100 : 0;
  const isUp = changeVal >= 0;

  const handleExport = async () => {
    if (!chartRef.current || !commodity) return;
    try {
      const commodityName = language === 'ar' ? commodity.nameAr : commodity.nameEn;
      const chartTitle = language === 'ar' ? 'المسار الزمني لحركة السعر' : 'Price Timeline Analysis';
      const dateRangeStr = stats.firstDate && stats.lastDate ? 
        `${formatDisplayDate(stats.firstDate)} - ${formatDisplayDate(stats.lastDate)}` : '';
      
      await exportChartToPNG({
        data: historyData,
        element: chartRef.current,
        filename: commodityName || commodity.symbol,
        title: chartTitle,
        subtitle: commodityName,
        dateRange: dateRangeStr,
        theme: 'dark',
        language: language as 'ar' | 'en'
      });
    } catch (err) {
      console.error('Error exporting chart to PNG:', err);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/90 backdrop-blur-md">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-[#0A1128] border border-[#1C2E5A] rounded-2xl sm:rounded-[2.5rem] w-full max-w-5xl max-h-[92vh] overflow-y-auto shadow-2xl relative custom-scrollbar"
        >
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent"></div>
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 text-gray-400 hover:text-white transition-all z-10 w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center bg-[#121E3D] rounded-xl sm:rounded-2xl border border-[#1C2E5A] hover:bg-red-500/10 hover:border-red-500/20"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>

          <div className="p-4 sm:p-6 md:p-10 lg:p-12">
            <div className="flex flex-col lg:flex-row justify-between items-start mb-8 sm:mb-12 gap-6 sm:gap-10 pr-10 sm:pr-0">
              <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                <div className="w-14 h-14 sm:w-20 sm:h-20 bg-[#D4AF37]/10 rounded-2xl sm:rounded-[2rem] flex items-center justify-center border border-[#D4AF37]/20 shadow-inner shrink-0">
                  <TrendingUp className="text-[#D4AF37]" size={28} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-1 sm:mb-2 uppercase tracking-tighter truncate">
                    {language === 'ar' ? commodity.nameAr : commodity.nameEn}
                  </h2>
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <span className="text-[#D4AF37] font-black text-base sm:text-xl tracking-widest">{commodity.symbol}</span>
                    <span className="px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-lg sm:rounded-xl bg-[#121E3D] text-[9px] sm:text-[10px] uppercase font-black text-[#D4AF37] border border-[#D4AF37]/20">
                      {language === 'ar' ? commodity.sectorAr : (commodity.sectorEn || commodity.sector)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-[#121E3D] p-5 sm:p-8 rounded-2xl sm:rounded-[2rem] border border-[#1C2E5A] w-full lg:w-auto min-w-0 sm:min-w-[280px] shadow-2xl">
                <div className="text-gray-500 text-[9px] sm:text-[10px] mb-1 sm:mb-2 uppercase tracking-[0.3em] font-black">{language === 'ar' ? 'السعر الحالي' : 'Current Price'}</div>
                <div className="flex items-center gap-2 sm:gap-3 flex-wrap" dir="ltr">
                  <span className="text-2xl sm:text-3xl text-[#D4AF37] font-black">
                    {commodity.currency === 'LYD' ? 'د.ل' : commodity.currency === 'EUR' ? '€' : commodity.currency === 'USD' ? '$' : commodity.currency}
                  </span>
                  <PriceDisplay price={commodity.price} className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tighter" />
                </div>
                <div className={`flex items-center gap-2 sm:gap-3 mt-3 sm:mt-4 font-black ${commodity.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                  <Activity size={18} />
                  <span className="text-lg sm:text-xl tracking-tight">{commodity.trend === 'up' ? '+' : ''}{commodity.changePercent}%</span>
                  <span className="text-xs opacity-50 font-medium">({commodity.trend === 'up' ? '+' : ''}{commodity.changeValue || commodity.changeAmount})</span>
                </div>
              </div>
            </div>

            {/* Filter */}
            <div className="flex flex-wrap gap-1.5 sm:gap-3 mb-6 sm:mb-8 bg-[#121E3D]/50 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border border-[#1C2E5A] w-full sm:w-max max-w-full">
              {periods.map(p => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value as any)}
                  className={`flex-1 sm:flex-initial px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${period === p.value ? 'bg-[#D4AF37] text-[#0A1128] shadow-lg shadow-[#D4AF37]/20 scale-105' : 'text-gray-500 hover:text-white hover:bg-[#1C2E5A]'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Chart Area */}
            <div className="bg-[#0A1128]/50 rounded-2xl sm:rounded-[2.5rem] p-4 sm:p-6 md:p-8 border border-[#1C2E5A] mb-8 sm:mb-10 overflow-hidden relative group">
               <div className="flex justify-between items-center mb-6 sm:mb-8">
                  <h3 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-3">
                     <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse"></div>
                     {language === 'ar' ? 'المسار الزمني لحركة السعر' : 'Price Timeline Analysis'}
                  </h3>
                  {historyData.length >= 2 && (
                    <button 
                      onClick={handleExport}
                      className="p-2 bg-[#121E3D] hover:bg-[#1C2E5A] border border-[#1C2E5A] text-[#D4AF37] rounded-lg transition-colors flex items-center justify-center"
                      title={language === 'ar' ? 'تحميل الصورة' : 'Download Image'}
                    >
                      <Download size={16} />
                    </button>
                  )}
               </div>
               
               {loading ? (
                 <div className="h-64 sm:h-80 md:h-[400px] w-full flex items-center justify-center">
                    <div className="relative">
                      <div className="w-12 sm:w-16 h-12 sm:h-16 border-4 border-[#1C2E5A] border-t-[#D4AF37] rounded-full animate-spin"></div>
                      <div className="absolute inset-0 flex items-center justify-center">
                         <div className="w-6 sm:w-8 h-6 sm:h-8 bg-[#121E3D] rounded-full"></div>
                      </div>
                    </div>
                 </div>
               ) : historyData.length < 2 ? (
                 <div className="h-[240px] sm:h-[320px] w-full flex flex-col items-center justify-center gap-4">
                    <Activity size={40} className="text-gray-700 animate-pulse" />
                    <p className="text-gray-500 font-bold text-center max-w-xs text-sm sm:text-base">
                      {language === 'ar' ? 'لا توجد بيانات تاريخية متاحة لهذه السلعة حاليًا' : 'No historical data available for this commodity right now'}
                    </p>
                 </div>
               ) : (
                 <div ref={chartRef} className="w-full h-[240px] sm:h-[320px] md:h-[400px] min-w-0" dir="ltr">
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={historyData}>
                          <defs>
                             <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={isUp ? '#10B981' : '#EF4444'} stopOpacity={0.2}/>
                                <stop offset="95%" stopColor={isUp ? '#10B981' : '#EF4444'} stopOpacity={0}/>
                             </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1C2E5A" vertical={false} opacity={0.3} />
                          <XAxis 
                            dataKey="time" 
                            stroke="#4B5563" 
                            fontSize={10} 
                            tickMargin={15} 
                            axisLine={false}
                            tickLine={false}
                            fontFamily="monospace"
                          />
                          <YAxis 
                            dataKey="price"
                            stroke="#4B5563" 
                            fontSize={10} 
                            domain={['auto', 'auto']}
                            tickFormatter={(val) => val.toLocaleString()}
                            axisLine={false}
                            tickLine={false}
                            fontFamily="monospace"
                          />
                          <Tooltip 
                             contentStyle={{ 
                               backgroundColor: '#121E3D', 
                               borderColor: '#1C2E5A', 
                               borderRadius: '16px',
                               boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                               borderWidth: '2px'
                             }}
                             itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                             labelStyle={{ color: '#D4AF37', fontWeight: 'black', marginBottom: '8px', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                          />
                          <Area 
                             type="monotone" 
                             dataKey="price" 
                             stroke={isUp ? '#10B981' : '#EF4444'} 
                             fillOpacity={1} 
                             fill="url(#colorPrice)" 
                             strokeWidth={3}
                             animationDuration={1500}
                             dot={{ fill: isUp ? '#10B981' : '#EF4444', strokeWidth: 2, r: 0 }}
                             activeDot={{ r: 5, strokeWidth: 0, fill: '#D4AF37 shadow-lg shadow-[#D4AF37]' }}
                          />
                       </AreaChart>
                    </ResponsiveContainer>
                 </div>
               )}
            </div>

            {/* Stats Grid */}
            {!loading && historyData.length > 0 && (
              <>
                <h3 className="text-lg sm:text-xl font-black text-white mb-4 sm:mb-6 uppercase tracking-widest flex items-center gap-3">
                  <Activity className="text-[#D4AF37]" size={22} />
                  {language === 'ar' ? 'مقارنة الأداء' : 'Performance Comparison'}
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
                   {[
                      { label: language === 'ar' ? 'السعر الأول' : 'Initial Price', value: stats.firstPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), icon: <Activity size={14} /> },
                      { label: language === 'ar' ? 'السعر الأخير' : 'Closing Price', value: stats.lastPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), icon: <Activity size={14} /> },
                      { label: language === 'ar' ? 'مقدار التغير' : 'Change Amount', value: `${changeVal >= 0 ? '+' : ''}${changeVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, color: changeVal > 0 ? 'text-green-500' : changeVal < 0 ? 'text-red-500' : 'text-gray-500' },
                      { label: language === 'ar' ? 'نسبة التغير %' : 'Change %', value: `${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%`, color: changePct > 0 ? 'text-green-500' : changePct < 0 ? 'text-red-500' : 'text-gray-500' },
                      { label: language === 'ar' ? 'أعلى سعر' : 'High Price', value: stats.highPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), color: 'text-green-500' },
                      { label: language === 'ar' ? 'أدنى سعر' : 'Low Price', value: stats.lowPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), color: 'text-red-500' },
                      { label: language === 'ar' ? 'الاتجاه العام' : 'General Trend', value: changePct > 0 ? (language === 'ar' ? 'صاعد' : 'Bullish') : changePct < 0 ? (language === 'ar' ? 'هابط' : 'Bearish') : (language === 'ar' ? 'مستقر' : 'Neutral'), color: changePct > 0 ? 'text-green-500' : changePct < 0 ? 'text-red-500' : 'text-gray-500', icon: changePct > 0 ? <TrendingUp size={14} /> : changePct < 0 ? <TrendingDown size={14} /> : <Minus size={14} /> },
                      { label: language === 'ar' ? 'آخر تحديث' : 'Last Updated On', value: formatDisplayDate(stats.lastDate) }
                   ].map((stat, i) => (
                      <div key={i} className="bg-[#121E3D] border border-[#1C2E5A] p-3.5 sm:p-6 rounded-xl sm:rounded-2xl flex flex-col justify-between group hover:border-[#D4AF37]/30 transition-all shadow-xl shadow-black/20">
                         <div className="flex items-center justify-between mb-3 sm:mb-4">
                            <div className="text-[9px] text-gray-500 uppercase tracking-widest font-black leading-tight max-w-[80px]">{stat.label}</div>
                            <div className="w-5 h-5 sm:w-6 sm:h-6 bg-[#0A1128] rounded-lg border border-[#1C2E5A] flex items-center justify-center text-[#D4AF37] group-hover:scale-110 transition-transform">
                               {stat.icon || <Calendar size={12} />}
                            </div>
                         </div>
                         <div className={`text-base sm:text-xl font-black ${stat.color || 'text-white'} tracking-tight`} dir="ltr">{stat.value}</div>
                      </div>
                   ))}
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
