import { defineConfig } from '@playwright/test';

/**
 * QA ตาม Definition of Done ข้อ 1: เล่นจบครบลูปทั้ง 4 ชั้น บนจอ 390px
 * Mock API ที่ /api/** — contract ตรงตาม COWORK-BRIEF ข้อ 2
 */
export default defineConfig({
  testDir: './tests',
  timeout: 120_000,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 390, height: 844 }, // จอมือถือตามมาตรฐาน QA ของ Jim
    launchOptions: {
      executablePath: '/opt/pw-browsers/chromium',
    },
  },
  webServer: {
    command:
      'VITE_API_BASE=/api VITE_API_KEY=test-app-key npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173/eimaths-bounty-hunter/',
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
