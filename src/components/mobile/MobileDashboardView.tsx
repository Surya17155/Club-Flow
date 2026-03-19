import { useState } from 'react';
import { ClubDetailOverlay } from './ClubDetailOverlay';
import { AttendanceHistoryModal } from './AttendanceHistoryModal';
import { useNavigate } from 'react-router-dom';
import { MobileProfileCard } from './MobileProfileCard';
import { MobileBottomNav } from './MobileBottomNav';
import {
  Users,
  Calendar,
  CheckCircle,
  TrendingUp,
  Clock,
  ChevronRight,
  Compass,
  Edit3,
  ClipboardList,
  Settings2 } from
'lucide-react';
import { Badge } from '@/components/ui/badge';
import ProfileDropdown from '@/components/dashboard/ProfileDropdown';

interface MobileDashboardViewProps {
  fullName: string;
  roleLabel: string;
  clubName: string;
  avatarUrl?: string;
  programme?: string;
  year?: string;
  about?: string;
  isPersonal: boolean;
  viewMode: 'personal' | 'club';
  setViewMode: (m: 'personal' | 'club') => void;
  statsCards: {label: string;value: string;clickable?: boolean;clickAction?: string;}[];
  upcomingEvents: any[];
  clubs: {club_id: string;club_name: string;role: string;logo_url?: string;}[];
  attendanceRecords?: any[];
  onEventClick: (event: any) => void;
  canManageClub: boolean;
  canManageEvents: boolean;
  onManageEventsOpen: () => void;
  socialLinkedin?: string;
  socialInstagram?: string;
  socialGmail?: string;
}

const roleLabelMap: Record<string, string> = {
  admin: 'Admin',
  president: 'President',
  vice_president: 'Vice President',
  secretary: 'Secretary',
  social_media_head: 'Social Media Head',
  member: 'Member'
};

const statIcons = [Users, Calendar, CheckCircle, TrendingUp];

