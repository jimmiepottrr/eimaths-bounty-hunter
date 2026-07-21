/**
 * Auth store — เก็บ session (token + user) ใน localStorage, revalidate ตอนเปิดแอป
 * 401 จาก backend → เคลียร์ session แล้วพาไปหน้า login
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService, setAuthErrorHandler } from './data/service';
import type { User } from './data/types';

const SESSION_KEY = 'copper8000_session';

type Session = { token: string; user: User };

type AuthContextValue = {
  user: User | null;
  booting: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (input: { email: string; password: string; name: string; phone: string }) => Promise<User>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const loadSession = (): Session | null => {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(() => {
    const s = loadSession();
    if (s) dataService.setAuthToken(s.token);
    return s;
  });
  const [booting, setBooting] = useState(!!session);

  const persist = useCallback((next: Session | null) => {
    setSession(next);
    dataService.setAuthToken(next?.token ?? null);
    if (next) localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    else localStorage.removeItem(SESSION_KEY);
  }, []);

  const logout = useCallback(() => {
    persist(null);
    navigate('/');
  }, [persist, navigate]);

  useEffect(() => {
    setAuthErrorHandler(() => {
      persist(null);
      navigate('/login');
    });
    return () => setAuthErrorHandler(null);
  }, [persist, navigate]);

  // revalidate session ตอนเปิดแอป (สถานะ approved อาจเปลี่ยนแล้ว)
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    dataService
      .me()
      .then((user) => {
        if (!cancelled) setSession((s) => (s ? { ...s, user } : s));
      })
      .catch(() => {
        if (!cancelled) persist(null);
      })
      .finally(() => {
        if (!cancelled) setBooting(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await dataService.login(email, password);
      persist({ token: res.token, user: res.user });
      return res.user;
    },
    [persist],
  );

  const signup = useCallback(
    async (input: { email: string; password: string; name: string; phone: string }) => {
      const res = await dataService.signup(input);
      persist({ token: res.token, user: res.user });
      return res.user;
    },
    [persist],
  );

  const refreshUser = useCallback(async () => {
    const user = await dataService.me();
    setSession((s) => {
      const next = s ? { ...s, user } : s;
      if (next) localStorage.setItem(SESSION_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user: session?.user ?? null, booting, login, signup, logout, refreshUser }),
    [session, booting, login, signup, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth ต้องอยู่ภายใน <AuthProvider>');
  return ctx;
};
