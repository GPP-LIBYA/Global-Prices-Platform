import { formatDisplayDate } from './formatDate';

export interface RawPriceRecord {
  symbol?: string;
  name_ar?: string;
  name_en?: string;
  name?: string;
  price: number | string;
  recorded_at?: string;
  created_at?: string;
  timestamp?: string;
  date_time?: string;
  sector?: string;
  sector_ar?: string;
  sector_en?: string;
  [key: string]: any;
}

export interface DailyAggregatedPoint {
  date: string;            // ISO or raw timestamp of the last recorded price in that day
  dateLabel: string;       // Formatted as DD/MM/YYYY
  dayKey: string;          // Formatted as YYYY-MM-DD for sorting and deduplication
  price: number;           // The exact last price recorded in that day
  dayChangePercent: number;// Percentage change from previous day's last price
  changeFromStart: number; // Percentage change from the first day in series
  symbol: string;
  name: string;
  sectorName?: string;
  rawTimestamp: number;
}

/**
 * Aggregates price records into daily points using ONLY the chronologically last price for each day.
 * 
 * Rules:
 * 1. For each calendar day (local timezone), group all records.
 * 2. Select the record with the maximum timestamp (recorded_at / created_at / timestamp).
 * 3. Sort the resulting daily points in ascending order (Oldest -> Newest).
 * 4. Guarantee that every date appears exactly once.
 * 5. Compute daily change % based strictly on consecutive daily closing prices.
 */
export function aggregateDailyLastPrices(
  records: RawPriceRecord[],
  language: 'ar' | 'en' = 'ar'
): DailyAggregatedPoint[] {
  if (!records || records.length === 0) return [];

  // Group by dayKey (YYYY-MM-DD)
  const dayMap = new Map<string, { latestTime: number; record: RawPriceRecord }>();

  for (const record of records) {
    const rawDateStr = record.recorded_at || record.created_at || record.timestamp || record.date_time;
    if (!rawDateStr) continue;

    const dateObj = new Date(rawDateStr);
    if (isNaN(dateObj.getTime())) continue;

    // Use local calendar day components so timezones don't shift late-night entries into another day
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const dayKey = `${year}-${month}-${day}`;
    const time = dateObj.getTime();

    const existing = dayMap.get(dayKey);
    if (!existing || time >= existing.latestTime) {
      dayMap.set(dayKey, { latestTime: time, record });
    }
  }

  // Sort ascending by dayKey (chronological order)
  const sortedDayKeys = Array.from(dayMap.keys()).sort();

  const result: DailyAggregatedPoint[] = [];

  for (let i = 0; i < sortedDayKeys.length; i++) {
    const dayKey = sortedDayKeys[i];
    const { latestTime, record } = dayMap.get(dayKey)!;
    const [year, month, day] = dayKey.split('-');
    const dateLabel = `${day}/${month}/${year}`;
    const price = Number(record.price || 0);

    let dayChangePercent = 0;
    if (i > 0) {
      const prevPrice = result[i - 1].price;
      if (prevPrice > 0) {
        dayChangePercent = ((price - prevPrice) / prevPrice) * 100;
      }
    }

    let changeFromStart = 0;
    if (result.length > 0) {
      const startPrice = result[0].price;
      if (startPrice > 0) {
        changeFromStart = ((price - startPrice) / startPrice) * 100;
      }
    }

    result.push({
      date: record.recorded_at || record.created_at || new Date(latestTime).toISOString(),
      dateLabel,
      dayKey,
      price: Number(price.toFixed(2)),
      dayChangePercent: Number(dayChangePercent.toFixed(2)),
      changeFromStart: Number(changeFromStart.toFixed(2)),
      symbol: record.symbol || '',
      name: language === 'ar' ? (record.name_ar || record.name || '') : (record.name_en || record.name || ''),
      sectorName: language === 'ar' ? (record.sector_ar || record.sectorAr || '') : (record.sector_en || record.sectorEn || ''),
      rawTimestamp: latestTime
    });
  }

  return result;
}

/**
 * Sector translation map ensuring no raw technical keys are shown in Arabic UI.
 */
export const SECTOR_NAMES: Record<string, { ar: string; en: string }> = {
  energy: { ar: 'الطاقة', en: 'Energy' },
  metals: { ar: 'المعادن', en: 'Metals' },
  commodities: { ar: 'السلع', en: 'Commodities' },
  forex: { ar: 'العملات', en: 'Currencies' },
  indices: { ar: 'المؤشرات', en: 'Indices' },
  shipping: { ar: 'الشحن', en: 'Shipping' }
};

export function getSectorLabel(sectorKey: string, lang: 'ar' | 'en' = 'ar'): string {
  const normalized = String(sectorKey || '').toLowerCase().trim();
  if (normalized === 'agriculture' || normalized === 'السلع الأساسية' || normalized === 'السلع الزراعية') {
    return lang === 'ar' ? 'السلع' : 'Commodities';
  }
  if (SECTOR_NAMES[normalized]) {
    return SECTOR_NAMES[normalized][lang];
  }
  // Check if it's already an Arabic or English sector name
  for (const key of Object.keys(SECTOR_NAMES)) {
    if (SECTOR_NAMES[key].ar === sectorKey || SECTOR_NAMES[key].en.toLowerCase() === normalized) {
      return SECTOR_NAMES[key][lang];
    }
  }
  return sectorKey;
}
