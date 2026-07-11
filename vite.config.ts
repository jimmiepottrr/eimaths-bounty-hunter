import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // dev = '/' · build + preview (production) = base ของ GitHub Pages เหมือนเดิม
  base: mode === 'development' ? '/' : '/eimaths-bounty-hunter/',
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
}));
