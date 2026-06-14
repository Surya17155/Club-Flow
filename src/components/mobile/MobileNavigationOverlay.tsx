import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileSideDrawer } from './MobileSideDrawer';

type ViewMode = 'personal' | 'club';

const DRAWER_ROUTES = [
  '/admin',
  '/events',
  '/attendance-history',
  '/discover',
  '/profile',
  '/settings',
  '/clubs',
  '/club-settings',
  '/assign-powers',
  '/chatbot',
  '/reviews',
  '/super-admin',
  '/global-reports',
  '/manage-outsiders',
] as const;

const shouldShowDrawer = (pathname: string) =>
  DRAWER_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`)) ||
  pathname.startsWith('/club/');

export function MobileNavigationOverlay() {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    return (localStorage.getItem('dashboardViewMode') as ViewMode) || 'personal';
  });

  const showDrawer = isMobile && !!user && shouldShowDrawer(location.pathname);

  useEffect(() => {
    const syncViewMode = () => {
      setViewModeState((localStorage.getItem('dashboardViewMode') as ViewMode) || 'personal');
    };

    window.addEventListener('storage', syncViewMode);
    window.addEventListener('viewModeChanged', syncViewMode);

    return () => {
      window.removeEventListener('storage', syncViewMode);
      window.removeEventListener('viewModeChanged', syncViewMode);
    };
  }, []);

  useEffect(() => {
    if (!showDrawer) {
      setDrawerOpen(false);
    }
  }, [showDrawer]);

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    localStorage.setItem('dashboardViewMode', mode);
    window.dispatchEvent(new Event('viewModeChanged'));
  };

  if (!showDrawer) {
    return null;
  }

  return (
    <>
      <MobileSideDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      <div
        className="fixed top-0 left-0 z-[55] md:hidden"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
        }}
      >
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center justify-center"
          style={{
            width: '36px',
            height: '36px',
            background: '#E98A3A',
            border: '2px solid #111',
            boxShadow: '2px 2px 0px #111',
            borderRadius: '0 8px 8px 0',
            animation: 'sideDrawerPulse 2.5s ease-in-out infinite',
          }}
          aria-label="Open navigation menu"
        >
          <ChevronRight className="w-5 h-5" style={{ color: '#111' }} strokeWidth={3} />
        </button>
      </div>

      <style>{`
        @keyframes sideDrawerPulse {
          0%, 100% { transform: scale(1); box-shadow: 2px 2px 0px #111; }
          50% { transform: scale(1.08); box-shadow: 3px 3px 0px #111; }
        }
      `}</style>
    </>
  );
}
