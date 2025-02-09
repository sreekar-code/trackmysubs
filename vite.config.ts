import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // Optimize chunk splitting
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase': ['@supabase/supabase-js'],
          'icons': ['lucide-react'],
          'utils': ['./src/lib/auth.ts', './src/lib/supabase.ts'],
          'contexts': ['./src/contexts/CurrencyContext.tsx']
        }
      }
    },
    // Optimize build
    target: 'esnext',
    minify: 'esbuild',
    cssMinify: true,
    cssCodeSplit: true
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@supabase/supabase-js', 'lucide-react']
  },
  // Enable build caching
  cacheDir: 'node_modules/.vite',
  // Add compression
  server: {
    port: 53371,
    host: '0.0.0.0',
    headers: {
      'Cache-Control': 'public, max-age=31536000'
    }
  }
});