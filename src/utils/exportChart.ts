import { formatDisplayDate, formatDisplayDateTime } from './formatDate';

export interface ExportChartDataPoint {
  dateLabel: string;
  price: number;
  dayChangePercent?: number;
  changeFromStart?: number;
  rawTimestamp?: number;
  [key: string]: any;
}

export interface ExportOptions {
  element?: HTMLElement | null;
  data?: ExportChartDataPoint[];
  filename: string;
  title: string;
  subtitle?: string;
  dateRange?: string;
  theme?: 'light' | 'dark';
  logoUrl?: string;
  language?: 'ar' | 'en';
}

/**
 * Helper to safely load images for Canvas rendering with CORS.
 */
const loadImage = (url: string): Promise<HTMLImageElement | null> => {
  return new Promise((resolve) => {
    if (!url) return resolve(null);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
};

/**
 * High-precision, mathematical direct-canvas chart generator.
 * Creates an institutional-grade 1920x1200 logical layout with 2x/3x DPI scaling,
 * ensuring zero clipping, perfect RTL/LTR text, full plot width utilization,
 * and exact date range ordering.
 */
export const renderChartCanvas = async ({
  data = [],
  title,
  subtitle,
  dateRange,
  theme = 'dark',
  logoUrl = 'https://i.postimg.cc/vTzC2Jbx/January-05-2026-1-removebg-preview.png',
  language = 'ar'
}: ExportOptions): Promise<HTMLCanvasElement> => {
  // Ensure custom web fonts (Tajawal, etc.) are fully settled
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      await document.fonts.ready;
    } catch (e) {
      // ignore font loading fallback
    }
  }

  // 1. Setup Canvas Dimensions
  const logicalWidth = 1920;
  const logicalHeight = 1200;
  const scale = 2; // 2x gives 3840x2400 (Ultra-HD / 4K resolution)

  const canvas = document.createElement('canvas');
  canvas.width = logicalWidth * scale;
  canvas.height = logicalHeight * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get 2D canvas context');
  }

  // Scale context for high-DPI rendering
  ctx.scale(scale, scale);

  const isDark = theme === 'dark';
  const bgColor = isDark ? '#0A1128' : '#FFFFFF';
  const textColor = isDark ? '#FFFFFF' : '#050A18';
  const subTextColor = isDark ? '#94A3B8' : '#4B5563';
  const borderColor = isDark ? '#1C2E5A' : '#E2E8F0';
  const gridColor = isDark ? '#1E293B' : '#E2E8F0';
  const isRtl = language === 'ar';

  const now = new Date();
  const dateTimeStr = formatDisplayDateTime(now);

  // 2. Draw Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, logicalWidth, logicalHeight);

  // Preload logo image
  const logoImg = await loadImage(logoUrl);

  // 3. Layout Coordinates
  const leftMargin = 120;
  const rightMargin = 120;
  const chartX = leftMargin;
  const chartY = 240;
  const chartWidth = logicalWidth - leftMargin - rightMargin; // 1680px
  const chartHeight = 780; // from y=240 to y=1020

  // 4. Draw Header
  ctx.save();
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(chartX, 195);
  ctx.lineTo(chartX + chartWidth, 195);
  ctx.stroke();

  // Header Logo
  const logoHeight = 75;
  const logoWidth = logoImg ? (logoImg.width / logoImg.height) * logoHeight : 140;

  let logoX: number;
  let textStartX: number;

  if (isRtl) {
    logoX = chartX; // Logo on left for Arabic
    textStartX = chartX + chartWidth; // Text on right
  } else {
    logoX = chartX + chartWidth - logoWidth; // Logo on right for English
    textStartX = chartX; // Text on left
  }

  if (logoImg) {
    ctx.drawImage(logoImg, logoX, 55, logoWidth, logoHeight);
  }

  // Title (Literal without any manual character/word reversal)
  ctx.fillStyle = textColor;
  ctx.font = '900 32px Tajawal, system-ui, -apple-system, sans-serif';
  ctx.direction = isRtl ? 'rtl' : 'ltr';
  ctx.textAlign = isRtl ? 'right' : 'left';
  ctx.textBaseline = 'top';
  ctx.fillText(title, textStartX, 48);

  // Subtitle (Natural Bidi for Arabic + English mixed text)
  if (subtitle) {
    ctx.fillStyle = '#D4AF37';
    ctx.font = '700 20px Tajawal, system-ui, -apple-system, sans-serif';
    ctx.direction = isRtl ? 'rtl' : 'ltr';
    ctx.textAlign = isRtl ? 'right' : 'left';
    ctx.fillText(subtitle, textStartX, 95);
  }

  // Date Range (Explicit chronological display Start -> End)
  if (dateRange) {
    ctx.fillStyle = subTextColor;
    ctx.font = '600 16px Tajawal, system-ui, -apple-system, sans-serif';
    ctx.direction = 'ltr'; // Strictly LTR format to preserve chronological 02/08/2026 - 30/08/2026
    ctx.textAlign = isRtl ? 'right' : 'left';
    ctx.fillText(dateRange, textStartX, 135);
  }
  ctx.restore();

  // 5. Draw Watermark in the Exact Center of the Plot Area
  if (logoImg) {
    ctx.save();
    const watermarkWidth = 450;
    const watermarkHeight = (logoImg.height / logoImg.width) * watermarkWidth;
    const watermarkX = chartX + chartWidth / 2 - watermarkWidth / 2;
    const watermarkY = chartY + chartHeight / 2 - watermarkHeight / 2;

    ctx.globalAlpha = 0.05; // Subtle institutional watermark
    ctx.drawImage(logoImg, watermarkX, watermarkY, watermarkWidth, watermarkHeight);
    ctx.restore();
  }

  // 6. Chart Plotting
  const points = data && data.length > 0 ? data : [];

  if (points.length === 0) {
    ctx.save();
    ctx.fillStyle = subTextColor;
    ctx.font = '600 24px Tajawal, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      isRtl ? 'لا توجد بيانات تاريخية متاحة للتصدير' : 'No historical data available for export',
      chartX + chartWidth / 2,
      chartY + chartHeight / 2
    );
    ctx.restore();
  } else {
    // Determine min and max prices
    const prices = points.map((p) => Number(p.price) || 0);
    const minVal = Math.min(...prices);
    const maxVal = Math.max(...prices);
    const spread = maxVal - minVal;
    const paddingVal = spread > 0 ? spread * 0.12 : (minVal * 0.05) || 1;

    const yMin = Math.max(0, minVal - paddingVal);
    const yMax = maxVal + paddingVal;
    const yRange = yMax - yMin || 1;

    const plotInnerPadX = 35; // Padding inside the plot area so lines and labels breathe
    const usableWidth = chartWidth - plotInnerPadX * 2;

    // Helper: Map index to X coordinate
    const getX = (index: number): number => {
      if (points.length <= 1) return chartX + chartWidth / 2;
      return chartX + plotInnerPadX + (index / (points.length - 1)) * usableWidth;
    };

    // Helper: Map price to Y coordinate
    const getY = (price: number): number => {
      const clamped = Math.max(yMin, Math.min(yMax, price));
      return chartY + chartHeight - ((clamped - yMin) / yRange) * chartHeight;
    };

    // Draw Y-Axis Grid Lines & Values (5 horizontal grid lines)
    const gridCount = 5;
    ctx.save();
    for (let i = 0; i <= gridCount; i++) {
      const gridY = chartY + (i / gridCount) * chartHeight;
      const gridPrice = yMax - (i / gridCount) * yRange;

      // Grid line
      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(chartX, gridY);
      ctx.lineTo(chartX + chartWidth, gridY);
      ctx.stroke();

      // Y-axis Label
      ctx.setLineDash([]);
      ctx.fillStyle = '#CBD5E1';
      ctx.font = '600 17px Tajawal, system-ui, -apple-system, sans-serif';
      ctx.textBaseline = 'middle';
      ctx.direction = 'ltr';
      ctx.textAlign = 'right';

      const formattedPrice = gridPrice.toFixed(2);
      ctx.fillText(formattedPrice, chartX - 18, gridY);
    }
    ctx.restore();

    // Draw Baseline Axis Box / Border
    ctx.save();
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(chartX, chartY, chartWidth, chartHeight);
    ctx.restore();

    // Draw Gradient Area Under the Curve
    ctx.save();
    const gradient = ctx.createLinearGradient(0, chartY, 0, chartY + chartHeight);
    gradient.addColorStop(0, 'rgba(212, 175, 55, 0.18)');
    gradient.addColorStop(1, 'rgba(212, 175, 55, 0.0)');

    ctx.beginPath();
    ctx.moveTo(getX(0), chartY + chartHeight);
    for (let i = 0; i < points.length; i++) {
      ctx.lineTo(getX(i), getY(points[i].price));
    }
    ctx.lineTo(getX(points.length - 1), chartY + chartHeight);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
    ctx.restore();

    // Draw Main Line
    ctx.save();
    ctx.strokeStyle = '#D4AF37';
    ctx.lineWidth = 4.5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      const px = getX(i);
      const py = getY(points[i].price);
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
    ctx.restore();

    // Draw Points / Dots (if 25 or fewer points)
    if (points.length <= 25) {
      ctx.save();
      for (let i = 0; i < points.length; i++) {
        const px = getX(i);
        const py = getY(points[i].price);

        ctx.fillStyle = bgColor;
        ctx.strokeStyle = '#D4AF37';
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.arc(px, py, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }

    // Highlight Last Point
    if (points.length > 0) {
      ctx.save();
      const lastIndex = points.length - 1;
      const lastX = getX(lastIndex);
      const lastY = getY(points[lastIndex].price);

      ctx.fillStyle = '#D4AF37';
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(lastX, lastY, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Draw X-Axis Date Labels (Strictly DD/MM/YYYY, preventing collisions & clipping)
    ctx.save();
    ctx.fillStyle = '#CBD5E1';
    ctx.font = '600 17px Tajawal, system-ui, -apple-system, sans-serif';
    ctx.textBaseline = 'top';
    ctx.direction = 'ltr';

    // Pick 6-8 evenly spaced labels
    const maxLabels = 7;
    const step = points.length <= maxLabels ? 1 : Math.ceil((points.length - 1) / (maxLabels - 1));

    const labelIndices: number[] = [];
    for (let i = 0; i < points.length; i += step) {
      labelIndices.push(i);
    }
    if (labelIndices[labelIndices.length - 1] !== points.length - 1) {
      labelIndices.push(points.length - 1);
    }

    for (const idx of labelIndices) {
      const pt = points[idx];
      const posX = getX(idx);
      const posY = chartY + chartHeight + 15;
      const dateText = pt.dateLabel || '';

      if (idx === 0) {
        // First label: clamped inside left boundary
        ctx.textAlign = 'left';
        ctx.fillText(dateText, Math.max(chartX, posX - 10), posY);
      } else if (idx === points.length - 1) {
        // Last label: clamped inside right boundary (Never "30/08/2...")
        ctx.textAlign = 'right';
        ctx.fillText(dateText, Math.min(chartX + chartWidth, posX + 10), posY);
      } else {
        // Intermediate labels: centered
        ctx.textAlign = 'center';
        ctx.fillText(dateText, posX, posY);
      }
    }
    ctx.restore();
  }

  // 7. Draw Footer
  ctx.save();
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(chartX, 1070);
  ctx.lineTo(chartX + chartWidth, 1070);
  ctx.stroke();

  ctx.fillStyle = subTextColor;
  ctx.font = '600 16px Tajawal, system-ui, -apple-system, sans-serif';
  ctx.textBaseline = 'middle';
  const footerY = 1115;

  if (isRtl) {
    // Arabic Footer
    ctx.direction = 'rtl';
    ctx.textAlign = 'right';
    ctx.fillText('المصدر: منصة الأسعار العالمية (GCP)', chartX + chartWidth, footerY);

    ctx.direction = 'ltr';
    ctx.textAlign = 'left';
    ctx.fillText(`تاريخ التوليد: ${dateTimeStr}   |   © Libya Trade Network`, chartX, footerY);
  } else {
    // English Footer
    ctx.direction = 'ltr';
    ctx.textAlign = 'left';
    ctx.fillText('Source: Global Pricing Platform (GCP)', chartX, footerY);

    ctx.textAlign = 'right';
    ctx.fillText(`Generated on: ${dateTimeStr}   |   © Libya Trade Network`, chartX + chartWidth, footerY);
  }
  ctx.restore();

  return canvas;
};

/**
 * Exports chart to high-resolution PNG file.
 */
export const exportChartToPNG = async (options: ExportOptions) => {
  try {
    const canvas = await renderChartCanvas(options);
    const dataUrl = canvas.toDataURL('image/png', 1.0);

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}_${hours}-${minutes}`;

    const cleanFilename = `${options.filename}_${formattedDate}.png`.replace(/\s+/g, '_');

    const link = document.createElement('a');
    link.download = cleanFilename;
    link.href = dataUrl;
    link.click();
  } catch (error) {
    console.error('Error exporting chart to PNG:', error);
  }
};