export function MobileDashboardView({
  fullName,
  roleLabel,
  clubName,
  avatarUrl,
  programme,
  year,
  about,
  isPersonal,
  viewMode,
  setViewMode,
  statsCards,
  upcomingEvents,
  clubs,
  onEventClick,
  canManageClub,
  canManageEvents,
  onManageEventsOpen,
  socialLinkedin,
  socialInstagram,
  socialGmail,
  attendanceRecords = [],
}: MobileDashboardViewProps) {
  const navigate = useNavigate();
  const [expandedClubId, setExpandedClubId] = useState<string | null>(null);
  const [attendanceHistoryOpen, setAttendanceHistoryOpen] = useState(false);

  return (
    <>
      {/* Fixed top elements — no header bar, elements pinned individually */}
      <div className="fixed top-0 left-0 right-0 z-40 px-4 pb-3 pointer-events-none" style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}>
        <div className="pointer-events-auto">
          {/* Top row: centered app name, profile avatar pinned right */}
          <div className="relative flex items-center justify-center mb-2">
            <h1 className="text-lg font-bold font-display text-foreground">IILM Club</h1>
            <div className="absolute right-0 top-1">
              <ProfileDropdown viewMode={viewMode} />
            </div>
          </div>

          {/* Greeting */}
          <p className="text-center text-base text-muted-foreground mb-4">
            Hi, <span className="font-semibold text-foreground">{fullName?.split(' ')[0] || 'there'}</span> 👋
          </p>

          {/* Mode toggle pill */}
          <div className="mt-2 mb-4">
            <div className="glass-card flex p-1 rounded-full max-w-[240px] mx-auto">
              <button
                onClick={() => setViewMode('personal')}
                className={`flex-1 py-2 px-4 rounded-full text-sm font-semibold transition-all duration-300 ${
                isPersonal ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground'}`
                }>
                Personal
              </button>
              <button
                onClick={() => setViewMode('club')}
                className={`flex-1 py-2 px-4 rounded-full text-sm font-semibold transition-all duration-300 ${
                !isPersonal ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground'}`
                }>
                Club
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="min-h-screen pb-20 dashboard-corner-gradient overflow-x-hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', paddingTop: '180px' }}>
        {/* Fixed background blobs */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <div
            className="absolute top-[-8%] left-[-8%] w-[300px] h-[300px] rounded-full mix-blend-multiply filter blur-[80px] opacity-60 animate-blob"
            style={{ backgroundColor: 'hsl(45 90% 85% / 0.9)' }} />
          
          <div
            className="absolute bottom-[20%] right-[-10%] w-[250px] h-[250px] rounded-full mix-blend-multiply filter blur-[80px] opacity-50 animate-blob animation-delay-2000"
            style={{ backgroundColor: 'hsl(25 80% 82% / 0.8)' }} />
          
        </div>

        <main className="px-4 py-4 space-y-5">
        {/* Profile Card */}
        <MobileProfileCard
            fullName={fullName}
            roleLabel={roleLabel}
            clubName={clubName}
            avatarUrl={avatarUrl}
            programme={programme}
            year={year}
            about={about}
            isPersonal={isPersonal}
            viewMode={viewMode}
            socialLinkedin={socialLinkedin}
            socialInstagram={socialInstagram}
            socialGmail={socialGmail} />
          

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-3">
          {statsCards.map((stat, i) => {
              const Icon = statIcons[i % statIcons.length];
              const isClickable = stat.clickable;
              return (
                <div
                  key={i}
                  className={`glass-card p-4 text-center ${isClickable ? 'cursor-pointer ring-primary/20 active:scale-[0.97] transition-transform' : ''}`}
                  onClick={() => { if (isClickable) setAttendanceHistoryOpen(true); }}
                >
                <Icon className="w-5 h-5 text-primary mx-auto mb-1.5" />
                <h3 className="text-2xl font-bold text-primary">{stat.value}</h3>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">
                  {stat.label.replace(':', '')}
                </p>
                {isClickable && (
                  <p className="text-[9px] text-primary font-medium mt-1">Tap to view →</p>
                )}
              </div>);

            })}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {isPersonal &&
            <button
              onClick={() => navigate('/discover')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full gradient-gold text-primary-foreground text-xs font-semibold shadow-gold whitespace-nowrap">
              
              <Compass className="w-3.5 h-3.5" /> Discover Clubs
            </button>
            }
          {!isPersonal && canManageClub &&
            <button
              onClick={() => navigate('/clubs')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-full gradient-gold text-primary-foreground text-xs font-semibold shadow-gold whitespace-nowrap">
              
              <Settings2 className="w-3.5 h-3.5" /> Manage Club
            </button>
            }
          {!isPersonal && canManageEvents &&
            <>
              <button
                onClick={() => navigate('/create-event')}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-full glass-card text-foreground text-xs font-semibold whitespace-nowrap">
                
                <Edit3 className="w-3.5 h-3.5" /> Create Event
              </button>
              <button
                onClick={onManageEventsOpen}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-full glass-card text-foreground text-xs font-semibold whitespace-nowrap">
                
                <ClipboardList className="w-3.5 h-3.5" /> Manage Events
              </button>
            </>
            }
        </div>

        {/* Upcoming Events */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold font-display text-foreground">Upcoming Events</h3>
            <button
                onClick={() => navigate('/calendar')}
                className="text-xs font-semibold text-primary flex items-center">
                
              View Full Calendar <ChevronRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>

          <div className="space-y-3">
            {upcomingEvents.length > 0 ?
              upcomingEvents.slice(0, 5).map((event) =>
              <div
                key={event.id}
                className="glass-card p-4 flex items-center gap-3 active:scale-[0.98] transition-transform cursor-pointer"
                onClick={() => onEventClick(event)}>
                
                  {/* Date badge */}
                  <div className="flex flex-col items-center justify-center w-12 h-14 rounded-2xl bg-primary/10 shrink-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                      {event.month}
                    </span>
                    <span className="text-xl font-bold leading-none text-primary">{event.day}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-bold text-foreground truncate">{event.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {event.club_name} • {event.time}
                    </p>
                  </div>

                  {event.attendance_given && (
                    <Badge variant="outline" className="text-[9px] bg-success/15 text-success border-success/20 shrink-0 px-1.5">
                      ✓ Att.
                    </Badge>
                  )}
                </div>
              ) :

              <div className="glass-card p-6 text-center">
                <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No upcoming events</p>
              </div>
              }
          </div>
        </section>

        {/* My Clubs (personal mode) */}
        {isPersonal && clubs.length > 0 &&
          <section>
            <h3 className="text-base font-bold font-display text-foreground mb-3">My Clubs</h3>
            <div className="space-y-2">
              {clubs.map((club) =>
              <div key={club.club_id} className="glass-card p-4 flex items-center gap-3 cursor-pointer active:scale-[0.98] transition-transform duration-150" onClick={() => setExpandedClubId(club.club_id)}>
                  <div className="w-10 h-10 rounded-xl bg-white/50 border border-border flex items-center justify-center shrink-0">
                    {club.logo_url ?
                  <img src={club.logo_url} alt={club.club_name} className="w-7 h-7 rounded object-cover" /> :

                  <Users className="w-4 h-4 text-primary" />
                  }
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-foreground truncate">{club.club_name}</h4>
                    <p className="text-xs text-muted-foreground">{roleLabelMap[club.role] ?? club.role}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </div>
              )}
            </div>
          </section>
          }
      </main>

      <MobileBottomNav />
      <ClubDetailOverlay clubId={expandedClubId} onClose={() => setExpandedClubId(null)} />
      <AttendanceHistoryModal
        open={attendanceHistoryOpen}
        onClose={() => setAttendanceHistoryOpen(false)}
        records={attendanceRecords}
      />
    </div>
    </>);

}