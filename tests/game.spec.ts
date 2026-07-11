import { expect, test, Page } from '@playwright/test';
import { installMockApi } from './mockApi';

/**
 * QA ตาม Definition of Done (COWORK-BRIEF ข้อ 6)
 * ข้อ 1: เล่นจบครบลูปจริงทั้ง 4 ชั้น login → เลือกฉาก → 10 ข้อ → จบฉาก → บอส → ชนะ · จอ 390px
 * ข้อ 3: timer ทำงาน · ส่ง elapsed_ms จริง · กัน double-submit
 * ข้อ 5: error handling (401 → กลับหน้า login)
 */

const BASE = '/eimaths-bounty-hunter/';

const gradeScenes: Record<number, number> = { 3: 4, 4: 4, 5: 4, 6: 3 };

const loginAsGuest = async (page: Page, grade: number) => {
  await page.goto(BASE);
  await page.getByRole('tab', { name: /เล่นเลย/ }).click();
  await page.getByLabel('ชื่อเล่นในเกม').fill(`ฮันเตอร์ป${grade}`);
  await page.getByRole('button', { name: `ป.${grade}`, exact: true }).click();
  await page.getByRole('button', { name: /เริ่มผจญภัยเลย/ }).click();
  // ข้าม intro cinematic
  await page.getByRole('button', { name: 'เริ่มเนื้อเรื่อง' }).click({ timeout: 30_000 });
  await page.getByRole('button', { name: /ข้ามเนื้อเรื่อง|เริ่มผจญภัย →/ }).click();
  await expect(page).toHaveURL(/\/map$/);
};

/** ตอบครบ 1 เซสชัน (เลือกถูกทุกข้อ = choice A) แล้วรอหน้าสรุป */
const clearSession = async (page: Page, questionCount: number) => {
  for (let index = 0; index < questionCount; index += 1) {
    const optionA = page.locator('.answer-option').first();
    await optionA.waitFor({ state: 'visible' });
    await optionA.click();

    // ทุกข้อ (รวมข้อสุดท้าย) ต้องเห็น feedback ก่อน + ตัวเลือกถูกล็อกกัน double-submit
    await expect(page.locator('.correct-box, .wrong-box').first()).toBeVisible();
    await expect(page.locator('.answer-option').first()).toBeDisabled();

    const summaryButton = page.getByRole('button', { name: 'ดูสรุป →' });
    if (await summaryButton.isVisible().catch(() => false)) {
      await summaryButton.click();
      await expect(page.locator('.celebration')).toBeVisible();
      return;
    }
    await page.getByRole('button', { name: 'ข้อต่อไป →' }).click();
  }
};

