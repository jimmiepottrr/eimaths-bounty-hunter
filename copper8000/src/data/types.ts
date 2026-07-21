// ---------- Domain types ----------

export type Material = 'copper' | 'brass' | 'aluminium';

export type User = {
  id: number;
  email: string;
  name: string;
  phone: string;
  role: 'user' | 'admin';
  approved: boolean;
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
  updated_at: string;
};

export type Unit = 'kg' | 'ton';

export type BookingStatus = 'pending' | 'confirmed';

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
  created_at: string;
};

export type AuthResult = { user: User; token: string };

export type AppSettings = { theme: string };

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
  signup(input: { email: string; password: string; name: string; phone: string }): Promise<AuthResult>;
  login(email: string, password: string): Promise<AuthResult>;
  me(): Promise<User>;
  listProducts(): Promise<Product[]>;
  /** expected_price_per_kg = ราคาที่ผู้ใช้เห็นบนจอ — เซิร์ฟเวอร์ปฏิเสธ (409) ถ้าราคาปัจจุบันไม่ตรง */
  createBooking(input: {
    product_id: number;
    quantity: number;
    unit: Unit;
    expected_price_per_kg?: number;
  }): Promise<Booking>;
  /** 10 รายการล่าสุดของผู้ใช้ที่ login อยู่ */
  listMyBookings(): Promise<Booking[]>;
  // ---- admin ----
  listPendingUsers(): Promise<User[]>;
  setUserApproval(user_id: number, approved: boolean): Promise<void>;
  listAllBookings(): Promise<Booking[]>;
  confirmBooking(booking_id: number): Promise<void>;
  updatePrice(
    product_id: number,
    input: { price_per_kg: number; high_of_day: number; low_of_day: number },
  ): Promise<void>;
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
  /** ตั้งค่าเว็บ (สาธารณะ เช่น ธีมสี) */
  getSettings(): Promise<AppSettings>;
  /** เปลี่ยนธีมทั้งเว็บ (admin) */
  setTheme(theme: string): Promise<void>;
}
