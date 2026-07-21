/**
 * HTTP adapter — คุยกับ backend PHP จริงบน VPS (pattern เดียวกับ src/api.ts ของเกม)
 * - แนบ X-Api-Key ทุก request · แนบ Authorization: Bearer <token> หลังล็อกอิน
 * - error ทุกแบบกลายเป็น ApiError ข้อความไทย · 401 → เรียก handler ที่ store ลงทะเบียนไว้
 */

import { API_BASE, API_KEY, REQUEST_TIMEOUT_MS } from '../config';
import { t } from '../i18n/core';
import {
  ApiError,
  type AuthResult,
  type Booking,
  type DataService,
  type LanguageInfo,
  type Product,
  type User,
} from './types';

type Json = Record<string, unknown>;

let authToken: string | null = null;
let onAuthError: (() => void) | null = null;

export const setAuthErrorHandler = (handler: (() => void) | null) => {
  onAuthError = handler;
};

const request = async <T>(
  path: string,
  options: { method?: 'GET' | 'POST'; body?: Json } = {},
): Promise<T> => {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        'X-Api-Key': API_KEY,
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
  } catch (error) {
    window.clearTimeout(timer);
    if ((error as Error).name === 'AbortError') {
      throw new ApiError(t('errors.timeout'), 0);
    }
    throw new ApiError(t('errors.network'), 0);
  } finally {
    window.clearTimeout(timer);
  }

  let data: Json | null = null;
  try {
    data = (await response.json()) as Json;
  } catch {
    data = null;
  }

  if (response.status === 401) {
    onAuthError?.();
    throw new ApiError((data?.error as string) || t('errors.sessionExpired'), 401);
  }

  if (!response.ok || !data || data.ok !== true) {
    throw new ApiError((data?.error as string) || t('errors.generic'), response.status);
  }

  return data as T;
};

export const httpAdapter: DataService = {
  setAuthToken(token) {
    authToken = token;
  },

  async signup(input): Promise<AuthResult> {
    const res = await request<{ token: string; user: User }>('/auth.php', {
      method: 'POST',
      body: { action: 'signup', ...input },
    });
    return { token: res.token, user: res.user };
  },

  async login(email, password): Promise<AuthResult> {
    const res = await request<{ token: string; user: User }>('/auth.php', {
      method: 'POST',
      body: { action: 'login', email, password },
    });
    return { token: res.token, user: res.user };
  },

  async me(): Promise<User> {
    const res = await request<{ user: User }>('/auth.php');
    return res.user;
  },

  async listProducts(): Promise<Product[]> {
    const res = await request<{ products: Product[] }>('/products.php');
    return res.products;
  },

  async createBooking(input): Promise<Booking> {
    const res = await request<{ booking: Booking }>('/bookings.php', {
      method: 'POST',
      body: input,
    });
    return res.booking;
  },

  async listMyBookings(): Promise<Booking[]> {
    const res = await request<{ bookings: Booking[] }>('/bookings.php');
    return res.bookings;
  },

  async listPendingUsers(): Promise<User[]> {
    const res = await request<{ users: User[] }>('/admin.php?view=pending_users');
    return res.users;
  },

  async setUserApproval(user_id, approved): Promise<void> {
    await request('/admin.php', {
      method: 'POST',
      body: { action: 'set_approval', user_id, approved },
    });
  },

  async listAllBookings(): Promise<Booking[]> {
    const res = await request<{ bookings: Booking[] }>('/admin.php?view=bookings');
    return res.bookings;
  },

  async confirmBooking(booking_id): Promise<void> {
    await request('/admin.php', {
      method: 'POST',
      body: { action: 'confirm_booking', booking_id },
    });
  },

  async updatePrice(product_id, input): Promise<void> {
    await request('/admin.php', {
      method: 'POST',
      body: { action: 'update_price', product_id, ...input },
    });
  },

  async listLanguages(): Promise<LanguageInfo[]> {
    const res = await request<{ languages: LanguageInfo[] }>('/languages.php');
    return res.languages;
  },

  async listAllLanguages(): Promise<LanguageInfo[]> {
    const res = await request<{ languages: LanguageInfo[] }>('/languages.php?all=1');
    return res.languages;
  },

  async addLanguage(input): Promise<void> {
    await request('/languages.php', { method: 'POST', body: { action: 'add', ...input } });
  },

  async updateLanguage(code, input): Promise<void> {
    await request('/languages.php', { method: 'POST', body: { action: 'update', code, ...input } });
  },

  async setLanguageEnabled(code, enabled): Promise<void> {
    await request('/languages.php', {
      method: 'POST',
      body: { action: 'set_enabled', code, enabled },
    });
  },

  async deleteLanguage(code): Promise<void> {
    await request('/languages.php', { method: 'POST', body: { action: 'delete', code } });
  },
};
