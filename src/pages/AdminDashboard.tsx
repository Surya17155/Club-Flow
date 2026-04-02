import { useState, useMemo, useEffect } from "react";
import VerifiedBadge, { getRoleBadgeVariant } from "@/components/ui/VerifiedBadge";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { useClub } from "@/contexts/ClubContext";
import { useProfile } from "@/hooks/useProfile";
import { usePersonalStats } from "@/hooks/usePersonalStats";
import { useClubStats } from "@/hooks/useClubStats";
import { useDelegatedPowers } from "@/hooks/useDelegatedPowers";
import { Navigate, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  Edit3,
  MoreHorizontal,
  Calendar,
  Users,
  MapPin,
  Award,
  CheckCircle,
  Clock,
  Tag,
  Shield,
  ClipboardList,
  Compass,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

const greetings = ["Hello", "Hi", "Hey", "Welcome", "What's up"];
const getRandomGreeting = () => greetings[Math.floor(Math.random() * greetings.length)];
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Line,
  ComposedChart,
} from "recharts";
import ProfileDropdown from "@/components/dashboard/ProfileDropdown";
import EventCalendar from "@/components/dashboard/EventCalendar";
import ManageEventsModal from "@/components/dashboard/ManageEventsModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { MobileDashboardView } from "@/components/mobile/MobileDashboardView";
import { AttendanceHistoryModal } from "@/components/mobile/AttendanceHistoryModal";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";

const roleLabelMap: Record<string, string> = {
  admin: "Admin",
  president: "President",
  vice_president: "Vice President",
  secretary: "Secretary",
  social_media_head: "Social Media Head",
  member: "Member",
};

type ViewMode = "personal" | "club";

