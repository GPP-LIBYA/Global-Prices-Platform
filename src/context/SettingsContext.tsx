import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface SiteSettings {
  siteNameAr: string;
  siteNameEn: string;
  descriptionAr: string;
  descriptionEn: string;
  siteLogo: string;
  faviconUrl: string;
  isSiteActive: boolean;
  maintenanceTitleAr: string;
  maintenanceMessageAr: string;
  contactEmail: string;
  contactPhone: string;
  contactAddressAr: string;
  contactAddressEn: string;
  facebookUrl: string;
  linkedinUrl: string;
  twitterUrl: string;
  footerTextAr: string;
  footerTextEn: string;
  disclaimerAr: string;
  privacyPolicyAr: string;
  termsAr: string;
  authUiEnabled: boolean;

  // Platform Header Logo Settings
  headerLogoEnabled: boolean;
  headerLogoPath: string;
  headerLogoHeight: number;
  headerLogoAlignment: 'right' | 'center' | 'left';
  headerLogoOrder: 'before_text' | 'after_text';
  headerLogoGap: number;
  headerLogoUrl: string;

  // Platform Hero Logo Settings
  heroLogoEnabled: boolean;
  heroLogoPath: string;
  heroLogoSize: number;
  heroLogoAlignment: 'right' | 'center' | 'left';
  heroLogoVerticalPosition: 'top' | 'center' | 'bottom';
  heroLogoOffsetY: number;
  heroLogoUrl: string;
}

export const parsePlatformIsActive = (platformStatusRaw: any, isSiteActiveRaw?: any): boolean => {
  const evaluateValue = (val: any): boolean | null => {
    if (val === undefined || val === null) return null;
    
    let current = val;
    if (typeof current === 'string') {
      const trimmed = current.trim();
      if (!trimmed) return null;

      if (
        (trimmed.startsWith('{') && trimmed.endsWith('}')) || 
        (trimmed.startsWith('[') && trimmed.endsWith(']')) ||
        (trimmed.startsWith('"') && trimmed.endsWith('"'))
      ) {
        try {
          const parsed = JSON.parse(trimmed);
          if (typeof parsed === 'string') {
            current = parsed;
          } else if (typeof parsed === 'boolean') {
            return parsed;
          } else if (typeof parsed === 'number') {
            return parsed !== 0;
          } else if (typeof parsed === 'object' && parsed !== null) {
            const inner = parsed.status ?? parsed.platform_status ?? parsed.is_site_active ?? 
                          parsed.isSiteActive ?? parsed.active ?? parsed.open ?? parsed.state ?? parsed.mode;
            if (inner !== undefined) {
              return evaluateValue(inner);
            }
          }
        } catch {
          current = trimmed;
        }
      } else {
        current = trimmed;
      }
    }

    if (typeof current === 'boolean') {
      return current;
    }

    if (typeof current === 'number') {
      return current !== 0;
    }

    const lower = String(current).trim().toLowerCase();

    if (
      lower === 'maintenance' ||
      lower === 'closed' ||
      lower === 'close' ||
      lower === 'false' ||
      lower === '0' ||
      lower === 'off' ||
      lower === 'disabled' ||
      lower === 'under_maintenance'
    ) {
      return false;
    }

    if (
      lower === 'open' ||
      lower === 'active' ||
      lower === 'true' ||
      lower === '1' ||
      lower === 'on' ||
      lower === 'enabled'
    ) {
      return true;
    }

    return null;
  };

  const statusEval = evaluateValue(platformStatusRaw);
  if (statusEval !== null) {
    return statusEval;
  }

  const activeEval = evaluateValue(isSiteActiveRaw);
  if (activeEval !== null) {
    return activeEval;
  }

  return true;
};

export const resolvePlatformLogoUrl = (value?: string | null): string => {
  if (!value) return '';
  const trimmed = String(value).trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  let cleanPath = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed;
  if (cleanPath.startsWith('platform-logos/')) {
    cleanPath = cleanPath.slice('platform-logos/'.length);
  }
  if (!cleanPath) return '';
  try {
    const { data } = supabase.storage.from('platform-logos').getPublicUrl(cleanPath);
    return data?.publicUrl || '';
  } catch (err) {
    console.error('Failed to resolve platform logo publicUrl:', err);
    return '';
  }
};

export const getPlatformLogoUrl = resolvePlatformLogoUrl;

