import { memo, useCallback, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, Users, Calendar, User, Plus } from "lucide-react";
import { useDelegatedPowers } from "@/hooks/useDelegatedPowers";

const personalTabs = [
  { label: "Home", icon: Home, path: "/admin" },
  { label: "Clubs", icon: Users, path: "/discover" },
  { label: "Calendar", icon: Calendar, path: "/calendar" },
  { label: "Events", icon: Calendar, path: "/events" },
  { label: "Profile", icon: User, path: "/profile" },
] as const;

const clubLeftTabs = [
  { label: "Home", icon: Home, path: "/admin" },
  { label: "Clubs", icon: Users, path: "/discover" },
] as const;

const clubRightTabs = [
  { label: "Events", icon: Calendar, path: "/events" },
  { label: "Profile", icon: User, path: "/profile" },
] as const;

function MobileBottomNavInner() {
  const location = useLocation();
  const navigate = useNavigate();

  const [viewMode, setViewMode] = useState<'personal' | 'club'>(() => {
    return (localStorage.getItem('dashboardViewMode') as 'personal' | 'club') || 'personal';
  });

  useEffect(() => {
    const handler = () => {
      setViewMode((localStorage.getItem('dashboardViewMode') as 'personal' | 'club') || 'personal');
    };
    window.addEventListener('storage', handler);
    // Poll at lower frequency to reduce main thread work
    const interval = setInterval(() => {
      const current = (localStorage.getItem('dashboardViewMode') as 'personal' | 'club') || 'personal';
      setViewMode(prev => prev !== current ? current : prev);
    }, 1000);
    return () => { window.removeEventListener('storage', handler); clearInterval(interval); };
  }, []);

  let canCreateEvent = false;
  try {
    const { hasPower } = useDelegatedPowers();
    canCreateEvent = hasPower("create_event");
  } catch {
    canCreateEvent = false;
  }

  const isClubMode = viewMode === 'club';

  const handleNav = useCallback((path: string) => navigate(path), [navigate]);

  const renderTab = useCallback(({ label, icon: Icon, path }: { label: string; icon: any; path: string }) => {
    const active = location.pathname === path;
    return (
      <button
        key={path + label}
        onClick={() => handleNav(path)}
        className="flex flex-col items-center gap-0.5 px-3 py-1.5"
      >
        <Icon
          className="w-5 h-5"
          style={{ color: active ? "hsl(var(--primary))" : "#8A8A8A" }}
          strokeWidth={active ? 2.5 : 2}
        />
        <span
          className="text-[10px] tracking-wide"
          style={{
            color: active ? "hsl(var(--primary))" : "#8A8A8A",
            fontWeight: active ? 700 : 500,
          }}
        >
          {label}
        </span>
      </button>
    );
  }, [location.pathname, handleNav]);

  return (
    <div className="fixed left-0 right-0 z-50 flex justify-center px-4 md:hidden pointer-events-none gpu-fixed" style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 12px)" }}>
      <nav
        className="relative flex items-center justify-evenly pointer-events-auto"
        style={{
          width: "100%",
          maxWidth: "380px",
          height: "52px",
          borderRadius: "36px",
          background: "rgba(255, 255, 255, 0.18)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: "1px solid rgba(255, 255, 255, 0.35)",
          boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.15)",
          padding: "0 18px",
          transform: "translateZ(0)",
        }}
      >
        {isClubMode ? (
          <>
            {clubLeftTabs.map(renderTab)}

            {canCreateEvent ? (
              <button
                onClick={() => navigate("/create-event")}
                className="relative -mt-6 flex items-center justify-center transition-transform duration-200 active:scale-95"
                style={{
                  width: "50px",
                  height: "50px",
                  borderRadius: "50%",
                  background: "hsl(var(--primary))",
                  boxShadow: "0px 8px 20px hsla(var(--primary) / 0.45)",
                }}
              >
                <Plus className="w-6 h-6 text-primary-foreground" strokeWidth={2.5} />
              </button>
            ) : (
              <div className="w-6" />
            )}

            {clubRightTabs.map(renderTab)}
          </>
        ) : (
          <>
            {personalTabs.map(renderTab)}
          </>
        )}
      </nav>
    </div>
  );
}

export const MobileBottomNav = memo(MobileBottomNavInner);
