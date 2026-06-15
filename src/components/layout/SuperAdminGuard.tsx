import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getAuthenticatedHomePath, initializeSuperAdminModeForSession, isSuperAdminLockActive, isSuperAdminUser, resetSuperAdminModeSession } from '@/lib/superAdminMode';

/**
 * Keeps stale Super Admin mode state from leaking between users without
 * forcing route changes. Navigation should only happen from explicit clicks.
 */
export function SuperAdminGuard() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      resetSuperAdminModeSession();
      return;
    }

    const modeIsActive = initializeSuperAdminModeForSession(user.email);
    const isSuperAdmin = isSuperAdminUser(user.email);

    if (isSuperAdmin && modeIsActive && ['/', '/dashboard', '/admin'].includes(location.pathname)) {
      navigate(getAuthenticatedHomePath(user.email), { replace: true });
      return;
    }

    if (!isSuperAdmin && isSuperAdminLockActive()) {
      resetSuperAdminModeSession();
    }
  }, [loading, user?.id, user?.email, location.pathname, navigate]);

  return null;
}
