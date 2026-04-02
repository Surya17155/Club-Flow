import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import {
  LayoutDashboard,
  Calendar,
  Building2,
  Compass,
  CalendarDays,
  UserCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const navItems = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
  { title: 'Events', url: '/events', icon: Calendar },
  { title: 'Clubs', url: '/clubs', icon: Building2 },
  { title: 'Discover', url: '/discover', icon: Compass },
  { title: 'Calendar', url: '/mobile-calendar', icon: CalendarDays },
  { title: 'Profile', url: '/profile', icon: UserCircle },
  { title: 'Settings', url: '/settings', icon: Settings },
];

const STORAGE_KEY = 'dashboard-sidebar-collapsed';

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'true';
  });
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  const isActive = (url: string) =>
    location.pathname === url || (url !== '/admin' && location.pathname.startsWith(url + '/'));

  const initials = (profile?.full_name || user?.user_metadata?.full_name || 'U')
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div
      className="flex flex-col shrink-0 h-full overflow-hidden"
      style={{
        width: collapsed ? 64 : 220,
        background: 'linear-gradient(180deg, #1C1C1E 0%, #111113 100%)',
        borderRadius: '20px 0 0 20px',
        transition: 'width 0.3s ease',
      }}
    >
      {/* Profile avatar */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <Avatar className="w-9 h-9 shrink-0">
          <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} />
          <AvatarFallback className="bg-white/10 text-white text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        {!collapsed && (
          <div className="min-w-0 overflow-hidden" style={{ transition: 'opacity 0.2s ease', opacity: collapsed ? 0 : 1 }}>
            <p className="text-sm font-semibold text-white truncate">
              {profile?.full_name || user?.user_metadata?.full_name || 'User'}
            </p>
            <p className="text-[11px] text-[#8A8F98] truncate">{user?.email}</p>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col gap-1 px-3 mt-2">
        {navItems.map((item) => {
          const active = isActive(item.url);
          return (
            <button
              key={item.title}
              onClick={() => navigate(item.url)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 w-full text-left"
              style={{
                background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: active ? '#FFFFFF' : '#8A8F98',
              }}
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" />
              {!collapsed && (
                <span
                  className="text-sm font-medium truncate"
                  style={{ transition: 'opacity 0.2s ease', opacity: collapsed ? 0 : 1 }}
                >
                  {item.title}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom: sign out + collapse toggle */}
      <div className="px-3 pb-4 space-y-1">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 w-full text-left"
          style={{ color: '#8A8F98' }}
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          {!collapsed && (
            <span className="text-sm font-medium" style={{ transition: 'opacity 0.2s ease' }}>
              Sign Out
            </span>
          )}
        </button>

        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center justify-center w-full py-2 rounded-xl transition-all duration-200 hover:bg-white/5"
          style={{ color: '#8A8F98' }}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
