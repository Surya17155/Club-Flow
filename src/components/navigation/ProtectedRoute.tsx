import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getSuperAdminModeForUser, isSuperAdminUser } from '@/lib/superAdminMode';

interface ProtectedRouteProps {
  children: ReactNode;
}

const hasPersistedAuthToken = (): boolean => {
  try {
    if (typeof window === 'undefined') return false;
    for (let i = 0; i < window.localStorage.length; i += 1) {
      const key = window.localStorage.key(i);
      if (key?.startsWith('sb-') && key.endsWith('-auth-token')) return true;
    }
    return false;
  } catch {
    return false;
  }
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, session, loading } = useAuth();
  const location = useLocation();
  const authUser = user ?? session?.user ?? null;

  // Only redirect when we've confirmed there is no session anywhere.
  // While loading or while a persisted token exists, render children optimistically
  // to avoid white flashes / unmount-remount cycles.
  if (!authUser && !session && !loading && !hasPersistedAuthToken()) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  if (
    authUser &&
    isSuperAdminUser(authUser.email) &&
    getSuperAdminModeForUser(authUser.email) &&
    ['/dashboard', '/admin'].includes(location.pathname)
  ) {
    return <Navigate to="/super-admin" replace />;
  }

  return <>{children}</>;
}
