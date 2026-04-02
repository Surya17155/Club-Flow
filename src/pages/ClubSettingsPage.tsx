import { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { DashboardSidebar } from '@/components/layout/DashboardSidebar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useClub } from '@/contexts/ClubContext';
import { toast } from 'sonner';
import { Settings, Upload, Loader2, Instagram, Linkedin } from 'lucide-react';

const CLUB_CATEGORIES = ['Arts & Culture', 'Technology', 'Business', 'Sports', 'Social Service', 'Media', 'Academic', 'Other'];

const ClubSettingsPage = () => {
  const { activeClub } = useClub();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    tagline: '',
    about: '',
    category: '',
    logo_url: '' as string | null,
    social_instagram: '',
    social_linkedin: '',
  });

  useEffect(() => {
    if (!activeClub) return;
    const fetchClub = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('clubs')
        .select('name, tagline, about, category, logo_url, social_instagram, social_linkedin')
        .eq('id', activeClub.club_id)
        .maybeSingle();
      if (data) {
        setForm({
          name: data.name || '',
          tagline: (data as any).tagline || '',
          about: data.about || '',
          category: (data as any).category || '',
          logo_url: data.logo_url || null,
          social_instagram: (data as any).social_instagram || '',
          social_linkedin: (data as any).social_linkedin || '',
        });
      }
      setLoading(false);
    };
    fetchClub();
  }, [activeClub?.club_id]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeClub) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${activeClub.club_id}/logo.${ext}`;
    const { error } = await supabase.storage.from('club-logos').upload(path, file, { upsert: true });
    if (error) {
      toast.error('Failed to upload logo');
      setUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from('club-logos').getPublicUrl(path);
    const url = `${publicUrl}?t=${Date.now()}`;
    setForm(f => ({ ...f, logo_url: url }));
    setUploading(false);
    toast.success('Logo uploaded');
  };

  const handleSave = async () => {
    if (!activeClub || !form.name.trim()) return;
    setSaving(true);
    const { error } = await supabase
      .from('clubs')
      .update({
        name: form.name.trim(),
        about: form.about.trim() || null,
        logo_url: form.logo_url,
        tagline: form.tagline.trim() || null,
        category: form.category || null,
        social_instagram: form.social_instagram.trim() || null,
        social_linkedin: form.social_linkedin.trim() || null,
      } as any)
      .eq('id', activeClub.club_id);
    setSaving(false);
    if (error) {
      toast.error('Failed to save settings');
    } else {
      toast.success('Club settings updated');
    }
  };

  const isMobile = useIsMobile();

  if (loading) {
    return (
      <div className="min-h-screen flex antialiased" style={{ backgroundColor: '#F4EFE7' }}>
        {!isMobile && <DashboardSidebar />}
        <div className="flex-1 flex items-center justify-center" style={{ padding: '24px 28px' }}>
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#E98A3A' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex antialiased" style={{ backgroundColor: '#F4EFE7' }}>
      {!isMobile && <DashboardSidebar />}
      <div className="flex-1 overflow-y-auto" style={{ padding: '24px 28px' }}>
        <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Settings className="w-6 h-6" style={{ color: '#E98A3A' }} />
        <h1 className="text-2xl font-black" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#111' }}>
          Club Settings
        </h1>
      </div>

      {/* Logo */}
      <div
        className="flex flex-col items-center gap-4 p-6"
        style={{
          background: '#FFFDF7',
          border: '3px solid #111',
          borderRadius: '14px',
          boxShadow: '4px 4px 0px #111',
        }}
      >
        <div
          className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center"
          style={{ border: '3px solid #111', background: '#F4EFE7' }}
        >
          {form.logo_url ? (
            <img src={form.logo_url} alt="Club logo" className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-black" style={{ color: '#111' }}>{form.name[0] || '?'}</span>
          )}
        </div>
        <label className="cursor-pointer">
          <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
          <span
            className="inline-flex items-center gap-2 text-sm px-4 py-2 font-bold transition-all"
            style={{
              background: '#111',
              color: '#fff',
              border: '2px solid #111',
              borderRadius: '8px',
              boxShadow: '2px 2px 0px #111',
              fontFamily: "'Space Grotesk', sans-serif",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translate(2px,2px)'; e.currentTarget.style.boxShadow = 'none'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translate(0,0)'; e.currentTarget.style.boxShadow = '2px 2px 0px #111'; }}
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Uploading...' : 'Change Logo'}
          </span>
        </label>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        {/* Name */}
        <div
          className="p-4"
          style={{
            background: '#FFFDF7',
            border: '3px solid #111',
            borderRadius: '14px',
            boxShadow: '4px 4px 0px #111',
          }}
        >
          <Label className="text-sm font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Club Name <span style={{ color: '#E98A3A' }}>*</span>
          </Label>
          <Input
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="mt-2"
            style={{
              border: '2px solid #111',
              borderRadius: '8px',
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 600,
            }}
          />
        </div>

        {/* Tagline */}
        <div
          className="p-4"
          style={{
            background: '#FFFDF7',
            border: '3px solid #111',
            borderRadius: '14px',
            boxShadow: '4px 4px 0px #111',
          }}
        >
          <Label className="text-sm font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Tagline</Label>
          <Input
            value={form.tagline}
            onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))}
            placeholder="A short motto or tagline..."
            className="mt-2"
            style={{ border: '2px solid #111', borderRadius: '8px', fontFamily: "'Space Grotesk', sans-serif" }}
          />
        </div>

        {/* About */}
        <div
          className="p-4"
          style={{
            background: '#FFFDF7',
            border: '3px solid #111',
            borderRadius: '14px',
            boxShadow: '4px 4px 0px #111',
          }}
        >
          <Label className="text-sm font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>About</Label>
          <Textarea
            value={form.about}
            onChange={e => setForm(f => ({ ...f, about: e.target.value }))}
            placeholder="Tell us about your club..."
            rows={4}
            className="mt-2"
            style={{ border: '2px solid #111', borderRadius: '8px', fontFamily: "'Space Grotesk', sans-serif" }}
          />
        </div>

        {/* Category */}
        <div
          className="p-4"
          style={{
            background: '#FFFDF7',
            border: '3px solid #111',
            borderRadius: '14px',
            boxShadow: '4px 4px 0px #111',
          }}
        >
          <Label className="text-sm font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Category</Label>
          <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
            <SelectTrigger className="mt-2" style={{ border: '2px solid #111', borderRadius: '8px', fontFamily: "'Space Grotesk', sans-serif" }}>
              <SelectValue placeholder="Select category..." />
            </SelectTrigger>
            <SelectContent>
              {CLUB_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Social Links */}
        <div
          className="p-4 space-y-3"
          style={{
            background: '#FFFDF7',
            border: '3px solid #111',
            borderRadius: '14px',
            boxShadow: '4px 4px 0px #111',
          }}
        >
          <Label className="text-sm font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Social Media</Label>
          <div className="flex items-center gap-2">
            <Instagram className="w-5 h-5 shrink-0" style={{ color: '#111' }} />
            <Input
              value={form.social_instagram}
              onChange={e => setForm(f => ({ ...f, social_instagram: e.target.value }))}
              placeholder="Instagram username or URL"
              style={{ border: '2px solid #111', borderRadius: '8px', fontFamily: "'Space Grotesk', sans-serif" }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Linkedin className="w-5 h-5 shrink-0" style={{ color: '#111' }} />
            <Input
              value={form.social_linkedin}
              onChange={e => setForm(f => ({ ...f, social_linkedin: e.target.value }))}
              placeholder="LinkedIn page URL"
              style={{ border: '2px solid #111', borderRadius: '8px', fontFamily: "'Space Grotesk', sans-serif" }}
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving || !form.name.trim()}
        className="w-full py-3 text-base font-bold transition-all disabled:opacity-50"
        style={{
          background: '#E98A3A',
          color: '#111',
          border: '3px solid #111',
          borderRadius: '12px',
          boxShadow: '4px 4px 0px #111',
          fontFamily: "'Space Grotesk', sans-serif",
        }}
        onMouseEnter={e => { if (!saving) { e.currentTarget.style.transform = 'translate(4px,4px)'; e.currentTarget.style.boxShadow = 'none'; } }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translate(0,0)'; e.currentTarget.style.boxShadow = '4px 4px 0px #111'; }}
      >
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
        </div>
      </div>
    </div>
  );
};

export default ClubSettingsPage;
