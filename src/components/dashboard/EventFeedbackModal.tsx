import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface EventFeedbackModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  eventId: string;
  eventName: string;
}

const EventFeedbackModal = ({ open, onOpenChange, eventId, eventName }: EventFeedbackModalProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [existingFeedback, setExistingFeedback] = useState<any>(null);
  const [isAttendee, setIsAttendee] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);

    const check = async () => {
      // Check if user attended this event
      const { data: att } = await supabase
        .from('attendance')
        .select('id')
        .eq('event_id', eventId)
        .eq('student_id', user.id)
        .maybeSingle();

      setIsAttendee(!!att);

      // Check existing feedback
      const { data: fb } = await supabase
        .from('event_feedback')
        .select('*')
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (fb) {
        setExistingFeedback(fb);
        setRating(fb.rating);
        setComment(fb.comment || '');
      } else {
        setExistingFeedback(null);
        setRating(0);
        setComment('');
      }
      setLoading(false);
    };
    check();
  }, [open, eventId, user?.id]);

  const handleSubmit = async () => {
    if (!user || rating === 0) {
      toast.error('Please select a rating.');
      return;
    }
    setSubmitting(true);

    if (existingFeedback) {
      const { error } = await supabase
        .from('event_feedback')
        .update({ rating, comment: comment.trim() || null })
        .eq('id', existingFeedback.id);
      if (error) toast.error('Failed to update feedback.');
      else toast.success('Feedback updated!');
    } else {
      const { error } = await supabase.from('event_feedback').insert({
        event_id: eventId,
        user_id: user.id,
        rating,
        comment: comment.trim() || null,
      });
      if (error) toast.error('Failed to submit feedback.');
      else toast.success('Thank you for your feedback!');
    }

    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" /> Feedback — {eventName}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : !isAttendee ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground">You can only submit feedback for events you attended.</p>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {/* Star Rating */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= (hoverRating || rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-muted-foreground/30'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">Comment (optional)</label>
              <Textarea
                placeholder="Share your thoughts about the event..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={submitting || rating === 0} className="gradient-gold text-primary-foreground">
                {submitting ? 'Submitting...' : existingFeedback ? 'Update Feedback' : 'Submit Feedback'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EventFeedbackModal;
