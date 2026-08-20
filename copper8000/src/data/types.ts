// ---------- Domain types ----------

export type Material = 'copper' | 'brass' | 'aluminium';

export type User = {
  id: number;
  email: string;
  name: string;
  phone: string;
  role: 'user' | 'agent' | 'admin';
  approved: boolean;
  agent_id?: number | null; // (ลูกค้า) สังกัด agent คนไหน
  referral_code?: string | null; // (agent) โค้ดแนะนำ
  commission_rate?: number; // (agent) % ค่าคอม
  credit_balance?: number; // (ลูกค้า) เครดิตคงเหลือที่ใช้ได้
  credit_held?: number; // (ลูกค้า) เครดิตที่ถูกกันไว้ (มัดจำการจองที่ค้าง)
  warnings?: number; // (ลูกค้า) จำนวนใบเตือน
  booking_suspended?: boolean; // (ลูกค้า) ถูกระงับสิทธิ์จอง
};

/** agent + สรุปค่าคอม (หน้าแอดมิน) */
export type AgentSummary = User & {
  customer_count: number;
  confirmed_total: number; // ยอดจอง confirmed รวมของลูกค้าที่ผูก
  commission: number; // = commission_rate% × confirmed_total
};

/** สรุปค่าคอมของ agent เอง */
export type AgentCommission = {
  referral_code: string | null;
  commission_rate: number;
  customer_count: number;
  confirmed_total: number;
  commission: number;
};

/** ลูกค้าที่ผูกกับ agent (มุมมอง agent) */
export type AgentMember = {
  id: number;
  name: string;
  email: string;
  phone: string;
  approved: boolean;
  confirmed_total: number;
};

export type Product = {
  id: number;
  material: Material;
  name_th: string;
  name_en: string;
  price_per_kg: number;
  prev_price_per_kg: number;
  high_of_day: number;
  low_of_day: number;
  sort_order: number;
  active: boolean;
  updated_at: string;
};

export type Unit = 'kg' | 'ton';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export type Booking = {
  id: number;
  user_id: number;
  user_name?: string;
  product_id: number;
  product_name: string;
  product_name_en?: string | null;
  quantity: number;
  unit: Unit;
  price_at_booking: number; // บาท/กก. ณ เวลาจอง
  total_estimate: number; // ยอดประมาณการ (บาท)
  status: BookingStatus;
  deposit_held?: number; // เครดิตมัดจำที่การจองนี้กันไว้ (0 = คืน/ยกเลิกแล้ว)
  delivery_date?: string | null; // วันที่ลูกค้าจะส่งของ (YYYY-MM-DD)
  actual_weight_kg?: number | null; // น้ำหนักส่งจริง (แอดมินกรอก)
  qc_weight_kg?: number | null; // น้ำหนักสุทธิหลัง QC (แอดมินกรอก)
  created_at: string;
};

export type AuthResult = { user: User; token: string };

export type AnnounceMode = 'marquee' | 'popup';

/** ข้อความประกาศต่อภาษา (คีย์ = รหัสภาษา เช่น th/en/zh หรือภาษาที่เพิ่มเอง)
 *  — แสดงตามภาษาที่ผู้ใช้เลือก รองรับภาษาใหม่ที่เพิ่มในอนาคตอัตโนมัติ */
export type AnnounceText = Record<string, string>;

/** ข้อความประกาศที่แอดมินตั้ง — แสดงแบบแถบอักษรวิ่งใต้เมนู หรือ pop up */
export type Announcement = {
  text: AnnounceText;
  mode: AnnounceMode;
  active: boolean;
};

export type AppSettings = { theme: string; announcement: Announcement; booking_deposit: number };

/** หนึ่งรายการในบันทึกการใช้งาน (audit log) — บันทึกฝั่งเซิร์ฟเวอร์ ผู้ใช้ปลอมไม่ได้ */
export type AuditEntry = {
  id: number;
  created_at: string;
  user_id: number | null; // null = ไม่ได้ล็อกอิน (guest)
  actor_email: string | null;
  actor_role: string | null;
  action: string;
  entity: string | null;
  entity_id: number | null;
  detail: string | null; // JSON string (รายละเอียด เช่น ราคาเก่า→ใหม่)
  ip: string | null;
  user_agent: string | null;
};

