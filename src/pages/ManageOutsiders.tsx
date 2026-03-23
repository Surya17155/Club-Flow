import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Plus, Trash2, User, Mail, Phone, GraduationCap, Building2, ChevronRight, X, UserPlus, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PROGRAMMES = ['B.Tech (CS)', 'B.Tech (IT)', 'BBA', 'MBA', 'B.Com', 'BA (Hons)', 'BCA', 'MCA'];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];

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

const ManageOutsiders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [outsiders, setOutsiders] = useState<Outsider[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedOutsider, setSelectedOutsider] = useState<Outsider | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    programme: '',
    section: '',
    year: '',
    rollNo: '',
    phone: '',
  });

  const fetchOutsiders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('manage-outsider', {
        method: 'GET',
      });
      if (error) throw error;
      setOutsiders(data?.outsiders || []);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to fetch outsiders', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOutsiders();
  }, []);

  const resetForm = () => {
    setFormData({ email: '', fullName: '', programme: '', section: '', year: '', rollNo: '', phone: '' });
  };

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
      fetchOutsiders();
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
      fetchOutsiders();
    } catch (err: any) {
      toast({ title: 'Failed to remove', description: err.message, variant: 'destructive' });
    } finally {
      setDeleting(null);
    }
  };

  const roleLabelMap: Record<string, string> = {
    admin: 'Admin',
    president: 'President',
    vice_president: 'Vice President',
    secretary: 'Secretary',
    social_media_head: 'Social Media Head',
    member: 'Member',
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-3 backdrop-blur-md bg-background/70">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-muted-foreground">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold font-display text-foreground flex-1">Manage Outsiders</h1>
          <Button size="sm" onClick={() => setShowAddDialog(true)} className="gap-1.5 gradient-gold text-primary-foreground">
            <Plus className="w-4 h-4" />
            Add
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className={`px-4 pb-6 ${isMobile ? 'pb-28' : ''}`}>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : outsiders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <User className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">No Outsiders Added</h3>
            <p className="text-sm text-muted-foreground max-w-[250px]">
              Click "Add" to manually onboard users with non-IILM email addresses.
            </p>
          </div>
        ) : (
          <div className="space-y-3 mt-2">
            {outsiders.map((outsider, i) => (
              <motion.div
                key={outsider.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card
                  className="cursor-pointer hover:shadow-md transition-shadow border-border/60"
                  onClick={() => setSelectedOutsider(outsider)}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      {outsider.avatar_url ? (
                        <img src={outsider.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{outsider.full_name || 'Unnamed'}</p>
                      <p className="text-xs text-muted-foreground truncate">{outsider.email}</p>
                      {outsider.clubs.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {outsider.clubs.map((c, idx) => (
                            <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                              {c.club_name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedOutsider} onOpenChange={(v) => !v && setSelectedOutsider(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-display">Outsider Profile</DialogTitle>
          </DialogHeader>
          {selectedOutsider && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  {selectedOutsider.avatar_url ? (
                    <img src={selectedOutsider.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    <User className="w-7 h-7 text-primary" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">{selectedOutsider.full_name || 'Unnamed'}</h3>
                  <p className="text-xs text-muted-foreground">{selectedOutsider.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {selectedOutsider.programme && (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Programme</p>
                      <p className="text-sm text-foreground">{selectedOutsider.programme}</p>
                    </div>
                  </div>
                )}
                {selectedOutsider.year && (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Year</p>
                      <p className="text-sm text-foreground">{selectedOutsider.year}</p>
                    </div>
                  </div>
                )}
                {selectedOutsider.section && (
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Section</p>
                      <p className="text-sm text-foreground">{selectedOutsider.section}</p>
                    </div>
                  </div>
                )}
                {selectedOutsider.roll_no && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Roll No</p>
                      <p className="text-sm text-foreground">{selectedOutsider.roll_no}</p>
                    </div>
                  </div>
                )}
                {selectedOutsider.phone && (
                  <div className="flex items-center gap-2 col-span-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Phone</p>
                      <a href={`tel:${selectedOutsider.phone}`} className="text-sm text-primary">{selectedOutsider.phone}</a>
                    </div>
                  </div>
                )}
              </div>

              {selectedOutsider.clubs.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Club Memberships</p>
                  <div className="space-y-2">
                    {selectedOutsider.clubs.map((c, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50">
                        <span className="text-sm font-medium text-foreground">{c.club_name}</span>
                        <span className="text-xs text-muted-foreground">{roleLabelMap[c.role] || c.role}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-[10px] text-muted-foreground">
                Added on {new Date(selectedOutsider.created_at).toLocaleDateString()}
              </p>

              <Button
                variant="destructive"
                className="w-full"
                onClick={() => handleDelete(selectedOutsider.id)}
                disabled={deleting === selectedOutsider.id}
              >
                {deleting === selectedOutsider.id ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Remove Outsider
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Outsider Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-display flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-primary" />
              Add Outsider
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="outsider-name">Full Name *</Label>
              <Input
                id="outsider-name"
                placeholder="Enter full name"
                value={formData.fullName}
                onChange={e => setFormData(p => ({ ...p, fullName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="outsider-email">Email * (non-IILM)</Label>
              <Input
                id="outsider-email"
                type="email"
                placeholder="user@gmail.com"
                value={formData.email}
                onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Programme</Label>
                <Select value={formData.programme} onValueChange={v => setFormData(p => ({ ...p, programme: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {PROGRAMMES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Year</Label>
                <Select value={formData.year} onValueChange={v => setFormData(p => ({ ...p, year: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    {YEARS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="outsider-section">Section</Label>
                <Input
                  id="outsider-section"
                  placeholder="e.g., A"
                  value={formData.section}
                  onChange={e => setFormData(p => ({ ...p, section: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="outsider-roll">Roll No.</Label>
                <Input
                  id="outsider-roll"
                  placeholder="e.g., 2024CS001"
                  value={formData.rollNo}
                  onChange={e => setFormData(p => ({ ...p, rollNo: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="outsider-phone">Phone Number</Label>
              <Input
                id="outsider-phone"
                type="tel"
                placeholder="+91 XXXXXXXXXX"
                value={formData.phone}
                onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
              />
            </div>

            <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 p-3 border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                <strong>Default password:</strong> iilm@123 — The user can change it later in Settings.
              </p>
            </div>

            <Button
              className="w-full gradient-gold text-primary-foreground"
              onClick={handleAdd}
              disabled={submitting}
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Outsider
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {isMobile && <MobileBottomNav />}
    </div>
  );
};

export default ManageOutsiders;
