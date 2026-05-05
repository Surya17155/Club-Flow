import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const SUPER_ADMIN_EMAIL = 'suryakant.gnbba2029@iilm.edu';
const STORAGE_KEY = 'superAdminLockActive';

// Routes allowed while locked into Super Admin Mode.
const ALLOWED_PREFIXES = [
  '/super-admin',
  '/global-reports',
  '/manage-outsiders',
  '/settings',
  '/contact2',
  '/club/', // super admin can drill into any club from the command center
];

const isAllowed = (path: string) =>
  ALLOWED_PREFIXES.some((p) => path === p || path.startsWith(p));

/**
 * Locks the Super Admin (only the designated email) inside the Super Admin
 * Command Center while the lock flag is on. If they navigate away to a
 * personal/club route, redirect them back to /super-admin.
 */
export function SuperAdminGuard() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Auto-arm the lock whenever the super admin lands on a super admin route.
  useEffect(() => {
    if (user?.email !== SUPER_ADMIN_EMAIL) return;
    if (location.pathname.startsWith('/super-admin')) {
      sessionStorage.setItem(STORAGE_KEY, 'true');
    }
  }, [user?.email, location.pathname]);

  useEffect(() => {
    if (user?.email !== SUPER_ADMIN_EMAIL) return;
    const locked = sessionStorage.getItem(STORAGE_KEY) === 'true';
    if (!locked) return;
    if (!isAllowed(location.pathname)) {
      navigate('/super-admin', { replace: true });
    }
  }, [location.pathname, user?.email, navigate]);

  return null;
}

export const SUPER_ADMIN_LOCK_KEY = STORAGE_KEY;
export { SUPER_ADMIN_EMAIL };
