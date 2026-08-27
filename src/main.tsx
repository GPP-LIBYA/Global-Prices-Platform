import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

const resetAppStorage = () => {
  try {
    const prefixes = ['sb-', 'supabase', 'APP_', 'GCP_', 'auth', 'platform', 'admin', 'user'];
    
    // Clear matching localStorage keys (preserving user language setting)
    const lsKeysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key !== 'gcp_language' && prefixes.some(p => key.startsWith(p) || key.includes('APP_VERSION'))) {
        lsKeysToRemove.push(key);
      }
    }
    lsKeysToRemove.forEach(key => localStorage.removeItem(key));

    // Clear matching sessionStorage keys
    const ssKeysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && prefixes.some(p => key.startsWith(p))) {
        ssKeysToRemove.push(key);
      }
    }
    ssKeysToRemove.forEach(key => sessionStorage.removeItem(key));
  } catch (e) {
    console.warn("Error during storage reset", e);
  }
};

// Safely clean up any legacy service workers or obsolete caches in the background without blocking UI or causing loops
if (typeof window !== 'undefined') {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister().catch((err) => {
          console.warn('Could not unregister legacy service worker:', err);
        });
      }
    }).catch((err) => {
      console.warn('Error querying service workers:', err);
    });
  }

  if ('caches' in window) {
    caches.keys().then((cacheNames) => {
      cacheNames.forEach((cacheName) => {
        caches.delete(cacheName).catch((err) => {
          console.warn('Could not delete legacy cache:', cacheName, err);
        });
      });
    }).catch((err) => {
      console.warn('Error clearing legacy caches:', err);
    });
  }
}

// Expose globally for the error boundary or manual debugging
(window as any).resetAppStorage = resetAppStorage;

if (new URLSearchParams(window.location.search).has('reset')) {
  resetAppStorage();
  const searchParams = new URLSearchParams(window.location.search);
  searchParams.delete('reset');
  const newSearch = searchParams.toString();
  const newUrl = window.location.pathname + (newSearch ? '?' + newSearch : '') + window.location.hash;
  window.location.replace(newUrl || '/#/');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
