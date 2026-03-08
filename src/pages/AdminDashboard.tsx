import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { ProfileCard } from '@/components/dashboard/ProfileCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Users, Calendar, TrendingUp, BarChart3, Plus, Star, Clock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart, Area,
} from 'recharts';

const chartData = [
  { name: 'Coding Workshop', attendance: 85, engagement: 92, date: 'Oct 28' },
  { name: 'Hackathon', attendance: 78, engagement: 88, date: 'Nov 5' },
  { name: 'Guest Lecture', attendance: 65, engagement: 72, date: 'Nov 12' },
  { name: 'Web Dev Bootcamp', attendance: 90, engagement: 95, date: 'Nov 19' },
  { name: 'AI Workshop', attendance: 82, engagement: 85, date: 'Nov 26' },
  { name: 'Seminar', attendance: 70, engagement: 78, date: 'Dec 3' },
];

const tasks = [
  { name: 'Instagram Poster', progress: 80 },
  { name: 'Event Budgeting', progress: 60 },
  { name: 'Vendor Coordination', progress: 40 },
];

const upcomingEvents = [
  { name: 'Coding Workshop', date: 'In 3 days', type: 'Workshop' },
  { name: 'Game Dev Fest', date: 'In 5 days', type: 'Festival' },
  { name: 'Guest Lecture', date: 'In 7 days', type: 'Lecture' },
];

const AdminDashboard = () => {
  const { user } = useAuth();
  const fullName = user?.user_metadata?.full_name || 'Admin User';
  const programme = user?.user_metadata?.programme || 'B.Tech (CS)';
  const semester = user?.user_metadata?.semester || '6';
  const year = user?.user_metadata?.year || '2025';

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Attendance Analytics</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Monitor your club's performance</p>
          </div>
          <div className="flex gap-2">
            <Tabs defaultValue="club">
              <TabsList>
                <TabsTrigger value="personal">Personal</TabsTrigger>
                <TabsTrigger value="club">Club</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button className="gradient-gold text-primary-foreground shadow-gold hover:opacity-90">
              <Plus className="w-4 h-4 mr-1" /> Create Event
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left column - Profile */}
          <div className="lg:col-span-1 space-y-4">
            <ProfileCard
              name={fullName}
              role="Club Admin"
              about="Passionate about technology and community building. Leading the Nexus Tech Society to new heights."
              programme={programme}
              semester={`Semester ${semester}`}
              year={year}
              socialLinks={{ github: '#', linkedin: '#', twitter: '#' }}
              badges={['Admin', 'Nexus Tech Society']}
            />
          </div>

          {/* Center - Stats + Chart */}
          <div className="lg:col-span-2 space-y-4">
            {/* Stats Row */}
            <div className="grid grid-cols-2 gap-3">
              <StatCard title="Total Members" value={156} change="+12 this month" changeType="positive" icon={Users} />
              <StatCard title="Total Events" value={24} change="+3 this month" changeType="positive" icon={Calendar} />
              <StatCard title="Avg. Attendance" value="78%" change="+5% ↑" changeType="positive" icon={BarChart3} />
              <StatCard title="Overall Growth" value="+5%" change="vs last quarter" changeType="positive" icon={TrendingUp} />
            </div>

            {/* Chart */}
            <Card className="shadow-card border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-display">Event Attendance & Engagement</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} angle={-20} textAnchor="end" height={50} />
                    <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="attendance" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Attendance %" />
                    <Line
                      type="monotone"
                      dataKey="engagement"
                      stroke="hsl(var(--amber))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--amber))', r: 4 }}
                      name="Engagement Score"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Feedback Summary */}
            <Card className="shadow-card border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-display">Feedback Summary (AI-Powered Sentiment)</CardTitle>
                  <div className="flex items-center gap-1 text-amber">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-semibold">4.5</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Overall sentiment is positive. Recent event on Machine Learning received excellent reviews for content. 
                  Suggestions include better sound system for future sessions.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right column - Events + Tasks */}
          <div className="lg:col-span-1 space-y-4">
            {/* Upcoming Events */}
            <Card className="shadow-card border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-display">Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingEvents.map((event, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <div className="w-9 h-9 rounded-lg gradient-gold flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{event.name}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{event.date}</span>
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">{event.type}</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Task Progress */}
            <Card className="shadow-card border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-display">Task Progress</CardTitle>
                  <Badge variant="secondary" className="text-xs">3 active</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {tasks.map((task, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{task.name}</span>
                      <span className="text-muted-foreground">{task.progress}%</span>
                    </div>
                    <Progress value={task.progress} className="h-2" />
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

export default AdminDashboard;
