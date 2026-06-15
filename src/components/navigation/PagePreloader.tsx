import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useClub } from '@/contexts/ClubContext';
import {
  preloadAdminStatus,
  preloadClubSettings,
  preloadClubStats,
  preloadDelegatedPowers,
  preloadDiscoverClubs,
  preloadEvents,
  preloadOutsiders,
  preloadPersonalStats,
  preloadProfile,
  preloadSuperAdminStats,
  preloadUpcomingEvents,
  preloadUserClubs,
} from '@/lib/preloadCache';
import { isSuperAdminUser } from '@/lib/superAdminMode';

const idle = (cb: IdleRequestCallback) => {
  if (window.requestIdleCallback) return window.requestIdleCallback(cb, { timeout: 2500 });
  return window.setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 0 } as IdleDeadline), 800);
};

const cancelIdle = (handle: number) => {
  const cancel = window.cancelIdleCallback ?? window.clearTimeout;
  cancel(handle as any);
};

export function PagePreloader() {
  const { user } = useAuth();
  const { activeClub } = useClub();
  const location = useLocation();

  useEffect(() => {
    if (!user) return;

    // Keep startup light: the auth and club providers already hydrate the shell.
    // Only low-cost role status is warmed immediately; everything else waits for idle.
    preloadAdminStatus(user.id, user.email).catch(() => undefined);

    const handle = idle(() => {
      preloadProfile(user.id);
      preloadUserClubs(user.id);
      preloadPersonalStats(user.id);
      preloadUpcomingEvents();
      if (isSuperAdminUser(user.email)) {
        preloadSuperAdminStats();
        preloadOutsiders().catch(() => undefined);
      }
    });
    return () => cancelIdle(handle);
  }, [user?.id, user?.email]);

  useEffect(() => {
    if (!user || !activeClub?.club_id) return;
    const handle = idle(() => {
      preloadDelegatedPowers(user.id, activeClub.club_id);
      preloadClubSettings(activeClub.club_id);
      if (location.pathname === '/admin' || location.pathname.startsWith('/club')) {
        preloadClubStats(activeClub.club_id);
      }
      if (location.pathname === '/events') {
        preloadEvents('club', activeClub.club_id);
      }
    });
    return () => cancelIdle(handle);
  }, [user?.id, activeClub?.club_id, location.pathname]);

  useEffect(() => {
    if (!user) return;
    const handle = idle(() => {
      if (location.pathname === '/events') preloadEvents('personal');
      if (location.pathname === '/discover') preloadDiscoverClubs(user.id);
    });
    return () => cancelIdle(handle);
  }, [user?.id, location.pathname]);

  return null;
}