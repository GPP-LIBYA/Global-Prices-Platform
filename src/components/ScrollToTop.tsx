import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
import { ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const ScrollToTop = () => {
  const location = useLocation();
  const navType = useNavigationType();

  // Floating button visibility
  const [isVisible, setIsVisible] = useState(false);

  // Cache to store scroll positions for POP (Back / Forward) navigation
  const scrollPositionsRef = useRef<Map<string, number>>(new Map());

  // Helper to calculate sticky header offset to avoid content hiding behind header
  const getHeaderHeight = (): number => {
    const header = document.querySelector('header');
    if (header) {
      const rect = header.getBoundingClientRect();
      return Math.round(rect.height);
    }
    return 80;
  };

  // Helper to perform instant scroll to top
  const performInstantScrollToTop = () => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto',
    });
    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }
  };

  // Record scroll position during scrolling so POP can restore it accurately
  useEffect(() => {
    const recordScroll = () => {
      const currentScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
      
      // Update floating button visibility
      if (currentScrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }

      // Save scroll position for the current location key and path
      const key = location.key || `${location.pathname}${location.search}`;
      scrollPositionsRef.current.set(key, currentScrollY);
    };

    window.addEventListener('scroll', recordScroll, { passive: true });
    return () => window.removeEventListener('scroll', recordScroll);
  }, [location.key, location.pathname, location.search]);

  // Main navigation scroll controller
  useLayoutEffect(() => {
    const currentKey = location.key || `${location.pathname}${location.search}`;

    // CASE 1: Anchor / Hash navigation (e.g. #table or #section)
    if (location.hash) {
      const targetId = decodeURIComponent(location.hash.replace(/^#/, ''));
      
      const scrollToElement = () => {
        const targetElement = 
          document.getElementById(targetId) || 
          document.querySelector(`[name="${targetId}"]`);

        if (targetElement) {
          const headerHeight = getHeaderHeight();
          const elementTop = targetElement.getBoundingClientRect().top + (window.pageYOffset || document.documentElement.scrollTop || 0);
          const finalTop = Math.max(0, elementTop - headerHeight - 16);

          window.scrollTo({
            top: finalTop,
            left: 0,
            behavior: 'auto',
          });
          return true;
        }
        return false;
      };

      // Try immediately
      if (!scrollToElement()) {
        // If element is not in DOM yet (e.g. lazy-loaded route), retry shortly
        const timer1 = setTimeout(scrollToElement, 50);
        const timer2 = setTimeout(() => {
          if (!scrollToElement()) {
            performInstantScrollToTop();
          }
        }, 180);

        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
        };
      }
      return;
    }

    // CASE 2: Browser Back / Forward (POP navigation)
    if (navType === 'POP') {
      const savedPosition = scrollPositionsRef.current.get(currentKey);
      if (typeof savedPosition === 'number') {
        window.scrollTo({
          top: savedPosition,
          left: 0,
          behavior: 'auto',
        });
        return;
      }
      // If no saved position, proceed to top
      performInstantScrollToTop();
      return;
    }

    // CASE 3: Normal route navigation (PUSH or REPLACE) - always start from the top
    performInstantScrollToTop();

    // Additional frame check to protect against lazy-load layout shifts
    const rafId = requestAnimationFrame(() => {
      performInstantScrollToTop();
    });

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [location.pathname, location.search, location.hash, location.key, navType]);

  // Manual floating button scroll
  const handleManualScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          onClick={handleManualScrollToTop}
          className="fixed bottom-8 right-8 z-50 p-3 bg-[#D4AF37] text-[#0A1128] rounded-full shadow-2xl shadow-[#D4AF37]/30 hover:bg-[#B5952F] transition-all transform hover:-translate-y-1 active:scale-95 cursor-pointer"
          aria-label="Scroll to top"
        >
          <ChevronUp size={24} strokeWidth={3} />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

