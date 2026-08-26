import html2canvas from 'html2canvas';
import { formatDisplayDate, formatDisplayDateTime } from './formatDate';

interface ExportOptions {
  element: HTMLElement;
  filename: string;
  title: string;
  subtitle?: string;
  dateRange?: string;
  theme?: 'light' | 'dark';
}

export const exportChartToPNG = async ({
  element,
  filename,
  title,
  subtitle,
  dateRange,
  theme = 'dark',
  logoUrl = 'https://i.postimg.cc/vTzC2Jbx/January-05-2026-1-removebg-preview.png'
}: ExportOptions & { logoUrl?: string }) => {
  const isDark = theme === 'dark';
  const bgColor = isDark ? '#0A1128' : '#ffffff';
  const textColor = isDark ? '#ffffff' : '#050A18';
  const subTextColor = isDark ? '#9CA3AF' : '#4B5563';
  const borderColor = isDark ? '#1C2E5A' : '#E5E7EB';

  try {
    const now = new Date();
    const dateTimeStr = formatDisplayDateTime(now);
    
    // Create an off-screen container
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    container.style.width = `${element.offsetWidth}px`;
    container.style.backgroundColor = bgColor;
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    // We add a large z-index to ensure it is above anything if it somehow shows
    container.style.zIndex = '-9999';
    
    // Header
    const header = document.createElement('div');
    header.style.padding = '20px 30px';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.backgroundColor = bgColor;
    header.style.color = textColor;
    header.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    header.style.borderBottom = `1px solid ${borderColor}`;
    
    header.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 4px; text-align: left;" dir="ltr">
        <h2 style="margin: 0; font-size: 24px; font-weight: bold; color: ${textColor};">${title}</h2>
        ${subtitle ? `<p style="margin: 0; font-size: 16px; color: ${subTextColor};">${subtitle}</p>` : ''}
        ${dateRange ? `<p style="margin: 0; font-size: 14px; color: ${subTextColor}; font-weight: 500;">${dateRange}</p>` : ''}
      </div>
      <img src="${logoUrl}" alt="GCP Logo" style="height: 50px; object-fit: contain;" crossorigin="anonymous" />
    `;
    
    // Clone chart
    const clonedChart = element.cloneNode(true) as HTMLElement;
    clonedChart.style.position = 'relative';
    clonedChart.style.margin = '20px 0';
    // Ensure height is fixed for cloning so recharts doesn't collapse
    clonedChart.style.height = `${element.offsetHeight}px`;
    clonedChart.style.width = '100%';
    
    // Remove any existing duplicate watermarks/images inside the cloned chart element
    const existingWatermarks = clonedChart.querySelectorAll('img[alt="watermark"], [data-watermark="true"], img');
    existingWatermarks.forEach((el) => el.remove());

    // Single source of truth for the chart watermark in export
    const watermark = document.createElement('div');
    watermark.setAttribute('data-watermark', 'true');
    watermark.style.position = 'absolute';
    watermark.style.top = '50%';
    watermark.style.left = '50%';
    watermark.style.transform = 'translate(-50%, -50%)';
    watermark.style.opacity = '0.06'; // 5-8% opacity
    watermark.style.pointerEvents = 'none';
    watermark.style.zIndex = '0';
    watermark.style.display = 'flex';
    watermark.style.justifyContent = 'center';
    watermark.style.alignItems = 'center';
    watermark.style.width = '100%';
    watermark.style.height = '100%';
    watermark.innerHTML = `<img src="${logoUrl}" alt="Watermark" style="width: 50%; max-width: 400px; height: auto; object-fit: contain;" crossorigin="anonymous" />`;
    
    clonedChart.appendChild(watermark);
    
    // Footer
    const footer = document.createElement('div');
    footer.style.padding = '15px 30px';
    footer.style.display = 'flex';
    footer.style.justifyContent = 'space-between';
    footer.style.alignItems = 'center';
    footer.style.backgroundColor = bgColor;
    footer.style.borderTop = `1px solid ${borderColor}`;
    footer.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    footer.style.fontSize = '12px';
    footer.style.color = subTextColor;
    
    footer.innerHTML = `
      <div style="text-align: left;" dir="ltr">
        <span style="font-weight: bold; color: ${textColor};">Source:</span> Global Pricing Platform (GCP)
      </div>
      <div style="text-align: right;" dir="ltr">
        <span style="margin-right: 15px;">Generated on: ${dateTimeStr}</span>
        <span style="font-weight: bold;">© Libya Trade Network</span>
      </div>
    `;

    container.appendChild(header);
    container.appendChild(clonedChart);
    container.appendChild(footer);
    
    document.body.appendChild(container);
    
    // Wait for images and SVG re-renders
    await new Promise(r => setTimeout(r, 500));

    const canvas = await html2canvas(container, {
      backgroundColor: bgColor,
      scale: 3, // High quality, ~300 DPI equivalent
      useCORS: true,
      logging: false,
      allowTaint: true
    });

    // Cleanup
    document.body.removeChild(container);

    const dataUrl = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    
    // Format timestamp: YYYY-MM-DD_HH-mm
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}_${hours}-${minutes}`;
    
    const finalFilename = `${filename}_${formattedDate}.png`.replace(/\s+/g, '_');
    
    link.download = finalFilename;
    link.href = dataUrl;
    link.click();
    
  } catch (error) {
    console.error('Error exporting chart:', error);
  }
};
