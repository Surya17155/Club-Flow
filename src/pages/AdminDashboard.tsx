import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { ProfileCard } from '@/components/dashboard/ProfileCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Users, Calendar, TrendingUp, BarChart3, Plus, Star, CheckSquare, MoreHorizontal } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart,
} from 'recharts';

const chartData = [
  { name: 'Event 1', attendance: 45, engagement: 40 },
  { name: 'Event 2', attendance: 80, engagement: 55 },
  { name: 'Event 3', attendance: 60, engagement: 70 },
  { name: 'Event 4', attendance: 75, engagement: 65 },
  { name: 'Event 5', attendance: 85, engagement: 78.5 },
  { name: 'Event 10', attendance: 50, engagement: 60 },
];

const tasks = [
  { name: 'Instagram Poster', progress: 80 },
  { name: 'Event Budgeting', progress: 60 },
  { name: 'Vendor Coordination', progress: 40 },
];

const upcomingEvents = [
  { name: 'Coding Workshop', date: 'Oct 28', day: '28', icon: Calendar },
  { name: 'Hackathon', date: 'Nov 5', day: '5', icon: Calendar },
  { name: 'Guest Lecture', date: 'Nov 12', day: '12', icon: Users },
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
        {/* Top bar with toggle & actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">Personal / Club</span>
            <div className="w-12 h-6 rounded-full bg-primary/80 relative cursor-pointer">
              <div className="absolute right-0.5 top-0.5 w-5 h-5 rounded-full bg-primary-foreground shadow-sm transition-all" />
            </div>
            <span className="text-sm font-medium text-foreground">Club</span>
          </div>
          <div className="flex items-center gap-3">
            <Button className="gradient-gold text-primary-foreground shadow-gold hover:opacity-90">
              <Plus className="w-4 h-4 mr-1.5" /> Create Event
            </Button>
            <Button variant="outline" className="border-border">
              <CheckSquare className="w-4 h-4 mr-1.5" /> Task Management
            </Button>
          </div>
        </div>

        {/* Stats Row — full width, 4 columns */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Members:" value={156} icon={Users} />
          <StatCard title="Total Events:" value={24} icon={Calendar} />
          <StatCard title="Avg. Attendance Rate:" value="78%" icon={BarChart3} />
          <StatCard title="Overall Growth %:" value="+5%" change="↑" changeType="positive" icon={TrendingUp} />
        </div>

        {/* 3-column layout: Profile | Charts+Feedback | Events+Tasks */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left — Profile Card */}
          <div className="lg:col-span-3">
            <ProfileCard
              name={fullName}
              role="President"
              about=""
              programme={programme}
              semester={`${semester}`}
              year={year}
              socialLinks={{ github: '#', linkedin: '#', twitter: '#' }}
            />
          </div>

          {/* Center — Attendance Analytics + Feedback */}
          <div className="lg:col-span-6 space-y-6">
            {/* Chart */}
            <Card className="shadow-card border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-display font-bold">Attendance Analytics</CardTitle>
                  <Button variant="outline" size="sm" className="text-xs h-8">
                    Last 30 Days ▾
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-sm font-medium text-foreground">Event Attendance & Engagement</span>
                  <div className="flex items-center gap-1.5 ml-auto">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                    <span className="text-xs text-muted-foreground">Engagement Score</span>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} domain={[0, 100]} />
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
                  <CardTitle className="text-lg font-display font-bold">Feedback Summary (AI-Powered Sentiment)</CardTitle>
                  <span className="text-2xl">🧠</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4].map(i => (
                    <Star key={i} className="w-5 h-5 fill-amber text-amber" />
                  ))}
                  <Star className="w-5 h-5 text-amber fill-amber/50" />
                  <span className="text-sm font-medium text-foreground ml-2">4.5 stars</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Overall sentiment is positive. Recent event on Machine Learning received excellent reviews for content. 
                  Suggestions include better sound system for future sessions.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Right — Upcoming Events + Task Progress */}
          <div className="lg:col-span-3 space-y-6">
            {/* Upcoming Events */}
            <Card className="shadow-card border-border/50">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-display font-bold">Upcoming Events</CardTitle>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {upcomingEvents.map((event, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-amber-light/50 hover:bg-amber-light transition-colors">
                    <div className="w-12 h-12 rounded-xl gradient-gold flex items-center justify-center shrink-0">
                      <span className="text-lg font-display font-bold text-primary-foreground">{event.day}</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold truncate">{event.name}</p>
                      <p className="text-xs text-muted-foreground">{event.date}</p>
                    </div>
                    <event.icon className="w-5 h-5 text-muted-foreground shrink-0" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Task Progress */}
            <Card className="shadow-card border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-display font-bold">Task Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tasks.map((task, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{task.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{task.progress}% Complete</span>
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