const AdminDashboard = () => {
  const { user, loading } = useAuth();
  const { profile } = useProfile();
  const { activeClub, clubs } = useClub();
  const { stats: personalStats } = usePersonalStats();
  const { stats: clubStats } = useClubStats(activeClub?.club_id);
  const { hasPower } = useDelegatedPowers();
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    return (localStorage.getItem('dashboardViewMode') as ViewMode) || 'personal';
  });
  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    localStorage.setItem('dashboardViewMode', mode);
  };
  const navigate = useNavigate();
  const greeting = useMemo(() => getRandomGreeting(), []);
  const isMobile = useIsMobile();

  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [manageEventsOpen, setManageEventsOpen] = useState(false);
  const [activeStatModal, setActiveStatModal] = useState<string | null>(null);

  useEffect(() => {
    const fetchUpcoming = async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("events")
        .select("id, name, event_date, end_date, description, event_type, category, access_type, attendance_given, clubs(name)")
        .gte("event_date", now)
        .order("event_date", { ascending: true })
        .limit(10);
      if (data) {
        setUpcomingEvents(
          data.map((e: any) => {
            const d = new Date(e.event_date);
            const endD = e.end_date ? new Date(e.end_date) : null;
            return {
              ...e,
              month: d.toLocaleString("default", { month: "short" }).toUpperCase(),
              day: String(d.getDate()),
              club_name: e.clubs?.name || "",
              full_date: d.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              }),
              time: d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
              end_time: endD ? endD.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : null,
            };
          }),
        );
      }
    };
    fetchUpcoming();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#fdfbf7" }}>
        <div className="w-8 h-8 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  const fullName = profile?.full_name || user?.user_metadata?.full_name || "Student";
  const programme = profile?.programme || user?.user_metadata?.programme || "";
  const semester = profile?.semester || user?.user_metadata?.semester || "";
  const year = profile?.year || user?.user_metadata?.year || "";
  const about = profile?.about || "";
  const initials = fullName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const clubName = activeClub?.club_name || "No Club Selected";
  const roleLabel = activeClub ? (roleLabelMap[activeClub.role] ?? activeClub.role) : "Member";

  const isPersonal = viewMode === "personal";

  const statsCards = isPersonal
    ? [
        {
          label: "Clubs Joined:",
          value: String(personalStats.clubCount),
          path: "M0,25 C30,25 30,10 50,10 S70,20 100,5",
          clickable: true,
          clickAction: "clubs_joined" as const,
        },
        {
          label: "Events Attended:",
          value: String(personalStats.eventsAttended),
          path: "M0,25 C20,28 40,5 60,15 S80,5 100,10",
          clickable: true,
          clickAction: "events_attended" as const,
        },
        {
          label: "Total Events Attendance:",
          value: String(personalStats.totalEventsAttendance),
          path: "M0,20 C30,20 40,25 60,10 S90,5 100,5",
          clickable: true,
          clickAction: "attendance_history" as const,
        },
        { label: "Attendance Rate:", value: `${personalStats.attendanceRate}%`, path: "M0,28 L30,20 L60,10 L100,2" },
      ]
    : [
        {
          label: "Total Members:",
          value: String(clubStats.totalMembers),
          path: "M0,25 C30,25 30,10 50,10 S70,20 100,5",
        },
        { label: "Total Events:", value: String(clubStats.totalEvents), path: "M0,25 C20,28 40,5 60,15 S80,5 100,10" },
        {
          label: "Avg. Attendance Rate:",
          value: `${clubStats.avgAttendanceRate}%`,
          path: "M0,20 C30,20 40,25 60,10 S90,5 100,5",
        },
        { label: "Events with Data:", value: String(clubStats.chartData.length), path: "M0,28 L30,20 L60,10 L100,2" },
      ];

  const canManageClub = !isPersonal && !!activeClub && (activeClub.role === "president" || activeClub.role === "admin");
  const canManageEvents = !isPersonal && !!activeClub && hasPower("create_event");

  if (isMobile) {
    return (
      <>
        <MobileDashboardView
          fullName={fullName}
          roleLabel={roleLabel}
          role={activeClub?.role}
          clubName={clubName}
          avatarUrl={profile?.avatar_url || undefined}
          programme={programme}
          year={year}
          about={about}
          isPersonal={isPersonal}
          viewMode={viewMode}
          setViewMode={setViewMode}
          statsCards={statsCards}
          upcomingEvents={upcomingEvents}
          clubs={clubs}
          onEventClick={(event: any) => {
            setSelectedEvent(event);
            setEventDialogOpen(true);
          }}
          canManageClub={canManageClub}
          canManageEvents={canManageEvents}
          onManageEventsOpen={() => setManageEventsOpen(true)}
          socialLinkedin={profile?.social_linkedin || undefined}
          socialInstagram={profile?.social_instagram || undefined}
          socialGmail={profile?.social_gmail || undefined}
          attendanceRecords={personalStats.attendanceRecords}
        />
        <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
          <DialogContent className="max-w-[95vw] rounded-2xl">
            <DialogHeader>
              {selectedEvent?.club_name && (
                <p className="text-xs font-semibold text-primary uppercase tracking-wider">{selectedEvent.club_name}</p>
              )}
              <DialogTitle className="text-lg font-bold">{selectedEvent?.name}</DialogTitle>
            </DialogHeader>
            {selectedEvent && (
              <div className="space-y-3 pt-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span>{selectedEvent.full_date}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>{selectedEvent.time}{selectedEvent.end_time ? ` – ${selectedEvent.end_time}` : ''}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedEvent.event_type && (
                    <Badge variant="secondary" className="text-xs">
                      <Tag className="w-3 h-3 mr-1" />{selectedEvent.event_type}
                    </Badge>
                  )}
                  {selectedEvent.access_type && (
                    <Badge variant="outline" className="text-xs">
                      <Shield className="w-3 h-3 mr-1" />
                      {selectedEvent.access_type === 'open' ? 'Open for All' : 'Only for Club Members'}
                    </Badge>
                  )}
                  {selectedEvent.attendance_given !== undefined && (
                    <Badge className={`text-xs ${selectedEvent.attendance_given ? 'bg-success/15 text-success border-success/20' : 'bg-muted text-muted-foreground border-border'}`} variant="outline">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {selectedEvent.attendance_given ? 'Attendance Given' : 'No Attendance'}
                    </Badge>
                  )}
                </div>
                {selectedEvent.description && (
                  <div className="border-t border-border/30 pt-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Description</h4>
                    <p className="text-foreground/80 leading-relaxed">{selectedEvent.description}</p>
                  </div>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
        <ManageEventsModal open={manageEventsOpen} onOpenChange={setManageEventsOpen} />
      </>
    );
  }

  const cardColors = [
    { bg: '#DDEBFF', label: '#3B82F6' },  // blue
    { bg: '#FCE4EC', label: '#E91E63' },  // pink
    { bg: '#E8F5E9', label: '#4CAF50' },  // green
  ];

  const clubCardColors = [
    { bg: '#FFF8E1', label: '#F9A825' },  // yellow
    { bg: '#E8F5E9', label: '#4CAF50' },  // green
    { bg: '#EDE7F6', label: '#7C3AED' },  // purple
  ];

  return (
    <div className="h-screen flex antialiased overflow-hidden" style={{ backgroundColor: '#000000' }}>
      {/* Sidebar — seamless with black bg */}
      <DashboardSidebar />

      {/* Main content container with breathing space */}
      <div className="flex-1 flex flex-col p-3 min-h-0">
        <div
          className="flex-1 flex flex-col min-h-0 overflow-hidden"
          style={{
            background: '#FFFFFF',
            borderRadius: '24px',
            padding: '28px 32px',
            boxShadow: '0px 20px 60px rgba(0,0,0,0.15)',
          }}
        >
          {/* Header */}
          <header className="flex justify-between items-center mb-8">
            <h1
              style={{
                fontFamily: "'Lexend', sans-serif",
                fontSize: '24px',
                fontWeight: 600,
                color: '#0F172A',
                letterSpacing: '-0.02em',
              }}
            >
              {greeting}, <span style={{ color: '#3B82F6' }}>{fullName.split(" ")[0]}</span> 👋
            </h1>

            <div className="inline-flex items-center rounded-full p-1" style={{ backgroundColor: '#F1F5F9' }}>
              <button
                onClick={() => setViewMode("personal")}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  isPersonal ? "shadow-sm bg-white text-[#0F172A]" : "text-[#6B7280]"
                }`}
              >
                Personal
              </button>
              <button
                onClick={() => setViewMode("club")}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  !isPersonal ? "shadow-sm bg-white text-[#0F172A]" : "text-[#6B7280]"
                }`}
              >
                Club
              </button>
            </div>

            <div className="flex items-center gap-3">
              {!isPersonal && activeClub && (activeClub.role === "president" || activeClub.role === "admin") && (
                <button
                  onClick={() => navigate("/clubs")}
                  className="text-sm font-medium px-5 py-2 rounded-full shadow-sm flex items-center gap-2 transition-transform active:scale-95"
                  style={{ backgroundColor: '#0F172A', color: '#FFFFFF' }}
                >
                  <Users className="w-4 h-4" /> Manage Club
                </button>
              )}
              {!isPersonal && activeClub && hasPower("create_event") && (
                <DropdownMenu>
                  <DropdownMenuTrigger
                    className="text-sm font-medium px-5 py-2 rounded-full shadow-sm flex items-center gap-2 transition-transform active:scale-95"
                    style={{ backgroundColor: '#0F172A', color: '#FFFFFF' }}
                  >
                    <Calendar className="w-4 h-4" /> Events <ChevronDown className="w-3 h-3" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onSelect={() => navigate("/create-event")}>
                      <Edit3 className="mr-2 h-4 w-4" /> Create Event
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setManageEventsOpen(true)}>
                      <ClipboardList className="mr-2 h-4 w-4" /> Manage Events
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <ProfileDropdown viewMode={viewMode} />
            </div>
          </header>

          {/* Stats Row — 3 colored cards */}
          <section className="grid grid-cols-3 gap-5">
            {(isPersonal
              ? [
                  { label: 'Clubs Joined', value: String(personalStats.clubCount), clickAction: 'clubs_joined' as const, color: cardColors[0] },
                  { label: 'Events Attended', value: String(personalStats.eventsAttended), clickAction: 'events_attended' as const, color: cardColors[1] },
                  { label: 'Upcoming Events', value: String(upcomingEvents.length), clickAction: null, color: cardColors[2] },
                ]
              : [
                  { label: 'Total Members', value: String(clubStats.totalMembers), clickAction: null, color: clubCardColors[0] },
                  { label: 'Total Events', value: String(clubStats.totalEvents), clickAction: null, color: clubCardColors[1] },
                  { label: 'Avg. Attendance', value: `${clubStats.avgAttendanceRate}%`, clickAction: null, color: clubCardColors[2] },
                ]
            ).map((stat, i) => (
              <div
                key={i}
                onClick={() => { if (stat.clickAction) setActiveStatModal(stat.clickAction); }}
                className={`flex flex-col justify-center px-6 py-5 rounded-2xl transition-all duration-200 ${stat.clickAction ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02]' : ''}`}
                style={{
                  backgroundColor: stat.color.bg,
                  minHeight: 130,
                  boxShadow: '0px 4px 16px rgba(0,0,0,0.04)',
                }}
              >
                <p className="text-xs font-medium mb-2" style={{ color: '#6B7280', fontFamily: "'Lexend', sans-serif" }}>{stat.label}</p>
                <p className="text-4xl font-bold" style={{ color: '#0F172A', fontFamily: "'Lexend', sans-serif" }}>{stat.value}</p>
                {stat.clickAction && (
                  <p className="text-[11px] font-medium mt-1.5" style={{ color: stat.color.label }}>View details →</p>
                )}
              </div>
            ))}
          </section>

          {/* Analytics for club mode */}
          {!isPersonal && (
            <div className="flex-1 mt-6 rounded-2xl overflow-hidden" style={{ backgroundColor: '#F7F9FC', padding: 18, boxShadow: '0px 6px 20px rgba(0,0,0,0.04)' }}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-base" style={{ color: '#0F172A', fontFamily: "'Lexend', sans-serif" }}>Attendance Analytics</h3>
                <div className="px-3 py-1 rounded-lg text-xs flex items-center gap-1 cursor-pointer" style={{ backgroundColor: '#FFFFFF', color: '#6B7280' }}>
                  Last 30 Days <ChevronDown className="w-3 h-3" />
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <ComposedChart data={clubStats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6B7280" }} />
                  <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} domain={[0, 100]} />
                  <Tooltip contentStyle={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "12px", fontSize: "12px" }} />
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="1" x2="0" y2="0">
                      <stop offset="0%" stopColor="#93c5fd" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                  </defs>
                  <Bar dataKey="attendance" fill="url(#barGradient)" radius={[8, 8, 0, 0]} name="Attendance %" />
                  <Line type="monotone" dataKey="engagement" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: "#FFFFFF", stroke: "#6366f1", strokeWidth: 2, r: 5 }} name="Engagement Score" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
      {/* Event Detail Dialog */}
      <Dialog open={eventDialogOpen} onOpenChange={setEventDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            {selectedEvent?.club_name && (
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">{selectedEvent.club_name}</p>
            )}
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
                <span>{selectedEvent.time}{selectedEvent.end_time ? ` – ${selectedEvent.end_time}` : ''}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedEvent.event_type && (
                  <Badge variant="secondary" className="text-xs">
                    <Tag className="w-3 h-3 mr-1" />
                    {selectedEvent.event_type}
                  </Badge>
                )}
                {selectedEvent.access_type && (
                  <Badge variant="outline" className="text-xs">
                    <Shield className="w-3 h-3 mr-1" />
                    {selectedEvent.access_type === 'open' ? 'Open for All' : 'Only for Club Members'}
                  </Badge>
                )}
                {selectedEvent.attendance_given !== undefined && (
                  <Badge className={`text-xs ${selectedEvent.attendance_given ? 'bg-success/15 text-success border-success/20' : 'bg-muted text-muted-foreground border-border'}`} variant="outline">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {selectedEvent.attendance_given ? 'Attendance Given' : 'No Attendance'}
                  </Badge>
                )}
              </div>
              {selectedEvent.description && (
                <div className="border-t border-border/30 pt-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Description</h4>
                  <p className="text-sm text-foreground/80 leading-relaxed">{selectedEvent.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      <ManageEventsModal open={manageEventsOpen} onOpenChange={setManageEventsOpen} />
      {isPersonal && (
        <>
          <AttendanceHistoryModal
            open={activeStatModal === 'attendance_history'}
            onClose={() => setActiveStatModal(null)}
            records={personalStats.attendanceRecords}
          />
          <Dialog open={activeStatModal === 'clubs_joined'} onOpenChange={(open) => { if (!open) setActiveStatModal(null); }}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>My Clubs</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 max-h-[60vh] overflow-y-auto">
                {clubs.length > 0 ? clubs.map((club) => (
                  <div key={club.club_id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      {club.logo_url ? (
                        <img src={club.logo_url} alt={club.club_name} className="w-7 h-7 rounded object-cover" />
                      ) : (
                        <Award className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{club.club_name}</p>
                      <p className="text-xs text-muted-foreground">{roleLabelMap[club.role] ?? club.role}</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground italic text-center py-6">No clubs joined yet</p>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={activeStatModal === 'events_attended'} onOpenChange={(open) => { if (!open) setActiveStatModal(null); }}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Events Attended ({personalStats.eventsAttended})</DialogTitle>
              </DialogHeader>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {personalStats.attendanceRecords.length > 0 ? personalStats.attendanceRecords.map((rec) => (
                  <div key={rec.id} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <div className="flex flex-col items-center justify-center w-10 h-12 rounded-lg bg-primary/10 shrink-0">
                      <span className="text-[9px] font-bold uppercase text-primary">
                        {new Date(rec.event_date).toLocaleString('default', { month: 'short' })}
                      </span>
                      <span className="text-sm font-bold text-primary">{new Date(rec.event_date).getDate()}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{rec.event_name}</p>
                      <p className="text-xs text-muted-foreground">{rec.club_name}</p>
                    </div>
                    <Badge variant="outline" className="shrink-0 text-[10px] bg-success/15 text-success border-success/20">✓ Present</Badge>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground italic text-center py-6">No events attended yet</p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
