import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:5174',
    locale: 'th-TH',
    // สภาพแวดล้อม remote มี Chromium ติดตั้งไว้แล้ว — ใช้ตัวนั้นแทนการดาวน์โหลดใหม่
    ...(process.env.PW_CHROMIUM_PATH ? { launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH } } : {}),
  },
  webServer: {
    command: 'npm run dev',
    port: 5174,
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
