import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useClub } from '@/contexts/ClubContext';
import {
  preloadAdminStatus,
  preloadClubSettings,
preloadClubMembers,
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
import { isSuperAdminUser } from '@/lib/superAdminMode';

export function PagePreloader() {
  const { user } = useAuth();
  const { activeClub } = useClub();

  useEffect(() => {
    if (!user) return;

    // Critical preloads run immediately so navigation is instant
    preloadAdminStatus(user.id, user.email);
    preloadProfile(user.id);
    preloadPersonalStats(user.id);
    preloadEvents('personal');
    preloadUserClubs(user.id).then((clubs) => {
      clubs.forEach((club) => {
        preloadEvents('club', club.club_id);
        preloadClubStats(club.club_id);
        preloadDelegatedPowers(user.id, club.club_id);
        preloadClubMembers(club.club_id);
        preloadClubSettings(club.club_id);
      });
    });

    // Defer non-critical to idle
    const idle = window.requestIdleCallback ?? ((cb: IdleRequestCallback) => window.setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 0 } as IdleDeadline), 1));
    const cancelIdle = window.cancelIdleCallback ?? window.clearTimeout;
    const handle = idle(() => {
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
    preloadClubMembers(activeClub.club_id);
    preloadDelegatedPowers(user.id, activeClub.club_id);
    preloadEvents('club', activeClub.club_id);
    preloadClubSettings(activeClub.club_id);
  }, [user?.id, activeClub?.club_id]);

  return null;
}