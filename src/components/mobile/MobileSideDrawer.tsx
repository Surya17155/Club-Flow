import { useState, useEffect, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useClub } from '@/contexts/ClubContext';
import { useDelegatedPowers } from '@/hooks/useDelegatedPowers';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard, Calendar, Compass, UserCircle, Settings, LogOut,
  Shield, Settings2, Bot, ArrowRightLeft, Building2, X, Check, ChevronDown,
} from 'lucide-react';

const SUPER_ADMIN_EMAIL = 'suryakant.gnbba2029@iilm.edu';

interface MobileSideDrawerProps {
  open: boolean;
  onClose: () => void;
  viewMode: 'personal' | 'club';
  setViewMode: (m: 'personal' | 'club') => void;
}

function MobileSideDrawerInner({ open, onClose, viewMode, setViewMode }: MobileSideDrawerProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { activeClub, clubs, switchClub } = useClub();
  const { isPresident, hasPower } = useDelegatedPowers();
  const [showClubSwitcher, setShowClubSwitcher] = useState(false);

  const isClubMode = viewMode === 'club';
  const isSuperAdmin = user?.email === SUPER_ADMIN_EMAIL;

  const initials = (profile?.full_name || 'U')
    .split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

  const nav = (path: string) => { navigate(path); onClose(); };

  const personalItems = [
    { title: 'Dashboard', icon: LayoutDashboard, url: '/admin' },
    { title: 'Events', icon: Calendar, url: '/events' },
    { title: 'Discover', icon: Compass, url: '/discover' },
    { title: 'Profile', icon: UserCircle, url: '/profile' },
    { title: 'Settings', icon: Settings, url: '/settings' },
  ];

  const clubItems = [
    { title: 'Dashboard', icon: LayoutDashboard, url: '/admin' },
    { title: 'Events', icon: Calendar, url: '/events' },
    { title: 'Club', icon: Building2, url: '/clubs' },
    { title: 'Club Settings', icon: Settings2, url: '/club-settings' },
    { title: 'Settings', icon: Settings, url: '/settings' },
  ];

  const navItems = isClubMode ? clubItems : personalItems;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60]"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={onClose}
          />
          {/* Drawer */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed top-0 left-0 bottom-0 z-[61] flex flex-col"
            style={{
              width: '280px',
              background: '#FFFDF7',
              borderRight: '3px solid #111',
              boxShadow: '6px 0 0 #111',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5" style={{ borderBottom: '3px solid #111' }}>
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center"
                  style={{ border: '2px solid #111', background: '#E98A3A' }}
                >
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-black" style={{ color: '#111' }}>{initials}</span>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold truncate" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#111', maxWidth: 150 }}>
                    {profile?.full_name || 'User'}
                  </p>
                  <p className="text-[11px] truncate" style={{ color: '#6B7280', maxWidth: 150 }}>
                    {user?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center"
                style={{ border: '2px solid #111', background: '#F4EFE7' }}
              >
                <X className="w-4 h-4" style={{ color: '#111' }} />
              </button>
            </div>

            {/* Mode Toggle */}
            <div className="px-5 py-3" style={{ borderBottom: '2px solid #ddd' }}>
              <div
                className="flex p-1"
                style={{
                  border: '2px solid #111',
                  background: '#F4EFE7',
                }}
              >
                <button
                  onClick={() => { setViewMode('personal'); }}
                  className="flex-1 py-2 text-xs font-bold uppercase transition-all"
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    background: !isClubMode ? '#E98A3A' : 'transparent',
                    color: '#111',
                    border: !isClubMode ? '2px solid #111' : '2px solid transparent',
                  }}
                >
                  Personal
                </button>
                <button
                  onClick={() => { setViewMode('club'); }}
                  className="flex-1 py-2 text-xs font-bold uppercase transition-all"
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    background: isClubMode ? '#E98A3A' : 'transparent',
                    color: '#111',
                    border: isClubMode ? '2px solid #111' : '2px solid transparent',
                  }}
                >
                  Club
                </button>
              </div>
            </div>

            {/* Nav Items */}
            <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1" style={{ scrollbarWidth: 'none' }}>
              {navItems.map(item => {
                const active = location.pathname === item.url;
                return (
                  <button
                    key={item.title}
                    onClick={() => nav(item.url)}
                    className="flex items-center gap-3 w-full px-4 py-3 text-left transition-all"
                    style={{
                      background: active ? '#E98A3A' : 'transparent',
                      color: active ? '#111' : '#333',
                      border: active ? '2px solid #111' : '2px solid transparent',
                      boxShadow: active ? '3px 3px 0px #111' : 'none',
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: active ? 800 : 600,
                    }}
                  >
                    <item.icon className="w-5 h-5 shrink-0" />
                    <span className="text-sm">{item.title}</span>
                  </button>
                );
              })}

              {/* Club-mode contextual items */}
              {isClubMode && activeClub && (
                <>
                  <div className="my-2 mx-2" style={{ borderTop: '2px solid #ddd' }} />

                  {isPresident && (
                    <button
                      onClick={() => nav('/assign-powers')}
                      className="flex items-center gap-3 w-full px-4 py-3 text-left"
                      style={{
                        color: '#E98A3A',
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontWeight: 700,
                        border: '2px solid transparent',
                      }}
                    >
                      <Shield className="w-5 h-5" />
                      <span className="text-sm">Assign Powers</span>
                    </button>
                  )}

                  {hasPower('use_chatbot') && (
                    <button
                      onClick={() => nav('/chatbot')}
                      className="flex items-center gap-3 w-full px-4 py-3 text-left"
                      style={{
                        color: '#E98A3A',
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontWeight: 700,
                        border: '2px solid transparent',
                      }}
                    >
                      <Bot className="w-5 h-5" />
                      <span className="text-sm">AI Chatbot</span>
                    </button>
                  )}

                  {clubs.length > 1 && (
                    <>
                      <button
                        onClick={() => setShowClubSwitcher(!showClubSwitcher)}
                        className="flex items-center gap-3 w-full px-4 py-3 text-left"
                        style={{
                          color: '#E98A3A',
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontWeight: 700,
                          border: '2px solid transparent',
                        }}
                      >
                        <ArrowRightLeft className="w-5 h-5" />
                        <span className="text-sm flex-1">Switch Club</span>
                        <ChevronDown className={`w-4 h-4 transition-transform ${showClubSwitcher ? 'rotate-180' : ''}`} />
                      </button>

                      <AnimatePresence>
                        {showClubSwitcher && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden ml-4"
                          >
                            {clubs.map(club => (
                              <button
                                key={club.club_id}
                                onClick={() => { switchClub(club.club_id); setShowClubSwitcher(false); }}
                                className="flex items-center justify-between w-full px-3 py-2.5 text-left"
                                style={{
                                  fontFamily: "'Space Grotesk', sans-serif",
                                  fontWeight: activeClub?.club_id === club.club_id ? 700 : 500,
                                  color: activeClub?.club_id === club.club_id ? '#E98A3A' : '#555',
                                  fontSize: '13px',
                                }}
                              >
                                <span className="truncate">{club.club_name}</span>
                                {activeClub?.club_id === club.club_id && <Check className="w-4 h-4 shrink-0" />}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
                  )}
                </>
              )}
            </nav>

            {/* Sign Out */}
            <div className="px-3 pb-5" style={{ borderTop: '2px solid #ddd', paddingTop: '12px' }}>
              <button
                onClick={async () => { await signOut(); navigate('/'); onClose(); }}
                className="flex items-center gap-3 w-full px-4 py-3 text-left"
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700,
                  color: '#111',
                  background: '#F4EFE7',
                  border: '2px solid #111',
                  boxShadow: '3px 3px 0px #111',
                }}
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm">Sign Out</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export const MobileSideDrawer = memo(MobileSideDrawerInner);
