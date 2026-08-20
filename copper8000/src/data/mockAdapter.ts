/**
 * Mock adapter (โหมดสาธิต) — เก็บทุกอย่างใน localStorage ของเบราว์เซอร์
 * ใช้อัตโนมัติเมื่อยังไม่ตั้ง VITE_API_BASE/VITE_API_KEY เพื่อให้เว็บใช้งานได้ทันที
 * สลับเป็น backend จริงได้โดยไม่ต้องแก้หน้าจอ (ผ่าน service.ts)
 */

import { SEED_BOOKINGS, SEED_LANGUAGES, SEED_PRODUCTS, SEED_USERS, type SeedUser } from './seed';
import {
  ApiError,
  type AgentCommission,
  type AgentMember,
  type AgentSummary,
  type AppSettings,
  type AuditEntry,
  type AuditQuery,
  type AuditResult,
  type AuthResult,
  type Booking,
  type DataService,
  type LanguageInfo,
  type Material,
  type Product,
  type Unit,
  type User,
} from './types';

// v3: ประกาศเก็บข้อความ 3 ภาษา (ไทย/อังกฤษ/จีน)
const DB_KEY = 'copper8000_db_v3';

/** ประกาศตัวอย่างในโหมดสาธิต — เปิดไว้ให้เห็นทันทีตั้งแต่เปิดหน้าแรก (ไม่ต้องล็อกอิน) */
const DEMO_ANNOUNCEMENT = {
  text: {
    th: '📢 ยินดีต้อนรับสู่ Copper 8000 — รับซื้อทองแดง ทองเหลือง อลูมิเนียม ราคาดีทุกวัน! สอบถามราคาโทร 08x-xxx-xxxx',
    en: '📢 Welcome to Copper 8000 — we buy copper, brass and aluminium at great prices every day! Call 08x-xxx-xxxx',
    zh: '📢 欢迎来到 Copper 8000 — 每天高价收购铜、黄铜、铝！咨询电话 08x-xxx-xxxx',
  },
  mode: 'marquee' as const,
  active: true,
};

type Db = {
  users: SeedUser[];
  products: Product[];
  bookings: Booking[];
  sessions: Record<string, number>; // token -> user id
  languages: LanguageInfo[];
  settings: AppSettings;
  audit: AuditEntry[];
  nextUserId: number;
  nextBookingId: number;
  nextProductId: number;
  nextAuditId: number;
};

const MATERIAL_ORDER: Record<Material, number> = { copper: 0, brass: 1, aluminium: 2 };
const MATERIALS: Material[] = ['copper', 'brass', 'aluminium'];

/** เรียงแบบเดียวกับ backend: FIELD(material,...) → sort_order → id */
const sortProducts = (products: Product[]): Product[] =>
  [...products].sort(
    (a, b) =>
      MATERIAL_ORDER[a.material] - MATERIAL_ORDER[b.material] ||
      a.sort_order - b.sort_order ||
      a.id - b.id,
  );

const loadDb = (): Db => {
  const raw = localStorage.getItem(DB_KEY);
  if (raw) {
    try {
      const db = JSON.parse(raw) as Db;
      // db เวอร์ชันก่อนหน้าไม่มี languages/settings — backfill โดยไม่ล้างข้อมูลเดิม
      let dirty = false;
      if (!db.languages) {
        db.languages = [...SEED_LANGUAGES];
        dirty = true;
      }
      if (!db.settings) {
        db.settings = { theme: 'gold', announcement: { ...DEMO_ANNOUNCEMENT }, booking_deposit: 0, default_credit: 0 };
        dirty = true;
      }
      if (!db.settings.announcement) {
        db.settings.announcement = { ...DEMO_ANNOUNCEMENT };
        dirty = true;
      }
      if (db.settings.booking_deposit === undefined) {
        db.settings.booking_deposit = 0;
        dirty = true;
      }
      if (db.settings.default_credit === undefined) {
        db.settings.default_credit = 0;
        dirty = true;
      }
      // db เวอร์ชันก่อนหน้าไม่มีคอลัมน์ sort_order/active ในสินค้า และไม่มี nextProductId
      if (db.products.some((p) => p.sort_order === undefined || p.active === undefined)) {
        db.products = db.products.map((p, i) => ({
          ...p,
          sort_order: p.sort_order ?? i + 1,
          active: p.active ?? true,
        }));
        dirty = true;
      }
      if (!db.nextProductId) {
        db.nextProductId = Math.max(100, ...db.products.map((p) => p.id + 1));
        dirty = true;
      }
      if (!db.audit) {
        db.audit = [];
        dirty = true;
      }
      if (!db.nextAuditId) {
        db.nextAuditId = 1;
        dirty = true;
      }
      if (dirty) localStorage.setItem(DB_KEY, JSON.stringify(db));
      return db;
    } catch {
      /* seed ใหม่ */
    }
  }
  const db: Db = {
    users: [...SEED_USERS],
    products: [...SEED_PRODUCTS],
    bookings: [...SEED_BOOKINGS],
    sessions: {},
    languages: [...SEED_LANGUAGES],
    settings: { theme: 'gold', announcement: { ...DEMO_ANNOUNCEMENT }, booking_deposit: 0, default_credit: 0 },
    audit: [],
    nextUserId: 100,
    nextBookingId: 100,
    nextProductId: 100,
    nextAuditId: 1,
  };
  localStorage.setItem(DB_KEY, JSON.stringify(db));
  return db;
};

