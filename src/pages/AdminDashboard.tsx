import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useClub } from '@/contexts/ClubContext';
import { useProfile } from '@/hooks/useProfile';
import { usePersonalStats } from '@/hooks/usePersonalStats';
import { useClubStats } from '@/hooks/useClubStats';
import { useDelegatedPowers } from '@/hooks/useDelegatedPowers';
import { Navigate, useNavigate } from 'react-router-dom';
import { ChevronDown, Edit3, MoreHorizontal, Calendar, Users, MapPin, Award, CheckCircle, Clock, Tag, Shield, ClipboardList } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

const greetings = ['Hello', 'Hi', 'Hey', 'Yo', 'Welcome', "What's up", 'Howdy', 'Namaste'];
const getRandomGreeting = () => greetings[Math.floor(Math.random() * greetings.length)];
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from
'recharts';
import ProfileDropdown from '@/components/dashboard/ProfileDropdown';
import EventCalendar from '@/components/dashboard/EventCalendar';
import ManageEventsModal from '@/components/dashboard/ManageEventsModal';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FloatingChatWidget } from '@/components/chat/FloatingChatWidget';

const roleLabelMap: Record<string, string> = {
  admin: 'Admin', president: 'President', vice_president: 'Vice President',
  secretary: 'Secretary', social_media_head: 'Social Media Head', member: 'Member'
};





type ViewMode = 'personal' | 'club';

