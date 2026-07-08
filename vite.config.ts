import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { createRequire } from "module";
import { VitePWA } from 'vite-plugin-pwa';

const require = createRequire(import.meta.url);

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const plugins = [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'SmartFit AI - Training Hub',
        short_name: 'SmartFit AI',
        description: 'AI-Powered Personal Training & Smart Fitness Hub',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'standalone',
        icons: [
          {
            src: 'favicon.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'favicon.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'favicon.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 3000000, // Limit to 3MB per file
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'], // Exclude MP4 files from startup pre-cache
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/images\.unsplash\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'unsplash-images',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 Days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: false // Disable service worker in dev mode to speed up local loads/reloads
      }
    })
  ];

  // Only include lovable-tagger in development mode
  if (mode === "development") {
    try {
      const { componentTagger } = require("lovable-tagger");
      plugins.push(componentTagger());
    } catch (e) {
      // Silently ignore if lovable-tagger is not available
      // This is expected in production builds
    }
  }

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@mediapipe/pose": path.resolve(__dirname, "./src/lib/mediapipe-pose.ts"),
      },
    },
    optimizeDeps: {
      exclude: [
        "@mediapipe/pose",
        "@tensorflow-models/pose-detection",
        "@tensorflow/tfjs-backend-webgpu",
      ],
    },
    build: {
      // Increase chunk size warning limit
      chunkSizeWarningLimit: 1000,
    },
  };
});
