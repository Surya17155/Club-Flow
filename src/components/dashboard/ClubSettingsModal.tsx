import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useClub } from '@/contexts/ClubContext';
import { toast } from 'sonner';
import { Settings, Upload, Loader2 } from 'lucide-react';

interface ClubSettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CLUB_CATEGORIES = ['Arts & Culture', 'Technology', 'Business', 'Sports', 'Social Service', 'Media', 'Academic', 'Other'];
const CLUB_TYPES = ['Technical', 'Non-Technical', 'Cultural', 'Sports', 'Literary', 'Other'];

const ClubSettingsModal = ({ open, onOpenChange }: ClubSettingsModalProps) => {
  const { activeClub } = useClub();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    tagline: '',
    description: '',
    about: '',
    category: '',
    club_type: '',
    logo_url: '' as string | null,
    social_instagram: '',
    social_linkedin: '',
  });

  useEffect(() => {
    if (!open || !activeClub) return;
    const fetch = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('clubs')
        .select('name, tagline, description, about, category, club_type, logo_url, social_instagram, social_linkedin')
        .eq('id', activeClub.club_id)
        .maybeSingle();
      if (data) {
        setForm({
          name: data.name || '',
          tagline: (data as any).tagline || '',
          description: data.description || '',
          about: data.about || '',
          category: (data as any).category || '',
          club_type: (data as any).club_type || '',
          logo_url: data.logo_url || null,
          social_instagram: (data as any).social_instagram || '',
          social_linkedin: (data as any).social_linkedin || '',
        });
      }
      setLoading(false);
    };
    fetch();
  }, [open, activeClub?.club_id]);

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
        description: form.description.trim() || null,
        about: form.about.trim() || null,
        logo_url: form.logo_url,
        tagline: form.tagline.trim() || null,
        category: form.category || null,
        club_type: form.club_type || null,
      } as any)
      .eq('id', activeClub.club_id);
    setSaving(false);
    if (error) {
      toast.error('Failed to save settings');
    } else {
      toast.success('Club settings updated');
      onOpenChange(false);
      // Reload to reflect changes
      window.location.reload();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-white/20 max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-lg">
            <Settings className="w-5 h-5 text-primary" />
            Club Settings
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-5 mt-2">
            {/* Logo */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 rounded-full bg-foreground flex items-center justify-center overflow-hidden border-4 border-white/20">
                {form.logo_url ? (
                  <img src={form.logo_url} alt="Club logo" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-background">{form.name[0] || '?'}</span>
                )}
              </div>
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
                <span className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium bg-muted hover:bg-muted/80 text-foreground transition-colors">
                  {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                  {uploading ? 'Uploading...' : 'Change Logo'}
                </span>
              </label>
            </div>

            {/* Name */}
            <div>
              <Label>Club Name <span className="text-destructive">*</span></Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1" />
            </div>

            {/* Tagline */}
            <div>
              <Label>Tagline <span className="text-xs text-muted-foreground">(optional)</span></Label>
              <Input value={form.tagline} onChange={e => setForm(f => ({ ...f, tagline: e.target.value }))} placeholder="A short motto or tagline..." className="mt-1" />
            </div>

            {/* Description */}
            <div>
              <Label>Description <span className="text-xs text-muted-foreground">(optional)</span></Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description of the club..." className="mt-1" rows={2} />
            </div>

            {/* About */}
            <div>
              <Label>About <span className="text-xs text-muted-foreground">(optional)</span></Label>
              <Textarea value={form.about} onChange={e => setForm(f => ({ ...f, about: e.target.value }))} placeholder="Detailed about section..." className="mt-1" rows={3} />
            </div>

            {/* Category & Type */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category <span className="text-xs text-muted-foreground">(optional)</span></Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {CLUB_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Type <span className="text-xs text-muted-foreground">(optional)</span></Label>
                <Select value={form.club_type} onValueChange={v => setForm(f => ({ ...f, club_type: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {CLUB_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={handleSave} disabled={saving || !form.name.trim()} className="w-full rounded-full gradient-gold text-primary-foreground">
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ClubSettingsModal;
