import { useState, useCallback } from 'react';
import { ClubDetailOverlay } from './ClubDetailOverlay';
import { AttendanceHistoryModal } from './AttendanceHistoryModal';
import { useNavigate } from 'react-router-dom';
import { MobileProfileCard } from './MobileProfileCard';
import { MobileBottomNav } from './MobileBottomNav';
import {
  Users, Calendar, ChevronRight,
  Compass, ClipboardList, Settings2,
} from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';

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
  statsCards: { label: string; value: string; clickable?: boolean; clickAction?: string }[];
  upcomingEvents: any[];
  clubs: { club_id: string; club_name: string; role: string; logo_url?: string }[];
  attendanceRecords?: any[];
  onEventClick: (event: any) => void;
  canManageClub: boolean;
  canManageEvents: boolean;
  onManageEventsOpen: () => void;
  socialLinkedin?: string;
  socialInstagram?: string;
  socialGmail?: string;
  role?: string;
}

const roleLabelMap: Record<string, string> = {
  admin: 'Admin', president: 'President', vice_president: 'Vice President',
  secretary: 'Secretary', social_media_head: 'Social Media Head', member: 'Member',
};

export function MobileDashboardView({
  fullName, roleLabel, clubName, avatarUrl, programme, year, about,
  isPersonal, viewMode, setViewMode, statsCards, upcomingEvents, clubs,
  onEventClick, canManageClub, canManageEvents, onManageEventsOpen,
  socialLinkedin, socialInstagram, socialGmail, attendanceRecords = [], role,
}: MobileDashboardViewProps) {
  const navigate = useNavigate();
  const { profile } = useProfile();
  const { user } = useAuth();
  const [expandedClubId, setExpandedClubId] = useState<string | null>(null);
  const [activeStatModal, setActiveStatModal] = useState<string | null>(null);

  // Filter stats to only "Clubs Joined" and "Events Attended"
  const filteredStats = statsCards.filter(stat => {
    const label = stat.label.toLowerCase();
    return label.includes('club') || label.includes('events attended');
  }).slice(0, 2);

  const handleStatClick = useCallback((stat: typeof statsCards[0]) => {
    if (stat.clickable && stat.clickAction) {
      if (stat.clickAction === 'clubs_joined') {
        document.getElementById('mobile-my-clubs')?.scrollIntoView({ behavior: 'smooth' });
      } else if (stat.clickAction === 'events_attended' || stat.label.toLowerCase().includes('events attended')) {
        navigate('/attendance-history');
      } else {
        setActiveStatModal(stat.clickAction);
      }
    }
  }, [navigate]);

  // Light orange color shades for the two cards
  const cardColors = ['#FFF0DE', '#FFE4C8'];

  return (
    <>

      {/* Scrollable Content */}
      <div
        className="min-h-screen pb-24 overflow-x-hidden"
        style={{
          background: '#F4EFE7',
          paddingTop: '48px',
          scrollbarWidth: 'none',
        }}
      >
        <main className="px-5 py-4 space-y-6">
          {/* Dashboard Heading */}
          <h1
            className="text-xl font-black text-center"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#111' }}
          >
            Dashboard
          </h1>

          {/* Greeting */}
          <p
            className="text-xl text-center"
            style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#111' }}
          >
            Hi, <span className="font-black text-2xl">{fullName?.split(' ')[0] || 'there'}</span>
          </p>

          {/* Stats Row — only 2 cards, centered */}
          <div className="flex justify-center gap-4">
            {filteredStats.map((stat, i) => (
              <div
                key={i}
                className={`flex flex-col items-center justify-center text-center p-4 flex-1 max-w-[160px] ${stat.clickable ? 'cursor-pointer active:translate-x-[2px] active:translate-y-[2px] active:shadow-none' : ''}`}
                style={{
                  background: cardColors[i] || cardColors[0],
                  border: '2px solid #111',
                  boxShadow: '4px 4px 0px #111',
                  transition: 'all 0.15s',
                }}
                onClick={() => handleStatClick(stat)}
              >
                <span className="text-[10px] font-bold uppercase" style={{ color: '#6B7280', fontFamily: "'Space Grotesk', sans-serif" }}>
                  {stat.label.split(':')[0] || stat.label}
                </span>
                <span className="text-2xl font-black leading-none mt-1" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#111' }}>
                  {stat.value}
                </span>
              </div>
            ))}
          </div>

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
            socialGmail={socialGmail}
            role={role}
          />

          {/* Quick Actions */}
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {isPersonal && (
              <button
                onClick={() => navigate('/discover')}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase whitespace-nowrap active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                style={{
                  background: '#E98A3A',
                  color: '#111',
                  border: '2px solid #111',
                  boxShadow: '3px 3px 0px #111',
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                <Compass className="w-4 h-4" /> Discover Clubs
              </button>
            )}
            {!isPersonal && canManageClub && (
              <button
                onClick={() => navigate('/clubs')}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase whitespace-nowrap active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                style={{
                  background: '#E98A3A',
                  color: '#111',
                  border: '2px solid #111',
                  boxShadow: '3px 3px 0px #111',
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                <Settings2 className="w-4 h-4" /> Manage Club
              </button>
            )}
            {!isPersonal && canManageEvents && (
              <button
                onClick={() => navigate('/events')}
                className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold uppercase whitespace-nowrap active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                style={{
                  background: '#fff',
                  color: '#111',
                  border: '2px solid #111',
                  boxShadow: '3px 3px 0px #111',
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                <ClipboardList className="w-4 h-4" /> Manage Events
              </button>
            )}
          </div>

          {/* Upcoming Events */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3
                className="text-xl font-black uppercase"
                style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#111' }}
              >
                Upcoming Events
              </h3>
              <button
                onClick={() => navigate('/calendar')}
                className="text-[10px] font-bold uppercase px-2 py-1"
                style={{
                  background: '#111',
                  color: '#fff',
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
              >
                Calendar
              </button>
            </div>

            <div className="space-y-3">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.slice(0, 5).map(event => (
                  <div
                    key={event.id}
                    className="flex items-center gap-4 p-4 cursor-pointer active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                    style={{
                      background: '#fff',
                      border: '2px solid #111',
                      boxShadow: '4px 4px 0px #111',
                    }}
                    onClick={() => onEventClick(event)}
                  >
                    <div
                      className="flex-shrink-0 w-14 h-14 flex flex-col items-center justify-center"
                      style={{
                        border: '2px solid #111',
                        background: '#F6E1CF',
                      }}
                    >
                      <span className="text-lg font-black leading-none" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        {event.day}
                      </span>
                      <span className="text-[9px] font-bold uppercase" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        {event.month}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4
                        className="text-sm font-bold uppercase truncate"
                        style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#111' }}
                      >
                        {event.name}
                      </h4>
                      <p className="text-xs mt-0.5" style={{ color: '#6B7280', fontFamily: "'Space Grotesk', sans-serif" }}>
                        {event.club_name} • {event.time}
                      </p>
                    </div>
                    {event.attendance_given && (
                      <span
                        className="text-[9px] font-bold uppercase px-1.5 py-0.5"
                        style={{ background: '#E6F4EA', color: '#111', border: '1.5px solid #111' }}
                      >
                        ✓ Att.
                      </span>
                    )}
                    <ChevronRight className="w-5 h-5 shrink-0" style={{ color: '#111' }} />
                  </div>
                ))
              ) : (
                <div
                  className="p-8 text-center"
                  style={{
                    background: '#fff',
                    border: '2px solid #111',
                    boxShadow: '4px 4px 0px #111',
                  }}
                >
                  <Calendar className="w-8 h-8 mx-auto mb-2" style={{ color: '#6B7280' }} />
                  <p className="text-sm" style={{ color: '#6B7280', fontFamily: "'Space Grotesk', sans-serif" }}>
                    No upcoming events
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* My Clubs (personal mode) */}
          {isPersonal && clubs.length > 0 && (
            <section id="mobile-my-clubs" className="space-y-3">
              <h3
                className="text-xl font-black uppercase"
                style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#111' }}
              >
                My Clubs
              </h3>
              <div className="space-y-2">
                {clubs.map(club => (
                  <div
                    key={club.club_id}
                    className="flex items-center gap-3 p-4 cursor-pointer active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                    style={{
                      background: '#fff',
                      border: '2px solid #111',
                      boxShadow: '4px 4px 0px #111',
                    }}
                    onClick={() => setExpandedClubId(club.club_id)}
                  >
                    <div
                      className="w-10 h-10 flex items-center justify-center shrink-0"
                      style={{ border: '2px solid #111', background: '#F6E1CF' }}
                    >
                      {club.logo_url ? (
                        <img src={club.logo_url} alt={club.club_name} className="w-7 h-7 object-cover" />
                      ) : (
                        <Users className="w-4 h-4" style={{ color: '#111' }} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold truncate" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#111' }}>
                        {club.club_name}
                      </h4>
                      <p className="text-xs" style={{ color: '#6B7280', fontFamily: "'Space Grotesk', sans-serif" }}>
                        {roleLabelMap[club.role] ?? club.role}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 shrink-0" style={{ color: '#111' }} />
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>

        <MobileBottomNav />
        <ClubDetailOverlay clubId={expandedClubId} onClose={() => setExpandedClubId(null)} />
        <AttendanceHistoryModal
          open={activeStatModal === 'attendance_history' || activeStatModal === 'events_attended'}
          onClose={() => setActiveStatModal(null)}
          records={attendanceRecords}
        />
      </div>
    </>
  );
}
