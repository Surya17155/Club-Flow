import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useClub } from '@/contexts/ClubContext';
import { useProfile } from '@/hooks/useProfile';
import { ChevronDown, User, Settings, LogOut, ArrowRightLeft, Check } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const roleLabelMap: Record<string, string> = {
  admin: 'Admin',
  president: 'President',
  vice_president: 'Vice President',
  secretary: 'Secretary',
  social_media_head: 'Social Media Head',
  member: 'Member',
};

const ProfileDropdown = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const { activeClub, clubs, switchClub } = useClub();

  const fullName = profile?.full_name || 'User';
  const initials = fullName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="glass-input pl-1 pr-4 py-1 rounded-full flex items-center gap-3 cursor-pointer hover:bg-white/60 transition-colors outline-none">
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
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={() => navigate('/profile')}>
          <User className="mr-2 h-4 w-4" /> My Profile
        </DropdownMenuItem>

        {clubs.length > 0 && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <ArrowRightLeft className="mr-2 h-4 w-4" /> Switch Club
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {clubs.map(club => (
                <DropdownMenuItem key={club.club_id} onClick={() => switchClub(club.club_id)}>
                  <div className="flex items-center justify-between w-full">
                    <div>
                      <p className="text-sm font-medium">{club.club_name}</p>
                      <p className="text-xs text-muted-foreground">{roleLabelMap[club.role] ?? club.role}</p>
                    </div>
                    {activeClub?.club_id === club.club_id && <Check className="h-4 w-4 text-primary ml-2" />}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}

        <DropdownMenuItem onClick={() => navigate('/settings')}>
          <Settings className="mr-2 h-4 w-4" /> Settings
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
          <LogOut className="mr-2 h-4 w-4" /> Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileDropdown;
