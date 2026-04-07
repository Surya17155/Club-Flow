import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, Loader2 } from 'lucide-react';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDesign } from '@/contexts/DesignContext';

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
  btnDanger: {
    background: '#111111',
    color: '#FFFDF5',
    border: '2px solid #111111',
    borderRadius: '10px',
    boxShadow: '3px 3px 0px #111111',
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
  } as React.CSSProperties,
};

const Settings = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const { activeDesign } = useDesign();
  const isNeo = activeDesign === 'design-2';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: isNeo ? '#F4EFE7' : undefined }}>
        <div className="w-8 h-8 border-[3px] border-[#E98A3A]/30 border-t-[#E98A3A] rounded-full animate-spin" />
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

  const content = (
    <div className="max-w-xl mx-auto grid gap-6">
      {isMobile && (
        <div className="text-center mb-2">
          <h1 className="text-2xl font-bold" style={isNeo ? { fontFamily: NEO.font, color: '#111' } : {}}>Settings</h1>
        </div>
      )}

      {/* Account */}
      <div style={isNeo ? NEO.card : undefined} className={isNeo ? '' : 'glass-card p-8'}>
        <h2 className="text-lg font-bold mb-4" style={isNeo ? { fontFamily: NEO.font, color: '#111' } : {}}>Account</h2>
        <div>
          <Label style={isNeo ? { fontFamily: NEO.font, fontWeight: 600, color: '#111' } : {}}>Email</Label>
          <Input value={user.email ?? ''} disabled className="mt-1.5" style={isNeo ? { ...NEO.input, opacity: 0.6 } : { opacity: 0.6 }} />
        </div>
      </div>

      {/* Change Password */}
      <div style={isNeo ? NEO.card : undefined} className={isNeo ? '' : 'glass-card p-8'}>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={isNeo ? { fontFamily: NEO.font, color: '#111' } : {}}>
          <Lock className="w-5 h-5" /> Change Password
        </h2>
        <div className="space-y-4">
          <div>
            <Label style={isNeo ? { fontFamily: NEO.font, fontWeight: 600, color: '#111' } : {}}>New Password</Label>
            <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="mt-1.5" placeholder="••••••••" style={isNeo ? NEO.input : {}} />
          </div>
          <div>
            <Label style={isNeo ? { fontFamily: NEO.font, fontWeight: 600, color: '#111' } : {}}>Confirm New Password</Label>
            <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-1.5" placeholder="••••••••" style={isNeo ? NEO.input : {}} />
          </div>
          <button
            onClick={handleChangePassword}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 text-sm transition-all"
            style={isNeo ? NEO.btnPrimary : { background: 'var(--primary)', color: 'white', borderRadius: '9999px' }}
            onMouseEnter={isNeo ? (e) => { e.currentTarget.style.transform = 'translate(-1px, -1px)'; e.currentTarget.style.boxShadow = '4px 4px 0px #111'; } : undefined}
            onMouseLeave={isNeo ? (e) => { e.currentTarget.style.transform = 'translate(0,0)'; e.currentTarget.style.boxShadow = '3px 3px 0px #111'; } : undefined}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Update Password
          </button>
        </div>
      </div>

      {/* Session */}
      <div style={isNeo ? NEO.card : undefined} className={isNeo ? '' : 'glass-card p-8'}>
        <h2 className="text-lg font-bold mb-4" style={isNeo ? { fontFamily: NEO.font, color: '#111' } : {}}>Session</h2>
        <button
          onClick={signOut}
          className="px-6 py-2.5 text-sm transition-all"
          style={isNeo ? NEO.btnDanger : { background: 'var(--destructive)', color: 'white', borderRadius: '9999px' }}
          onMouseEnter={isNeo ? (e) => { e.currentTarget.style.transform = 'translate(-1px, -1px)'; e.currentTarget.style.boxShadow = '4px 4px 0px #111'; } : undefined}
          onMouseLeave={isNeo ? (e) => { e.currentTarget.style.transform = 'translate(0,0)'; e.currentTarget.style.boxShadow = '3px 3px 0px #111'; } : undefined}
        >
          Sign Out
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

  return (
    <div className="min-h-screen pb-24" style={{ background: isNeo ? '#F4EFE7' : undefined }}>
      <div className="p-6 md:p-10">{content}</div>
      <MobileBottomNav />
    </div>
  );
};

export default Settings;
