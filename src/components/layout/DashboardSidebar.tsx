import { useState, useEffect, useRef } from 'react';
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
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
} from 'framer-motion';

const navItems = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
  { title: 'Events', url: '/events', icon: Calendar },
  { title: 'Clubs', url: '/clubs', icon: Building2 },
  { title: 'Discover', url: '/discover', icon: Compass },
  { title: 'Calendar', url: '/calendar', icon: CalendarDays },
  { title: 'Profile', url: '/profile', icon: UserCircle },
  { title: 'Settings', url: '/settings', icon: Settings },
];

const STORAGE_KEY = 'dashboard-sidebar-collapsed';

function MagnifiedIcon({
  item,
  active,
  mouseY,
  index,
  onClick,
}: {
  item: (typeof navItems)[0];
  active: boolean;
  mouseY: any;
  index: number;
  onClick: () => void;
}) {
  const ref = useRef<HTMLButtonElement>(null);

  const distance = useTransform(mouseY, (val: number) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return 150;
    return val - rect.y - rect.height / 2;
  });

  const size = useSpring(
    useTransform(distance, [-100, 0, 100], [40, 56, 40]),
    { mass: 0.1, stiffness: 170, damping: 14 }
  );

  const iconScale = useSpring(
    useTransform(distance, [-100, 0, 100], [1, 1.3, 1]),
    { mass: 0.1, stiffness: 170, damping: 14 }
  );

  return (
    <motion.button
      ref={ref}
      onClick={onClick}
      className="relative flex items-center justify-center rounded-full mx-auto transition-colors"
      style={{
        width: size,
        height: size,
        background: active ? '#FFFFFF' : 'transparent',
      }}
      whileHover={{ background: active ? '#FFFFFF' : 'rgba(255,255,255,0.08)' }}
    >
      <motion.div style={{ scale: iconScale }} className="flex items-center justify-center">
        <item.icon
          className="w-[18px] h-[18px]"
          style={{ color: active ? '#000000' : '#8A8F98' }}
        />
      </motion.div>
      {/* Tooltip on hover */}
      <AnimatePresence>
        <motion.div
          className="absolute left-full ml-3 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ backgroundColor: '#1C1C1E', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
        >
          {item.title}
        </motion.div>
      </AnimatePresence>
    </motion.button>
  );
}

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'true';
  });
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const mouseY = useMotionValue(Infinity);

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
      className="flex flex-col shrink-0 h-screen overflow-hidden"
      onMouseMove={(e) => { if (collapsed) mouseY.set(e.clientY); }}
      onMouseLeave={() => mouseY.set(Infinity)}
      style={{
        width: collapsed ? 64 : 220,
        background: '#000000',
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
          <div className="min-w-0 overflow-hidden" style={{ transition: 'opacity 0.2s ease', opacity: 1 }}>
            <p className="text-sm font-semibold text-white truncate">
              {profile?.full_name || user?.user_metadata?.full_name || 'User'}
            </p>
            <p className="text-[11px] text-[#8A8F98] truncate">{user?.email}</p>
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col gap-1 px-3 mt-2">
        {navItems.map((item, index) => {
          const active = isActive(item.url);

          if (collapsed) {
            return (
              <div key={item.title} className="group relative">
                <MagnifiedIcon
                  item={item}
                  active={active}
                  mouseY={mouseY}
                  index={index}
                  onClick={() => navigate(item.url)}
                />
              </div>
            );
          }

          return (
            <button
              key={item.title}
              onClick={() => navigate(item.url)}
              className="flex items-center gap-3 px-3 py-2.5 transition-all duration-200 w-full text-left"
              style={{
                background: active ? '#FFFFFF' : 'transparent',
                color: active ? '#000000' : '#8A8F98',
                borderRadius: '999px',
              }}
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" />
              <span
                className="text-sm font-medium truncate"
                style={{ transition: 'opacity 0.2s ease' }}
              >
                {item.title}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Bottom: sign out + collapse toggle */}
      <div className="px-3 pb-4 space-y-1">
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-full transition-all duration-200 w-full text-left hover:bg-white/5"
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
          className="flex items-center justify-center w-full py-2 rounded-full transition-all duration-200 hover:bg-white/5"
          style={{ color: '#8A8F98' }}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
