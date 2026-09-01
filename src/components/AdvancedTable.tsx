import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Sector, SectorEn } from '../types';
import { useMarketData } from '../context/MarketContext';
import { Search, Filter, Download, ArrowUpDown, ChevronDown, ChevronUp, FileText, FileSpreadsheet, FileCode, Wifi, WifiOff, Columns, X, TrendingUp, TrendingDown, Minus, Info, Activity, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { useLanguage } from '../context/LanguageContext';
import { PriceDisplay } from './PriceDisplay';
import { CommodityHistoryModal } from './CommodityHistoryModal';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { LineChart, Line, ResponsiveContainer, YAxis, Tooltip, AreaChart, Area, XAxis, CartesianGrid } from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { useChartContainer } from '../hooks/useChartContainer';

import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { formatDisplayDateTime } from '../utils/formatDate';
import { loadArabicPdfFont } from '../utils/pdfFonts';

const logUserActivity = async (action: string, details: string) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    await supabase.from('activity_logs').insert([{
      user_email: session?.user?.email || 'Guest',
      action,
      details,
      timestamp: new Date().toISOString()
    }]);
  } catch (e) {
    console.warn('Logging omitted', e);
  }
};

type SortConfig = {
  key: keyof ReturnType<typeof useMarketData>['data'][0] | null;
  direction: 'asc' | 'desc';
};

