import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useClub } from '@/contexts/ClubContext';
import { useProfile } from '@/hooks/useProfile';
import { useDelegatedPowers } from '@/hooks/useDelegatedPowers';
import { ChevronDown, User, Settings, LogOut, ArrowRightLeft, Check, ChevronRight, Shield, Crown } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import AssignPowersModal from './AssignPowersModal';

const SUPER_ADMIN_EMAIL = 'suryakant.gnbba2029@iilm.edu';

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
  const { isPresident } = useDelegatedPowers();
  const [showClubs, setShowClubs] = useState(false);
  const [showPowersModal, setShowPowersModal] = useState(false);

  const isSuperAdminEmail = user?.email === SUPER_ADMIN_EMAIL;
  const isSuperAdminMode = location.pathname === '/super-admin' || location.pathname === '/global-reports';

  const handleSuperAdminToggle = (checked: boolean) => {
    if (checked) {
      navigate('/super-admin');
    } else {
      navigate('/admin');
    }
  };

  const fullName = profile?.full_name || 'User';
  const initials = fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <>
    <DropdownMenu onOpenChange={() => setShowClubs(false)}>
      <DropdownMenuTrigger asChild>
        <button className="glass-input pl-1 pr-4 py-1 rounded-full flex items-center gap-3 cursor-pointer hover:bg-white/60 transition-colors outline-none focus:ring-2 focus:ring-primary/20">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={fullName} className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
              {initials}
            </div>
          )}
          <span className="text-sm font-medium text-foreground">{fullName}</span>
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {!showClubs ? (
          <>
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User className="mr-2 h-4 w-4" /> My Profile
            </DropdownMenuItem>

            {clubs.length > 0 && (
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

            {viewMode === 'club' && isPresident && (
              <DropdownMenuItem onClick={() => setShowPowersModal(true)}>
                <Shield className="mr-2 h-4 w-4" /> Assign Powers
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
    </>
  );
};

export default ProfileDropdown;
