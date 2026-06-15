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

export function PagePreloader() {
  const { user } = useAuth();
  const { activeClub, clubs } = useClub();

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
    const commonRoutes = ['/admin', '/events', '/discover', '/profile', '/settings', '/attendance-history'];
    commonRoutes.forEach((path) => preloadRouteData(path, { userId: user.id, email: user.email, activeClubId: activeClub?.club_id, clubIds: clubs.map((club) => club.club_id) }));
    preloadAdminStatus(user.id, user.email);
    preloadProfile(user.id);
    preloadPersonalStats(user.id);
    preloadEvents('personal');
    preloadUpcomingEvents();
    preloadUserClubs(user.id).then((clubs) => {
      clubs.forEach((club) => {
        preloadEvents('club', club.club_id);
        preloadClubStats(club.club_id);
        preloadDelegatedPowers(user.id, club.club_id);
        preloadClubMembers(club.club_id);
        preloadClubSettings(club.club_id);
        preloadJoinRequests(club.club_id);
        preloadAssignableMembers(club.club_id);
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
  }, [activeClub?.club_id, clubs, user?.id, user?.email]);

  useEffect(() => {
    if (!user || !activeClub?.club_id) return;
    preloadClubStats(activeClub.club_id);
    preloadClubMembers(activeClub.club_id);
    preloadDelegatedPowers(user.id, activeClub.club_id);
    preloadEvents('club', activeClub.club_id);
    preloadClubSettings(activeClub.club_id);
    preloadJoinRequests(activeClub.club_id);
    preloadAssignableMembers(activeClub.club_id);
  }, [user?.id, activeClub?.club_id]);

  return null;
}