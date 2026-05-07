export const SUPER_ADMIN_EMAIL = 'suryakant.gnbba2029@iilm.edu';
export const SUPER_ADMIN_LOCK_KEY = 'superAdminLockActive';
export const SUPER_ADMIN_MODE_EVENT = 'superAdminModeChanged';

export const isSuperAdminUser = (email?: string | null) => email === SUPER_ADMIN_EMAIL;

export const isSuperAdminLockActive = () =>
  typeof window !== 'undefined' && sessionStorage.getItem(SUPER_ADMIN_LOCK_KEY) === 'true';

export const setSuperAdminLockActive = (active: boolean) => {
  if (typeof window === 'undefined') return;

  if (active) {
    sessionStorage.setItem(SUPER_ADMIN_LOCK_KEY, 'true');
  } else {
    sessionStorage.removeItem(SUPER_ADMIN_LOCK_KEY);
  }

  window.dispatchEvent(new Event(SUPER_ADMIN_MODE_EVENT));
};