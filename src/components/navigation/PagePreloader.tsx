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
  preloadUserClubs,
} from '@/lib/preloadCache';
import { SUPER_ADMIN_EMAIL } from '@/lib/superAdminMode';

export function PagePreloader() {
  const { user } = useAuth();
  const { activeClub } = useClub();

  useEffect(() => {
    if (!user) return;

    const idle = window.requestIdleCallback ?? ((cb: IdleRequestCallback) => window.setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 0 } as IdleDeadline), 1));
    const cancelIdle = window.cancelIdleCallback ?? window.clearTimeout;

    const handle = idle(() => {
      preloadAdminStatus(user.id, user.email);
      preloadProfile(user.id);
      preloadUserClubs(user.id).then((clubs) => {
        clubs.forEach((club) => {
          preloadClubStats(club.club_id);
          preloadDelegatedPowers(user.id, club.club_id);
          preloadEvents('club', club.club_id);
          preloadClubSettings(club.club_id);
        });
      });
      preloadPersonalStats(user.id);
      preloadEvents('personal');
      preloadDiscoverClubs(user.id);

      if (user.email === SUPER_ADMIN_EMAIL) {
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
    preloadEvents('club', activeClub.club_id);
    preloadClubSettings(activeClub.club_id);
  }, [user?.id, activeClub?.club_id]);

  return null;
}