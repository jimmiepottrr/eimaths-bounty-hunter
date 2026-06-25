import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? '/eimaths-bounty-hunter/' : '/',
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
}));
