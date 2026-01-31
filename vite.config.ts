import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  base: '/TerziAI/',
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.svg', 'icons/*.png'],
      manifest: false, // Using external manifest.json
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Increase size limit for local app assets
        maximumFileSizeToCacheInBytes: 100 * 1024 * 1024, // 100MB for app assets
        // Exclude external CDN URLs from service worker caching
        // WebLLM handles its own model caching via IndexedDB
        runtimeCaching: [
          {
            // Exclude WebLLM CDN URLs (huggingface.co, jsdelivr.net) from caching
            // WebLLM handles its own model caching via IndexedDB
            urlPattern: /^https?:\/\/.*(huggingface\.co|jsdelivr\.net|hf\.co).*/i,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    coverage: {
      provider: 'v8',
      reportsDirectory: 'coverage',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/main.tsx', 'src/setupTests.ts'],
    },
  },
});
