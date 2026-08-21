/**
 * Access-control audit (โหมดสาธิต — โค้ด route guard/เมนู เหมือน production ทุกประการ)
 * ตรวจ: เมนูตามระดับชั้น · เข้าหน้าที่ไม่ใช่สิทธิ์ตัวเองไม่ได้ · guest (ไม่ล็อกอิน) เข้าหน้าปิดไม่ได้
 *        · แอดมินสร้างเอเจนต์ + เอเจนต์เห็นเมมเบอร์ ครบไม่มี error
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
const logout = async (page: Page) => {
  await page.getByRole('button', { name: 'ออกจากระบบ' }).click();
  await expect(page).toHaveURL(/#\/$/);
};

const ADMIN = 'แอดมิน';
const AGENT = 'พนักงานขาย';
const MYBOOKINGS = 'การจองของฉัน';
const PROFILE = 'ข้อมูลผู้ใช้';

/** ลิงก์เมนูในแถบหัว (นับเฉพาะที่มองเห็น) */
const navLink = (page: Page, name: string) => page.getByRole('link', { name, exact: true });

test('guest (ไม่ล็อกอิน): เห็นเฉพาะเมนูสาธารณะ · ไม่เห็นเมนูสมาชิก/เอเจนต์/แอดมิน', async ({ page }) => {
  await page.goto('/#/');
  // เมนูสาธารณะเห็นได้
  await expect(navLink(page, 'หน้าแรก')).toBeVisible();
  await expect(navLink(page, 'สินค้า')).toBeVisible();
  // เมนูที่ต้องล็อกอิน — ต้องไม่มี
  await expect(navLink(page, MYBOOKINGS)).toHaveCount(0);
  await expect(navLink(page, PROFILE)).toHaveCount(0);
  await expect(navLink(page, AGENT)).toHaveCount(0);
  await expect(navLink(page, ADMIN)).toHaveCount(0);
  // มีปุ่มเข้าสู่ระบบ/สมัคร
  await expect(page.getByRole('button', { name: 'เข้าสู่ระบบ' })).toBeVisible();
});

