import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useUserClubs, UserClub } from '@/hooks/useUserClubs';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Linkedin, Instagram, Mail, Save, Loader2, LogOut, Download, X } from 'lucide-react';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDesign } from '@/contexts/DesignContext';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { AnimatePresence, motion } from 'framer-motion';

const roleLabelMap: Record<string, string> = {
  admin: 'Admin', president: 'President', vice_president: 'Vice President',
  secretary: 'Secretary', social_media_head: 'Social Media Head', member: 'Member',
  general_secretary: 'General Secretary', deputy_secretary: 'Deputy Secretary',
  treasurer: 'Treasurer', deputy_treasurer: 'Deputy Treasurer', assistant_treasurer: 'Assistant Treasurer',
  social_media_coordinator: 'Social Media Coordinator', technical_pr_head: 'Technical PR Head',
  technical_pr_coordinator: 'Technical PR Coordinator',
};

const NEO = {
  card: {
    background: '#FFFFFF',
    border: '2px solid #111111',
    borderRadius: '12px',
    boxShadow: '4px 4px 0px #111111',
    padding: '28px',
  } as React.CSSProperties,
  font: "'Space Grotesk', sans-serif",
  input: {
    border: '2px solid #111111',
    borderRadius: '10px',
    background: '#FFFDF5',
    fontFamily: "'Space Grotesk', sans-serif",
  } as React.CSSProperties,
  btnPrimary: {
    background: '#E98A3A',
    color: '#111111',
    border: '2px solid #111111',
    borderRadius: '10px',
    boxShadow: '3px 3px 0px #111111',
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
  } as React.CSSProperties,
  badge: {
    border: '2px solid #111',
    borderRadius: '6px',
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
  } as React.CSSProperties,
};

const LINKEDIN_PREFIX = 'linkedin.com/in/';
const INSTAGRAM_PREFIX = 'instagram.com/';

const extractUsername = (url: string, prefix: string): string => {
  if (!url) return '';
  const lowerUrl = url.toLowerCase();
  const idx = lowerUrl.indexOf(prefix.toLowerCase());
  if (idx !== -1) {
    return url.substring(idx + prefix.length).replace(/\/$/, '');
  }
  if (!url.includes('/') && !url.includes('.')) return url;
  return url;
};

