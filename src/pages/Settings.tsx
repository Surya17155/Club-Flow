import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Settings = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center dashboard-corner-gradient">
        <div className="w-8 h-8 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Password updated', description: 'Your password has been changed.' });
      setNewPassword('');
      setConfirmPassword('');
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen dashboard-corner-gradient p-6 md:p-10">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => navigate(-1)} className="glass-card p-2 rounded-full hover:bg-white/50 transition">
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-2xl font-bold text-foreground font-['Space_Grotesk']">Settings</h1>
      </div>

      <div className="max-w-xl mx-auto grid gap-6">
        {/* Account Info */}
        <div className="glass-card p-8">
          <h2 className="text-lg font-bold text-foreground mb-4 font-['Space_Grotesk']">Account</h2>
          <div>
            <Label>Email</Label>
            <Input value={user.email ?? ''} disabled className="mt-1.5 opacity-60" />
          </div>
        </div>

        {/* Change Password */}
        <div className="glass-card p-8">
          <h2 className="text-lg font-bold text-foreground mb-4 font-['Space_Grotesk'] flex items-center gap-2">
            <Lock className="w-5 h-5" /> Change Password
          </h2>
          <div className="space-y-4">
            <div>
              <Label>New Password</Label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="mt-1.5" placeholder="••••••••" />
            </div>
            <div>
              <Label>Confirm New Password</Label>
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-1.5" placeholder="••••••••" />
            </div>
            <Button onClick={handleChangePassword} disabled={saving} className="gradient-gold text-primary-foreground rounded-full px-6">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Update Password
            </Button>
          </div>
        </div>

        {/* Sign Out */}
        <div className="glass-card p-8">
          <h2 className="text-lg font-bold text-foreground mb-4 font-['Space_Grotesk']">Session</h2>
          <Button variant="destructive" onClick={signOut} className="rounded-full px-6">
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
