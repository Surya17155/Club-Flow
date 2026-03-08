import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, GraduationCap, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

const MarkAttendance = () => {
  const { token } = useParams<{ token: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired' | 'already'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // Redirect to login, preserve the return URL
      toast({ title: 'Please log in first', description: 'You need to be logged in to mark attendance.' });
      navigate(`/?redirect=/mark-attendance/${token}`);
      return;
    }

    markAttendance();
  }, [user, authLoading, token]);

  const markAttendance = async () => {
    try {
      // Find event by QR token
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

      // Mark attendance
      const { error: insertError } = await supabase
        .from('attendance')
        .insert({
          event_id: event.id,
          student_id: user!.id,
          status: 'present',
        });

      if (insertError) {
        setStatus('error');
        setMessage('Failed to mark attendance. Please try again.');
        return;
      }

      setStatus('success');
      setMessage(`Attendance marked for "${event.name}"!`);
    } catch (err) {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  const iconMap = {
    loading: <Loader2 className="w-16 h-16 text-primary animate-spin" />,
    success: <CheckCircle className="w-16 h-16 text-success" />,
    error: <XCircle className="w-16 h-16 text-destructive" />,
    expired: <XCircle className="w-16 h-16 text-warning" />,
    already: <CheckCircle className="w-16 h-16 text-info" />,
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
