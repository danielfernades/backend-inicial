import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';

const __dirname = path.dirname(fileURLToPath(new URL(import.meta.url)));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor:       ['react', 'react-dom'],
            motion:       ['framer-motion', 'motion'],
            transformers: ['@xenova/transformers'],
          }
        }
      }
    },
    define: {
      'process.env.GEMINI_API_KEY':         JSON.stringify(env.GEMINI_API_KEY),
      'process.env.VITE_STRIPE_PUBLIC_KEY': JSON.stringify(env.VITE_STRIPE_PUBLIC_KEY),
      'process.env.APP_URL':                JSON.stringify(env.APP_URL),
    },
    resolve: {
      alias: { '@': path.resolve(__dirname, '.') },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: { '/api': { target: 'http://localhost:3000', changeOrigin: true } }
    },
  };
});
