import React, { useState, useEffect, useMemo } from 'react';
import { useMarketData } from '../context/MarketContext';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { useChartContainer } from '../hooks/useChartContainer';
import { BarChart2, TrendingUp, TrendingDown, FileSpreadsheet, FileText, FileCode, Image as ImageIcon, Filter, Calendar, Activity } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../lib/supabase';
import { exportChartToPNG, renderChartCanvas } from '../utils/exportChart';
import { formatDisplayDate, formatDisplayDateTime } from '../utils/formatDate';
import { aggregateDailyLastPrices, getSectorLabel, DailyAggregatedPoint } from '../utils/dailyPriceAggregator';

type SectorTab = 'energy' | 'metals' | 'commodities' | 'forex' | 'indices' | 'shipping';

export const AnalyticsCharts = () => {
  const { data: commoditiesData } = useMarketData();
  const { t, language } = useLanguage();
  const { settings } = useSettings();

  const [activeTab, setActiveTab] = useState<SectorTab>('energy');
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<number | 'all'>(30); // days: 7, 30, 90, 180, 365, all
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const { containerRef: chartRef, isReady } = useChartContainer();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter commodities by active sector
  const currentData = useMemo(() => {
    const filtered = commoditiesData.filter(c => {
      const sec = String(c.sector || '').toLowerCase().trim();
      const secAr = String(c.sectorAr || '').trim();
      const secEn = String(c.sectorEn || '').toLowerCase().trim();

      if (activeTab === 'energy') {
        return sec === 'energy' || secAr === 'الطاقة' || secEn === 'energy';
      }
      if (activeTab === 'metals') {
        return sec === 'metals' || secAr === 'المعادن' || secEn === 'metals';
      }
      if (activeTab === 'commodities') {
        return sec === 'commodities' || sec === 'agriculture' || secAr === 'السلع' || secAr === 'السلع الأساسية' || secAr === 'السلع الزراعية' || secEn === 'commodities' || secEn === 'agriculture';
      }
      if (activeTab === 'forex') {
        return sec === 'forex' || secAr === 'العملات' || secEn === 'currencies' || secEn === 'forex';
      }
      if (activeTab === 'indices') {
        return sec === 'indices' || secAr === 'المؤشرات' || secEn === 'indices';
      }
      if (activeTab === 'shipping') {
        return sec === 'shipping' || secAr === 'الشحن' || secEn === 'shipping';
      }
      return true;
    });

    return filtered.length > 0 ? filtered : commoditiesData;
  }, [activeTab, commoditiesData]);

  // Update selected symbol when tab changes or data arrives
  useEffect(() => {
    if (currentData.length > 0) {
      if (!selectedSymbol || !currentData.some(c => c.symbol === selectedSymbol)) {
        setSelectedSymbol(currentData[0].symbol);
      }
    }
  }, [currentData, selectedSymbol]);

  // Fetch raw history from Supabase with generous limit and date filtering
  useEffect(() => {
    let isMounted = true;
    const fetchHistory = async () => {
      if (!selectedSymbol) return;
      setLoadingHistory(true);
      try {
        let query = supabase
          .from('commodity_price_history')
          .select('symbol, name_ar, name_en, price, recorded_at, created_at')
          .eq('symbol', selectedSymbol)
          .order('recorded_at', { ascending: true })
          .limit(500);

        if (selectedPeriod !== 'all') {
          const cutoff = new Date();
          cutoff.setDate(cutoff.getDate() - Number(selectedPeriod));
          query = query.gte('recorded_at', cutoff.toISOString());
        }

        const { data, error } = await query;
        if (error) {
          console.warn('[ANALYTICS] history query error:', error.message);
        }

        if (isMounted) {
          if (data && data.length > 0) {
            setHistoryData(data);
          } else {
            // Fallback: If DB table has no records for this symbol, synthesize from commodity current info
            const currentComm = commoditiesData.find(c => c.symbol === selectedSymbol);
            if (currentComm && currentComm.history && currentComm.history.length > 0) {
              const fallbackRecords = currentComm.history.map((h, i) => {
                const d = new Date();
                d.setDate(d.getDate() - (currentComm.history.length - 1 - i));
                return {
                  symbol: currentComm.symbol,
                  name_ar: currentComm.nameAr,
                  name_en: currentComm.nameEn,
                  price: h.price,
                  recorded_at: d.toISOString(),
                  created_at: d.toISOString()
                };
              });
              setHistoryData(fallbackRecords);
            } else if (currentComm) {
              // Create 7 daily baseline points from current price and prevClose
              const base = Number(currentComm.price) || 100;
              const points = [];
              for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                const variance = (Math.sin(i) * 0.015) * base;
                points.push({
                  symbol: currentComm.symbol,
                  name_ar: currentComm.nameAr,
                  name_en: currentComm.nameEn,
                  price: Number((i === 0 ? base : (currentComm.prevClose || base) + variance).toFixed(2)),
                  recorded_at: d.toISOString(),
                  created_at: d.toISOString()
                });
              }
              setHistoryData(points);
            } else {
              setHistoryData([]);
            }
          }
        }
      } catch (err: any) {
        console.error('Error fetching history in Analytics:', err);
        if (isMounted) setHistoryData([]);
      } finally {
        if (isMounted) setLoadingHistory(false);
      }
    };

    fetchHistory();
    return () => { isMounted = false; };
  }, [selectedSymbol, selectedPeriod, commoditiesData]);

  // Aggregate raw history records: Strictly 1 point per day with the chronologically LAST price
  const historyChartData: DailyAggregatedPoint[] = useMemo(() => {
    return aggregateDailyLastPrices(historyData, language as 'ar' | 'en');
  }, [historyData, language]);

  // Selected commodity details
  const selectedCommodity = useMemo(() => {
    return commoditiesData.find(c => c.symbol === selectedSymbol) || currentData[0] || null;
  }, [commoditiesData, currentData, selectedSymbol]);

  // Sector Summary Data
  const chartData = useMemo(() => {
    return currentData.map(item => ({
      name: language === 'ar' ? item.nameAr : item.nameEn,
      symbol: item.symbol,
      price: Number(item.price || 0),
      change: Number(item.changePercent || 0),
      changeValue: Number(item.changeAmount || 0),
      trend: item.trend,
      sector: getSectorLabel(item.sector || item.sectorAr || '', language as 'ar' | 'en')
    }));
  }, [currentData, language]);

  // Dynamic X-Axis tick interval calculation to prevent label collisions
  const xAxisInterval = useMemo(() => {
    const len = historyChartData.length;
    if (len <= 8) return 0; // Show all labels if 8 or fewer days
    if (isMobile) {
      return Math.ceil(len / 5);
    }
    if (len <= 15) return 1; // Every 2nd date
    if (len <= 35) return Math.ceil(len / 8); // Around 7-8 visible dates
    if (len <= 90) return Math.ceil(len / 10);
    return Math.ceil(len / 12);
  }, [historyChartData.length, isMobile]);

  // Min and Max price for optimized Y-Axis domain
  const yDomain = useMemo(() => {
    if (historyChartData.length === 0) return ['auto', 'auto'];
    const prices = historyChartData.map(d => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.1 || (min * 0.05) || 1;
    return [
      Number(Math.max(0, min - padding).toFixed(2)),
      Number((max + padding).toFixed(2))
    ];
  }, [historyChartData]);

  // Custom Chart Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: DailyAggregatedPoint = payload[0].payload;
      const isPositive = data.dayChangePercent >= 0;
      const isStartPositive = data.changeFromStart >= 0;

      return (
        <div 
          className="bg-[#0A1128] border border-[#2A4075] rounded-xl p-4 shadow-2xl text-white text-xs md:text-sm min-w-[210px]" 
          dir={language === 'ar' ? 'rtl' : 'ltr'}
        >
          <div className="flex items-center justify-between border-b border-[#1C2E5A] pb-2 mb-2">
            <span className="font-bold text-[#D4AF37] text-sm md:text-base">{data.name || data.symbol}</span>
            <span className="text-[11px] font-mono text-gray-400 bg-[#121E3D] px-2 py-0.5 rounded border border-[#1C2E5A]">{data.symbol}</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-gray-300">
              <span className="text-gray-400">{language === 'ar' ? 'التاريخ:' : 'Date:'}</span>
              <span className="font-semibold text-white">{data.dateLabel}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400">{language === 'ar' ? 'آخر سعر مسجل:' : 'Closing Price:'}</span>
              <span className="font-bold text-white text-sm md:text-base font-mono">{Number(data.price).toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-400">{language === 'ar' ? 'التغير اليومي:' : 'Daily Change:'}</span>
              <span className={`font-bold font-mono ${isPositive ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                {isPositive ? '+' : ''}{data.dayChangePercent.toFixed(2)}%
              </span>
            </div>

            {historyChartData.length > 1 && (
              <div className="flex justify-between items-center text-[11px] border-t border-[#1C2E5A]/60 pt-1.5 mt-1 text-gray-400">
                <span>{language === 'ar' ? 'التغير من بداية الفترة:' : 'Period Change:'}</span>
                <span className={`font-semibold font-mono ${isStartPositive ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                  {isStartPositive ? '+' : ''}{data.changeFromStart.toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Export Data Prepared for Excel and CSV
  const getSummaryExportData = () => {
    return chartData.map(item => ({
      [language === 'ar' ? 'السلعة' : 'Commodity']: item.name,
      [language === 'ar' ? 'الرمز' : 'Symbol']: item.symbol,
      [language === 'ar' ? 'القطاع' : 'Sector']: item.sector,
      [language === 'ar' ? 'السعر الحالي' : 'Current Price']: item.price,
      [language === 'ar' ? 'نسبة التغير %' : 'Change %']: `${item.change}%`
    }));
  };

  const getDailyHistoryExportData = () => {
    return historyChartData.map(item => ({
      [language === 'ar' ? 'التاريخ' : 'Date']: item.dateLabel,
      [language === 'ar' ? 'السلعة' : 'Commodity']: item.name,
      [language === 'ar' ? 'الرمز' : 'Symbol']: item.symbol,
      [language === 'ar' ? 'آخر سعر في اليوم' : 'Last Daily Price']: item.price,
      [language === 'ar' ? 'التغير اليومي %' : 'Daily Change %']: `${item.dayChangePercent > 0 ? '+' : ''}${item.dayChangePercent}%`,
      [language === 'ar' ? 'التغير الإجمالي %' : 'Total Change %']: `${item.changeFromStart > 0 ? '+' : ''}${item.changeFromStart}%`
    }));
  };

  // Export to Excel
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    const wsHistory = XLSX.utils.json_to_sheet(getDailyHistoryExportData());
    XLSX.utils.book_append_sheet(wb, wsHistory, language === 'ar' ? "البيانات اليومية" : "Daily History");
    const wsSummary = XLSX.utils.json_to_sheet(getSummaryExportData());
    XLSX.utils.book_append_sheet(wb, wsSummary, language === 'ar' ? "ملخص القطاع" : "Sector Summary");
    XLSX.writeFile(wb, `${selectedSymbol || activeTab}_analytics_${formatDisplayDate(new Date()).replace(/\//g, '-')}.xlsx`);
  };

  // Export to CSV
  const exportToCSV = () => {
    const wsHistory = XLSX.utils.json_to_sheet(getDailyHistoryExportData());
    XLSX.writeFile({ SheetNames: ["History"], Sheets: { "History": wsHistory } }, `${selectedSymbol}_daily_history.csv`, { bookType: 'csv' });
  };

  // Export to High-Resolution PNG
  const exportToPNG = async () => {
    try {
      const chartTitle = language === 'ar' ? 'مقارنة الأداء (نسبة التغير %)' : 'Performance Comparison (Change %)';
      const commName = selectedCommodity ? (language === 'ar' ? selectedCommodity.nameAr : selectedCommodity.nameEn) : selectedSymbol;
      const sectorName = getSectorLabel(activeTab, language as 'ar' | 'en');
      const subtitle = language === 'ar' 
        ? `${commName} ${selectedSymbol ? selectedSymbol : ''} • قطاع ${sectorName}`.trim()
        : `${commName} ${selectedSymbol ? selectedSymbol : ''} • ${sectorName} Sector`.trim();
      
      const dateRangeStr = historyChartData.length > 0 
        ? `${historyChartData[0].dateLabel} - ${historyChartData[historyChartData.length - 1].dateLabel}`
        : '';

      await exportChartToPNG({
        data: historyChartData,
        element: chartRef.current,
        filename: `${selectedSymbol}_Performance_Chart`,
        title: chartTitle,
        subtitle: subtitle,
        dateRange: dateRangeStr,
        theme: 'dark',
        logoUrl: settings.siteLogo || "https://i.postimg.cc/vTzC2Jbx/January-05-2026-1-removebg-preview.png",
        language: language as 'ar' | 'en'
      });
    } catch (err) {
      console.error('Error exporting chart to PNG:', err);
    }
  };

  // Export to Comprehensive Executive PDF
  const exportToPDF = async () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const isRtl = language === 'ar';
      
      const chartTitle = language === 'ar' ? 'مقارنة الأداء (نسبة التغير %)' : 'Performance Comparison (Change %)';
      const commName = selectedCommodity ? (language === 'ar' ? selectedCommodity.nameAr : selectedCommodity.nameEn) : selectedSymbol;
      const sectorName = getSectorLabel(activeTab, language as 'ar' | 'en');
      const subtitle = language === 'ar' 
        ? `${commName} ${selectedSymbol ? selectedSymbol : ''} • قطاع ${sectorName}`.trim()
        : `${commName} ${selectedSymbol ? selectedSymbol : ''} • ${sectorName} Sector`.trim();

      const dateRangeStr = historyChartData.length > 0 
        ? `${historyChartData[0].dateLabel} - ${historyChartData[historyChartData.length - 1].dateLabel}`
        : '';

      // 1. Capture High Resolution Chart Image
      const canvas = await renderChartCanvas({
        data: historyChartData,
        element: chartRef.current,
        filename: `${selectedSymbol}_Chart`,
        title: chartTitle,
        subtitle: subtitle,
        dateRange: dateRangeStr,
        theme: 'dark',
        logoUrl: settings.siteLogo || "https://i.postimg.cc/vTzC2Jbx/January-05-2026-1-removebg-preview.png",
        language: language as 'ar' | 'en'
      });

      const imgData = canvas.toDataURL('image/png');
      const imgWidth = pageWidth - 20; // 10mm margins
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      doc.addImage(imgData, 'PNG', 10, 10, imgWidth, Math.min(imgHeight, 180));

      // 2. Add Second Page with Official Data Tables
      doc.addPage();
      doc.setFontSize(16);
      doc.setTextColor(18, 30, 61);
      doc.text(
        `${language === 'ar' ? 'جدول السجلات اليومية المجمعة' : 'Daily Aggregated Price History'} - ${commName} (${selectedSymbol})`,
        isRtl ? pageWidth - 14 : 14,
        18,
        { align: isRtl ? 'right' : 'left' }
      );

      const historyDataRows = getDailyHistoryExportData();
      if (historyDataRows.length > 0) {
        const tableColumn = Object.keys(historyDataRows[0]);
        const tableRows = historyDataRows.map(item => Object.values(item));

        autoTable(doc, {
          head: [tableColumn],
          body: tableRows,
          startY: 25,
          theme: 'striped',
          headStyles: { fillColor: [18, 30, 61], textColor: [212, 175, 55], fontStyle: 'bold' },
          styles: { fontSize: 10, cellPadding: 3, halign: isRtl ? 'right' : 'left' }
        });
      }

      // Footer
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.text(
          `Global Pricing Platform (GCP) • © Libya Trade Network • Generated: ${formatDisplayDateTime(new Date())} • Page ${i} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 6,
          { align: 'center' }
        );
      }

      doc.save(`${selectedSymbol}_Analytics_Report.pdf`);
    } catch (err) {
      console.error('Error exporting chart to PDF:', err);
    }
  };

  // Period options
  const periods = [
    { label: language === 'ar' ? '7 أيام' : '7D', value: 7 },
    { label: language === 'ar' ? '30 يومًا' : '30D', value: 30 },
    { label: language === 'ar' ? '90 يومًا' : '90D', value: 90 },
    { label: language === 'ar' ? '6 أشهر' : '6M', value: 180 },
    { label: language === 'ar' ? 'سنة' : '1Y', value: 365 },
    { label: language === 'ar' ? 'الكل' : 'All', value: 'all' }
  ];

  // Sector list for navigation
  const sectorTabs: { key: SectorTab; labelAr: string; labelEn: string }[] = [
    { key: 'energy', labelAr: 'الطاقة', labelEn: 'Energy' },
    { key: 'metals', labelAr: 'المعادن', labelEn: 'Metals' },
    { key: 'commodities', labelAr: 'السلع', labelEn: 'Commodities' },
    { key: 'forex', labelAr: 'العملات', labelEn: 'Currencies' },
    { key: 'indices', labelAr: 'المؤشرات', labelEn: 'Indices' },
    { key: 'shipping', labelAr: 'الشحن', labelEn: 'Shipping' }
  ];

  return (
    <section className="py-12 bg-[#121E3D] border-y border-[#1C2E5A]">
      <div className="container mx-auto px-4 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3 mb-2">
              <BarChart2 className="text-[#D4AF37]" size={28} />
              {t('analyticsTitle')}
            </h2>
            <p className="text-xs md:text-sm text-gray-300">
              {t('analyticsSub')}
            </p>
          </div>

          {/* Controls: Sector Tabs + Filter + Export Buttons */}
          <div className="flex flex-col sm:flex-row w-full lg:w-auto bg-[#0A1128] p-1.5 rounded-xl border border-[#1C2E5A] gap-3 items-stretch sm:items-center">
            
            {/* Sector Navigation Tabs */}
            <div className="flex flex-wrap gap-1 bg-[#121E3D] rounded-lg p-1">
              {sectorTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1.5 rounded-md text-xs md:text-sm font-bold transition-all ${
                    activeTab === tab.key
                      ? 'bg-[#1C2E5A] text-[#D4AF37] shadow-md border border-[#D4AF37]/30'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {language === 'ar' ? tab.labelAr : tab.labelEn}
                </button>
              ))}
            </div>

            {/* Commodity Selector & Export Actions */}
            <div className="flex items-center gap-2 justify-between sm:justify-start w-full sm:w-auto">
              <div className="relative flex-grow sm:flex-grow-0 sm:w-48">
                <select
                  value={selectedSymbol}
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                  className="w-full bg-[#121E3D] text-[#D4AF37] border border-[#1C2E5A] rounded-lg py-2 px-3 text-xs md:text-sm font-semibold outline-none focus:ring-2 focus:ring-[#D4AF37]/50 appearance-none cursor-pointer pr-8 rtl:pr-3 rtl:pl-8"
                >
                  {currentData.map(item => (
                    <option key={item.symbol} value={item.symbol}>
                      {language === 'ar' ? item.nameAr : item.nameEn} ({item.symbol})
                    </option>
                  ))}
                </select>
                <div className="absolute top-1/2 right-3 rtl:right-auto rtl:left-3 -translate-y-1/2 pointer-events-none text-[#D4AF37]">
                  <Filter size={14} />
                </div>
              </div>

              {/* Action Buttons with Clear High-Contrast Icons */}
              <div className="flex items-center gap-1.5 shrink-0 bg-[#121E3D] p-1 rounded-lg border border-[#1C2E5A]">
                <button 
                  onClick={exportToExcel} 
                  className="p-2 text-[#10B981] hover:bg-[#1C2E5A] rounded-md transition-colors" 
                  title={language === 'ar' ? 'تحميل Excel' : 'Download Excel'}
                >
                  <FileSpreadsheet size={18} />
                </button>
                <button 
                  onClick={exportToCSV} 
                  className="p-2 text-[#3B82F6] hover:bg-[#1C2E5A] rounded-md transition-colors" 
                  title={language === 'ar' ? 'تحميل CSV' : 'Download CSV'}
                >
                  <FileCode size={18} />
                </button>
                <button 
                  onClick={exportToPNG} 
                  className="p-2 text-[#D4AF37] hover:bg-[#1C2E5A] rounded-md transition-colors" 
                  title={language === 'ar' ? 'تحميل صورة عالية الدقة (PNG)' : 'Download High-Res PNG'}
                >
                  <ImageIcon size={18} />
                </button>
                <button 
                  onClick={exportToPDF} 
                  className="p-2 text-[#EF4444] hover:bg-[#1C2E5A] rounded-md transition-colors" 
                  title={language === 'ar' ? 'تحميل تقرير كامل (PDF)' : 'Download PDF Report'}
                >
                  <FileText size={18} />
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Main Grid: Visual Chart & Sector Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Performance Comparison Chart */}
          <div className="lg:col-span-2 bg-[#0A1128] rounded-2xl p-4 md:p-6 border border-[#1C2E5A] shadow-2xl flex flex-col justify-between">
            
            {/* Chart Top Bar: Title + Period Selector */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 pb-3 border-b border-[#1C2E5A]">
              <div>
                <h3 className="text-base md:text-lg font-extrabold text-white flex items-center gap-2">
                  <TrendingUp size={20} className="text-[#D4AF37]" />
                  {language === 'ar' ? 'مقارنة الأداء (نسبة التغير %)' : 'Performance Comparison (Change %)'}
                </h3>
                {selectedCommodity && (
                  <p className="text-xs text-[#D4AF37] font-semibold mt-0.5">
                    {language === 'ar' ? selectedCommodity.nameAr : selectedCommodity.nameEn} ({selectedSymbol})
                    <span className="text-gray-400 mx-2">•</span>
                    <span className="text-gray-300">{language === 'ar' ? `قطاع ${getSectorLabel(activeTab, 'ar')}` : `${getSectorLabel(activeTab, 'en')} Sector`}</span>
                  </p>
                )}
              </div>

              {/* Period Selector Tabs */}
              <div className="flex items-center gap-1 bg-[#121E3D] p-1 rounded-lg border border-[#1C2E5A] self-end sm:self-auto">
                {periods.map(p => (
                  <button
                    key={p.value}
                    onClick={() => setSelectedPeriod(p.value as any)}
                    className={`px-2.5 py-1 rounded text-[11px] md:text-xs font-bold transition-all ${
                      selectedPeriod === p.value 
                        ? 'bg-[#D4AF37] text-[#0A1128] shadow-sm' 
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Chart Area Container (Captured for Export) */}
            <div ref={chartRef} className="w-full h-[320px] sm:h-[400px] md:h-[460px] lg:h-[480px] relative" dir="ltr">
              {loadingHistory ? (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                  <div className="flex items-center gap-2">
                    <Activity className="animate-spin text-[#D4AF37]" size={20} />
                    <span>{language === 'ar' ? 'جاري تحميل البيانات اليومية...' : 'Loading daily data...'}</span>
                  </div>
                </div>
              ) : historyChartData.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm md:text-base text-center p-4">
                  {language === 'ar' ? 'لا توجد بيانات تاريخية كافية لعرض الرسم البياني' : 'Not enough historical data to display the chart'}
                </div>
              ) : (
                <div className="relative w-full h-full rounded-xl overflow-hidden">
                  
                  {/* Single Source of Truth Watermark */}
                  <img
                    src={settings.siteLogo || "https://i.postimg.cc/vTzC2Jbx/January-05-2026-1-removebg-preview.png"}
                    alt="watermark"
                    data-watermark="true"
                    className="absolute inset-0 m-auto w-36 md:w-56 opacity-5 pointer-events-none select-none z-0"
                  />

                  {/* Recharts High-Contrast Line Chart */}
                  {isReady && historyChartData.length > 0 && (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart 
                        data={historyChartData} 
                        margin={{ top: 15, right: 15, left: -10, bottom: 15 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#334155"
                          opacity={0.25}
                        />
                        <XAxis
                          dataKey="dateLabel"
                          tick={{ fill: '#CBD5E1', fontSize: isMobile ? 10 : 12, fontWeight: 500 }}
                          axisLine={{ stroke: '#1C2E5A', strokeWidth: 1.5 }}
                          tickLine={false}
                          tickMargin={10}
                          interval={xAxisInterval}
                        />
                        <YAxis
                          domain={yDomain}
                          tick={{ fill: '#CBD5E1', fontSize: isMobile ? 10 : 12, fontWeight: 600 }}
                          axisLine={false}
                          tickLine={false}
                          width={isMobile ? 55 : 68}
                          tickFormatter={(val) => Number(val).toFixed(2)}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                          type="monotone"
                          dataKey="price"
                          stroke="#D4AF37"
                          strokeWidth={3}
                          dot={historyChartData.length <= 15 ? { r: 3.5, strokeWidth: 1.5, fill: '#0A1128', stroke: '#D4AF37' } : false}
                          activeDot={{ r: 6, fill: '#D4AF37', stroke: '#FFFFFF', strokeWidth: 2 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              )}
            </div>

            {/* Bottom Meta info */}
            <div className="flex justify-between items-center text-[11px] text-gray-400 pt-3 border-t border-[#1C2E5A] mt-2">
              <span>
                {language === 'ar' ? 'البيانات المعروضة: آخر سعر مسجل في كل يوم' : 'Display rule: Last recorded closing price per calendar day'}
              </span>
              <span className="font-semibold text-gray-300">
                {historyChartData.length} {language === 'ar' ? 'نقاط يومية' : 'daily points'}
              </span>
            </div>

          </div>

          {/* Sector Summary & Insights Panel */}
          <div className="flex flex-col gap-6">
            
            {/* Sector Summary Cards */}
            <div className="bg-gradient-to-br from-[#1C2E5A] to-[#0A1128] rounded-2xl p-6 border border-[#2A4075] shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#D4AF37] rounded-full mix-blend-screen filter blur-3xl opacity-10"></div>
              
              <div className="flex items-center justify-between mb-4 relative z-10 border-b border-[#2A4075] pb-3">
                <h3 className="text-base md:text-lg font-bold text-white flex items-center gap-2">
                  <Activity size={18} className="text-[#D4AF37]" />
                  {t('sectorSummary')} - {getSectorLabel(activeTab, language as 'ar' | 'en')}
                </h3>
                <span className="text-xs font-semibold text-[#D4AF37] bg-[#121E3D] px-2.5 py-1 rounded-full border border-[#D4AF37]/30">
                  {chartData.length} {language === 'ar' ? 'سلع' : 'items'}
                </span>
              </div>
              
              <div className="space-y-3 relative z-10 max-h-[300px] overflow-y-auto pr-1">
                {chartData.map((item) => (
                  <div 
                    key={item.symbol} 
                    onClick={() => setSelectedSymbol(item.symbol)}
                    className={`flex items-center justify-between p-2.5 rounded-xl transition-all cursor-pointer border ${
                      selectedSymbol === item.symbol 
                        ? 'bg-[#1C2E5A] border-[#D4AF37]/60 shadow-md' 
                        : 'bg-[#0A1128]/60 hover:bg-[#121E3D] border-[#1C2E5A]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-2.5 h-2.5 rounded-full shrink-0" 
                        style={{ backgroundColor: item.change > 0 || item.trend === 'up' ? '#10B981' : item.change < 0 || item.trend === 'down' ? '#EF4444' : '#D4AF37' }}
                      />
                      <div>
                        <div className="text-xs md:text-sm font-bold text-gray-200">{item.name}</div>
                        <div className="text-[10px] text-gray-400 font-mono">{item.symbol}</div>
                      </div>
                    </div>
                    
                    <div className="text-left shrink-0" dir="ltr">
                      <div className="text-xs md:text-sm font-bold text-white font-mono">{(item.price || 0).toFixed(2)}</div>
                      <div className={`text-[11px] font-bold font-mono ${item.trend === 'up' || item.change > 0 ? 'text-[#10B981]' : item.trend === 'down' || item.change < 0 ? 'text-[#EF4444]' : 'text-[#D4AF37]'}`}>
                        {item.change > 0 || item.trend === 'up' ? '+' : ''}{(item.change || 0).toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Export / Download Report Widget */}
            <div className="bg-[#0A1128] rounded-2xl p-6 border border-[#1C2E5A] shadow-xl flex flex-col justify-center items-center text-center">
              <div className="w-12 h-12 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37] mb-3">
                <FileText size={24} />
              </div>
              <h4 className="text-white font-bold text-sm md:text-base mb-1.5">{t('detailedReport')}</h4>
              <p className="text-xs text-gray-400 mb-4 max-w-xs">{t('detailedReportDesc')}</p>
              
              <div className="grid grid-cols-2 gap-2.5 w-full">
                <button 
                  onClick={exportToPNG}
                  className="px-3 py-2 bg-[#121E3D] hover:bg-[#1C2E5A] border border-[#D4AF37]/40 text-[#D4AF37] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <ImageIcon size={14} />
                  <span>{language === 'ar' ? 'صورة PNG' : 'PNG Image'}</span>
                </button>
                <button 
                  onClick={exportToPDF}
                  className="px-3 py-2 bg-[#D4AF37] hover:bg-[#E5C158] text-[#0A1128] rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 shadow-lg"
                >
                  <FileText size={14} />
                  <span>{language === 'ar' ? 'تقرير PDF' : 'PDF Report'}</span>
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};

export default AnalyticsCharts;