const buildFullUrl = (username: string, type: 'linkedin' | 'instagram'): string => {
  if (!username) return '';
  if (username.startsWith('http')) return username;
  if (type === 'linkedin') return `https://linkedin.com/in/${username}`;
  return `https://instagram.com/${username}`;
};

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, updateProfile, uploadAvatar } = useProfile();
  const { clubs, loading: clubsLoading } = useUserClubs();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { activeDesign } = useDesign();
  const isNeo = activeDesign === 'design-2';
  const fileRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [expandedClub, setExpandedClub] = useState<string | null>(null);
  const [confirmLeaveClub, setConfirmLeaveClub] = useState<UserClub | null>(null);
  const [showExportDialog, setShowExportDialog] = useState<UserClub | null>(null);
  const [leavingClub, setLeavingClub] = useState(false);

  const val = (key: string) => form[key] ?? (profile as any)?.[key] ?? '';

  if (!user && !authLoading) return <Navigate to="/" replace />;
  const isLoading = authLoading || profileLoading;

  const linkedinUsername = form.social_linkedin !== undefined
    ? form.social_linkedin
    : extractUsername(val('social_linkedin'), LINKEDIN_PREFIX);

  const instagramUsername = form.social_instagram !== undefined
    ? form.social_instagram
    : extractUsername(val('social_instagram'), INSTAGRAM_PREFIX);

  const handleSave = async () => {
    setSaving(true);
    try {
      const linkedinFull = buildFullUrl(form.social_linkedin ?? linkedinUsername, 'linkedin');
      const instagramFull = buildFullUrl(form.social_instagram ?? instagramUsername, 'instagram');

      await updateProfile({
        full_name: val('full_name'), about: val('about'), programme: val('programme'),
        semester: val('semester'), year: val('year'), phone: val('phone'),
        roll_no: val('roll_no'), class_coordinator: val('class_coordinator'), section: val('section'),
        social_linkedin: linkedinFull, social_instagram: instagramFull, social_gmail: val('social_gmail'),
      });
      setForm({});
      toast({ title: 'Profile updated', description: 'Your changes have been saved.' });
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadAvatar(file);
      toast({ title: 'Avatar updated' });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    }
  };

  const handleLeaveClub = async (club: UserClub) => {
    setLeavingClub(true);
    try {
      const { error } = await supabase
        .from('club_members')
        .delete()
        .eq('club_id', club.club_id)
        .eq('user_id', user!.id);
      if (error) throw error;
      setConfirmLeaveClub(null);
      setExpandedClub(null);
      setShowExportDialog(club);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
      setConfirmLeaveClub(null);
    }
    setLeavingClub(false);
  };

  const handleExportData = async (club: UserClub) => {
    try {
      const { data: attendance } = await supabase
        .from('attendance')
        .select('*, events(name, event_date, club_id)')
        .eq('student_id', user!.id);

      const clubAttendance = (attendance || []).filter(
        (a: any) => a.events?.club_id === club.club_id
      );

      const csvRows = [
        ['Event Name', 'Event Date', 'Scanned At', 'Status'].join(','),
        ...clubAttendance.map((a: any) => [
          `"${a.events?.name || ''}"`,
          a.events?.event_date || '',
          a.scanned_at || '',
          a.status || '',
        ].join(','))
      ];

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${club.club_name}_attendance_data.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast({ title: 'Data exported', description: 'Your attendance data has been downloaded.' });
    } catch (err: any) {
      toast({ title: 'Export failed', description: err.message, variant: 'destructive' });
    }
    setShowExportDialog(null);
  };

  const initials = val('full_name').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  const content = (
    <div className="max-w-3xl mx-auto grid gap-6 overflow-hidden box-border w-full">
      {isMobile && (
        <div className="flex items-center gap-4 mb-2">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full" style={isNeo ? { border: '2px solid #111', background: '#FFFDF5' } : {}}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold" style={isNeo ? { fontFamily: NEO.font, color: '#111' } : {}}>Edit Profile</h1>
        </div>
      )}

      {/* Avatar */}
      <div
        className="flex items-center justify-center"
        style={isNeo ? { ...NEO.card, maxWidth: '200px', margin: '0 auto', aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' } : {}}
      >
        <div className={isNeo ? 'flex flex-col items-center justify-center' : 'glass-card p-6 flex flex-col items-center max-w-[200px] mx-auto aspect-square justify-center'}>
          <div className="relative group cursor-pointer w-24 h-24" onClick={() => fileRef.current?.click()}>
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt="Avatar"
                className="w-24 h-24 rounded-full object-cover"
                style={{ border: isNeo ? '3px solid #111' : '4px solid white', boxShadow: isNeo ? '3px 3px 0px #111' : undefined }}
              />
            ) : (
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold"
                style={isNeo ? { background: '#E98A3A', color: '#111', border: '3px solid #111', boxShadow: '3px 3px 0px #111' } : { background: 'var(--primary)', color: 'white', border: '4px solid white' }}
              >
                {initials}
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-5 h-5 text-white" />
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          <p className="text-xs mt-2 text-center" style={{ color: '#888' }}>Click to change photo</p>
        </div>
      </div>

      {/* Personal Info */}
      <div style={isNeo ? { ...NEO.card, padding: isMobile ? '16px' : '20px', boxSizing: 'border-box' as const } : undefined} className={isNeo ? 'w-full min-w-0 overflow-hidden' : 'glass-card p-6 w-full min-w-0 overflow-hidden'}>
        <h2 className="text-lg font-bold mb-6" style={isNeo ? { fontFamily: NEO.font, color: '#111' } : {}}>Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { label: 'Full Name', key: 'full_name' },
            { label: 'Email', key: 'email', disabled: true, value: user?.email ?? '' },
            { label: 'Phone', key: 'phone' },
            { label: 'Roll No', key: 'roll_no' },
            { label: 'Programme', key: 'programme' },
            { label: 'Section', key: 'section' },
            { label: 'Semester', key: 'semester' },
            { label: 'Year', key: 'year' },
            { label: 'Class Coordinator', key: 'class_coordinator', placeholder: 'Enter class coordinator name' },
          ].map(field => (
            <div key={field.key}>
              <Label style={isNeo ? { fontFamily: NEO.font, fontWeight: 600, color: '#111' } : {}}>{field.label}</Label>
              <Input
                value={field.disabled ? field.value : val(field.key)}
                onChange={field.disabled ? undefined : e => setForm({ ...form, [field.key]: e.target.value })}
                disabled={field.disabled}
                className="mt-1.5"
                placeholder={field.placeholder}
                style={isNeo ? { ...NEO.input, opacity: field.disabled ? 0.6 : 1 } : { opacity: field.disabled ? 0.6 : 1 }}
              />
            </div>
          ))}
        </div>
        <div className="mt-5">
          <Label style={isNeo ? { fontFamily: NEO.font, fontWeight: 600, color: '#111' } : {}}>About</Label>
          <Textarea
            value={val('about')}
            onChange={e => setForm({ ...form, about: e.target.value })}
            className="mt-1.5"
            placeholder="Tell us about yourself..."
            rows={3}
            style={isNeo ? NEO.input : {}}
          />
        </div>
      </div>

      {/* Social Links */}
      <div style={isNeo ? { ...NEO.card, padding: isMobile ? '16px' : '20px', boxSizing: 'border-box' as const } : undefined} className={isNeo ? 'w-full min-w-0 overflow-hidden' : 'glass-card p-6 w-full min-w-0 overflow-hidden'}>
        <h2 className="text-lg font-bold mb-6" style={isNeo ? { fontFamily: NEO.font, color: '#111' } : {}}>Social Links</h2>
        <div className="space-y-4">
          {/* LinkedIn */}
          <div className="flex items-center gap-3">
            <Linkedin className="w-5 h-5 shrink-0" style={{ color: isNeo ? '#111' : undefined }} />
            <div className="flex-1 flex items-center" style={isNeo ? { ...NEO.input, overflow: 'hidden', padding: 0 } : { border: '1px solid hsl(var(--border))', borderRadius: '8px', overflow: 'hidden' }}>
              <span className="text-xs px-2 py-2 shrink-0 select-none" style={{ background: isNeo ? '#F4EFE7' : '#f3f4f6', color: '#666', fontFamily: isNeo ? NEO.font : undefined, borderRight: isNeo ? '2px solid #111' : '1px solid hsl(var(--border))' }}>
                linkedin.com/in/
              </span>
              <input
                className="flex-1 px-2 py-2 text-sm outline-none bg-transparent"
                value={linkedinUsername}
                onChange={e => setForm({ ...form, social_linkedin: e.target.value })}
                placeholder="username"
                style={{ fontFamily: isNeo ? NEO.font : undefined }}
              />
            </div>
          </div>

          {/* Instagram */}
          <div className="flex items-center gap-3">
            <Instagram className="w-5 h-5 shrink-0" style={{ color: isNeo ? '#111' : undefined }} />
            <div className="flex-1 flex items-center" style={isNeo ? { ...NEO.input, overflow: 'hidden', padding: 0 } : { border: '1px solid hsl(var(--border))', borderRadius: '8px', overflow: 'hidden' }}>
              <span className="text-xs px-2 py-2 shrink-0 select-none" style={{ background: isNeo ? '#F4EFE7' : '#f3f4f6', color: '#666', fontFamily: isNeo ? NEO.font : undefined, borderRight: isNeo ? '2px solid #111' : '1px solid hsl(var(--border))' }}>
                instagram.com/
              </span>
              <input
                className="flex-1 px-2 py-2 text-sm outline-none bg-transparent"
                value={instagramUsername}
                onChange={e => setForm({ ...form, social_instagram: e.target.value })}
                placeholder="username"
                style={{ fontFamily: isNeo ? NEO.font : undefined }}
              />
            </div>
          </div>

          {/* Gmail */}
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 shrink-0" style={{ color: isNeo ? '#111' : undefined }} />
            <Input
              value={val('social_gmail')}
              onChange={e => setForm({ ...form, social_gmail: e.target.value })}
              placeholder="yourname@gmail.com"
              style={isNeo ? NEO.input : {}}
            />
          </div>
        </div>
      </div>

      {/* Club Memberships */}
      {clubs.length > 0 && (
        <div style={isNeo ? { ...NEO.card, padding: isMobile ? '16px' : '20px', boxSizing: 'border-box' as const } : undefined} className={isNeo ? 'w-full min-w-0 overflow-hidden' : 'glass-card p-6 w-full min-w-0 overflow-hidden'}>
          <h2 className="text-lg font-bold mb-6" style={isNeo ? { fontFamily: NEO.font, color: '#111' } : {}}>Club Memberships</h2>
          <div className="space-y-3">
            {clubs.map(club => (
              <div key={club.club_id}>
                <motion.div
                  layout
                  className="flex items-center justify-between p-4 cursor-pointer select-none"
                  style={isNeo
                    ? { border: '2px solid #111', borderRadius: expandedClub === club.club_id ? '10px 10px 0 0' : '10px', background: '#FFFDF5', transition: 'border-radius 0.2s' }
                    : { borderRadius: expandedClub === club.club_id ? '12px 12px 0 0' : '12px', background: 'rgba(255,255,255,0.3)', transition: 'border-radius 0.2s' }
                  }
                  onClick={() => setExpandedClub(expandedClub === club.club_id ? null : club.club_id)}
                >
                  <span className="font-medium" style={{ color: '#111' }}>{club.club_name}</span>
                  <span
                    className="text-xs font-bold px-3 py-1"
                    style={isNeo ? { ...NEO.badge, background: '#FFF8E1' } : { borderRadius: '9999px', background: 'var(--primary-10)', color: 'var(--primary)' }}
                  >
                    {roleLabelMap[club.role] ?? club.role}
                  </span>
                </motion.div>

                <AnimatePresence>
                  {expandedClub === club.club_id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      style={{ overflow: 'hidden' }}
                    >
                      <div
                        className="flex items-center justify-center p-3"
                        style={isNeo
                          ? { border: '2px solid #111', borderTop: 'none', borderRadius: '0 0 10px 10px', background: '#FFF0E0' }
                          : { borderRadius: '0 0 12px 12px', background: 'rgba(255,100,100,0.1)' }
                        }
                      >
                        <button
                          className="flex items-center gap-2 text-sm font-bold px-4 py-2"
                          style={isNeo
                            ? { background: '#FF4444', color: '#fff', border: '2px solid #111', borderRadius: '8px', boxShadow: '2px 2px 0px #111', fontFamily: NEO.font }
                            : { background: '#FF4444', color: '#fff', borderRadius: '8px' }
                          }
                          onClick={(e) => { e.stopPropagation(); setConfirmLeaveClub(club); }}
                        >
                          <LogOut className="w-4 h-4" />
                          Leave Club
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save */}
      <div className="flex justify-center pb-8">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-8 py-2.5 text-sm transition-all"
          style={isNeo ? NEO.btnPrimary : { background: 'var(--primary)', color: 'white', borderRadius: '9999px' }}
          onMouseEnter={isNeo ? (e) => { e.currentTarget.style.transform = 'translate(-1px, -1px)'; e.currentTarget.style.boxShadow = '4px 4px 0px #111'; } : undefined}
          onMouseLeave={isNeo ? (e) => { e.currentTarget.style.transform = 'translate(0,0)'; e.currentTarget.style.boxShadow = '3px 3px 0px #111'; } : undefined}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      {/* Confirm Leave Dialog */}
      <Dialog open={!!confirmLeaveClub} onOpenChange={() => setConfirmLeaveClub(null)}>
        <DialogContent
          className="max-w-[340px]"
          style={isNeo ? { background: '#FFFDF5', border: '2px solid #111', borderRadius: '12px', boxShadow: '6px 6px 0px #111', fontFamily: NEO.font } : {}}
        >
          <DialogTitle style={isNeo ? { fontFamily: NEO.font, color: '#111', fontWeight: 800 } : {}}>
            Leave {confirmLeaveClub?.club_name}?
          </DialogTitle>
          <p className="text-sm mt-2" style={{ color: '#555' }}>
            Are you sure you want to leave this club? This action cannot be undone.
          </p>
          <div className="flex gap-3 mt-5">
            <button
              className="flex-1 py-2.5 text-sm font-bold"
              style={isNeo ? { border: '2px solid #111', borderRadius: '8px', background: '#FFFDF5', boxShadow: '2px 2px 0px #111', fontFamily: NEO.font } : { border: '1px solid #ddd', borderRadius: '8px' }}
              onClick={() => setConfirmLeaveClub(null)}
            >
              No
            </button>
            <button
              className="flex-1 py-2.5 text-sm font-bold"
              disabled={leavingClub}
              style={isNeo ? { background: '#FF4444', color: '#fff', border: '2px solid #111', borderRadius: '8px', boxShadow: '2px 2px 0px #111', fontFamily: NEO.font } : { background: '#FF4444', color: '#fff', borderRadius: '8px' }}
              onClick={() => confirmLeaveClub && handleLeaveClub(confirmLeaveClub)}
            >
              {leavingClub ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Yes, Leave'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Export Data Dialog */}
      <Dialog open={!!showExportDialog} onOpenChange={() => setShowExportDialog(null)}>
        <DialogContent
          className="max-w-[340px]"
          style={isNeo ? { background: '#FFFDF5', border: '2px solid #111', borderRadius: '12px', boxShadow: '6px 6px 0px #111', fontFamily: NEO.font } : {}}
        >
          <DialogTitle style={isNeo ? { fontFamily: NEO.font, color: '#111', fontWeight: 800 } : {}}>
            Export Your Data?
          </DialogTitle>
          <p className="text-sm mt-2" style={{ color: '#555' }}>
            Would you like to export your attendance and event data from {showExportDialog?.club_name} before you go?
          </p>
          <div className="flex gap-3 mt-5">
            <button
              className="flex-1 py-2.5 text-sm font-bold"
              style={isNeo ? { border: '2px solid #111', borderRadius: '8px', background: '#FFFDF5', boxShadow: '2px 2px 0px #111', fontFamily: NEO.font } : { border: '1px solid #ddd', borderRadius: '8px' }}
              onClick={() => setShowExportDialog(null)}
            >
              No, Thanks
            </button>
            <button
              className="flex-1 py-2.5 text-sm font-bold flex items-center justify-center gap-2"
              style={isNeo ? { ...NEO.btnPrimary } : { background: 'var(--primary)', color: '#fff', borderRadius: '8px' }}
              onClick={() => showExportDialog && handleExportData(showExportDialog)}
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  if (!isMobile) {
    return (
      <DashboardLayout>
        <div className="space-y-4 sm:space-y-6 animate-fade-in">{content}</div>
      </DashboardLayout>
    );
  }

  return (
    <div className="min-h-screen pb-24 overflow-x-hidden" style={{ background: isNeo ? '#F4EFE7' : undefined }}>
      <div className="px-4 py-6 md:p-10 w-full overflow-hidden">{isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-[3px] border-[#E98A3A]/30 border-t-[#E98A3A] rounded-full animate-spin" />
        </div>
      ) : content}</div>
      <MobileBottomNav />
    </div>
  );
};

export default Profile;