export type AuditQuery = {
  action?: string;
  user_id?: number;
  q?: string; // ค้นอีเมล/IP/รายละเอียด/user agent
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  page?: number;
  per_page?: number;
};

export type AuditResult = {
  entries: AuditEntry[];
  total: number;
  page: number;
  per_page: number;
  actions: string[]; // action ทั้งหมดที่เคยเกิด (ทำ dropdown ตัวกรอง)
};

export type LanguageInfo = {
  code: string;
  name_native: string;
  enabled: boolean;
  built_in: boolean;
  sort_order: number;
  /** dict เต็มเฉพาะภาษาที่แอดมินเพิ่มเอง — ภาษา built-in (th/en/zh) dict อยู่ใน bundle จึงเป็น null */
  dict: Record<string, string> | null;
};

// ---------- Error ----------

export class ApiError extends Error {
  status: number;
  isAuthError: boolean;
  isNetworkError: boolean;

  constructor(message: string, status = 0) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.isAuthError = status === 401;
    this.isNetworkError = status === 0;
  }
}

// ---------- Service interface ----------

export interface DataService {
  setAuthToken(token: string | null): void;
  signup(input: {
    email: string;
    password: string;
    name: string;
    phone: string;
    referral_code?: string;
  }): Promise<AuthResult>;
  login(email: string, password: string): Promise<AuthResult>;
  me(): Promise<User>;
  /** เปลี่ยนรหัสผ่านของตัวเอง (ข้อมูลอื่นแก้ไม่ได้ — ต้องติดต่อบริษัท) */
  changePassword(current_password: string, new_password: string): Promise<void>;
  listProducts(): Promise<Product[]>;
  /** expected_price_per_kg = ราคาที่ผู้ใช้เห็นบนจอ — เซิร์ฟเวอร์ปฏิเสธ (409) ถ้าราคาปัจจุบันไม่ตรง */
  createBooking(input: {
    product_id: number;
    quantity: number;
    unit: Unit;
    expected_price_per_kg?: number;
    delivery_date?: string | null;
  }): Promise<Booking>;
  /** 10 รายการล่าสุดของผู้ใช้ที่ login อยู่ */
  listMyBookings(): Promise<Booking[]>;
  // ---- admin ----
  listPendingUsers(): Promise<User[]>;
  setUserApproval(user_id: number, approved: boolean): Promise<void>;
  /** พนักงาน (agent) — สร้าง/ดู/ลบ ได้เฉพาะแอดมิน (agent สมัครเองไม่ได้) */
  /** รายชื่อ agent + สรุปค่าคอม (admin) */
  listAgents(): Promise<AgentSummary[]>;
  createAgent(input: {
    email: string;
    password: string;
    name: string;
    phone: string;
    commission_rate?: number;
  }): Promise<{ referral_code?: string }>;
  deleteAgent(user_id: number): Promise<void>;
  /** แอดมินตั้ง % ค่าคอมให้ agent */
  setCommissionRate(user_id: number, commission_rate: number): Promise<void>;
  // ---- agent (พนักงานดูของตัวเอง) ----
  /** สรุปค่าคอมของ agent ที่ล็อกอินอยู่ */
  agentCommission(): Promise<AgentCommission>;
  /** รายชื่อลูกค้าที่ผูกกับ agent ที่ล็อกอินอยู่ */
  agentMembers(): Promise<AgentMember[]>;
  // ---- เครดิต / มัดจำ / ตักเตือน (admin) ----
  /** รายชื่อลูกค้าทั้งหมด + เครดิต/ใบเตือน/สถานะระงับ */
  listCustomers(): Promise<User[]>;
  /** เติม/ปรับเครดิตให้ลูกค้า (amount บวก=เติม, ลบ=หัก) */
  grantCredit(user_id: number, amount: number): Promise<void>;
  /** ตั้งยอดมัดจำ (เครดิต) ต่อการจอง 1 ครั้ง — 0 = ปิดระบบมัดจำ */
  setBookingDeposit(amount: number): Promise<void>;
  /** รีเซ็ตใบเตือน + ปลดระงับสิทธิ์จอง */
  resetWarnings(user_id: number): Promise<void>;
  /** ระงับ/ปลดระงับสิทธิ์จองด้วยตนเอง */
  setBookingSuspended(user_id: number, suspended: boolean): Promise<void>;
  listAllBookings(): Promise<Booking[]>;
  confirmBooking(booking_id: number): Promise<void>;
  /** ยกเลิก/ไม่มาส่งของ → คืนเครดิตที่กันไว้ + บันทึกใบเตือน (ครบ 3 = ระงับสิทธิ์) */
  cancelBooking(booking_id: number): Promise<{ warnings: number; suspended: boolean }>;
  /** แอดมินบันทึกน้ำหนักส่งจริง + น้ำหนักสุทธิหลัง QC (ส่ง null เพื่อล้างค่า) */
  setBookingWeights(
    booking_id: number,
    input: { actual_weight_kg: number | null; qc_weight_kg: number | null },
  ): Promise<void>;
  updatePrice(
    product_id: number,
    input: { price_per_kg: number; high_of_day: number; low_of_day: number },
  ): Promise<void>;
  // ---- product management (admin) ----
  /** ทุกสินค้า รวมที่ซ่อนอยู่ (admin) — ต่างจาก listProducts ที่แสดงเฉพาะ active */
  listAllProducts(): Promise<Product[]>;
  addProduct(input: {
    material: Material;
    name_th: string;
    name_en: string;
    price_per_kg: number;
  }): Promise<void>;
  updateProduct(
    product_id: number,
    input: { material: Material; name_th: string; name_en: string },
  ): Promise<void>;
  setProductActive(product_id: number, active: boolean): Promise<void>;
  /** ลบถาวรได้เฉพาะสินค้าที่ไม่เคยถูกจอง — ถ้ามีประวัติให้ซ่อนแทน (เซิร์ฟเวอร์ตอบ 409) */
  deleteProduct(product_id: number): Promise<void>;
  /** จัดเรียงใหม่ — ส่งลำดับ id ตามที่ต้องการ */
  reorderProducts(order: number[]): Promise<void>;
  // ---- languages ----
  /** ภาษาที่เปิดใช้งาน (สาธารณะ) */
  listLanguages(): Promise<LanguageInfo[]>;
  /** ทุกภาษา รวมที่ปิดอยู่ (admin) */
  listAllLanguages(): Promise<LanguageInfo[]>;
  addLanguage(input: { code: string; name_native: string; dict: Record<string, string> }): Promise<void>;
  updateLanguage(
    code: string,
    input: { name_native?: string; dict?: Record<string, string> },
  ): Promise<void>;
  setLanguageEnabled(code: string, enabled: boolean): Promise<void>;
  /** ลบได้เฉพาะภาษาที่เพิ่มเอง — ภาษา built-in ทำได้แค่ปิด */
  deleteLanguage(code: string): Promise<void>;
  // ---- settings ----
  /** ตั้งค่าเว็บ (สาธารณะ เช่น ธีมสี + ข้อความประกาศ) */
  getSettings(): Promise<AppSettings>;
  /** เปลี่ยนธีมทั้งเว็บ (admin) */
  setTheme(theme: string): Promise<void>;
  /** ตั้งข้อความประกาศ (3 ภาษา) + รูปแบบการแสดง (admin) */
  setAnnouncement(input: { text: AnnounceText; mode: AnnounceMode; active: boolean }): Promise<void>;
  // ---- audit log ----
  /** บันทึกการใช้งาน (admin) — กรอง/แบ่งหน้าได้ */
  listAudit(query?: AuditQuery): Promise<AuditResult>;
}
