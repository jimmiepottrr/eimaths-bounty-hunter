/**
 * HTTP adapter — คุยกับ backend PHP จริงบน VPS (pattern เดียวกับ src/api.ts ของเกม)
 * - แนบ X-Api-Key ทุก request · แนบ Authorization: Bearer <token> หลังล็อกอิน
 * - error ทุกแบบกลายเป็น ApiError ข้อความไทย · 401 → เรียก handler ที่ store ลงทะเบียนไว้
 */

import { API_BASE, API_KEY, REQUEST_TIMEOUT_MS } from '../config';
import { t } from '../i18n/core';
import {
  ApiError,
  type AgentCommission,
  type AgentMember,
  type AgentSummary,
  type AppSettings,
  type AuditQuery,
  type AuditResult,
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

  async changePassword(current_password, new_password): Promise<void> {
    await request('/auth.php', {
      method: 'POST',
      body: { action: 'change_password', current_password, new_password },
    });
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

  async listAgents(): Promise<AgentSummary[]> {
    const res = await request<{ agents: AgentSummary[] }>('/admin.php?view=agents');
    return res.agents ?? [];
  },

  async createAgent(input): Promise<{ referral_code?: string }> {
    const res = await request<{ referral_code?: string }>('/admin.php', {
      method: 'POST',
      body: { action: 'create_agent', ...input },
    });
    return { referral_code: res.referral_code };
  },

  async deleteAgent(user_id): Promise<void> {
    await request('/admin.php', { method: 'POST', body: { action: 'delete_agent', user_id } });
  },

  async setCommissionRate(user_id, commission_rate): Promise<void> {
    await request('/admin.php', {
      method: 'POST',
      body: { action: 'set_commission_rate', user_id, commission_rate },
    });
  },

  async agentCommission(): Promise<AgentCommission> {
    const res = await request<{ commission: AgentCommission }>('/agent.php?view=commission');
    return res.commission;
  },

  async agentMembers(): Promise<AgentMember[]> {
    const res = await request<{ members: AgentMember[] }>('/agent.php?view=members');
    return res.members ?? [];
  },

  async listCustomers(): Promise<User[]> {
    const res = await request<{ customers: User[] }>('/admin.php?view=customers');
    return res.customers ?? [];
  },

  async grantCredit(user_id, amount): Promise<void> {
    await request('/admin.php', { method: 'POST', body: { action: 'grant_credit', user_id, amount } });
  },

  async setBookingDeposit(amount): Promise<void> {
    await request('/admin.php', { method: 'POST', body: { action: 'set_booking_deposit', amount } });
  },

  async resetWarnings(user_id): Promise<void> {
    await request('/admin.php', { method: 'POST', body: { action: 'reset_warnings', user_id } });
  },

  async setBookingSuspended(user_id, suspended): Promise<void> {
    await request('/admin.php', {
      method: 'POST',
      body: { action: 'set_booking_suspended', user_id, suspended },
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

  async cancelBooking(booking_id): Promise<{ warnings: number; suspended: boolean }> {
    const res = await request<{ warnings?: number; suspended?: boolean }>('/admin.php', {
      method: 'POST',
      body: { action: 'cancel_booking', booking_id },
    });
    return { warnings: res.warnings ?? 0, suspended: res.suspended ?? false };
  },

  async setBookingWeights(booking_id, input): Promise<void> {
    await request('/admin.php', {
      method: 'POST',
      body: { action: 'set_weights', booking_id, ...input },
    });
  },

  async updatePrice(product_id, input): Promise<void> {
    await request('/admin.php', {
      method: 'POST',
      body: { action: 'update_price', product_id, ...input },
    });
  },

  async listAllProducts(): Promise<Product[]> {
    const res = await request<{ products: Product[] }>('/admin.php?view=products');
    return res.products;
  },

  async addProduct(input): Promise<void> {
    await request('/admin.php', { method: 'POST', body: { action: 'add_product', ...input } });
  },

  async updateProduct(product_id, input): Promise<void> {
    await request('/admin.php', {
      method: 'POST',
      body: { action: 'update_product', product_id, ...input },
    });
  },

  async setProductActive(product_id, active): Promise<void> {
    await request('/admin.php', {
      method: 'POST',
      body: { action: 'set_product_active', product_id, active },
    });
  },

  async deleteProduct(product_id): Promise<void> {
    await request('/admin.php', {
      method: 'POST',
      body: { action: 'delete_product', product_id },
    });
  },

  async reorderProducts(order): Promise<void> {
    await request('/admin.php', {
      method: 'POST',
      body: { action: 'reorder_products', order },
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

  async getSettings(): Promise<AppSettings> {
    const res = await request<{ settings: Partial<AppSettings> }>('/settings.php');
    const a = res.settings.announcement;
    const at = a?.text;
    return {
      theme: res.settings.theme ?? 'gold',
      announcement: {
        text: at && typeof at === 'object' ? (at as Record<string, string>) : {},
        mode: a?.mode === 'popup' ? 'popup' : 'marquee',
        active: a?.active ?? false,
      },
      booking_deposit: Number(res.settings.booking_deposit ?? 0) || 0,
    };
  },

  async setTheme(theme): Promise<void> {
    await request('/settings.php', { method: 'POST', body: { action: 'set_theme', theme } });
  },

  async setAnnouncement(input): Promise<void> {
    await request('/settings.php', { method: 'POST', body: { action: 'set_announcement', ...input } });
  },

  async listAudit(query: AuditQuery = {}): Promise<AuditResult> {
    const qs = new URLSearchParams();
    if (query.action) qs.set('action', query.action);
    if (query.user_id !== undefined) qs.set('user_id', String(query.user_id));
    if (query.q) qs.set('q', query.q);
    if (query.from) qs.set('from', query.from);
    if (query.to) qs.set('to', query.to);
    if (query.page !== undefined) qs.set('page', String(query.page));
    if (query.per_page !== undefined) qs.set('per_page', String(query.per_page));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    const res = await request<AuditResult>(`/audit.php${suffix}`);
    return {
      entries: res.entries ?? [],
      total: res.total ?? 0,
      page: res.page ?? 1,
      per_page: res.per_page ?? 50,
      actions: res.actions ?? [],
    };
  },
};
