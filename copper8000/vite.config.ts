import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// dev = '/' · production = subpath ใต้ GitHub Pages ของ repo (deploy ไปที่ dist/copper8000)
export default defineConfig(({ mode }) => ({
  base: mode === 'development' ? '/' : '/eimaths-bounty-hunter/copper8000/',
  plugins: [react()],
  server: {
    port: 5174,
  },
  build: {
    outDir: 'dist',
  },
}));
