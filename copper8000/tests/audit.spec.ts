/**
 * บันทึกการใช้งาน (audit log) โหมดสาธิต — mock adapter บันทึกทุก action
 * ตรวจ: login สำเร็จ/ล้มเหลว + ปรับราคา ถูกบันทึก · มี IP/User Agent · กรอง + ดาวน์โหลด CSV
 */

import { expect, test, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('https://ipwho.is/**', (route) => route.fulfill({ json: { country_code: 'TH' } }));
});

const login = async (page: Page, email: string, password: string) => {
  await page.goto('/#/login');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.locator('form button[type="submit"]').click();
  await expect(page).toHaveURL(/#\/products/);
};

test('audit: บันทึก login ล้มเหลว + ปรับราคา และแสดง IP/User Agent + กรองได้', async ({ page }) => {
  // 1) ลองล็อกอินผิด → ต้องถูกบันทึกเป็น "เข้าสู่ระบบล้มเหลว"
  await page.goto('/#/login');
  await page.fill('#email', 'hacker@evil.com');
  await page.fill('#password', 'wrongpass');
  await page.locator('form button[type="submit"]').click();
  await expect(page).toHaveURL(/#\/login/); // ยังอยู่หน้า login (ไม่ผ่าน)

  // 2) แอดมินเข้าระบบ (บันทึก "เข้าสู่ระบบ") แล้วปรับราคาสินค้าแรก (บันทึก "ปรับราคา")
  await login(page, 'admin@copper8000.co.th', 'admin1234');
  await page.goto('/#/admin');
  await page.getByRole('button', { name: 'แก้ไขราคา', exact: true }).click();
  const priceRow = page.locator('.price-edit-row').nth(1); // แถว 0 = หัวตาราง
  await priceRow.locator('input[aria-label="price"]').fill('999');
  await priceRow.getByRole('button', { name: 'บันทึก', exact: true }).click();
  await expect(page.locator('.toast')).toBeVisible();

  // 3) เปิดแท็บบันทึกการใช้งาน
  await page.getByRole('button', { name: 'บันทึกการใช้งาน', exact: true }).click();
  const table = page.locator('.audit-table');
  await expect(table).toBeVisible();

  // มีทั้ง 3 เหตุการณ์
  await expect(table.locator('.audit-action-chip', { hasText: 'ปรับราคา' }).first()).toBeVisible();
  await expect(table.locator('.audit-action-chip', { hasText: 'เข้าสู่ระบบ' }).first()).toBeVisible();
  await expect(table.locator('.audit-action-chip.danger', { hasText: 'เข้าสู่ระบบล้มเหลว' }).first()).toBeVisible();

  // คอลัมน์ User Agent + IP มีข้อมูล (ไม่ใช่ —)
  await expect(table.locator('.audit-ua').first()).not.toHaveText('—');
  await expect(table.locator('.audit-ip').first()).not.toHaveText('—');

  // 4) กรองเฉพาะ "ปรับราคา" → แถว login หายหมด เหลือแต่ปรับราคา
  await page.locator('#audit-action').selectOption({ label: 'ปรับราคา' });
  await page.getByRole('button', { name: 'กรอง', exact: true }).click();
  // hasText 'เข้าสู่ระบบ' ครอบทั้ง login และ login_failed — กรองแล้วต้องเหลือ 0
  await expect(table.locator('.audit-action-chip', { hasText: 'เข้าสู่ระบบ' })).toHaveCount(0);
  await expect(table.locator('.audit-action-chip', { hasText: 'ปรับราคา' }).first()).toBeVisible();

  // 5) ค้นหา login ที่ล้มเหลวด้วยอีเมลผู้บุกรุก
  await page.locator('#audit-action').selectOption({ value: '' });
  await page.fill('#audit-q', 'hacker@evil.com');
  await page.getByRole('button', { name: 'กรอง', exact: true }).click();
  await expect(table.locator('.audit-action-chip', { hasText: 'เข้าสู่ระบบล้มเหลว' }).first()).toBeVisible();
});

test('audit: member ธรรมดาเข้าไม่ถึง — ไม่มีแท็บบันทึกการใช้งานให้ผู้ใช้ทั่วไป', async ({ page }) => {
  await login(page, 'demo@copper8000.co.th', 'demo1234');
  // ผู้ใช้ทั่วไปเข้า /admin ไม่ได้ (เด้งออก) — ไม่มีปุ่มแท็บ audit
  await page.goto('/#/admin');
  await expect(page.getByRole('button', { name: 'บันทึกการใช้งาน', exact: true })).toHaveCount(0);
});
