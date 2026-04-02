import path from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const deployTarget = process.env.DEPLOY_TARGET ?? process.env.VITE_DEPLOY_TARGET;
const base = deployTarget === 'github-pages' ? '/Scientific-Color-Lab/' : '/';
const useHashRouter = deployTarget === 'github-pages';
const withBase = (value: string) => `${base}${value}`.replace(/\/{2,}/g, '/');
const withAppRoute = (value: string) => (useHashRouter ? `${base}#/${value}` : withBase(value));

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg', 'icons.svg', 'pwa/apple-touch-icon.svg', 'pwa/icon-512.svg'],
      manifest: {
        name: 'Scientific Color Lab',
        short_name: 'Color Lab',
        description: 'Professional scientific color workspace for figures, charts, heatmaps, and academic documents.',
        theme_color: '#f6f5f1',
        background_color: '#f6f5f1',
        display: 'standalone',
        display_override: ['standalone', 'window-controls-overlay', 'browser'],
        start_url: withAppRoute('workspace'),
        scope: base,
        orientation: 'landscape',
        categories: ['productivity', 'education', 'developer tools', 'graphics'],
        icons: [
          {
            src: 'pwa/icon-192.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: 'pwa/icon-512.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
          },
          {
            src: 'pwa/icon-maskable.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Workspace',
            short_name: 'Workspace',
            url: withAppRoute('workspace'),
            icons: [{ src: 'pwa/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' }],
          },
          {
            name: 'Image Analyzer',
            short_name: 'Analyzer',
            url: withAppRoute('analyzer'),
            icons: [{ src: 'pwa/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' }],
          },
          {
            name: 'Export Center',
            short_name: 'Exports',
            url: withAppRoute('exports'),
            icons: [{ src: 'pwa/icon-192.svg', sizes: '192x192', type: 'image/svg+xml' }],
          },
        ],
        screenshots: [
          {
            src: 'pwa/screenshot-workspace.svg',
            sizes: '1440x960',
            type: 'image/svg+xml',
            form_factor: 'wide',
            label: 'Workspace with palette canvas, diagnostics, and adjustment tools',
          },
          {
            src: 'pwa/screenshot-analyzer.svg',
            sizes: '1440x960',
            type: 'image/svg+xml',
            form_factor: 'wide',
            label: 'Analyzer showing image extraction and scientific reconstruction',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,json}'],
        navigateFallback: 'index.html',
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: true,
    exclude: ['e2e/**', 'node_modules/**', '.codex-publish-backup/**', 'dist/**', 'test-results/**'],
  },
});
