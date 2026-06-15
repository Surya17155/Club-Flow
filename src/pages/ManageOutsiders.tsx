import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2, User, Phone, GraduationCap, Building2, ChevronRight, UserPlus, Pencil } from 'lucide-react';
import { motion } from 'framer-motion';
import { getCachedOutsiders, preloadOutsiders } from '@/lib/preloadCache';

const PROGRAMMES = ['B.Tech (CS)', 'B.Tech (IT)', 'BBA', 'MBA', 'B.Com', 'BA (Hons)', 'BCA', 'MCA'];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

const NB = {
  font: "'Space Grotesk', sans-serif",
  bg: '#F4EFE7',
  card: '#FFFDF5',
  border: '#111',
  orange: '#E98A3A',
  yellow: '#FFE9A8',
  pink: '#F6D1CF',
};

interface Outsider {
  id: string;
  email: string;
  created_at: string;
  full_name: string;
  programme: string;
  year: string;
  section: string;
  roll_no: string;
  phone: string;
  avatar_url: string;
  about: string;
  clubs: { club_name: string; role: string }[];
}

const NBButton = ({ children, onClick, disabled, variant = 'orange', className = '', type }: any) => {
  const bg = variant === 'orange' ? NB.orange : variant === 'red' ? '#E25C5C' : variant === 'white' ? '#FFFFFF' : NB.yellow;
  const fg = '#111';
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 font-bold border-2 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{
        fontFamily: NB.font,
        background: bg,
        color: fg,
        borderColor: NB.border,
        borderRadius: 10,
        boxShadow: `4px 4px 0 0 ${NB.border}`,
      }}
    >
      {children}
    </button>
  );
};

