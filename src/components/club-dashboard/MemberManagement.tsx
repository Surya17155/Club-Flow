import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { UserPlus, Trash2, Eye, Loader2, Search, Users, MoreVertical, ShieldCheck, Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle, ChevronRight } from 'lucide-react';
import * as XLSX from 'xlsx';
import VerifiedBadge, { getRoleBadgeVariant } from '@/components/ui/VerifiedBadge';

interface SearchedUser {
  user_id: string;
  full_name: string;
  email: string | null;
  programme: string | null;
  year: string | null;
  avatar_url: string | null;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  full_name: string;
  email: string | null;
  programme: string | null;
  roll_no: string | null;
  avatar_url: string | null;
  phone: string | null;
  year: string | null;
  section: string | null;
  about: string | null;
  social_linkedin: string | null;
  social_instagram: string | null;
  social_gmail: string | null;
}

const roleLabelMap: Record<string, string> = {
  admin: 'Admin', president: 'President', vice_president: 'Vice President',
  social_media_head: 'Social Media Head', social_media_coordinator: 'Social Media Coordinator',
  technical_pr_head: 'Technical & PR Head', technical_pr_coordinator: 'Technical & PR Coordinator',
  general_secretary: 'General Secretary', secretary: 'Secretary',
  deputy_secretary: 'Deputy Secretary', treasurer: 'Treasurer',
  deputy_treasurer: 'Deputy Treasurer', assistant_treasurer: 'Assistant Treasurer',
  member: 'Member',
};

const roleColors: Record<string, string> = {
  president: 'bg-primary/10 text-primary',
  vice_president: 'bg-purple-100 text-purple-700',
  general_secretary: 'bg-blue-100 text-blue-700',
  secretary: 'bg-blue-100 text-blue-700',
  deputy_secretary: 'bg-blue-100 text-blue-700',
  social_media_head: 'bg-pink-100 text-pink-700',
  social_media_coordinator: 'bg-pink-100 text-pink-700',
  technical_pr_head: 'bg-indigo-100 text-indigo-700',
  technical_pr_coordinator: 'bg-indigo-100 text-indigo-700',
  treasurer: 'bg-emerald-100 text-emerald-700',
  deputy_treasurer: 'bg-emerald-100 text-emerald-700',
  assistant_treasurer: 'bg-emerald-100 text-emerald-700',
  member: 'bg-muted text-muted-foreground',
};

const assignableRoles = [
  { value: 'vice_president', label: 'Vice President' },
  { value: 'general_secretary', label: 'General Secretary' },
  { value: 'secretary', label: 'Secretary' },
  { value: 'deputy_secretary', label: 'Deputy Secretary' },
  { value: 'social_media_head', label: 'Social Media Head' },
  { value: 'social_media_coordinator', label: 'Social Media Coordinator' },
  { value: 'technical_pr_head', label: 'Technical & PR Head' },
  { value: 'technical_pr_coordinator', label: 'Technical & PR Coordinator' },
  { value: 'treasurer', label: 'Treasurer' },
  { value: 'deputy_treasurer', label: 'Deputy Treasurer' },
  { value: 'assistant_treasurer', label: 'Assistant Treasurer' },
  { value: 'member', label: 'Member' },
];

const PROGRAMMES = ['B.Tech (CS)', 'B.Tech (IT)', 'BBA', 'MBA', 'B.Com', 'BA (Hons)', 'BCA', 'MCA'];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

interface Props {
  clubId: string;
}

