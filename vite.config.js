import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: "App CUBE Escobar",
        short_name: "CUBEApp",
        description: 'Aplicación para gestión de barrios cerrados',
        start_url: '/',
        display: "standalone",
        background_color: "#ffffff",
        theme_color: "#000000",
        icons: [
          {
            src: "icon-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "icon-512x512.png",
            sizes: "512x512",
            type: "image/png"
          }
        ],
        screenshots: [
          {
            src: 'screenshot1.png',
            type: 'image/png',
            sizes: '540x720'
          },
          {
            src: 'screenshot2.png',
            type: 'image/png',
            sizes: '540x720'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg}'],
        globIgnores: ['**/node_modules/**/*', 'sw.js', 'workbox-*.js']
      }
    })
  ],
  build: {
    rollupOptions: {
      external: []
    }
  }
});