const AdminDashboard = () => {
  const { user, loading } = useAuth();
  const { profile } = useProfile();
  const { activeClub, clubs } = useClub();
  const { stats: personalStats } = usePersonalStats();
  const { stats: clubStats } = useClubStats(activeClub?.club_id);
  const { hasPower } = useDelegatedPowers();
  const [viewMode, setViewMode] = useState<ViewMode>('personal');
  const navigate = useNavigate();
  const greeting = useMemo(() => getRandomGreeting(), []);

  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [manageEventsOpen, setManageEventsOpen] = useState(false);

  useEffect(() => {
    const fetchUpcoming = async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from('events')
        .select('id, name, event_date, end_date, description, event_type, category, access_type, clubs(name)')
        .gte('event_date', now)
        .order('event_date', { ascending: true })
        .limit(10);
      if (data) {
        setUpcomingEvents(data.map((e: any) => {
          const d = new Date(e.event_date);
          return {
            ...e,
            month: d.toLocaleString('default', { month: 'short' }).toUpperCase(),
            day: String(d.getDate()),
            club_name: e.clubs?.name || '',
            full_date: d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
            time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          };
        }));
      }
    };
    fetchUpcoming();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fdfbf7' }}>
        <div className="w-8 h-8 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>);

  }

  if (!user) return <Navigate to="/" replace />;

  const fullName = profile?.full_name || user?.user_metadata?.full_name || 'Student';
  const programme = profile?.programme || user?.user_metadata?.programme || '';
  const semester = profile?.semester || user?.user_metadata?.semester || '';
  const year = profile?.year || user?.user_metadata?.year || '';
  const about = profile?.about || '';
  const initials = fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  const clubName = activeClub?.club_name || 'No Club Selected';
  const roleLabel = activeClub ? roleLabelMap[activeClub.role] ?? activeClub.role : 'Member';

  const isPersonal = viewMode === 'personal';

  const statsCards = isPersonal ?
  [
  { label: 'Clubs Joined:', value: String(personalStats.clubCount), path: 'M0,25 C30,25 30,10 50,10 S70,20 100,5' },
  { label: 'Events Attended:', value: String(personalStats.eventsAttended), path: 'M0,25 C20,28 40,5 60,15 S80,5 100,10' },
  { label: 'Total Events:', value: String(personalStats.totalEvents), path: 'M0,20 C30,20 40,25 60,10 S90,5 100,5' },
  { label: 'Attendance Rate:', value: `${personalStats.attendanceRate}%`, path: 'M0,28 L30,20 L60,10 L100,2' }] :

  [
  { label: 'Total Members:', value: String(clubStats.totalMembers), path: 'M0,25 C30,25 30,10 50,10 S70,20 100,5' },
  { label: 'Total Events:', value: String(clubStats.totalEvents), path: 'M0,25 C20,28 40,5 60,15 S80,5 100,10' },
  { label: 'Avg. Attendance Rate:', value: `${clubStats.avgAttendanceRate}%`, path: 'M0,20 C30,20 40,25 60,10 S90,5 100,5' },
  { label: 'Events with Data:', value: String(clubStats.chartData.length), path: 'M0,28 L30,20 L60,10 L100,2' }];


  return (
    <div className="min-h-screen relative antialiased p-6 md:p-8 dashboard-corner-gradient text-foreground">
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-8%] left-[-8%] w-[550px] h-[550px] rounded-full mix-blend-multiply filter blur-[100px] opacity-80 animate-blob" style={{ backgroundColor: 'hsl(45 90% 85% / 0.9)' }} />
        <div className="absolute top-[-5%] right-[-5%] w-[450px] h-[450px] rounded-full mix-blend-multiply filter blur-[90px] opacity-70 animate-blob animation-delay-2000" style={{ backgroundColor: 'hsl(25 80% 82% / 0.8)' }} />
        <div className="absolute bottom-[-8%] left-[-5%] w-[500px] h-[500px] rounded-full mix-blend-multiply filter blur-[100px] opacity-60 animate-blob animation-delay-4000" style={{ backgroundColor: 'hsl(35 75% 78% / 0.6)' }} />
        <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob" style={{ backgroundColor: 'hsl(28 70% 70% / 0.45)', animationDelay: '3s' }} />
        <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] rounded-full filter blur-[120px] opacity-30" style={{ backgroundColor: 'hsl(40 80% 88%)' }} />
      </div>

      {/* Header */}
      <header className="relative z-20 flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-xl md:text-2xl font-bold font-display text-foreground">
          {greeting}, <span className="text-primary">{fullName.split(' ')[0]}</span> 👋
        </h1>

        {/* Functional Toggle */}
        <div className="inline-flex items-center rounded-[20px] p-1 bg-muted">
          <button
            onClick={() => setViewMode('personal')}
            className={`px-4 py-1.5 rounded-2xl text-sm font-semibold transition-all ${
            isPersonal ? 'shadow-sm bg-white text-primary' : 'text-muted-foreground'}`
            }>
            
            Personal
          </button>
          <button
            onClick={() => setViewMode('club')}
            className={`px-4 py-1.5 rounded-2xl text-sm font-semibold transition-all ${
            !isPersonal ? 'shadow-sm bg-white text-primary' : 'text-muted-foreground'}`
            }>
            
            Club
          </button>
        </div>

        <div className="flex items-center gap-4">
          {!isPersonal && activeClub && (activeClub.role === 'president' || activeClub.role === 'admin') && (
            <button
              onClick={() => navigate('/clubs?tab=members')}
              className="text-primary-foreground text-sm font-medium px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2 transition-transform active:scale-95 gradient-gold"
            >
              <Users className="w-4 h-4" /> Manage Club
            </button>
          )}
          {!isPersonal && activeClub && hasPower('create_event') &&
          <DropdownMenu>
            <DropdownMenuTrigger className="text-primary-foreground text-sm font-medium px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2 transition-transform active:scale-95 gradient-gold">
              <Calendar className="w-4 h-4" /> Events <ChevronDown className="w-3 h-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onSelect={() => navigate('/create-event')}>
                <Edit3 className="mr-2 h-4 w-4" /> Create Event
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setManageEventsOpen(true)}>
                <ClipboardList className="mr-2 h-4 w-4" /> Manage Events
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          }
          <ProfileDropdown viewMode={viewMode} />
        </div>
      </header>

      {/* Stats Row */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat, i) =>
        <div key={i} className="glass-card p-6 flex flex-col justify-between h-32 relative overflow-hidden group hover:bg-white/50 transition-colors">
            <div>
              <p className="text-sm mb-1 text-muted-foreground">{stat.label}</p>
              <div className="flex items-center gap-2">
                <h3 className="text-3xl font-bold text-foreground">{stat.value}</h3>
                {'isGrowth' in stat && stat.isGrowth &&
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="hsl(var(--success))" strokeWidth={3}>
                    <path d="M5 15l7-7 7 7" />
                  </svg>
              }
              </div>
            </div>
            <svg className="absolute bottom-4 right-4 w-24 h-12 text-primary/50" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 100 30">
              <path d={stat.path} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </section>

      {/* Main grid */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Profile */}
        <div className="lg:col-span-3 h-full">
          <div className="glass-card p-6 h-full flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div className="absolute inset-0 rounded-full blur-xl transform scale-110" style={{ backgroundColor: 'hsl(30 70% 80% / 0.5)' }} />
              {profile?.avatar_url ?
              <img src={profile.avatar_url} alt={fullName} className="w-[120px] h-[120px] rounded-full border-4 border-white shadow-lg relative z-10 object-cover" /> :

              <div className="w-[120px] h-[120px] rounded-full border-4 border-white shadow-lg relative z-10 flex items-center justify-center text-3xl font-bold bg-primary text-primary-foreground">
                  {initials}
                </div>
              }
            </div>
            <h2 className="text-xl font-bold text-foreground">{fullName}</h2>

            {isPersonal ?
            <span className="mt-1.5 mb-1 inline-block px-3 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: 'hsl(200 60% 95%)', color: 'hsl(200 60% 40%)' }}>
                Student
              </span> :

            <>
                <span className="mt-1.5 mb-1 inline-block px-3 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: 'hsl(270 60% 95%)', color: 'hsl(270 60% 45%)' }}>
                  {roleLabel}
                </span>
                <p className="text-sm font-medium mb-6 text-muted-foreground">{clubName}</p>
              </>
            }

            {/* About section */}
            <div className="w-full text-left rounded-xl p-4 mb-6 bg-white/30">
              <h4 className="font-bold mb-3 text-foreground">About</h4>
              <div className="space-y-2 text-sm">
                {programme &&
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Program:</span>
                    <span className="font-medium text-foreground">{programme}</span>
                  </div>
                }
                {year &&
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Year:</span>
                    <span className="font-medium text-foreground">{year}</span>
                  </div>
                }
              </div>
            </div>

            {/* Personal mode: show club memberships */}
            {isPersonal && clubs.length > 0 &&
            <div className="w-full text-left rounded-xl p-4 mb-6 bg-white/30">
                <h4 className="font-bold mb-3 text-foreground">My Clubs</h4>
                <div className="space-y-2">
                  {clubs.map((club) =>
                <div key={club.club_id} className="flex justify-between items-center text-sm">
                      <span className="font-medium text-foreground">{club.club_name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                        {roleLabelMap[club.role] ?? club.role}
                      </span>
                    </div>
                )}
                </div>
              </div>
            }

            {/* Social icons */}
            <div className="mt-auto flex gap-4 justify-center mt-5">
              {profile?.social_linkedin &&
              <a href={profile.social_linkedin.startsWith('http') ? profile.social_linkedin : `https://${profile.social_linkedin}`} target="_blank" rel="noopener noreferrer" className="hover:opacity-75 transition-opacity">
                  <svg className="w-5 h-5 fill-foreground" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                </a>
              }
              {profile?.social_instagram &&
              <a href={profile.social_instagram.startsWith('http') ? profile.social_instagram : `https://${profile.social_instagram}`} target="_blank" rel="noopener noreferrer" className="hover:opacity-75 transition-opacity">
                  <svg className="w-5 h-5 fill-foreground" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                </a>
              }
              {profile?.social_gmail &&
              <a href={`mailto:${profile.social_gmail}`} className="hover:opacity-75 transition-opacity">
                  <svg className="w-5 h-5 fill-foreground" viewBox="0 0 24 24"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" /></svg>
                </a>
              }
              {!profile?.social_linkedin && !profile?.social_instagram && !profile?.social_gmail &&
              <span className="text-xs text-muted-foreground italic">Add social links in your profile</span>
              }
            </div>
          </div>
        </div>

        {/* MIDDLE + RIGHT: Calendar/Chart + Events */}
        <div className="lg:col-span-9 flex flex-col gap-6">
          {isPersonal ? (
          /* Personal Mode: Calendar (full width) + Memberships below */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <EventCalendar mode="personal" />
              </div>
              <div className="glass-card p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg text-foreground">My Clubs</h3>
                  <MoreHorizontal className="w-5 h-5 cursor-pointer text-muted-foreground" />
                </div>
                <div className="space-y-4">
                  {clubs.length > 0 ? clubs.map((club) =>
                <div key={club.club_id} className="flex items-center gap-4 group cursor-pointer">
                      <div className="rounded-lg shadow-sm w-12 h-12 flex items-center justify-center border border-border bg-white group-hover:shadow-md transition-shadow">
                        {club.logo_url ?
                    <img src={club.logo_url} alt={club.club_name} className="w-8 h-8 rounded object-cover" /> :

                    <Award className="w-5 h-5 text-primary" />
                    }
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground">{club.club_name}</h4>
                        <span className="text-xs text-muted-foreground">
                          {roleLabelMap[club.role] ?? club.role}
                        </span>
                      </div>
                    </div>
                ) :
                <p className="text-sm text-muted-foreground italic">No club memberships yet</p>
                }
                </div>

                {/* Attendance chart below memberships */}
                {personalStats.recentAttendance.length > 0 &&
              <div className="mt-8">
                    <h4 className="font-bold text-sm text-foreground mb-3">Recent Attendance</h4>
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart data={personalStats.recentAttendance}>
                        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#6b7280' }} />
                        <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} domain={[0, 100]} hide />
                        <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: '12px', fontSize: '11px' }} />
                        <defs>
                          <linearGradient id="personalBarGrad" x1="0" y1="1" x2="0" y2="0">
                            <stop offset="0%" stopColor="#7eb8da" />
                            <stop offset="100%" stopColor="#a8d4ea" />
                          </linearGradient>
                        </defs>
                        <Bar dataKey="attended" fill="url(#personalBarGrad)" radius={[6, 6, 0, 0]} name="Attended" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
              }
              </div>
            </div>) : (

          /* Club Mode: Analytics chart + Upcoming Events */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 glass-card p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg text-foreground">Attendance Analytics</h3>
                  <div className="glass-input px-3 py-1 rounded-lg text-xs flex items-center gap-1 cursor-pointer text-muted-foreground">
                    Last 30 Days <ChevronDown className="w-3 h-3" />
                  </div>
                </div>
                <div className="flex justify-between items-center text-xs mb-6">
                  <span className="font-semibold text-muted-foreground">Event Attendance &amp; Engagement</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <span className="text-muted-foreground">Engagement Score</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={clubStats.chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} domain={[0, 100]} />
                    <Tooltip contentStyle={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.6)', borderRadius: '12px', fontSize: '12px' }} />
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="1" x2="0" y2="0">
                        <stop offset="0%" stopColor="#dfa579" />
                        <stop offset="100%" stopColor="#eacda3" />
                      </linearGradient>
                    </defs>
                    <Bar dataKey="attendance" fill="url(#barGradient)" radius={[8, 8, 0, 0]} name="Attendance %" />
                    <Line type="monotone" dataKey="engagement" stroke="#bf7e54" strokeWidth={2.5} dot={{ fill: '#fdfbf7', stroke: '#bf7e54', strokeWidth: 2, r: 5 }} name="Engagement Score" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              <div className="glass-card p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-bold text-lg text-foreground">Upcoming Events</h3>
                  <MoreHorizontal className="w-5 h-5 cursor-pointer text-muted-foreground" />
                </div>
                <div className="space-y-4">
                  {upcomingEvents.length > 0 ? upcomingEvents.map((event) =>
                <div key={event.id} className="flex items-center gap-4 group cursor-pointer" onClick={() => { setSelectedEvent(event); setEventDialogOpen(true); }}>
                      <div className="rounded-lg shadow-sm w-12 h-12 flex flex-col items-center justify-center border border-border bg-white group-hover:shadow-md transition-shadow">
                        <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">{event.month}</span>
                        <span className="text-lg font-bold leading-none text-foreground">{event.day}</span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground">{event.name}</h4>
                        <span className="text-xs text-muted-foreground">{event.club_name}</span>
                      </div>
                      <div className="ml-auto text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                      </div>
                    </div>
                ) : <p className="text-sm text-muted-foreground italic">No upcoming events</p>}
                </div>
              </div>
            </div>)
          }
        </div>
      </main>

      {/* Event Detail Dialog */}
      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{selectedEvent?.name}</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 text-primary" />
                <span>{selectedEvent.full_date}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4 text-primary" />
                <span>{selectedEvent.time}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4 text-primary" />
                <span>{selectedEvent.club_name}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedEvent.event_type && (
                  <Badge variant="secondary" className="text-xs">
                    <Tag className="w-3 h-3 mr-1" />{selectedEvent.event_type}
                  </Badge>
                )}
                {selectedEvent.category && (
                  <Badge variant="outline" className="text-xs">{selectedEvent.category}</Badge>
                )}
                {selectedEvent.access_type && (
                  <Badge variant="outline" className="text-xs">
                    <Shield className="w-3 h-3 mr-1" />{selectedEvent.access_type}
                  </Badge>
                )}
              </div>
              {selectedEvent.description && (
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Description</h4>
                  <p className="text-sm text-foreground/80 leading-relaxed">{selectedEvent.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <ManageEventsModal open={manageEventsOpen} onOpenChange={setManageEventsOpen} />
      <FloatingChatWidget visible={viewMode === 'club'} activeClubId={activeClub?.club_id} />
    </div>);

};

export default AdminDashboard;