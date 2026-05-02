import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useSuperAdminStats } from '@/hooks/useSuperAdminStats';
import { Search, Plus, Settings, TrendingUp, Users, Calendar, Building2, Clock, ChevronDown, Eye, UserCog, Shield, FileText, MoreVertical, Trash2, ChevronRight, Pencil, Download, Crown } from 'lucide-react';
import VerifiedBadge, { getRoleBadgeVariant } from '@/components/ui/VerifiedBadge';
import * as XLSX from 'xlsx';
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
  const NB = { font: "'Space Grotesk', sans-serif", bg: '#F4EFE7', card: '#FFFDF5', border: '#111', orange: '#E98A3A' };
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
    phone: ''
  });
  const { toast } = useToast();

  // Edit profile state
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editProfileData, setEditProfileData] = useState({ full_name: '', programme: '', section: '', year: '', roll_no: '', phone: '' });
  const [savingProfile, setSavingProfile] = useState(false);

  // Edit club state
  const [editClubOpen, setEditClubOpen] = useState(false);
  const [editClubData, setEditClubData] = useState({ id: '', name: '', description: '', about: '', category: '', social_instagram: '', social_linkedin: '' });
  const [savingClub, setSavingClub] = useState(false);

  // Export state
  const [exporting, setExporting] = useState(false);

  // President management state
  const [presidentDialogOpen, setPresidentDialogOpen] = useState(false);
  const [presidentClub, setPresidentClub] = useState<any>(null);
  const [presidentMode, setPresidentMode] = useState<'view' | 'add' | 'edit' | 'replace'>('view');
  const [presidentFormData, setPresidentFormData] = useState({ fullName: '', email: '', programme: '', section: '', year: '', rollNo: '', phone: '' });
  const [savingPresident, setSavingPresident] = useState(false);
  const [removeOnReplace, setRemoveOnReplace] = useState(false);
  const [presidentAddMode, setPresidentAddMode] = useState<'search' | 'manual'>('search');
  const [presidentSearch, setPresidentSearch] = useState('');
  const [presidentSearchResults, setPresidentSearchResults] = useState<any[]>([]);
  const [presidentSearchLoading, setPresidentSearchLoading] = useState(false);

  const { totalClubs, globalMembers, totalEvents, clubs, members, upcomingEvents, growthData, loading } = useSuperAdminStats();

  // Check admin role
  useEffect(() => {
    if (!user) return;
    const checkAdmin = async () => {
      const { data } = await supabase.
      from('user_roles').
      select('role').
      eq('user_id', user.id).
      eq('role', 'admin');
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
    await supabase.
    from('club_members').
    update({ role: newRole as any }).
    eq('id', selectedRoleMember.membership_id);
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
      created_by: user!.id
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
        role: 'president'
      }
    });

    if (fnError || fnData?.error) {
      await supabase.from('clubs').delete().eq('id', clubData.id);
      toast({ title: 'Error adding president', description: fnData?.error || fnError?.message || 'Failed to create president account', variant: 'destructive' });
      setCreatingClub(false);
      return;
    }

    const action = fnData?.action;
    const presidentMsg = action === 'added_existing' ?
    `${presidentForm.fullName} (existing user) has been assigned as President.` :
    `${presidentForm.fullName} has been added as President. They can log in using "Forgot Password" to set their credentials.`;
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

  const handleEditProfile = (member: any) => {
    setEditProfileData({
      full_name: member.full_name || '',
      programme: member.programme || '',
      section: member.section || '',
      year: member.year || '',
      roll_no: member.roll_no || '',
      phone: member.phone || '',
    });
    setSelectedMember(member);
    setEditProfileOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!selectedMember) return;
    setSavingProfile(true);
    const { error } = await supabase.functions.invoke('manage-outsider', {
      body: { action: 'update', user_id: selectedMember.user_id, ...editProfileData },
    });
    if (error) {
      toast({ title: 'Error', description: 'Failed to update profile', variant: 'destructive' });
    } else {
      toast({ title: 'Profile updated' });
      setEditProfileOpen(false);
      setProfileDialogOpen(false);
      window.location.reload();
    }
    setSavingProfile(false);
  };

  const handleEditClub = (club: any) => {
    setEditClubData({
      id: club.id,
      name: club.name || '',
      description: club.description || '',
      about: club.about || '',
      category: club.category || '',
      social_instagram: club.social_instagram || '',
      social_linkedin: club.social_linkedin || '',
    });
    setEditClubOpen(true);
  };

  const handleSaveClub = async () => {
    setSavingClub(true);
    const { id, ...updates } = editClubData;
    const { error } = await supabase.from('clubs').update({
      name: updates.name,
      description: updates.description || null,
      about: updates.about || null,
      category: updates.category || null,
      social_instagram: updates.social_instagram || null,
      social_linkedin: updates.social_linkedin || null,
    }).eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Club updated' });
      setEditClubOpen(false);
      window.location.reload();
    }
    setSavingClub(false);
  };

  // ── President Management ──
  const handleOpenPresidentDialog = (club: any) => {
    setPresidentClub(club);
    setPresidentFormData({ fullName: '', email: '', programme: '', section: '', year: '', rollNo: '', phone: '' });
    setRemoveOnReplace(false);
    setPresidentMode(club.president ? 'view' : 'add');
    setPresidentDialogOpen(true);
  };

  const handleAddOrReplacePresident = async () => {
    if (!presidentClub || !presidentFormData.fullName.trim() || !presidentFormData.email.trim()) return;
    setSavingPresident(true);

    // If replacing, demote or remove the old president first
    if (presidentMode === 'replace' && presidentClub.president) {
      if (removeOnReplace) {
        await supabase.from('club_members').delete().eq('user_id', presidentClub.president.user_id).eq('club_id', presidentClub.id);
      } else {
        await supabase.from('club_members').update({ role: 'member' as any }).eq('user_id', presidentClub.president.user_id).eq('club_id', presidentClub.id);
      }
    }

    const { data: fnData, error: fnError } = await supabase.functions.invoke('create-member', {
      body: {
        email: presidentFormData.email.trim(),
        full_name: presidentFormData.fullName.trim(),
        programme: presidentFormData.programme.trim(),
        section: presidentFormData.section.trim(),
        year: presidentFormData.year.trim(),
        roll_no: presidentFormData.rollNo.trim(),
        phone: presidentFormData.phone.trim(),
        club_id: presidentClub.id,
        role: 'president',
      },
    });

    if (fnError || fnData?.error) {
      toast({ title: 'Error', description: fnData?.error || fnError?.message || 'Failed', variant: 'destructive' });
    } else {
      toast({ title: 'President updated', description: `${presidentFormData.fullName} is now President of ${presidentClub.name}` });
      setPresidentDialogOpen(false);
      window.location.reload();
    }
    setSavingPresident(false);
  };

  const handleEditPresidentDetails = async () => {
    if (!presidentClub?.president) return;
    setSavingPresident(true);
    const { error } = await supabase.functions.invoke('manage-outsider', {
      body: {
        action: 'update',
        user_id: presidentClub.president.user_id,
        full_name: presidentFormData.fullName || undefined,
        programme: presidentFormData.programme || undefined,
        section: presidentFormData.section || undefined,
        year: presidentFormData.year || undefined,
        roll_no: presidentFormData.rollNo || undefined,
        phone: presidentFormData.phone || undefined,
      },
    });
    if (error) {
      toast({ title: 'Error', description: 'Failed to update president details', variant: 'destructive' });
    } else {
      toast({ title: 'President details updated' });
      setPresidentDialogOpen(false);
      window.location.reload();
    }
    setSavingPresident(false);
  };

  const handleRemovePresident = async () => {
    if (!presidentClub?.president) return;
    if (!confirm(`Remove ${presidentClub.president.full_name} as President? They will be demoted to member.`)) return;
    setSavingPresident(true);
    await supabase.from('club_members').update({ role: 'member' as any }).eq('user_id', presidentClub.president.user_id).eq('club_id', presidentClub.id);
    toast({ title: 'President removed', description: `${presidentClub.president.full_name} has been demoted to member.` });
    setPresidentDialogOpen(false);
    window.location.reload();
    setSavingPresident(false);
  };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const wb = XLSX.utils.book_new();

      // Clubs sheet
      const clubRows = clubs.map(c => ({ Name: c.name, Members: c.memberCount, Events: c.eventCount }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(clubRows), 'Clubs');

      // Members sheet
      const memberRows = members.map(m => ({
        Name: m.full_name, Email: m.email, Club: m.club_name, Role: roleLabelMap[m.role] || m.role,
        Programme: m.programme || '', Year: m.year || '', 'Roll No': m.roll_no || '', Phone: m.phone || '',
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(memberRows), 'All Members');

      // Events sheet
      const eventRows = upcomingEvents.map(e => ({
        Name: e.name, Club: e.club_name, Date: new Date(e.event_date).toLocaleDateString(),
        Participants: e.participant_count,
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(eventRows), 'Events');

      XLSX.writeFile(wb, `IILM_Club_Data_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast({ title: 'Export complete', description: 'Data downloaded as Excel file' });
    } catch (err: any) {
      toast({ title: 'Export failed', description: err.message, variant: 'destructive' });
    }
    setExporting(false);
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
  { label: 'Total Events Managed', value: totalEvents, icon: Calendar, path: 'M0,20 C30,20 40,25 60,10 S90,5 100,5' }];


  const statIcons = [Building2, Users, Calendar];

  // ──── Shared dialogs (used by both mobile & desktop) ────
  const renderDialogs = () =>
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
                  <h3 className="font-bold text-lg inline-flex items-center">{selectedMember.full_name}{getRoleBadgeVariant(selectedMember.role) && <VerifiedBadge variant={getRoleBadgeVariant(selectedMember.role)!} />}</h3>
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
              <div className="flex gap-2 mt-2">
                <button onClick={() => handleEditProfile(selectedMember)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors">
                  <Pencil className="w-3.5 h-3.5" /> Edit Profile
                </button>
                <button onClick={() => { setSelectedRoleMember(selectedMember); setNewRole(selectedMember.role); setRoleDialogOpen(true); }} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/80 transition-colors">
                  <Shield className="w-3.5 h-3.5" /> Change Role
                </button>
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
                  <Input value={presidentForm.fullName} onChange={(e) => setPresidentForm((p) => ({ ...p, fullName: e.target.value }))} placeholder="President's full name" className="mt-1" />
                </div>
                <div className="col-span-2">
                  <Label>Email <span className="text-destructive">*</span></Label>
                  <Input type="email" value={presidentForm.email} onChange={(e) => setPresidentForm((p) => ({ ...p, email: e.target.value }))} placeholder="president@example.com" className="mt-1" />
                </div>
                <div>
                  <Label>Programme <span className="text-destructive">*</span></Label>
                  <Input value={presidentForm.programme} onChange={(e) => setPresidentForm((p) => ({ ...p, programme: e.target.value }))} placeholder="e.g. BCA, BBA" className="mt-1" />
                </div>
                <div>
                  <Label>Year <span className="text-destructive">*</span></Label>
                  <Input value={presidentForm.year} onChange={(e) => setPresidentForm((p) => ({ ...p, year: e.target.value }))} placeholder="e.g. 2nd Year" className="mt-1" />
                </div>
                <div>
                  <Label>Section</Label>
                  <Input value={presidentForm.section} onChange={(e) => setPresidentForm((p) => ({ ...p, section: e.target.value }))} placeholder="e.g. A" className="mt-1" />
                </div>
                <div>
                  <Label>Roll No</Label>
                  <Input value={presidentForm.rollNo} onChange={(e) => setPresidentForm((p) => ({ ...p, rollNo: e.target.value }))} placeholder="e.g. 2301234" className="mt-1" />
                </div>
                <div className="col-span-2">
                  <Label>Phone</Label>
                  <Input value={presidentForm.phone} onChange={(e) => setPresidentForm((p) => ({ ...p, phone: e.target.value }))} placeholder="e.g. 9876543210" className="mt-1" />
                </div>
              </div>
            </div>

            <button
            onClick={handleCreateClub}
            disabled={creatingClub || !newClubName.trim() || !presidentForm.fullName.trim() || !presidentForm.email.trim() || !presidentForm.programme.trim() || !presidentForm.year.trim()}
            className="w-full py-2.5 rounded-lg gradient-gold text-primary-foreground font-medium text-sm disabled:opacity-50">
            
              {creatingClub ? 'Creating Club & President...' : 'Create Club with President'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    

      {/* Edit Profile Dialog */}
      <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Member Profile</DialogTitle>
            <DialogDescription>Update details for {selectedMember?.full_name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Full Name</Label><Input value={editProfileData.full_name} onChange={e => setEditProfileData(p => ({ ...p, full_name: e.target.value }))} className="mt-1" /></div>
            <div><Label>Programme</Label><Input value={editProfileData.programme} onChange={e => setEditProfileData(p => ({ ...p, programme: e.target.value }))} className="mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Section</Label><Input value={editProfileData.section} onChange={e => setEditProfileData(p => ({ ...p, section: e.target.value }))} className="mt-1" /></div>
              <div><Label>Year</Label><Input value={editProfileData.year} onChange={e => setEditProfileData(p => ({ ...p, year: e.target.value }))} className="mt-1" /></div>
            </div>
            <div><Label>Roll No</Label><Input value={editProfileData.roll_no} onChange={e => setEditProfileData(p => ({ ...p, roll_no: e.target.value }))} className="mt-1" /></div>
            <div><Label>Phone</Label><Input value={editProfileData.phone} onChange={e => setEditProfileData(p => ({ ...p, phone: e.target.value }))} className="mt-1" /></div>
            <button onClick={handleSaveProfile} disabled={savingProfile} className="w-full py-2.5 rounded-lg gradient-gold text-primary-foreground font-medium text-sm disabled:opacity-50">
              {savingProfile ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Club Dialog */}
      <Dialog open={editClubOpen} onOpenChange={setEditClubOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Club</DialogTitle>
            <DialogDescription>Update club details</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={editClubData.name} onChange={e => setEditClubData(p => ({ ...p, name: e.target.value }))} className="mt-1" /></div>
            <div><Label>Description</Label><Textarea value={editClubData.description} onChange={e => setEditClubData(p => ({ ...p, description: e.target.value }))} className="mt-1" rows={2} /></div>
            <div><Label>About</Label><Textarea value={editClubData.about} onChange={e => setEditClubData(p => ({ ...p, about: e.target.value }))} className="mt-1" rows={2} /></div>
            <div><Label>Category</Label><Input value={editClubData.category} onChange={e => setEditClubData(p => ({ ...p, category: e.target.value }))} className="mt-1" /></div>
            <div><Label>Instagram</Label><Input value={editClubData.social_instagram} onChange={e => setEditClubData(p => ({ ...p, social_instagram: e.target.value }))} className="mt-1" placeholder="@handle or URL" /></div>
            <div><Label>LinkedIn</Label><Input value={editClubData.social_linkedin} onChange={e => setEditClubData(p => ({ ...p, social_linkedin: e.target.value }))} className="mt-1" placeholder="company slug or URL" /></div>
            <button onClick={handleSaveClub} disabled={savingClub || !editClubData.name.trim()} className="w-full py-2.5 rounded-lg gradient-gold text-primary-foreground font-medium text-sm disabled:opacity-50">
              {savingClub ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage President Dialog */}
      <Dialog open={presidentDialogOpen} onOpenChange={setPresidentDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Crown className="w-5 h-5 text-amber-500" /> Manage President</DialogTitle>
            <DialogDescription>{presidentClub?.name}</DialogDescription>
          </DialogHeader>

          {presidentMode === 'view' && presidentClub?.president && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200/50">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold">
                  {presidentClub.president.full_name?.[0]?.toUpperCase() || '?'}
                </div>
                <div>
                  <p className="font-semibold text-sm">{presidentClub.president.full_name}</p>
                  <p className="text-xs text-muted-foreground">{presidentClub.president.email || 'No email'}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setPresidentMode('edit'); setPresidentFormData({ fullName: presidentClub.president.full_name, email: '', programme: '', section: '', year: '', rollNo: '', phone: '' }); }} className="flex-1 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors flex items-center justify-center gap-1.5">
                  <Pencil className="w-3.5 h-3.5" /> Edit Details
                </button>
                <button onClick={() => { setPresidentMode('replace'); setPresidentFormData({ fullName: '', email: '', programme: '', section: '', year: '', rollNo: '', phone: '' }); }} className="flex-1 py-2 rounded-lg bg-accent text-accent-foreground text-sm font-medium hover:bg-accent/80 transition-colors flex items-center justify-center gap-1.5">
                  <UserCog className="w-3.5 h-3.5" /> Replace
                </button>
              </div>
              <button onClick={handleRemovePresident} disabled={savingPresident} className="w-full py-2 rounded-lg border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/10 transition-colors">
                Remove President (Demote to Member)
              </button>
            </div>
          )}

          {presidentMode === 'edit' && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">Edit the current president's profile details.</p>
              <div><Label>Full Name</Label><Input value={presidentFormData.fullName} onChange={e => setPresidentFormData(p => ({ ...p, fullName: e.target.value }))} className="mt-1" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Programme</Label><Input value={presidentFormData.programme} onChange={e => setPresidentFormData(p => ({ ...p, programme: e.target.value }))} className="mt-1" /></div>
                <div><Label>Year</Label><Input value={presidentFormData.year} onChange={e => setPresidentFormData(p => ({ ...p, year: e.target.value }))} className="mt-1" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Section</Label><Input value={presidentFormData.section} onChange={e => setPresidentFormData(p => ({ ...p, section: e.target.value }))} className="mt-1" /></div>
                <div><Label>Roll No</Label><Input value={presidentFormData.rollNo} onChange={e => setPresidentFormData(p => ({ ...p, rollNo: e.target.value }))} className="mt-1" /></div>
              </div>
              <div><Label>Phone</Label><Input value={presidentFormData.phone} onChange={e => setPresidentFormData(p => ({ ...p, phone: e.target.value }))} className="mt-1" /></div>
              <div className="flex gap-2">
                <button onClick={() => setPresidentMode('view')} className="flex-1 py-2 rounded-lg border border-border text-sm font-medium">Cancel</button>
                <button onClick={handleEditPresidentDetails} disabled={savingPresident} className="flex-1 py-2 rounded-lg gradient-gold text-primary-foreground text-sm font-medium disabled:opacity-50">
                  {savingPresident ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          )}

          {(presidentMode === 'add' || presidentMode === 'replace') && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground">
                {presidentMode === 'add' ? 'No president assigned. Add one below.' : 'Enter the new president\'s details.'}
              </p>
              {presidentMode === 'replace' && (
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input type="checkbox" checked={removeOnReplace} onChange={e => setRemoveOnReplace(e.target.checked)} className="rounded" />
                  Remove old president from club entirely (otherwise demoted to member)
                </label>
              )}

              {/* Toggle: Search / Manual */}
              <div className="flex rounded-lg border border-border/50 overflow-hidden">
                <button
                  onClick={() => { setPresidentAddMode('search'); setPresidentSearch(''); setPresidentSearchResults([]); }}
                  className={`flex-1 py-2 text-xs font-semibold transition-colors ${presidentAddMode === 'search' ? 'bg-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'}`}
                >
                  <Search className="w-3.5 h-3.5 inline mr-1" /> Search User
                </button>
                <button
                  onClick={() => setPresidentAddMode('manual')}
                  className={`flex-1 py-2 text-xs font-semibold transition-colors ${presidentAddMode === 'manual' ? 'bg-primary text-primary-foreground' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'}`}
                >
                  <Pencil className="w-3.5 h-3.5 inline mr-1" /> Add Manually
                </button>
              </div>

              {/* Search mode */}
              {presidentAddMode === 'search' && (
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or email..."
                      value={presidentSearch}
                      onChange={async (e) => {
                        const q = e.target.value;
                        setPresidentSearch(q);
                        if (q.length < 2) { setPresidentSearchResults([]); return; }
                        setPresidentSearchLoading(true);
                        const { data } = await supabase
                          .from('profiles')
                          .select('user_id, full_name, email, programme, year, section, roll_no, phone')
                          .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
                          .limit(10);
                        setPresidentSearchResults(data || []);
                        setPresidentSearchLoading(false);
                      }}
                      className="pl-10"
                    />
                  </div>
                  {presidentSearchLoading && (
                    <div className="flex justify-center py-3">
                      <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                  )}
                  {!presidentSearchLoading && presidentSearchResults.length > 0 && (
                    <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
                      {presidentSearchResults.map(u => (
                        <button
                          key={u.user_id}
                          onClick={() => {
                            setPresidentFormData({
                              fullName: u.full_name || '',
                              email: u.email || '',
                              programme: u.programme || '',
                              year: u.year || '',
                              section: u.section || '',
                              rollNo: u.roll_no || '',
                              phone: u.phone || '',
                            });
                            setPresidentAddMode('manual');
                            toast({ title: `${u.full_name} selected`, description: 'Review details and confirm.' });
                          }}
                          className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-border/40 bg-background hover:bg-accent/30 transition-colors text-left"
                        >
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {u.full_name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{u.full_name}</p>
                            <p className="text-xs text-muted-foreground truncate">{u.email} {u.programme ? `• ${u.programme}` : ''} {u.year || ''}</p>
                          </div>
                          <Crown className="w-4 h-4 text-amber-500 ml-auto shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                  {!presidentSearchLoading && presidentSearch.length >= 2 && presidentSearchResults.length === 0 && (
                    <p className="text-xs text-muted-foreground text-center py-3">No users found. Try manual entry.</p>
                  )}
                  {presidentSearch.length < 2 && (
                    <p className="text-xs text-muted-foreground text-center py-3">Type at least 2 characters to search</p>
                  )}
                </div>
              )}

              {/* Manual mode */}
              {presidentAddMode === 'manual' && (
                <div className="space-y-3">
                  <div><Label>Full Name <span className="text-destructive">*</span></Label><Input value={presidentFormData.fullName} onChange={e => setPresidentFormData(p => ({ ...p, fullName: e.target.value }))} className="mt-1" placeholder="President's full name" /></div>
                  <div><Label>Email <span className="text-destructive">*</span></Label><Input type="email" value={presidentFormData.email} onChange={e => setPresidentFormData(p => ({ ...p, email: e.target.value }))} className="mt-1" placeholder="president@example.com" /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Programme</Label><Input value={presidentFormData.programme} onChange={e => setPresidentFormData(p => ({ ...p, programme: e.target.value }))} className="mt-1" /></div>
                    <div><Label>Year</Label><Input value={presidentFormData.year} onChange={e => setPresidentFormData(p => ({ ...p, year: e.target.value }))} className="mt-1" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Section</Label><Input value={presidentFormData.section} onChange={e => setPresidentFormData(p => ({ ...p, section: e.target.value }))} className="mt-1" /></div>
                    <div><Label>Roll No</Label><Input value={presidentFormData.rollNo} onChange={e => setPresidentFormData(p => ({ ...p, rollNo: e.target.value }))} className="mt-1" /></div>
                  </div>
                  <div><Label>Phone</Label><Input value={presidentFormData.phone} onChange={e => setPresidentFormData(p => ({ ...p, phone: e.target.value }))} className="mt-1" /></div>
                  <div className="flex gap-2">
                    {presidentMode === 'replace' && <button onClick={() => setPresidentMode('view')} className="flex-1 py-2 rounded-lg border border-border text-sm font-medium">Cancel</button>}
                    <button onClick={handleAddOrReplacePresident} disabled={savingPresident || !presidentFormData.fullName.trim() || !presidentFormData.email.trim()} className="flex-1 py-2 rounded-lg gradient-gold text-primary-foreground text-sm font-medium disabled:opacity-50">
                      {savingPresident ? 'Saving...' : presidentMode === 'add' ? 'Add President' : 'Replace President'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>;

  // ──── MOBILE VIEW ────
  if (isMobile) {
    return (
      <div
        className="min-h-screen pb-24 overflow-x-hidden"
        style={{ background: NB.bg, scrollbarWidth: 'none', msOverflowStyle: 'none', fontFamily: NB.font }}>
        
        <style>{`div::-webkit-scrollbar { display: none; }`}</style>

        {/* Fixed mobile header */}
        <header className="fixed top-0 left-0 right-0 z-40 px-4 pt-4 pb-3 safe-area-top" style={{ background: NB.bg, borderBottom: `2px solid ${NB.border}` }}>
          <div className="flex items-center justify-between mb-1">
            <div className="w-9" />
            <h1 className="text-lg font-black" style={{ fontFamily: NB.font, color: NB.border }}>IILM Club</h1>
            <ProfileDropdown viewMode="personal" />
          </div>
          <p className="text-center text-sm font-black" style={{ color: NB.border }}>
            Super Admin <span style={{ color: NB.orange }}>Command Center</span>
          </p>
        </header>

        {/* Spacer for fixed header */}
        <div className="h-[110px] safe-area-top" />

        <main className="px-4 py-2 space-y-5">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#888' }} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search clubs, members..."
              className="py-2.5 pl-10 pr-4 w-full text-sm outline-none"
              style={{ border: `2px solid ${NB.border}`, borderRadius: '10px', background: NB.card, fontFamily: NB.font }} />
          </div>

          {/* Quick actions row */}
          <div className="flex gap-2">
            <button
              onClick={() => setCreateClubOpen(true)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold"
              style={{ background: NB.orange, color: NB.border, border: `2px solid ${NB.border}`, borderRadius: '8px', boxShadow: `3px 3px 0px ${NB.border}`, fontFamily: NB.font }}>
              <Plus className="w-3.5 h-3.5" /> Add Club
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-3">
            {statsCards.map((stat, i) => {
              const Icon = statIcons[i % statIcons.length];
              return (
                <div key={i} className="p-4 text-center" style={{ background: NB.card, border: `2px solid ${NB.border}`, borderRadius: '10px', boxShadow: `3px 3px 0px ${NB.border}` }}>
                  <div className="w-9 h-9 mx-auto mb-1.5 flex items-center justify-center" style={{ background: `${NB.orange}30`, border: `2px solid ${NB.border}`, borderRadius: '8px' }}>
                    <Icon className="w-4 h-4" style={{ color: NB.orange }} />
                  </div>
                  <h3 className="text-2xl font-black" style={{ fontFamily: NB.font, color: NB.border }}>{loading ? '...' : stat.value}</h3>
                  <p className="text-[11px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: '#888' }}>
                    {stat.label}
                  </p>
                </div>);
            })}
          </div>

          {/* Club Management */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-black" style={{ fontFamily: NB.font }}>Club Management</h3>
              <button
                onClick={() => setCreateClubOpen(true)}
                className="text-xs font-bold flex items-center"
                style={{ color: NB.orange }}>
                Add New <ChevronRight className="w-3 h-3 ml-0.5" />
              </button>
            </div>
            <div className="space-y-3">
              {loading ?
              <div className="p-6 text-center" style={{ background: NB.card, border: `2px solid ${NB.border}`, borderRadius: '10px' }}>
                  <p className="text-sm" style={{ color: '#888' }}>Loading clubs...</p>
                </div> :
              filteredClubs.length === 0 ?
              <div className="p-6 text-center" style={{ background: NB.card, border: `2px solid ${NB.border}`, borderRadius: '10px' }}>
                  <Building2 className="w-8 h-8 mx-auto mb-2" style={{ color: '#888' }} />
                  <p className="text-sm" style={{ color: '#888' }}>No clubs found</p>
                </div> :
              filteredClubs.map((club) =>
              <div key={club.id} className="p-4" style={{ background: NB.card, border: `2px solid ${NB.border}`, borderRadius: '10px', boxShadow: `3px 3px 0px ${NB.border}` }}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ background: `${NB.orange}30`, border: `2px solid ${NB.border}`, borderRadius: '8px' }}>
                        {club.logo_url ?
                    <img src={club.logo_url} alt={club.name} className="w-7 h-7 rounded-lg object-cover" /> :
                    <span className="font-black text-lg" style={{ color: NB.orange }}>{club.name[0]}</span>
                    }
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold truncate" style={{ fontFamily: NB.font }}>{club.name}</h4>
                        <p className="text-xs" style={{ color: '#888' }}>
                          {club.memberCount} Members • {club.eventCount} Events
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="p-1.5 outline-none" style={{ borderRadius: '6px' }}>
                          <MoreVertical className="w-4 h-4" style={{ color: '#888' }} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          <DropdownMenuItem onClick={() => handleEditClub(club)}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit Club
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleOpenPresidentDialog(club)}>
                            <Crown className="mr-2 h-4 w-4" /> Manage President
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteClub(club.id, club.name)} className="text-destructive focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Club
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <button
                  onClick={() => navigate(`/club/${club.id}`, { state: { from: 'super-admin' } })}
                  className="w-full text-center text-xs px-3 py-2 font-bold transition-all"
                  style={{ background: NB.border, color: NB.card, border: `2px solid ${NB.border}`, borderRadius: '8px', boxShadow: `3px 3px 0px ${NB.orange}`, fontFamily: NB.font }}>
                      View More
                    </button>
                  </div>
              )
              }
            </div>
          </section>

          {/* Platform Calendar removed */}


          {/* Global Event Feed */}
          <section>
            <h3 className="text-base font-black mb-3" style={{ fontFamily: NB.font }}>Global Event Feed</h3>
            <div className="space-y-3">
              {loading ?
              <div className="p-6 text-center" style={{ background: NB.card, border: `2px solid ${NB.border}`, borderRadius: '10px' }}>
                  <p className="text-sm" style={{ color: '#888' }}>Loading events...</p>
                </div> :
              upcomingEvents.length === 0 ?
              <div className="p-6 text-center" style={{ background: NB.card, border: `2px solid ${NB.border}`, borderRadius: '10px' }}>
                  <Calendar className="w-8 h-8 mx-auto mb-2" style={{ color: '#888' }} />
                  <p className="text-sm" style={{ color: '#888' }}>No upcoming events</p>
                </div> :
              upcomingEvents.slice(0, 8).map((event) => {
                const d = new Date(event.event_date);
                const month = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
                const day = d.getDate();
                return (
                  <div key={event.id} className="p-4 flex items-center gap-3" style={{ background: NB.card, border: `2px solid ${NB.border}`, borderRadius: '10px', boxShadow: `3px 3px 0px ${NB.border}` }}>
                      <div className="flex flex-col items-center justify-center w-12 h-14 shrink-0" style={{ background: `${NB.orange}30`, border: `2px solid ${NB.border}`, borderRadius: '8px' }}>
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: NB.orange }}>{month}</span>
                        <span className="text-xl font-black leading-none" style={{ color: NB.border }}>{day}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold truncate" style={{ fontFamily: NB.font }}>{event.name}</h4>
                        <p className="text-xs mt-0.5" style={{ color: '#888' }}>
                          {event.club_name} • {d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-xs" style={{ color: '#888' }}>
                          {event.participant_count} participants
                        </p>
                      </div>
                    </div>);
              })
              }
            </div>
          </section>
        </main>

        <MobileBottomNav />
        {renderDialogs()}
      </div>);

  }

  // ──── DESKTOP VIEW (New Brutalism) ────
  return (
    <div className="h-full overflow-auto antialiased p-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', fontFamily: NB.font, color: NB.border }}>
      <style>{`div::-webkit-scrollbar { display: none; }`}</style>

      {/* Header */}
      <header className="relative z-20 flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-2xl font-black" style={{ fontFamily: NB.font }}>
          Super Admin <span style={{ color: NB.orange }}>Command Center</span>
        </h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#888' }} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="py-2 pl-10 pr-4 w-64 text-sm outline-none"
              style={{ border: `2px solid ${NB.border}`, borderRadius: '10px', background: NB.card, fontFamily: NB.font }} />
          </div>
          <button
            onClick={() => navigate('/global-reports')}
            className="px-4 py-2 font-bold flex items-center gap-2 text-sm transition-all"
            style={{ background: NB.orange, color: NB.border, border: `2px solid ${NB.border}`, borderRadius: '10px', boxShadow: `3px 3px 0px ${NB.border}`, fontFamily: NB.font }}>
            <FileText className="w-4 h-4" /> Global Reports
          </button>
          <button
            onClick={handleExportData}
            disabled={exporting}
            className="px-4 py-2 font-bold flex items-center gap-2 text-sm transition-all"
            style={{ background: NB.card, color: NB.border, border: `2px solid ${NB.border}`, borderRadius: '10px', boxShadow: `3px 3px 0px ${NB.border}`, fontFamily: NB.font }}>
            <Download className="w-4 h-4" /> {exporting ? 'Exporting...' : 'Export Data'}
          </button>
          <ProfileDropdown viewMode="personal" />
        </div>
      </header>

      {/* Stats Row */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {statsCards.map((stat, i) => {
          const Icon = statIcons[i % statIcons.length];
          return (
            <div key={i} className="p-5 flex items-center gap-4" style={{ background: NB.card, border: `2px solid ${NB.border}`, borderRadius: '12px', boxShadow: `4px 4px 0px ${NB.border}` }}>
              <div className="w-12 h-12 flex items-center justify-center shrink-0" style={{ background: NB.orange, border: `2px solid ${NB.border}`, borderRadius: '10px' }}>
                <Icon className="w-6 h-6" style={{ color: NB.border }} />
              </div>
              <div>
                <h3 className="text-3xl font-black" style={{ fontFamily: NB.font }}>{loading ? '...' : stat.value}</h3>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#888' }}>{stat.label}</p>
              </div>
            </div>
          );
        })}
      </section>

      {/* Club Management */}
      <div className="mb-6">
        <div className="p-5 flex flex-col max-h-[500px]" style={{ background: NB.card, border: `2px solid ${NB.border}`, borderRadius: '12px', boxShadow: `4px 4px 0px ${NB.border}` }}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-black" style={{ fontFamily: NB.font }}>Club Management</h2>
            <button
              onClick={() => setCreateClubOpen(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 font-bold transition-all"
              style={{ background: NB.orange, color: NB.border, border: `2px solid ${NB.border}`, borderRadius: '8px', boxShadow: `3px 3px 0px ${NB.border}`, fontFamily: NB.font }}>
              <Plus className="w-3.5 h-3.5" /> Add Club
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto pr-2 flex-1" style={{ scrollbarWidth: 'none' }}>
            {loading ?
            <p className="col-span-3 text-center py-8" style={{ color: '#888' }}>Loading clubs...</p> :
            filteredClubs.length === 0 ?
            <p className="col-span-3 text-center py-8" style={{ color: '#888' }}>No clubs found</p> :
            filteredClubs.map((club) =>
            <div key={club.id} className="p-4 relative" style={{ background: NB.bg, border: `2px solid ${NB.border}`, borderRadius: '10px', boxShadow: `3px 3px 0px ${NB.border}` }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 flex items-center justify-center shrink-0" style={{ background: `${NB.orange}30`, border: `2px solid ${NB.border}`, borderRadius: '8px' }}>
                      {club.logo_url ?
                  <img src={club.logo_url} alt={club.name} className="w-7 h-7 rounded-lg object-cover" /> :
                  <span className="font-black text-lg" style={{ color: NB.orange }}>{club.name[0]}</span>
                  }
                    </div>
                    <h4 className="font-bold leading-tight flex-1" style={{ fontFamily: NB.font }}>{club.name}</h4>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="p-1 outline-none" style={{ borderRadius: '6px' }}>
                        <MoreVertical className="w-4 h-4" style={{ color: '#888' }} />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => handleEditClub(club)}>
                          <Pencil className="mr-2 h-4 w-4" /> Edit Club
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenPresidentDialog(club)}>
                          <Crown className="mr-2 h-4 w-4" /> Manage President
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteClub(club.id, club.name)} className="text-destructive focus:text-destructive">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Club
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="text-xs space-y-1 mb-4" style={{ color: '#888' }}>
                    <p>Members: {club.memberCount}</p>
                    <p>Events: {club.eventCount}</p>
                  </div>
                  <button
                onClick={() => navigate(`/club/${club.id}`, { state: { from: 'super-admin' } })}
                className="w-full text-center text-xs px-3 py-2 font-bold transition-all"
                style={{ background: NB.border, color: NB.card, border: `2px solid ${NB.border}`, borderRadius: '8px', boxShadow: `3px 3px 0px ${NB.orange}`, fontFamily: NB.font }}>
                    View More
                  </button>
                </div>
            )
            }
          </div>
        </div>
      </div>

      {/* Platform-wide Event Calendar */}
      <div className="mb-6">
        <SuperAdminCalendar />
      </div>

      {/* Global Event Feed */}
      <div className="p-5" style={{ background: NB.card, border: `2px solid ${NB.border}`, borderRadius: '12px', boxShadow: `4px 4px 0px ${NB.border}` }}>
        <h2 className="text-lg font-black mb-4" style={{ fontFamily: NB.font }}>Global Event Feed</h2>
        <div className="flex gap-6 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {loading ?
          <p style={{ color: '#888' }} className="py-4">Loading events...</p> :
          upcomingEvents.length === 0 ?
          <p style={{ color: '#888' }} className="py-4">No upcoming events</p> :
          upcomingEvents.map((event) => {
            const d = new Date(event.event_date);
            return (
              <div key={event.id} className="shrink-0 pl-4 py-1" style={{ borderLeft: `3px solid ${NB.orange}` }}>
                <h4 className="font-bold text-sm mb-1" style={{ fontFamily: NB.font }}>
                  {event.name} ({event.club_name}) - {d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </h4>
                <div className="flex items-center text-xs gap-4" style={{ color: '#888' }}>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {event.participant_count} Participants</span>
                </div>
              </div>);
          })
          }
        </div>
      </div>

      {renderDialogs()}
    </div>);
};

export default SuperAdminDashboard;