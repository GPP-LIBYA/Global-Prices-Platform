import { jsPDF } from 'jspdf';

// In-memory cache for the loaded font base64 string
let cachedCairoBase64: string | null = null;

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return window.btoa(binary);
}

/**
 * Loads and registers a Unicode Arabic font (Cairo / Amiri) into a jsPDF instance.
 * Ensures both 'normal' and 'bold' styles are registered so autoTable and doc.setFont never crash
 * with "Cannot read properties of undefined (reading 'widths')" or "No unicode cmap for font".
 */
export async function loadArabicPdfFont(doc: jsPDF): Promise<{ fontName: string; isUnicode: boolean }> {
  try {
    if (!cachedCairoBase64) {
      // 1. Try local public font file first
      let res: Response | null = null;
      try {
        res = await fetch('/fonts/Cairo-Regular.ttf');
        if (!res.ok) {
          res = await fetch('/fonts/Amiri-Regular.ttf');
        }
      } catch {
        res = null;
      }

      // 2. Fallback to reliable jsdelivr CDN if local fetch failed
      if (!res || !res.ok) {
        res = await fetch('https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/amiri/Amiri-Regular.ttf');
      }

      if (!res || !res.ok) {
        throw new Error('Could not fetch Arabic font');
      }

      const buffer = await res.arrayBuffer();
      cachedCairoBase64 = arrayBufferToBase64(buffer);
    }

    if (cachedCairoBase64) {
      const fontFileName = 'CustomArabicFont.ttf';
      const fontName = 'ArabicFont';

      doc.addFileToVFS(fontFileName, cachedCairoBase64);
      doc.addFont(fontFileName, fontName, 'normal');
      doc.addFont(fontFileName, fontName, 'bold');
      doc.addFont(fontFileName, fontName, 'italic');
      doc.addFont(fontFileName, fontName, 'bolditalic');
      doc.setFont(fontName, 'normal');

      return { fontName, isUnicode: true };
    }
  } catch (err) {
    console.warn('Failed to load Arabic font for PDF export, falling back to standard font:', err);
  }

  return { fontName: 'helvetica', isUnicode: false };
}
