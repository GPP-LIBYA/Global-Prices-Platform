import React, { useState, useEffect } from 'react';
import { useSettings, resolvePlatformLogoUrl } from '../context/SettingsContext';

export const FALLBACK_WATERMARK_URL = '/ltn-logo.svg';

/**
 * Resolves the active platform watermark logo URL according to the current Supabase settings.
 * Priority:
 * 1. Resolved Header Logo URL
 * 2. Resolved Hero Logo URL
 * 3. Resolved Site / Platform Logo URL
 * 4. Stored Paths in platform_settings
 * 5. Default LTNet Fallback SVG
 */
export const getPlatformWatermarkUrl = (settings?: any): string => {
  if (!settings) return FALLBACK_WATERMARK_URL;

  // 1. Direct URLs from context
  if (settings.headerLogoUrl && typeof settings.headerLogoUrl === 'string' && settings.headerLogoUrl.trim()) {
    return settings.headerLogoUrl.trim();
  }
  if (settings.heroLogoUrl && typeof settings.heroLogoUrl === 'string' && settings.heroLogoUrl.trim()) {
    return settings.heroLogoUrl.trim();
  }

  // 2. Resolve paths from Supabase Storage
  if (settings.headerLogoPath) {
    const resolved = resolvePlatformLogoUrl(settings.headerLogoPath);
    if (resolved) return resolved;
  }
  if (settings.heroLogoPath) {
    const resolved = resolvePlatformLogoUrl(settings.heroLogoPath);
    if (resolved) return resolved;
  }
  if (settings.siteLogo) {
    const resolved = resolvePlatformLogoUrl(settings.siteLogo);
    if (resolved) return resolved;
    if (typeof settings.siteLogo === 'string' && settings.siteLogo.trim()) {
      return settings.siteLogo.trim();
    }
  }

  return FALLBACK_WATERMARK_URL;
};

export interface ChartWatermarkProps {
  /**
   * Watermark opacity between 0.05 and 0.10 (5% to 10%).
   * Defaults to 0.07 (7%).
   */
  opacity?: number;
  /**
   * Responsive Tailwind size classes for the watermark image.
   * Default: 'w-36 sm:w-48 md:w-56 max-w-[55%] max-h-[55%]'
   */
  sizeClass?: string;
  /**
   * Optional custom logo URL override. If omitted, dynamically reads from Supabase settings.
   */
  logoUrl?: string;
  /**
   * Additional container CSS classes.
   */
  className?: string;
  /**
   * Accessible alt text for the watermark.
   */
  alt?: string;
}

export const ChartWatermark: React.FC<ChartWatermarkProps> = ({
  opacity = 0.07,
  sizeClass = 'w-36 sm:w-48 md:w-56 max-w-[55%] max-h-[55%]',
  logoUrl,
  className = '',
  alt = 'Libya Trade Network'
}) => {
  const { settings } = useSettings();
  const activeLogo = logoUrl || getPlatformWatermarkUrl(settings);

  const [currentSrc, setCurrentSrc] = useState<string>(activeLogo);
  const [hasError, setHasError] = useState<boolean>(false);

  // Sync with dynamic settings updates from Supabase Realtime / context
  useEffect(() => {
    const nextLogo = logoUrl || getPlatformWatermarkUrl(settings);
    setCurrentSrc(nextLogo);
    setHasError(false);
  }, [logoUrl, settings.headerLogoUrl, settings.heroLogoUrl, settings.siteLogo, settings.headerLogoPath, settings.heroLogoPath]);

  const handleError = () => {
    if (currentSrc !== FALLBACK_WATERMARK_URL) {
      // Fallback to local official SVG logo
      setCurrentSrc(FALLBACK_WATERMARK_URL);
    } else {
      setHasError(true);
    }
  };

  if (hasError || !currentSrc) {
    return null;
  }

  // Clamped opacity between 0.04 and 0.12 (standard 0.07)
  const clampedOpacity = Math.max(0.04, Math.min(0.12, opacity));

  return (
    <div
      className={`absolute inset-0 m-auto flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <img
        src={currentSrc}
        alt={alt}
        crossOrigin="anonymous"
        data-watermark="true"
        onError={handleError}
        style={{
          opacity: clampedOpacity,
          pointerEvents: 'none',
          userSelect: 'none'
        }}
        className={`object-contain transition-opacity duration-300 pointer-events-none select-none ${sizeClass}`}
      />
    </div>
  );
};

export default ChartWatermark;
