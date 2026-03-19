import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { ProfileCard } from '@/components/dashboard/ProfileCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Calendar, CheckCircle, Clock, ChevronLeft, ChevronRight, ListTodo, Download, MessageSquare, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { usePersonalStats } from '@/hooks/usePersonalStats';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { exportAttendanceXLSX } from '@/utils/exportAttendance';
import EventFeedbackModal from '@/components/dashboard/EventFeedbackModal';
import { toast } from 'sonner';

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

const MemberDashboard = () => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { stats: personalStats } = usePersonalStats();

  const fullName = profile?.full_name || user?.user_metadata?.full_name || 'Student';
  const programme = profile?.programme || user?.user_metadata?.programme || '';
  const semester = profile?.semester || user?.user_metadata?.semester || '';
  const year = profile?.year || user?.user_metadata?.year || '';

  const now = new Date();
  const [calMonth, setCalMonth] = useState(now.getMonth());
  const [calYear, setCalYear] = useState(now.getFullYear());
  const weeks = getMiniCalendar(calYear, calMonth);
  const monthName = new Date(calYear, calMonth).toLocaleString('default', { month: 'long' });

  const [upcomingForYou, setUpcomingForYou] = useState<{ id: string; name: string; when: string }[]>([]);
  const [attendanceHistory, setAttendanceHistory] = useState<{ event: string; eventId: string; date: string; status: string; scanned_at: string }[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<Record<string, { id: string; name: string; color: string }[]>>({});
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackEvent, setFeedbackEvent] = useState<{ id: string; name: string } | null>(null);
  const [selectedDayEvents, setSelectedDayEvents] = useState<{ id: string; name: string; color: string }[]>([]);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const nowISO = new Date().toISOString();
      const { data: upData } = await supabase
        .from('events')
        .select('id, name, event_date')
        .gte('event_date', nowISO)
        .order('event_date', { ascending: true })
        .limit(5);

      if (upData) {
        setUpcomingForYou(upData.map((e: any) => {
          const diff = Math.ceil((new Date(e.event_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          return { id: e.id, name: e.name, when: diff <= 0 ? 'Today' : `In ${diff} day${diff > 1 ? 's' : ''}` };
        }));

        const cEvents: Record<string, { id: string; name: string; color: string }[]> = {};
        const colors = ['bg-info', 'bg-destructive', 'bg-success', 'bg-warning', 'bg-primary'];
        upData.forEach((e: any, i: number) => {
          const d = new Date(e.event_date);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          if (!cEvents[key]) cEvents[key] = [];
          cEvents[key].push({ id: e.id, name: e.name, color: colors[i % colors.length] });
        });
        setCalendarEvents(cEvents);
      }

      const { data: attData } = await supabase
        .from('attendance')
        .select('status, scanned_at, event_id, events(id, name)')
        .eq('student_id', user.id)
        .order('scanned_at', { ascending: false })
        .limit(10);

      if (attData) {
        setAttendanceHistory(attData.map((a: any) => ({
          event: (a.events as any)?.name || 'Event',
          eventId: (a.events as any)?.id || a.event_id,
          date: new Date(a.scanned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          status: a.status === 'present' ? 'Present' : 'Absent',
          scanned_at: a.scanned_at,
        })));
      }
    };

    fetchData();
  }, [user?.id]);

  const handleCalendarDayClick = (day: number) => {
    const dateKey = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const events = calendarEvents[dateKey] || [];
    setSelectedDayEvents(events);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
          {/* Left - Profile */}
          <div className="lg:col-span-1 space-y-4">
            <ProfileCard
              name={fullName}
              role="Member"
              about={profile?.about || ''}
              programme={programme}
              semester={semester ? `Semester ${semester}` : ''}
              year={year}
              badges={['Member']}
            />
          </div>

          {/* Center - Stats + Calendar */}
          <div className="lg:col-span-2 space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <StatCard title="Clubs Joined" value={personalStats.clubCount} icon={Users} />
              <StatCard title="Events Attended" value={personalStats.eventsAttended} icon={CheckCircle} />
              <StatCard title="Total Events Attendance" value={personalStats.totalEventsAttendance} icon={ListTodo} />
            </div>

            {/* Calendar */}
            <Card className="shadow-card border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-display">Upcoming Events Calendar</CardTitle>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); }} className="p-1 rounded hover:bg-muted"><ChevronLeft className="w-4 h-4" /></button>
                    <span className="text-sm font-medium min-w-[120px] text-center">{monthName} {calYear}</span>
                    <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); }} className="p-1 rounded hover:bg-muted"><ChevronRight className="w-4 h-4" /></button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-1">
                  {DAYS.map(d => (
                    <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
                  ))}
                  {weeks.flat().map((day, i) => {
                    const dateKey = day ? `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
                    const events = day ? calendarEvents[dateKey] || [] : [];
                    return (
                      <div
                        key={i}
                        className={`min-h-[48px] sm:min-h-[60px] p-1 rounded-lg text-xs border border-transparent ${day ? 'hover:border-border hover:bg-muted/30 cursor-pointer' : ''}`}
                        onClick={() => day && events.length > 0 && handleCalendarDayClick(day)}
                      >
                        {day && (
                          <>
                            <span className="text-muted-foreground">{day}</span>
                            {events.map((ev, j) => (
                              <div key={j} className={`mt-0.5 px-1 py-0.5 rounded text-[10px] text-primary-foreground truncate ${ev.color}`}>
                                {ev.name}
                              </div>
                            ))}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Selected day events with feedback button */}
                {selectedDayEvents.length > 0 && (
                  <div className="mt-4 p-3 rounded-xl bg-muted/50 space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase">Events on this day</p>
                    {selectedDayEvents.map(ev => (
                      <div key={ev.id} className="flex items-center justify-between p-2 rounded-lg bg-white/50">
                        <span className="text-sm font-medium">{ev.name}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={() => { setFeedbackEvent({ id: ev.id, name: ev.name }); setFeedbackOpen(true); }}
                        >
                          <MessageSquare className="w-3 h-3 mr-1" /> Feedback
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming for you + Attendance History */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="shadow-card border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-display">Upcoming for You</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {upcomingForYou.length > 0 ? upcomingForYou.map((ev, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                      <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{ev.name}</p>
                        <p className="text-[10px] text-muted-foreground">{ev.when}</p>
                      </div>
                    </div>
                  )) : <p className="text-xs text-muted-foreground italic">No upcoming events</p>}
                </CardContent>
              </Card>

              <Card className="shadow-card border-border/50">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-display">My Attendance History</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  {attendanceHistory.length > 0 ? attendanceHistory.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium truncate">{item.event}</p>
                        <p className="text-[10px] text-muted-foreground">{item.date}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Badge variant={item.status === 'Present' ? 'default' : 'destructive'} className="text-[10px]">
                          {item.status}
                        </Badge>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-6 h-6"
                          onClick={() => { setFeedbackEvent({ id: item.eventId, name: item.event }); setFeedbackOpen(true); }}
                        >
                          <Star className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  )) : <p className="text-xs text-muted-foreground italic">No attendance records yet</p>}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right - Quick Info */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="shadow-card border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-display">Quick Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 rounded-lg bg-muted/50 space-y-1.5">
                  <p className="text-sm font-medium">Attendance Rate</p>
                  <Badge className="text-xs bg-success text-primary-foreground">{personalStats.attendanceRate}%</Badge>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 space-y-1.5">
                  <p className="text-sm font-medium">Events Attended</p>
                  <Badge className="text-xs bg-info text-primary-foreground">{personalStats.eventsAttended} / {personalStats.totalEventsAttendance}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {feedbackEvent && (
        <EventFeedbackModal
          open={feedbackOpen}
          onOpenChange={setFeedbackOpen}
          eventId={feedbackEvent.id}
          eventName={feedbackEvent.name}
        />
      )}
    </DashboardLayout>
  );
};

export default MemberDashboard;
