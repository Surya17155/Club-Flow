import { useLocation, useNavigate } from "react-router-dom";
import { Home, Users, Calendar, Search, User, Plus } from "lucide-react";
import { useDelegatedPowers } from "@/hooks/useDelegatedPowers";

const tabs = [
  { label: "Home", icon: Home, path: "/admin" },
  { label: "Clubs", icon: Users, path: "/discover" },
  // center slot reserved for FAB
  { label: "Events", icon: Calendar, path: "/events" },
  { label: "Profile", icon: User, path: "/profile" },
];

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  // Try to get delegated powers — will silently return false if outside provider
  let canCreateEvent = false;
  try {
    const { hasPower } = useDelegatedPowers();
    canCreateEvent = hasPower("create_event");
  } catch {
    canCreateEvent = false;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-4 px-4 safe-area-bottom md:hidden pointer-events-none">
      <nav
        className="relative flex items-center justify-evenly pointer-events-auto"
        style={{
          width: "100%",
          maxWidth: "380px",
          height: "60px",
          borderRadius: "36px",
          background: "rgba(255, 255, 255, 0.18)",
          backdropFilter: "blur(18px)",
          WebkitBackdropFilter: "blur(18px)",
          border: "1px solid rgba(255, 255, 255, 0.35)",
          boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.15)",
          padding: "0 18px",
        }}
      >
        {/* Left tabs */}
        {tabs.slice(0, 2).map(({ label, icon: Icon, path }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 transition-all duration-200 ease-out"
            >
              <Icon
                className="w-5 h-5 transition-colors duration-200"
                style={{ color: active ? "hsl(var(--primary))" : "#8A8A8A" }}
                strokeWidth={active ? 2.5 : 2}
              />
              <span
                className="text-[10px] tracking-wide transition-colors duration-200"
                style={{
                  color: active ? "hsl(var(--primary))" : "#8A8A8A",
                  fontWeight: active ? 700 : 500,
                }}
              >
                {label}
              </span>
            </button>
          );
        })}

        {/* Center FAB — only for authorized users */}
        {canCreateEvent ? (
          <button
            onClick={() => navigate("/create-event")}
            className="relative -mt-7 flex items-center justify-center transition-transform duration-200 active:scale-95"
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "50%",
              background: "hsl(var(--primary))",
              boxShadow: "0px 8px 20px hsla(var(--primary) / 0.45)",
            }}
          >
            <Plus className="w-6 h-6 text-primary-foreground" strokeWidth={2.5} />
          </button>
        ) : (
          <div className="w-6" /> /* spacer when no FAB */
        )}

        {/* Right tabs */}
        {tabs.slice(2).map(({ label, icon: Icon, path }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 transition-all duration-200 ease-out"
            >
              <Icon
                className="w-5 h-5 transition-colors duration-200"
                style={{ color: active ? "hsl(var(--primary))" : "#8A8A8A" }}
                strokeWidth={active ? 2.5 : 2}
              />
              <span
                className="text-[10px] tracking-wide transition-colors duration-200"
                style={{
                  color: active ? "hsl(var(--primary))" : "#8A8A8A",
                  fontWeight: active ? 700 : 500,
                }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
