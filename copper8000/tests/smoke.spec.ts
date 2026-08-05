/**
 * Smoke test โหมดสาธิต (mock adapter ใน localStorage — context ใหม่ = ข้อมูล seed ใหม่)
 * ไล่ครบ flow หลัก: ดูราคา → สมัคร → โดนบล็อกจอง → แอดมินอนุมัติ → จอง → รายงาน → แอดมินยืนยัน
 */

import { expect, test, type Page } from '@playwright/test';

// stub geo-IP ให้เป็นไทยเสมอ — กันเทสเปลี่ยนภาษาเองตามตำแหน่งเครื่องที่รัน CI
test.beforeEach(async ({ page }) => {
  await page.route('https://ipwho.is/**', (route) =>
    route.fulfill({ json: { country_code: 'TH' } }),
  );
});

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
  await expect(page.getByRole('heading', { name: 'ทองแดง', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'ทองเหลือง', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'อลูมิเนียม', exact: true })).toBeVisible();
  await expect(page.getByText('ทองแดงเงา (เบอร์ 1)').first()).toBeVisible();
  // แถวหน้าแรกไม่ใช่ปุ่ม — ไม่มี modal เปิดขึ้น
  await page.getByText('ทองแดงเงา (เบอร์ 1)').first().click();
  await expect(page.locator('.modal')).toHaveCount(0);
});

