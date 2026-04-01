import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

// Animated green checkmark
const AnimatedCheck = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="mx-auto">
    <motion.circle
      cx="40" cy="40" r="36"
      stroke="hsl(var(--success, 142 71% 45%))"
      strokeWidth="3"
      fill="none"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    />
    <motion.path
      d="M24 42 L34 52 L56 30"
      stroke="hsl(var(--success, 142 71% 45%))"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
    />
  </svg>
);

// Animated red cross
const AnimatedCross = ({ color = "hsl(var(--destructive))" }: { color?: string }) => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="mx-auto">
    <motion.circle
      cx="40" cy="40" r="36"
      stroke={color}
      strokeWidth="3"
      fill="none"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    />
    <motion.path
      d="M28 28 L52 52"
      stroke={color}
      strokeWidth="4"
      strokeLinecap="round"
      fill="none"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.4, ease: "easeOut" }}
    />
    <motion.path
      d="M52 28 L28 52"
      stroke={color}
      strokeWidth="4"
      strokeLinecap="round"
      fill="none"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.3, delay: 0.55, ease: "easeOut" }}
    />
  </svg>
);

// Animated blue checkmark (already recorded)
const AnimatedBlueCheck = () => (
  <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="mx-auto">
    <motion.circle
      cx="40" cy="40" r="36"
      stroke="hsl(217 91% 60%)"
      strokeWidth="3"
      fill="none"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    />
    <motion.path
      d="M24 42 L34 52 L56 30"
      stroke="hsl(217 91% 60%)"
      strokeWidth="4"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={{ pathLength: 1, opacity: 1 }}
      transition={{ duration: 0.4, delay: 0.4, ease: "easeOut" }}
    />
  </svg>
);

const MarkAttendance = () => {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired' | 'already'>('loading');
  const [message, setMessage] = useState('');
  const hasRun = useRef(false);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      toast({ title: 'Please sign up or log in', description: 'You need an account to mark attendance.' });
      navigate(`/signup?redirect=/mark-attendance/${token}`);
      return;
    }

    // Guard against double execution (React strict mode / auth re-renders)
    if (hasRun.current) return;
    hasRun.current = true;

    markAttendance();
  }, [user, authLoading, token]);

  const markAttendance = async () => {
    try {
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('qr_token', token)
        .single();

      if (eventError || !event) {
        setStatus('error');
        setMessage('Invalid QR code or event not found.');
        return;
      }

      // Check TTL
      const now = new Date();
      const eventStart = new Date(event.event_date);
      const eventEnd = event.qr_ttl_minutes
        ? new Date(eventStart.getTime() + event.qr_ttl_minutes * 60000)
        : new Date(eventStart.getTime() + 24 * 60 * 60000);

      if (now > eventEnd) {
        setStatus('expired');
        setMessage('This QR code has expired. The event attendance window has closed.');
        return;
      }

      // Check club membership restriction
      if (event.access_type === 'club_only') {
        const { data: membership } = await supabase
          .from('club_members')
          .select('id')
          .eq('club_id', event.club_id)
          .eq('user_id', user!.id)
          .maybeSingle();

        if (!membership) {
          setStatus('error');
          setMessage('This event is restricted to club members only. You are not a member of this club.');
          return;
        }
      }

      // Check for duplicate
      const { data: existing } = await supabase
        .from('attendance')
        .select('id')
        .eq('event_id', event.id)
        .eq('student_id', user!.id)
        .maybeSingle();

      if (existing) {
        setStatus('already');
        setMessage('Your attendance has already been recorded for this event.');
        return;
      }

      // Mark attendance — handle duplicate constraint gracefully
      const { error: insertError } = await supabase
        .from('attendance')
        .insert({
          event_id: event.id,
          student_id: user!.id,
          status: 'present',
        });

      if (insertError) {
        // If it's a duplicate key error, treat as "already marked"
        if (insertError.message.includes('duplicate') || insertError.code === '23505') {
          setStatus('already');
          setMessage('Your attendance has already been recorded for this event.');
          return;
        }
        console.error('Attendance insert error:', insertError);
        setStatus('error');
        setMessage(`Failed to mark attendance: ${insertError.message}`);
        return;
      }

      setStatus('success');
      setMessage(`Attendance marked for "${event.name}"!`);
    } catch (err: any) {
      console.error('Attendance catch error:', err);
      setStatus('error');
      setMessage(`Something went wrong: ${err?.message || 'Unknown error'}`);
    }
  };

  const iconMap = {
    loading: <Loader2 className="w-16 h-16 text-primary animate-spin" />,
    success: <AnimatedCheck />,
    error: <AnimatedCross />,
    expired: <AnimatedCross color="hsl(38 92% 50%)" />,
    already: <AnimatedBlueCheck />,
  };

  const titleMap = {
    loading: 'Marking Attendance...',
    success: 'Attendance Marked!',
    error: 'Error',
    expired: 'QR Expired',
    already: 'Already Recorded',
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 gradient-warm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="w-full max-w-sm shadow-elevated text-center">
          <CardHeader className="pb-2">
            <div className="flex justify-center mb-4">{iconMap[status]}</div>
            <CardTitle className="text-xl font-display">{titleMap[status]}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-6">{message || 'Please wait...'}</p>
            <Button onClick={() => navigate('/dashboard')} className="gradient-gold text-primary-foreground w-full">
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default MarkAttendance;
