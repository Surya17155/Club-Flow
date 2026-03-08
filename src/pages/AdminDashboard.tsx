import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Search, ChevronDown, Edit3, CheckCircle, Star, MoreHorizontal, Calendar, Users, MapPin } from 'lucide-react';
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
  { name: 'Instagram Poster', progress: 80, active: true },
  { name: 'Event Budgeting', progress: 60, active: false },
  { name: 'Vendor Coordination', progress: 40, active: false },
];

const upcomingEvents = [
  { name: 'Coding Workshop', month: 'OCT', day: '28', location: 'Hall A', icon: Calendar },
  { name: 'Hackathon', month: 'NOV', day: '5', location: 'Main Lab', icon: Calendar },
  { name: 'Guest Lecture', month: 'NOV', day: '12', location: 'Auditorium', icon: Users },
];

const AdminDashboard = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#fdfbf7' }}>
        <div className="w-8 h-8 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const fullName = user?.user_metadata?.full_name || 'Admin User';
  const programme = user?.user_metadata?.programme || 'B.Tech (CS)';
  const semester = user?.user_metadata?.semester || '6';
  const year = user?.user_metadata?.year || '2025';

  return (
    <div className="min-h-screen relative antialiased p-6 md:p-8" style={{ backgroundColor: '#fdfbf7', color: '#4a4a4a' }}>
      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-blob" style={{ backgroundColor: 'hsl(50 80% 90% / 0.8)' }} />
        <div className="absolute top-[20%] right-[-10%] w-[400px] h-[400px] rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-blob animation-delay-2000" style={{ backgroundColor: 'hsl(30 80% 92% / 0.8)' }} />
        <div className="absolute bottom-[-10%] right-[10%] w-[600px] h-[600px] rounded-full mix-blend-multiply filter blur-[80px] opacity-70 animate-blob animation-delay-4000" style={{ backgroundColor: 'hsl(25 60% 65% / 0.3)' }} />
      </div>

      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#9ca3af' }} />
          <input
            type="text"
            placeholder="Search..."
            className="glass-input w-full py-2.5 pl-10 pr-4 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-amber/50 placeholder-gray-400"
            style={{ backgroundColor: 'rgba(255,255,255,0.8)' }}
          />
        </div>

        {/* Toggle */}
        <div className="inline-flex items-center rounded-[20px] p-1" style={{ backgroundColor: '#eee' }}>
          <span className="px-3 py-1.5 text-sm" style={{ color: '#888' }}>Personal</span>
          <span className="px-4 py-1.5 rounded-2xl text-sm font-semibold shadow-sm" style={{ backgroundColor: 'white', color: '#e67e22' }}>Club</span>
        </div>

        {/* Actions & Profile */}
        <div className="flex items-center gap-4">
          <button className="text-white text-sm font-medium px-5 py-2.5 rounded-full shadow-lg flex items-center gap-2 transition-transform active:scale-95" style={{ background: 'linear-gradient(to right, #f6b87a, #e89e68)' }}>
            <Edit3 className="w-4 h-4" /> Create Event
          </button>
          <button className="glass-input px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 border border-white hover:bg-white/60 transition-colors" style={{ color: '#4b5563' }}>
            <CheckCircle className="w-4 h-4" /> Task Management
          </button>
          <div className="glass-input pl-1 pr-4 py-1 rounded-full flex items-center gap-3 cursor-pointer hover:bg-white/60 transition-colors">
            <div className="w-8 h-8 rounded-full bg-amber flex items-center justify-center text-white text-xs font-bold">
              {fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <span className="text-sm font-medium" style={{ color: '#374151' }}>{fullName}</span>
            <ChevronDown className="w-3 h-3" style={{ color: '#6b7280' }} />
          </div>
        </div>
      </header>

      {/* Stats Row */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Total Members:', value: '156', path: 'M0,25 C30,25 30,10 50,10 S70,20 100,5' },
          { label: 'Total Events:', value: '24', path: 'M0,25 C20,28 40,5 60,15 S80,5 100,10' },
          { label: 'Avg. Attendance Rate:', value: '78%', path: 'M0,20 C30,20 40,25 60,10 S90,5 100,5' },
          { label: 'Overall Growth %:', value: '+5%', isGrowth: true, path: 'M0,28 L30,20 L60,10 L100,2' },
        ].map((stat, i) => (
          <div key={i} className="glass-card p-6 flex flex-col justify-between h-32 relative overflow-hidden group hover:bg-white/50 transition-colors">
            <div>
              <p className="text-sm mb-1" style={{ color: '#6b7280' }}>{stat.label}</p>
              <div className="flex items-center gap-2">
                <h3 className="text-3xl font-bold" style={{ color: '#1f2937' }}>{stat.value}</h3>
                {stat.isGrowth && (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#22c55e" strokeWidth={3}>
                    <path d="M5 15l7-7 7 7" />
                  </svg>
                )}
              </div>
            </div>
            <svg className="absolute bottom-4 right-4 w-24 h-12" style={{ color: '#e09f6e' }} fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 100 30">
              <path d={stat.path} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        ))}
      </section>

      {/* Main 3-column grid */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: Profile */}
        <div className="lg:col-span-3 h-full">
          <div className="glass-card p-6 h-full flex flex-col items-center text-center">
            {/* Avatar */}
            <div className="relative mb-4">
              <div className="absolute inset-0 rounded-full blur-xl transform scale-110" style={{ backgroundColor: 'hsl(30 70% 80% / 0.5)' }} />
              <div className="w-[120px] h-[120px] rounded-full border-4 border-white shadow-lg relative z-10 flex items-center justify-center text-3xl font-bold" style={{ backgroundColor: 'hsl(var(--amber))', color: 'white' }}>
                {fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
            </div>
            <h2 className="text-xl font-bold" style={{ color: '#1f2937' }}>{fullName}</h2>
            <p className="text-sm font-medium" style={{ color: '#6b7280' }}>President</p>
            <p className="text-xs font-medium mb-6" style={{ color: '#9ca3af' }}>TechNova Club</p>

            {/* About section */}
            <div className="w-full text-left rounded-xl p-4 mb-6" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}>
              <h4 className="font-bold mb-3" style={{ color: '#374151' }}>About</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: '#6b7280' }}>Class:</span>
                  <span className="font-medium" style={{ color: '#374151' }}>{year}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#6b7280' }}>Program:</span>
                  <span className="font-medium" style={{ color: '#374151' }}>{programme}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: '#6b7280' }}>Semester:</span>
                  <span className="font-medium" style={{ color: '#374151' }}>{semester}</span>
                </div>
              </div>
            </div>

            {/* Social icons */}
            <div className="mt-auto flex gap-4 justify-center mt-5">
              {/* LinkedIn */}
              <a href="#" className="hover:opacity-75 transition-opacity">
                <svg className="w-5 h-5" fill="#4a4a4a" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
              {/* Twitter */}
              <a href="#" className="hover:opacity-75 transition-opacity">
                <svg className="w-5 h-5" fill="#4a4a4a" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
              </a>
              {/* Instagram */}
              <a href="#" className="hover:opacity-75 transition-opacity">
                <svg className="w-5 h-5" fill="#4a4a4a" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              </a>
            </div>
          </div>
        </div>

        {/* MIDDLE: Chart + Feedback */}
        <div className="lg:col-span-6 flex flex-col gap-6">
          {/* Chart */}
          <div className="glass-card p-6 flex-grow">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg" style={{ color: '#1f2937' }}>Attendance Analytics</h3>
              <div className="glass-input px-3 py-1 rounded-lg text-xs flex items-center gap-1 cursor-pointer" style={{ color: '#4b5563' }}>
                Last 30 Days <ChevronDown className="w-3 h-3" />
              </div>
            </div>
            <div className="flex justify-between items-center text-xs mb-6">
              <span className="font-semibold" style={{ color: '#4b5563' }}>Event Attendance & Engagement</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#bf7e54' }} />
                <span style={{ color: '#6b7280' }}>Engagement Score</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    background: 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.6)',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                />
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#dfa579" />
                    <stop offset="100%" stopColor="#eacda3" />
                  </linearGradient>
                </defs>
                <Bar dataKey="attendance" fill="url(#barGradient)" radius={[8, 8, 0, 0]} name="Attendance %" />
                <Line
                  type="monotone"
                  dataKey="engagement"
                  stroke="#bf7e54"
                  strokeWidth={2.5}
                  dot={{ fill: '#fdfbf7', stroke: '#bf7e54', strokeWidth: 2, r: 5 }}
                  name="Engagement Score"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Feedback */}
          <div className="glass-card p-6 relative">
            <div className="absolute top-6 right-6 text-2xl">🧠</div>
            <h3 className="font-bold text-lg mb-2" style={{ color: '#1f2937' }}>Feedback Summary (AI-Powered Sentiment)</h3>
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4].map(i => (
                <Star key={i} className="w-5 h-5 fill-current" style={{ color: '#f4c542' }} />
              ))}
              <Star className="w-5 h-5 fill-current" style={{ color: '#f4c542', opacity: 0.5 }} />
              <span className="ml-2 font-bold" style={{ color: '#1f2937' }}>4.5 stars</span>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: '#4b5563' }}>
              Overall sentiment is positive. Recent event on Machine Learning received excellent reviews for content. Suggestions include better sound system for future sessions.
            </p>
          </div>
        </div>

        {/* RIGHT: Events + Tasks */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          {/* Upcoming Events */}
          <div className="glass-card p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg" style={{ color: '#1f2937' }}>Upcoming Events</h3>
              <MoreHorizontal className="w-5 h-5 cursor-pointer" style={{ color: '#6b7280' }} />
            </div>
            <div className="space-y-4">
              {upcomingEvents.map((event, i) => (
                <div key={i} className="flex items-center gap-4 group cursor-pointer">
                  <div className="rounded-lg shadow-sm w-12 h-12 flex flex-col items-center justify-center border group-hover:shadow-md transition-shadow" style={{ backgroundColor: 'white', borderColor: '#f3f4f6' }}>
                    <span className="text-[10px] font-bold uppercase tracking-wide" style={{ color: '#6b7280' }}>{event.month}</span>
                    <span className="text-lg font-bold leading-none" style={{ color: '#1f2937' }}>{event.day}</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold" style={{ color: '#1f2937' }}>{event.name}</h4>
                    <span className="text-xs flex items-center gap-1" style={{ color: '#6b7280' }}>
                      <MapPin className="w-2.5 h-2.5" /> {event.location}
                    </span>
                  </div>
                  <div className="ml-auto" style={{ color: '#9ca3af' }}>
                    <event.icon className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Task Progress */}
          <div className="glass-card p-6 flex-grow">
            <h3 className="font-bold text-lg mb-4" style={{ color: '#1f2937' }}>Task Progress</h3>
            <div className="space-y-6">
              {tasks.map((task, i) => (
                <div key={i}>
                  <div className="flex justify-between items-end mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={task.active
                          ? { backgroundColor: '#e09f6e' }
                          : { border: '1px solid #9ca3af' }
                        }
                      />
                      <h4 className="text-sm font-semibold" style={{ color: '#1f2937' }}>{task.name}</h4>
                    </div>
                    <span className="text-xs font-bold" style={{ color: '#6b7280' }}>{task.progress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(229,231,235,0.5)' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${task.progress}%`,
                        backgroundColor: '#e09f6e',
                        opacity: task.active ? 1 : 0.7,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
