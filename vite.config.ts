import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    exclude: ['**/node_modules/**', '**/dist/**', '**/functions/lib/**', '**/cypress/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'firebase-admin/app': path.resolve(__dirname, './node_modules/firebase-admin/lib/esm/app/index.js'),
      'firebase-admin/auth': path.resolve(__dirname, './node_modules/firebase-admin/lib/esm/auth/index.js'),
      'firebase-admin/firestore': path.resolve(__dirname, './node_modules/firebase-admin/lib/esm/firestore/index.js'),
      'firebase-admin': path.resolve(__dirname, './node_modules/firebase-admin/lib/esm/index.js'),
    },
    dedupe: ['react', 'react-dom', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-dom/client', 'firebase-admin'],
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'react-dom/client',
      'react-router-dom',
      'lucide-react',
      'motion/react',
    ],
  },
  server: {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modify - file watching is disabled to prevent flickering during agent edits.
    hmr: false,
  },
  build: {
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1600,
    sourcemap: false,
    target: 'esnext',
    minify: false,
    modulePreload: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('three') || id.includes('@react-three')) {
              return '3d';
            }
            if (id.includes('leaflet') || id.includes('@turf') || id.includes('tokml')) {
              return 'maps';
            }
            if (id.includes('recharts')) {
              return 'charts';
            }
            if (id.includes('jspdf') || id.includes('html2canvas') || id.includes('html-to-image')) {
              return 'pdf';
            }
            if (id.includes('exceljs')) {
              return 'excel';
            }
            if (id.includes('@firebase/auth') || id.includes('firebase/auth')) {
              return 'firebase-auth';
            }
            if (id.includes('@firebase/firestore') || id.includes('firebase/firestore')) {
              return 'firebase-firestore';
            }
            if (id.includes('@firebase/storage') || id.includes('firebase/storage')) {
              return 'firebase-storage';
            }
            if (id.includes('motion')) {
              return 'motion';
            }
            if (id.includes('react-router')) {
              return 'router';
            }
            if (id.includes('lucide-react')) {
              return 'icons';
            }
          }
          if (id.includes('src/workflows/')) {
            return 'workflows-kernel';
          }
        },
      },
    },
  },
});
