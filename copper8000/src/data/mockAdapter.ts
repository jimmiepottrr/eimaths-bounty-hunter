/**
 * Mock adapter (โหมดสาธิต) — เก็บทุกอย่างใน localStorage ของเบราว์เซอร์
 * ใช้อัตโนมัติเมื่อยังไม่ตั้ง VITE_API_BASE/VITE_API_KEY เพื่อให้เว็บใช้งานได้ทันที
 * สลับเป็น backend จริงได้โดยไม่ต้องแก้หน้าจอ (ผ่าน service.ts)
 */

import { SEED_BOOKINGS, SEED_PRODUCTS, SEED_USERS, type SeedUser } from './seed';
import {
  ApiError,
  type AuthResult,
  type Booking,
  type DataService,
  type Product,
  type Unit,
  type User,
} from './types';

const DB_KEY = 'copper8000_db_v1';

type Db = {
  users: SeedUser[];
  products: Product[];
  bookings: Booking[];
  sessions: Record<string, number>; // token -> user id
  nextUserId: number;
  nextBookingId: number;
};

const loadDb = (): Db => {
  const raw = localStorage.getItem(DB_KEY);
  if (raw) {
    try {
      return JSON.parse(raw) as Db;
    } catch {
      /* seed ใหม่ */
    }
  }
  const db: Db = {
    users: [...SEED_USERS],
    products: [...SEED_PRODUCTS],
    bookings: [...SEED_BOOKINGS],
    sessions: {},
    nextUserId: 100,
    nextBookingId: 100,
  };
  localStorage.setItem(DB_KEY, JSON.stringify(db));
  return db;
};

const saveDb = (db: Db) => localStorage.setItem(DB_KEY, JSON.stringify(db));

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

export const mockAdapter: DataService = {
  setAuthToken(token) {
    authToken = token;
  },

  async signup({ email, password, name, phone }): Promise<AuthResult> {
    await delay();
    const db = loadDb();
    const normEmail = email.trim().toLowerCase();
    if (!normEmail || !password || !name.trim()) {
      throw new ApiError('กรุณากรอกข้อมูลให้ครบถ้วน', 400);
    }
    if (db.users.some((u) => u.email === normEmail)) {
      throw new ApiError('อีเมลนี้ถูกใช้สมัครแล้ว', 409);
    }
    const user: SeedUser = {
      id: db.nextUserId++,
      email: normEmail,
      password,
      name: name.trim(),
      phone: phone.trim(),
      role: 'user',
      approved: false,
    };
    db.users.push(user);
    const token = createSession(db, user.id);
    authToken = token;
    return { user: publicUser(user), token };
  },

  async login(email, password): Promise<AuthResult> {
    await delay();
    const db = loadDb();
    const user = db.users.find((u) => u.email === email.trim().toLowerCase());
    if (!user || user.password !== password) {
      throw new ApiError('อีเมลหรือรหัสผ่านไม่ถูกต้อง', 401);
    }
    const token = createSession(db, user.id);
    authToken = token;
    return { user: publicUser(user), token };
  },

  async me(): Promise<User> {
    await delay(100);
    return publicUser(requireUser(loadDb()));
  },

  async listProducts(): Promise<Product[]> {
    await delay();
    return loadDb().products;
  },

  async createBooking({ product_id, quantity, unit }): Promise<Booking> {
    await delay();
    const db = loadDb();
    const user = requireUser(db);
    if (!user.approved) {
      throw new ApiError('บัญชียังไม่ได้รับการอนุมัติ จึงยังจองไม่ได้', 403);
    }
    const product = db.products.find((p) => p.id === product_id);
    if (!product) throw new ApiError('ไม่พบสินค้า', 404);
    if (!(quantity > 0)) throw new ApiError('จำนวนต้องมากกว่า 0', 400);
    const kg = unit === 'ton' ? quantity * 1000 : quantity;
    const booking: Booking = {
      id: db.nextBookingId++,
      user_id: user.id,
      user_name: user.name,
      product_id,
      product_name: product.name_th,
      quantity,
      unit: unit as Unit,
      price_at_booking: product.price_per_kg,
      total_estimate: Math.round(kg * product.price_per_kg * 100) / 100,
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    db.bookings.push(booking);
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
    requireAdmin(db);
    const user = db.users.find((u) => u.id === user_id);
    if (!user) throw new ApiError('ไม่พบผู้ใช้', 404);
    user.approved = approved;
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
    requireAdmin(db);
    const booking = db.bookings.find((b) => b.id === booking_id);
    if (!booking) throw new ApiError('ไม่พบรายการจอง', 404);
    booking.status = 'confirmed';
    saveDb(db);
  },

  async updatePrice(product_id, { price_per_kg, high_of_day, low_of_day }): Promise<void> {
    await delay();
    const db = loadDb();
    requireAdmin(db);
    const product = db.products.find((p) => p.id === product_id);
    if (!product) throw new ApiError('ไม่พบสินค้า', 404);
    product.prev_price_per_kg = product.price_per_kg;
    product.price_per_kg = price_per_kg;
    product.high_of_day = high_of_day;
    product.low_of_day = low_of_day;
    product.updated_at = new Date().toISOString();
    saveDb(db);
  },
};
