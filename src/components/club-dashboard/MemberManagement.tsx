import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { UserPlus, Trash2, Eye, Loader2, Search, Users, MoreVertical, ShieldCheck } from 'lucide-react';

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
  secretary: 'Secretary', social_media_head: 'Social Media Head', member: 'Member',
};

const roleColors: Record<string, string> = {
  president: 'bg-primary/10 text-primary',
  vice_president: 'bg-purple-100 text-purple-700',
  secretary: 'bg-blue-100 text-blue-700',
  social_media_head: 'bg-pink-100 text-pink-700',
  member: 'bg-muted text-muted-foreground',
};

const assignableRoles = [
  { value: 'vice_president', label: 'Vice President' },
  { value: 'secretary', label: 'Secretary' },
  { value: 'social_media_head', label: 'Social Media Head' },
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

  // Add member form state
  const [addForm, setAddForm] = useState({
    fullName: '', email: '', programme: '', section: '', year: '', rollNo: '', phone: '', role: 'member',
  });

  const updateAddForm = (field: string, value: string) => {
    setAddForm(prev => ({ ...prev, [field]: value }));
  };

  const resetAddForm = () => {
    setAddForm({ fullName: '', email: '', programme: '', section: '', year: '', rollNo: '', phone: '', role: 'member' });
  };

  const fetchMembers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('club_members')
      .select('id, user_id, role, joined_at, profiles(full_name, email, programme, roll_no, avatar_url, phone, year, section, about, social_linkedin, social_instagram, social_gmail)')
      .eq('club_id', clubId);

    if (data) {
      setMembers((data as any[]).map(m => ({
        id: m.id,
        user_id: m.user_id,
        role: m.role,
        joined_at: m.joined_at,
        full_name: m.profiles?.full_name ?? 'Unknown',
        email: m.profiles?.email ?? null,
        programme: m.profiles?.programme ?? null,
        roll_no: m.profiles?.roll_no ?? null,
        avatar_url: m.profiles?.avatar_url ?? null,
        phone: m.profiles?.phone ?? null,
        year: m.profiles?.year ?? null,
        section: m.profiles?.section ?? null,
        about: m.profiles?.about ?? null,
        social_linkedin: m.profiles?.social_linkedin ?? null,
        social_instagram: m.profiles?.social_instagram ?? null,
        social_gmail: m.profiles?.social_gmail ?? null,
      })));
    }
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
        toast.success(`${addForm.fullName} added! They can use "Forgot Password" on the login page to set their password and log in.`);
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

  const filtered = members.filter(m =>
    m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.roll_no?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const postHolders = filtered.filter(m => m.role !== 'member');
  const regularMembers = filtered.filter(m => m.role === 'member');

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg text-foreground">Members ({members.length})</h3>
        </div>
        <Button onClick={() => setAddDialogOpen(true)} size="sm" className="rounded-full gap-2">
          <UserPlus className="w-4 h-4" /> Add Member
        </Button>
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

      {/* Add Member Dialog - Full Registration Form */}
      <Dialog open={addDialogOpen} onOpenChange={(open) => { setAddDialogOpen(open); if (!open) resetAddForm(); }}>
        <DialogContent className="glass-card border-white/20 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">Add New Member</DialogTitle>
            <p className="text-sm text-muted-foreground">Fill in their details so they can log in directly without signing up.</p>
          </DialogHeader>
          <div className="space-y-4 mt-2">
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
              Add Member
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
                  <SelectContent>
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
                <h3 className="text-lg font-bold text-foreground">{viewMember.full_name}</h3>
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
  <div className="flex items-center justify-between p-3 rounded-xl bg-white/20 hover:bg-white/30 transition-colors cursor-pointer" onClick={onView}>
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/40 shrink-0">
        {member.avatar_url ? (
          <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
            {member.full_name[0]}
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">{member.full_name}</p>
        <p className="text-xs text-muted-foreground">{member.email || member.roll_no || ''}</p>
      </div>
    </div>
    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
      <Badge variant="outline" className={`text-xs ${roleColors[member.role] || ''}`}>
        {roleLabelMap[member.role] ?? member.role}
      </Badge>
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