export const parseLogoEnabled = (val: any): boolean => {
  if (val === undefined || val === null || val === '') return false;
  if (typeof val === 'boolean') return val;
  if (typeof val === 'number') return val === 1;
  if (typeof val === 'string') {
    const lower = val.trim().toLowerCase();
    if (lower === 'true' || lower === '1' || lower === 'enabled' || lower === 'on' || lower === 'yes') {
      return true;
    }
    if (lower === 'false' || lower === '0' || lower === 'disabled' || lower === 'off' || lower === 'no') {
      return false;
    }
  }
  return false;
};

export const preloadImage = (url?: string | null) => {
  if (!url || typeof window === 'undefined') return;
  const trimmed = url.trim();
  if (!trimmed) return;
  try {
    const img = new Image();
    img.src = trimmed;
  } catch {
    // ignore preload error so it never blocks UI rendering
  }
};

const defaultSettings: SiteSettings = {
  siteNameAr: 'منصة الأسعار العالمية GCP',
  siteNameEn: 'Global Pricing Platform',
  descriptionAr: 'المنصة الرائدة لتتبع أسعار السلع والمعادن العالمية لحظة بلحظة مع تحليلات دقيقة وتقارير حصرية.',
  descriptionEn: 'The leading platform for tracking global commodity and metal prices in real-time with accurate analytics and exclusive reports.',
  siteLogo: '',
  faviconUrl: '/favicon.ico',
  isSiteActive: true,
  maintenanceTitleAr: 'وضع الصيانة',
  maintenanceMessageAr: 'نعمل حاليًا على تحديث منصة الأسعار العالمية GCP، يرجى العودة لاحقًا.',
  contactEmail: 'info@globalprices.com',
  contactPhone: '+1 234 567 890',
  contactAddressAr: 'شارع المال والأعمال، الطابق 15، لندن، المملكة المتحدة',
  contactAddressEn: 'Finance St, 15th Floor, London, UK',
  facebookUrl: '#',
  linkedinUrl: '#',
  twitterUrl: '#',
  footerTextAr: '© 2026 منصة الأسعار العالمية GCP. جميع الحقوق محفوظة.',
  footerTextEn: '© 2026 Global Pricing Platform. All rights reserved.',
  disclaimerAr: 'جميع البيانات والتحاليل المقدمة في هذه المنصة هي لأغراض إعلامية فقط ولا تعتبر نصيحة استثمارية.',
  privacyPolicyAr: 'نحن نلتزم بحماية خصوصية بياناتك ومعلوماتك الشخصية.',
  termsAr: 'باستخدامك لهذه المنصة، فإنك توافق على الالتزام بشروط الاستخدام المعمول بها.',
  authUiEnabled: true,

  // Default Header Logo Settings
  headerLogoEnabled: true,
  headerLogoPath: '',
  headerLogoHeight: 40,
  headerLogoAlignment: 'right',
  headerLogoOrder: 'before_text',
  headerLogoGap: 12,
  headerLogoUrl: '',

  // Default Hero Logo Settings
  heroLogoEnabled: true,
  heroLogoPath: '',
  heroLogoSize: 160,
  heroLogoAlignment: 'center',
  heroLogoVerticalPosition: 'top',
  heroLogoOffsetY: 0,
  heroLogoUrl: ''
};

export interface SettingsContextType {
  settings: SiteSettings;
  loading: boolean;
  settingsLoaded: boolean;
  fetchError: string | null;
  refreshSettings: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  loading: true,
  settingsLoaded: false,
  fetchError: null,
  refreshSettings: async () => {}
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const isMountedRef = React.useRef(true);

  const parseAuthUiEnabled = (val: any): boolean => {
    if (val === undefined || val === null) return true;
    if (typeof val === 'boolean') return val;
    if (typeof val === 'string') {
      const lower = val.trim().toLowerCase();
      if (lower === 'false' || lower === '0' || lower === 'disabled' || lower === 'off') return false;
      if (lower === 'true' || lower === '1' || lower === 'enabled' || lower === 'on') return true;
    }
    return Boolean(val);
  };

  const parseNumber = (val: any, defaultVal: number, min?: number, max?: number): number => {
    if (val === undefined || val === null || val === '') return defaultVal;
    const parsed = Number(val);
    if (isNaN(parsed)) return defaultVal;
    if (min !== undefined && parsed < min) return min;
    if (max !== undefined && parsed > max) return max;
    return parsed;
  };

