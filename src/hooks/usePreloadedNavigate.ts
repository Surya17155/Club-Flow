import { useCallback, useRef } from 'react';
import { type NavigateOptions, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useClub } from '@/contexts/ClubContext';
import { preloadRouteData } from '@/lib/preloadCache';

export const normalizeRoutePath = (path: string) => path.split('?')[0].split('#')[0];

export function usePreloadedNavigate() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { activeClub, clubs } = useClub();
  const lastNavigationRef = useRef({ path: '', at: 0 });

  return useCallback((path: string, options?: NavigateOptions) => {
    const routePath = normalizeRoutePath(path);
    const now = Date.now();
    if (lastNavigationRef.current.path === path && now - lastNavigationRef.current.at < 500) return;
    lastNavigationRef.current = { path, at: now };

    preloadRouteData(routePath, {
      userId: user?.id,
      email: user?.email,
      activeClubId: activeClub?.club_id,
      clubIds: clubs.map((club) => club.club_id),
    }).catch(() => undefined);

    if (location.pathname === routePath && !options?.replace) return;
    navigate(path, options);
  }, [activeClub?.club_id, clubs, location.pathname, navigate, user?.email, user?.id]);
}