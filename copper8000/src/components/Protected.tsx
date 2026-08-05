import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../store';

export const RequireAuth = ({ children }: { children: ReactNode }) => {
  const { user, booting } = useAuth();
  if (booting) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export const RequireAdmin = ({ children }: { children: ReactNode }) => {
  const { user, booting } = useAuth();
  if (booting) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
};

/** เฉพาะ role=agent (พนักงานขาย) — คนอื่นเด้งกลับหน้าแรก */
export const RequireAgent = ({ children }: { children: ReactNode }) => {
  const { user, booting } = useAuth();
  if (booting) return null;
  if (!user) return <Navigate to="/agent-login" replace />;
  if (user.role !== 'agent') return <Navigate to="/" replace />;
  return <>{children}</>;
};