const ManageOutsiders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [outsiders, setOutsiders] = useState<Outsider[]>(() => getCachedOutsiders() ?? []);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedOutsider, setSelectedOutsider] = useState<Outsider | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    fullName: '', programme: '', section: '', year: '', rollNo: '', phone: '',
  });

  const [formData, setFormData] = useState({
    email: '', fullName: '', programme: '', section: '', year: '', rollNo: '', phone: '',
  });

  const fetchOutsiders = async (force = false) => {
    const cached = getCachedOutsiders();
    if (cached) setOutsiders(cached);
    try {
      setOutsiders(await preloadOutsiders(force));
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to fetch outsiders', variant: 'destructive' });
    }
  };

  useEffect(() => { fetchOutsiders(); }, []);

  const resetForm = () => setFormData({ email: '', fullName: '', programme: '', section: '', year: '', rollNo: '', phone: '' });

  const handleAdd = async () => {
    if (!formData.email || !formData.fullName) {
      toast({ title: 'Missing fields', description: 'Email and Full Name are required.', variant: 'destructive' });
      return;
    }
    if (formData.email.endsWith('@iilm.edu')) {
      toast({ title: 'Invalid email', description: 'This feature is for non-IILM emails. IILM users should use normal signup.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-outsider', {
        body: {
          email: formData.email,
          full_name: formData.fullName,
          programme: formData.programme,
          section: formData.section,
          year: formData.year,
          roll_no: formData.rollNo,
          phone: formData.phone,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'Outsider added!', description: `${formData.fullName} has been added with default password.` });
      resetForm();
      setShowAddDialog(false);
      fetchOutsiders(true);
    } catch (err: any) {
      toast({ title: 'Failed to add', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (userId: string) => {
    setDeleting(userId);
    try {
      const { data, error } = await supabase.functions.invoke('manage-outsider', {
        body: { action: 'delete', user_id: userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'Outsider removed', description: 'User has been removed from the platform.' });
      setSelectedOutsider(null);
      fetchOutsiders(true);
    } catch (err: any) {
      toast({ title: 'Failed to remove', description: err.message, variant: 'destructive' });
    } finally {
      setDeleting(null);
    }
  };

  const handleUpdate = async () => {
    if (!selectedOutsider) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-outsider', {
        body: {
          action: 'update',
          user_id: selectedOutsider.id,
          full_name: editData.fullName,
          programme: editData.programme,
          section: editData.section,
          year: editData.year,
          roll_no: editData.rollNo,
          phone: editData.phone,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: 'Updated!', description: 'Outsider details have been updated.' });
      setEditMode(false);
      setSelectedOutsider(null);
      fetchOutsiders(true);
    } catch (err: any) {
      toast({ title: 'Failed to update', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (outsider: Outsider) => {
    setEditData({
      fullName: outsider.full_name,
      programme: outsider.programme,
      section: outsider.section,
      year: outsider.year,
      rollNo: outsider.roll_no,
      phone: outsider.phone,
    });
    setEditMode(true);
  };

  const roleLabelMap: Record<string, string> = {
    admin: 'Admin', president: 'President', vice_president: 'Vice President',
    secretary: 'Secretary', social_media_head: 'Social Media Head', member: 'Member',
  };

  const nbInputCls = "border-2 rounded-[8px] bg-white focus-visible:ring-0 focus-visible:ring-offset-0";
  const nbInputStyle = { borderColor: NB.border, fontFamily: NB.font, boxShadow: `2px 2px 0 0 ${NB.border}` } as const;

  const cardColors = [NB.yellow, NB.pink, '#D9E8C3', '#CFE3F4'];

  return (
    <div
      className={isMobile ? 'min-h-screen' : 'h-full overflow-auto'}
      style={{ background: NB.bg, fontFamily: NB.font }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-40 px-5 pt-[calc(env(safe-area-inset-top)+12px)] pb-4"
        style={{ background: NB.bg, borderBottom: `2px solid ${NB.border}` }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => { if (window.history.length > 1) navigate(-1); else navigate('/dashboard'); }}
            className="w-10 h-10 flex items-center justify-center border-2 transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
            style={{ background: NB.card, borderColor: NB.border, borderRadius: 10, boxShadow: `3px 3px 0 0 ${NB.border}`, color: NB.border }}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl md:text-2xl font-black flex-1" style={{ color: NB.border }}>
            Manage Outsiders
          </h1>
          <NBButton onClick={() => setShowAddDialog(true)} variant="orange">
            <span className="inline-flex items-center gap-1.5"><Plus className="w-4 h-4" />Add</span>
          </NBButton>
        </div>
      </div>

      {/* Content */}
      <div className={`px-5 pt-5 pb-8 ${isMobile ? 'pb-28' : ''}`}>
        {outsiders.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-16 text-center border-2 mt-2"
            style={{ background: NB.card, borderColor: NB.border, borderRadius: 14, boxShadow: `6px 6px 0 0 ${NB.border}` }}
          >
            <div
              className="w-16 h-16 flex items-center justify-center mb-4 border-2"
              style={{ background: NB.yellow, borderColor: NB.border, borderRadius: 12, boxShadow: `4px 4px 0 0 ${NB.border}` }}
            >
              <User className="w-8 h-8" style={{ color: NB.border }} />
            </div>
            <h3 className="text-lg font-black mb-1" style={{ color: NB.border }}>No Outsiders Added</h3>
            <p className="text-sm max-w-[280px]" style={{ color: '#444' }}>
              Click "Add" to manually onboard users with non-IILM email addresses.
            </p>
          </div>
        ) : (
          <div className="space-y-4 mt-1">
            {outsiders.map((outsider, i) => (
              <motion.div
                key={outsider.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <button
                  onClick={() => setSelectedOutsider(outsider)}
                  className="w-full text-left border-2 p-4 flex items-center gap-3 transition-all hover:-translate-x-[2px] hover:-translate-y-[2px]"
                  style={{
                    background: NB.card,
                    borderColor: NB.border,
                    borderRadius: 14,
                    boxShadow: `5px 5px 0 0 ${NB.border}`,
                  }}
                >
                  <div
                    className="w-12 h-12 flex items-center justify-center shrink-0 border-2 overflow-hidden"
                    style={{ background: cardColors[i % cardColors.length], borderColor: NB.border, borderRadius: 10 }}
                  >
                    {outsider.avatar_url ? (
                      <img src={outsider.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6" style={{ color: NB.border }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black truncate" style={{ color: NB.border }}>
                      {outsider.full_name || 'Unnamed'}
                    </p>
                    <p className="text-xs truncate" style={{ color: '#444' }}>{outsider.email}</p>
                    {outsider.clubs.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {outsider.clubs.map((c, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 font-bold border-2"
                            style={{ background: NB.yellow, borderColor: NB.border, color: NB.border, borderRadius: 999 }}
                          >
                            {c.club_name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 shrink-0" style={{ color: NB.border }} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedOutsider} onOpenChange={(v) => { if (!v) { setSelectedOutsider(null); setEditMode(false); } }}>
        <DialogContent
          className="max-w-md max-h-[85vh] overflow-auto p-0 border-2"
          style={{ background: NB.card, borderColor: NB.border, borderRadius: 16, boxShadow: `6px 6px 0 0 ${NB.border}`, fontFamily: NB.font }}
        >
          <DialogHeader className="p-5 pb-3" style={{ borderBottom: `2px solid ${NB.border}` }}>
            <DialogTitle className="text-lg font-black" style={{ color: NB.border }}>Outsider Profile</DialogTitle>
          </DialogHeader>

          {selectedOutsider && !editMode && (
            <div className="space-y-4 p-5">
              <div className="flex items-center gap-3">
                <div
                  className="w-16 h-16 flex items-center justify-center border-2 overflow-hidden"
                  style={{ background: NB.yellow, borderColor: NB.border, borderRadius: 12, boxShadow: `4px 4px 0 0 ${NB.border}` }}
                >
                  {selectedOutsider.avatar_url ? (
                    <img src={selectedOutsider.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-8 h-8" style={{ color: NB.border }} />
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-black truncate" style={{ color: NB.border }}>{selectedOutsider.full_name || 'Unnamed'}</h3>
                  <p className="text-xs truncate" style={{ color: '#444' }}>{selectedOutsider.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Programme', value: selectedOutsider.programme, Icon: GraduationCap },
                  { label: 'Year', value: selectedOutsider.year, Icon: Building2 },
                  { label: 'Section', value: selectedOutsider.section, Icon: Building2 },
                  { label: 'Roll No', value: selectedOutsider.roll_no, Icon: User },
                ].filter(f => f.value).map(({ label, value, Icon }) => (
                  <div
                    key={label}
                    className="p-2.5 border-2 flex items-center gap-2"
                    style={{ background: '#FFF', borderColor: NB.border, borderRadius: 10, boxShadow: `3px 3px 0 0 ${NB.border}` }}
                  >
                    <Icon className="w-4 h-4 shrink-0" style={{ color: NB.border }} />
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-wide" style={{ color: '#666' }}>{label}</p>
                      <p className="text-sm font-bold truncate" style={{ color: NB.border }}>{value}</p>
                    </div>
                  </div>
                ))}
                {selectedOutsider.phone && (
                  <div
                    className="col-span-2 p-2.5 border-2 flex items-center gap-2"
                    style={{ background: '#FFF', borderColor: NB.border, borderRadius: 10, boxShadow: `3px 3px 0 0 ${NB.border}` }}
                  >
                    <Phone className="w-4 h-4 shrink-0" style={{ color: NB.border }} />
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold uppercase tracking-wide" style={{ color: '#666' }}>Phone</p>
                      <a href={`tel:${selectedOutsider.phone}`} className="text-sm font-bold" style={{ color: NB.orange }}>
                        {selectedOutsider.phone}
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {selectedOutsider.clubs.length > 0 && (
                <div>
                  <p className="text-xs font-black uppercase mb-2 tracking-wide" style={{ color: NB.border }}>Club Memberships</p>
                  <div className="space-y-2">
                    {selectedOutsider.clubs.map((c, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 border-2"
                        style={{ background: cardColors[idx % cardColors.length], borderColor: NB.border, borderRadius: 10, boxShadow: `3px 3px 0 0 ${NB.border}` }}
                      >
                        <span className="text-sm font-bold" style={{ color: NB.border }}>{c.club_name}</span>
                        <span className="text-xs font-bold" style={{ color: NB.border }}>{roleLabelMap[c.role] || c.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[10px] font-bold" style={{ color: '#666' }}>
                Added on {new Date(selectedOutsider.created_at).toLocaleDateString()}
              </p>

              <div className="flex gap-2 pt-1">
                <NBButton variant="white" className="flex-1" onClick={() => startEdit(selectedOutsider)}>
                  <span className="inline-flex items-center justify-center gap-2"><Pencil className="w-4 h-4" />Edit</span>
                </NBButton>
                <NBButton
                  variant="red"
                  className="flex-1"
                  onClick={() => handleDelete(selectedOutsider.id)}
                  disabled={deleting === selectedOutsider.id}
                >
                  {deleting === selectedOutsider.id ? (
                    <div className="w-4 h-4 mx-auto border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <span className="inline-flex items-center justify-center gap-2"><Trash2 className="w-4 h-4" />Remove</span>
                  )}
                </NBButton>
              </div>
            </div>
          )}

          {selectedOutsider && editMode && (
            <div className="space-y-4 p-5">
              <div className="space-y-1.5">
                <Label className="font-black text-xs uppercase tracking-wide" style={{ color: NB.border }}>Full Name</Label>
                <Input className={nbInputCls} style={nbInputStyle} value={editData.fullName} onChange={e => setEditData(p => ({ ...p, fullName: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="font-black text-xs uppercase tracking-wide" style={{ color: NB.border }}>Programme</Label>
                  <Select value={editData.programme} onValueChange={v => setEditData(p => ({ ...p, programme: v }))}>
                    <SelectTrigger className={nbInputCls} style={nbInputStyle}><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{PROGRAMMES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="font-black text-xs uppercase tracking-wide" style={{ color: NB.border }}>Year</Label>
                  <Select value={editData.year} onValueChange={v => setEditData(p => ({ ...p, year: v }))}>
                    <SelectTrigger className={nbInputCls} style={nbInputStyle}><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>{YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="font-black text-xs uppercase tracking-wide" style={{ color: NB.border }}>Section</Label>
                  <Input className={nbInputCls} style={nbInputStyle} value={editData.section} onChange={e => setEditData(p => ({ ...p, section: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label className="font-black text-xs uppercase tracking-wide" style={{ color: NB.border }}>Roll No</Label>
                  <Input className={nbInputCls} style={nbInputStyle} value={editData.rollNo} onChange={e => setEditData(p => ({ ...p, rollNo: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="font-black text-xs uppercase tracking-wide" style={{ color: NB.border }}>Phone</Label>
                <Input className={nbInputCls} style={nbInputStyle} value={editData.phone} onChange={e => setEditData(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <NBButton variant="white" className="flex-1" onClick={() => setEditMode(false)}>Cancel</NBButton>
                <NBButton variant="orange" className="flex-1" onClick={handleUpdate} disabled={submitting}>
                  {submitting ? <div className="w-4 h-4 mx-auto border-2 border-black/30 border-t-black rounded-full animate-spin" /> : 'Save Changes'}
                </NBButton>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Outsider Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent
          className="max-w-md max-h-[85vh] overflow-auto p-0 border-2"
          style={{ background: NB.card, borderColor: NB.border, borderRadius: 16, boxShadow: `6px 6px 0 0 ${NB.border}`, fontFamily: NB.font }}
        >
          <DialogHeader className="p-5 pb-3" style={{ borderBottom: `2px solid ${NB.border}` }}>
            <DialogTitle className="text-lg font-black flex items-center gap-2" style={{ color: NB.border }}>
              <UserPlus className="w-5 h-5" style={{ color: NB.orange }} />
              Add Outsider
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 p-5">
            <div className="space-y-1.5">
              <Label className="font-black text-xs uppercase tracking-wide" style={{ color: NB.border }}>Full Name *</Label>
              <Input className={nbInputCls} style={nbInputStyle} placeholder="Enter full name" value={formData.fullName} onChange={e => setFormData(p => ({ ...p, fullName: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="font-black text-xs uppercase tracking-wide" style={{ color: NB.border }}>Email * (non-IILM)</Label>
              <Input className={nbInputCls} style={nbInputStyle} type="email" placeholder="user@gmail.com" value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-black text-xs uppercase tracking-wide" style={{ color: NB.border }}>Programme</Label>
                <Select value={formData.programme} onValueChange={v => setFormData(p => ({ ...p, programme: v }))}>
                  <SelectTrigger className={nbInputCls} style={nbInputStyle}><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{PROGRAMMES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="font-black text-xs uppercase tracking-wide" style={{ color: NB.border }}>Year</Label>
                <Select value={formData.year} onValueChange={v => setFormData(p => ({ ...p, year: v }))}>
                  <SelectTrigger className={nbInputCls} style={nbInputStyle}><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>{YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-black text-xs uppercase tracking-wide" style={{ color: NB.border }}>Section</Label>
                <Input className={nbInputCls} style={nbInputStyle} placeholder="e.g., A" value={formData.section} onChange={e => setFormData(p => ({ ...p, section: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label className="font-black text-xs uppercase tracking-wide" style={{ color: NB.border }}>Roll No.</Label>
                <Input className={nbInputCls} style={nbInputStyle} placeholder="e.g., 2024CS001" value={formData.rollNo} onChange={e => setFormData(p => ({ ...p, rollNo: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-black text-xs uppercase tracking-wide" style={{ color: NB.border }}>Phone Number</Label>
              <Input className={nbInputCls} style={nbInputStyle} type="tel" placeholder="+91 XXXXXXXXXX" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} />
            </div>

            <div
              className="p-3 border-2"
              style={{ background: NB.yellow, borderColor: NB.border, borderRadius: 10, boxShadow: `3px 3px 0 0 ${NB.border}` }}
            >
              <p className="text-xs font-bold" style={{ color: NB.border }}>
                <strong>Default password:</strong> iilm@123 — The user can change it later in Settings.
              </p>
            </div>

            <NBButton variant="orange" className="w-full" onClick={handleAdd} disabled={submitting}>
              {submitting ? (
                <div className="w-4 h-4 mx-auto border-2 border-black/30 border-t-black rounded-full animate-spin" />
              ) : (
                <span className="inline-flex items-center justify-center gap-2"><UserPlus className="w-4 h-4" />Add Outsider</span>
              )}
            </NBButton>
          </div>
        </DialogContent>
      </Dialog>

      {isMobile && <MobileBottomNav />}
    </div>
  );
};

export default ManageOutsiders;
