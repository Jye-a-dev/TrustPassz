import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';

/**
 * Vite Configuration for TrustPassz Mobile Web Assets (mb_user)
 * Optimized for Capacitor WebView rendering, zero-console leakage, and granular chunk splitting.
 */
export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';

  return {
    plugins: [
      react(),
      // Bundle visualizer report generated only for production inspection
      visualizer({
        filename: 'dist/bundle-analysis.html',
        open: false,
        gzipSize: true,
        brotliSize: true,
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: !isProd,
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: isProd,
          drop_debugger: isProd,
          pure_funcs: isProd
            ? ['console.log', 'console.info', 'console.debug', 'console.trace']
            : [],
        },
        format: {
          comments: false,
        },
      },
      chunkSizeWarningLimit: 600,
      reportCompressedSize: true,
      rollupOptions: {
        output: {
          // Manual chunk segregation to avoid monolith JS bundle in WebView
          manualChunks(id: string) {
            if (id.includes('@capacitor/') || id.includes('@capacitor-community/')) {
              return 'vendor-capacitor';
            }
            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/scheduler/')
            ) {
              return 'vendor-react';
            }
            if (
              id.includes('node_modules/lucide-react/') ||
              id.includes('node_modules/motion/') ||
              id.includes('node_modules/framer-motion/')
            ) {
              return 'vendor-ui';
            }
            if (id.includes('node_modules')) {
              return 'vendor-core';
            }
          },
          entryFileNames: 'assets/[name].[hash].js',
          chunkFileNames: 'assets/[name].[hash].js',
          assetFileNames: 'assets/[name].[hash].[ext]',
        },
      },
    },
  };
});

