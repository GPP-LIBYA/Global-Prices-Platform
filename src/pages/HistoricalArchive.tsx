import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { History, Search, Activity, Calendar, Download, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLanguage } from '../context/LanguageContext';
import { useMarketData } from '../context/MarketContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { PriceDisplay } from '../components/PriceDisplay';
import { exportChartToPNG } from '../utils/exportChart';
import { formatDisplayDate } from '../utils/formatDate';
import { aggregateDailyLastPrices } from '../utils/dailyPriceAggregator';
import { useChartContainer } from '../hooks/useChartContainer';

export const HistoricalArchive = () => {
  const { t, language } = useLanguage();
  const { history: historyData, fetchHistory, historyLoading: marketLoading } = useMarketData();
  const [commodities, setCommodities] = useState<any[]>([]);
  const [selectedCommodityId, setSelectedCommodityId] = useState<string>('');
  
  const { containerRef: chartRef, isReady } = useChartContainer();
  
  const [formattedHistory, setFormattedHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<number | 'all'>(7); 

  const [stats, setStats] = useState({
    firstPrice: 0,
    lastPrice: 0,
    highPrice: 0,
    lowPrice: 0,
    firstDate: '',
    lastDate: ''
  });

  useEffect(() => {
    const fetchCommodities = async () => {
      const { data } = await supabase.from('commodities').select('id, symbol, name_ar, name_en, currency').order('name_ar');
      if (data) {
        setCommodities(data);
        if (data.length > 0) {
          setSelectedCommodityId(data[0].id);
        }
      }
    };
    fetchCommodities();
  }, []);

  useEffect(() => {
    if (selectedCommodityId && commodities.length > 0) {
      const comm = commodities.find(c => c.id === selectedCommodityId);
      if (comm) {
        fetchHistory(comm.symbol);
      }
    }
  }, [selectedCommodityId, commodities]);

  useEffect(() => {
    if (historyData) {
      let filtered = [...historyData];
      if (period !== 'all') {
        const date = new Date();
        date.setDate(date.getDate() - (period as number));
        filtered = filtered.filter(item => new Date(item.recorded_at) >= date);
      }

      if (filtered.length > 0) {
        const dailyPoints = aggregateDailyLastPrices(filtered, language as 'ar' | 'en');
        const formatted = dailyPoints.map(item => ({
          ...item,
          time: item.dateLabel,
          price: item.price
        }));
        
        setFormattedHistory(formatted);

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
        setFormattedHistory([]);
      }
    }
  }, [historyData, period, language]);

  useEffect(() => {
    setLoading(marketLoading);
  }, [marketLoading]);

  const periods = [
    { label: language === 'ar' ? 'آخر 7 أيام' : 'Last 7 Days', value: 7 },
    { label: language === 'ar' ? 'آخر 30 يومًا' : 'Last 30 Days', value: 30 },
    { label: language === 'ar' ? 'آخر 3 أشهر' : 'Last 3 Months', value: 90 },
    { label: language === 'ar' ? 'آخر 6 أشهر' : 'Last 6 Months', value: 180 },
    { label: language === 'ar' ? 'سنة' : '1 Year', value: 365 },
    { label: language === 'ar' ? 'الكل' : 'All', value: 'all' }
  ];

  const selectedComm = commodities.find(c => c.id === selectedCommodityId);
  const changeVal = stats.lastPrice - stats.firstPrice;
  const changePct = stats.firstPrice > 0 ? (changeVal / stats.firstPrice) * 100 : 0;
  const isUp = changeVal >= 0;

  const handleExport = async () => {
    if (!chartRef.current || !selectedComm) return;
    try {
      const commodityName = language === 'ar' ? selectedComm.name_ar : selectedComm.name_en;
      const chartTitle = language === 'ar' ? 'البيانات التاريخية' : 'Historical Data';
      const dateRangeStr = `${formatDisplayDate(stats.firstDate)} - ${formatDisplayDate(stats.lastDate)}`;
      
      await exportChartToPNG({
        data: formattedHistory,
        element: chartRef.current,
        filename: commodityName,
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
    <div className="min-h-screen bg-[#0A1128] pt-24 pb-12">
      <div className="container mx-auto px-4">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 sm:mb-10 border-b border-[#1C2E5A] pb-4 sm:pb-6">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center border border-[#D4AF37]/20 shrink-0">
            <History className="text-[#D4AF37]" size={28} />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white uppercase tracking-tighter">
              {language === 'ar' ? 'الأرشيف التاريخي للأسعار' : 'Historical Prices Archive'}
            </h1>
            <p className="text-sm sm:text-base text-gray-400 mt-1 sm:mt-2">
              {language === 'ar' ? 'استعرض مسار وتطور الأسعار عبر الزمن ببيانات دقيقة' : 'Explore the trajectory of prices over time with precise data'}
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
          {/* Sidebar / Controls */}
          <div className="w-full lg:w-1/3 space-y-4 sm:space-y-6">
            <div className="bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-4 sm:p-6 shadow-xl">
              <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                <Search size={18} className="text-[#D4AF37]" />
                {language === 'ar' ? 'اختيار السلعة' : 'Select Commodity'}
              </h3>
              
              <div className="relative">
                <select 
                  value={selectedCommodityId}
                  onChange={(e) => setSelectedCommodityId(e.target.value)}
                  className="w-full bg-[#0A1128] border border-[#1C2E5A] rounded-xl py-3.5 sm:py-4 px-4 text-white focus:border-[#D4AF37] outline-none appearance-none text-base sm:text-sm cursor-pointer"
                >
                  <option value="" disabled>{language === 'ar' ? 'اختر سلعة...' : 'Select commodity...'}</option>
                  {commodities.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.symbol} - {language === 'ar' ? c.name_ar : c.name_en}
                    </option>
                  ))}
                </select>
                <div className={`absolute ${language === 'ar' ? 'left-4' : 'right-4'} top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-xs`}>
                  ▼
                </div>
              </div>
            </div>

            <div className="bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-4 sm:p-6 shadow-xl">
              <h3 className="text-base sm:text-lg font-bold text-white mb-3 sm:mb-4 flex items-center gap-2">
                <Calendar size={18} className="text-[#D4AF37]" />
                {language === 'ar' ? 'الفترة الزمنية' : 'Time Period'}
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2">
                {periods.map(p => (
                  <button
                    key={p.value}
                    onClick={() => setPeriod(p.value as any)}
                    className={`px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-bold transition-colors ${period === p.value ? 'bg-[#D4AF37] text-[#0A1128]' : 'bg-[#0A1128] text-gray-400 hover:text-white border border-[#1C2E5A]'}`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Realtime Stats box if loaded */}
            {selectedComm && formattedHistory.length > 0 && !loading && (
              <div className="bg-gradient-to-br from-[#121E3D] to-[#0A1128] border border-[#1C2E5A] rounded-2xl p-4 sm:p-6 shadow-xl relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37]/5 rounded-full blur-3xl"></div>
                 <div className="text-gray-500 text-xs sm:text-sm font-bold uppercase tracking-wider mb-2">
                   {language === 'ar' ? selectedComm.name_ar : selectedComm.name_en}
                 </div>
                 <div className="flex items-end gap-2 sm:gap-3 mb-3 sm:mb-4 text-white">
                   <PriceDisplay price={stats.lastPrice} className="text-2xl sm:text-4xl font-black" />
                   <span className="text-lg sm:text-xl text-[#D4AF37] pb-1">{selectedComm.currency}</span>
                 </div>
                 
                 <div className={`flex items-center gap-2 font-bold text-sm sm:text-base ${isUp ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                    <Activity size={18} />
                    <span>{isUp ? '+' : ''}{changePct.toFixed(2)}%</span>
                    <span className="text-xs sm:text-sm opacity-70">({isUp ? '+' : ''}{changeVal.toFixed(2)})</span>
                 </div>
              </div>
            )}
          </div>

          {/* Main Chart Area */}
          <div className="w-full lg:w-2/3 min-w-0">
            <div className="bg-[#121E3D] border border-[#1C2E5A] rounded-2xl p-4 sm:p-6 md:p-8 shadow-xl min-h-[380px] sm:min-h-[500px] flex flex-col">
              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-l-2 border-[#D4AF37] mb-4"></div>
                  <div className="text-gray-400">{language === 'ar' ? 'جارٍ جلب البيانات التاريخية...' : 'Fetching historical data...'}</div>
                </div>
              ) : formattedHistory.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-10">
                  <div className="w-24 h-24 bg-[#0A1128] rounded-full flex items-center justify-center mb-6 border border-[#1C2E5A]">
                    <History className="text-gray-600" size={40} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {language === 'ar' ? 'لا توجد بيانات تاريخية كافية لهذه السلعة' : 'Insufficient Data'}
                  </h3>
                  <p className="text-gray-500 max-w-md">
                    {language === 'ar' 
                      ? 'لا توجد بيانات تاريخية مسجلة لهذه السلعة في الفترة الزمنية المحددة.' 
                      : 'No historical data recorded for this commodity in the selected time period.'}
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col relative">
                  <button 
                    onClick={handleExport}
                    className="absolute top-0 right-0 z-10 p-2 bg-[#0A1128] hover:bg-[#1C2E5A] border border-[#1C2E5A] text-[#D4AF37] rounded-lg transition-colors flex items-center gap-2"
                    title={language === 'ar' ? 'تحميل الصورة' : 'Download Image'}
                  >
                    <Download size={16} />
                  </button>
                  {/* Chart */}
                  <div ref={chartRef} className="w-full h-[220px] sm:h-[280px] md:h-[360px] lg:h-[420px] mb-6 sm:mb-8 relative pt-10 min-w-0" dir="ltr">
                    {isReady && formattedHistory && formattedHistory.length > 0 && (
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={formattedHistory}>
                          <defs>
                             <linearGradient id="colorMain" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={isUp ? '#10B981' : '#EF4444'} stopOpacity={0.4}/>
                                <stop offset="95%" stopColor={isUp ? '#10B981' : '#EF4444'} stopOpacity={0}/>
                             </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1C2E5A" vertical={false} />
                          <XAxis dataKey="time" stroke="#6B7280" fontSize={10} tickMargin={10} />
                          <YAxis 
                            dataKey="price"
                            stroke="#6B7280" 
                            fontSize={10} 
                            domain={['auto', 'auto']}
                            tickFormatter={(val) => val.toFixed(2)}
                            tickMargin={10}
                          />
                          <Tooltip 
                             contentStyle={{ backgroundColor: '#0A1128', borderColor: '#1C2E5A', borderRadius: '12px', padding: '10px' }}
                             itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                             labelStyle={{ color: '#9CA3AF', marginBottom: '6px', fontSize: '11px' }}
                          />
                          <Area 
                             type="monotone" 
                             dataKey="price" 
                             stroke={isUp ? '#10B981' : '#EF4444'} 
                             fillOpacity={1} 
                             fill="url(#colorMain)" 
                             strokeWidth={3}
                          />
                       </AreaChart>
                    </ResponsiveContainer>
                    )}
                  </div>

                  {/* Summary Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 mt-auto">
                     {[
                        { label: language === 'ar' ? 'السعر الأول' : 'First Price', value: stats.firstPrice.toFixed(2) },
                        { label: language === 'ar' ? 'السعر الأخير' : 'Last Price', value: stats.lastPrice.toFixed(2) },
                        { label: language === 'ar' ? 'أعلى سعر' : 'Highest Price', value: stats.highPrice.toFixed(2) },
                        { label: language === 'ar' ? 'أدنى سعر' : 'Lowest Price', value: stats.lowPrice.toFixed(2) },
                        { label: language === 'ar' ? 'مقدار التغير' : 'Change Value', value: `${changeVal >= 0 ? '+' : ''}${changeVal.toFixed(2)}`, color: changeVal >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]' },
                        { label: language === 'ar' ? 'نسبة التغير' : 'Change Percent', value: `${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%`, color: changePct >= 0 ? 'text-[#10B981]' : 'text-[#EF4444]' },
                        { label: language === 'ar' ? 'تاريخ أول تسجيل' : 'First Recorded Date', value: formatDisplayDate(stats.firstDate) },
                        { label: language === 'ar' ? 'تاريخ آخر تسجيل' : 'Last Recorded Date', value: formatDisplayDate(stats.lastDate) }
                     ].map((stat, i) => (
                        <div key={i} className="bg-[#0A1128] border border-[#1C2E5A] p-2.5 sm:p-4 rounded-xl text-center">
                           <div className="text-[9px] sm:text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1 sm:mb-2">{stat.label}</div>
                           <div className={`text-sm sm:text-base md:text-lg font-bold ${stat.color || 'text-white'}`}>{stat.value}</div>
                        </div>
                     ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
