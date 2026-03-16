import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, Calendar, User } from 'lucide-react';

const tabs = [
  { label: 'Home', icon: Home, path: '/admin' },
  { label: 'Clubs', icon: Users, path: '/discover' },
  { label: 'Events', icon: Calendar, path: '/events' },
  { label: 'Profile', icon: User, path: '/profile' },
];

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-white/85 backdrop-blur-xl safe-area-bottom md:hidden">
      <div className="flex items-center justify-around h-14">
        {tabs.map(({ label, icon: Icon, path }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : ''}`} />
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${active ? 'text-primary' : ''}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