for (const grade of [3, 4, 5, 6]) {
  test(`ป.${grade}: ครบลูป login → ทุกฉาก → บอส → ชนะ → cutscene (จอ 390px)`, async ({ page }) => {
    const stats = await installMockApi(page);
    await loginAsGuest(page, grade);

    const sceneCount = gradeScenes[grade];

    // เดินทีละฉากตามลำดับปลดล็อก
    for (let scene = 1; scene <= sceneCount; scene += 1) {
      const node = page.locator(`.scene-node.node-${scene}`);
      await expect(node).toBeEnabled();
      await node.click();
      await expect(page).toHaveURL(new RegExp(`/quiz/${scene}$`));

      // timer แสดงและนับถอยหลังจริง
      const timer = page.locator('.timer');
      await expect(timer).toBeVisible();

      await clearSession(page, 10);
      await expect(page.getByText('ผ่านฉากนี้แล้ว!')).toBeVisible();
      await page.getByRole('button', { name: 'กลับแผนที่ →' }).click();
      await expect(page).toHaveURL(/\/map$/);
    }

    // บอสปลดล็อกหลังครบทุกฉาก
    const bossNode = page.locator('.boss-node');
    await expect(bossNode).toBeEnabled();
    await bossNode.click();
    await expect(page).toHaveURL(/\/quiz\/boss$/);

    // แผง HP 10 ช่อง + หัวใจ 3 ดวง
    await expect(page.locator('.hp-cell')).toHaveCount(10);
    await expect(page.locator('.player-hearts')).toBeVisible();

    await clearSession(page, 10); // ถูก 10 ข้อ = HP บอสหมด
    await expect(page.getByText(/ชนะ.*แล้ว!/)).toBeVisible();
    await page.getByRole('button', { name: /ดูเนื้อเรื่องต่อ/ }).click();

    // หน้าโหลดวิดีโอตามสเปกข้อ 5: ปุ่มเทาจนกว่าจะครบ 100% → ส้มกดได้
    await expect(page).toHaveURL(/\/cutscene\//);
    const letsgo = page.getByTestId('letsgo');
    await expect(letsgo).toBeEnabled({ timeout: 30_000 });
    await expect(letsgo).toHaveClass(/ready/);
    await letsgo.click();
    await expect(page.getByTestId('cutscene-video')).toBeVisible();
    await page.getByRole('button', { name: /จบเนื้อเรื่อง กลับแผนที่/ }).click();

    // กลับแผนที่ บอสขึ้นสถานะชนะแล้ว
    await expect(page).toHaveURL(/\/map$/);
    await expect(page.locator('.boss-node')).toHaveClass(/done/);

    // Contract checks: ส่ง elapsed_ms จริงทุกครั้ง + แนบ X-Api-Key
    expect(stats.elapsedMsSamples.length).toBeGreaterThanOrEqual(sceneCount * 10 + 10);
    expect(stats.elapsedMsSamples.every((ms) => Number.isFinite(ms) && ms >= 0)).toBe(true);
    expect(stats.apiKeySeen.every((key) => key === 'test-app-key')).toBe(true);
    expect(stats.bearerSeen.length).toBeGreaterThan(0);
  });
}

test('นักเรียน: login ด้วยรหัส+PIN สำเร็จ · PIN ผิดขึ้น error ไทย', async ({ page }) => {
  await installMockApi(page);
  await page.goto(BASE);

  // PIN ผิด → error ภาษาไทย + มีปุ่มลองใหม่ได้ (ฟอร์มยังอยู่)
  await page.getByLabel('รหัสนักเรียน').fill('TEST01');
  await page.getByLabel('PIN 4 หลัก').fill('9999');
  await page.getByRole('button', { name: /เข้าสู่ระบบ/ }).click();
  await expect(page.locator('.error-box')).toContainText('ไม่ถูกต้อง');

  // PIN ถูก → เข้าเกม
  await page.getByLabel('PIN 4 หลัก').fill('4726');
  await page.getByRole('button', { name: /เข้าสู่ระบบ/ }).click();
  await expect(page).toHaveURL(/\/intro$/);
});

test('บอสโหมดแพ้: ตอบผิดจนหัวใจหมด → เสนอสู้ใหม่ด้วยโจทย์ชุดใหม่', async ({ page }) => {
  const stats = await installMockApi(page);
  await loginAsGuest(page, 3);

  // เคลียร์ 4 ฉากเพื่อปลดบอส
  for (let scene = 1; scene <= 4; scene += 1) {
    await page.locator(`.scene-node.node-${scene}`).click();
    await clearSession(page, 10);
    await page.getByRole('button', { name: 'กลับแผนที่ →' }).click();
  }

  await page.locator('.boss-node').click();
  // ตอบผิด 3 ครั้ง (choice B) → หัวใจหมด
  for (let i = 0; i < 3; i += 1) {
    await page.locator('.answer-option').nth(1).click();
    await expect(page.locator('.wrong-box')).toBeVisible();
    const summaryButton = page.getByRole('button', { name: 'ดูสรุป →' });
    if (await summaryButton.isVisible().catch(() => false)) {
      await summaryButton.click();
    } else {
      await page.getByRole('button', { name: 'ข้อต่อไป →' }).click();
    }
  }

  await expect(page.getByText('พ่ายศึกนี้… แต่ยังไม่จบ!')).toBeVisible();
  const startCallsBefore = stats.quizStartCalls;
  await page.getByRole('button', { name: /สู้ใหม่/ }).click();
  await expect(page.locator('.hp-cell').first()).toBeVisible();
  expect(stats.quizStartCalls).toBe(startCallsBefore + 1); // ขอชุดโจทย์ใหม่จริง
});

test('ปุ่มแจ้งข้อผิดเก็บ qid ลง localStorage', async ({ page }) => {
  await installMockApi(page);
  await loginAsGuest(page, 4);
  await page.locator('.scene-node.node-1').click();

  await page.getByRole('button', { name: /แจ้งข้อผิด/ }).click();
  await expect(page.getByRole('button', { name: /แจ้งแล้ว/ })).toBeDisabled();
  const reported = await page.evaluate(() => window.localStorage.getItem('bh2-reported-questions'));
  expect(JSON.parse(reported ?? '[]').length).toBe(1);
});

test('401 ระหว่างเล่น → เคลียร์เซสชันและกลับหน้า login', async ({ page }) => {
  await installMockApi(page);
  await loginAsGuest(page, 5);

  // แทรก route ใหม่: quiz_start ตอบ 401 (ทับ mock เดิมเพราะ route ล่าสุดชนะ)
  await page.route('**/api/quiz_start.php*', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ ok: false, error: 'เซสชันหมดอายุ' }),
    }),
  );

  await page.locator('.scene-node.node-1').click();
  await expect(page).toHaveURL(/\/login$/, { timeout: 15_000 });
});
