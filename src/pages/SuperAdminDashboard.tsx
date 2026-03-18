import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSuperAdminStats } from '@/hooks/useSuperAdminStats';
import { Search, Plus, Settings, TrendingUp, Users, Calendar, Building2, Clock, ChevronDown, Eye, UserCog, Shield, FileText, MoreVertical, Trash2, ChevronRight } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import ProfileDropdown from '@/components/dashboard/ProfileDropdown';
import SuperAdminCalendar from '@/components/dashboard/SuperAdminCalendar';
import { useToast } from '@/hooks/use-toast';

import { useIsMobile } from '@/hooks/use-mobile';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';

const roleLabelMap: Record<string, string> = {
  admin: 'Admin',
  president: 'President',
  vice_president: 'Vice President',
  secretary: 'Secretary',
  social_media_head: 'Social Media Head',
  member: 'Member'
};

const SuperAdminDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [selectedRoleMember, setSelectedRoleMember] = useState<any>(null);
  const [newRole, setNewRole] = useState('');
  const [createClubOpen, setCreateClubOpen] = useState(false);
  const [newClubName, setNewClubName] = useState('');
  const [newClubDescription, setNewClubDescription] = useState('');
  const [creatingClub, setCreatingClub] = useState(false);
  const [presidentForm, setPresidentForm] = useState({
    fullName: '',
    email: '',
    programme: '',
    section: '',
    year: '',
    rollNo: '',
    phone: '',
  });
  const { toast } = useToast();

  const { totalClubs, globalMembers, totalEvents, clubs, members, upcomingEvents, growthData, loading } = useSuperAdminStats();

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

  if (authLoading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center dashboard-corner-gradient">
        <div className="w-8 h-8 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>);
  }

  if (!user) return <Navigate to="/" replace />;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center dashboard-corner-gradient">
        <div className="glass-card p-8 text-center max-w-md">
          <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Restricted Access</h2>
          <p className="text-muted-foreground mb-4">You don't have Super Admin privileges.</p>
          <button onClick={() => navigate('/dashboard')} className="px-6 py-2 rounded-full gradient-gold text-primary-foreground font-medium">
            Go to Dashboard
          </button>
        </div>
      </div>);
  }

  const handleChangeRole = async () => {
    if (!selectedRoleMember || !newRole) return;
    await supabase
    .from('club_members')
    .update({ role: newRole as any })
    .eq('id', selectedRoleMember.membership_id);
    setRoleDialogOpen(false);
    setSelectedRoleMember(null);
    setNewRole('');
    window.location.reload();
  };

  const handleCreateClub = async () => {
    if (!newClubName.trim() || !presidentForm.fullName.trim() || !presidentForm.email.trim() || !presidentForm.programme.trim() || !presidentForm.year.trim()) {
      toast({ title: 'Missing fields', description: 'Club name and president details (Name, Email, Programme, Year) are required.', variant: 'destructive' });
      return;
    }
    setCreatingClub(true);

    const { data: clubData, error: clubError } = await supabase.from('clubs').insert({
      name: newClubName.trim(),
      description: newClubDescription.trim() || null,
      created_by: user!.id,
    }).select('id').single();

    if (clubError || !clubData) {
      toast({ title: 'Error creating club', description: clubError?.message || 'Unknown error', variant: 'destructive' });
      setCreatingClub(false);
      return;
    }

    const { data: fnData, error: fnError } = await supabase.functions.invoke('create-member', {
      body: {
        email: presidentForm.email.trim(),
        full_name: presidentForm.fullName.trim(),
        programme: presidentForm.programme.trim(),
        section: presidentForm.section.trim(),
        year: presidentForm.year.trim(),
        roll_no: presidentForm.rollNo.trim(),
        phone: presidentForm.phone.trim(),
        club_id: clubData.id,
        role: 'president',
      },
    });

    if (fnError || fnData?.error) {
      await supabase.from('clubs').delete().eq('id', clubData.id);
      toast({ title: 'Error adding president', description: fnData?.error || fnError?.message || 'Failed to create president account', variant: 'destructive' });
      setCreatingClub(false);
      return;
    }

    const action = fnData?.action;
    const presidentMsg = action === 'added_existing' 
      ? `${presidentForm.fullName} (existing user) has been assigned as President.`
      : `${presidentForm.fullName} has been added as President. They can log in using "Forgot Password" to set their credentials.`;
    toast({ title: 'Club created!', description: `${newClubName} has been created. ${presidentMsg}` });
    setCreateClubOpen(false);
    setNewClubName('');
    setNewClubDescription('');
    setPresidentForm({ fullName: '', email: '', programme: '', section: '', year: '', rollNo: '', phone: '' });
    setCreatingClub(false);
    window.location.reload();
  };

  const handleDeleteClub = async (clubId: string, clubName: string) => {
    if (!confirm(`Are you sure you want to delete "${clubName}"? This will remove all members, events, and data associated with this club.`)) return;
    const { error } = await supabase.from('clubs').delete().eq('id', clubId);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Club deleted', description: `${clubName} has been removed.` });
      window.location.reload();
    }
  };

  const filteredClubs = clubs.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredMembers = members.filter((m) =>
    m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.club_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const uniqueMembers = Array.from(
    filteredMembers.reduce((map, m) => {
      if (!map.has(m.user_id)) map.set(m.user_id, m);
      return map;
    }, new Map()).values()
  );

  const statsCards = [
    { label: 'Total Active Clubs', value: totalClubs, icon: Building2, path: 'M0,25 C30,25 30,10 50,10 S70,20 100,5' },
    { label: 'Global Member Count', value: globalMembers, icon: Users, path: 'M0,25 C20,28 40,5 60,15 S80,5 100,10' },
    { label: 'Total Events Managed', value: totalEvents, icon: Calendar, path: 'M0,20 C30,20 40,25 60,10 S90,5 100,5' },
  ];

  const statIcons = [Building2, Users, Calendar];

  // ──── Shared dialogs (used by both mobile & desktop) ────
  const renderDialogs = () => (
    <>
      {/* View Profile Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Member Profile</DialogTitle>
            <DialogDescription>Full details for this member</DialogDescription>
          </DialogHeader>
          {selectedMember &&
          <div className="space-y-3">
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={selectedMember.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
                    {selectedMember.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-bold text-lg">{selectedMember.full_name}</h3>
                  <Badge variant="secondary">{roleLabelMap[selectedMember.role] || selectedMember.role}</Badge>
                  <p className="text-xs text-muted-foreground mt-1">{selectedMember.club_name}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {selectedMember.email && <><span className="text-muted-foreground">Email:</span><span>{selectedMember.email}</span></>}
                {selectedMember.roll_no && <><span className="text-muted-foreground">Roll No:</span><span>{selectedMember.roll_no}</span></>}
                {selectedMember.programme && <><span className="text-muted-foreground">Programme:</span><span>{selectedMember.programme}</span></>}
                {selectedMember.section && <><span className="text-muted-foreground">Section:</span><span>{selectedMember.section}</span></>}
                {selectedMember.year && <><span className="text-muted-foreground">Year:</span><span>{selectedMember.year}</span></>}
                {selectedMember.semester && <><span className="text-muted-foreground">Semester:</span><span>{selectedMember.semester}</span></>}
                {selectedMember.phone && <><span className="text-muted-foreground">Phone:</span><span>{selectedMember.phone}</span></>}
              </div>
            </div>
          }
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>
              Update role for {selectedRoleMember?.full_name} in {selectedRoleMember?.club_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(roleLabelMap).filter(([k]) => k !== 'admin').map(([key, label]) =>
                <SelectItem key={key} value={key}>{label}</SelectItem>
                )}
              </SelectContent>
            </Select>
            <button
              onClick={handleChangeRole}
              className="w-full py-2 rounded-lg gradient-gold text-primary-foreground font-medium text-sm">
              Save Role
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Club Dialog */}
      <Dialog open={createClubOpen} onOpenChange={setCreateClubOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Club</DialogTitle>
            <DialogDescription>Add a new club with its president. All president details are required.</DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" /> Club Details
              </h3>
              <div>
                <Label>Club Name <span className="text-destructive">*</span></Label>
                <Input value={newClubName} onChange={(e) => setNewClubName(e.target.value)} placeholder="e.g. Finance Club" className="mt-1" />
              </div>
              <div>
                <Label>Description (optional)</Label>
                <Textarea value={newClubDescription} onChange={(e) => setNewClubDescription(e.target.value)} placeholder="Brief description..." className="mt-1" rows={2} />
              </div>
            </div>

            <div className="space-y-3 border-t border-border/40 pt-4">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" /> President Details
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Label>Full Name <span className="text-destructive">*</span></Label>
                  <Input value={presidentForm.fullName} onChange={(e) => setPresidentForm(p => ({ ...p, fullName: e.target.value }))} placeholder="President's full name" className="mt-1" />
                </div>
                <div className="col-span-2">
                  <Label>Email <span className="text-destructive">*</span></Label>
                  <Input type="email" value={presidentForm.email} onChange={(e) => setPresidentForm(p => ({ ...p, email: e.target.value }))} placeholder="president@example.com" className="mt-1" />
                </div>
                <div>
                  <Label>Programme <span className="text-destructive">*</span></Label>
                  <Input value={presidentForm.programme} onChange={(e) => setPresidentForm(p => ({ ...p, programme: e.target.value }))} placeholder="e.g. BCA, BBA" className="mt-1" />
                </div>
                <div>
                  <Label>Year <span className="text-destructive">*</span></Label>
                  <Input value={presidentForm.year} onChange={(e) => setPresidentForm(p => ({ ...p, year: e.target.value }))} placeholder="e.g. 2nd Year" className="mt-1" />
                </div>
                <div>
                  <Label>Section</Label>
                  <Input value={presidentForm.section} onChange={(e) => setPresidentForm(p => ({ ...p, section: e.target.value }))} placeholder="e.g. A" className="mt-1" />
                </div>
                <div>
                  <Label>Roll No</Label>
                  <Input value={presidentForm.rollNo} onChange={(e) => setPresidentForm(p => ({ ...p, rollNo: e.target.value }))} placeholder="e.g. 2301234" className="mt-1" />
                </div>
                <div className="col-span-2">
                  <Label>Phone</Label>
                  <Input value={presidentForm.phone} onChange={(e) => setPresidentForm(p => ({ ...p, phone: e.target.value }))} placeholder="e.g. 9876543210" className="mt-1" />
                </div>
              </div>
            </div>

            <button
              onClick={handleCreateClub}
              disabled={creatingClub || !newClubName.trim() || !presidentForm.fullName.trim() || !presidentForm.email.trim() || !presidentForm.programme.trim() || !presidentForm.year.trim()}
              className="w-full py-2.5 rounded-lg gradient-gold text-primary-foreground font-medium text-sm disabled:opacity-50"
            >
              {creatingClub ? 'Creating Club & President...' : 'Create Club with President'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );

  // ──── MOBILE VIEW ────
  if (isMobile) {
    return (
      <div
        className="min-h-screen pb-24 dashboard-corner-gradient overflow-x-hidden"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style>{`div::-webkit-scrollbar { display: none; }`}</style>

        {/* Background blobs */}
        <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
          <div className="absolute top-[-8%] left-[-8%] w-[300px] h-[300px] rounded-full mix-blend-multiply filter blur-[80px] opacity-60 animate-blob" style={{ backgroundColor: 'hsl(45 90% 85% / 0.9)' }} />
          <div className="absolute bottom-[20%] right-[-10%] w-[250px] h-[250px] rounded-full mix-blend-multiply filter blur-[80px] opacity-50 animate-blob animation-delay-2000" style={{ backgroundColor: 'hsl(25 80% 82% / 0.8)' }} />
        </div>

        {/* Fixed mobile header */}
        <header className="fixed top-0 left-0 right-0 z-40 px-4 pt-4 pb-3 safe-area-top">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9" />
            <h1 className="text-lg font-bold font-display text-foreground">IILM Club</h1>
            <ProfileDropdown viewMode="personal" />
          </div>
          <p className="text-center text-sm text-muted-foreground mb-1">
            Super Admin <span className="text-gradient-gold font-semibold">Command Center</span>
          </p>
        </header>

        {/* Spacer for fixed header */}
        <div className="h-[120px] safe-area-top" />

        <main className="px-4 py-2 space-y-5">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clubs, members..."
              className="glass-input rounded-full py-2.5 pl-10 pr-4 w-full focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            />
          </div>

          {/* Quick actions row */}
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/global-reports')}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-full gradient-gold text-primary-foreground text-xs font-semibold shadow-gold"
            >
              <FileText className="w-3.5 h-3.5" /> Global Reports
            </button>
            <button
              onClick={() => setCreateClubOpen(true)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-full glass-card text-foreground text-xs font-semibold"
            >
              <Plus className="w-3.5 h-3.5" /> Add Club
            </button>
          </div>

          {/* Stats Row – 2 col grid */}
          <div className="grid grid-cols-2 gap-3">
            {statsCards.map((stat, i) => {
              const Icon = statIcons[i % statIcons.length];
              return (
                <div key={i} className="glass-card p-4 text-center">
                  <Icon className="w-5 h-5 text-primary mx-auto mb-1.5" />
                  <h3 className="text-2xl font-bold text-primary">{loading ? '...' : stat.value}</h3>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mt-0.5">
                    {stat.label}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Club Management */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold font-display text-foreground">Club Management</h3>
              <button
                onClick={() => setCreateClubOpen(true)}
                className="text-xs font-semibold text-primary flex items-center"
              >
                Add New <ChevronRight className="w-3 h-3 ml-0.5" />
              </button>
            </div>
            <div className="space-y-3">
              {loading ? (
                <div className="glass-card p-6 text-center">
                  <p className="text-sm text-muted-foreground">Loading clubs...</p>
                </div>
              ) : filteredClubs.length === 0 ? (
                <div className="glass-card p-6 text-center">
                  <Building2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No clubs found</p>
                </div>
              ) : (
                filteredClubs.map((club) => (
                  <div key={club.id} className="glass-card p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        {club.logo_url ? (
                          <img src={club.logo_url} alt={club.name} className="w-7 h-7 rounded-lg object-cover" />
                        ) : (
                          <span className="text-primary font-bold text-lg">{club.name[0]}</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-foreground truncate">{club.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {club.memberCount} Members • {club.eventCount} Events
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="p-1.5 rounded-lg hover:bg-accent/50 transition-colors outline-none">
                          <MoreVertical className="w-4 h-4 text-muted-foreground" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem
                            onClick={() => handleDeleteClub(club.id, club.name)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Club
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <button
                      onClick={() => navigate(`/club/${club.id}`, { state: { from: 'super-admin' } })}
                      className="w-full text-center text-xs px-3 py-2 rounded-xl font-medium transition-colors bg-accent hover:bg-accent/80 text-accent-foreground"
                    >
                      View More
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Platform Calendar */}
          <SuperAdminCalendar />

          {/* Global Event Feed */}
          <section>
            <h3 className="text-base font-bold font-display text-foreground mb-3">Global Event Feed</h3>
            <div className="space-y-3">
              {loading ? (
                <div className="glass-card p-6 text-center">
                  <p className="text-sm text-muted-foreground">Loading events...</p>
                </div>
              ) : upcomingEvents.length === 0 ? (
                <div className="glass-card p-6 text-center">
                  <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No upcoming events</p>
                </div>
              ) : (
                upcomingEvents.slice(0, 8).map((event) => {
                  const d = new Date(event.event_date);
                  const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
                  const day = d.getDate();
                  return (
                    <div key={event.id} className="glass-card p-4 flex items-center gap-3">
                      <div className="flex flex-col items-center justify-center w-12 h-14 rounded-2xl bg-primary/10 shrink-0">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{month}</span>
                        <span className="text-xl font-bold leading-none text-primary">{day}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-foreground truncate">{event.name}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {event.club_name} • {d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {event.participant_count} participants
                        </p>
                      </div>
                      <div className="w-2 h-2 rounded-full bg-primary/60 shrink-0" />
                    </div>
                  );
                })
              )}
            </div>
          </section>
        </main>

        <MobileBottomNav />
        {renderDialogs()}
        <FloatingChatWidget />
      </div>
    );
  }

  // ──── DESKTOP VIEW (unchanged) ────
  return (
    <div className="min-h-screen relative antialiased p-6 md:p-8 dashboard-corner-gradient text-foreground" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
      <style>{`div::-webkit-scrollbar { display: none; }`}</style>

      {/* Background blobs */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-8%] left-[-8%] w-[550px] h-[550px] rounded-full mix-blend-multiply filter blur-[100px] opacity-80 animate-blob" style={{ backgroundColor: 'hsl(45 90% 85% / 0.9)' }} />
        <div className="absolute top-[-5%] right-[-5%] w-[450px] h-[450px] rounded-full mix-blend-multiply filter blur-[90px] opacity-70 animate-blob animation-delay-2000" style={{ backgroundColor: 'hsl(25 80% 82% / 0.8)' }} />
        <div className="absolute bottom-[-8%] left-[-5%] w-[500px] h-[500px] rounded-full mix-blend-multiply filter blur-[100px] opacity-60 animate-blob animation-delay-4000" style={{ backgroundColor: 'hsl(35 75% 78% / 0.6)' }} />
      </div>

      {/* Header */}
      <header className="relative z-20 flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-2xl font-bold font-display text-foreground">
          Super Admin <span className="text-gradient-gold">Command Center</span>
        </h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="glass-input rounded-full py-2 pl-10 pr-4 w-64 focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
          </div>
          <button
            onClick={() => navigate('/global-reports')}
            className="px-4 py-2 rounded-full font-medium flex items-center gap-2 text-sm bg-primary hover:bg-primary/90 text-primary-foreground transition-colors">
            <FileText className="w-4 h-4" /> Global Reports
          </button>
          <ProfileDropdown viewMode="personal" />
        </div>
      </header>

      {/* Stats Row */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statsCards.map((stat, i) =>
        <div key={i} className="glass-card p-6 flex flex-col justify-between h-32 relative overflow-hidden group hover:bg-white/50 transition-colors">
            <div>
              <p className="text-sm mb-1 text-muted-foreground">{stat.label}</p>
              <div className="flex items-center gap-2">
                <h3 className="text-3xl font-bold text-foreground">{loading ? '...' : stat.value}</h3>
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
            </div>
            <svg className="absolute bottom-4 right-4 w-24 h-12 text-primary/50" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 100 30">
              <path d={stat.path} strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
      </section>

      {/* Club Management */}
      <div className="mb-6">
        <section className="glass-card p-5 flex flex-col max-h-[500px]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-foreground">Club Management</h2>
            <button
              onClick={() => setCreateClubOpen(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors gradient-gold text-primary-foreground shadow-gold"
            >
              <Plus className="w-3.5 h-3.5" /> Add Club
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto pr-2 flex-1" style={{ scrollbarWidth: 'none' }}>
            {loading ?
            <p className="text-muted-foreground col-span-3 text-center py-8">Loading clubs...</p> :
            filteredClubs.length === 0 ?
            <p className="text-muted-foreground col-span-3 text-center py-8">No clubs found</p> :

            filteredClubs.map((club) =>
            <div key={club.id} className="rounded-xl p-4 border border-border/50 bg-card shadow-card relative">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      {club.logo_url ?
                  <img src={club.logo_url} alt={club.name} className="w-8 h-8 rounded-full object-cover" /> :
                  <span className="text-primary font-bold text-lg">{club.name[0]}</span>
                  }
                    </div>
                    <h4 className="font-bold text-foreground leading-tight flex-1">{club.name}</h4>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="p-1 rounded-lg hover:bg-accent/50 transition-colors outline-none">
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                          onClick={() => handleDeleteClub(club.id, club.name)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Club
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1 mb-4">
                    <p>Members: {club.memberCount}</p>
                    <p>Events: {club.eventCount}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                  onClick={() => navigate(`/club/${club.id}`, { state: { from: 'super-admin' } })}
                  className="flex-[1.5] text-center text-xs px-3 py-1.5 rounded-lg font-medium transition-colors bg-accent hover:bg-accent/80 text-accent-foreground">
                      View More
                    </button>
                  </div>
                </div>
            )
            }
          </div>
        </section>
      </div>

      {/* Platform-wide Event Calendar */}
      <div className="mb-6">
        <SuperAdminCalendar />
      </div>

      {/* Global Event Feed */}
      <section className="glass-card p-5">
        <h2 className="text-lg font-semibold text-foreground mb-4">Global Event Feed</h2>
        <div className="flex gap-6 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {loading ?
          <p className="text-muted-foreground py-4">Loading events...</p> :
          upcomingEvents.length === 0 ?
          <p className="text-muted-foreground py-4">No upcoming events</p> :

          upcomingEvents.map((event, i) => {
            const d = new Date(event.event_date);
            return (
              <div key={event.id} className="shrink-0 border-l-2 pl-4 py-1" style={{ borderColor: i === 0 ? 'hsl(var(--primary))' : 'hsl(var(--border))' }}>
                  <h4 className="font-semibold text-foreground text-sm mb-1">
                    {event.name} ({event.club_name}) - {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </h4>
                  <div className="flex items-center text-xs text-muted-foreground gap-4">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {event.participant_count} Participants</span>
                  </div>
                </div>);
          })
          }
        </div>
      </section>

      {renderDialogs()}
      <FloatingChatWidget />
    </div>);
};

export default SuperAdminDashboard;
