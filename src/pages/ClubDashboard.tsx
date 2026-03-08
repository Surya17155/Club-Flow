import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { ProfileCard } from '@/components/dashboard/ProfileCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, CheckCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const trendData = [
  { month: 'Jul', attendance: 65 },
  { month: 'Aug', attendance: 72 },
  { month: 'Sep', attendance: 80 },
  { month: 'Oct', attendance: 75 },
  { month: 'Nov', attendance: 85 },
  { month: 'Dec', attendance: 78 },
];

const postHolders = [
  { position: 'President', name: 'Arjun Mehta' },
  { position: 'VP', name: 'Sarah Khan' },
  { position: 'Secretary', name: 'Rahul Verma' },
];

const upcomingEvents = [
  { name: 'Coding Workshop', date: 'Oct 28', type: 'Workshop' },
  { name: 'Game Dev Fest', date: 'Nov 1', type: 'Festival' },
  { name: 'Hackathon', date: 'Nov 5', type: 'Competition' },
];

const previousEvents = [
  { name: 'Web Dev Bootcamp', report: true },
  { name: 'Cybersecurity Talk', report: true },
  { name: 'Guest Lecture', report: false },
];

// Calendar helper
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const calendarEvents: Record<string, { name: string; color: string }[]> = {
  '2025-10-07': [{ name: 'Game Dev Fest', color: 'bg-info' }],
  '2025-10-08': [{ name: 'Hackathon', color: 'bg-destructive' }],
  '2025-10-14': [{ name: 'Guest Lecture', color: 'bg-success' }],
  '2025-10-15': [{ name: 'Guest Lecture', color: 'bg-success' }],
  '2025-10-22': [{ name: 'Guest Lecture', color: 'bg-warning' }],
};

function getMiniCalendar(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const weeks: (number | null)[][] = [];
  let week: (number | null)[] = Array(firstDay).fill(null);

  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) {
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }
  return weeks;
}

const ClubDashboard = () => {
  const [calMonth, setCalMonth] = useState(9); // October (0-indexed)
  const [calYear, setCalYear] = useState(2025);
  const weeks = getMiniCalendar(calYear, calMonth);
  const monthName = new Date(calYear, calMonth).toLocaleString('default', { month: 'long' });

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Club Header */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl gradient-gold flex items-center justify-center shadow-gold">
            <span className="text-2xl font-display font-bold text-primary-foreground">N</span>
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Nexus Tech Society</h1>
            <p className="text-sm text-muted-foreground">Tech Innovation & Collaboration</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left column */}
          <div className="lg:col-span-1 space-y-4">
            {/* About */}
            <Card className="shadow-card border-border/50 p-5">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">About</h3>
              <p className="text-sm text-foreground/80 leading-relaxed">
                Our mission to foster tech innovation and collaboration, to develop engagement and determination content, and process.
              </p>
            </Card>

            {/* Post Holders */}
            <Card className="shadow-card border-border/50 p-5">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Current Post-holders</h3>
              <div className="space-y-3">
                {postHolders.map((ph, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                        {ph.name[0]}
                      </div>
                      <span className="text-sm font-medium">{ph.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">{ph.position}</Badge>
                  </div>
                ))}
              </div>
            </Card>

            {/* Stats */}
            <div className="space-y-3">
              <StatCard title="Total Members" value={250} icon={Users} />
              <StatCard title="All-Time Attendance" value="1,200" icon={CheckCircle} />
              <StatCard title="Engagement Index" value="85/100" icon={Calendar} />
            </div>
          </div>

          {/* Center - Calendar */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="shadow-card border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-display">Monthly Calendar</CardTitle>
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
                        className={`min-h-[60px] p-1 rounded-lg text-xs border border-transparent ${day ? 'hover:border-border hover:bg-muted/30 cursor-pointer' : ''}`}
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
              </CardContent>
            </Card>

            {/* Participation Analytics */}
            <Card className="shadow-card border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-display">Participation Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Line type="monotone" dataKey="attendance" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="lg:col-span-1 space-y-4">
            {/* Upcoming Events */}
            <Card className="shadow-card border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-display">Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingEvents.map((event, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
                    <div className="w-9 h-9 rounded-lg gradient-gold flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{event.name}</p>
                      <span className="text-xs text-muted-foreground">{event.date}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Links / Previous Events */}
            <Card className="shadow-card border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-display">Quick Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {previousEvents.map((event, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                    <span className="text-sm font-medium">{event.name}</span>
                    {event.report && (
                      <Badge variant="secondary" className="text-xs">Report</Badge>
                    )}
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

export default ClubDashboard;
