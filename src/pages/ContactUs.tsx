import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Send, Mail, User, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';
import { toast } from 'sonner';

const ContactUs = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-contact-email', {
        body: { name: name.trim(), email: email.trim(), message: message.trim() },
      });

      if (error) throw error;

      toast.success('Your message has been sent! We\'ll get back to you soon.');
      setName('');
      setEmail('');
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
            <Mail className="w-8 h-8 text-[#111]" />
          </div>
          <h2
            className="text-2xl md:text-3xl font-black text-[#111] uppercase"
            style={{ fontFamily: "'Space Grotesk', sans-serif" }}
          >
            Contact Us
          </h2>
          <p className="text-sm text-[#111]/60 font-medium mt-2">
            Have a question or need help? Drop us a message and we'll get back to you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              className="text-xs font-black text-[#111] uppercase tracking-wider mb-2 block"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              <User className="w-3.5 h-3.5 inline mr-1.5" />
              Your Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-4 py-3 text-sm font-medium text-[#111] bg-white placeholder:text-[#111]/30 outline-none transition-all focus:translate-y-[-1px]"
              style={{
                border: '3px solid #111',
                borderRadius: '6px',
                boxShadow: '3px 3px 0px #111',
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            />
          </div>

          <div>
            <label
              className="text-xs font-black text-[#111] uppercase tracking-wider mb-2 block"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              <Mail className="w-3.5 h-3.5 inline mr-1.5" />
              Your Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="w-full px-4 py-3 text-sm font-medium text-[#111] bg-white placeholder:text-[#111]/30 outline-none transition-all focus:translate-y-[-1px]"
              style={{
                border: '3px solid #111',
                borderRadius: '6px',
                boxShadow: '3px 3px 0px #111',
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            />
          </div>

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
              placeholder="Type your message here..."
              rows={5}
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

  if (!user) {
    // Landing page visitor - standalone page
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center py-12"
        style={{ backgroundColor: '#F4EFE7', fontFamily: "'Space Grotesk', sans-serif" }}
      >
        <div className="w-full max-w-2xl px-4">
          <button
            onClick={() => navigate('/')}
            className="mb-6 w-9 h-9 flex items-center justify-center border-[3px] border-[#111] rounded-[6px] bg-[#111] text-white hover:translate-y-[1px] transition-all"
            style={{ boxShadow: '2px 2px 0px #E98A3A' }}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
        {formContent}
      </div>
    );
  }

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

export default ContactUs;
