// ---------- Domain types ----------

export type Material = 'copper' | 'brass' | 'aluminium';

export const MATERIAL_LABEL: Record<Material, string> = {
  copper: 'ทองแดง',
  brass: 'ทองเหลือง',
  aluminium: 'อลูมิเนียม',
};

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

export const UNIT_LABEL: Record<Unit, string> = { kg: 'กิโลกรัม', ton: 'ตัน' };

export type BookingStatus = 'pending' | 'confirmed';

export type Booking = {
  id: number;
  user_id: number;
  user_name?: string;
  product_id: number;
  product_name: string;
  quantity: number;
  unit: Unit;
  price_at_booking: number; // บาท/กก. ณ เวลาจอง
  total_estimate: number; // ยอดประมาณการ (บาท)
  status: BookingStatus;
  created_at: string;
};

export type AuthResult = { user: User; token: string };

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
  createBooking(input: { product_id: number; quantity: number; unit: Unit }): Promise<Booking>;
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
}
