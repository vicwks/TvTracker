import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Découpage du bundle : le graphique (recharts) n'est chargé que sur la page Stats, et React, le routeur et
// axios vont dans un fichier à part, mis en cache longtemps puisqu'ils changent rarement.
function splitVendors(id) {
  if (!id.includes('node_modules')) return undefined;
  if (/node_modules\/(recharts|d3-|victory-vendor|internmap|decimal\.js-light)/.test(id)) return 'charts';
  if (/node_modules\/(react|react-dom|react-router|@remix-run|scheduler|axios)\//.test(id)) return 'vendor';
  return undefined;
}

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: splitVendors,
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
