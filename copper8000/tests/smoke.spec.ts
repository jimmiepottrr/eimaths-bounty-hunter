/**
 * Smoke test โหมดสาธิต (mock adapter ใน localStorage — context ใหม่ = ข้อมูล seed ใหม่)
 * ไล่ครบ flow หลัก: ดูราคา → สมัคร → โดนบล็อกจอง → แอดมินอนุมัติ → จอง → รายงาน → แอดมินยืนยัน
 */

import { expect, test, type Page } from '@playwright/test';

const NEW_EMAIL = 'newuser@test.co.th';
const NEW_PASSWORD = 'test1234';
const NEW_NAME = 'ทดสอบ อัตโนมัติ';

const login = async (page: Page, email: string, password: string) => {
  await page.goto('/#/login');
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.locator('form button[type="submit"]').click();
  await expect(page).toHaveURL(/#\/products/);
};

const logout = async (page: Page) => {
  await page.getByRole('button', { name: 'ออกจากระบบ' }).click();
  await expect(page).toHaveURL(/#\/$/);
};

test('หน้าแรกแสดงบอร์ดราคาครบ 3 กลุ่ม และกดแถวราคาไม่ได้', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'ราคารับซื้อโลหะวันนี้' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'ทองแดง', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'ทองเหลือง', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'อลูมิเนียม', exact: true })).toBeVisible();
  await expect(page.getByText('ทองแดงเงา (เบอร์ 1)').first()).toBeVisible();
  // แถวหน้าแรกไม่ใช่ปุ่ม — ไม่มี modal เปิดขึ้น
  await page.getByText('ทองแดงเงา (เบอร์ 1)').first().click();
  await expect(page.locator('.modal')).toHaveCount(0);
});

test('flow ครบวงจร: สมัคร → รออนุมัติ → แอดมินอนุมัติ → จอง (default ตัน) → รายงาน → แอดมินยืนยัน', async ({
  page,
}) => {
  // 1) สมัครสมาชิกใหม่ → ขึ้นข้อความรอการอนุมัติ
  await page.goto('/#/signup');
  await page.fill('#name', NEW_NAME);
  await page.fill('#phone', '089-999-9999');
  await page.fill('#email', NEW_EMAIL);
  await page.fill('#password', NEW_PASSWORD);
  await page.fill('#confirm', NEW_PASSWORD);
  await page.locator('form button[type="submit"]').click();
  await expect(page.getByText('รอการอนุมัติจากแอดมิน')).toBeVisible();

  // 2) ยังไม่อนุมัติ → แตะสินค้าแล้วโดนบล็อก
  await page.goto('/#/products');
  await page.getByRole('button', { name: /ทองแดงเงา/ }).click();
  await expect(page.locator('.toast')).toContainText('รอการอนุมัติ');
  await expect(page.locator('.modal')).toHaveCount(0);
  await logout(page);

  // 3) แอดมินอนุมัติสมาชิกใหม่
  await login(page, 'admin@copper8000.co.th', 'admin1234');
  await page.goto('/#/admin');
  const userRow = page.locator('tr', { hasText: NEW_EMAIL });
  await userRow.getByRole('button', { name: 'อนุมัติ', exact: true }).click();
  await expect(page.locator('tr', { hasText: NEW_EMAIL })).toHaveCount(0);
  await logout(page);

  // 4) ผู้ใช้ใหม่จองสินค้า — modal default หน่วยตัน
  await login(page, NEW_EMAIL, NEW_PASSWORD);
  await page.getByRole('button', { name: /ทองแดงเงา/ }).click();
  const modal = page.locator('.modal');
  await expect(modal).toBeVisible();
  await expect(modal.locator('.unit-choice label.selected')).toHaveText(/ตัน/);
  await modal.locator('#qty').fill('2');
  await modal.getByRole('button', { name: 'ยืนยันการจอง' }).click();

  // 5) เด้งไปหน้ารายงานการจอง — มีแถวใหม่สถานะ "รอการยืนยัน"
  await expect(page).toHaveURL(/#\/booking-report/);
  const bookingRow = page.locator('tr', { hasText: 'ทองแดงเงา' });
  await expect(bookingRow).toContainText('2 ตัน');
  await expect(bookingRow).toContainText('รอการยืนยัน');
  await logout(page);

  // 6) แอดมินยืนยันการจอง → ผู้ใช้เห็น "ได้รับการยืนยันแล้ว"
  await login(page, 'admin@copper8000.co.th', 'admin1234');
  await page.goto('/#/admin');
  await page.getByRole('button', { name: 'ยืนยันการจอง' }).click();
  const adminBookingRow = page.locator('tr', { hasText: NEW_NAME });
  await adminBookingRow.getByRole('button', { name: 'ยืนยัน', exact: true }).click();
  await expect(adminBookingRow.locator('.badge-confirmed')).toBeVisible();
  await logout(page);

  await login(page, NEW_EMAIL, NEW_PASSWORD);
  await page.goto('/#/booking-report');
  await expect(page.locator('tr', { hasText: 'ทองแดงเงา' })).toContainText('ได้รับการยืนยันแล้ว');
});

test('ติดต่อบริษัท: มีลิงก์ Google Maps และแผนที่', async ({ page }) => {
  await page.goto('/#/contact');
  await expect(page.getByRole('heading', { name: 'ติดต่อบริษัท' })).toBeVisible();
  await expect(page.locator('a[href*="google.com/maps"]').first()).toBeVisible();
  await expect(page.locator('iframe.map-frame')).toBeVisible();
});
