import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useClub } from '@/contexts/ClubContext';
import { useProfile } from '@/hooks/useProfile';
import { usePersonalStats } from '@/hooks/usePersonalStats';
import { useDelegatedPowers } from '@/hooks/useDelegatedPowers';
import { Navigate, useNavigate } from 'react-router-dom';
import { ChevronDown, Edit3, MoreHorizontal, Calendar, Users, MapPin, Award, CheckCircle, Clock, Tag, Shield } from 'lucide-react';
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


const roleLabelMap: Record<string, string> = {
  admin: 'Admin', president: 'President', vice_president: 'Vice President',
  secretary: 'Secretary', social_media_head: 'Social Media Head', member: 'Member'
};

const clubChartData = [
{ name: 'Event 1', attendance: 45, engagement: 40 },
{ name: 'Event 2', attendance: 80, engagement: 55 },
{ name: 'Event 3', attendance: 60, engagement: 70 },
{ name: 'Event 4', attendance: 75, engagement: 65 },
{ name: 'Event 5', attendance: 85, engagement: 78.5 },
{ name: 'Event 10', attendance: 50, engagement: 60 }];




type ViewMode = 'personal' | 'club';

const AdminDashboard = () => {
  const { user, loading } = useAuth();
  const { profile } = useProfile();
  const { activeClub, clubs } = useClub();
  const { stats: personalStats } = usePersonalStats();
  const { hasPower } = useDelegatedPowers();
  const [viewMode, setViewMode] = useState<ViewMode>('personal');
  const navigate = useNavigate();
  const greeting = useMemo(() => getRandomGreeting(), []);

  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);

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
  { label: 'Total Members:', value: '156', path: 'M0,25 C30,25 30,10 50,10 S70,20 100,5' },
  { label: 'Total Events:', value: '24', path: 'M0,25 C20,28 40,5 60,15 S80,5 100,10' },
  { label: 'Avg. Attendance Rate:', value: '78%', path: 'M0,20 C30,20 40,25 60,10 S90,5 100,5' },
  { label: 'Overall Growth %:', value: '+5%', isGrowth: true, path: 'M0,28 L30,20 L60,10 L100,2' }];


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
      <header className="relative z-10 flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
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
          {!isPersonal && activeClub && hasPower('create_event') &&
          <button
            type="button"
            onClick={() => navigate('/create-event')}
            className="text-primary-foreground text-sm font-medium px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2 transition-transform active:scale-95 gradient-gold">
            
              <Edit3 className="w-4 h-4" /> Create Event
            </button>
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
              <a href={profile.social_linkedin} target="_blank" rel="noopener noreferrer" className="hover:opacity-75 transition-opacity">
                  <svg className="w-5 h-5 fill-foreground" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                </a>
              }
              {profile?.social_twitter &&
              <a href={profile.social_twitter} target="_blank" rel="noopener noreferrer" className="hover:opacity-75 transition-opacity">
                  <svg className="w-5 h-5 fill-foreground" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" /></svg>
                </a>
              }
              {profile?.social_github &&
              <a href={profile.social_github} target="_blank" rel="noopener noreferrer" className="hover:opacity-75 transition-opacity">
                  <svg className="w-5 h-5 fill-foreground" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                </a>
              }
              {!profile?.social_linkedin && !profile?.social_twitter && !profile?.social_github &&
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
                  <ComposedChart data={clubChartData}>
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
                <div key={event.id} className="flex items-center gap-4 group cursor-pointer">
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

    </div>);

};

export default AdminDashboard;