import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getSuperAdminModeForUser, isSuperAdminUser } from '@/lib/superAdminMode';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, session, loading } = useAuth();
  const location = useLocation();
  const authUser = user ?? session?.user ?? null;

  if (loading) return null;

  if (!authUser && !session) {
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