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
import { useDesign } from '@/contexts/DesignContext';

const roleLabelMap: Record<string, string> = {
  admin: 'Admin', president: 'President', vice_president: 'Vice President',
  secretary: 'Secretary', social_media_head: 'Social Media Head', member: 'Member',
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

const Profile = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, updateProfile, uploadAvatar } = useProfile();
  const { clubs } = useUserClubs();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { activeDesign } = useDesign();
  const isNeo = activeDesign === 'design-2';
  const fileRef = useRef<HTMLInputElement>(null);

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  const val = (key: string) => form[key] ?? (profile as any)?.[key] ?? '';

  if (!user && !authLoading) return <Navigate to="/" replace />;
  const isLoading = authLoading || profileLoading;

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateProfile({
        full_name: val('full_name'), about: val('about'), programme: val('programme'),
        semester: val('semester'), year: val('year'), phone: val('phone'),
        roll_no: val('roll_no'), class_coordinator: val('class_coordinator'), section: val('section'),
        social_linkedin: val('social_linkedin'), social_instagram: val('social_instagram'), social_gmail: val('social_gmail'),
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
    <div className="max-w-3xl mx-auto grid gap-6">
      {isMobile && (
        <div className="flex items-center gap-4 mb-2">
          <button onClick={() => navigate(-1)} className="p-2 rounded-full" style={isNeo ? { border: '2px solid #111', background: '#FFFDF5' } : {}}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold" style={isNeo ? { fontFamily: NEO.font, color: '#111' } : {}}>Edit Profile</h1>
        </div>
      )}

      {/* Avatar */}
      <div className="flex flex-col items-center" style={isNeo ? { ...NEO.card, maxWidth: '240px', margin: '0 auto', aspectRatio: '1' } : {}}>
        <div className={isNeo ? '' : 'glass-card p-6 flex flex-col items-center max-w-[240px] mx-auto aspect-square justify-center'}>
          <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-24 h-24 rounded-full object-cover" style={{ border: isNeo ? '3px solid #111' : '4px solid white', boxShadow: isNeo ? '3px 3px 0px #111' : undefined }} />
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
          <p className="text-xs mt-2" style={{ color: '#888' }}>Click to change photo</p>
        </div>
      </div>

      {/* Personal Info */}
      <div style={isNeo ? NEO.card : undefined} className={isNeo ? '' : 'glass-card p-8'}>
        <h2 className="text-lg font-bold mb-6" style={isNeo ? { fontFamily: NEO.font, color: '#111' } : {}}>Personal Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[
            { label: 'Full Name', key: 'full_name' },
            { label: 'Email', key: 'email', disabled: true, value: user.email ?? '' },
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
      <div style={isNeo ? NEO.card : undefined} className={isNeo ? '' : 'glass-card p-8'}>
        <h2 className="text-lg font-bold mb-6" style={isNeo ? { fontFamily: NEO.font, color: '#111' } : {}}>Social Links</h2>
        <div className="space-y-4">
          {[
            { icon: <Linkedin className="w-5 h-5" style={{ color: isNeo ? '#111' : undefined }} />, key: 'social_linkedin', placeholder: 'https://linkedin.com/in/...' },
            { icon: <Instagram className="w-5 h-5" style={{ color: isNeo ? '#111' : undefined }} />, key: 'social_instagram', placeholder: 'https://instagram.com/...' },
            { icon: <Mail className="w-5 h-5" style={{ color: isNeo ? '#111' : undefined }} />, key: 'social_gmail', placeholder: 'yourname@gmail.com' },
          ].map(s => (
            <div key={s.key} className="flex items-center gap-3">
              {s.icon}
              <Input
                value={val(s.key)}
                onChange={e => setForm({ ...form, [s.key]: e.target.value })}
                placeholder={s.placeholder}
                style={isNeo ? NEO.input : {}}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Club Memberships */}
      {clubs.length > 0 && (
        <div style={isNeo ? NEO.card : undefined} className={isNeo ? '' : 'glass-card p-8'}>
          <h2 className="text-lg font-bold mb-6" style={isNeo ? { fontFamily: NEO.font, color: '#111' } : {}}>Club Memberships</h2>
          <div className="space-y-3">
            {clubs.map(club => (
              <div
                key={club.club_id}
                className="flex items-center justify-between p-4"
                style={isNeo ? { border: '2px solid #111', borderRadius: '10px', background: '#FFFDF5' } : { borderRadius: '12px', background: 'rgba(255,255,255,0.3)' }}
              >
                <span className="font-medium" style={{ color: '#111' }}>{club.club_name}</span>
                <span
                  className="text-xs font-bold px-3 py-1"
                  style={isNeo ? { ...NEO.badge, background: '#FFF8E1' } : { borderRadius: '9999px', background: 'var(--primary-10)', color: 'var(--primary)' }}
                >
                  {roleLabelMap[club.role] ?? club.role}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Save */}
      <div className="flex justify-end pb-8">
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
