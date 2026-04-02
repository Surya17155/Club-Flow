import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useUserClubs } from '@/hooks/useUserClubs';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, Linkedin, Instagram, Mail, Save, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useIsMobile } from '@/hooks/use-mobile';

const roleLabelMap: Record<string, string> = {
  admin: 'Admin', president: 'President', vice_president: 'Vice President',
  secretary: 'Secretary', social_media_head: 'Social Media Head', member: 'Member',
};

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, updateProfile, uploadAvatar } = useProfile();
  const { clubs } = useUserClubs();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const val = (key: string) => form[key] ?? (profile as any)?.[key] ?? '';

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center dashboard-corner-gradient">
        <div className="w-8 h-8 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        full_name: val('full_name'),
        about: val('about'),
        programme: val('programme'),
        semester: val('semester'),
        year: val('year'),
        phone: val('phone'),
        roll_no: val('roll_no'),
        class_coordinator: val('class_coordinator'),
        section: val('section'),
        social_linkedin: val('social_linkedin'),
        social_instagram: val('social_instagram'),
        social_gmail: val('social_gmail'),
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

  const initials = val('full_name').split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  const content = (
    <div className="max-w-3xl mx-auto grid gap-6 text-foreground">
      {isMobile && (
        <div className="flex items-center gap-4 mb-2">
          <button onClick={() => navigate(-1)} className="glass-card p-2 rounded-full hover:bg-white/50 transition">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-2xl font-bold text-foreground font-['Space_Grotesk']">Edit Profile</h1>
        </div>
      )}

      <div className="glass-card p-6 flex flex-col items-center max-w-[240px] mx-auto aspect-square justify-center">
        <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold border-4 border-white shadow-lg">
              {initials}
            </div>
          )}
          <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Camera className="w-5 h-5 text-white" />
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        <p className="text-xs text-muted-foreground mt-2">Click to change photo</p>
      </div>

      <div className="glass-card p-8">
        <h2 className="text-lg font-bold text-foreground mb-6 font-['Space_Grotesk']">Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div><Label>Full Name</Label><Input value={val('full_name')} onChange={e => setForm({ ...form, full_name: e.target.value })} className="mt-1.5" /></div>
          <div><Label>Email</Label><Input value={user.email ?? ''} disabled className="mt-1.5 opacity-60" /></div>
          <div><Label>Phone</Label><Input value={val('phone')} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-1.5" /></div>
          <div><Label>Roll No</Label><Input value={val('roll_no')} onChange={e => setForm({ ...form, roll_no: e.target.value })} className="mt-1.5" /></div>
          <div><Label>Programme</Label><Input value={val('programme')} onChange={e => setForm({ ...form, programme: e.target.value })} className="mt-1.5" /></div>
          <div><Label>Section</Label><Input value={val('section')} onChange={e => setForm({ ...form, section: e.target.value })} className="mt-1.5" /></div>
          <div><Label>Semester</Label><Input value={val('semester')} onChange={e => setForm({ ...form, semester: e.target.value })} className="mt-1.5" /></div>
          <div><Label>Year</Label><Input value={val('year')} onChange={e => setForm({ ...form, year: e.target.value })} className="mt-1.5" /></div>
          <div><Label>Class Coordinator</Label><Input value={val('class_coordinator')} onChange={e => setForm({ ...form, class_coordinator: e.target.value })} className="mt-1.5" placeholder="Enter class coordinator name" /></div>
        </div>
        <div className="mt-5">
          <Label>About</Label>
          <Textarea value={val('about')} onChange={e => setForm({ ...form, about: e.target.value })} className="mt-1.5" placeholder="Tell us about yourself..." rows={3} />
        </div>
      </div>

      <div className="glass-card p-8">
        <h2 className="text-lg font-bold text-foreground mb-6 font-['Space_Grotesk']">Social Links</h2>
        <div className="space-y-4">
          <div className="flex items-center gap-3"><Linkedin className="w-5 h-5 text-muted-foreground flex-shrink-0" /><Input value={val('social_linkedin')} onChange={e => setForm({ ...form, social_linkedin: e.target.value })} placeholder="https://linkedin.com/in/..." /></div>
          <div className="flex items-center gap-3"><Instagram className="w-5 h-5 text-muted-foreground flex-shrink-0" /><Input value={val('social_instagram')} onChange={e => setForm({ ...form, social_instagram: e.target.value })} placeholder="https://instagram.com/..." /></div>
          <div className="flex items-center gap-3"><Mail className="w-5 h-5 text-muted-foreground flex-shrink-0" /><Input value={val('social_gmail')} onChange={e => setForm({ ...form, social_gmail: e.target.value })} placeholder="yourname@gmail.com" type="email" /></div>
        </div>
      </div>

      {clubs.length > 0 && (
        <div className="glass-card p-8">
          <h2 className="text-lg font-bold text-foreground mb-6 font-['Space_Grotesk']">Club Memberships</h2>
          <div className="space-y-3">
            {clubs.map(club => (
              <div key={club.club_id} className="flex items-center justify-between p-4 rounded-xl bg-white/30">
                <span className="font-medium text-foreground">{club.club_name}</span>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary">{roleLabelMap[club.role] ?? club.role}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-end pb-8">
        <Button onClick={handleSave} disabled={saving} className="gradient-gold text-primary-foreground px-8 py-2.5 rounded-full shadow-gold">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Changes
        </Button>
      </div>
    </div>
  );

  if (!isMobile) {
    return (
      <DashboardLayout>
        <div className="space-y-4 sm:space-y-6 animate-fade-in">{content}</div>
      </DashboardLayout>
    );
  }

  return <div className="min-h-screen dashboard-corner-gradient p-6 md:p-10">{content}</div>;
};

export default Profile;
