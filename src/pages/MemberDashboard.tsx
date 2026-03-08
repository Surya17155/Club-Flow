import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { ProfileCard } from '@/components/dashboard/ProfileCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, CheckCircle, Clock, ChevronLeft, ChevronRight, ListTodo } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const tasks = [
  { name: 'Design Poster - Robotics Club', status: 'In Progress', statusColor: 'bg-warning' },
  { name: 'Code Review - Coding Club', status: 'Pending', statusColor: 'bg-muted' },
  { name: 'Event Setup - Art Club', status: 'Completed', statusColor: 'bg-success' },
];

const upcomingForYou = [
  { name: 'Coding Workshop', when: 'In 2 days' },
  { name: 'Game Dev Fest', when: 'In 4 days' },
  { name: 'Guest Lecture', when: 'In 7 days' },
];

const attendanceHistory = [
  { event: 'Web Dev Bootcamp', date: 'Oct 20', status: 'Present' },
  { event: 'Hackathon', date: 'Oct 15', status: 'Present' },
  { event: 'Guest Lecture', date: 'Oct 10', status: 'Absent' },
  { event: 'AI Workshop', date: 'Oct 5', status: 'Present' },
];

const calendarEvents: Record<string, { name: string; color: string }[]> = {
  '2025-10-03': [{ name: 'Coding Workshop', color: 'bg-info' }],
  '2025-10-08': [{ name: 'Hackathon', color: 'bg-destructive' }],
  '2025-10-15': [{ name: 'Guest Lecture', color: 'bg-success' }],
};

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
  const fullName = user?.user_metadata?.full_name || 'Rohan Das';
  const programme = user?.user_metadata?.programme || 'B.Tech (CSE)';
  const semester = user?.user_metadata?.semester || '6';
  const year = user?.user_metadata?.year || '2025';

  const [calMonth, setCalMonth] = useState(9);
  const [calYear, setCalYear] = useState(2025);
  const weeks = getMiniCalendar(calYear, calMonth);
  const monthName = new Date(calYear, calMonth).toLocaleString('default', { month: 'long' });

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left - Profile */}
          <div className="lg:col-span-1 space-y-4">
            <ProfileCard
              name={fullName}
              role="Member"
              about="Our mission to foster tech innovation and collaboration, to develop engagement and determination content, together and rather together, and process."
              programme={programme}
              semester={`Semester ${semester}`}
              year={year}
              badges={['Member', 'Coding Club', 'Robotics Club']}
            />
          </div>

          {/* Center - Stats + Calendar */}
          <div className="lg:col-span-2 space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard title="Clubs Joined" value={3} icon={Users} />
              <StatCard title="Events Attended" value={18} icon={CheckCircle} />
              <StatCard title="Total Tasks" value={5} icon={ListTodo} />
            </div>

            {/* Calendar */}
            <Card className="shadow-card border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-display">Unified Upcoming Events Calendar</CardTitle>
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
                      <div key={i} className={`min-h-[60px] p-1 rounded-lg text-xs border border-transparent ${day ? 'hover:border-border hover:bg-muted/30 cursor-pointer' : ''}`}>
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
              </CardContent>
            </Card>

            {/* Upcoming for you + Attendance History */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="shadow-card border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-display">Upcoming for You</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {upcomingForYou.map((ev, i) => (
                    <div key={i} className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
                      <Clock className="w-3.5 h-3.5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{ev.name}</p>
                        <p className="text-[10px] text-muted-foreground">{ev.when}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="shadow-card border-border/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-display">My Attendance History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {attendanceHistory.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{item.event}</p>
                        <p className="text-[10px] text-muted-foreground">{item.date}</p>
                      </div>
                      <Badge variant={item.status === 'Present' ? 'default' : 'destructive'} className="text-[10px] shrink-0">
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Right - Tasks */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="shadow-card border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-display">My Assigned Tasks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {tasks.map((task, i) => (
                  <div key={i} className="p-3 rounded-lg bg-muted/50 space-y-1.5">
                    <p className="text-sm font-medium">{task.name}</p>
                    <Badge className={`text-[10px] text-primary-foreground ${task.statusColor}`}>{task.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MemberDashboard;
