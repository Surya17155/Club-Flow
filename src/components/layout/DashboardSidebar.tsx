import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useClub } from '@/contexts/ClubContext';
import { useDelegatedPowers } from '@/hooks/useDelegatedPowers';
import { useDesign } from '@/contexts/DesignContext';
import { getSuperAdminModeForUser, isSuperAdminUser, setSuperAdminLockActive, SUPER_ADMIN_MODE_EVENT } from '@/lib/superAdminMode';
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
  Shield,
  Settings2,
  Bot,
  ArrowRightLeft,
  Crown,
  Users,
  Check,
  HelpCircle,
  MessageSquare,
  FileText,
  Download,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
} from 'framer-motion';
// Modal imports removed — now using dedicated pages

const personalNavItems = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
  { title: 'Events', url: '/events', icon: Calendar },
  { title: 'Discover', url: '/discover', icon: Compass },
  { title: 'Profile', url: '/profile', icon: UserCircle },
  { title: 'Forms', url: '/forms', icon: FileText },
];

const clubNavItems = [
  { title: 'Dashboard', url: '/admin', icon: LayoutDashboard },
  { title: 'Events', url: '/events', icon: Calendar },
  { title: 'Reviews', url: '/reviews', icon: MessageSquare },
  { title: 'Club', url: '/clubs', icon: Building2 },
  { title: 'Club Settings', url: '/club-settings', icon: Settings2 },
  { title: 'Forms', url: '/forms', icon: FileText },
];

const STORAGE_KEY = 'dashboard-sidebar-collapsed';

