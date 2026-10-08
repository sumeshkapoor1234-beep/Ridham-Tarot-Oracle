import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

const rawPort = process.env.PORT;

if (!rawPort) {
  throw new Error(
    'PORT environment variable is required but was not provided.',
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH;

if (!basePath) {
  throw new Error(
    'BASE_PATH environment variable is required but was not provided.',
  );
}

const appScope = basePath.endsWith('/') ? basePath : `${basePath}/`;
const routePrefix = basePath.replace(/\/$/, '');
const protectedRoutePatterns = ['developer', 'sign-in', 'sign-up'].map(
  (route) => new RegExp(`^${routePrefix}/${route}(?:/|$)`),
);

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss({ optimize: false }),
    runtimeErrorOverlay(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.svg',
        'logo.svg',
        'oracle-artwork.png',
        'oracle-artwork-2.png',
        'oracle-artwork-3.png',
        'pwa-icon-180.png',
        'pwa-icon-192.png',
        'pwa-icon-512.png',
        'pwa-maskable-512.png',
      ],
      manifest: {
        id: appScope,
        name: 'Ridham’s Mystic Tarot Oracle',
        short_name: 'Mystic Tarot',
        description: 'A personal tarot reading experience from Ridham Kapoor.',
        start_url: appScope,
        scope: appScope,
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#f3eee3',
        theme_color: '#292d48',
        icons: [
          { src: `${appScope}pwa-icon-192.png`, sizes: '192x192', type: 'image/png' },
          { src: `${appScope}pwa-icon-512.png`, sizes: '512x512', type: 'image/png' },
          { src: `${appScope}pwa-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
        navigateFallbackDenylist: [
          new RegExp(`^${routePrefix}/api(?:/|$)`),
          ...protectedRoutePatterns,
        ],
        runtimeCaching: [
          {
            urlPattern: /\/api\/tarot\/config$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'tarot-public-config',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 1, maxAgeSeconds: 24 * 60 * 60 },
              cacheableResponse: { statuses: [200] },
            },
          },
          {
            urlPattern: /\/api\/readings(?:\/|$)/,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
    ...(process.env.NODE_ENV !== 'production' &&
    process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, '..'),
            }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
