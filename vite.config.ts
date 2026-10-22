import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Determine base URL dynamically based on deployment target:
// - VITE_DEPLOY_TARGET=production -> '/' (Official domain: https://gpp.ltnet.gov.ly/)
// - VITE_DEPLOY_TARGET=github-pages -> '/Global-Prices-Platform/' (GitHub Pages preview)
// - Default / Google AI Studio environment -> '/'
const deployTarget = process.env.VITE_DEPLOY_TARGET;
const base = deployTarget === 'github-pages' ? '/Global-Prices-Platform/' : '/';

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
});
