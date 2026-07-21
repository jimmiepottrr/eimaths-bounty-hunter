/**
 * เทสมุมมองมือถือ (390px): เฮดเดอร์กะทัดรัด, แฮมเบอร์เกอร์, ตัวเลือกภาษาแบบรหัส (TH)
 */

import { expect, test, type Page } from '@playwright/test';

test.use({ viewport: { width: 390, height: 844 } });

const stubGeo = (page: Page) =>
  page.route('https://ipwho.is/**', (route) => route.fulfill({ json: { country_code: 'TH' } }));

test('มือถือ: เฮดเดอร์เตี้ย + ภาษาโชว์เฉพาะรหัส + แฮมเบอร์เกอร์นำทางได้', async ({ page }) => {
  await stubGeo(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'ราคารับซื้อโลหะวันนี้' })).toBeVisible();

  // ตัวเลือกภาษาแบบย่อ (รหัส) แสดง / แบบเต็มซ่อน
  await expect(page.locator('.lang-select-code')).toBeVisible();
  await expect(page.locator('.lang-select-full')).toBeHidden();
  await expect(page.locator('.lang-select-code')).toHaveValue('th');

  // แถบแท็บเดสก์ท็อปซ่อน + เฮดเดอร์ไม่กินครึ่งจอ
  await expect(page.locator('.tabs-band')).toBeHidden();
  const headerBox = await page.locator('.topbar').boundingBox();
  expect(headerBox!.height).toBeLessThan(120);

  // แฮมเบอร์เกอร์เปิดเมนู → นำทางไปหน้าสินค้า → เมนูปิดเอง
  await page.locator('.hamburger').click();
  await page.locator('.mobile-menu').getByRole('link', { name: 'สินค้า' }).click();
  await expect(page).toHaveURL(/#\/products/);
  await expect(page.locator('.mobile-menu')).toHaveCount(0);

  // สลับภาษาผ่านตัวเลือกแบบรหัส → เป็นอังกฤษ
  await page.locator('.lang-select-code').selectOption('en');
  await expect(page.getByRole('heading', { name: 'Products — Buying Prices' })).toBeVisible();
});

test('มือถือ: login แล้วมีเมนูข้อมูลผู้ใช้ในแฮมเบอร์เกอร์', async ({ page }) => {
  await stubGeo(page);
  await page.goto('/#/login');
  await page.fill('#email', 'demo@copper8000.co.th');
  await page.fill('#password', 'demo1234');
  await page.locator('form button[type="submit"]').click();
  await expect(page).toHaveURL(/#\/products/);

  await page.locator('.hamburger').click();
  await page.locator('.mobile-menu').getByRole('link', { name: 'ข้อมูลผู้ใช้' }).click();
  await expect(page).toHaveURL(/#\/profile/);
  await expect(page.getByText('demo@copper8000.co.th')).toBeVisible();
});
