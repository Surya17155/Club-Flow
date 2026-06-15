import { memo, useCallback, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Users, Calendar, User, Plus, Bot, FileText } from "lucide-react";
import { useDelegatedPowers } from "@/hooks/useDelegatedPowers";
import { useAuth } from "@/contexts/AuthContext";
import { getSuperAdminModeForUser, isSuperAdminUser, SUPER_ADMIN_MODE_EVENT } from "@/lib/superAdminMode";
import { preloadRoute } from "@/lib/routePreload";

const personalTabs = [
  { label: "Home", icon: Home, path: "/admin" },
  { label: "Events", icon: Calendar, path: "/events" },
  { label: "Clubs", icon: Users, path: "/discover" },
  { label: "Profile", icon: User, path: "/profile" },
] as const;

const clubLeftTabs = [
  { label: "Home", icon: Home, path: "/admin" },
  { label: "Events", icon: Calendar, path: "/events" },
] as const;

const clubRightTabs = [
  { label: "Club", icon: Users, path: "/clubs" },
  { label: "Profile", icon: User, path: "/profile" },
] as const;

const superAdminLeftTabs = [
  { label: "Home", icon: Home, path: "/super-admin" },
  { label: "Reports", icon: FileText, path: "/global-reports" },
] as const;

const superAdminRightTabs = [
  { label: "Outsiders", icon: Users, path: "/manage-outsiders" },
  { label: "Profile", icon: User, path: "/profile" },
] as const;

function MobileBottomNavInner() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [viewMode, setViewMode] = useState<'personal' | 'club'>(() => {
    return (localStorage.getItem('dashboardViewMode') as 'personal' | 'club') || 'personal';
  });

  useEffect(() => {
    const handler = () => {
      setViewMode((localStorage.getItem('dashboardViewMode') as 'personal' | 'club') || 'personal');
    };
    window.addEventListener('storage', handler);
    window.addEventListener('viewModeChanged', handler);
    return () => { window.removeEventListener('storage', handler); window.removeEventListener('viewModeChanged', handler); };
  }, []);

  const [isSuperAdminMode, setIsSuperAdminMode] = useState(() => getSuperAdminModeForUser(user?.email));

  useEffect(() => {
    const syncSuperAdminMode = () => setIsSuperAdminMode(getSuperAdminModeForUser(user?.email));
    syncSuperAdminMode();
    window.addEventListener(SUPER_ADMIN_MODE_EVENT, syncSuperAdminMode);
    window.addEventListener('storage', syncSuperAdminMode);
    return () => {
      window.removeEventListener(SUPER_ADMIN_MODE_EVENT, syncSuperAdminMode);
      window.removeEventListener('storage', syncSuperAdminMode);
    };
  }, [location.pathname, user?.email]);

  const isClubMode = viewMode === 'club';
  const isSuperAdmin = isSuperAdminUser(user?.email) && isSuperAdminMode;
  const { hasPower } = useDelegatedPowers(undefined, !isClubMode || isSuperAdmin);
  const canCreateEvent = isClubMode && !isSuperAdmin && hasPower("create_event");
  const handleNav = useCallback((path: string) => { preloadRoute(path); navigate(path); }, [navigate]);

  const renderTab = useCallback(({ label, icon: Icon, path }: { label: string; icon: any; path: string }) => {
    const active = location.pathname === path;
    return (
      <button
        key={path + label}
        onClick={() => handleNav(path)}
        className="flex flex-col items-center justify-center px-3 py-2 transition-transform active:scale-95"
        style={{
          background: active ? '#E98A3A' : 'transparent',
          border: active ? '2px solid #111' : '2px solid transparent',
          boxShadow: active ? '2px 2px 0px #111' : 'none',
        }}
      >
        <Icon
          className="w-5 h-5"
          style={{ color: active ? '#111' : '#6B7280' }}
          strokeWidth={active ? 2.5 : 2}
        />
        <span
          className="text-[10px] uppercase mt-0.5"
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: active ? 800 : 600,
            color: active ? '#111' : '#6B7280',
          }}
        >
          {label}
        </span>
      </button>
    );
  }, [location.pathname, handleNav]);

  return (
    <div
      className="fixed left-0 right-0 z-50 md:hidden"
      style={{
        bottom: 0,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <nav
        className="flex items-center justify-evenly px-2"
        style={{
          background: '#F4EFE7',
          borderTop: '2px solid #111',
          minHeight: '56px',
        }}
      >
        {isSuperAdmin ? (
          <>
            {superAdminLeftTabs.map(renderTab)}

            <button
              onClick={() => handleNav("/super-admin/chatbot")}
              className="relative -mt-5 flex flex-col items-center justify-center transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
              style={{
                width: '58px',
                height: '54px',
                background: '#E98A3A',
                border: '2px solid #111',
                boxShadow: '3px 3px 0px #111',
              }}
            >
              <Bot className="w-6 h-6" style={{ color: '#111' }} strokeWidth={3} />
              <span
                className="text-[9px] uppercase leading-none mt-0.5"
                style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, color: '#111' }}
              >
                AI
              </span>
            </button>

            {superAdminRightTabs.map(renderTab)}
          </>
        ) : isClubMode ? (
          <>
            {clubLeftTabs.map(renderTab)}

            {canCreateEvent ? (
              <button
                onClick={() => handleNav("/create-event")}
                className="relative -mt-5 flex items-center justify-center transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                style={{
                  width: '52px',
                  height: '52px',
                  background: '#E98A3A',
                  border: '2px solid #111',
                  boxShadow: '3px 3px 0px #111',
                }}
              >
                <Plus className="w-6 h-6" style={{ color: '#111' }} strokeWidth={3} />
              </button>
            ) : null}

            {clubRightTabs.map(renderTab)}
          </>
        ) : (
          personalTabs.map(renderTab)
        )}
      </nav>
    </div>
  );
}

export const MobileBottomNav = memo(MobileBottomNavInner);
