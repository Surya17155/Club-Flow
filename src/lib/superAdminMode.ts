export const SUPER_ADMIN_EMAIL = 'suryakant.gnbba2029@iilm.edu';
export const SUPER_ADMIN_LOCK_KEY = 'superAdminLockActive';
export const SUPER_ADMIN_MODE_EVENT = 'superAdminModeChanged';
export const SUPER_ADMIN_MODE_INITIALIZED_KEY = 'superAdminModeInitialized';

const normalizeEmail = (email?: string | null) => (email ?? '').trim().toLowerCase();

export const isSuperAdminUser = (email?: string | null) => normalizeEmail(email) === SUPER_ADMIN_EMAIL;

export const isSuperAdminLockActive = () =>
  typeof window !== 'undefined' && sessionStorage.getItem(SUPER_ADMIN_LOCK_KEY) === 'true';

export const setSuperAdminLockActive = (active: boolean) => {
  if (typeof window === 'undefined') return;

  sessionStorage.setItem(SUPER_ADMIN_MODE_INITIALIZED_KEY, 'true');

  if (active) {
    sessionStorage.setItem(SUPER_ADMIN_LOCK_KEY, 'true');
  } else {
    sessionStorage.removeItem(SUPER_ADMIN_LOCK_KEY);
  }

  window.dispatchEvent(new Event(SUPER_ADMIN_MODE_EVENT));
};

export const initializeSuperAdminModeForSession = (email?: string | null) => {
  if (typeof window === 'undefined') return false;

  if (!isSuperAdminUser(email)) {
    if (sessionStorage.getItem(SUPER_ADMIN_LOCK_KEY) === 'true') {
      sessionStorage.removeItem(SUPER_ADMIN_LOCK_KEY);
      window.dispatchEvent(new Event(SUPER_ADMIN_MODE_EVENT));
    }
    sessionStorage.removeItem(SUPER_ADMIN_MODE_INITIALIZED_KEY);
    return false;
  }

  if (sessionStorage.getItem(SUPER_ADMIN_MODE_INITIALIZED_KEY) !== 'true') {
    sessionStorage.setItem(SUPER_ADMIN_LOCK_KEY, 'true');
    sessionStorage.setItem(SUPER_ADMIN_MODE_INITIALIZED_KEY, 'true');
    window.dispatchEvent(new Event(SUPER_ADMIN_MODE_EVENT));
  }

  return isSuperAdminLockActive();
};

export const resetSuperAdminModeSession = () => {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SUPER_ADMIN_LOCK_KEY);
  sessionStorage.removeItem(SUPER_ADMIN_MODE_INITIALIZED_KEY);
  window.dispatchEvent(new Event(SUPER_ADMIN_MODE_EVENT));
};

export const getSuperAdminModeForUser = (email?: string | null) => {
  if (typeof window === 'undefined' || !isSuperAdminUser(email)) return false;
  return isSuperAdminLockActive() || sessionStorage.getItem(SUPER_ADMIN_MODE_INITIALIZED_KEY) !== 'true';
};

export const getAuthenticatedHomePath = (email?: string | null) =>
  getSuperAdminModeForUser(email) ? '/super-admin' : '/dashboard';

export const resolveAuthRedirect = (email?: string | null, requestedPath?: string | null) => {
  if (!isSuperAdminUser(email)) return requestedPath || '/dashboard';
  return '/super-admin';
};