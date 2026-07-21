/**
 * จุดสลับ adapter — ตั้ง VITE_API_BASE/VITE_API_KEY แล้ว = backend จริง
 * ยังไม่ตั้ง = โหมดสาธิต (mock ใน localStorage) เว็บใช้งานได้ทันทีตั้งแต่วันแรก
 */

import { isApiConfigured } from '../config';
import { httpAdapter, setAuthErrorHandler as setHttpAuthErrorHandler } from './httpAdapter';
import { mockAdapter } from './mockAdapter';
import type { DataService } from './types';

export const IS_DEMO = !isApiConfigured();

export const dataService: DataService = IS_DEMO ? mockAdapter : httpAdapter;

/** 401 handler ใช้เฉพาะ HTTP adapter (mock โยน ApiError ตรงๆ ให้ store จัดการ) */
export const setAuthErrorHandler = (handler: (() => void) | null) => {
  if (!IS_DEMO) setHttpAuthErrorHandler(handler);
};
