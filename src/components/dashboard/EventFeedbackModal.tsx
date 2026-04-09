import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Star, MessageSquare, X } from 'lucide-react';
import { toast } from 'sonner';

interface EventFeedbackModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  eventId: string;
  eventName: string;
}

const NEO = {
  font: "'Space Grotesk', sans-serif",
  card: {
    background: '#FFFDF5',
    border: '2px solid #111111',
    borderRadius: '12px',
    boxShadow: '4px 4px 0px #111111',
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
  btnOutline: {
    background: '#FFFDF5',
    color: '#111111',
    border: '2px solid #111111',
    borderRadius: '10px',
    boxShadow: '2px 2px 0px #111111',
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 600,
  } as React.CSSProperties,
};

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
      const { data: att } = await supabase
        .from('attendance')
        .select('id')
        .eq('event_id', eventId)
        .eq('student_id', user.id)
        .maybeSingle();

      setIsAttendee(!!att);

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
      <DialogContent
        className="sm:max-w-md p-0 overflow-hidden [&>button:last-child]:hidden"
        style={{
          ...NEO.card,
          fontFamily: NEO.font,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '2px solid #111111' }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: '#E98A3A', border: '2px solid #111' }}
            >
              <MessageSquare className="w-4 h-4" style={{ color: '#111' }} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold truncate" style={{ color: '#111' }}>Event Feedback</h3>
              <p className="text-xs truncate" style={{ color: '#888' }}>{eventName}</p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="w-8 h-8 flex items-center justify-center shrink-0 transition-all"
            style={{
              background: '#E98A3A',
              border: '2px solid #111',
              borderRadius: '8px',
              boxShadow: '2px 2px 0px #111',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = '3px 3px 0px #111'; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'translate(0,0)'; e.currentTarget.style.boxShadow = '2px 2px 0px #111'; }}
          >
            <X className="w-4 h-4" style={{ color: '#111' }} />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-5">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-[3px] border-[#E98A3A]/30 border-t-[#E98A3A] rounded-full animate-spin" />
            </div>
          ) : !isAttendee ? (
            <div className="text-center py-6">
              <p className="text-sm font-semibold" style={{ color: '#555', fontFamily: NEO.font }}>
                You can only submit feedback for events you attended.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Star Rating */}
              <div>
                <label
                  className="text-sm font-bold block mb-2"
                  style={{ color: '#111', fontFamily: NEO.font }}
                >
                  How would you rate this event?
                </label>
                <div className="flex gap-1.5">
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
                        className="w-9 h-9"
                        style={{
                          fill: star <= (hoverRating || rating) ? '#E98A3A' : 'transparent',
                          color: star <= (hoverRating || rating) ? '#E98A3A' : '#ccc',
                          filter: star <= (hoverRating || rating) ? 'drop-shadow(1px 1px 0px #111)' : 'none',
                        }}
                      />
                    </button>
                  ))}
                </div>
                {rating > 0 && (
                  <p className="text-xs mt-1.5 font-semibold" style={{ color: '#E98A3A' }}>
                    {rating === 1 ? 'Poor' : rating === 2 ? 'Below Average' : rating === 3 ? 'Average' : rating === 4 ? 'Good' : 'Excellent'}
                  </p>
                )}
              </div>

              {/* Comment */}
              <div>
                <label
                  className="text-sm font-bold block mb-1.5"
                  style={{ color: '#111', fontFamily: NEO.font }}
                >
                  Comment <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span>
                </label>
                <textarea
                  placeholder="Share your thoughts about the event..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 text-sm resize-none focus:outline-none"
                  style={{
                    background: '#FFFDF5',
                    border: '2px solid #111',
                    borderRadius: '10px',
                    fontFamily: NEO.font,
                    color: '#111',
                  }}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-1">
                <button
                  onClick={() => onOpenChange(false)}
                  className="px-4 py-2.5 text-sm transition-all"
                  style={NEO.btnOutline}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = '3px 3px 0px #111'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translate(0,0)'; e.currentTarget.style.boxShadow = '2px 2px 0px #111'; }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || rating === 0}
                  className="px-5 py-2.5 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={NEO.btnPrimary}
                  onMouseEnter={(e) => { if (!e.currentTarget.disabled) { e.currentTarget.style.transform = 'translate(-1px,-1px)'; e.currentTarget.style.boxShadow = '4px 4px 0px #111'; } }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translate(0,0)'; e.currentTarget.style.boxShadow = '3px 3px 0px #111'; }}
                >
                  {submitting ? 'Submitting...' : existingFeedback ? 'Update Feedback' : 'Submit Feedback'}
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventFeedbackModal;
