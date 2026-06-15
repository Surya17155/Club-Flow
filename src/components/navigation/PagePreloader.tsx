import { useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useClub } from '@/contexts/ClubContext';
import {
  getCacheStatusSnapshot,
  preloadAdminStatus,
  preloadAssignableMembers,
  preloadClubMembers,
  preloadClubSettings,
  preloadClubStats,
  preloadDelegatedPowers,
  preloadDiscoverClubs,
  preloadEvents,
  preloadJoinRequests,
  preloadOutsiders,
  preloadPersonalStats,
  preloadProfile,
  preloadSuperAdminStats,
  preloadUpcomingEvents,
  preloadUserClubs,
  preloadRouteData,
  subscribeCacheStatus,
} from '@/lib/preloadCache';
import { isSuperAdminUser } from '@/lib/superAdminMode';

const warm = <T,>(promise: Promise<T>) => promise.catch(() => undefined);

export function PagePreloader() {
  const { user } = useAuth();
  const { activeClub, clubs } = useClub();
  const clubIdsKey = clubs.map((club) => club.club_id).join('|');

  useEffect(() => {
    let toastId: string | number | undefined;
    let dismissTimer: number | undefined;
    let wasRunning = false;

    return subscribeCacheStatus((status) => {
      if (status.active > 0) {
        wasRunning = true;
        if (dismissTimer) window.clearTimeout(dismissTimer);
        toastId = toast.loading(`Preloading app data ${status.completed}/${Math.max(status.total, status.active)}`, {
          id: toastId ?? 'background-preload-progress',
          description: 'Navigation stays available while cache warms.',
          duration: Infinity,
        });
        return;
      }

      if (toastId && wasRunning && getCacheStatusSnapshot().total > 0) {
        wasRunning = false;
        toast.success('Preload complete', {
          id: toastId,
          description: 'Pages will use warmed cache where available.',
          duration: 1500,
        });
        dismissTimer = window.setTimeout(() => {
          toast.dismiss(toastId);
          toastId = undefined;
        }, 1600);
      }
    });
  }, []);

  useEffect(() => {
    if (!user) return;

    // Critical preloads run immediately so navigation is instant
    const clubIds = clubIdsKey ? clubIdsKey.split('|') : [];
    const commonRoutes = ['/admin', '/events', '/discover', '/profile', '/settings', '/attendance-history'];
    commonRoutes.forEach((path) => warm(preloadRouteData(path, { userId: user.id, email: user.email, activeClubId: activeClub?.club_id, clubIds })));
    warm(preloadAdminStatus(user.id, user.email));
    warm(preloadProfile(user.id));
    warm(preloadPersonalStats(user.id));
    warm(preloadEvents('personal'));
    warm(preloadUpcomingEvents());
    warm(preloadUserClubs(user.id)).then((clubs) => {
      if (!clubs) return;
      clubs.forEach((club) => {
        warm(preloadEvents('club', club.club_id));
        warm(preloadClubStats(club.club_id));
        warm(preloadDelegatedPowers(user.id, club.club_id));
        warm(preloadClubMembers(club.club_id));
        warm(preloadClubSettings(club.club_id));
        warm(preloadJoinRequests(club.club_id));
        warm(preloadAssignableMembers(club.club_id));
      });
    });

    // Defer non-critical to idle
    const idle = window.requestIdleCallback ?? ((cb: IdleRequestCallback) => window.setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 0 } as IdleDeadline), 1));
    const cancelIdle = window.cancelIdleCallback ?? window.clearTimeout;
    const handle = idle(() => {
      warm(preloadDiscoverClubs(user.id));
      if (isSuperAdminUser(user.email)) {
        warm(preloadSuperAdminStats());
        warm(preloadOutsiders());
      }
    });
    return () => cancelIdle(handle as any);
  }, [activeClub?.club_id, clubIdsKey, user?.id, user?.email]);

  useEffect(() => {
    if (!user || !activeClub?.club_id) return;
    warm(preloadClubStats(activeClub.club_id));
    warm(preloadClubMembers(activeClub.club_id));
    warm(preloadDelegatedPowers(user.id, activeClub.club_id));
    warm(preloadEvents('club', activeClub.club_id));
    warm(preloadClubSettings(activeClub.club_id));
    warm(preloadJoinRequests(activeClub.club_id));
    warm(preloadAssignableMembers(activeClub.club_id));
  }, [user?.id, activeClub?.club_id]);

  return null;
}