const Sparkline = ({ data, trend }: { data: any[], trend: 'up' | 'down' | 'neutral' }) => {
  const color = trend === 'up' ? '#10B981' : trend === 'down' ? '#EF4444' : '#6B7280';
  const { containerRef, isReady } = useChartContainer();
  
  return (
    <div ref={containerRef} className="h-8 w-24">
      {isReady && data && data.length > 0 && (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line 
              type="monotone" 
              dataKey="price" 
              stroke={color} 
              strokeWidth={1.5} 
              dot={false} 
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export const AdvancedTable = ({ limit }: { limit?: number }) => {
  const { data: commoditiesData, connected, pricesLoading: loading, error, lastUpdate, latency, isMockData } = useMarketData();
  const { t, language } = useLanguage();
  
  const formatPrice = (val: number | string | undefined | null) => {
    if (val === null || val === undefined || val === '') return '---';
    const num = Number(val);
    if (isNaN(num)) return '---';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [selectedCommodity, setSelectedCommodity] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const q = searchParams.get('search');
    if (q) {
      setSearchTerm(decodeURIComponent(q));
    }
    
    const sector = searchParams.get('sector');
    if (sector) {
      if (['الطاقة', 'Energy', 'energy'].includes(sector)) setSelectedSector('energy' as any);
      else if (['المعادن', 'Metals', 'metals'].includes(sector)) setSelectedSector('metals' as any);
      else if (['السلع الزراعية', 'السلع الأساسية', 'Agriculture', 'agriculture', 'commodities'].includes(sector)) setSelectedSector('commodities' as any);
      else if (['المؤشرات', 'Indices', 'indices'].includes(sector)) setSelectedSector('indices' as any);
      else if (['الشحن', 'Shipping', 'shipping'].includes(sector)) setSelectedSector('shipping' as any);
      else if (['العملات', 'Currencies', 'forex'].includes(sector)) setSelectedSector('forex' as any);
      else setSelectedSector('all');
    }

    if (q || sector) {
      // Auto-scroll to table if redirected
      const tableEl = document.getElementById('table');
      if (tableEl && location.hash === '#table') {
        setTimeout(() => tableEl.scrollIntoView({ behavior: 'smooth' }), 500);
      }
    }
  }, [location.search, location.hash]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  const [visibleColumns, setVisibleColumns] = useState({
    commodity: true,
    sector: true,
    price: true,
    prevClose: true,
    changePercent: true,
    trend: true,
    high: true,
    low: true,
    unit: true,
    status: true,
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowColumnDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sectors = ['all', 'energy', 'metals', 'commodities', 'indices', 'shipping', 'forex'];

    const getSectorLabel = (sectorKey: string, lang: string) => {
    if (sectorKey === 'all') return t('allSectors');
    if (sectorKey === 'energy') return lang === 'ar' ? 'الطاقة' : 'Energy';
    if (sectorKey === 'metals') return lang === 'ar' ? 'المعادن' : 'Metals';
    if (sectorKey === 'agriculture' || sectorKey === 'commodities') return lang === 'ar' ? 'السلع الأساسية' : 'Commodities';
    if (sectorKey === 'indices') return lang === 'ar' ? 'المؤشرات' : 'Indices';
    if (sectorKey === 'shipping') return lang === 'ar' ? 'الشحن' : 'Shipping';
    if (sectorKey === 'forex') return lang === 'ar' ? 'العملات' : 'Currencies';
    return sectorKey;
  };

  const handleSort = (key: keyof typeof commoditiesData[0]) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const toggleColumn = (col: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }));
  };

  const getExportData = () => {
    return filteredAndSortedData.map(item => {
      const row: any = {};
      if (visibleColumns.commodity) row[t('commodity')] = language === 'ar' ? item.nameAr : item.nameEn;
      if (visibleColumns.sector) row[t('sector')] = language === 'ar' ? item.sectorAr : item.sectorEn;
      if (visibleColumns.price) row[t('currentPrice')] = item.price;
      if (visibleColumns.prevClose) row[t('prevClose')] = item.prevClose;
      if (visibleColumns.changePercent) row[t('changePercent')] = `${item.changePercent}%`;
      if (visibleColumns.high) row[t('high')] = item.high;
      if (visibleColumns.low) row[t('low')] = item.low;
      if (visibleColumns.unit) row[t('unit')] = language === 'ar' ? item.unitAr : item.unitEn;
      if (visibleColumns.status) row[t('status')] = language === 'ar' ? item.statusAr : item.statusEn;
      return row;
    });
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(getExportData());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Prices");
    XLSX.writeFile(wb, "global_prices.xlsx");
    logUserActivity('تصدير بيانات', 'قام المستخدم بتصدير البيانات بصيغة Excel');
  };

  const exportToCSV = () => {
    const ws = XLSX.utils.json_to_sheet(getExportData());
    XLSX.writeFile({
      SheetNames: ["Prices"],
      Sheets: { "Prices": ws }
    }, "global_prices.csv", { bookType: 'csv' });
    logUserActivity('تصدير بيانات', 'قام المستخدم بتصدير البيانات بصيغة CSV');
  };

  const exportToPDF = async () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const { fontName } = await loadArabicPdfFont(doc);
    
    // Dynamically generate columns based on visibleColumns state
    const tableColumn = [];
    const dynamicColumnStyles: any = {};
    let currentColumnIndex = 0;

    if (visibleColumns.commodity) {
      tableColumn.push(t('commodity'));
      dynamicColumnStyles[currentColumnIndex] = { halign: language === 'ar' ? 'right' : 'left', fontStyle: 'bold' };
      currentColumnIndex++;
    }
    if (visibleColumns.sector) {
      tableColumn.push(t('sector'));
      dynamicColumnStyles[currentColumnIndex] = { halign: 'center' };
      currentColumnIndex++;
    }
    if (visibleColumns.price) {
      tableColumn.push(t('currentPrice'));
      dynamicColumnStyles[currentColumnIndex] = { halign: 'center', fontStyle: 'bold', textColor: [28, 46, 90] };
      currentColumnIndex++;
    }
    if (visibleColumns.prevClose) {
      tableColumn.push(t('prevClose'));
      dynamicColumnStyles[currentColumnIndex] = { halign: 'center' };
      currentColumnIndex++;
    }
    if (visibleColumns.changePercent) {
      tableColumn.push(t('changePercent'));
      dynamicColumnStyles[currentColumnIndex] = { halign: 'center', fontStyle: 'bold' };
      currentColumnIndex++;
    }
    if (visibleColumns.high) {
      tableColumn.push(t('high'));
      dynamicColumnStyles[currentColumnIndex] = { halign: 'center' };
      currentColumnIndex++;
    }
    if (visibleColumns.low) {
      tableColumn.push(t('low'));
      dynamicColumnStyles[currentColumnIndex] = { halign: 'center' };
      currentColumnIndex++;
    }
    if (visibleColumns.unit) {
      tableColumn.push(t('unit'));
      dynamicColumnStyles[currentColumnIndex] = { halign: 'center' };
      currentColumnIndex++;
    }
    if (visibleColumns.status) {
      tableColumn.push(t('status'));
      dynamicColumnStyles[currentColumnIndex] = { halign: 'center' };
      currentColumnIndex++;
    }
    
    // Helper to format numbers cleanly and consistently (1,234.56)
    const formatNumber = (val: number | string | undefined | null) => {
      if (val === null || val === undefined || val === '') return '---';
      const num = Number(val);
      if (isNaN(num)) return '---';
      return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const tableRows = filteredAndSortedData.map(item => {
      const row = [];
      if (visibleColumns.commodity) row.push(language === 'ar' ? item.nameAr : item.nameEn);
      if (visibleColumns.sector) row.push(language === 'ar' ? item.sectorAr : item.sectorEn);
      if (visibleColumns.price) row.push(formatNumber(item.price));
      if (visibleColumns.prevClose) row.push(formatNumber(item.prevClose));
      if (visibleColumns.changePercent) {
         const isUp = item.trend === 'up';
         row.push((isUp ? '+' : '') + formatNumber(item.changePercent) + '%');
      }
      if (visibleColumns.high) row.push(formatNumber(item.high));
      if (visibleColumns.low) row.push(formatNumber(item.low));
      if (visibleColumns.unit) {
         let rawUnit = language === 'ar' ? item.unitAr : item.unitEn;
         if (item.currency) {
            const currStr = language === 'ar' ? (item.currency === 'LYD' ? 'دينار' : item.currency === 'EUR' ? 'يورو' : item.currency === 'USD' ? 'دولار' : item.currency) : item.currency;
            rawUnit = currStr + ' / ' + rawUnit;
         }
         row.push(rawUnit);
      }
      if (visibleColumns.status) row.push(language === 'ar' ? item.statusAr : item.statusEn);
      return row;
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      styles: {
        font: fontName,
        fontStyle: 'normal',
        halign: 'center', // Center nicely under headers
        valign: 'middle',
        textColor: [50, 50, 50],
        fontSize: 9,
        lineWidth: 0.1, // Soft borders for the grid
        lineColor: [200, 200, 200], // Light grey color for lines
      },
      headStyles: {
        halign: 'center',
        valign: 'middle',
        font: fontName,
        fillColor: [28, 46, 90], // Match #1C2E5A
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold',
        lineWidth: 0.1,
        lineColor: [20, 35, 70],
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252], // Extremely light subtle blue/gray
      },
      columnStyles: dynamicColumnStyles,
      margin: { top: 25 },
      didDrawPage: function (data) {
        // Header title
        doc.setFontSize(16);
        doc.setFont(fontName, 'bold');
        doc.setTextColor(28, 46, 90);
        doc.text(language === 'ar' ? 'تقرير أسعار السلع المباشر' : 'Live Commodity Prices Report', data.settings.margin.left, 15);
        
        // Date stamp
        doc.setFontSize(9);
        doc.setFont(fontName, 'normal');
        doc.setTextColor(100, 100, 100);
        const dateStr = formatDisplayDateTime(new Date());
        // If it's AR, draw it on the right side
        if (language === 'ar') {
           doc.text(`تاريخ التقرير: ${dateStr}`, doc.internal.pageSize.width - data.settings.margin.right, 15, { align: 'right' });
        } else {
           doc.text(`Report Date: ${dateStr}`, doc.internal.pageSize.width - data.settings.margin.right, 15, { align: 'right' });
        }
      }
    });
    
    doc.save("global_prices.pdf");
    logUserActivity('تصدير بيانات', 'قام المستخدم بتصدير البيانات بصيغة PDF');
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = limit || 50;

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, selectedSector, sortConfig]);

  const filteredAndSortedData = useMemo(() => {
    let filterableData = commoditiesData;

    // Filter by sector
    if (selectedSector !== 'all') {
      filterableData = filterableData.filter(item => {
        const itemSector = item.sector || (item as any).sectorAr || (item as any).sectorEn;
        if (item.sector === selectedSector) return true;
        // Fallback checks just in case
        if (selectedSector === 'energy' && (itemSector === 'الطاقة' || itemSector === 'Energy')) return true;
        if (selectedSector === 'metals' && (itemSector === 'المعادن' || itemSector === 'Metals')) return true;
        if ((selectedSector === 'agriculture' || selectedSector === 'commodities') && (itemSector === 'السلع الزراعية' || itemSector === 'السلع الأساسية' || itemSector === 'Agriculture' || itemSector === 'commodities')) return true;
        if (selectedSector === 'indices' && (itemSector === 'المؤشرات' || itemSector === 'Indices')) return true;
        if (selectedSector === 'shipping' && (itemSector === 'الشحن' || itemSector === 'Shipping')) return true;
        if (selectedSector === 'forex' && (itemSector === 'العملات' || itemSector === 'Currencies')) return true;
        return false;
      });
    }

    // Filter by search
    if (debouncedSearchTerm) {
      const lowerSearch = debouncedSearchTerm.toLowerCase();
      filterableData = filterableData.filter(item => 
        item.nameAr.toLowerCase().includes(lowerSearch) || 
        item.nameEn.toLowerCase().includes(lowerSearch) || 
        item.symbol.toLowerCase().includes(lowerSearch)
      );
    }

    // Sort
    if (sortConfig.key) {
      filterableData.sort((a, b) => {
        let aValue = a[sortConfig.key!];
        let bValue = b[sortConfig.key!];
        
        // Handle language specific sorting
        if (sortConfig.key === 'nameAr' || sortConfig.key === 'nameEn') {
            aValue = language === 'ar' ? a.nameAr : a.nameEn;
            bValue = language === 'ar' ? b.nameAr : b.nameEn;
        } else if (sortConfig.key === 'sectorAr' || sortConfig.key === 'sectorEn') {
            aValue = language === 'ar' ? a.sectorAr : a.sectorEn;
            bValue = language === 'ar' ? b.sectorAr : b.sectorEn;
        } else if (sortConfig.key === 'statusAr' || sortConfig.key === 'statusEn') {
            aValue = language === 'ar' ? a.statusAr : a.statusEn;
            bValue = language === 'ar' ? b.statusAr : b.statusEn;
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filterableData;
  }, [debouncedSearchTerm, selectedSector, sortConfig, commoditiesData, language]);

  const paginatedData = useMemo(() => {
    if (limit && location.pathname !== '/markets') {
      return filteredAndSortedData.slice(0, limit);
    }
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedData, currentPage, itemsPerPage, limit, location.pathname]);

  const totalPages = limit && location.pathname !== '/markets' ? 1 : Math.ceil(filteredAndSortedData.length / itemsPerPage);


  const renderSortIcon = (key: keyof typeof commoditiesData[0]) => {
    // Map language specific keys back to base for icon rendering
    let activeKey = sortConfig.key;
    if (activeKey === 'nameAr' || activeKey === 'nameEn') activeKey = language === 'ar' ? 'nameAr' : 'nameEn';
    if (activeKey === 'sectorAr' || activeKey === 'sectorEn') activeKey = language === 'ar' ? 'sectorAr' : 'sectorEn';
    if (activeKey === 'statusAr' || activeKey === 'statusEn') activeKey = language === 'ar' ? 'statusAr' : 'statusEn';

    const checkKey = (key === 'nameAr' || key === 'nameEn') ? (language === 'ar' ? 'nameAr' : 'nameEn') :
                     (key === 'sectorAr' || key === 'sectorEn') ? (language === 'ar' ? 'sectorAr' : 'sectorEn') :
                     (key === 'statusAr' || key === 'statusEn') ? (language === 'ar' ? 'statusAr' : 'statusEn') : key;

    if (activeKey !== checkKey) return <ArrowUpDown size={14} className="text-gray-500" />;
    return sortConfig.direction === 'asc' ? <ChevronUp size={14} className="text-[#D4AF37]" /> : <ChevronDown size={14} className="text-[#D4AF37]" />;
  };

  return (
    <section id="table" className="py-16 bg-[#0A1128]">
      <div className="container mx-auto px-4">
        <div className="bg-[#121E3D] rounded-2xl border border-[#1C2E5A] shadow-2xl overflow-hidden">
          
          {/* Table Header Controls */}
          <div className="p-6 border-b border-[#1C2E5A] flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                {t('tableTitle')}
                {isMockData && (
                  <span className="bg-yellow-500/10 text-yellow-500 text-xs px-2 py-1 rounded border border-yellow-500/20 font-normal">
                    {language === 'ar' ? 'بيانات تجريبية' : 'Mock Data'}
                  </span>
                )}
              </h2>
              <p className="text-sm text-gray-400">{t('tableSub')}</p>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap lg:flex-nowrap items-stretch sm:items-center gap-3 w-full lg:w-auto">
              {/* Search */}
              <div className="relative w-full sm:w-auto flex-grow lg:flex-grow-0 min-w-0">
                <Search size={18} className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} />
                <input 
                  type="text" 
                  placeholder={t('searchTable')} 
                  className={`w-full lg:w-64 bg-[#0A1128] border border-[#1C2E5A] rounded-lg py-2.5 sm:py-2 ${language === 'ar' ? 'pr-10 pl-4' : 'pl-10 pr-4'} text-white focus:outline-none focus:border-[#D4AF37] transition-colors text-base sm:text-sm`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Sector Filter */}
              <div className="relative w-full sm:w-auto min-w-[140px]">
                <Filter size={18} className={`absolute ${language === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} />
                <select 
                  className={`w-full appearance-none bg-[#0A1128] border border-[#1C2E5A] rounded-lg py-2.5 sm:py-2 ${language === 'ar' ? 'pr-10 pl-8' : 'pl-10 pr-8'} text-white focus:outline-none focus:border-[#D4AF37] transition-colors cursor-pointer text-base sm:text-sm`}
                  value={selectedSector}
                  onChange={(e) => setSelectedSector(e.target.value as any)}
                >
                  {sectors.map((sector, idx) => (
                    <option key={idx} value={sector}>{getSectorLabel(sector, language)}</option>
                  ))}
                </select>
                <ChevronDown size={14} className={`absolute ${language === 'ar' ? 'left-3' : 'right-3'} top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none`} />
              </div>

              {/* Export Buttons */}
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap sm:flex-nowrap justify-start sm:justify-end">
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setShowColumnDropdown(!showColumnDropdown)}
                    className="flex items-center gap-1.5 bg-[#1C2E5A] hover:bg-[#2A4075] text-white px-2.5 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors border border-[#2A4075]"
                    title={t('columns') || 'Columns'}
                  >
                    <Columns size={15} className="text-[#D4AF37]" />
                    <span className="hidden sm:inline">{t('columns') || 'Columns'}</span>
                  </button>
                  {showColumnDropdown && (
                    <div className={`absolute top-full mt-2 ${language === 'ar' ? 'left-0' : 'right-0'} bg-[#121E3D] border border-[#1C2E5A] rounded-lg shadow-xl p-3 z-50 min-w-[200px]`}>
                      <h4 className="text-white text-sm font-bold mb-2 border-b border-[#1C2E5A] pb-2">{t('columns') || 'Columns'}</h4>
                      <div className="space-y-2">
                        {Object.entries(visibleColumns).map(([key, isVisible]) => (
                          <label key={key} className="flex items-center gap-2 cursor-pointer text-gray-300 hover:text-white transition-colors">
                            <input 
                              type="checkbox" 
                              checked={isVisible} 
                              onChange={() => toggleColumn(key as keyof typeof visibleColumns)}
                              className="rounded border-[#1C2E5A] bg-[#0A1128] text-[#D4AF37] focus:ring-[#D4AF37]"
                            />
                            <span className="text-sm">{t(key as any) || key}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button onClick={exportToExcel} className="flex items-center gap-1.5 bg-[#1C2E5A] hover:bg-[#2A4075] text-white px-2.5 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors border border-[#2A4075]" title={t('downloadExcel')}>
                  <FileSpreadsheet size={15} className="text-[#10B981]" />
                  <span className="inline text-xs sm:text-sm">Excel</span>
                </button>
                <button onClick={exportToCSV} className="flex items-center gap-1.5 bg-[#1C2E5A] hover:bg-[#2A4075] text-white px-2.5 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors border border-[#2A4075]" title={t('downloadCsv')}>
                  <FileCode size={15} className="text-[#3B82F6]" />
                  <span className="inline text-xs sm:text-sm">CSV</span>
                </button>
                <button onClick={exportToPDF} className="flex items-center gap-1.5 bg-[#1C2E5A] hover:bg-[#2A4075] text-white px-2.5 sm:px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors border border-[#2A4075]" title={t('downloadPdf')}>
                  <FileText size={15} className="text-[#EF4444]" />
                  <span className="inline text-xs sm:text-sm">PDF</span>
                </button>
              </div>
            </div>
          </div>

          {/* Table - Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className={`w-full ${language === 'ar' ? 'text-right' : 'text-left'} border-collapse`}>
              <thead>
                <tr className="bg-[#0A1128] border-b border-[#1C2E5A]">
                  {visibleColumns.commodity && (
                    <th className={`p-4 font-semibold text-gray-300 cursor-pointer hover:bg-[#1C2E5A]/50 transition-colors border-x border-[#1C2E5A]/30 ${language === 'ar' ? 'text-right' : 'text-left'}`} onClick={() => handleSort(language === 'ar' ? 'nameAr' : 'nameEn')}>
                      <div className="flex items-center gap-2">{t('commodity')} {renderSortIcon(language === 'ar' ? 'nameAr' : 'nameEn')}</div>
                    </th>
                  )}
                  {visibleColumns.sector && (
                    <th className={`p-4 font-semibold text-gray-300 cursor-pointer hover:bg-[#1C2E5A]/50 transition-colors border-x border-[#1C2E5A]/30 ${language === 'ar' ? 'text-right' : 'text-left'}`} onClick={() => handleSort(language === 'ar' ? 'sectorAr' : 'sectorEn')}>
                      <div className="flex items-center gap-2">{t('sector')} {renderSortIcon(language === 'ar' ? 'sectorAr' : 'sectorEn')}</div>
                    </th>
                  )}
                  {visibleColumns.price && (
                    <th className={`p-4 font-semibold text-gray-300 cursor-pointer hover:bg-[#1C2E5A]/50 transition-colors border-x border-[#1C2E5A]/30 ${language === 'ar' ? 'text-right' : 'text-left'}`} onClick={() => handleSort('price')}>
                      <div className={`flex items-center gap-2 ${language === 'ar' ? 'justify-start' : 'justify-start'}`}>{t('currentPrice')} {renderSortIcon('price')}</div>
                    </th>
                  )}
                  {visibleColumns.changePercent && (
                    <th className={`p-4 font-semibold text-gray-300 cursor-pointer hover:bg-[#1C2E5A]/50 transition-colors border-x border-[#1C2E5A]/30 ${language === 'ar' ? 'text-right' : 'text-left'}`} onClick={() => handleSort('changePercent')}>
                      <div className={`flex items-center gap-2 ${language === 'ar' ? 'justify-start' : 'justify-start'}`}>{t('changePercent')} {renderSortIcon('changePercent')}</div>
                    </th>
                  )}
                  {visibleColumns.trend && (
                    <th className="p-4 font-semibold text-gray-300 border-x border-[#1C2E5A]/30">{t('trend') || 'Trend'}</th>
                  )}
                  {visibleColumns.high && (
                    <th className={`p-4 font-semibold text-gray-300 hidden md:table-cell cursor-pointer hover:bg-[#1C2E5A]/50 transition-colors border-x border-[#1C2E5A]/30 ${language === 'ar' ? 'text-right' : 'text-left'}`} onClick={() => handleSort('high')}>
                      <div className={`flex items-center gap-2 ${language === 'ar' ? 'justify-start' : 'justify-start'}`}>{t('high')} {renderSortIcon('high')}</div>
                    </th>
                  )}
                  {visibleColumns.low && (
                    <th className={`p-4 font-semibold text-gray-300 hidden md:table-cell cursor-pointer hover:bg-[#1C2E5A]/50 transition-colors border-x border-[#1C2E5A]/30 ${language === 'ar' ? 'text-right' : 'text-left'}`} onClick={() => handleSort('low')}>
                      <div className={`flex items-center gap-2 ${language === 'ar' ? 'justify-start' : 'justify-start'}`}>{t('low')} {renderSortIcon('low')}</div>
                    </th>
                  )}
                  {visibleColumns.unit && (
                    <th className="p-4 font-semibold text-gray-300 hidden lg:table-cell border-x border-[#1C2E5A]/30">{t('unit')}</th>
                  )}
                  {visibleColumns.status && (
                    <th className="p-4 font-semibold text-gray-300 cursor-pointer hover:bg-[#1C2E5A]/50 transition-colors" onClick={() => handleSort(language === 'ar' ? 'statusAr' : 'statusEn')}>
                      <div className="flex items-center gap-2">{t('status')} {renderSortIcon(language === 'ar' ? 'statusAr' : 'statusEn')}</div>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {loading && commoditiesData.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-[#D4AF37]">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="w-8 h-8 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin"></div>
                        <p>{language === 'ar' ? 'جاري تحميل البيانات...' : 'Loading data...'}</p>
                      </div>
                    </td>
                  </tr>
                )}
                {error && !loading && commoditiesData.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-red-500">
                      <div className="flex flex-col items-center justify-center gap-3 bg-red-500/10 p-6 rounded-xl border border-red-500/20">
                        <AlertCircle size={32} />
                        <p>{language === 'ar' ? 'تعذر تحميل هذا الجزء مؤقتًا' : 'Temporarily unable to load this section'}</p>
                      </div>
                    </td>
                  </tr>
                )}
                {(!loading || commoditiesData.length > 0) && !error && paginatedData.length === 0 && (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <Info size={32} className="text-gray-500" />
                        <p>{language === 'ar' ? 'لا توجد أسعار متاحة حاليًا' : 'No prices available currently'}</p>
                      </div>
                    </td>
                  </tr>
                )}
                {(!loading || commoditiesData.length > 0) && !error && paginatedData.map((item, index) => {
                  const changePct = Number(item.changePercent) || 0;
                  const isUp = changePct > 0;
                  const isDown = changePct < 0;
                  const isNeutral = changePct === 0;
                  const colorClass = isUp ? 'text-[#10B981]' : isDown ? 'text-[#EF4444]' : 'text-gray-500';
                  
                  const TrendIcon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
                  const name = language === 'ar' ? item.nameAr : item.nameEn;
                  const sector = language === 'ar' ? item.sectorAr : item.sectorEn;
                  
                  let rawUnit = language === 'ar' ? item.unitAr : item.unitEn;
                  if (item.currency) {
                     const currStr = language === 'ar' ? (item.currency === 'LYD' ? 'دينار' : item.currency === 'EUR' ? 'يورو' : item.currency === 'USD' ? 'دولار' : item.currency) : item.currency;
                     rawUnit = currStr + ' / ' + rawUnit;
                  }
                  
                  const status = language === 'ar' ? item.statusAr : item.statusEn;

                  return (
                    <tr 
                      key={item.id} 
                      className={`border-b border-[#1C2E5A]/50 hover:bg-[#1C2E5A]/30 transition-colors cursor-pointer ${index % 2 === 0 ? 'bg-[#121E3D]' : 'bg-[#0A1128]/30'}`}
                      onClick={() => setSelectedCommodity(item)}
                    >
                      {visibleColumns.commodity && (
                        <td className={`p-4 border-x border-[#1C2E5A]/30 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                          <div className="font-bold text-white group-hover:text-[#D4AF37] transition-colors">{name}</div>
                          <div className="text-xs text-gray-500">{item.symbol}</div>
                        </td>
                      )}
                      {visibleColumns.sector && (
                        <td className={`p-4 border-x border-[#1C2E5A]/30 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                          <span className="px-2 py-1 rounded bg-[#1C2E5A] text-xs text-gray-300 border border-[#2A4075]">
                            {sector}
                          </span>
                        </td>
                      )}
                      {visibleColumns.price && (
                        <td className={`p-4 ${language === 'ar' ? 'text-right' : 'text-left'} border-x border-[#1C2E5A]/30`} dir="ltr">
                          <div className={`flex items-center gap-1 ${language === 'ar' ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-xs text-gray-500 font-sans font-normal">
                              {item.currency === 'LYD' ? 'د.ل' : item.currency === 'EUR' ? '€' : item.currency === 'USD' ? '$' : (item.currency || '$')}
                            </span>
                            <PriceDisplay price={item.price} className="font-mono font-bold text-white" />
                          </div>
                        </td>
                      )}
                      {visibleColumns.changePercent && (
                        <td className={`p-4 ${language === 'ar' ? 'text-right' : 'text-left'} font-mono font-bold ${colorClass} border-x border-[#1C2E5A]/30`} dir="ltr">
                          <div className={`flex items-center ${language === 'ar' ? 'justify-end' : 'justify-start'} gap-1`}>
                            <TrendIcon size={14} className={colorClass} strokeWidth={3} />
                            <span>{isUp ? '+' : ''}{changePct.toFixed(2)}%</span>
                          </div>
                          <div className={`text-[10px] opacity-70 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
                            {isUp ? '+' : ''}{(item.changeAmount || 0).toFixed(2)}
                          </div>
                        </td>
                      )}
                      {visibleColumns.trend && (
                        <td className="p-4 border-x border-[#1C2E5A]/30">
                          <Sparkline data={item.history} trend={item.trend} />
                        </td>
                      )}
                      {visibleColumns.high && (
                        <td className={`p-4 ${language === 'ar' ? 'text-right' : 'text-left'} font-mono text-gray-400 hidden md:table-cell border-x border-[#1C2E5A]/30`} dir="ltr">
                           <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                            {formatPrice(item.high)}
                          </div>
                        </td>
                      )}
                      {visibleColumns.low && (
                        <td className={`p-4 ${language === 'ar' ? 'text-right' : 'text-left'} font-mono text-gray-400 hidden md:table-cell border-x border-[#1C2E5A]/30`} dir="ltr">
                           <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                            {formatPrice(item.low)}
                          </div>
                        </td>
                      )}
                      {visibleColumns.unit && (
                        <td className="p-4 text-sm text-gray-400 hidden lg:table-cell border-x border-[#1C2E5A]/30">
                          {rawUnit}
                        </td>
                      )}
                      {visibleColumns.status && (
                        <td className="p-4">
                          <div className="flex flex-col gap-1 items-center md:items-start">
                            <span className={`inline-flex items-center justify-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium w-fit ${item.statusEn === 'Open' ? 'bg-[#10B981]/10 text-[#10B981] border border-[#10B981]/20' : 'bg-[#EF4444]/10 text-[#EF4444] border border-[#EF4444]/20'}`}>
                              <span className={`w-1 h-1 rounded-full ${item.statusEn === 'Open' ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`}></span>
                              {status}
                            </span>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!loading && !error && filteredAndSortedData.length === 0 && (
              <div className="p-16 text-center text-gray-500 flex flex-col items-center gap-4">
                <FileCode size={48} className="text-gray-600 opacity-50" />
                <p className="text-lg">{t('noResults')}</p>
                <p className="text-sm opacity-75">{language === 'ar' ? 'تأكد من إعداد مصدر البيانات أو جرب مصطلح بحث مختلف.' : 'Ensure data source is configured or try a different search term.'}</p>
              </div>
            )}
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden max-h-[600px] overflow-y-auto p-4 space-y-4">
            {loading && commoditiesData.length === 0 && (
              <div className="p-8 text-center text-[#D4AF37] flex flex-col items-center gap-2">
                 <div className="w-8 h-8 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin"></div>
                 <p>{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
              </div>
            )}
            {error && !loading && commoditiesData.length === 0 && (
               <div className="p-6 text-center text-red-500 bg-red-500/10 rounded-xl border border-red-500/20">
                  <AlertCircle size={32} className="mx-auto mb-2" />
                  <p>{language === 'ar' ? 'خطأ: ' : 'Error: '}{error}</p>
               </div>
            )}
            {(!loading || commoditiesData.length > 0) && !error && filteredAndSortedData.map((item) => {
              const changePct = Number(item.changePercent) || 0;
              const isUp = changePct > 0;
              const isDown = changePct < 0;
              const isNeutral = changePct === 0;
              const colorClass = isUp ? 'text-[#10B981]' : isDown ? 'text-[#EF4444]' : 'text-gray-500';
              const TrendIcon = isUp ? TrendingUp : isDown ? TrendingDown : Minus;
              
              const name = language === 'ar' ? item.nameAr : item.nameEn;
              const sector = language === 'ar' ? item.sectorAr : item.sectorEn;

              return (
                <div 
                  key={item.id} 
                  className="bg-[#0A1128] rounded-xl border border-[#1C2E5A] p-4 space-y-4 cursor-pointer hover:border-[#D4AF37]/50 transition-colors"
                  onClick={() => setSelectedCommodity(item)}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-white text-base sm:text-lg truncate max-w-[150px] xs:max-w-[200px] sm:max-w-xs">{name}</div>
                      <div className="text-xs sm:text-sm text-gray-500 font-mono">{item.symbol}</div>
                    </div>
                    <div className="text-right shrink-0" dir="ltr">
                      <div className="flex items-center gap-1 justify-end">
                        <span className="text-xs text-gray-500">
                          {item.currency === 'LYD' ? 'د.ل' : item.currency === 'EUR' ? '€' : item.currency === 'USD' ? '$' : item.currency}
                        </span>
                        <PriceDisplay price={item.price} className="text-lg sm:text-xl font-bold text-white" />
                      </div>
                      <div className={`text-xs sm:text-sm font-bold flex items-center justify-end gap-1 ${colorClass}`}>
                        <TrendIcon size={14} strokeWidth={3} />
                        <span>{isUp ? '+' : ''}{changePct.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#1C2E5A]/50">
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider">{t('sector')}</div>
                      <div className="text-xs text-gray-300">{sector}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider">{t('status')}</div>
                      <div className={`inline-flex items-center gap-1.5 text-[10px] font-bold ${item.statusEn === 'Open' ? 'text-[#10B981]' : 'text-[#EF4444]'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${item.statusEn === 'Open' ? 'bg-[#10B981]' : 'bg-[#EF4444]'}`}></span>
                        {language === 'ar' ? item.statusAr : item.statusEn}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-gray-500 uppercase tracking-wider">{t('high')} / {t('low')}</div>
                      <div className="text-xs text-gray-400 font-mono" dir="ltr">{formatPrice(item.high)} / {formatPrice(item.low)}</div>
                    </div>
                    <div className="flex justify-end items-end">
                      <Sparkline data={item.history} trend={item.trend} />
                    </div>
                  </div>
                </div>
              );
            })}
            {!loading && !error && filteredAndSortedData.length === 0 && (
              <div className="p-16 text-center text-gray-500 flex flex-col items-center gap-4">
                <FileCode size={48} className="text-gray-600 opacity-50" />
                <p className="text-lg">{t('noResults')}</p>
              </div>
            )}
          </div>
          
          {/* Details Modal */}
          {selectedCommodity && (
            <CommodityHistoryModal 
              commodity={selectedCommodity} 
              onClose={() => setSelectedCommodity(null)} 
            />
          )}

          {/* Table Footer */}
          <div className="p-4 border-t border-[#1C2E5A] bg-[#0A1128] flex flex-col justify-between items-center gap-4 text-sm text-gray-400">
            {totalPages > 1 && (
              <div className="flex items-center gap-2 mb-2 w-full justify-center">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-[#121E3D] text-white rounded border border-[#1C2E5A] disabled:opacity-50"
                >
                  {language === 'ar' ? 'السابق' : 'Prev'}
                </button>
                <span className="text-white px-3 py-1 bg-[#1C2E5A] rounded border border-[#2A4075]">
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-[#121E3D] text-white rounded border border-[#1C2E5A] disabled:opacity-50"
                >
                  {language === 'ar' ? 'التالي' : 'Next'}
                </button>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row justify-between w-full items-center gap-4">
              <div>{t('totalResults')} <span className="text-white font-bold">{filteredAndSortedData.length}</span></div>
              
              <div className="flex flex-wrap items-center justify-center gap-6">
              {lastUpdate && !isNaN(lastUpdate.getTime()) && (
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider text-gray-500">{language === 'ar' ? 'آخر تحديث:' : 'Last Update:'}</span>
                  <span className="text-white font-mono">{format(lastUpdate, 'HH:mm:ss')}</span>
                </div>
              )}

              {latency !== null && connected && (
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase tracking-wider text-gray-500">{language === 'ar' ? 'التأخير:' : 'Latency:'}</span>
                  <span className={`${latency < 200 ? 'text-[#10B981]' : latency < 500 ? 'text-yellow-500' : 'text-[#EF4444]'} font-mono`}>
                    {latency}ms
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                {connected ? (
                  <>
                    <Wifi size={16} className="text-[#10B981]" />
                    <span className="text-[#10B981] font-medium">{t('connected')}</span>
                  </>
                ) : (
                  <>
                    <WifiOff size={16} className="text-[#EF4444]" />
                    <span className="text-[#EF4444] font-medium">{t('connecting')}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);
};