  const fetchAllSettings = async (isInitial = false) => {
    if (isInitial) {
      setLoading(true);
    }
    try {
      const startedAt = performance.now();
      const { data, error } = await supabase.from('platform_settings').select('key, value');
      console.log(`[platform_settings fetch]: ${Math.round(performance.now() - startedAt)} ms`);
        
      if (error) {
        console.error('Supabase error fetching platform_settings:', error);
        if (!isMountedRef.current) return;
        // Do not assume site is open if fetch fails
        setFetchError(error.message || 'فشل الاتصال بقاعدة البيانات');
        return;
      }

      if (!isMountedRef.current || !data) return;

      setFetchError(null);

      const settingsMap: Record<string, any> = {};
      data.forEach(item => {
        settingsMap[item.key] = item.value;
      });

      const hPathRaw = settingsMap.header_logo_path !== undefined 
        ? String(settingsMap.header_logo_path).trim() 
        : undefined;
      const heroPathRaw = settingsMap.hero_logo_path !== undefined 
        ? String(settingsMap.hero_logo_path).trim() 
        : undefined;

      const hUrl = resolvePlatformLogoUrl(hPathRaw);
      const heroUrl = resolvePlatformLogoUrl(heroPathRaw);

      // Fast Image Preload to reduce visual wait time
      if (hUrl) preloadImage(hUrl);
      if (heroUrl) preloadImage(heroUrl);

      const hEnabled = settingsMap.header_logo_enabled !== undefined
        ? parseLogoEnabled(settingsMap.header_logo_enabled)
        : true;
      const heroEnabled = settingsMap.hero_logo_enabled !== undefined
        ? parseLogoEnabled(settingsMap.hero_logo_enabled)
        : true;

      // Robust check for platform status (open vs maintenance)
      const isPlatformActive = parsePlatformIsActive(settingsMap.platform_status, settingsMap.is_site_active);

      // Temporary Development Diagnostic
      if (typeof window !== 'undefined') {
        console.log('[PlatformSettings Diagnostic]', {
          platform_status: settingsMap.platform_status,
          is_site_active_raw: settingsMap.is_site_active,
          isSiteActiveParsed: isPlatformActive,
          header_logo_enabled: hEnabled,
          hero_logo_enabled: heroEnabled,
          settingsLoaded: true
        });
      }

      setSettings(prev => {
        const hPath = hPathRaw !== undefined ? hPathRaw : prev.headerLogoPath;
        const heroPath = heroPathRaw !== undefined ? heroPathRaw : prev.heroLogoPath;
        return {
          ...prev,
          siteNameAr: settingsMap.platform_name_ar || prev.siteNameAr,
          siteNameEn: settingsMap.platform_name_en || prev.siteNameEn,
          descriptionAr: settingsMap.platform_description_ar || prev.descriptionAr,
          descriptionEn: settingsMap.platform_description_en || prev.descriptionEn,
          siteLogo: settingsMap.platform_logo_url || prev.siteLogo || '',
          faviconUrl: settingsMap.platform_favicon_url || prev.faviconUrl,
          isSiteActive: isPlatformActive,
          maintenanceTitleAr: settingsMap.maintenance_title_ar || prev.maintenanceTitleAr,
          maintenanceMessageAr: settingsMap.maintenance_message_ar || prev.maintenanceMessageAr,
          contactEmail: settingsMap.contact_email || prev.contactEmail,
          contactPhone: settingsMap.contact_phone || prev.contactPhone,
          contactAddressAr: settingsMap.contact_address_ar || prev.contactAddressAr,
          contactAddressEn: settingsMap.contact_address_en || prev.contactAddressEn,
          facebookUrl: settingsMap.facebook_url || prev.facebookUrl,
          linkedinUrl: settingsMap.linkedin_url || prev.linkedinUrl,
          twitterUrl: settingsMap.x_url || prev.twitterUrl,
          footerTextAr: settingsMap.footer_text_ar || prev.footerTextAr,
          footerTextEn: settingsMap.footer_text_en || prev.footerTextEn,
          disclaimerAr: settingsMap.disclaimer_ar || prev.disclaimerAr,
          privacyPolicyAr: settingsMap.privacy_policy_ar || prev.privacyPolicyAr,
          termsAr: settingsMap.terms_ar || prev.termsAr,
          authUiEnabled: settingsMap.auth_ui_enabled !== undefined 
            ? parseAuthUiEnabled(settingsMap.auth_ui_enabled) 
            : prev.authUiEnabled,

          // Header Logo
          headerLogoEnabled: hEnabled,
          headerLogoPath: hPath,
          headerLogoHeight: settingsMap.header_logo_height !== undefined 
            ? parseNumber(settingsMap.header_logo_height, 40, 20, 80) 
            : prev.headerLogoHeight,
          headerLogoAlignment: (settingsMap.header_logo_alignment === 'left' || settingsMap.header_logo_alignment === 'center')
            ? settingsMap.header_logo_alignment 
            : (settingsMap.header_logo_alignment === 'right' ? 'right' : prev.headerLogoAlignment),
          headerLogoOrder: settingsMap.header_logo_order === 'after_text' 
            ? 'after_text' 
            : (settingsMap.header_logo_order === 'before_text' ? 'before_text' : prev.headerLogoOrder),
          headerLogoGap: settingsMap.header_logo_gap !== undefined 
            ? parseNumber(settingsMap.header_logo_gap, 12, 0, 40) 
            : prev.headerLogoGap,
          headerLogoUrl: hUrl,

          // Hero Logo
          heroLogoEnabled: heroEnabled,
          heroLogoPath: heroPath,
          heroLogoSize: settingsMap.hero_logo_size !== undefined 
            ? parseNumber(settingsMap.hero_logo_size, 160, 80, 400) 
            : prev.heroLogoSize,
          heroLogoAlignment: (settingsMap.hero_logo_alignment === 'left' || settingsMap.hero_logo_alignment === 'right')
            ? settingsMap.hero_logo_alignment 
            : (settingsMap.hero_logo_alignment === 'center' ? 'center' : prev.heroLogoAlignment),
          heroLogoVerticalPosition: (settingsMap.hero_logo_vertical_position === 'center' || settingsMap.hero_logo_vertical_position === 'bottom')
            ? settingsMap.hero_logo_vertical_position 
            : (settingsMap.hero_logo_vertical_position === 'top' ? 'top' : prev.heroLogoVerticalPosition),
          heroLogoOffsetY: settingsMap.hero_logo_offset_y !== undefined 
            ? parseNumber(settingsMap.hero_logo_offset_y, 0, -100, 100) 
            : prev.heroLogoOffsetY,
          heroLogoUrl: heroUrl,
        };
      });

      setSettingsLoaded(true);
    } catch (err: any) {
      console.error('Exception fetching platform settings:', err);
      if (!isMountedRef.current) return;
      setFetchError(err?.message || 'خطأ أثناء الاتصال بقاعدة البيانات');
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  };

  const refreshSettings = async () => {
    setFetchError(null);
    await fetchAllSettings(false);
  };

  useEffect(() => {
    isMountedRef.current = true;

    // Initial fetch
    fetchAllSettings(true);

    // 1. Polling every 30 seconds for live sync
    const intervalId = setInterval(() => {
      if (isMountedRef.current) {
        fetchAllSettings(false);
      }
    }, 30000);

    // 2. Tab visibility change & window focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isMountedRef.current) {
        fetchAllSettings(false);
      }
    };
    const handleWindowFocus = () => {
      if (isMountedRef.current) {
        fetchAllSettings(false);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);

    // 3. Supabase Realtime subscription
    const channel = supabase
      .channel('platform_settings_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'platform_settings' },
        () => {
          if (!isMountedRef.current) return;
          fetchAllSettings(false);
        }
      )
      .subscribe();

    return () => {
      isMountedRef.current = false;
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    // Update favicon
    const link: any = document.querySelector("link[rel~='icon']");
    if (link) {
      link.href = settings.faviconUrl;
    } else {
      const newLink = document.createElement('link');
      newLink.rel = 'icon';
      newLink.href = settings.faviconUrl;
      document.getElementsByTagName('head')[0].appendChild(newLink);
    }
    
    // Update document title dynamically based on HTML lang
    const updateTitle = () => {
      const lang = document.documentElement.lang || 'ar';
      document.title = lang === 'ar' ? settings.siteNameAr : settings.siteNameEn;
    };
    
    updateTitle();

    // Observe documentElement lang attribute changes
    const observer = new MutationObserver(updateTitle);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] });

    return () => observer.disconnect();
  }, [settings.siteNameAr, settings.siteNameEn, settings.faviconUrl]);

  return (
    <SettingsContext.Provider value={{ settings, loading, settingsLoaded, fetchError, refreshSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