const saveDb = (db: Db) => localStorage.setItem(DB_KEY, JSON.stringify(db));

/** บันทึกเหตุการณ์ลง audit (โหมดสาธิต) — ไม่ save เอง ให้ผู้เรียก saveDb ต่อ */
const recordAudit = (
  db: Db,
  action: string,
  opts: {
    actor?: SeedUser | null;
    actorRole?: string;
    entity?: string;
    entity_id?: number | null;
    detail?: Record<string, unknown>;
  } = {},
): void => {
  const actor = opts.actor ?? null;
  db.audit.push({
    id: db.nextAuditId++,
    created_at: new Date().toISOString(),
    user_id: actor ? actor.id : null,
    actor_email: actor ? actor.email : null,
    actor_role: opts.actorRole ?? (actor ? actor.role : 'guest'),
    action,
    entity: opts.entity ?? null,
    entity_id: opts.entity_id ?? null,
    detail: opts.detail ? JSON.stringify(opts.detail) : null,
    ip: 'demo',
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 255) : null,
  });
};

const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

const publicUser = (u: SeedUser): User => {
  const { password: _pw, ...rest } = u;
  return rest;
};

let authToken: string | null = null;

const requireUser = (db: Db): SeedUser => {
  const userId = authToken ? db.sessions[authToken] : undefined;
  const user = userId ? db.users.find((u) => u.id === userId) : undefined;
  if (!user) throw new ApiError('เซสชันหมดอายุ กรุณาเข้าสู่ระบบใหม่', 401);
  return user;
};

const requireAdmin = (db: Db): SeedUser => {
  const user = requireUser(db);
  if (user.role !== 'admin') throw new ApiError('เฉพาะผู้ดูแลระบบเท่านั้น', 403);
  return user;
};

const createSession = (db: Db, userId: number): string => {
  const token = `mock-${userId}-${Math.random().toString(36).slice(2)}`;
  db.sessions[token] = userId;
  saveDb(db);
  return token;
};

/** เฉพาะ agent (พนักงาน) — ใช้กับ endpoint ฝั่ง agent */
const requireAgent = (db: Db): SeedUser => {
  const user = requireUser(db);
  if (user.role !== 'agent') throw new ApiError('เฉพาะพนักงาน (agent) เท่านั้น', 403);
  return user;
};

/** สร้าง referral code ไม่ซ้ำ (6 ตัว ตัดอักษรที่สับสน) */
const genReferral = (db: Db): string => {
  const alpha = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let t = 0; t < 30; t++) {
    let c = '';
    for (let i = 0; i < 6; i++) c += alpha[Math.floor(Math.random() * alpha.length)];
    if (!db.users.some((u) => u.referral_code === c)) return c;
  }
  return 'AG' + Math.floor(1000 + Math.random() * 9000);
};

/** จำนวนลูกค้าที่ผูก + ยอด confirmed รวม ของ agent */
const agentStats = (db: Db, agentId: number): { customer_count: number; confirmed_total: number } => {
  const memberIds = db.users.filter((u) => u.agent_id === agentId && u.role === 'user').map((u) => u.id);
  const confirmed_total = db.bookings
    .filter((b) => b.status === 'confirmed' && memberIds.includes(b.user_id))
    .reduce((s, b) => s + b.total_estimate, 0);
  return { customer_count: memberIds.length, confirmed_total };
};

