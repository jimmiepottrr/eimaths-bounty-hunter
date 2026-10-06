/**
 * ค่าคอมแบบล็อกตัวเลข (โหมดสาธิต — กติกาเดียวกับ backend จริง)
 * - % ค่าคอมล็อกตั้งแต่ตอนลูกค้าจอง: ปรับ % ทีหลังไม่กระทบการจองเดิม (ทั้งขายแล้วและยังรอขาย)
 * - ปรับ % มีผลทันทีกับการจองใหม่ · ค่าคอมนับเมื่อแอดมินยืนยัน
 * - ไม่มีการลบ: พนักงานปิด/เปิดใช้งานได้ · การจองยกเลิกได้ → ยังแสดง (สีเทา) แต่ไม่นำมาคำนวณ
 * - รายงานรายเดือน: เดือนที่ผ่านไปแล้ว = ปิดยอด
 * ใช้ page.clock กำหนดวันที่ เพื่อทดสอบการข้ามเดือนได้แน่นอน (ไม่ขึ้นกับวันที่รันเทส)
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

const loginAdmin = async (page: Page) => {
  await login(page, 'admin@copper8000.co.th', 'admin1234');
  await expect(page).toHaveURL(/\/products/);
};

const adminTab = async (page: Page, tab: string) => {
  await page.goto('/admin');
  await page.getByRole('button', { name: tab, exact: true }).click();
};

test('% ล็อกตอนจอง: จองก่อนปรับ % แล้วขายทีหลัง → ใช้ % เดิม · จองหลังปรับ → % ใหม่ · ยกเลิก = สีเทา ไม่นับ', async ({ page }) => {
  // 15 ต.ค. 2569 — seed: ลูกค้าเอเจนต์ (เดโม่) มีทองแดงขายแล้ว 564,000 และทองเหลือง 91,500 รอขาย (ทั้งคู่ล็อก 3%)
  await page.clock.setSystemTime(new Date('2026-10-15T10:00:00+07:00'));
  await loginAdmin(page);

  // 1) ปรับ 3% → 5% (มีผลทันทีกับการจองใหม่)
  await adminTab(page, 'พนักงาน');
  const agentRow = page.locator('.agents-table tr', { hasText: 'AGENT1' });
  await agentRow.locator('input[type="number"]').fill('5');
  await agentRow.getByRole('button', { name: 'บันทึก %' }).click();
  await expect(page.locator('.toast')).toContainText('มีผลกับการจองใหม่ทันที');
  await expect(agentRow).toContainText('16,920'); // รายการที่ขายแล้วไม่เปลี่ยน

  // 2) ขายทองเหลืองที่จองไว้ก่อนปรับ → ใช้ 3% ตอนจอง = 2,745 (ไม่ใช่ 5% = 4,575)
  await adminTab(page, 'ยืนยันการจอง');
  const brassRow = page.locator('tr', { hasText: 'ทองเหลืองหนา' });
  await brassRow.getByRole('button', { name: 'ยืนยัน', exact: true }).click();
  await expect(brassRow).toContainText('ได้รับการยืนยันแล้ว');
  await expect(brassRow.locator('.comm-tag')).toContainText('ค่าคอม 3%');
  await adminTab(page, 'พนักงาน');
  await expect(agentRow).toContainText('19,665'); // 16,920 + 2,745
  await logout(page);

  // 3) ลูกค้าจองใหม่หลังปรับ % → ล็อก 5% (100 กก. × 285 = 28,500 → ค่าคอม 1,425)
  await login(page, 'demo@copper8000.co.th', 'demo1234');
  await expect(page).toHaveURL(/\/products/);
  await page.getByRole('button', { name: /ทองแดงเงา/ }).click();
  const modal = page.locator('.modal');
  await modal.locator('#qty').fill('100');
  await modal.getByRole('button', { name: 'ถัดไป' }).click();
  await modal.getByRole('button', { name: 'ยืนยันการจอง' }).click();
  await expect(page).toHaveURL(/\/booking-report/);
  await logout(page);

  // 4) แอดมินยืนยัน → ค่าคอม 5% · รายงานเดือนนี้ใช้ 3% และ 5%
  await loginAdmin(page);
  await adminTab(page, 'ยืนยันการจอง');
  const newRow = page.locator('tr', { hasText: '100 กิโลกรัม' });
  await newRow.getByRole('button', { name: 'ยืนยัน', exact: true }).click();
  await expect(newRow).toContainText('ได้รับการยืนยันแล้ว');
  await expect(newRow.locator('.comm-tag')).toContainText('ค่าคอม 5%');
  await adminTab(page, 'พนักงาน');
  await expect(agentRow).toContainText('21,090'); // 19,665 + 1,425
  const report = page.locator('.commission-report');
  await expect(report.locator('tbody tr', { hasText: 'AGENT1' })).toContainText('3%, 5%');

  // 5) ยกเลิกรายการ 5% → ยังแสดงอยู่ (สีเทา) แต่ไม่นำมาคำนวณ
  await adminTab(page, 'ยืนยันการจอง');
  page.once('dialog', (d) => d.accept());
  await newRow.getByRole('button', { name: 'ยกเลิก', exact: true }).click();
  await expect(newRow).toHaveClass(/row-cancelled/);
  await expect(newRow).toContainText('ยกเลิก');
  await adminTab(page, 'พนักงาน');
  await expect(agentRow).toContainText('19,665');
  await expect(report.locator('tr.total')).toContainText('19,665');

  // 6) ข้ามไป 3 พ.ย. → ต.ค. ปิดยอด ยัง 19,665 @ 3%
  await page.clock.setSystemTime(new Date('2026-11-03T10:00:00+07:00'));
  await adminTab(page, 'พนักงาน');
  await expect(report).toContainText('ไม่มีค่าคอมในเดือนนี้');
  await report.locator('#comm-month').selectOption('2026-10');
  await expect(report.locator('.month-status')).toContainText('ปิดยอดแล้ว');
  await expect(report.locator('tr.total')).toContainText('19,665');
  await logout(page);

  // 7) ลูกค้าเห็นรายการที่ยกเลิกเป็นสีเทาในประวัติการจองของตัวเอง
  await login(page, 'demo@copper8000.co.th', 'demo1234');
  await expect(page).toHaveURL(/\/products/);
  await page.goto('/booking-report');
  await expect(page.locator('tr', { hasText: '28,500' })).toHaveClass(/row-cancelled/);
  await logout(page);

  // 8) เอเจนต์: อัตราปัจจุบัน 5% · ประวัติ ต.ค. 19,665 ปิดยอดแล้ว
  await login(page, 'agent@copper8000.co.th', 'agent1234', '/agent-login');
  await expect(page).toHaveURL(/\/agent/);
  await expect(page.locator('.agent-stat-card', { hasText: 'อัตราค่าคอม' })).toContainText('5');
  const oct = page.locator('.commission-history tr', { hasText: '19,665' });
  await expect(oct).toContainText('ปิดยอดแล้ว');
});

test('ไม่มีการลบ: ปิดใช้งานพนักงาน → ล็อกอิน/รหัสแนะนำใช้ไม่ได้ · ข้อมูลอยู่ครบ (สีเทา) · เปิดกลับได้', async ({ page }) => {
  await loginAdmin(page);
  await adminTab(page, 'พนักงาน');
  const table = page.locator('.agents-table');
  const agentRow = table.locator('tr', { hasText: 'AGENT1' });
  await expect(table.getByRole('button', { name: /ลบ/ })).toHaveCount(0); // ไม่มีปุ่มลบ

  page.once('dialog', (d) => d.accept());
  await agentRow.getByRole('button', { name: 'ปิดใช้งาน', exact: true }).click();
  await expect(page.locator('.toast')).toContainText('ปิดใช้งานพนักงานแล้ว');
  await expect(agentRow).toHaveClass(/agent-row-disabled/);
  await expect(agentRow).toContainText('ปิดใช้งานอยู่');
  await expect(agentRow).toContainText('16,920'); // ประวัติค่าคอมอยู่ครบ
  await logout(page);

  // ล็อกอินไม่ได้
  await login(page, 'agent@copper8000.co.th', 'agent1234', '/agent-login');
  await expect(page.locator('.error-box')).toContainText('ปิดใช้งาน');

  // รหัสแนะนำใช้สมัครไม่ได้
  await page.goto('/signup');
  await page.fill('#name', 'ลูกค้าใหม่');
  await page.fill('#phone', '089-000-1111');
  await page.fill('#email', 'closedref@test.co.th');
  await page.fill('#referral', 'AGENT1');
  await page.fill('#password', 'member1234');
  await page.fill('#confirm', 'member1234');
  await page.locator('form button[type="submit"]').click();
  await expect(page.locator('.error-box')).toContainText('ไม่ถูกต้อง');

  // เปิดใช้งานกลับ → ล็อกอินได้ตามเดิม
  await loginAdmin(page);
  await adminTab(page, 'พนักงาน');
  await agentRow.getByRole('button', { name: 'เปิดใช้งานอีกครั้ง' }).click();
  await expect(page.locator('.toast')).toContainText('เปิดใช้งานพนักงานอีกครั้งแล้ว');
  await expect(agentRow).not.toHaveClass(/agent-row-disabled/);
  await logout(page);
  await login(page, 'agent@copper8000.co.th', 'agent1234', '/agent-login');
  await expect(page).toHaveURL(/\/agent/);
});
