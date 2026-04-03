import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { UserPlus, Trash2, Eye, Loader2, Search, Users, MoreVertical, ShieldCheck, Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertCircle, ChevronRight, Pencil, Linkedin, Instagram, Mail, Phone, ExternalLink } from 'lucide-react';
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
  isSuperAdmin?: boolean;
}

const NB_CARD = "border-[3px] border-[#111] rounded-[6px] bg-white";
const NB_SHADOW = { boxShadow: '4px 4px 0px #111' };
const NB_BTN_ORANGE = "bg-[#E98A3A] text-[#111] font-bold border-[2px] border-[#111] rounded-[6px] hover:translate-y-[1px] hover:shadow-none transition-all";
const NB_BTN_BLACK = "bg-[#111] text-white font-bold border-[2px] border-[#111] rounded-[6px] hover:translate-y-[1px] hover:shadow-none transition-all";

const MemberManagement = ({ clubId, isSuperAdmin = false }: Props) => {
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

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Member | null>(null);
  const [editForm, setEditForm] = useState({ full_name: '', programme: '', section: '', year: '', roll_no: '', phone: '' });
  const [saving, setSaving] = useState(false);

  const openEditDialog = (member: Member) => {
    setEditTarget(member);
    setEditForm({
      full_name: member.full_name || '',
      programme: member.programme || '',
      section: member.section || '',
      year: member.year || '',
      roll_no: member.roll_no || '',
      phone: member.phone || '',
    });
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    setSaving(true);
    try {
      const response = await supabase.functions.invoke('manage-outsider', {
        body: {
          action: 'update',
          user_id: editTarget.user_id,
          full_name: editForm.full_name,
          programme: editForm.programme,
          section: editForm.section,
          year: editForm.year,
          roll_no: editForm.roll_no,
          phone: editForm.phone,
        },
      });
      if (response.error || response.data?.error) {
        toast.error(response.data?.error || 'Failed to update profile');
      } else {
        toast.success(`${editForm.full_name}'s profile updated`);
        setEditDialogOpen(false);
        setEditTarget(null);
        setViewMember(null);
        await fetchMembers();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update');
    }
    setSaving(false);
  };

  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState<SearchedUser[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [selectedSearchUser, setSelectedSearchUser] = useState<SearchedUser | null>(null);
  const [searchUserRole, setSearchUserRole] = useState('member');
  const [addingSearchUser, setAddingSearchUser] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
    <div className={`${NB_CARD} p-4 sm:p-6`} style={NB_SHADOW}>
      {/* Header */}
      <div className="flex flex-col items-center sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[#111]" />
          <h3 className="font-black text-lg text-[#111]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Members ({members.length})</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setImportResults(null); setImportDialogOpen(true); }}
            className={`${NB_BTN_BLACK} px-3 py-2 text-xs flex items-center gap-1.5`}
            style={{ boxShadow: '2px 2px 0px #E98A3A' }}
          >
            <Upload className="w-3.5 h-3.5" /> Import
          </button>
          <button
            onClick={() => setAddDialogOpen(true)}
            className={`${NB_BTN_ORANGE} px-3 py-2 text-xs flex items-center gap-1.5`}
            style={{ boxShadow: '2px 2px 0px #111' }}
          >
            <UserPlus className="w-3.5 h-3.5" /> Add Member
          </button>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#111]/40" />
        <input
          placeholder="Search by name, email, or roll number..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 border-[2px] border-[#111] rounded-[6px] bg-white text-sm font-medium text-[#111] placeholder:text-[#111]/30 focus:outline-none focus:ring-2 focus:ring-[#E98A3A]"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-[3px] border-[#111]/30 border-t-[#111] rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {postHolders.length > 0 && (
            <div>
              <h4 className="text-xs font-black text-[#111]/50 uppercase tracking-wider mb-3">Post-holders ({postHolders.length})</h4>
              <div className="space-y-2">
                {postHolders.map(m => (
                  <MemberRow key={m.id} member={m} onView={() => setViewMember(m)} onRemove={() => handleRemoveMember(m)} onChangeRole={() => openRoleDialog(m)} removing={removing === m.id} isSuperAdmin={isSuperAdmin} onEdit={() => openEditDialog(m)} />
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="text-xs font-black text-[#111]/50 uppercase tracking-wider mb-3">Members ({regularMembers.length})</h4>
            <div className="space-y-2">
              {regularMembers.length > 0 ? regularMembers.map(m => (
                <MemberRow key={m.id} member={m} onView={() => setViewMember(m)} onRemove={() => handleRemoveMember(m)} onChangeRole={() => openRoleDialog(m)} removing={removing === m.id} isSuperAdmin={isSuperAdmin} onEdit={() => openEditDialog(m)} />
              )) : (
                <p className="text-sm text-[#111]/40 font-medium text-center py-4">No members found</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Member Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (!open) resetAddForm(); }}>
        <DialogContent className={`${NB_CARD} max-w-lg max-h-[90vh] overflow-y-auto`} style={NB_SHADOW}>
          <DialogHeader>
            <DialogTitle className="font-black text-lg text-[#111]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Add New Member</DialogTitle>
            <p className="text-sm text-[#111]/50 font-medium">Search for an existing user or fill in details manually.</p>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-wider text-[#111]/50">Search Existing Users</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#111]/40" />
                <input
                  placeholder="Type a name or email to search..."
                  value={userSearchQuery}
                  onChange={e => handleUserSearchChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border-[2px] border-[#111] rounded-[6px] bg-white text-sm font-medium text-[#111] placeholder:text-[#111]/30 focus:outline-none focus:ring-2 focus:ring-[#E98A3A]"
                />
                {searchingUsers && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[#111]" />
                )}
              </div>

              {userSearchQuery.trim().length >= 2 && (
                <div className="rounded-[6px] border-[2px] border-[#111] max-h-48 overflow-y-auto">
                  {userSearchResults.length === 0 && !searchingUsers ? (
                    <p className="text-xs text-[#111]/40 text-center py-4 font-medium">No users found. Use manual entry below.</p>
                  ) : (
                    userSearchResults.map(u => (
                      <div
                        key={u.user_id}
                        className={`flex items-center justify-between p-3 hover:bg-[#FDE8D0] transition-colors cursor-pointer border-b border-[#111]/10 last:border-b-0 ${selectedSearchUser?.user_id === u.user_id ? 'bg-[#E98A3A]/10 border-l-4 border-l-[#E98A3A]' : ''}`}
                        onClick={() => setSelectedSearchUser(u)}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-[4px] overflow-hidden border-[2px] border-[#111] shrink-0">
                            {u.avatar_url ? (
                              <img src={u.avatar_url} alt={u.full_name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-[#FDE8D0] flex items-center justify-center text-xs font-black text-[#111]">
                                {u.full_name[0]}
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[#111] truncate">{u.full_name}</p>
                            <p className="text-xs text-[#111]/50 truncate font-medium">
                              {[u.programme, u.year, u.email].filter(Boolean).join(' · ')}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[#111]/40 shrink-0" />
                      </div>
                    ))
                  )}
                </div>
              )}

              {selectedSearchUser && (
                <div className="rounded-[6px] bg-[#FDE8D0] border-[2px] border-[#111] p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[4px] overflow-hidden border-[2px] border-[#111] shrink-0">
                      {selectedSearchUser.avatar_url ? (
                        <img src={selectedSearchUser.avatar_url} alt={selectedSearchUser.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-white flex items-center justify-center text-sm font-black text-[#111]">
                          {selectedSearchUser.full_name[0]}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-[#111]">{selectedSearchUser.full_name}</p>
                      <p className="text-xs text-[#111]/50 font-medium">{selectedSearchUser.email}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-[#111]">Assign Club Role</Label>
                    <Select value={searchUserRole} onValueChange={setSearchUserRole}>
                      <SelectTrigger className="border-[2px] border-[#111] rounded-[6px] bg-white"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {assignableRoles.map(r => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <button
                    onClick={handleAddSearchedUser}
                    disabled={addingSearchUser}
                    className={`w-full ${NB_BTN_ORANGE} px-4 py-2.5 text-sm flex items-center justify-center gap-2`}
                    style={{ boxShadow: '3px 3px 0px #111' }}
                  >
                    {addingSearchUser ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    Add {selectedSearchUser.full_name.split(' ')[0]} as {roleLabelMap[searchUserRole]}
                  </button>
                </div>
              )}
            </div>

            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-[2px] bg-[#111]/20" />
              <span className="text-xs font-bold text-[#111]/40 uppercase">or add manually</span>
              <div className="flex-1 h-[2px] bg-[#111]/20" />
            </div>

            {/* Manual Entry Form */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="font-bold text-[#111] text-xs">Full Name *</Label>
                <input placeholder="Enter full name" value={addForm.fullName} onChange={e => updateAddForm('fullName', e.target.value)} className="w-full px-3 py-2.5 border-[2px] border-[#111] rounded-[6px] bg-white text-sm font-medium text-[#111] placeholder:text-[#111]/30 focus:outline-none focus:ring-2 focus:ring-[#E98A3A]" />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="font-bold text-[#111] text-xs">College Email *</Label>
                <input type="email" placeholder="student@iilm.edu" value={addForm.email} onChange={e => updateAddForm('email', e.target.value)} className="w-full px-3 py-2.5 border-[2px] border-[#111] rounded-[6px] bg-white text-sm font-medium text-[#111] placeholder:text-[#111]/30 focus:outline-none focus:ring-2 focus:ring-[#E98A3A]" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-bold text-[#111] text-xs">Roll No.</Label>
                <input placeholder="e.g., 2021CSE001" value={addForm.rollNo} onChange={e => updateAddForm('rollNo', e.target.value)} className="w-full px-3 py-2.5 border-[2px] border-[#111] rounded-[6px] bg-white text-sm font-medium text-[#111] placeholder:text-[#111]/30 focus:outline-none focus:ring-2 focus:ring-[#E98A3A]" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-bold text-[#111] text-xs">Phone Number</Label>
                <input type="tel" placeholder="+91 XXXXXXXXXX" value={addForm.phone} onChange={e => updateAddForm('phone', e.target.value)} className="w-full px-3 py-2.5 border-[2px] border-[#111] rounded-[6px] bg-white text-sm font-medium text-[#111] placeholder:text-[#111]/30 focus:outline-none focus:ring-2 focus:ring-[#E98A3A]" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-bold text-[#111] text-xs">Programme</Label>
                <Select value={addForm.programme} onValueChange={v => updateAddForm('programme', v)}>
                  <SelectTrigger className="border-[2px] border-[#111] rounded-[6px] bg-white"><SelectValue placeholder="Select programme" /></SelectTrigger>
                  <SelectContent>
                    {PROGRAMMES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="font-bold text-[#111] text-xs">Section</Label>
                <input placeholder="e.g., A, B, C" value={addForm.section} onChange={e => updateAddForm('section', e.target.value)} className="w-full px-3 py-2.5 border-[2px] border-[#111] rounded-[6px] bg-white text-sm font-medium text-[#111] placeholder:text-[#111]/30 focus:outline-none focus:ring-2 focus:ring-[#E98A3A]" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-bold text-[#111] text-xs">Year</Label>
                <Select value={addForm.year} onValueChange={v => updateAddForm('year', v)}>
                  <SelectTrigger className="border-[2px] border-[#111] rounded-[6px] bg-white"><SelectValue placeholder="Select year" /></SelectTrigger>
                  <SelectContent>
                    {YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="font-bold text-[#111] text-xs">Club Role</Label>
                <Select value={addForm.role} onValueChange={v => updateAddForm('role', v)}>
                  <SelectTrigger className="border-[2px] border-[#111] rounded-[6px] bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {assignableRoles.map(r => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <button onClick={handleAddMember} disabled={adding || !addForm.email.trim() || !addForm.fullName.trim()} className={`w-full ${NB_BTN_ORANGE} px-4 py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-50`} style={{ boxShadow: '3px 3px 0px #111' }}>
              {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
              Add Member Manually
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Change Role Dialog */}
      <Dialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen}>
        <DialogContent className={`${NB_CARD} max-w-md`} style={NB_SHADOW}>
          <DialogHeader>
            <DialogTitle className="font-black text-lg text-[#111]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Change Role</DialogTitle>
          </DialogHeader>
          {roleTarget && (
            <div className="space-y-4 mt-2">
              <div className="flex items-center gap-3 p-3 rounded-[6px] bg-[#FDE8D0] border-[2px] border-[#111]">
                <div className="w-10 h-10 rounded-[4px] overflow-hidden border-[2px] border-[#111] shrink-0">
                  {roleTarget.avatar_url ? (
                    <img src={roleTarget.avatar_url} alt={roleTarget.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-white flex items-center justify-center text-sm font-black text-[#111]">
                      {roleTarget.full_name[0]}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#111]">{roleTarget.full_name}</p>
                  <p className="text-xs text-[#111]/50 font-medium">Current: {roleLabelMap[roleTarget.role] ?? roleTarget.role}</p>
                </div>
              </div>
              <div>
                <Label className="mb-1 block font-bold text-[#111] text-xs">New Role</Label>
                <Select value={newRole} onValueChange={setNewRole}>
                  <SelectTrigger className="border-[2px] border-[#111] rounded-[6px] bg-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="max-h-56 overflow-y-auto" position="popper" side="bottom" sideOffset={4}>
                    {assignableRoles.map(r => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <button onClick={handleChangeRole} disabled={changingRole || newRole === roleTarget.role} className={`w-full ${NB_BTN_ORANGE} px-4 py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-50`} style={{ boxShadow: '3px 3px 0px #111' }}>
                {changingRole ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Update Role
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View Profile Dialog */}
      <Dialog open={!!viewMember} onOpenChange={() => setViewMember(null)}>
        <DialogContent className={`${NB_CARD} max-w-md`} style={NB_SHADOW}>
          <DialogHeader>
            <DialogTitle className="font-black text-lg text-[#111]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Member Profile</DialogTitle>
          </DialogHeader>
          {viewMember && (
            <div className="flex flex-col items-center text-center space-y-4 mt-2">
              <div className="w-20 h-20 rounded-[6px] overflow-hidden border-[3px] border-[#111]" style={{ boxShadow: '3px 3px 0px #E98A3A' }}>
                {viewMember.avatar_url ? (
                  <img src={viewMember.avatar_url} alt={viewMember.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#FDE8D0] flex items-center justify-center text-[#111] text-2xl font-black">
                    {viewMember.full_name[0]}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-lg font-black text-[#111] inline-flex items-center">{viewMember.full_name}{getRoleBadgeVariant(viewMember.role) && getRoleBadgeVariant(viewMember.role) !== 'gray' && <VerifiedBadge variant={getRoleBadgeVariant(viewMember.role)!} />}</h3>
                <div className="mt-1">
                  <span className="px-3 py-1 text-xs font-black border-[2px] border-[#111] rounded-[4px] bg-[#E98A3A] text-[#111]">
                    {roleLabelMap[viewMember.role] ?? viewMember.role}
                  </span>
                </div>
              </div>

              {viewMember.about && (
                <div className="w-full text-left bg-[#FDE8D0] rounded-[6px] p-3 border-[2px] border-[#111]">
                  <h4 className="text-xs font-black text-[#111]/50 uppercase tracking-wider mb-1">About</h4>
                  <p className="text-sm text-[#111]/80 leading-relaxed font-medium">{viewMember.about}</p>
                </div>
              )}

              <div className="w-full text-left space-y-2 bg-white rounded-[6px] p-4 text-sm border-[2px] border-[#111]">
                {viewMember.email && <InfoRow label="Email" value={viewMember.email} />}
                {viewMember.roll_no && <InfoRow label="Roll No" value={viewMember.roll_no} />}
                {viewMember.programme && <InfoRow label="Programme" value={viewMember.programme} />}
                {viewMember.year && <InfoRow label="Year" value={viewMember.year} />}
                {viewMember.section && <InfoRow label="Section" value={viewMember.section} />}
                {viewMember.phone && <InfoRow label="Phone" value={viewMember.phone} />}
                <InfoRow label="Joined" value={new Date(viewMember.joined_at).toLocaleDateString()} />
              </div>

              {(viewMember.social_linkedin || viewMember.social_instagram || viewMember.social_gmail) && (
                <div className="w-full text-left space-y-2 bg-white rounded-[6px] p-4 text-sm border-[2px] border-[#111]">
                  <h4 className="text-xs font-black text-[#111]/50 uppercase tracking-wider mb-1">Social Profiles</h4>
                  {viewMember.social_linkedin && <InfoRow label="LinkedIn" value={viewMember.social_linkedin} />}
                  {viewMember.social_instagram && <InfoRow label="Instagram" value={viewMember.social_instagram} />}
                  {viewMember.social_gmail && <InfoRow label="Gmail" value={viewMember.social_gmail} />}
                </div>
              )}
              {isSuperAdmin && viewMember && (
                <button onClick={() => { openEditDialog(viewMember); }} className={`w-full ${NB_BTN_BLACK} px-4 py-2.5 text-sm flex items-center justify-center gap-2 mt-2`} style={{ boxShadow: '2px 2px 0px #E98A3A' }}>
                  <Pencil className="w-4 h-4" /> Edit Profile
                </button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => { setEditDialogOpen(open); if (!open) setEditTarget(null); }}>
        <DialogContent className={`${NB_CARD} max-w-md max-h-[90vh] overflow-y-auto`} style={NB_SHADOW}>
          <DialogHeader>
            <DialogTitle className="font-black text-lg text-[#111]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Edit Member Profile</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <div className="space-y-4 mt-2">
              <div className="flex items-center gap-3 p-3 rounded-[6px] bg-[#FDE8D0] border-[2px] border-[#111]">
                <div className="w-10 h-10 rounded-[4px] overflow-hidden border-[2px] border-[#111] shrink-0">
                  {editTarget.avatar_url ? (
                    <img src={editTarget.avatar_url} alt={editTarget.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-white flex items-center justify-center text-sm font-black text-[#111]">
                      {editTarget.full_name[0]}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#111]">{editTarget.full_name}</p>
                  <p className="text-xs text-[#111]/50 font-medium">{editTarget.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="font-bold text-[#111] text-xs">Full Name</Label>
                  <input value={editForm.full_name} onChange={e => setEditForm(p => ({ ...p, full_name: e.target.value }))} className="w-full px-3 py-2.5 border-[2px] border-[#111] rounded-[6px] bg-white text-sm font-medium text-[#111] focus:outline-none focus:ring-2 focus:ring-[#E98A3A]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-bold text-[#111] text-xs">Programme</Label>
                  <Select value={editForm.programme} onValueChange={v => setEditForm(p => ({ ...p, programme: v }))}>
                    <SelectTrigger className="border-[2px] border-[#111] rounded-[6px] bg-white"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {PROGRAMMES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="font-bold text-[#111] text-xs">Year</Label>
                  <Select value={editForm.year} onValueChange={v => setEditForm(p => ({ ...p, year: v }))}>
                    <SelectTrigger className="border-[2px] border-[#111] rounded-[6px] bg-white"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="font-bold text-[#111] text-xs">Section</Label>
                  <input value={editForm.section} onChange={e => setEditForm(p => ({ ...p, section: e.target.value }))} className="w-full px-3 py-2.5 border-[2px] border-[#111] rounded-[6px] bg-white text-sm font-medium text-[#111] focus:outline-none focus:ring-2 focus:ring-[#E98A3A]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-bold text-[#111] text-xs">Roll No</Label>
                  <input value={editForm.roll_no} onChange={e => setEditForm(p => ({ ...p, roll_no: e.target.value }))} className="w-full px-3 py-2.5 border-[2px] border-[#111] rounded-[6px] bg-white text-sm font-medium text-[#111] focus:outline-none focus:ring-2 focus:ring-[#E98A3A]" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="font-bold text-[#111] text-xs">Phone</Label>
                  <input value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} className="w-full px-3 py-2.5 border-[2px] border-[#111] rounded-[6px] bg-white text-sm font-medium text-[#111] focus:outline-none focus:ring-2 focus:ring-[#E98A3A]" />
                </div>
              </div>

              <button onClick={handleSaveEdit} disabled={saving || !editForm.full_name.trim()} className={`w-full ${NB_BTN_ORANGE} px-4 py-2.5 text-sm flex items-center justify-center gap-2 disabled:opacity-50`} style={{ boxShadow: '3px 3px 0px #111' }}>
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Import Members Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={(open) => { setImportDialogOpen(open); if (!open) setImportResults(null); }}>
        <DialogContent className={`${NB_CARD} max-w-lg max-h-[90vh] overflow-y-auto`} style={NB_SHADOW}>
          <DialogHeader>
            <DialogTitle className="font-black text-lg text-[#111] flex items-center gap-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              <FileSpreadsheet className="w-5 h-5 text-[#E98A3A]" />
              Import Members from Excel
            </DialogTitle>
            <p className="text-sm text-[#111]/50 font-medium">
              Upload an Excel file (.xlsx, .xls, .csv) with member details. AI will automatically map columns and assign roles.
            </p>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {!importResults && (
              <>
                <div
                  className="border-[3px] border-dashed border-[#111]/40 rounded-[6px] p-8 text-center cursor-pointer hover:border-[#E98A3A] hover:bg-[#FDE8D0]/30 transition-all"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {importing ? (
                    <div className="flex flex-col items-center gap-3">
                      <Loader2 className="w-10 h-10 animate-spin text-[#111]" />
                      <div>
                        <p className="text-sm font-bold text-[#111]">AI is analyzing your data...</p>
                        <p className="text-xs text-[#111]/50 mt-1 font-medium">Mapping columns, detecting roles, and importing members</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <Upload className="w-10 h-10 text-[#E98A3A]" />
                      <div>
                        <p className="text-sm font-bold text-[#111]">Click to upload Excel file</p>
                        <p className="text-xs text-[#111]/50 mt-1 font-medium">Supports .xlsx, .xls, and .csv files</p>
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

                <div className="bg-[#FDE8D0] rounded-[6px] p-4 space-y-2 border-[2px] border-[#111]">
                  <h4 className="text-xs font-black text-[#111]/60 uppercase tracking-wider">Expected Columns</h4>
                  <div className="grid grid-cols-2 gap-1 text-xs text-[#111]/60 font-medium">
                    <span>• Name (required)</span>
                    <span>• Email (required)</span>
                    <span>• Programme</span>
                    <span>• Year</span>
                    <span>• Section</span>
                    <span>• Roll No</span>
                    <span>• Phone</span>
                    <span>• Role / Position</span>
                  </div>
                  <p className="text-xs text-[#111]/40 mt-2 font-medium">
                    Column names don't need to be exact — AI will intelligently match them.
                  </p>
                </div>
              </>
            )}

            {importResults && (
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-green-100 rounded-[6px] p-3 text-center border-[2px] border-[#111]">
                    <p className="text-lg font-black text-green-700">{importResults.summary.added}</p>
                    <p className="text-xs text-green-600 font-bold">Added</p>
                  </div>
                  <div className="bg-blue-100 rounded-[6px] p-3 text-center border-[2px] border-[#111]">
                    <p className="text-lg font-black text-blue-700">{importResults.summary.updated}</p>
                    <p className="text-xs text-blue-600 font-bold">Updated</p>
                  </div>
                  <div className="bg-[#FDE8D0] rounded-[6px] p-3 text-center border-[2px] border-[#111]">
                    <p className="text-lg font-black text-[#111]/60">{importResults.summary.skipped}</p>
                    <p className="text-xs text-[#111]/40 font-bold">Skipped</p>
                  </div>
                  <div className="bg-red-100 rounded-[6px] p-3 text-center border-[2px] border-[#111]">
                    <p className="text-lg font-black text-red-700">{importResults.summary.failed}</p>
                    <p className="text-xs text-red-600 font-bold">Failed</p>
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1">
                  {importResults.results.map((r: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-[4px] bg-[#FDE8D0]/30 border border-[#111]/10 text-sm">
                      <span className="font-bold text-[#111] truncate flex-1">{r.name}</span>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {r.status === 'added' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                        {r.status === 'role_updated' && <ShieldCheck className="w-4 h-4 text-blue-600" />}
                        {r.status === 'already_exists' && <AlertCircle className="w-4 h-4 text-[#111]/40" />}
                        {r.status === 'skipped' && <AlertCircle className="w-4 h-4 text-yellow-600" />}
                        {r.status === 'failed' && <XCircle className="w-4 h-4 text-red-600" />}
                        <span className="text-xs text-[#111]/50 capitalize font-medium">{r.status.replace('_', ' ')}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <button onClick={() => { setImportResults(null); setImportDialogOpen(false); }} className={`w-full ${NB_BTN_ORANGE} px-4 py-2.5 text-sm font-bold`} style={{ boxShadow: '3px 3px 0px #111' }}>
                  Done
                </button>
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
    <span className="text-[#111]/50 font-medium">{label}:</span>
    <span className="font-bold text-[#111] break-all text-right">{value}</span>
  </div>
);

const MemberRow = ({ member, onView, onRemove, onChangeRole, removing, isSuperAdmin, onEdit }: { member: Member; onView: () => void; onRemove: () => void; onChangeRole: () => void; removing: boolean; isSuperAdmin?: boolean; onEdit?: () => void }) => (
  <div className="flex items-center gap-3 p-3 rounded-[6px] border-[2px] border-[#111] bg-white hover:bg-[#FDE8D0]/30 hover:translate-y-[-1px] transition-all cursor-pointer overflow-hidden" style={{ boxShadow: '2px 2px 0px #111' }} onClick={onView}>
    {/* Avatar */}
    <div className="w-9 h-9 rounded-[4px] overflow-hidden border-[2px] border-[#111] shrink-0">
      {member.avatar_url ? (
        <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-[#FDE8D0] flex items-center justify-center text-xs font-black text-[#111]">
          {member.full_name[0]}
        </div>
      )}
    </div>

    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold text-[#111] truncate inline-flex items-center gap-1">
        {member.full_name}
        {getRoleBadgeVariant(member.role) && getRoleBadgeVariant(member.role) !== 'gray' && (
          <VerifiedBadge variant={getRoleBadgeVariant(member.role)!} size={14} />
        )}
      </p>
      <span className="text-[10px] px-2 py-0.5 mt-0.5 block w-fit font-black border-[1.5px] border-[#111] rounded-[3px] bg-[#E98A3A]/20 text-[#111]">
        {roleLabelMap[member.role] ?? member.role}
      </span>
    </div>

    <div className="shrink-0" onClick={e => e.stopPropagation()}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="h-8 w-8 flex items-center justify-center border-[2px] border-[#111] rounded-[4px] hover:bg-[#FDE8D0] transition-colors">
            <MoreVertical className="w-4 h-4 text-[#111]" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44 border-[2px] border-[#111] rounded-[6px] bg-white" style={{ boxShadow: '3px 3px 0px #111' }}>
          <DropdownMenuItem onClick={onView} className="font-medium text-[#111] hover:bg-[#FDE8D0] cursor-pointer">
            <Eye className="w-4 h-4 mr-2" /> View Details
          </DropdownMenuItem>
          {isSuperAdmin && onEdit && (
            <DropdownMenuItem onClick={onEdit} className="font-medium text-[#111] hover:bg-[#FDE8D0] cursor-pointer">
              <Pencil className="w-4 h-4 mr-2" /> Edit Profile
            </DropdownMenuItem>
          )}
          {member.role !== 'president' && (
            <>
              <DropdownMenuItem onClick={onChangeRole} className="font-medium text-[#111] hover:bg-[#FDE8D0] cursor-pointer">
                <ShieldCheck className="w-4 h-4 mr-2" /> Change Role
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#111]/20" />
              <DropdownMenuItem onClick={onRemove} disabled={removing} className="font-medium text-red-600 hover:bg-red-50 cursor-pointer">
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
