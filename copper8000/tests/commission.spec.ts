/**
 * ค่าคอมรายเดือนแบบล็อกตัวเลข (โหมดสาธิต — กติกาเดียวกับ backend จริง)
 * - ค่าคอมล็อกตอนแอดมินยืนยันการจอง ไม่คำนวณย้อนหลัง
 * - ปรับ % มีผลวันที่ 1 ของเดือนถัดไป · เดือนที่ผ่านไปแล้ว = ปิดยอด ตัวเลขไม่เปลี่ยน
 * - ห้ามลบพนักงานภายใน 1 เดือนหลังมีค่าคอม · ลบ = ปิดใช้งาน ประวัติไม่หาย
 * ใช้ page.clock เลื่อนวันที่ เพื่อทดสอบการข้ามเดือนได้แน่นอน (ไม่ขึ้นกับวันที่รันเทส)
 */
import { expect, test, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('https://ipwho.is/**', (route) => route.fulfill({ json: { country_code: 'TH' } }));
});

const login = async (page: Page, email: string, password: string, path = '/login') => {
  await page.goto(path);
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.locator('form button[type="submit"]').click();
};

const logout = async (page: Page) => {
  await page.getByRole('button', { name: 'ออกจากระบบ' }).click();
  await expect(page).toHaveURL(/\/$/);
};

const openAgentsTab = async (page: Page) => {
  await page.goto('/admin');
  await page.getByRole('button', { name: 'พนักงาน', exact: true }).click();
};

test('ล็อกค่าคอมตอนยืนยัน · ปรับ % มีผลเดือนหน้า · ข้ามเดือนแล้วเดือนเก่าปิดยอด ตัวเลขไม่เปลี่ยน', async ({ page }) => {
  // 15 ต.ค. 2569 (seed: การจองทองแดงของลูกค้าเอเจนต์ ยืนยันแล้ว 2 วันก่อน = ต.ค.)
  await page.clock.setSystemTime(new Date('2026-10-15T10:00:00+07:00'));
  await login(page, 'admin@copper8000.co.th', 'admin1234');
  await expect(page).toHaveURL(/\/products/);

  // 1) แอดมินยืนยันการจองทองเหลือง 91,500 ของลูกค้าเอเจนต์ → ล็อก 3% = 2,745
  await page.goto('/admin');
  await page.getByRole('button', { name: 'ยืนยันการจอง', exact: true }).click();
  const brassRow = page.locator('tr', { hasText: 'ทองเหลืองหนา' });
  await brassRow.getByRole('button', { name: 'ยืนยัน', exact: true }).click();
  await expect(page.locator('.toast')).toBeVisible();
  // การจองที่มีค่าคอมล็อกแล้ว → ไม่มีปุ่มยกเลิก มีป้ายล็อกแทน
  await expect(brassRow.locator('.lock-chip')).toContainText('ค่าคอมล็อกแล้ว');
  await expect(brassRow.getByRole('button', { name: 'ยกเลิก', exact: true })).toHaveCount(0);

  // 2) ค่าคอมสะสม 16,920 + 2,745 = 19,665 · รายงานเดือน ต.ค. ยังไม่ปิดยอด
  await page.getByRole('button', { name: 'พนักงาน', exact: true }).click();
  const agentRow = page.locator('.agents-table tr', { hasText: 'AGENT1' });
  await expect(agentRow).toContainText('19,665');
  const report = page.locator('.commission-report');
  await expect(report.locator('.month-status')).toContainText('เดือนปัจจุบัน');
  await expect(report.locator('tr.total')).toContainText('19,665');

  // 3) ปรับเป็น 5% → มีผล 1 พ.ย. · ตัวเลขเดิมไม่เปลี่ยน · ลบยังไม่ได้ (มีค่าคอมใน 1 เดือน)
  await agentRow.locator('input[type="number"]').fill('5');
  await agentRow.getByRole('button', { name: 'บันทึก %' }).click();
  await expect(page.locator('.toast')).toContainText('มีผลตั้งแต่');
  await expect(agentRow).toContainText('เดือนหน้า 5%');
  await expect(agentRow).toContainText('19,665');
  await expect(agentRow.getByRole('button', { name: 'ลบ (ปิดใช้งาน)' })).toBeDisabled();
  await expect(agentRow).toContainText('ลบได้หลัง');

  // 4) ข้ามไป 3 พ.ย. → % ใหม่ (5%) มีผล · ต.ค. ปิดยอด ยัง 19,665 @ 3%
  await page.clock.setSystemTime(new Date('2026-11-03T10:00:00+07:00'));
  await openAgentsTab(page);
  await expect(agentRow.locator('.rate-current')).toContainText('5');
  await expect(agentRow).not.toContainText('เดือนหน้า');
  await expect(agentRow).toContainText('19,665');
  await expect(report).toContainText('ไม่มีค่าคอมในเดือนนี้'); // พ.ย. ยังไม่มีรายการ
  await report.locator('#comm-month').selectOption('2026-10');
  await expect(report.locator('.month-status')).toContainText('ปิดยอดแล้ว');
  await expect(report.locator('tr.total')).toContainText('19,665');
  await expect(report.locator('tbody tr', { hasText: 'AGENT1' })).toContainText('3%');
  await logout(page);

  // 5) เอเจนต์เห็นประวัติรายเดือน: ต.ค. 19,665 ปิดยอดแล้ว · อัตราปัจจุบัน 5%
  await login(page, 'agent@copper8000.co.th', 'agent1234', '/agent-login');
  await expect(page).toHaveURL(/\/agent/);
  await expect(page.locator('.agent-stat-card', { hasText: 'อัตราค่าคอม' })).toContainText('5');
  const oct = page.locator('.commission-history tr', { hasText: '19,665' });
  await expect(oct).toContainText('ปิดยอดแล้ว');
  await expect(oct).toContainText('3%');
});

