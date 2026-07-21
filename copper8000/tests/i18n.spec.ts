/**
 * เทสระบบหลายภาษา (mock adapter): สลับภาษา + จำค่า, geo-detect, แอดมินเพิ่ม/ปิดภาษา
 */

import { expect, test, type Page } from '@playwright/test';

const stubGeo = (page: Page, countryCode: string) =>
  page.route('https://ipwho.is/**', (route) => route.fulfill({ json: { country_code: countryCode } }));

const loginAdmin = async (page: Page) => {
  await page.goto('/#/login');
  await page.fill('#email', 'admin@copper8000.co.th');
  await page.fill('#password', 'admin1234');
  await page.locator('form button[type="submit"]').click();
  await expect(page).toHaveURL(/#\/products/);
};

test('สลับภาษาเป็น English ที่ขวาบน แล้ว reload ยังจำภาษาอยู่', async ({ page }) => {
  await stubGeo(page, 'TH');
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'ราคารับซื้อโลหะวันนี้' })).toBeVisible();

  await page.locator('.lang-select-full').selectOption('en');
  await expect(page.getByRole('heading', { name: "Today's Metal Buying Prices" })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Products' })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: "Today's Metal Buying Prices" })).toBeVisible();
});

test('เข้าครั้งแรกจาก IP จีน → เริ่มเป็นภาษาจีนอัตโนมัติ', async ({ page }) => {
  await stubGeo(page, 'CN');
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '今日金属收购价格' })).toBeVisible();
});

test('เข้าครั้งแรกจาก IP อเมริกา → เริ่มเป็นภาษาอังกฤษ', async ({ page }) => {
  await stubGeo(page, 'US');
  await page.goto('/');
  await expect(page.getByRole('heading', { name: "Today's Metal Buying Prices" })).toBeVisible();
});

test('หน้าข้อมูลบริษัทแสดงครบ 3 ภาษา', async ({ page }) => {
  await stubGeo(page, 'TH');
  await page.goto('/#/company');
  await expect(page.getByRole('heading', { name: 'เกี่ยวกับเรา' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'บริการของเรา' })).toBeVisible();

  await page.locator('.lang-select-full').selectOption('en');
  await expect(page.getByRole('heading', { name: 'About Us', exact: true })).toBeVisible();
  await expect(page.getByText('Registration no.')).toBeVisible();

  await page.locator('.lang-select-full').selectOption('zh');
  await expect(page.getByRole('heading', { name: '关于我们' })).toBeVisible();
  await expect(page.getByText('注册资本')).toBeVisible();
});

test('แอดมิน: เพิ่มภาษาใหม่ / ภาษาหลักไม่มีปุ่มลบ / ปิดภาษาแล้วหายจาก picker', async ({ page }) => {
  await stubGeo(page, 'TH');
  await loginAdmin(page);
  await page.goto('/#/admin');
  await page.getByRole('button', { name: 'ภาษา', exact: true }).click();

  // ภาษา built-in (th) ต้องไม่มีปุ่มลบ
  const thRow = page.locator('tr', { hasText: 'ไทย' });
  await expect(thRow.getByRole('button', { name: 'ลบ' })).toHaveCount(0);

  // เพิ่มภาษาญี่ปุ่น (dict บางส่วน — key ที่เหลือ fallback เป็นอังกฤษ)
  await page.fill('#lang-code', 'ja');
  await page.fill('#lang-name', '日本語');
  await page.fill('#lang-dict', JSON.stringify({ 'home.title': '本日の金属買取価格' }));
  await page.getByRole('button', { name: 'เพิ่มภาษา', exact: true }).click();
  await expect(page.locator('tr', { hasText: '日本語' })).toBeVisible();

  // ภาษาใหม่โผล่ใน picker และใช้งานได้จริง (hero โชว์เฉพาะตอนยังไม่ login — logout ก่อนตรวจ)
  await page.locator('.lang-select-full').selectOption('ja');
  await page.getByRole('button', { name: 'Log out', exact: true }).click();
  await page.goto('/#/');
  await expect(page.getByRole('heading', { name: '本日の金属買取価格' })).toBeVisible();

  // กลับเป็นไทย + login admin ใหม่ → ปิดภาษาจีน → หายจาก picker
  await page.locator('.lang-select-full').selectOption('th');
  await loginAdmin(page);
  await page.goto('/#/admin');
  await page.getByRole('button', { name: 'ภาษา', exact: true }).click();
  const zhRow = page.locator('tr', { hasText: '中文(简体)' });
  await zhRow.getByRole('button', { name: 'ปิด', exact: true }).click();
  await expect(zhRow.locator('.badge-pending')).toBeVisible();
  await expect(page.locator('.lang-select-full option[value="zh"]')).toHaveCount(0);

  // ลบภาษาญี่ปุ่นที่เพิ่มเอง
  page.on('dialog', (d) => d.accept());
  const jaRow = page.locator('tr', { hasText: '日本語' });
  await jaRow.getByRole('button', { name: 'ลบ', exact: true }).click();
  await expect(page.locator('tr', { hasText: '日本語' })).toHaveCount(0);
});
