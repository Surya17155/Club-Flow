import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Search, Download, Shield, ArrowLeft, Eye } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import ProfileDropdown from '@/components/dashboard/ProfileDropdown';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';

const roleLabelMap: Record<string, string> = {
  admin: 'Admin', president: 'President', vice_president: 'Vice President',
  secretary: 'Secretary', social_media_head: 'Social Media Head', member: 'Member'
};

const PIE_COLORS = ['hsl(36, 72%, 48%)', 'hsl(25, 80%, 55%)', 'hsl(142, 71%, 45%)', 'hsl(217, 91%, 60%)', 'hsl(280, 60%, 55%)'];

interface ReportRow {
  eventName: string;
  eventDate: string;
  clubName: string;
  clubId: string;
  totalMembers: number;
  postHolders: number;
  regularMembers: number;
  participantCount: number;
}

const GlobalReports = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [clubFilter, setClubFilter] = useState('all');
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [clubs, setClubs] = useState<{ id: string; name: string }[]>([]);
  const [eventsPerClub, setEventsPerClub] = useState<{ name: string; events: number }[]>([]);
  const [programmeData, setProgrammeData] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<any>(null);

  // Check admin role
  useEffect(() => {
    if (!user) return;
    const checkAdmin = async () => {
      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin');
      setIsAdmin(data && data.length > 0);
    };
    checkAdmin();
  }, [user?.id]);

  // Fetch report data
  useEffect(() => {
    if (isAdmin !== true) return;
    const fetch = async () => {
      setLoading(true);
      const [{ data: eventsData }, { data: clubsData }, { data: membersData }, { data: profilesData }, { data: participantsData }] = await Promise.all([
        supabase.from('events').select('id, name, event_date, club_id'),
        supabase.from('clubs').select('id, name'),
        supabase.from('club_members').select('id, user_id, club_id, role'),
        supabase.from('profiles').select('user_id, full_name, programme'),
        supabase.from('event_participants').select('event_id'),
      ]);

      const cList = clubsData || [];
      const mList = membersData || [];
      const eList = eventsData || [];
      const pList = profilesData || [];
      const partList = participantsData || [];

      setClubs(cList);

      const clubMap = new Map(cList.map(c => [c.id, c.name]));

      // Participant counts
      const partCounts = new Map<string, number>();
      partList.forEach(p => partCounts.set(p.event_id, (partCounts.get(p.event_id) || 0) + 1));

      // Club membership stats
      const clubStats = new Map<string, { total: number; postHolders: number }>();
      mList.forEach(m => {
        const curr = clubStats.get(m.club_id) || { total: 0, postHolders: 0 };
        curr.total++;
        if (m.role !== 'member') curr.postHolders++;
        clubStats.set(m.club_id, curr);
      });

      const reportRows: ReportRow[] = eList
        .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
        .map(e => {
          const stats = clubStats.get(e.club_id) || { total: 0, postHolders: 0 };
          return {
            eventName: e.name,
            eventDate: e.event_date,
            clubName: clubMap.get(e.club_id) || '',
            clubId: e.club_id,
            totalMembers: stats.total,
            postHolders: stats.postHolders,
            regularMembers: stats.total - stats.postHolders,
            participantCount: partCounts.get(e.id) || 0,
          };
        });
      setRows(reportRows);

      // Events per club chart
      const epc = cList.map(c => ({
        name: c.name.length > 10 ? c.name.slice(0, 10) + '…' : c.name,
        events: eList.filter(e => e.club_id === c.id).length,
      })).filter(c => c.events > 0);
      setEventsPerClub(epc);

      // Programme distribution
      const progMap = new Map<string, number>();
      pList.forEach(p => {
        const prog = p.programme || 'Other';
        progMap.set(prog, (progMap.get(prog) || 0) + 1);
      });
      setProgrammeData(Array.from(progMap.entries()).map(([name, value]) => ({ name, value })).filter(p => p.name));

      setLoading(false);
    };
    fetch();
  }, [isAdmin]);

  const filteredRows = useMemo(() => {
    let r = rows;
    if (clubFilter !== 'all') r = r.filter(row => row.clubId === clubFilter);
    if (searchQuery) r = r.filter(row => row.eventName.toLowerCase().includes(searchQuery.toLowerCase()) || row.clubName.toLowerCase().includes(searchQuery.toLowerCase()));
    return r;
  }, [rows, clubFilter, searchQuery]);

  const exportCSV = () => {
    const headers = ['Event Name', 'Date', 'Club', 'Total Members', 'Post-holders', 'Regular Members', 'Participants'];
    const csvRows = filteredRows.map(r => [
      r.eventName,
      new Date(r.eventDate).toLocaleDateString(),
      r.clubName,
      r.totalMembers,
      r.postHolders,
      r.regularMembers,
      r.participantCount,
    ].join(','));
    const csv = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `global_report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center dashboard-corner-gradient">
        <div className="w-8 h-8 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center dashboard-corner-gradient">
        <div className="glass-card p-8 text-center max-w-md">
          <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Restricted Access</h2>
          <p className="text-muted-foreground mb-4">Only Super Admins can view Global Reports.</p>
          <button onClick={() => navigate('/dashboard')} className="px-6 py-2 rounded-full gradient-gold text-primary-foreground font-medium">Go to Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <div className={isMobile ? 'min-h-screen relative antialiased p-6 pb-24 md:p-8 dashboard-corner-gradient text-foreground' : 'h-full overflow-auto p-1 text-foreground'}>
      {isMobile && (
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute top-[-8%] left-[-8%] w-[550px] h-[550px] rounded-full mix-blend-multiply filter blur-[100px] opacity-80 animate-blob" style={{ backgroundColor: 'hsl(45 90% 85% / 0.9)' }} />
          <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] rounded-full mix-blend-multiply filter blur-[100px] opacity-70 animate-blob animation-delay-2000" style={{ backgroundColor: 'hsl(28 70% 70% / 0.45)' }} />
        </div>
      )}

      {/* Header */}
      <header className="relative z-20 flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/super-admin')} className="p-2 rounded-lg hover:bg-secondary transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="glass-input rounded-full py-2 pl-10 pr-4 w-64 focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            />
          </div>
        </div>
        <ProfileDropdown viewMode="personal" />
      </header>

      {/* Title + Filters */}
      <section className="mb-6">
        <h1 className="text-3xl font-bold mb-5 text-foreground">Global Reports & Management</h1>
        <div className="flex flex-wrap gap-3">
          <Select value={clubFilter} onValueChange={setClubFilter}>
            <SelectTrigger className="glass-input rounded-xl px-4 py-2.5 text-sm font-medium w-[200px] border-none focus:ring-2 focus:ring-ring">
              <SelectValue placeholder="All Clubs" />
            </SelectTrigger>
            <SelectContent className="glass-card border-none rounded-2xl shadow-elevated backdrop-blur-[24px]">
              <SelectItem value="all" className="rounded-lg focus:bg-accent/60">All Clubs</SelectItem>
              {clubs.map(c => (
                <SelectItem key={c.id} value={c.id} className="rounded-lg focus:bg-accent/60">{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </section>

      {/* Main Layout */}
      <main className="flex flex-col xl:flex-row gap-6">
        {/* Table Section */}
        <section className="glass-card p-6 flex-1 overflow-hidden flex flex-col">
          <div className="flex justify-end items-center gap-3 mb-4">
            <button onClick={exportCSV} className="flex items-center gap-2 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors text-foreground">
              <Download className="w-4 h-4" /> Export to Excel
            </button>
          </div>
          <div className="overflow-x-auto flex-1 rounded-xl border border-border/30">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-accent/60 text-foreground border-b border-border/40">
                <tr>
                  <th className="px-4 py-3 font-semibold" colSpan={2}>Event Schedules</th>
                  <th className="px-4 py-3 font-semibold border-l border-border/30">Participating Club</th>
                  <th className="px-4 py-3 font-semibold border-l border-border/30">Club Membership Stats</th>
                  <th className="px-4 py-3 font-semibold border-l border-border/30">Participants</th>
                </tr>
                <tr className="text-xs text-muted-foreground bg-accent/30 border-b border-border/30">
                  <th className="px-4 py-2 font-medium">Name</th>
                  <th className="px-4 py-2 font-medium">Timing</th>
                  <th className="px-4 py-2 font-medium border-l border-border/30"></th>
                  <th className="px-4 py-2 font-medium border-l border-border/30">Total Members</th>
                  <th className="px-4 py-2 font-medium border-l border-border/30">Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Loading...</td></tr>
                ) : filteredRows.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">No events found</td></tr>
                ) : (
                  filteredRows.map((row, i) => (
                    <tr key={i} className="hover:bg-white/20 transition-colors">
                      <td className="px-4 py-3 font-medium">{row.eventName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{new Date(row.eventDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })}</td>
                      <td className="px-4 py-3 border-l border-border/20">{row.clubName}</td>
                      <td className="px-4 py-3 border-l border-border/20 text-xs">
                        {row.totalMembers} ({row.postHolders} Post-holders / {row.regularMembers} Regular)
                      </td>
                      <td className="px-4 py-3 border-l border-border/20">
                        <Badge variant="secondary">{row.participantCount}</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Statistics Sidebar */}
        <aside className="glass-card p-6 w-full xl:w-[320px] shrink-0 flex flex-col gap-8">
          <h2 className="text-xl font-bold text-foreground">Statistics</h2>

          {/* Bar Chart */}
          <div>
            <h3 className="text-sm font-medium mb-4 text-foreground">Events Conducted per Club</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={eventsPerClub} barSize={28} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <XAxis dataKey="name" tick={{ fontSize: 9 }} interval={0} angle={-20} textAnchor="end" height={40} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: 12 }} />
                <Bar dataKey="events" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Pie Chart */}
          <div>
            <h3 className="text-sm font-medium mb-4 text-foreground">Member Distribution</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={programmeData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name }) => name}>
                  {programmeData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </aside>
      </main>
      {isMobile && <MobileBottomNav />}
    </div>
  );
};

export default GlobalReports;