test('guest: เข้าหน้าปิดตรงๆ ไม่ได้ (redirect ออกทุกหน้า)', async ({ page }) => {
  await page.goto('/#/admin');
  await expect(page).toHaveURL(/#\/login/); // RequireAdmin → login
  await page.goto('/#/agent');
  await expect(page).toHaveURL(/#\/agent-login/); // RequireAgent → agent-login
  await page.goto('/#/profile');
  await expect(page).toHaveURL(/#\/login/);
  await page.goto('/#/booking-report');
  await expect(page).toHaveURL(/#\/login/);
});

test('ลูกค้า (user): เห็นเมนูการจอง/ข้อมูลผู้ใช้ · ไม่เห็นแอดมิน/เอเจนต์ · เข้า /admin,/agent ไม่ได้', async ({ page }) => {
  await login(page, 'demo@copper8000.co.th', 'demo1234');
  await expect(navLink(page, MYBOOKINGS)).toBeVisible();
  await expect(navLink(page, PROFILE)).toBeVisible();
  await expect(navLink(page, ADMIN)).toHaveCount(0);
  await expect(navLink(page, AGENT)).toHaveCount(0);
  await page.goto('/#/admin');
  await expect(page).toHaveURL(/#\/$/); // เด้งกลับหน้าแรก
  await page.goto('/#/agent');
  await expect(page).toHaveURL(/#\/$/);
});

test('เอเจนต์ (agent): เห็นเมนูพนักงานขาย · ไม่เห็นแอดมิน · เข้า /admin ไม่ได้ · เข้า /agent ได้', async ({ page }) => {
  await login(page, 'agent@copper8000.co.th', 'agent1234');
  await expect(navLink(page, AGENT)).toBeVisible();
  await expect(navLink(page, ADMIN)).toHaveCount(0);
  await page.goto('/#/admin');
  await expect(page).toHaveURL(/#\/$/);
  await page.goto('/#/agent');
  await expect(page).toHaveURL(/#\/agent/);
  await expect(page.getByRole('heading', { name: 'ค่าคอมมิชชั่นของฉัน' })).toBeVisible();
});

test('แอดมิน (admin): เห็นเมนูแอดมิน · ไม่เห็นเมนูพนักงานขาย · เข้า /agent ไม่ได้', async ({ page }) => {
  await login(page, 'admin@copper8000.co.th', 'admin1234');
  await expect(navLink(page, ADMIN)).toBeVisible();
  await expect(navLink(page, AGENT)).toHaveCount(0); // แอดมินไม่ใช่ระดับเอเจนต์
  await page.goto('/#/agent');
  await expect(page).toHaveURL(/#\/$/); // RequireAgent → เด้งออก
});

test('flow: แอดมินสร้างเอเจนต์ → ลูกค้าสมัครด้วยรหัสแนะนำ → เอเจนต์เห็นเมมเบอร์ (ไม่มี error)', async ({ page }) => {
  const AGENT_EMAIL = 'auditagent@copper8000.co.th';
  const AGENT_PW = 'agentaudit1';
  const MEMBER_EMAIL = 'auditmember@test.co.th';

  // 1) แอดมินสร้างเอเจนต์ + ตั้ง % ค่าคอม → ได้รหัสแนะนำ
  await login(page, 'admin@copper8000.co.th', 'admin1234');
  await page.goto('/#/admin');
  await page.getByRole('button', { name: 'พนักงาน', exact: true }).click();
  await page.fill('#agent-name', 'เอเจนต์ตรวจสอบ');
  await page.fill('#agent-email', AGENT_EMAIL);
  await page.fill('#agent-phone', '081-234-5678');
  await page.fill('#agent-password', AGENT_PW);
  await page.fill('#agent-rate', '4');
  await page.getByRole('button', { name: 'สร้างบัญชีพนักงาน' }).click();
  // แถวเอเจนต์ใหม่โผล่ + มีรหัสแนะนำโชว์ (success-box) — ไม่มี error
  const agentRow = page.locator('tr', { hasText: AGENT_EMAIL });
  await expect(agentRow).toBeVisible();
  await expect(page.locator('.error-box')).toHaveCount(0);
  const code = (await agentRow.locator('.referral-chip').innerText()).trim();
  expect(code).toMatch(/^[A-Z0-9]{6}$/);
  await logout(page);

  // 2) ลูกค้าสมัครด้วยรหัสแนะนำของเอเจนต์
  await page.goto('/#/signup');
  await page.fill('#name', 'ลูกค้าของเอเจนต์');
  await page.fill('#phone', '089-999-1111');
  await page.fill('#email', MEMBER_EMAIL);
  await page.fill('#referral', code);
  await page.fill('#password', 'member1234');
  await page.fill('#confirm', 'member1234');
  await page.locator('form button[type="submit"]').click();
  await expect(page.getByText('รอการอนุมัติจากแอดมิน')).toBeVisible();
  await logout(page);

  // 3) เอเจนต์ล็อกอิน → หน้า /agent เห็นเมมเบอร์ที่เพิ่งผูก · อัตราค่าคอม 4% · ไม่มี error
  await page.goto('/#/agent-login');
  await page.fill('#email', AGENT_EMAIL);
  await page.fill('#password', AGENT_PW);
  await page.locator('form button[type="submit"]').click();
  await expect(page).toHaveURL(/#\/agent/);
  await expect(page.locator('.error-box')).toHaveCount(0);
  await expect(page.locator('.agent-stat-card', { hasText: 'อัตราค่าคอม' })).toContainText('4');
  await expect(page.locator('.agent-stat-card', { hasText: 'จำนวนลูกค้า' })).toContainText('1');
  await expect(page.locator('tr', { hasText: 'ลูกค้าของเอเจนต์' })).toBeVisible();
});
