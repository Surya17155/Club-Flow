import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Send, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';
import { toast } from 'sonner';

const WEBHOOK_URL = 'https://hook.us2.make.com/latw17f2n4jfkn9ssmcbys1mnlyoy9jx';

const buildEmailHtml = (profile: any, clubs: { name: string; role: string }[], message: string) => {
  const clubsRows = clubs.length
    ? clubs.map(c => `<tr><td style="padding:8px 12px;border:2px solid #111;font-weight:600;">${c.name}</td><td style="padding:8px 12px;border:2px solid #111;text-transform:capitalize;">${c.role.replace(/_/g, ' ')}</td></tr>`).join('')
    : `<tr><td colspan="2" style="padding:12px;border:2px solid #111;text-align:center;color:#666;">No club memberships</td></tr>`;

  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:10px 14px;border:2px solid #111;background:#FDE8D0;font-weight:700;text-transform:uppercase;font-size:12px;letter-spacing:1px;width:35%;">${label}</td>
      <td style="padding:10px 14px;border:2px solid #111;font-weight:500;">${value || '—'}</td>
    </tr>`;

  return `
<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>New Club Flow Query</title></head>
<body style="margin:0;padding:24px;background:#F4EFE7;font-family:'Helvetica Neue',Arial,sans-serif;color:#111;">
  <div style="max-width:640px;margin:0 auto;">
    <div style="background:#E98A3A;border:3px solid #111;border-radius:8px;padding:18px 22px;box-shadow:6px 6px 0px #111;margin-bottom:24px;">
      <div style="font-size:11px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#111;opacity:0.8;">Club Flow • Notification</div>
      <div style="font-size:24px;font-weight:900;color:#111;margin-top:4px;">New Contact Query Received</div>
    </div>

    <div style="background:#FFFDF5;border:3px solid #111;border-radius:8px;padding:20px;box-shadow:6px 6px 0px #111;margin-bottom:24px;">
      <h2 style="margin:0 0 14px 0;font-size:14px;font-weight:900;text-transform:uppercase;letter-spacing:1.5px;">👤 User Profile</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        ${row('Full Name', profile?.full_name || '')}
        ${row('Email', profile?.email || '')}
        ${row('Phone', profile?.phone || '')}
        ${row('Roll No', profile?.roll_no || '')}
        ${row('Programme', profile?.programme || '')}
        ${row('Year', profile?.year || '')}
        ${row('Semester', profile?.semester || '')}
        ${row('Section', profile?.section || '')}
        ${row('Class Coordinator', profile?.class_coordinator || '')}
      </table>
    </div>

    <div style="background:#FFFDF5;border:3px solid #111;border-radius:8px;padding:20px;box-shadow:6px 6px 0px #111;margin-bottom:24px;">
      <h2 style="margin:0 0 14px 0;font-size:14px;font-weight:900;text-transform:uppercase;letter-spacing:1.5px;">🏛️ Club Memberships</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr>
            <th style="padding:10px 12px;border:2px solid #111;background:#111;color:#fff;text-align:left;text-transform:uppercase;font-size:12px;letter-spacing:1px;">Club</th>
            <th style="padding:10px 12px;border:2px solid #111;background:#111;color:#fff;text-align:left;text-transform:uppercase;font-size:12px;letter-spacing:1px;">Role</th>
          </tr>
        </thead>
        <tbody>${clubsRows}</tbody>
      </table>
    </div>

    <div style="background:#FFFDF5;border:3px solid #111;border-radius:8px;padding:20px;box-shadow:6px 6px 0px #111;margin-bottom:24px;">
      <h2 style="margin:0 0 14px 0;font-size:14px;font-weight:900;text-transform:uppercase;letter-spacing:1.5px;">💬 Message</h2>
      <div style="background:#FDE8D0;border:2px solid #111;border-radius:6px;padding:16px;font-size:15px;line-height:1.6;white-space:pre-wrap;box-shadow:3px 3px 0px #111;">${message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>
    </div>

    <div style="text-align:center;font-size:12px;color:#666;padding:12px;">
      Sent from <strong>Club Flow</strong> • ${new Date().toLocaleString()}
    </div>
  </div>
</body></html>`;
};

const Contact2 = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const isMobile = useIsMobile();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [clubs, setClubs] = useState<{ name: string; role: string }[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: cm } = await supabase
        .from('club_members')
        .select('role, club_id')
        .eq('user_id', user.id);
      if (!cm?.length) return;
      const ids = cm.map(c => c.club_id);
      const { data: cs } = await supabase.from('clubs').select('id, name').in('id', ids);
      const merged = cm.map(m => ({
        role: m.role,
        name: cs?.find(c => c.id === m.club_id)?.name ?? 'Unknown Club',
      }));
      setClubs(merged);
    })();
  }, [user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error('Please type a message');
      return;
    }
    setSending(true);
    try {
      const html = buildEmailHtml(profile, clubs, message.trim());
      const payload = {
        recipient_email: 'surya.17155@gmail.com',
        source_app: 'Club Flow',
        subject: `New Contact Query from ${profile?.full_name || 'a user'}`,
        sent_at: new Date().toISOString(),
        message: message.trim(),
        html,
        user: {
          full_name: profile?.full_name ?? '',
          email: profile?.email ?? user?.email ?? '',
          phone: profile?.phone ?? '',
          roll_no: profile?.roll_no ?? '',
          programme: profile?.programme ?? '',
          year: profile?.year ?? '',
          semester: profile?.semester ?? '',
          section: profile?.section ?? '',
          class_coordinator: profile?.class_coordinator ?? '',
          avatar_url: profile?.avatar_url ?? '',
        },
        clubs,
      };

      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Webhook failed');

      toast.success("Message sent! We'll get back to you soon.");
      setMessage('');
    } catch (err) {
      console.error(err);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const formContent = (
    <div className="max-w-2xl mx-auto w-full px-4">
      <div
        className="border-[3px] border-[#111] rounded-[6px] bg-white p-6 md:p-8"
        style={{ boxShadow: '6px 6px 0px #111' }}
      >
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
            style={{ border: '3px solid #111', background: '#E98A3A', boxShadow: '3px 3px 0px #111' }}
          >
            <MessageSquare className="w-8 h-8 text-[#111]" />
          </div>
          <h2
            className="text-2xl md:text-3xl font-black text-[#111] uppercase"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Contact Us
          </h2>
          <p className="text-sm text-[#111]/60 font-medium mt-2">
            Drop your query below — we'll receive your profile details automatically.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              className="text-xs font-black text-[#111] uppercase tracking-wider mb-2 block"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              <MessageSquare className="w-3.5 h-3.5 inline mr-1.5" />
              Your Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your query here..."
              rows={6}
              className="w-full px-4 py-3 text-sm font-medium text-[#111] bg-white placeholder:text-[#111]/30 outline-none transition-all focus:translate-y-[-1px] resize-none"
              style={{
                border: '3px solid #111',
                borderRadius: '6px',
                boxShadow: '3px 3px 0px #111',
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-black uppercase tracking-wider transition-all hover:translate-y-[-2px] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              background: '#E98A3A',
              color: '#111',
              border: '3px solid #111',
              borderRadius: '6px',
              boxShadow: '4px 4px 0px #111',
            }}
          >
            {sending ? (
              <div className="w-5 h-5 border-[3px] border-[#111]/30 border-t-[#111] rounded-full animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                Send Message
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div
        className="min-h-screen pb-20"
        style={{ backgroundColor: '#F4EFE7', fontFamily: "'Space Grotesk', sans-serif" }}
      >
        <div className="px-4 pt-16 pb-6">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 w-9 h-9 flex items-center justify-center border-[3px] border-[#111] rounded-[6px] bg-[#111] text-white hover:translate-y-[1px] transition-all"
            style={{ boxShadow: '2px 2px 0px #E98A3A' }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
        {formContent}
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <DashboardLayout showHeader={false}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center border-[3px] border-[#111] rounded-[6px] bg-[#111] text-white hover:translate-y-[1px] transition-all"
            style={{ boxShadow: '2px 2px 0px #E98A3A' }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1
            className="text-xl md:text-2xl font-black text-[#111]"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Contact Us
          </h1>
        </div>
        {formContent}
      </div>
    </DashboardLayout>
  );
};

export default Contact2;