test('ลบพนักงาน: ภายใน 1 เดือนลบไม่ได้ · พ้นแล้ว = ปิดใช้งาน (ล็อกอิน/รหัสแนะนำใช้ไม่ได้ ประวัติค่าคอมอยู่ครบ)', async ({ page }) => {
  await page.clock.setSystemTime(new Date('2026-10-15T10:00:00+07:00'));
  await login(page, 'admin@copper8000.co.th', 'admin1234');
  await expect(page).toHaveURL(/\/products/);
  await openAgentsTab(page);
  const agentRow = page.locator('.agents-table tr', { hasText: 'AGENT1' });
  await expect(agentRow.getByRole('button', { name: 'ลบ (ปิดใช้งาน)' })).toBeDisabled();

  // พ้น 30 วันหลังค่าคอมล่าสุด (13 ต.ค.) → ลบได้
  await page.clock.setSystemTime(new Date('2026-11-20T10:00:00+07:00'));
  await openAgentsTab(page);
  page.once('dialog', (d) => d.accept());
  await agentRow.getByRole('button', { name: 'ลบ (ปิดใช้งาน)' }).click();
  await expect(page.locator('.toast')).toContainText('ปิดใช้งานพนักงานแล้ว');
  await expect(agentRow).toContainText('ปิดใช้งานแล้ว');
  await expect(agentRow).toContainText('16,920'); // ประวัติค่าคอมยังอยู่
  await expect(agentRow.getByRole('button', { name: 'บันทึก %' })).toHaveCount(0);
  await logout(page);

  // พนักงานที่ปิดแล้วล็อกอินไม่ได้
  await login(page, 'agent@copper8000.co.th', 'agent1234', '/agent-login');
  await expect(page.locator('.error-box')).toContainText('ปิดใช้งาน');

  // รหัสแนะนำของพนักงานที่ปิดแล้วใช้สมัครไม่ได้
  await page.goto('/signup');
  await page.fill('#name', 'ลูกค้าใหม่');
  await page.fill('#phone', '089-000-1111');
  await page.fill('#email', 'closedref@test.co.th');
  await page.fill('#referral', 'AGENT1');
  await page.fill('#password', 'member1234');
  await page.fill('#confirm', 'member1234');
  await page.locator('form button[type="submit"]').click();
  await expect(page.locator('.error-box')).toContainText('ไม่ถูกต้อง');
});