const MemberManagement = ({ clubId }: Props) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMember, setViewMember] = useState<Member | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [roleTarget, setRoleTarget] = useState<Member | null>(null);
  const [newRole, setNewRole] = useState('member');
  const [changingRole, setChangingRole] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResults, setImportResults] = useState<{ summary: any; results: any[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Search existing users state
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<SearchedUser[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedSearchUser, setSelectedSearchUser] = useState<SearchedUser | null>(null);
  const [searchUserRole, setSearchUserRole] = useState('member');
  const [addingSearchUser, setAddingSearchUser] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add member form state
  const [addForm, setAddForm] = useState({
    fullName: '', email: '', programme: '', section: '', year: '', rollNo: '', phone: '', role: 'member',
  });

  const updateAddForm = (field: string, value: string) => {
    setAddForm(prev => ({ ...prev, [field]: value }));
  };

  const resetAddForm = () => {
    setAddForm({ fullName: '', email: '', programme: '', section: '', year: '', rollNo: '', phone: '', role: 'member' });
    setUserSearchQuery('');
    setUserSearchResults([]);
    setSelectedSearchUser(null);
    setSearchUserRole('member');
  };

  // Live search for existing users
  const searchExistingUsers = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setUserSearchResults([]);
      return;
    }
    setSearchingUsers(true);
    const q = query.trim().toLowerCase();
    const { data } = await supabase
      .from('profiles')
      .select('user_id, full_name, email, programme, year, avatar_url')
      .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(10);

    if (data) {
      // Filter out users already in this club
      const existingUserIds = new Set(members.map(m => m.user_id));
      setUserSearchResults(
        (data as SearchedUser[]).filter(u => !existingUserIds.has(u.user_id))
      );
    }
    setSearchingUsers(false);
  }, [members]);

  const handleUserSearchChange = (value: string) => {
    setUserSearchQuery(value);
    setSelectedSearchUser(null);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => searchExistingUsers(value), 300);
  };

  const handleAddSearchedUser = async () => {
    if (!selectedSearchUser) return;
    setAddingSearchUser(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('create-member', {
        body: {
          email: selectedSearchUser.email || '',
          full_name: selectedSearchUser.full_name,
          club_id: clubId,
          role: searchUserRole,
        },
      });
      if (response.error || response.data?.error) {
        toast.error(response.data?.error || 'Failed to add member');
      } else {
        toast.success(`${selectedSearchUser.full_name} added to the club as ${roleLabelMap[searchUserRole] || searchUserRole}!`);
        resetAddForm();
        setAddDialogOpen(false);
        await fetchMembers();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to add member');
    }
    setAddingSearchUser(false);
  };

  const fetchMembers = async () => {
    setLoading(true);
    const { data: memberRows, error: memberError } = await supabase
      .from('club_members')
      .select('id, user_id, role, joined_at')
      .eq('club_id', clubId)
      .order('joined_at', { ascending: true });

    if (memberError) {
      toast.error('Failed to load members');
      setMembers([]);
      setLoading(false);
      return;
    }

    const userIds = (memberRows ?? []).map((member) => member.user_id);
    let profilesByUserId = new Map<string, any>();

    if (userIds.length > 0) {
      const { data: profileRows, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, programme, roll_no, avatar_url, phone, year, section, about, social_linkedin, social_instagram, social_gmail')
        .in('user_id', userIds);

      if (profileError) {
        toast.error('Failed to load member details');
      } else {
        profilesByUserId = new Map((profileRows ?? []).map((profile) => [profile.user_id, profile]));
      }
    }

    setMembers((memberRows ?? []).map((member) => {
      const profile = profilesByUserId.get(member.user_id);
      return {
        id: member.id,
        user_id: member.user_id,
        role: member.role,
        joined_at: member.joined_at,
        full_name: profile?.full_name ?? 'Unknown',
        email: profile?.email ?? null,
        programme: profile?.programme ?? null,
        roll_no: profile?.roll_no ?? null,
        avatar_url: profile?.avatar_url ?? null,
        phone: profile?.phone ?? null,
        year: profile?.year ?? null,
        section: profile?.section ?? null,
        about: profile?.about ?? null,
        social_linkedin: profile?.social_linkedin ?? null,
        social_instagram: profile?.social_instagram ?? null,
        social_gmail: profile?.social_gmail ?? null,
      };
    }));
    setLoading(false);
  };

  useEffect(() => { fetchMembers(); }, [clubId]);

  const handleAddMember = async () => {
    if (!addForm.email.trim() || !addForm.fullName.trim()) {
      toast.error('Please fill in name and email');
      return;
    }

    setAdding(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('create-member', {
        body: {
          email: addForm.email.trim(),
          full_name: addForm.fullName.trim(),
          programme: addForm.programme,
          section: addForm.section,
          year: addForm.year,
          roll_no: addForm.rollNo,
          phone: addForm.phone,
          club_id: clubId,
          role: addForm.role,
        },
      });

      if (response.error || response.data?.error) {
        toast.error(response.data?.error || 'Failed to create member');
      } else {
        const action = response.data?.action;
        if (action === 'added_existing') {
          toast.success(`${addForm.fullName} already had an account and has been added to this club.`);
        } else if (action === 'role_updated') {
          toast.success(`${addForm.fullName} was already in this club — their role has been updated.`);
        } else {
          toast.success(`${addForm.fullName} added! They can use "Forgot Password" on the login page to set their password and log in.`);
        }
        resetAddForm();
        setAddDialogOpen(false);
        await fetchMembers();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to add member');
    }

    setAdding(false);
  };

  const handleRemoveMember = async (member: Member) => {
    if (member.role === 'president') {
      toast.error('Cannot remove the president');
      return;
    }
    setRemoving(member.id);
    const { error } = await supabase.from('club_members').delete().eq('id', member.id);
    if (error) {
      toast.error('Failed to remove member');
    } else {
      toast.success(`${member.full_name} removed`);
      setMembers(prev => prev.filter(m => m.id !== member.id));
    }
    setRemoving(null);
  };

  const handleChangeRole = async () => {
    if (!roleTarget || !newRole) return;
    setChangingRole(true);
    const { error } = await supabase
      .from('club_members')
      .update({ role: newRole as any })
      .eq('id', roleTarget.id);
    if (error) {
      toast.error('Failed to update role');
    } else {
      toast.success(`${roleTarget.full_name} is now ${roleLabelMap[newRole] ?? newRole}`);
      setRoleDialogOpen(false);
      setRoleTarget(null);
      await fetchMembers();
    }
    setChangingRole(false);
  };

  const openRoleDialog = (member: Member) => {
    setRoleTarget(member);
    setNewRole(member.role);
    setRoleDialogOpen(true);
  };

  const handleImportExcel = async (file: File) => {
    setImporting(true);
    setImportResults(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

      if (jsonData.length < 2) {
        toast.error('Excel file must have a header row and at least one data row');
        setImporting(false);
        return;
      }

      const headers = jsonData[0].map((h: any) => String(h || ''));
      const rows = jsonData.slice(1).filter(row => row.some(cell => cell != null && cell !== ''));

      toast.info(`Processing ${rows.length} rows with AI...`);

      const response = await supabase.functions.invoke('import-members', {
        body: { club_id: clubId, raw_data: rows, headers },
      });

      if (response.error || response.data?.error) {
        toast.error(response.data?.error || 'Import failed');
      } else {
        const { summary, results } = response.data;
        setImportResults({ summary, results });
        toast.success(`Import complete: ${summary.added} added, ${summary.updated} updated, ${summary.skipped} skipped, ${summary.failed} failed`);
        await fetchMembers();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to process Excel file');
    }

    setImporting(false);
  };

  const filtered = members.filter(m =>
    m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.roll_no?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const postHolders = filtered.filter(m => m.role !== 'member');
  const regularMembers = filtered.filter(m => m.role === 'member');

  return (
    <div className="glass-card p-4 sm:p-6">
      {/* Header - centered on mobile, row on desktop */}
      <div className="flex flex-col items-center sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg text-foreground">Members ({members.length})</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={() => { setImportResults(null); setImportDialogOpen(true); }}
            size="sm"
            variant="outline"
            className="rounded-full gap-2"
          >
            <Upload className="w-4 h-4" /> Import
          </Button>
          <Button onClick={() => setAddDialogOpen(true)} size="sm" className="rounded-full gap-2">
            <UserPlus className="w-4 h-4" /> Add Member
          </Button>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, email, or roll number..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-10 rounded-full bg-white/30 border-white/40"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {postHolders.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Post-holders ({postHolders.length})</h4>
              <div className="space-y-2">
                {postHolders.map(m => (
                  <MemberRow key={m.id} member={m} onView={() => setViewMember(m)} onRemove={() => handleRemoveMember(m)} onChangeRole={() => openRoleDialog(m)} removing={removing === m.id} />
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Members ({regularMembers.length})</h4>
            <div className="space-y-2">
              {regularMembers.length > 0 ? regularMembers.map(m => (
                <MemberRow key={m.id} member={m} onView={() => setViewMember(m)} onRemove={() => handleRemoveMember(m)} onChangeRole={() => openRoleDialog(m)} removing={removing === m.id} />
              )) : (
                <p className="text-sm text-muted-foreground italic text-center py-4">No members found</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Member Dialog - Search + Manual Entry */}
      <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (!open) resetAddForm(); }}>
        <DialogContent className="glass-card border-white/20 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">Add New Member</DialogTitle>
            <p className="text-sm text-muted-foreground">Search for an existing user or fill in details manually.</p>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Search Existing Users */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Search Existing Users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Type a name or email to search..."
                  value={userSearchQuery}
                  onChange={e => handleUserSearchChange(e.target.value)}
                  className="pl-10 bg-white/30"
                />
                {searchingUsers && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
                )}
              </div>

              {/* Search Results */}
              {userSearchQuery.trim().length >= 2 && (
                <div className="rounded-xl border border-white/20 bg-white/10 max-h-48 overflow-y-auto">
                  {userSearchResults.length === 0 && !searchingUsers ? (
                    <p className="text-xs text-muted-foreground text-center py-4">No users found. Use manual entry below.</p>
                  ) : (
                    userSearchResults.map(u => (
                      <div
                        key={u.user_id}
                        className={`flex items-center justify-between p-3 hover:bg-white/20 transition-colors cursor-pointer ${selectedSearchUser?.user_id === u.user_id ? 'bg-primary/10 border-l-2 border-primary' : ''}`}
                        onClick={() => setSelectedSearchUser(u)}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-full overflow-hidden border border-white/30 shrink-0">
                            {u.avatar_url ? (
                              <img src={u.avatar_url} alt={u.full_name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                                {u.full_name[0]}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">{u.full_name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {[u.programme, u.year, u.email].filter(Boolean).join(' · ')}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Selected User - Role Assignment */}
              {selectedSearchUser && (
                <div className="rounded-xl bg-primary/5 border border-primary/20 p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-primary/30 shrink-0">
                      {selectedSearchUser.avatar_url ? (
                        <img src={selectedSearchUser.avatar_url} alt={selectedSearchUser.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                          {selectedSearchUser.full_name[0]}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{selectedSearchUser.full_name}</p>
                      <p className="text-xs text-muted-foreground">{selectedSearchUser.email}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Assign Club Role</Label>
                    <Select value={searchUserRole} onValueChange={setSearchUserRole}>
                      <SelectTrigger className="bg-white/30"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {assignableRoles.map(r => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleAddSearchedUser}
                    disabled={addingSearchUser}
                    className="w-full rounded-full"
                  >
                    {addingSearchUser ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                    Add {selectedSearchUser.full_name.split(' ')[0]} as {roleLabelMap[searchUserRole]}
                  </Button>
                </div>
              )}
            </div>

            <div className="relative flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs font-medium text-muted-foreground uppercase">or add manually</span>
              <Separator className="flex-1" />
            </div>

            {/* Manual Entry Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Full Name *</Label>
                <Input placeholder="Enter full name" value={addForm.fullName} onChange={e => updateAddForm('fullName', e.target.value)} className="bg-white/30" />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label>College Email *</Label>
                <Input type="email" placeholder="student@iilm.edu" value={addForm.email} onChange={e => updateAddForm('email', e.target.value)} className="bg-white/30" />
              </div>

              <div className="space-y-1.5">
                <Label>Roll No. / Admission No.</Label>
                <Input placeholder="e.g., 2021CSE001" value={addForm.rollNo} onChange={e => updateAddForm('rollNo', e.target.value)} className="bg-white/30" />
              </div>

              <div className="space-y-1.5">
                <Label>Phone Number</Label>
                <Input type="tel" placeholder="+91 XXXXXXXXXX" value={addForm.phone} onChange={e => updateAddForm('phone', e.target.value)} className="bg-white/30" />
              </div>

              <div className="space-y-1.5">
                <Label>Programme</Label>
                <Select value={addForm.programme} onValueChange={v => updateAddForm('programme', v)}>
                  <SelectTrigger className="bg-white/30"><SelectValue placeholder="Select programme" /></SelectTrigger>
                  <SelectContent>
                    {PROGRAMMES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Section</Label>
                <Input placeholder="e.g., A, B, C" value={addForm.section} onChange={e => updateAddForm('section', e.target.value)} className="bg-white/30" />
              </div>

              <div className="space-y-1.5">
                <Label>Year</Label>
                <Select value={addForm.year} onValueChange={v => updateAddForm('year', v)}>
                  <SelectTrigger className="bg-white/30"><SelectValue placeholder="Select year" /></SelectTrigger>
                  <SelectContent>
                    {YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Club Role</Label>
                <Select value={addForm.role} onValueChange={v => updateAddForm('role', v)}>
                  <SelectTrigger className="bg-white/30"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {assignableRoles.map(r => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleAddMember} disabled={adding || !addForm.email.trim() || !addForm.fullName.trim()} className="w-full rounded-full">
              {adding ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
              Add Member Manually
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className="glass-card border-white/20 max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">Change Role</DialogTitle>
          </DialogHeader>
          {roleTarget && (
            <div className="space-y-4 mt-2">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/20">
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/40 shrink-0">
                  {roleTarget.avatar_url ? (
                    <img src={roleTarget.avatar_url} alt={roleTarget.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                      {roleTarget.full_name[0]}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{roleTarget.full_name}</p>
                  <p className="text-xs text-muted-foreground">Current: {roleLabelMap[roleTarget.role] ?? roleTarget.role}</p>
                </div>
              </div>
              <div>
                <Label className="mb-1 block">New Role</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="bg-white/30"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-56 overflow-y-auto" position="popper" side="bottom" sideOffset={4}>
                    {assignableRoles.map(r => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleChangeRole} disabled={changingRole || newRole === roleTarget.role} className="w-full rounded-full">
                {changingRole ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                Update Role
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Profile Dialog */}
      <Dialog open={!!viewMember} onOpenChange={() => setViewMember(null)}>
        <DialogContent className="glass-card border-white/20 max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">Member Profile</DialogTitle>
          </DialogHeader>
          {viewMember && (
            <div className="flex flex-col items-center text-center space-y-4 mt-2">
              <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white/40 shadow-lg">
                {viewMember.avatar_url ? (
                  <img src={viewMember.avatar_url} alt={viewMember.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
                    {viewMember.full_name[0]}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground inline-flex items-center">{viewMember.full_name}{getRoleBadgeVariant(viewMember.role) && getRoleBadgeVariant(viewMember.role) !== 'gray' && <VerifiedBadge variant={getRoleBadgeVariant(viewMember.role)!} />}</h3>
                <Badge className={`mt-1 ${roleColors[viewMember.role] || roleColors.member}`}>
                  {roleLabelMap[viewMember.role] ?? viewMember.role}
                </Badge>
              </div>

              {viewMember.about && (
                <div className="w-full text-left bg-white/10 rounded-xl p-3">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">About</h4>
                  <p className="text-sm text-foreground/80 leading-relaxed">{viewMember.about}</p>
                </div>
              )}

              <div className="w-full text-left space-y-2 bg-white/20 rounded-xl p-4 text-sm">
                {viewMember.email && <InfoRow label="Email" value={viewMember.email} />}
                {viewMember.roll_no && <InfoRow label="Roll No" value={viewMember.roll_no} />}
                {viewMember.programme && <InfoRow label="Programme" value={viewMember.programme} />}
                {viewMember.year && <InfoRow label="Year" value={viewMember.year} />}
                {viewMember.section && <InfoRow label="Section" value={viewMember.section} />}
                {viewMember.phone && <InfoRow label="Phone" value={viewMember.phone} />}
                <InfoRow label="Joined" value={new Date(viewMember.joined_at).toLocaleDateString()} />
              </div>

              {(viewMember.social_linkedin || viewMember.social_instagram || viewMember.social_gmail) && (
                <div className="w-full text-left space-y-2 bg-white/20 rounded-xl p-4 text-sm">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Social Profiles</h4>
                  {viewMember.social_linkedin && <InfoRow label="LinkedIn" value={viewMember.social_linkedin} />}
                  {viewMember.social_instagram && <InfoRow label="Instagram" value={viewMember.social_instagram} />}
                  {viewMember.social_gmail && <InfoRow label="Gmail" value={viewMember.social_gmail} />}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Import Members Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={(open) => { setImportDialogOpen(open); if (!open) setImportResults(null); }}>
        <DialogContent className="glass-card border-white/20 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-lg flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
              Import Members from Excel
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Upload an Excel file (.xlsx, .xls, .csv) with member details. AI will automatically map columns and assign roles.
            </p>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {!importResults && (
              <>
                <div
                  className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center cursor-pointer hover:border-primary/60 hover:bg-primary/5 transition-all"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {importing ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-10 h-10 animate-spin text-primary" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">AI is analyzing your data...</p>
                        <p className="text-xs text-muted-foreground mt-1">Mapping columns, detecting roles, and importing members</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <Upload className="w-10 h-10 text-primary/60" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">Click to upload Excel file</p>
                        <p className="text-xs text-muted-foreground mt-1">Supports .xlsx, .xls, and .csv files</p>
                      </div>
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImportExcel(file);
                    e.target.value = '';
                  }}
                />

                <div className="bg-muted/30 rounded-xl p-4 space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Expected Columns</h4>
                  <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                    <span>• Name (required)</span>
                    <span>• Email (required)</span>
                    <span>• Programme</span>
                    <span>• Year</span>
                    <span>• Section</span>
                    <span>• Roll No</span>
                    <span>• Phone</span>
                    <span>• Role / Position</span>
                  </div>
                  <p className="text-xs text-muted-foreground/70 mt-2">
                    Column names don't need to be exact — AI will intelligently match them.
                  </p>
                </div>
              </>
            )}

            {importResults && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-green-700 dark:text-green-400">{importResults.summary.added}</p>
                    <p className="text-xs text-green-600 dark:text-green-500">Added</p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900/30 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-blue-700 dark:text-blue-400">{importResults.summary.updated}</p>
                    <p className="text-xs text-blue-600 dark:text-blue-500">Updated</p>
                  </div>
                  <div className="bg-muted rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-muted-foreground">{importResults.summary.skipped}</p>
                    <p className="text-xs text-muted-foreground">Skipped</p>
                  </div>
                  <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-red-700 dark:text-red-400">{importResults.summary.failed}</p>
                    <p className="text-xs text-red-600 dark:text-red-500">Failed</p>
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1">
                  {importResults.results.map((r: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-white/10 text-sm">
                      <span className="font-medium text-foreground truncate flex-1">{r.name}</span>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {r.status === 'added' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                        {r.status === 'role_updated' && <ShieldCheck className="w-4 h-4 text-blue-600" />}
                        {r.status === 'already_exists' && <AlertCircle className="w-4 h-4 text-muted-foreground" />}
                        {r.status === 'skipped' && <AlertCircle className="w-4 h-4 text-yellow-600" />}
                        {r.status === 'failed' && <XCircle className="w-4 h-4 text-red-600" />}
                        <span className="text-xs text-muted-foreground capitalize">{r.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <Button onClick={() => { setImportResults(null); setImportDialogOpen(false); }} className="w-full rounded-full">
                  Done
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between">
    <span className="text-muted-foreground">{label}:</span>
    <span className="font-medium text-foreground break-all text-right">{value}</span>
  </div>
);

const MemberRow = ({ member, onView, onRemove, onChangeRole, removing }: { member: Member; onView: () => void; onRemove: () => void; onChangeRole: () => void; removing: boolean }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-white/20 hover:bg-white/30 transition-colors cursor-pointer overflow-hidden" onClick={onView}>
    {/* Avatar */}
    <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/40 shrink-0">
      {member.avatar_url ? (
        <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
          {member.full_name[0]}
        </div>
      )}
    </div>

    {/* Name + role tag underneath */}
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-foreground truncate inline-flex items-center gap-1">
        {member.full_name}
        {getRoleBadgeVariant(member.role) && getRoleBadgeVariant(member.role) !== 'gray' && (
          <VerifiedBadge variant={getRoleBadgeVariant(member.role)!} size={14} />
        )}
      </p>
      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 mt-0.5 block w-fit ${roleColors[member.role] || ''}`}>
        {roleLabelMap[member.role] ?? member.role}
      </Badge>
    </div>

    {/* Actions */}
    <div className="shrink-0" onClick={e => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem onClick={onView}>
            <Eye className="w-4 h-4 mr-2" /> View Details
          </DropdownMenuItem>
          {member.role !== 'president' && (
            <>
              <DropdownMenuItem onClick={onChangeRole}>
                <ShieldCheck className="w-4 h-4 mr-2" /> Change Role
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onRemove} disabled={removing} className="text-destructive focus:text-destructive">
                {removing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Remove Member
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </div>
);

export default MemberManagement;
