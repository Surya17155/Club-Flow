import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

interface ManualAttendanceModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  eventId: string;
  eventName: string;
  clubId: string;
  accessType: string;
  onAdded: () => void;
}

const REASONS = [
  'Phone died',
  'Late arrival',
  'QR scan issue',
  'Extra member/attendee',
  'Other',
];

const ManualAttendanceModal = ({ open, onOpenChange, eventId, eventName, clubId, accessType, onAdded }: ManualAttendanceModalProps) => {
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [adding, setAdding] = useState<string | null>(null);
  const [existingIds, setExistingIds] = useState<Set<string>>(new Set());

  // Fetch existing attendees
  useEffect(() => {
    if (!open) return;
    supabase.from('attendance').select('student_id').eq('event_id', eventId).then(({ data }) => {
      setExistingIds(new Set((data ?? []).map((a: any) => a.student_id)));
    });
  }, [open, eventId]);

  // Search students
  useEffect(() => {
    if (!open || search.length < 2) { setStudents([]); return; }
    const timeout = setTimeout(async () => {
      setLoading(true);
      let query = supabase.from('profiles').select('user_id, full_name, roll_no, programme, email').ilike('full_name', `%${search}%`).limit(20);
      const { data } = await query;
      
      // If club_only, filter to club members
      if (accessType === 'club_only') {
        const { data: members } = await supabase.from('club_members').select('user_id').eq('club_id', clubId);
        const memberIds = new Set((members ?? []).map((m: any) => m.user_id));
        setStudents((data ?? []).filter((s: any) => memberIds.has(s.user_id)));
      } else {
        setStudents(data ?? []);
      }
      setLoading(false);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search, open, accessType, clubId]);

  const handleAdd = async (student: any) => {
    if (!user || !reason) {
      toast.error('Please select a reason before adding.');
      return;
    }
    setAdding(student.user_id);
    const { error } = await supabase.from('attendance').insert({
      event_id: eventId,
      student_id: student.user_id,
      status: 'present',
      manually_added: true,
      added_by: user.id,
    });

    if (error) {
      toast.error(error.message.includes('duplicate') ? 'Already marked.' : 'Failed to add attendance.');
    } else {
      toast.success(`${student.full_name} marked as present`);
      setExistingIds(prev => new Set(prev).add(student.user_id));
      onAdded();
    }
    setAdding(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" /> Manual Attendance — {eventName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Reason */}
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Reason for manual entry</label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue placeholder="Select reason..." /></SelectTrigger>
              <SelectContent>
                {REASONS.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search student by name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Results */}
          {loading ? (
            <div className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : students.length > 0 ? (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {students.map(s => {
                const alreadyMarked = existingIds.has(s.user_id);
                return (
                  <div key={s.user_id} className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-white/40">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">{s.full_name}</p>
                      <p className="text-xs text-muted-foreground">{s.roll_no || s.email} {s.programme ? `• ${s.programme}` : ''}</p>
                    </div>
                    {alreadyMarked ? (
                      <span className="text-xs text-muted-foreground">Already marked</span>
                    ) : (
                      <Button
                        size="sm"
                        className="rounded-full gradient-gold text-primary-foreground"
                        onClick={() => handleAdd(s)}
                        disabled={adding === s.user_id || !reason}
                      >
                        {adding === s.user_id ? '...' : 'Add'}
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          ) : search.length >= 2 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No students found</p>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Type at least 2 characters to search</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ManualAttendanceModal;