test('flow ครบวงจร: สมัคร → รออนุมัติ → แอดมินอนุมัติ → จอง (กก. + ตรวจสอบ 2 สเต็ป) → รายงาน → แอดมินยืนยัน', async ({
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

  // 4) ผู้ใช้ใหม่จองสินค้า — หน่วยกิโลกรัม, จำนวนเริ่มว่าง, ต้องตรวจสอบอีก 1 สเต็ป
  await login(page, NEW_EMAIL, NEW_PASSWORD);
  await page.getByRole('button', { name: /ทองแดงเงา/ }).click();
  const modal = page.locator('.modal');
  await expect(modal).toBeVisible();
  await expect(modal.locator('#qty')).toHaveValue(''); // จำนวนเริ่มว่าง
  await expect(modal.locator('.unit-choice')).toHaveCount(0); // ไม่มีตัวเลือกหน่วยแล้ว
  await modal.locator('#qty').fill('2000');
  await modal.getByRole('button', { name: 'ถัดไป' }).click();
  // สเต็ปตรวจสอบ (double check) — โชว์สรุปก่อนยืนยัน
  await expect(modal.getByText('ตรวจสอบก่อนยืนยัน')).toBeVisible();
  await expect(modal.locator('.review-row.total')).toContainText('570,000');
  await modal.getByRole('button', { name: 'ยืนยันการจอง' }).click();

  // 5) เด้งไปหน้ารายงานการจอง — มีแถวใหม่สถานะ "รอการยืนยัน"
  await expect(page).toHaveURL(/#\/booking-report/);
  const bookingRow = page.locator('tr', { hasText: 'ทองแดงเงา' });
  await expect(bookingRow).toContainText('2,000 กิโลกรัม');
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

test('role พนักงาน (agent): login แล้วแถบหัวขึ้นป้าย "พนักงาน" · ไม่มีแท็บแอดมิน · เข้า /admin ไม่ได้', async ({
  page,
}) => {
  await login(page, 'agent@copper8000.co.th', 'agent1234');
  // แถบหัวแสดง role ว่าเป็น "พนักงาน" (ไม่ใช่ "อนุมัติแล้ว" ของลูกค้า)
  await expect(page.locator('a.userbox .status')).toHaveText('พนักงาน');
  // agent ไม่เห็นแท็บแอดมิน
  await expect(page.getByRole('link', { name: 'แอดมิน' })).toHaveCount(0);
  // เข้า /admin ตรงๆ ก็ถูก redirect ออก (เฉพาะแอดมินเท่านั้น)
  await page.goto('/#/admin');
  await expect(page).toHaveURL(/#\/$/);
});

test('แอดมินสร้างพนักงาน → พนักงานล็อกอินผ่านหน้า login พนักงาน · เห็นมุมมองพนักงาน · จองไม่ได้', async ({
  page,
}) => {
  const AGENT_EMAIL = 'newagent@copper8000.co.th';
  const AGENT_PW = 'agent5678';

  // แอดมินสร้างบัญชีพนักงานจากแท็บ "พนักงาน"
  await login(page, 'admin@copper8000.co.th', 'admin1234');
  await page.goto('/#/admin');
  await page.getByRole('button', { name: 'พนักงาน', exact: true }).click();
  await page.fill('#agent-name', 'พนักงานใหม่ ทดสอบ');
  await page.fill('#agent-email', AGENT_EMAIL);
  await page.fill('#agent-phone', '081-000-0009');
  await page.fill('#agent-password', AGENT_PW);
  await page.getByRole('button', { name: 'สร้างบัญชีพนักงาน' }).click();
  await expect(page.locator('tr', { hasText: AGENT_EMAIL })).toBeVisible();
  await logout(page);

  // พนักงานล็อกอินผ่านหน้า login พนักงานแยกต่างหาก
  await page.goto('/#/agent-login');
  await page.fill('#email', AGENT_EMAIL);
  await page.fill('#password', AGENT_PW);
  await page.locator('form button[type="submit"]').click();
  await expect(page).toHaveURL(/#\/agent/);
  await expect(page.locator('a.userbox .status')).toHaveText('พนักงาน');

  // แตะสินค้า → ไม่มี modal จอง (พนักงานดูราคาอย่างเดียว)
  await page.goto('/#/products');
  await page.getByRole('button', { name: /ทองแดงเงา/ }).click();
  await expect(page.locator('.modal')).toHaveCount(0);
});

test('หน้า login พนักงาน: ผู้ใช้ทั่วไปถูกปฏิเสธ (ไม่พาเข้าระบบ)', async ({ page }) => {
  await page.goto('/#/agent-login');
  await page.fill('#email', 'demo@copper8000.co.th');
  await page.fill('#password', 'demo1234');
  await page.locator('form button[type="submit"]').click();
  await expect(page.locator('.error-box')).toContainText('ไม่ใช่พนักงาน');
  await expect(page).toHaveURL(/#\/agent-login/);
});

test('พนักงาน (agent) เห็นค่าคอมของตัวเอง: รหัสแนะนำ + ยอดยืนยัน + ค่าคอม 3% × 564,000 = 16,920', async ({
  page,
}) => {
  await login(page, 'agent@copper8000.co.th', 'agent1234');
  // มีแท็บ "พนักงานขาย" ในเมนู → เข้าหน้า /agent
  await page.goto('/#/agent');
  await expect(page.getByRole('heading', { name: 'ค่าคอมมิชชั่นของฉัน' })).toBeVisible();
  // รหัสแนะนำ + อัตรา + ยอดยืนยัน + ค่าคอม (คำนวณฝั่งระบบ)
  await expect(page.locator('.agent-stat-card', { hasText: 'รหัสแนะนำของฉัน' })).toContainText('AGENT1');
  await expect(page.locator('.agent-stat-card.highlight')).toContainText('16,920');
  await expect(page.getByText('564,000').first()).toBeVisible();
  // ลูกค้าที่ผูก (เดโม่) โผล่ในรายชื่อลูกค้าของฉัน
  await expect(page.locator('tr', { hasText: 'คุณเดโม่' })).toBeVisible();
});

test('แอดมินตั้ง % ค่าคอมให้ agent → สรุปค่าคอมอัปเดต (5% × 564,000 = 28,200)', async ({ page }) => {
  await login(page, 'admin@copper8000.co.th', 'admin1234');
  await page.goto('/#/admin');
  await page.getByRole('button', { name: 'พนักงาน', exact: true }).click();
  const agentRow = page.locator('tr', { hasText: 'AGENT1' });
  await expect(agentRow).toContainText('16,920'); // ค่าคอมเริ่มต้น 3%
  // เปลี่ยนอัตราเป็น 5% แล้วบันทึก
  await agentRow.locator('input[type="number"]').fill('5');
  await agentRow.getByRole('button', { name: 'บันทึก %' }).click();
  await expect(page.locator('.toast')).toContainText('บันทึกเปอร์เซ็นต์ค่าคอมแล้ว');
  await expect(page.locator('tr', { hasText: 'AGENT1' })).toContainText('28,200');
});

test('ลูกค้ากรอกรหัสแนะนำตอนสมัคร → ผูกกับ agent เจ้าของโค้ด (agent เห็นลูกค้าเพิ่ม)', async ({ page }) => {
  const REF_EMAIL = 'referred@test.co.th';
  // สมัครพร้อมกรอก referral = AGENT1
  await page.goto('/#/signup');
  await page.fill('#name', 'ลูกค้าจากเซลล์');
  await page.fill('#phone', '089-111-2222');
  await page.fill('#email', REF_EMAIL);
  await page.fill('#referral', 'AGENT1');
  await page.fill('#password', 'ref12345');
  await page.fill('#confirm', 'ref12345');
  await page.locator('form button[type="submit"]').click();
  await expect(page.getByText('รอการอนุมัติจากแอดมิน')).toBeVisible();
  await logout(page);

  // agent เห็นลูกค้าใหม่ในรายชื่อของตัวเอง (customer_count เพิ่มเป็น 2)
  await login(page, 'agent@copper8000.co.th', 'agent1234');
  await page.goto('/#/agent');
  await expect(page.locator('.agent-stat-card', { hasText: 'จำนวนลูกค้า' })).toContainText('2');
  await expect(page.locator('tr', { hasText: 'ลูกค้าจากเซลล์' })).toBeVisible();
});

test('รหัสแนะนำผิด → สมัครไม่ผ่าน', async ({ page }) => {
  await page.goto('/#/signup');
  await page.fill('#name', 'รหัสผิด ทดสอบ');
  await page.fill('#phone', '089-000-0000');
  await page.fill('#email', 'badref@test.co.th');
  await page.fill('#referral', 'NOPE99');
  await page.fill('#password', 'bad12345');
  await page.fill('#confirm', 'bad12345');
  await page.locator('form button[type="submit"]').click();
  await expect(page.locator('.error-box')).toContainText('referral');
});

test('ราคาเปลี่ยนระหว่างเปิด modal → โดนบล็อก + โชว์ราคาใหม่ให้ยืนยันอีกครั้ง', async ({ page }) => {
  await login(page, 'demo@copper8000.co.th', 'demo1234');
  await page.getByRole('button', { name: /Bright Copper|ทองแดงเงา/ }).click();
  const modal = page.locator('.modal');
  await expect(modal).toBeVisible();
  await expect(modal.locator('.m-price')).toContainText('285');
  await modal.locator('#qty').fill('1000');
  await modal.getByRole('button', { name: 'ถัดไป' }).click();
  await expect(modal.getByText('ตรวจสอบก่อนยืนยัน')).toBeVisible();

  // จำลองแอดมินเปลี่ยนราคาระหว่างที่ modal เปิดค้าง (แก้ตรงใน mock db)
  await page.evaluate(() => {
    const db = JSON.parse(localStorage.getItem('copper8000_db_v3')!);
    db.products.find((p: { id: number }) => p.id === 1).price_per_kg = 300;
    localStorage.setItem('copper8000_db_v3', JSON.stringify(db));
  });

  await modal.getByRole('button', { name: 'ยืนยันการจอง' }).click();
  await expect(page.locator('.toast')).toContainText('ราคามีการเปลี่ยนแปลง');
  // modal เด้งกลับสเต็ปกรอก + รีเฟรชเป็นราคาใหม่แล้ว
  await expect(modal.locator('.m-price')).toContainText('300');

  // ตรวจสอบใหม่แล้วยืนยันอีกครั้งด้วยราคาใหม่ → สำเร็จ และรายงานบันทึกราคา 300
  await modal.getByRole('button', { name: 'ถัดไป' }).click();
  await modal.getByRole('button', { name: 'ยืนยันการจอง' }).click();
  await expect(page).toHaveURL(/#\/booking-report/);
  await expect(page.locator('tr', { hasText: /ทองแดงเงา/ }).first()).toContainText('300');
});

test('แอดมินเปลี่ยนธีมเป็นทองแดง → เว็บเปลี่ยนสีทันทีและจำค่าหลัง reload', async ({ page }) => {
  await login(page, 'admin@copper8000.co.th', 'admin1234');
  // default = gold
  expect(await page.evaluate(() => document.documentElement.dataset.theme ?? 'gold')).toBe('gold');
  await page.goto('/#/admin');
  await page.getByRole('button', { name: 'ตั้งค่า', exact: true }).click();
  await page.getByRole('button', { name: 'ทองแดง', exact: true }).click();
  await expect(page.locator('.toast')).toContainText('บันทึกธีมแล้ว');
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('copper');
  await page.reload();
  await page.waitForTimeout(600);
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe('copper');
});

test('ข้อมูลผู้ใช้: เปลี่ยนรหัสผ่านได้ ข้อมูลอื่นอ่านอย่างเดียว + login ด้วยรหัสใหม่ได้', async ({ page }) => {
  await login(page, 'demo@copper8000.co.th', 'demo1234');
  await page.locator('a.userbox').click();
  await expect(page).toHaveURL(/#\/profile/);
  // ข้อมูลส่วนตัวเป็นข้อความอ่านอย่างเดียว — input มีเฉพาะช่องรหัสผ่าน 3 ช่อง
  expect(await page.locator('.card input').count()).toBe(3);
  await page.fill('#pw-current', 'demo1234');
  await page.fill('#pw-new', 'demo9999');
  await page.fill('#pw-confirm', 'demo9999');
  await page.locator('form button[type="submit"]').click();
  await expect(page.locator('.success-box')).toContainText('เปลี่ยนรหัสผ่านแล้ว');
  await logout(page);
  await login(page, 'demo@copper8000.co.th', 'demo9999');
});

test('หน้าแรก: ข้อความแนะนำโชว์ตอน guest · ซ่อนเมื่อ login แล้ว', async ({ page }) => {
  // guest: มีบล็อก hero + หัวข้อ "ราคารับซื้อโลหะวันนี้"
  await page.goto('/#/');
  await expect(page.locator('.hero')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'ราคารับซื้อโลหะวันนี้' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'ทองแดง', exact: true })).toBeVisible();
  // หลัง login: hero หาย ขึ้นตารางราคาเลย
  await login(page, 'demo@copper8000.co.th', 'demo1234');
  await page.goto('/#/');
  await expect(page.locator('.hero')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'ทองแดง', exact: true })).toBeVisible();
});

test('ติดต่อบริษัท: มีลิงก์ Google Maps และแผนที่', async ({ page }) => {
  await page.goto('/#/contact');
  await expect(page.getByRole('heading', { name: 'ติดต่อบริษัท' })).toBeVisible();
  await expect(page.locator('a[href*="google.com/maps"]').first()).toBeVisible();
  await expect(page.locator('iframe.map-frame')).toBeVisible();
});