function MagnifiedIcon({
  item,
  active,
  mouseY,
  onClick,
  isNeo,
}: {
  item: { title: string; icon: any; url: string };
  active: boolean;
  mouseY: any;
  index?: number;
  onClick: () => void;
  isNeo?: boolean;
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
        background: active
          ? isNeo ? '#E98A3A' : '#FFFFFF'
          : 'transparent',
        border: active && isNeo ? '2px solid #111111' : 'none',
        boxShadow: active && isNeo ? '2px 2px 0px #111111' : 'none',
      }}
      whileHover={{ background: active ? (isNeo ? '#E98A3A' : '#FFFFFF') : (isNeo ? '#2A2A2A' : 'rgba(255,255,255,0.08)') }}
    >
      <motion.div style={{ scale: iconScale }} className="flex items-center justify-center">
        <item.icon
          className="w-[18px] h-[18px]"
          style={{ color: active ? (isNeo ? '#111111' : '#000000') : '#8A8F98' }}
        />
      </motion.div>
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
  const { activeClub, clubs, switchClub } = useClub();
  const { isPresident, hasPower } = useDelegatedPowers();
  const { activeDesign } = useDesign();
  const mouseY = useMotionValue(Infinity);

  const [showClubSwitcher, setShowClubSwitcher] = useState(false);
  const [superAdminDrawerOpen, setSuperAdminDrawerOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

  const isNeo = activeDesign === 'design-2';

  // Persist nav scroll position across route remounts so clicking items
  // below the fold (e.g. Assign Powers, AI Chatbot) doesn't appear to
  // jump the sidebar to the top.
  useEffect(() => {
    const saved = sessionStorage.getItem('dashboard-sidebar-scroll');
    if (saved && navRef.current) {
      navRef.current.scrollTop = parseInt(saved, 10) || 0;
    }
  }, []);

  const handleNavScroll = () => {
    if (navRef.current) {
      sessionStorage.setItem('dashboard-sidebar-scroll', String(navRef.current.scrollTop));
    }
  };

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  const isActive = (url: string) =>
    location.pathname === url || (url !== '/admin' && location.pathname.startsWith(url + '/'));

  const isSuperAdminEmail = isSuperAdminUser(user?.email);

  // Super Admin mode is driven by the lock flag (NOT the URL), so navigating
  // to /chatbot, /manage-outsiders, /global-reports, /settings, etc. while
  // in Super Admin mode does NOT flip the sidebar back to Personal/Club.
  const [isSuperAdminMode, setIsSuperAdminMode] = useState<boolean>(
    () => getSuperAdminModeForUser(user?.email)
  );
  useEffect(() => {
    const sync = () => setIsSuperAdminMode(getSuperAdminModeForUser(user?.email));
    window.addEventListener(SUPER_ADMIN_MODE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(SUPER_ADMIN_MODE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [user?.email]);
  // Re-sync when route changes (in case the guard armed/disarmed the lock).
  useEffect(() => {
    setIsSuperAdminMode(getSuperAdminModeForUser(user?.email));
  }, [location.pathname, user?.email]);

  // Determine view mode from localStorage, listen for changes
  const [viewMode, setViewModeLocal] = useState<'personal' | 'club'>(
    () => (localStorage.getItem('dashboardViewMode') as 'personal' | 'club') || 'personal'
  );
  const isClubMode = viewMode === 'club';

  useEffect(() => {
    const handler = () => {
      setViewModeLocal((localStorage.getItem('dashboardViewMode') as 'personal' | 'club') || 'personal');
    };
    window.addEventListener('viewModeChanged', handler);
    return () => window.removeEventListener('viewModeChanged', handler);
  }, []);

  const handleViewModeToggle = (mode: 'personal' | 'club') => {
    localStorage.setItem('dashboardViewMode', mode);
    setViewModeLocal(mode);
    window.dispatchEvent(new Event('viewModeChanged'));
  };

  // Build contextual nav items
  const contextItems: { title: string; icon: any; action: () => void; activeUrl?: string; isActive?: boolean }[] = [];

  if (isClubMode && activeClub && !(isSuperAdminEmail && isSuperAdminMode)) {
    if (isPresident) {
      contextItems.push({ title: 'Assign Powers', icon: Shield, action: () => navigate('/assign-powers'), activeUrl: '/assign-powers' });
    }
    if (hasPower('use_chatbot')) {
      contextItems.push({ title: 'AI Chatbot', icon: Bot, action: () => navigate('/chatbot'), activeUrl: '/chatbot' });
    }
    if (clubs.length > 1) {
      contextItems.push({ title: 'Switch Club', icon: ArrowRightLeft, action: () => setShowClubSwitcher(!showClubSwitcher), isActive: showClubSwitcher });
    }
  }

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

  const setSuperAdminMode = (on: boolean) => {
    setSuperAdminLockActive(on);
    setIsSuperAdminMode(on);
    if (on) {
      navigate('/super-admin', { replace: true });
      return;
    }

    localStorage.setItem('dashboardViewMode', 'personal');
    setViewModeLocal('personal');
    window.dispatchEvent(new Event('viewModeChanged'));
    navigate('/admin', { replace: true });
  };

  // Sub-items shown under the Super Admin toggle when active.
  const superAdminSubItems = [
    { title: 'Global Reports', icon: FileText, action: () => navigate('/global-reports'), activeUrl: '/global-reports' as string | undefined },
    { title: 'Export Data', icon: Download, action: () => window.dispatchEvent(new Event('superAdminExportData')), activeUrl: undefined as string | undefined },
    { title: 'AI Chatbot', icon: Bot, action: () => navigate('/super-admin/chatbot'), activeUrl: '/super-admin/chatbot' as string | undefined },
    { title: 'Manage Outsiders', icon: Users, action: () => navigate('/manage-outsiders'), activeUrl: '/manage-outsiders' as string | undefined },
  ];

  const sidebarBg = isNeo ? '#111111' : '#000000';
  const activeBg = isNeo ? '#E98A3A' : '#FFFFFF';
  const activeText = '#111111';
  const inactiveText = isNeo ? '#B0B0B0' : '#8A8F98';
  const hoverBg = isNeo ? '#2A2A2A' : 'rgba(255,255,255,0.05)';

  return (
    <>
      <div
        className="flex flex-col shrink-0"
        onMouseMove={(e) => { if (collapsed) mouseY.set(e.clientY); }}
        onMouseLeave={() => mouseY.set(Infinity)}
        style={{
          width: collapsed ? 64 : 220,
          background: sidebarBg,
          transition: 'width 0.25s ease',
          borderRadius: isNeo ? '16px' : '16px',
          border: isNeo ? '3px solid #111111' : 'none',
          margin: '12px',
          position: 'sticky',
          top: 12,
          height: 'calc(100vh - 24px)',
          overflow: 'hidden',
        }}
      >
        {/* Profile avatar */}
        <div className="flex items-center gap-3 px-4 pt-6 pb-4">
          <Avatar className="w-9 h-9 shrink-0" style={isNeo ? { border: '2px solid #E98A3A' } : {}}>
            <AvatarImage src={profile?.avatar_url || user?.user_metadata?.avatar_url} />
            <AvatarFallback className="bg-white/10 text-white text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 overflow-hidden" style={{ transition: 'opacity 0.2s ease', opacity: 1 }}>
              <p className="text-sm font-semibold text-white truncate" style={isNeo ? { fontFamily: "'Space Grotesk', sans-serif" } : {}}>
                {profile?.full_name || user?.user_metadata?.full_name || 'User'}
              </p>
              <p className="text-[11px] truncate" style={{ color: inactiveText }}>{user?.email}</p>
            </div>
          )}
        </div>

        {/* View mode toggle (hidden in Super Admin mode) */}
        {!(isSuperAdminEmail && isSuperAdminMode) && (
        <div className="px-3 mb-2">
          {collapsed ? (
            <button
              onClick={() => handleViewModeToggle(isClubMode ? 'personal' : 'club')}
              className="flex items-center justify-center w-10 h-10 rounded-full mx-auto transition-colors"
              style={{ color: isNeo ? '#E98A3A' : '#8A8F98' }}
              title={isClubMode ? 'Switch to Personal' : 'Switch to Club'}
              onMouseEnter={(e) => { e.currentTarget.style.background = hoverBg; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <ArrowRightLeft className="w-[18px] h-[18px]" />
            </button>
          ) : (
            <div
              className="inline-flex items-center p-1 w-full"
              style={{
                backgroundColor: isNeo ? '#2A2A2A' : 'rgba(255,255,255,0.08)',
                border: isNeo ? '2px solid #333' : '1px solid rgba(255,255,255,0.1)',
                borderRadius: isNeo ? '10px' : '999px',
              }}
            >
              <button
                onClick={() => handleViewModeToggle('personal')}
                className="flex-1 py-1.5 text-xs transition-all text-center"
                style={{
                  borderRadius: isNeo ? '8px' : '999px',
                  fontFamily: isNeo ? "'Space Grotesk', sans-serif" : undefined,
                  fontWeight: !isClubMode ? 700 : 500,
                  background: !isClubMode ? (isNeo ? '#E98A3A' : '#FFFFFF') : 'transparent',
                  color: !isClubMode ? '#111111' : '#888',
                  border: !isClubMode && isNeo ? '2px solid #111111' : '2px solid transparent',
                }}
              >
                Personal
              </button>
              <button
                onClick={() => handleViewModeToggle('club')}
                className="flex-1 py-1.5 text-xs transition-all text-center"
                style={{
                  borderRadius: isNeo ? '8px' : '999px',
                  fontFamily: isNeo ? "'Space Grotesk', sans-serif" : undefined,
                  fontWeight: isClubMode ? 700 : 500,
                  background: isClubMode ? (isNeo ? '#E98A3A' : '#FFFFFF') : 'transparent',
                  color: isClubMode ? '#111111' : '#888',
                  border: isClubMode && isNeo ? '2px solid #111111' : '2px solid transparent',
                }}
              >
                Club
              </button>
            </div>
          )}
        </div>
        )}

        {/* Nav items */}
        <nav ref={navRef} onScroll={handleNavScroll} className="flex-1 flex flex-col gap-1 px-3 mt-2 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          {/* Super Admin toggle button + drawer (positioned at the top, above Dashboard) */}
          {isSuperAdminEmail && !collapsed && (
            <>
              <button
                onClick={() => setSuperAdminDrawerOpen((o) => !o)}
                className="flex items-center gap-3 px-3 py-2.5 transition-all duration-200 w-full text-left"
                style={{
                  color: isSuperAdminMode ? '#F59E0B' : inactiveText,
                  borderRadius: isNeo ? '10px' : '999px',
                  background: isSuperAdminMode ? (isNeo ? '#2A2A2A' : 'rgba(245,158,11,0.1)') : 'transparent',
                  fontFamily: isNeo ? "'Space Grotesk', sans-serif" : undefined,
                }}
                onMouseEnter={(e) => { if (!isSuperAdminMode) e.currentTarget.style.background = hoverBg; }}
                onMouseLeave={(e) => { if (!isSuperAdminMode) e.currentTarget.style.background = 'transparent'; }}
              >
                <Crown className="w-[18px] h-[18px] shrink-0" />
                <span className="text-sm font-medium truncate flex-1">Super Admin</span>
                <motion.div
                  animate={{ rotate: superAdminDrawerOpen ? 180 : 0 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 26 }}
                >
                  <ChevronRight className="w-3.5 h-3.5 rotate-90" style={{ opacity: 0.7 }} />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {superAdminDrawerOpen && (
                  <motion.div
                    key="super-admin-switch-drawer"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 30, mass: 0.7 }}
                    className="overflow-hidden shrink-0"
                  >
                    <div
                      className="mx-1 my-1 px-3 py-3 flex items-center justify-between"
                      style={{
                        background: isNeo ? '#1C1C1C' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${isNeo ? '#333' : 'rgba(255,255,255,0.08)'}`,
                        borderRadius: isNeo ? '10px' : '12px',
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Crown className="w-4 h-4 shrink-0" style={{ color: '#F59E0B' }} />
                        <span
                          className="text-[12px] font-medium truncate"
                          style={{ color: '#fff', fontFamily: isNeo ? "'Space Grotesk', sans-serif" : undefined }}
                        >
                          {isSuperAdminMode ? 'Turn Off' : 'Turn On'}
                        </span>
                      </div>
                      <Switch
                        checked={isSuperAdminMode}
                        onCheckedChange={(c) => setSuperAdminMode(c)}
                        className="scale-90"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="my-1 mx-2 border-t" style={{ borderColor: isNeo ? '#333' : 'rgba(255,255,255,0.1)' }} />
            </>
          )}

          {isSuperAdminEmail && collapsed && (
            <div className="group relative">
              <button
                onClick={() => setSuperAdminMode(!isSuperAdminMode)}
                className="flex items-center justify-center w-10 h-10 rounded-full mx-auto transition-colors"
                style={{ color: isSuperAdminMode ? '#F59E0B' : inactiveText }}
              >
                <Crown className="w-[18px] h-[18px]" />
              </button>
            </div>
          )}

          {(isSuperAdminEmail && isSuperAdminMode
            ? [{ title: 'Dashboard', url: '/super-admin', icon: LayoutDashboard }]
            : (isClubMode ? clubNavItems : personalNavItems)
          ).map((item, index) => {
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
                    isNeo={isNeo}
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
                  background: active ? activeBg : 'transparent',
                  color: active ? activeText : inactiveText,
                  borderRadius: isNeo ? '10px' : '999px',
                  border: active && isNeo ? '2px solid #111111' : '2px solid transparent',
                  boxShadow: active && isNeo ? '3px 3px 0px #111111' : 'none',
                  fontFamily: isNeo ? "'Space Grotesk', sans-serif" : undefined,
                  fontWeight: active && isNeo ? 700 : 500,
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = hoverBg; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <item.icon className="w-[18px] h-[18px] shrink-0" />
                <span className="text-sm truncate" style={{ transition: 'opacity 0.2s ease' }}>
                  {item.title}
                </span>
              </button>
            );
          })}

          {/* Super Admin sub-items (after Dashboard) */}
          {isSuperAdminEmail && isSuperAdminMode && !collapsed && (
            <div className="space-y-1 mt-1">
              {superAdminSubItems.map((sub) => {
                const subActive = sub.activeUrl ? isActive(sub.activeUrl) : false;
                return (
                  <button
                    key={sub.title}
                    onClick={sub.action}
                    className="flex items-center gap-3 px-3 py-2.5 transition-all duration-200 w-full text-left"
                    style={{
                      background: subActive ? activeBg : 'transparent',
                      color: subActive ? activeText : inactiveText,
                      borderRadius: isNeo ? '10px' : '999px',
                      border: subActive && isNeo ? '2px solid #111111' : '2px solid transparent',
                      boxShadow: subActive && isNeo ? '3px 3px 0px #111111' : 'none',
                      fontFamily: isNeo ? "'Space Grotesk', sans-serif" : undefined,
                      fontWeight: subActive && isNeo ? 700 : 500,
                    }}
                    onMouseEnter={(e) => { if (!subActive) e.currentTarget.style.background = hoverBg; }}
                    onMouseLeave={(e) => { if (!subActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <sub.icon className="w-[18px] h-[18px] shrink-0" />
                    <span className="text-sm truncate">{sub.title}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Contextual items separator */}
          {contextItems.length > 0 && !collapsed && (
            <div className="my-2 mx-2 border-t" style={{ borderColor: isNeo ? '#333' : 'rgba(255,255,255,0.1)' }} />
          )}

          {/* Contextual nav items */}
          {contextItems.map((item) => {
            const active = item.isActive ?? (item.activeUrl ? isActive(item.activeUrl) : false);

            if (collapsed) {
              return (
                <div key={item.title} className="group relative">
                  <MagnifiedIcon
                    item={{ title: item.title, icon: item.icon, url: '' }}
                    active={active}
                    mouseY={mouseY}
                    onClick={item.action}
                    isNeo={isNeo}
                  />
                </div>
              );
            }

            return (
              <button
                key={item.title}
                onClick={item.action}
                className="flex items-center gap-3 px-3 py-2.5 transition-all duration-200 w-full text-left"
                style={{
                  background: active ? activeBg : 'transparent',
                  color: active ? activeText : inactiveText,
                  borderRadius: isNeo ? '10px' : '999px',
                  border: active && isNeo ? '2px solid #111111' : '2px solid transparent',
                  boxShadow: active && isNeo ? '3px 3px 0px #111111' : 'none',
                  fontFamily: isNeo ? "'Space Grotesk', sans-serif" : undefined,
                  fontWeight: active && isNeo ? 700 : 500,
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = hoverBg; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
              >
                <item.icon className="w-[18px] h-[18px] shrink-0" />
                <span className="text-sm font-medium truncate">{item.title}</span>
              </button>
            );
          })}

          {/* Club switcher inline */}
          {showClubSwitcher && !collapsed && (
            <div className="ml-2 mt-1 space-y-1">
              {clubs.map(club => (
                <button
                  key={club.club_id}
                  onClick={() => { switchClub(club.club_id); setShowClubSwitcher(false); }}
                  className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs transition-colors"
                  style={{
                    color: activeClub?.club_id === club.club_id ? (isNeo ? '#E98A3A' : '#fff') : inactiveText,
                    background: activeClub?.club_id === club.club_id ? (isNeo ? '#2A2A2A' : 'rgba(255,255,255,0.08)') : 'transparent',
                  }}
                >
                  <span className="truncate">{club.club_name}</span>
                  {activeClub?.club_id === club.club_id && <Check className="w-3 h-3 shrink-0" />}
                </button>
              ))}
            </div>
          )}

          {/* Divider before footer items */}
          <div className="my-2 mx-2 border-t" style={{ borderColor: isNeo ? '#333' : 'rgba(255,255,255,0.1)' }} />

          {/* Settings */}
          {collapsed ? (
            <div className="group relative">
              <MagnifiedIcon
                item={{ title: 'Settings', icon: Settings, url: '/settings' }}
                active={isActive('/settings')}
                mouseY={mouseY}
                onClick={() => navigate('/settings')}
                isNeo={isNeo}
              />
            </div>
          ) : (
            <button
              onClick={() => navigate('/settings')}
              className="flex items-center gap-3 px-3 py-2.5 transition-all duration-200 w-full text-left"
              style={{
                color: isActive('/settings') ? activeText : inactiveText,
                background: isActive('/settings') ? activeBg : 'transparent',
                borderRadius: isNeo ? '10px' : '999px',
                border: isActive('/settings') && isNeo ? '2px solid #111111' : '2px solid transparent',
                boxShadow: isActive('/settings') && isNeo ? '3px 3px 0px #111111' : 'none',
                fontFamily: isNeo ? "'Space Grotesk', sans-serif" : undefined,
                fontWeight: isActive('/settings') && isNeo ? 700 : 500,
              }}
              onMouseEnter={(e) => { if (!isActive('/settings')) e.currentTarget.style.background = hoverBg; }}
              onMouseLeave={(e) => { if (!isActive('/settings')) e.currentTarget.style.background = 'transparent'; }}
            >
              <Settings className="w-[18px] h-[18px] shrink-0" />
              <span className="text-sm font-medium">Settings</span>
            </button>
          )}

          {/* Contact Us */}
          {collapsed ? (
            <div className="group relative">
              <MagnifiedIcon
                item={{ title: 'Contact Us', icon: HelpCircle, url: '/contact2' }}
                active={isActive('/contact2')}
                mouseY={mouseY}
                onClick={() => navigate('/contact2')}
                isNeo={isNeo}
              />
            </div>
          ) : (
            <button
              onClick={() => navigate('/contact2')}
              className="flex items-center gap-3 px-3 py-2.5 transition-all duration-200 w-full text-left"
              style={{
                color: isActive('/contact2') ? activeText : inactiveText,
                background: isActive('/contact2') ? activeBg : 'transparent',
                borderRadius: isNeo ? '10px' : '999px',
                border: isActive('/contact2') && isNeo ? '2px solid #111111' : '2px solid transparent',
                boxShadow: isActive('/contact2') && isNeo ? '3px 3px 0px #111111' : 'none',
                fontFamily: isNeo ? "'Space Grotesk', sans-serif" : undefined,
                fontWeight: isActive('/contact2') && isNeo ? 700 : 500,
              }}
              onMouseEnter={(e) => { if (!isActive('/contact2')) e.currentTarget.style.background = hoverBg; }}
              onMouseLeave={(e) => { if (!isActive('/contact2')) e.currentTarget.style.background = 'transparent'; }}
            >
              <HelpCircle className="w-[18px] h-[18px] shrink-0" />
              <span className="text-sm font-medium">Contact Us</span>
            </button>
          )}

          {/* Sign Out */}
          {collapsed ? (
            <div className="group relative">
              <MagnifiedIcon
                item={{ title: 'Sign Out', icon: LogOut, url: '' }}
                active={false}
                mouseY={mouseY}
                onClick={handleSignOut}
                isNeo={isNeo}
              />
            </div>
          ) : (
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-3 py-2.5 transition-all duration-200 w-full text-left"
              style={{
                color: inactiveText,
                borderRadius: isNeo ? '10px' : '999px',
                fontFamily: isNeo ? "'Space Grotesk', sans-serif" : undefined,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = hoverBg; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <LogOut className="w-[18px] h-[18px] shrink-0" />
              <span className="text-sm font-medium">Sign Out</span>
            </button>
          )}
        </nav>

        {/* Bottom: collapse toggle only */}
        <div
          className="px-3 pb-4 mt-auto"
          onMouseMove={(e) => { if (collapsed) mouseY.set(e.clientY); }}
          onMouseLeave={() => mouseY.set(Infinity)}
        >
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="flex items-center justify-center w-full py-2 transition-all duration-200"
            style={{
              color: inactiveText,
              borderRadius: isNeo ? '10px' : '999px',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = hoverBg; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </>
  );
}
