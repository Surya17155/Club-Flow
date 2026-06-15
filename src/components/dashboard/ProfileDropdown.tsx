import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useClub } from '@/contexts/ClubContext';
import { useProfile } from '@/hooks/useProfile';
import { useDelegatedPowers } from '@/hooks/useDelegatedPowers';
import { useIsMobile } from '@/hooks/use-mobile';
import { isSuperAdminLockActive, isSuperAdminUser, setSuperAdminLockActive, SUPER_ADMIN_MODE_EVENT } from '@/lib/superAdminMode';
import { ChevronDown, User, Settings, LogOut, ArrowRightLeft, Check, ChevronRight, Shield, Crown, Settings2, Bot, Users } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import AssignPowersModal from './AssignPowersModal';
import ClubSettingsModal from './ClubSettingsModal';
import { ChatPanel } from '@/components/chat/ChatPanel';

const roleLabelMap: Record<string, string> = {
  admin: 'Admin',
  president: 'President',
  vice_president: 'Vice President',
  secretary: 'Secretary',
  social_media_head: 'Social Media Head',
  member: 'Member',
};

const ProfileDropdown = ({ viewMode = 'personal' }: { viewMode?: 'personal' | 'club' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { activeClub, clubs, switchClub } = useClub();
  const { isPresident, hasPower } = useDelegatedPowers();
  const isMobile = useIsMobile();
  const [showClubs, setShowClubs] = useState(false);
  const [showPowersModal, setShowPowersModal] = useState(false);
  const [showClubSettings, setShowClubSettings] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isSuperAdminMode, setIsSuperAdminMode] = useState(() => isSuperAdminLockActive());

  const isSuperAdminEmail = isSuperAdminUser(user?.email);

  useEffect(() => {
    const sync = () => setIsSuperAdminMode(isSuperAdminLockActive());
    sync();
    window.addEventListener(SUPER_ADMIN_MODE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(SUPER_ADMIN_MODE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [location.pathname]);

  // Show chatbot in Super Admin mode OR in Club mode if president/admin/has power
  const showChatOption = isSuperAdminMode || (viewMode === 'club' && hasPower('use_chatbot'));

  const handleSuperAdminToggle = (checked: boolean) => {
    setSuperAdminLockActive(checked);
    setIsSuperAdminMode(checked);
    if (checked) navigate('/super-admin', { replace: true });
    else navigate('/admin', { replace: true });
  };

  const fullName = profile?.full_name || 'User';
  const initials = fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
    <DropdownMenu onOpenChange={() => setShowClubs(false)}>
      <DropdownMenuTrigger className="w-9 h-9 rounded-full overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all outline-none focus:ring-2 focus:ring-primary/20">
        {profile?.avatar_url ? (
          <img src={profile.avatar_url} alt={fullName} className="w-9 h-9 rounded-full object-cover" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
            {initials}
          </div>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {!showClubs ? (
          <>
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User className="mr-2 h-4 w-4" /> My Profile
            </DropdownMenuItem>

            {clubs.length > 0 && !(isSuperAdminEmail && isSuperAdminMode) && (
              <DropdownMenuItem
                onSelect={(e) => { e.preventDefault(); setShowClubs(true); }}
              >
                <ArrowRightLeft className="mr-2 h-4 w-4" />
                <span className="flex-1">Switch Club</span>
                {activeClub && (
                  <span className="text-xs text-muted-foreground truncate max-w-[100px]">{activeClub.club_name}</span>
                )}
                <ChevronRight className="ml-1 h-3 w-3 text-muted-foreground" />
              </DropdownMenuItem>
            )}

            {showChatOption && (
              <DropdownMenuItem onClick={() => {
                if (isMobile) {
                  navigate('/chat', { state: { superAdmin: isSuperAdminEmail && isSuperAdminMode } });
                } else {
                  setShowChat(true);
                }
              }}>
                <Bot className="mr-2 h-4 w-4 text-primary" /> AI Chatbot
              </DropdownMenuItem>
            )}

            {viewMode === 'club' && isPresident && (
              <>
                <DropdownMenuItem onClick={() => setShowPowersModal(true)}>
                  <Shield className="mr-2 h-4 w-4" /> Assign Powers
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowClubSettings(true)}>
                  <Settings2 className="mr-2 h-4 w-4" /> Club Settings
                </DropdownMenuItem>
              </>
            )}

            {isSuperAdminEmail && isSuperAdminMode && (
              <DropdownMenuItem onClick={() => navigate('/manage-outsiders')}>
                <Users className="mr-2 h-4 w-4 text-primary" /> Manage Outsiders
              </DropdownMenuItem>
            )}

            {isSuperAdminEmail && (
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="flex items-center justify-between"
              >
                <div className="flex items-center">
                  <Crown className="mr-2 h-4 w-4 text-amber-500" />
                  <span>Super Admin Mode</span>
                </div>
                <Switch
                  checked={isSuperAdminMode}
                  onCheckedChange={handleSuperAdminToggle}
                  className="ml-3 scale-90"
                />
              </DropdownMenuItem>
            )}

            <DropdownMenuItem onClick={() => navigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" /> Settings
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </DropdownMenuItem>
          </>
        ) : (
          <>
            <DropdownMenuItem
              onSelect={(e) => { e.preventDefault(); setShowClubs(false); }}
              className="text-xs text-muted-foreground"
            >
              <ChevronDown className="mr-2 h-3 w-3 rotate-90" /> Back
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Your Clubs</p>
            </div>
            {clubs.map(club => (
              <DropdownMenuItem key={club.club_id} onClick={() => { switchClub(club.club_id); setShowClubs(false); }}>
                <div className="flex items-center justify-between w-full">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{club.club_name}</p>
                    <p className="text-xs text-muted-foreground">{roleLabelMap[club.role] ?? club.role}</p>
                  </div>
                  {activeClub?.club_id === club.club_id && <Check className="h-4 w-4 text-primary ml-2 shrink-0" />}
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
    <AssignPowersModal open={showPowersModal} onOpenChange={setShowPowersModal} />
    <ClubSettingsModal open={showClubSettings} onOpenChange={setShowClubSettings} />
    <ChatPanel
      open={showChat}
      onClose={() => setShowChat(false)}
      activeClubId={(isSuperAdminEmail && isSuperAdminMode) ? undefined : activeClub?.club_id}
    />
    </>
  );
};

export default ProfileDropdown;
