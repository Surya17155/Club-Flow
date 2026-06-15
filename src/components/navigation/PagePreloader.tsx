import { useEffect } from 'react';
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

export function PagePreloader() {
  const { user } = useAuth();
  const { activeClub } = useClub();

  useEffect(() => {
    if (!user) return;

    // Keep startup light: hydrate only data needed for the current shell.
    preloadAdminStatus(user.id, user.email);
    preloadProfile(user.id);
    preloadUserClubs(user.id);

    // Defer dashboard-only reads until the browser is idle.
    const idle = window.requestIdleCallback ?? ((cb: IdleRequestCallback) => window.setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 0 } as IdleDeadline), 1));
    const cancelIdle = window.cancelIdleCallback ?? window.clearTimeout;
    const handle = idle(() => {
      preloadPersonalStats(user.id);
      preloadEvents('personal');
      preloadUpcomingEvents();
      preloadDiscoverClubs(user.id);
      if (isSuperAdminUser(user.email)) {
        preloadSuperAdminStats();
        preloadOutsiders().catch(() => undefined);
      }
    });
    return () => cancelIdle(handle as any);
  }, [user?.id, user?.email]);

  useEffect(() => {
    if (!user || !activeClub?.club_id) return;
    preloadClubStats(activeClub.club_id);
    preloadDelegatedPowers(user.id, activeClub.club_id);
    preloadClubSettings(activeClub.club_id);
  }, [user?.id, activeClub?.club_id]);

  return null;
}