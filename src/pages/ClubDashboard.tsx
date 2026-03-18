import { useState, useEffect } from 'react';
import { Navigate, useNavigate, useSearchParams, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useClub } from '@/contexts/ClubContext';
import { useDelegatedPowers } from '@/hooks/useDelegatedPowers';
import { useClubStats } from '@/hooks/useClubStats';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { Edit3, Calendar, ChevronDown, ClipboardList, ChevronLeft, ChevronRight, Users, TrendingUp, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ProfileDropdown from '@/components/dashboard/ProfileDropdown';
import ManageEventsModal from '@/components/dashboard/ManageEventsModal';
import ClubProfileSidebar from '@/components/club-dashboard/ClubProfileSidebar';
import ClubStatsRow from '@/components/club-dashboard/ClubStatsRow';
import ClubUpcomingEvents from '@/components/club-dashboard/ClubUpcomingEvents';
import MemberManagement from '@/components/club-dashboard/MemberManagement';
import JoinRequestsPanel from '@/components/club-dashboard/JoinRequestsPanel';
import { Button } from '@/components/ui/button';
import { MobileClubProfileCard } from '@/components/mobile/MobileClubProfileCard';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getMiniCalendar(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) { weeks.push(week); week = []; }
  }
  if (week.length) { while (week.length < 7) week.push(null); weeks.push(week); }
  return weeks;
}

interface PostHolder {
  user_id: string;
  role: string;
  full_name: string;
}

const roleOrder = ['president', 'vice_president', 'secretary', 'social_media_head'];

const ClubDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { activeClub } = useClub();
  const { hasPower, isPresident } = useDelegatedPowers();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const { id: routeClubId } = useParams();

  const clubId = routeClubId || activeClub?.club_id;
  const [clubNameOverride, setClubNameOverride] = useState<string | null>(null);

  useEffect(() => {
    if (!routeClubId) { setClubNameOverride(null); return; }
    if (routeClubId === activeClub?.club_id) { setClubNameOverride(activeClub.club_name); return; }
    let cancelled = false;
    setClubNameOverride(null);
    supabase.from('clubs').select('name').eq('id', routeClubId).maybeSingle().then(({ data }) => {
      if (!cancelled && data) setClubNameOverride(data.name);
    });
    return () => { cancelled = true; };
  }, [routeClubId, activeClub?.club_id, activeClub?.club_name]);

  const { stats: clubStats } = useClubStats(clubId);
  const [manageEventsOpen, setManageEventsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'requests'>(
    searchParams.get('tab') === 'members' ? 'members' : searchParams.get('tab') === 'requests' ? 'requests' : 'overview'
  );

  const cameFromSuperAdmin = location.state?.from === 'super-admin';
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isRoleCheckComplete, setIsRoleCheckComplete] = useState(false);

  useEffect(() => {
    if (!user) return;
    const checkSuperAdmin = async () => {
      setIsRoleCheckComplete(false);
      const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin');
      setIsSuperAdmin(!!(data && data.length > 0));
      setIsRoleCheckComplete(true);
    };
    checkSuperAdmin();
  }, [user?.id]);

  // Club details
  const [clubDetails, setClubDetails] = useState<{ about: string | null; logo_url: string | null; social_instagram: string | null; social_linkedin: string | null }>({ about: null, logo_url: null, social_instagram: null, social_linkedin: null });
  useEffect(() => {
    if (!clubId) return;
    supabase.from('clubs').select('about, logo_url, social_instagram, social_linkedin').eq('id', clubId).maybeSingle().then(({ data }: any) => {
      if (data) setClubDetails(data);
    });
  }, [clubId]);

  // Post holders for mobile card
  const [postHolders, setPostHolders] = useState<PostHolder[]>([]);
  useEffect(() => {
    if (!clubId) return;
    const fetchPostHolders = async () => {
      const { data: membersData } = await supabase
        .from('club_members')
        .select('user_id, role')
        .eq('club_id', clubId)
        .in('role', roleOrder as any);
      if (!membersData || membersData.length === 0) { setPostHolders([]); return; }
      const userIds = membersData.map(m => m.user_id);
      const { data: profilesData } = await supabase.from('profiles').select('user_id, full_name').in('user_id', userIds);
      const profileMap = new Map((profilesData ?? []).map(p => [p.user_id, p]));
      setPostHolders(
        membersData
          .map(m => ({ user_id: m.user_id, role: m.role, full_name: profileMap.get(m.user_id)?.full_name ?? 'Unknown' }))
          .sort((a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role))
      );
    };
    fetchPostHolders();
  }, [clubId]);

  // Calendar
  const now = new Date();
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());
  const weeks = getMiniCalendar(calYear, calMonth);
  const monthName = new Date(calYear, calMonth).toLocaleString('default', { month: 'long' });

  const [calendarEvents, setCalendarEvents] = useState<Record<string, { name: string; color: string }[]>>({});
  useEffect(() => {
    if (!clubId) return;
    const start = new Date(calYear, calMonth, 1);
    const end = new Date(calYear, calMonth + 1, 0, 23, 59, 59);
    supabase.from('events').select('id, name, event_date, category').eq('club_id', clubId)
      .gte('event_date', start.toISOString()).lte('event_date', end.toISOString())
      .order('event_date', { ascending: true }).then(({ data }) => {
        const map: Record<string, { name: string; color: string }[]> = {};
        (data ?? []).forEach(e => {
          const d = new Date(e.event_date);
          const key = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          const color = e.category === 'technical' ? 'bg-primary' : e.category === 'cultural' ? 'bg-destructive' : 'bg-accent';
          if (!map[key]) map[key] = [];
          map[key].push({ name: e.name, color });
        });
        setCalendarEvents(map);
      });
  }, [clubId, calMonth, calYear]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fdfbf7' }}>
        <div className="w-8 h-8 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  if (!isRoleCheckComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fdfbf7' }}>
        <div className="w-8 h-8 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const hasAccess = isPresident || hasPower('manage_club') || isSuperAdmin;
  if ((!hasAccess && !isSuperAdmin) || !clubId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#fdfbf7' }}>
        <div className="glass-card p-8 text-center max-w-md">
          <h2 className="text-xl font-bold text-foreground mb-2">Access Restricted</h2>
          <p className="text-sm text-muted-foreground mb-4">Only the club president or users with official dashboard access can view this page.</p>
          <Button onClick={() => navigate('/dashboard')} className="rounded-full">Go to Dashboard</Button>
        </div>
      </div>
    );
  }

  const clubName = routeClubId
    ? (routeClubId === activeClub?.club_id ? activeClub?.club_name : clubNameOverride) || 'Club'
    : activeClub?.club_name || clubNameOverride || 'Club';

  const statsItems = [
    { label: 'Total Members:', value: String(clubStats.totalMembers), path: 'M0,25 C30,25 30,10 50,10 S70,20 100,5' },
    { label: 'All-Time Attendance:', value: String(clubStats.chartData.reduce((s, d) => s + d.attendance, 0)), path: 'M0,25 C20,28 40,5 60,15 S80,5 100,10' },
    { label: 'Engagement Index:', value: `${clubStats.avgAttendanceRate}/100`, path: 'M0,20 C30,20 40,25 60,10 S90,5 100,5' },
  ];

  const statIcons = [Users, CheckCircle, TrendingUp];

  // ─── MOBILE LAYOUT ─────────────────────────────────────────
  if (isMobile) {
    return (
      <div
        className="min-h-screen pb-20 dashboard-corner-gradient overflow-x-hidden"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style>{`::-webkit-scrollbar { display: none; }`}</style>

        {/* Background blobs */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute top-[-8%] left-[-8%] w-[300px] h-[300px] rounded-full mix-blend-multiply filter blur-[80px] opacity-60 animate-blob" style={{ backgroundColor: 'hsl(45 90% 85% / 0.9)' }} />
          <div className="absolute bottom-[20%] right-[-10%] w-[250px] h-[250px] rounded-full mix-blend-multiply filter blur-[80px] opacity-50 animate-blob animation-delay-2000" style={{ backgroundColor: 'hsl(25 80% 82% / 0.8)' }} />
        </div>

        {/* Fixed header — no background, elements float on app bg */}
        <header className="fixed top-0 left-0 right-0 z-40 px-4 pt-4 pb-3 safe-area-top">
          {/* Top row: back button, app name center, profile avatar right */}
          <div className="flex items-center justify-between mb-2">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full w-9 h-9"
              onClick={() => navigate(cameFromSuperAdmin ? '/super-admin' : '/admin')}
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-lg font-bold font-display text-foreground">IILM Club</h1>
            <ProfileDropdown viewMode="club" />
          </div>

          {/* Tab toggle pill */}
          <div className="glass-card flex p-1 rounded-full max-w-[280px] mx-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-2 px-3 rounded-full text-xs font-semibold transition-all duration-300 ${activeTab === 'overview' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground'}`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`flex-1 py-2 px-3 rounded-full text-xs font-semibold transition-all duration-300 ${activeTab === 'members' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground'}`}
            >
              Members
            </button>
            {isPresident && (
              <button
                onClick={() => setActiveTab('requests')}
                className={`flex-1 py-2 px-3 rounded-full text-xs font-semibold transition-all duration-300 ${activeTab === 'requests' ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground'}`}
              >
                Requests
              </button>
            )}
          </div>
        </header>

        {/* Spacer for fixed header */}
        <div className={`${isPresident ? 'h-[130px]' : 'h-[120px]'} safe-area-top`} />

        <main className="px-4 py-4 space-y-5">
          {activeTab === 'overview' ? (
            <>
              {/* Club Profile Card */}
              <MobileClubProfileCard
                clubName={clubName}
                clubLogo={clubDetails.logo_url}
                clubAbout={clubDetails.about}
                postHolders={postHolders}
                socialInstagram={clubDetails.social_instagram}
                socialLinkedin={clubDetails.social_linkedin}
              />

              {/* Stats Row */}
              <div className="grid grid-cols-2 gap-3">
                {statsItems.map((stat, i) => {
                  const Icon = statIcons[i % statIcons.length];
                  return (
                    <div key={i} className="glass-card p-4 text-center">
                      <Icon className="w-5 h-5 text-primary mx-auto mb-1.5" />
                      <h3 className="text-2xl font-bold text-primary">{stat.value}</h3>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">
                        {stat.label.replace(':', '')}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Quick Actions */}
              {hasPower('create_event') && (
                <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                  <button
                    onClick={() => navigate('/create-event')}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-full gradient-gold text-primary-foreground text-xs font-semibold shadow-gold whitespace-nowrap"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Create Event
                  </button>
                  <button
                    onClick={() => setManageEventsOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-full glass-card text-foreground text-xs font-semibold whitespace-nowrap"
                  >
                    <ClipboardList className="w-3.5 h-3.5" /> Manage Events
                  </button>
                </div>
              )}

              {/* Upcoming Events */}
              <section>
                <h3 className="text-base font-bold font-display text-foreground mb-3">Upcoming Events</h3>
                <ClubUpcomingEvents clubId={clubId} clubLogo={clubDetails.logo_url} clubName={clubName} />
              </section>

              {/* Participation Chart */}
              <section className="glass-card p-4">
                <h3 className="text-sm font-bold text-foreground font-display mb-3">Participation Analytics</h3>
                {clubStats.chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={clubStats.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                      <Line type="monotone" dataKey="attendance" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground italic text-center py-6">No event data yet</p>
                )}
              </section>
            </>
          ) : activeTab === 'members' ? (
            <MemberManagement clubId={clubId} />
          ) : (
            <div className="glass-card p-4">
              <h2 className="text-base font-bold text-foreground mb-3">Pending Join Requests</h2>
              <JoinRequestsPanel clubId={clubId} />
            </div>
          )}
        </main>

        <MobileBottomNav />
        <ManageEventsModal open={manageEventsOpen} onOpenChange={setManageEventsOpen} />
      </div>
    );
  }

  // ─── DESKTOP LAYOUT (unchanged) ────────────────────────────
  return (
    <div className="min-h-screen relative antialiased p-6 md:p-8 dashboard-corner-gradient text-foreground">
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-8%] left-[-8%] w-[550px] h-[550px] rounded-full mix-blend-multiply filter blur-[100px] opacity-80 animate-blob" style={{ backgroundColor: 'hsl(45 90% 85% / 0.9)' }} />
        <div className="absolute top-[-5%] right-[-5%] w-[450px] h-[450px] rounded-full mix-blend-multiply filter blur-[90px] opacity-70 animate-blob animation-delay-2000" style={{ backgroundColor: 'hsl(25 80% 82% / 0.8)' }} />
        <div className="absolute bottom-[-8%] left-[-5%] w-[500px] h-[500px] rounded-full mix-blend-multiply filter blur-[100px] opacity-60 animate-blob animation-delay-4000" style={{ backgroundColor: 'hsl(35 75% 78% / 0.6)' }} />
      </div>

      {/* Header */}
      <header className="relative z-20 flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate(cameFromSuperAdmin ? '/super-admin' : '/admin')}>
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl md:text-2xl font-bold font-display text-foreground">
            {clubName} <span className="text-primary">Official</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="inline-flex items-center rounded-[20px] p-1 bg-muted">
            <button onClick={() => setActiveTab('overview')} className={`px-3 sm:px-4 py-1.5 rounded-2xl text-sm font-semibold transition-all ${activeTab === 'overview' ? 'shadow-sm bg-white text-primary' : 'text-muted-foreground'}`}>Overview</button>
            <button onClick={() => setActiveTab('members')} className={`px-3 sm:px-4 py-1.5 rounded-2xl text-sm font-semibold transition-all ${activeTab === 'members' ? 'shadow-sm bg-white text-primary' : 'text-muted-foreground'}`}>Members</button>
            {isPresident && (
              <button onClick={() => setActiveTab('requests')} className={`px-3 sm:px-4 py-1.5 rounded-2xl text-sm font-semibold transition-all ${activeTab === 'requests' ? 'shadow-sm bg-white text-primary' : 'text-muted-foreground'}`}>Requests</button>
            )}
          </div>

          {hasPower('create_event') && (
            <DropdownMenu>
              <DropdownMenuTrigger className="text-primary-foreground text-sm font-medium px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2 transition-transform active:scale-95 gradient-gold">
                <Calendar className="w-4 h-4" /> Events <ChevronDown className="w-3 h-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onSelect={() => navigate('/create-event')}><Edit3 className="mr-2 h-4 w-4" /> Create Event</DropdownMenuItem>
                <DropdownMenuItem onSelect={() => setManageEventsOpen(true)}><ClipboardList className="mr-2 h-4 w-4" /> Manage Events</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          <ProfileDropdown viewMode="club" />
        </div>
      </header>

      {activeTab === 'overview' ? (
        <>
          <section className="mb-6"><ClubStatsRow stats={statsItems} /></section>
          <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-3">
              <ClubProfileSidebar clubId={clubId} clubName={clubName} clubAbout={clubDetails.about} clubLogo={clubDetails.logo_url} socialInstagram={clubDetails.social_instagram} socialLinkedin={clubDetails.social_linkedin} />
            </div>
            <div className="lg:col-span-6 space-y-6">
              <div className="glass-card p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-foreground font-display">Monthly Calendar</h3>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }} className="p-1 rounded hover:bg-muted"><ChevronLeft className="w-4 h-4" /></button>
                    <span className="text-sm font-medium min-w-[120px] text-center">{monthName} {calYear}</span>
                    <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }} className="p-1 rounded hover:bg-muted"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {DAYS.map(d => (<div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>))}
                  {weeks.flat().map((day, i) => {
                    const dateKey = day ? `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
                    const events = day ? calendarEvents[dateKey] || [] : [];
                    const isToday = day === now.getDate() && calMonth === now.getMonth() && calYear === now.getFullYear();
                    return (
                      <div key={i} className={`min-h-[60px] p-1 rounded-lg text-xs border ${isToday ? 'border-primary/40 bg-primary/5' : 'border-transparent'} ${day ? 'hover:border-border hover:bg-muted/30 cursor-pointer' : ''}`}>
                        {day && (<><span className={`${isToday ? 'text-primary font-bold' : 'text-muted-foreground'}`}>{day}</span>{events.map((ev, j) => (<div key={j} className={`mt-0.5 px-1 py-0.5 rounded text-[10px] text-primary-foreground truncate ${ev.color}`}>{ev.name}</div>))}</>)}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="glass-card p-6">
                <h3 className="text-lg font-bold text-foreground font-display mb-4">Participation Analytics</h3>
                {clubStats.chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={clubStats.chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Line type="monotone" dataKey="attendance" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground italic text-center py-8">No event data yet</p>
                )}
              </div>
            </div>
            <div className="lg:col-span-3"><ClubUpcomingEvents clubId={clubId} clubLogo={clubDetails.logo_url} clubName={clubName} /></div>
          </main>
        </>
      ) : activeTab === 'members' ? (
        <MemberManagement clubId={clubId} />
      ) : (
        <div className="glass-card p-6">
          <h2 className="text-lg font-bold text-foreground mb-4">Pending Join Requests</h2>
          <JoinRequestsPanel clubId={clubId} />
        </div>
      )}

      <ManageEventsModal open={manageEventsOpen} onOpenChange={setManageEventsOpen} />
    </div>
  );
};

export default ClubDashboard;