export const mockAdapter: DataService = {
  setAuthToken(token) {
    authToken = token;
  },

  async signup({ email, password, name, phone, referral_code }): Promise<AuthResult> {
    await delay();
    const db = loadDb();
    const normEmail = email.trim().toLowerCase();
    if (!normEmail || !password || !name.trim()) {
      throw new ApiError('กรุณากรอกข้อมูลให้ครบถ้วน', 400);
    }
    // referral (ไม่บังคับ) — ผูกลูกค้าเข้ากับ agent เจ้าของโค้ด
    let agentId: number | null = null;
    const ref = (referral_code ?? '').trim().toUpperCase();
    if (ref) {
      const agent = db.users.find((u) => u.role === 'agent' && (u.referral_code ?? '') === ref);
      if (!agent) throw new ApiError('รหัสแนะนำ (referral) ไม่ถูกต้อง', 400);
      agentId = agent.id;
    }
    if (db.users.some((u) => u.email === normEmail)) {
      throw new ApiError('อีเมลนี้ถูกใช้สมัครแล้ว', 409);
    }
    const defaultCredit = db.settings.default_credit ?? 0;
    const user: SeedUser = {
      id: db.nextUserId++,
      email: normEmail,
      password,
      name: name.trim(),
      phone: phone.trim(),
      role: 'user',
      approved: false,
      agent_id: agentId,
      credit_balance: defaultCredit,
    };
    db.users.push(user);
    recordAudit(db, 'signup', { actor: user, entity: 'user', entity_id: user.id, detail: { email: user.email, name: user.name, agent_id: agentId, credit_balance: defaultCredit } });
    const token = createSession(db, user.id);
    authToken = token;
    return { user: publicUser(user), token };
  },

  async login(email, password): Promise<AuthResult> {
    await delay();
    const db = loadDb();
    const user = db.users.find((u) => u.email === email.trim().toLowerCase());
    if (!user || user.password !== password) {
      recordAudit(db, 'login_failed', { actorRole: 'guest', entity: 'user', detail: { email: email.trim().toLowerCase() } });
      saveDb(db);
      throw new ApiError('อีเมลหรือรหัสผ่านไม่ถูกต้อง', 401);
    }
    recordAudit(db, 'login', { actor: user, entity: 'user', entity_id: user.id });
    const token = createSession(db, user.id);
    authToken = token;
    return { user: publicUser(user), token };
  },

  async me(): Promise<User> {
    await delay(100);
    return publicUser(requireUser(loadDb()));
  },

  async changePassword(current_password, new_password): Promise<void> {
    await delay();
    const db = loadDb();
    const user = requireUser(db);
    if (user.password !== current_password) throw new ApiError('รหัสผ่านปัจจุบันไม่ถูกต้อง', 400);
    if (new_password.length < 6) throw new ApiError('รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร', 400);
    user.password = new_password;
    recordAudit(db, 'change_password', { actor: user, entity: 'user', entity_id: user.id });
    saveDb(db);
  },

  async listProducts(): Promise<Product[]> {
    await delay();
    return sortProducts(loadDb().products.filter((p) => p.active));
  },

  async createBooking({ product_id, quantity, unit, expected_price_per_kg, delivery_date }): Promise<Booking> {
    await delay();
    const db = loadDb();
    const user = requireUser(db);
    if (!user.approved) {
      throw new ApiError('บัญชียังไม่ได้รับการอนุมัติ จึงยังจองไม่ได้', 403);
    }
    if (user.booking_suspended) {
      throw new ApiError('บัญชีถูกระงับสิทธิ์การจองชั่วคราว กรุณาติดต่อบริษัท', 403);
    }
    const product = db.products.find((p) => p.id === product_id);
    if (!product) throw new ApiError('ไม่พบสินค้า', 404);
    if (!(quantity > 0)) throw new ApiError('จำนวนต้องมากกว่า 0', 400);
    if (
      expected_price_per_kg !== undefined &&
      Math.abs(product.price_per_kg - expected_price_per_kg) > 0.001
    ) {
      throw new ApiError('ราคามีการเปลี่ยนแปลง กรุณาตรวจสอบราคาใหม่', 409);
    }
    // มัดจำ (เครดิต): กันเครดิตตอนจอง ถ้าแอดมินตั้ง booking_deposit > 0
    const deposit = db.settings.booking_deposit ?? 0;
    if (deposit > 0) {
      const bal = user.credit_balance ?? 0;
      if (bal < deposit) {
        throw new ApiError(
          `เครดิตไม่พอสำหรับมัดจำการจอง (ต้องมีอย่างน้อย ${deposit} เครดิต) — กรุณาติดต่อบริษัทเพื่อเติมเครดิต`,
          402,
        );
      }
      user.credit_balance = bal - deposit;
      user.credit_held = (user.credit_held ?? 0) + deposit;
    }
    const kg = unit === 'ton' ? quantity * 1000 : quantity;
    const booking: Booking = {
      id: db.nextBookingId++,
      user_id: user.id,
      user_name: user.name,
      product_id,
      product_name: product.name_th,
      product_name_en: product.name_en,
      quantity,
      unit: unit as Unit,
      price_at_booking: product.price_per_kg,
      total_estimate: Math.round(kg * product.price_per_kg * 100) / 100,
      status: 'pending',
      deposit_held: deposit > 0 ? deposit : 0,
      delivery_date: delivery_date ?? null,
      actual_weight_kg: null,
      qc_weight_kg: null,
      created_at: new Date().toISOString(),
    };
    db.bookings.push(booking);
    recordAudit(db, 'create_booking', {
      actor: user,
      entity: 'booking',
      entity_id: booking.id,
      detail: {
        product_id,
        product: product.name_th,
        quantity,
        unit,
        price_at_booking: booking.price_at_booking,
        total_estimate: booking.total_estimate,
        deposit_held: booking.deposit_held,
      },
    });
    saveDb(db);
    return booking;
  },

  async listMyBookings(): Promise<Booking[]> {
    await delay();
    const db = loadDb();
    const user = requireUser(db);
    return db.bookings
      .filter((b) => b.user_id === user.id)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 10);
  },

  async listPendingUsers(): Promise<User[]> {
    await delay();
    const db = loadDb();
    requireAdmin(db);
    return db.users.filter((u) => u.role === 'user' && !u.approved).map(publicUser);
  },

  async setUserApproval(user_id, approved): Promise<void> {
    await delay();
    const db = loadDb();
    const admin = requireAdmin(db);
    const user = db.users.find((u) => u.id === user_id);
    if (!user) throw new ApiError('ไม่พบผู้ใช้', 404);
    user.approved = approved;
    recordAudit(db, approved ? 'approve_user' : 'reject_user', { actor: admin, entity: 'user', entity_id: user_id, detail: { approved } });
    saveDb(db);
  },

  async listAgents(): Promise<AgentSummary[]> {
    await delay();
    const db = loadDb();
    requireAdmin(db);
    return db.users
      .filter((u) => u.role === 'agent')
      .map((u) => {
        const { customer_count, confirmed_total } = agentStats(db, u.id);
        const rate = u.commission_rate ?? 0;
        return {
          ...publicUser(u),
          customer_count,
          confirmed_total,
          commission: Math.round((rate / 100) * confirmed_total * 100) / 100,
        };
      });
  },

  async createAgent({ email, password, name, phone, commission_rate }): Promise<{ referral_code?: string }> {
    await delay();
    const db = loadDb();
    requireAdmin(db);
    const normEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normEmail)) throw new ApiError('รูปแบบอีเมลไม่ถูกต้อง', 400);
    if (password.length < 6) throw new ApiError('รหัสผ่านต้องยาวอย่างน้อย 6 ตัวอักษร', 400);
    if (!name.trim()) throw new ApiError('กรุณากรอกชื่อ', 400);
    const rate = commission_rate ?? 0;
    if (rate < 0 || rate > 100) throw new ApiError('เปอร์เซ็นต์ค่าคอมต้องอยู่ระหว่าง 0–100', 400);
    if (db.users.some((u) => u.email === normEmail)) throw new ApiError('อีเมลนี้ถูกใช้แล้ว', 409);
    const code = genReferral(db);
    db.users.push({
      id: db.nextUserId++,
      email: normEmail,
      password,
      name: name.trim(),
      phone: phone.trim(),
      role: 'agent',
      approved: true,
      referral_code: code,
      commission_rate: rate,
    });
    saveDb(db);
    return { referral_code: code };
  },

  async setCommissionRate(user_id, commission_rate): Promise<void> {
    await delay();
    const db = loadDb();
    requireAdmin(db);
    if (commission_rate < 0 || commission_rate > 100) throw new ApiError('เปอร์เซ็นต์ค่าคอมต้องอยู่ระหว่าง 0–100', 400);
    const agent = db.users.find((u) => u.id === user_id && u.role === 'agent');
    if (!agent) throw new ApiError('ไม่พบพนักงาน', 404);
    agent.commission_rate = commission_rate;
    saveDb(db);
  },

  async agentCommission(): Promise<AgentCommission> {
    await delay();
    const db = loadDb();
    const me = requireAgent(db);
    const { customer_count, confirmed_total } = agentStats(db, me.id);
    const rate = me.commission_rate ?? 0;
    return {
      referral_code: me.referral_code ?? null,
      commission_rate: rate,
      customer_count,
      confirmed_total,
      commission: Math.round((rate / 100) * confirmed_total * 100) / 100,
    };
  },

  async agentMembers(): Promise<AgentMember[]> {
    await delay();
    const db = loadDb();
    const me = requireAgent(db);
    return db.users
      .filter((u) => u.agent_id === me.id && u.role === 'user')
      .map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        approved: u.approved,
        confirmed_total: db.bookings
          .filter((b) => b.status === 'confirmed' && b.user_id === u.id)
          .reduce((s, b) => s + b.total_estimate, 0),
      }));
  },

  async deleteAgent(user_id): Promise<void> {
    await delay();
    const db = loadDb();
    requireAdmin(db);
    const agent = db.users.find((u) => u.id === user_id && u.role === 'agent');
    if (!agent) throw new ApiError('ไม่พบพนักงาน', 404);
    // ปลดลูกค้าที่ผูกกับ agent นี้
    db.users.forEach((u) => {
      if (u.agent_id === user_id) u.agent_id = null;
    });
    db.users = db.users.filter((u) => u.id !== user_id);
    // เคลียร์เซสชันของพนักงานที่ถูกลบ
    for (const [token, uid] of Object.entries(db.sessions)) {
      if (uid === user_id) delete db.sessions[token];
    }
    saveDb(db);
  },

  async listAllBookings(): Promise<Booking[]> {
    await delay();
    const db = loadDb();
    requireAdmin(db);
    return [...db.bookings].sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async confirmBooking(booking_id): Promise<void> {
    await delay();
    const db = loadDb();
    const admin = requireAdmin(db);
    const booking = db.bookings.find((b) => b.id === booking_id);
    if (!booking) throw new ApiError('ไม่พบรายการจอง', 404);
    if (booking.status !== 'pending') throw new ApiError('รายการนี้ถูกยืนยันหรือยกเลิกไปแล้ว', 409);
    booking.status = 'confirmed';
    // คืนเครดิตมัดจำให้ลูกค้า (การซื้อขายสำเร็จ = ยืนยัน)
    const dep = booking.deposit_held ?? 0;
    if (dep > 0) {
      const cust = db.users.find((u) => u.id === booking.user_id);
      if (cust) {
        cust.credit_balance = (cust.credit_balance ?? 0) + dep;
        cust.credit_held = Math.max(0, (cust.credit_held ?? 0) - dep);
      }
      booking.deposit_held = 0;
    }
    recordAudit(db, 'confirm_booking', { actor: admin, entity: 'booking', entity_id: booking_id, detail: { deposit_returned: dep } });
    saveDb(db);
  },

  async cancelBooking(booking_id): Promise<void> {
    await delay();
    const db = loadDb();
    const admin = requireAdmin(db);
    const booking = db.bookings.find((b) => b.id === booking_id);
    if (!booking) throw new ApiError('ไม่พบรายการจอง', 404);
    if (booking.status === 'cancelled') throw new ApiError('รายการนี้ถูกยกเลิกไปแล้ว', 409);
    const cust = db.users.find((u) => u.id === booking.user_id);
    const dep = booking.deposit_held ?? 0;
    // คืนเครดิตที่กันไว้ (ถ้ายังไม่ยืนยัน) · ไม่เตือนอัตโนมัติ (แอดมินกดเตือนเอง)
    if (dep > 0 && cust) {
      cust.credit_balance = (cust.credit_balance ?? 0) + dep;
      cust.credit_held = Math.max(0, (cust.credit_held ?? 0) - dep);
    }
    booking.deposit_held = 0;
    booking.status = 'cancelled';
    recordAudit(db, 'cancel_booking', { actor: admin, entity: 'booking', entity_id: booking_id, detail: { deposit_returned: dep } });
    saveDb(db);
  },

  async warnUser(user_id): Promise<{ warnings: number; suspended: boolean }> {
    await delay();
    const db = loadDb();
    const admin = requireAdmin(db);
    const cust = db.users.find((u) => u.id === user_id && u.role === 'user');
    if (!cust) throw new ApiError('ไม่พบลูกค้า', 404);
    const warnings = (cust.warnings ?? 0) + 1;
    cust.warnings = warnings;
    let suspended = false;
    if (warnings >= 3) {
      cust.booking_suspended = true;
      suspended = true;
    }
    recordAudit(db, 'warn_user', { actor: admin, entity: 'user', entity_id: user_id, detail: { warnings, suspended } });
    saveDb(db);
    return { warnings, suspended };
  },

  async listCustomers(): Promise<User[]> {
    await delay();
    const db = loadDb();
    requireAdmin(db);
    return db.users.filter((u) => u.role === 'user').map(publicUser);
  },

  async grantCredit(user_id, amount): Promise<void> {
    await delay();
    const db = loadDb();
    const admin = requireAdmin(db);
    if (!amount) throw new ApiError('กรุณาระบุจำนวนเครดิต', 400);
    const cust = db.users.find((u) => u.id === user_id && u.role === 'user');
    if (!cust) throw new ApiError('ไม่พบลูกค้า', 404);
    const next = (cust.credit_balance ?? 0) + amount;
    if (next < 0) throw new ApiError(`เครดิตคงเหลือไม่พอสำหรับหักออก (คงเหลือ ${cust.credit_balance ?? 0})`, 400);
    cust.credit_balance = Math.round(next * 100) / 100;
    recordAudit(db, 'grant_credit', { actor: admin, entity: 'user', entity_id: user_id, detail: { amount } });
    saveDb(db);
  },

  async setBookingDeposit(amount): Promise<void> {
    await delay();
    const db = loadDb();
    const admin = requireAdmin(db);
    if (amount < 0) throw new ApiError('ยอดมัดจำต้องไม่ติดลบ', 400);
    db.settings.booking_deposit = Math.round(amount * 100) / 100;
    recordAudit(db, 'set_booking_deposit', { actor: admin, entity: 'settings', detail: { booking_deposit: amount } });
    saveDb(db);
  },

  async setDefaultCredit(amount): Promise<void> {
    await delay();
    const db = loadDb();
    const admin = requireAdmin(db);
    if (amount < 0) throw new ApiError('เครดิตเริ่มต้นต้องไม่ติดลบ', 400);
    db.settings.default_credit = Math.round(amount * 100) / 100;
    recordAudit(db, 'set_default_credit', { actor: admin, entity: 'settings', detail: { default_credit: amount } });
    saveDb(db);
  },

  async resetWarnings(user_id): Promise<void> {
    await delay();
    const db = loadDb();
    const admin = requireAdmin(db);
    const cust = db.users.find((u) => u.id === user_id && u.role === 'user');
    if (!cust) throw new ApiError('ไม่พบลูกค้า', 404);
    cust.warnings = 0;
    cust.booking_suspended = false;
    recordAudit(db, 'reset_warnings', { actor: admin, entity: 'user', entity_id: user_id });
    saveDb(db);
  },

  async setBookingSuspended(user_id, suspended): Promise<void> {
    await delay();
    const db = loadDb();
    const admin = requireAdmin(db);
    const cust = db.users.find((u) => u.id === user_id && u.role === 'user');
    if (!cust) throw new ApiError('ไม่พบลูกค้า', 404);
    cust.booking_suspended = suspended;
    recordAudit(db, suspended ? 'suspend_user' : 'unsuspend_user', { actor: admin, entity: 'user', entity_id: user_id });
    saveDb(db);
  },

  async setBookingWeights(booking_id, { actual_weight_kg, qc_weight_kg }): Promise<void> {
    await delay();
    const db = loadDb();
    const admin = requireAdmin(db);
    const booking = db.bookings.find((b) => b.id === booking_id);
    if (!booking) throw new ApiError('ไม่พบรายการจอง', 404);
    const norm = (v: number | null) => {
      if (v === null) return null;
      if (v < 0) throw new ApiError('น้ำหนักต้องไม่ติดลบ', 400);
      return v;
    };
    booking.actual_weight_kg = norm(actual_weight_kg);
    booking.qc_weight_kg = norm(qc_weight_kg);
    recordAudit(db, 'set_weights', { actor: admin, entity: 'booking', entity_id: booking_id, detail: { actual_weight_kg: booking.actual_weight_kg, qc_weight_kg: booking.qc_weight_kg } });
    saveDb(db);
  },

  async listLanguages(): Promise<LanguageInfo[]> {
    await delay(100);
    return loadDb()
      .languages.filter((l) => l.enabled)
      .sort((a, b) => a.sort_order - b.sort_order);
  },

  async listAllLanguages(): Promise<LanguageInfo[]> {
    await delay(100);
    const db = loadDb();
    requireAdmin(db);
    return [...db.languages].sort((a, b) => a.sort_order - b.sort_order);
  },

  async addLanguage({ code, name_native, dict }): Promise<void> {
    await delay();
    const db = loadDb();
    const admin = requireAdmin(db);
    const norm = code.trim().toLowerCase();
    if (!/^[a-z]{2,3}(-[a-z0-9]{2,8})?$/.test(norm)) throw new ApiError('รหัสภาษาไม่ถูกต้อง', 400);
    if (!name_native.trim()) throw new ApiError('กรุณากรอกชื่อภาษา', 400);
    if (db.languages.some((l) => l.code === norm)) throw new ApiError('ภาษานี้มีอยู่แล้ว', 409);
    const maxSort = Math.max(0, ...db.languages.map((l) => l.sort_order));
    db.languages.push({
      code: norm,
      name_native: name_native.trim(),
      enabled: true,
      built_in: false,
      sort_order: maxSort + 1,
      dict,
    });
    recordAudit(db, 'add_language', { actor: admin, entity: 'language', detail: { code: norm, name_native: name_native.trim() } });
    saveDb(db);
  },

  async updateLanguage(code, { name_native, dict }): Promise<void> {
    await delay();
    const db = loadDb();
    const admin = requireAdmin(db);
    const language = db.languages.find((l) => l.code === code);
    if (!language) throw new ApiError('ไม่พบภาษา', 404);
    if (dict && language.built_in) throw new ApiError('ภาษาหลักแก้คำแปลไม่ได้', 400);
    if (name_native !== undefined) language.name_native = name_native.trim();
    if (dict !== undefined) language.dict = dict;
    recordAudit(db, 'update_language', { actor: admin, entity: 'language', detail: { code, fields: [name_native !== undefined ? 'name_native' : null, dict !== undefined ? 'dict' : null].filter(Boolean) } });
    saveDb(db);
  },

  async setLanguageEnabled(code, enabled): Promise<void> {
    await delay();
    const db = loadDb();
    const admin = requireAdmin(db);
    const language = db.languages.find((l) => l.code === code);
    if (!language) throw new ApiError('ไม่พบภาษา', 404);
    if (!enabled && db.languages.filter((l) => l.enabled && l.code !== code).length === 0) {
      throw new ApiError('ต้องมีอย่างน้อย 1 ภาษาที่เปิดใช้งาน', 400);
    }
    language.enabled = enabled;
    recordAudit(db, enabled ? 'enable_language' : 'disable_language', { actor: admin, entity: 'language', detail: { code, enabled } });
    saveDb(db);
  },

  async deleteLanguage(code): Promise<void> {
    await delay();
    const db = loadDb();
    const admin = requireAdmin(db);
    const language = db.languages.find((l) => l.code === code);
    if (!language) throw new ApiError('ไม่พบภาษา', 404);
    if (language.built_in) throw new ApiError('ภาษาหลักลบไม่ได้ (ปิดการใช้งานแทน)', 400);
    if (language.enabled && db.languages.filter((l) => l.enabled && l.code !== code).length === 0) {
      throw new ApiError('ต้องมีอย่างน้อย 1 ภาษาที่เปิดใช้งาน', 400);
    }
    db.languages = db.languages.filter((l) => l.code !== code);
    recordAudit(db, 'delete_language', { actor: admin, entity: 'language', detail: { code } });
    saveDb(db);
  },

  async getSettings(): Promise<AppSettings> {
    await delay(100);
    const s = loadDb().settings;
    return {
      theme: s.theme,
      announcement: { ...s.announcement, text: { ...s.announcement.text } },
      booking_deposit: s.booking_deposit ?? 0,
      default_credit: s.default_credit ?? 0,
    };
  },

  async setTheme(theme): Promise<void> {
    await delay();
    const db = loadDb();
    const admin = requireAdmin(db);
    if (!['gold', 'copper', 'silver'].includes(theme)) throw new ApiError('ธีมไม่ถูกต้อง', 400);
    db.settings.theme = theme;
    recordAudit(db, 'set_theme', { actor: admin, entity: 'settings', detail: { theme } });
    saveDb(db);
  },

  async setAnnouncement({ text, mode, active }): Promise<void> {
    await delay();
    const db = loadDb();
    const admin = requireAdmin(db);
    if (!['marquee', 'popup'].includes(mode)) throw new ApiError('รูปแบบการแสดงไม่ถูกต้อง', 400);
    const map: Record<string, string> = {};
    for (const [lc, v] of Object.entries(text)) {
      const tv = (v ?? '').trim();
      if (!tv) continue; // เก็บเฉพาะภาษาที่มีข้อความ
      if (tv.length > 500) throw new ApiError('ข้อความประกาศยาวเกินไป (สูงสุด 500 ตัวอักษร)', 400);
      map[lc] = tv;
    }
    db.settings.announcement = { text: map, mode, active };
    recordAudit(db, 'set_announcement', { actor: admin, entity: 'settings', detail: { mode, active, langs: Object.keys(map) } });
    saveDb(db);
  },

  async updatePrice(product_id, { price_per_kg, high_of_day, low_of_day }): Promise<void> {
    await delay();
    const db = loadDb();
    const admin = requireAdmin(db);
    const product = db.products.find((p) => p.id === product_id);
    if (!product) throw new ApiError('ไม่พบสินค้า', 404);
    const oldPrice = product.price_per_kg;
    product.prev_price_per_kg = product.price_per_kg;
    product.price_per_kg = price_per_kg;
    product.high_of_day = high_of_day;
    product.low_of_day = low_of_day;
    product.updated_at = new Date().toISOString();
    recordAudit(db, 'update_price', { actor: admin, entity: 'product', entity_id: product_id, detail: { old_price: oldPrice, new_price: price_per_kg, high_of_day, low_of_day } });
    saveDb(db);
  },

  async listAllProducts(): Promise<Product[]> {
    await delay();
    const db = loadDb();
    requireAdmin(db);
    return sortProducts(db.products);
  },

  async addProduct({ material, name_th, name_en, price_per_kg }): Promise<void> {
    await delay();
    const db = loadDb();
    const admin = requireAdmin(db);
    if (!MATERIALS.includes(material)) throw new ApiError('ประเภทวัสดุไม่ถูกต้อง', 400);
    if (!name_th.trim()) throw new ApiError('กรุณากรอกชื่อสินค้า', 400);
    if (!(price_per_kg > 0)) throw new ApiError('ราคาต้องมากกว่า 0', 400);
    const maxSort = Math.max(0, ...db.products.map((p) => p.sort_order));
    const newId = db.nextProductId++;
    db.products.push({
      id: newId,
      material,
      name_th: name_th.trim(),
      name_en: name_en.trim(),
      price_per_kg,
      prev_price_per_kg: price_per_kg,
      high_of_day: price_per_kg,
      low_of_day: price_per_kg,
      sort_order: maxSort + 1,
      active: true,
      updated_at: new Date().toISOString(),
    });
    recordAudit(db, 'add_product', { actor: admin, entity: 'product', entity_id: newId, detail: { material, name_th: name_th.trim(), price_per_kg } });
    saveDb(db);
  },

  async updateProduct(product_id, { material, name_th, name_en }): Promise<void> {
    await delay();
    const db = loadDb();
    const admin = requireAdmin(db);
    if (!MATERIALS.includes(material)) throw new ApiError('ประเภทวัสดุไม่ถูกต้อง', 400);
    if (!name_th.trim()) throw new ApiError('กรุณากรอกชื่อสินค้า', 400);
    const product = db.products.find((p) => p.id === product_id);
    if (!product) throw new ApiError('ไม่พบสินค้า', 404);
    product.material = material;
    product.name_th = name_th.trim();
    product.name_en = name_en.trim();
    recordAudit(db, 'update_product', { actor: admin, entity: 'product', entity_id: product_id, detail: { material, name_th: name_th.trim(), name_en: name_en.trim() } });
    saveDb(db);
  },

  async setProductActive(product_id, active): Promise<void> {
    await delay();
    const db = loadDb();
    const admin = requireAdmin(db);
    const product = db.products.find((p) => p.id === product_id);
    if (!product) throw new ApiError('ไม่พบสินค้า', 404);
    product.active = active;
    recordAudit(db, active ? 'show_product' : 'hide_product', { actor: admin, entity: 'product', entity_id: product_id, detail: { active } });
    saveDb(db);
  },

  async deleteProduct(product_id): Promise<void> {
    await delay();
    const db = loadDb();
    const admin = requireAdmin(db);
    const product = db.products.find((p) => p.id === product_id);
    if (!product) throw new ApiError('ไม่พบสินค้า', 404);
    if (db.bookings.some((b) => b.product_id === product_id)) {
      throw new ApiError('สินค้านี้มีประวัติการจองแล้ว ลบถาวรไม่ได้ — ใช้ "ซ่อน" แทน', 409);
    }
    db.products = db.products.filter((p) => p.id !== product_id);
    recordAudit(db, 'delete_product', { actor: admin, entity: 'product', entity_id: product_id });
    saveDb(db);
  },

  async reorderProducts(order): Promise<void> {
    await delay();
    const db = loadDb();
    const admin = requireAdmin(db);
    order.forEach((pid, i) => {
      const product = db.products.find((p) => p.id === pid);
      if (product) product.sort_order = i + 1;
    });
    recordAudit(db, 'reorder_products', { actor: admin, entity: 'product', detail: { order } });
    saveDb(db);
  },

  async listAudit(query: AuditQuery = {}): Promise<AuditResult> {
    await delay(150);
    const db = loadDb();
    requireAdmin(db);
    const q = (query.q ?? '').trim().toLowerCase();
    const filtered = db.audit.filter((e) => {
      if (query.action && e.action !== query.action) return false;
      if (query.user_id !== undefined && e.user_id !== query.user_id) return false;
      if (query.from && e.created_at.slice(0, 10) < query.from) return false;
      if (query.to && e.created_at.slice(0, 10) > query.to) return false;
      if (q) {
        const hay = `${e.actor_email ?? ''} ${e.ip ?? ''} ${e.detail ?? ''} ${e.user_agent ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    // ใหม่สุดก่อน
    const sorted = [...filtered].sort((a, b) => b.id - a.id);
    const perPage = Math.min(Math.max(query.per_page ?? 50, 1), 10000);
    const page = Math.max(query.page ?? 1, 1);
    const start = (page - 1) * perPage;
    const actions = [...new Set(db.audit.map((e) => e.action))].sort();
    return {
      entries: sorted.slice(start, start + perPage),
      total: filtered.length,
      page,
      per_page: perPage,
      actions,
    };
  },
};
