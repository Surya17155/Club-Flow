import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { isSuperAdminUser, SUPER_ADMIN_LOCK_KEY, SUPER_ADMIN_MODE_EVENT } from '@/lib/superAdminMode';

/**
 * Keeps stale Super Admin mode state from leaking between users without
 * forcing route changes. Navigation should only happen from explicit clicks.
 */
export function SuperAdminGuard() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || isSuperAdminUser(user.email)) return;

    if (sessionStorage.getItem(SUPER_ADMIN_LOCK_KEY) === 'true') {
      sessionStorage.removeItem(SUPER_ADMIN_LOCK_KEY);
      window.dispatchEvent(new Event(SUPER_ADMIN_MODE_EVENT));
    }
  }, [user?.id, user?.email]);

  return null;
}
