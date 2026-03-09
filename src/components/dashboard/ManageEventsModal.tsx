import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClub } from '@/contexts/ClubContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Clock, ChevronRight, ArrowLeft, Tag, Shield } from 'lucide-react';

interface Attendee {
  id: string;
  student_id: string;
  scanned_at: string;
  status: string;
  full_name: string;
  roll_no: string | null;
  programme: string | null;
  section: string | null;
}

interface ClubEvent {
  id: string;
  name: string;
  event_date: string;
  end_date: string | null;
  description: string | null;
  event_type: string;
  category: string;
  access_type: string;
  attendee_count: number;
}

const ManageEventsModal = ({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) => {
  const { activeClub } = useClub();
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ClubEvent | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);

  useEffect(() => {
    if (!open || !activeClub) return;
    setSelectedEvent(null);
    const fetchEvents = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('events')
        .select('id, name, event_date, end_date, description, event_type, category, access_type')
        .eq('club_id', activeClub.club_id)
        .order('event_date', { ascending: false });

      if (data) {
        // Fetch attendance counts for all events
        const eventIds = data.map((e: any) => e.id);
        const { data: attData } = await supabase
          .from('attendance')
          .select('event_id')
          .in('event_id', eventIds);

        const countMap: Record<string, number> = {};
        attData?.forEach((a: any) => {
          countMap[a.event_id] = (countMap[a.event_id] || 0) + 1;
        });

        setEvents(data.map((e: any) => ({ ...e, attendee_count: countMap[e.id] || 0 })));
      }
      setLoading(false);
    };
    fetchEvents();
  }, [open, activeClub?.club_id]);

  const viewAttendance = async (event: ClubEvent) => {
    setSelectedEvent(event);
    setLoadingAttendees(true);
    const { data } = await supabase
      .from('attendance')
      .select('id, student_id, scanned_at, status')
      .eq('event_id', event.id)
      .order('scanned_at', { ascending: true });

    if (data && data.length > 0) {
      const studentIds = data.map((a: any) => a.student_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, roll_no, programme, section')
        .in('user_id', studentIds);

      const profileMap: Record<string, any> = {};
      profiles?.forEach((p: any) => { profileMap[p.user_id] = p; });

      setAttendees(data.map((a: any) => ({
        ...a,
        full_name: profileMap[a.student_id]?.full_name || 'Unknown',
        roll_no: profileMap[a.student_id]?.roll_no || null,
        programme: profileMap[a.student_id]?.programme || null,
        section: profileMap[a.student_id]?.section || null,
      })));
    } else {
      setAttendees([]);
    }
    setLoadingAttendees(false);
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const formatTime = (d: string) => new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            {selectedEvent ? (
              <>
                <button onClick={() => setSelectedEvent(null)} className="p-1 rounded-lg hover:bg-accent transition-colors">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                {selectedEvent.name} — Attendance
              </>
            ) : (
              <>Manage Events — {activeClub?.club_name}</>
            )}
          </DialogTitle>
        </DialogHeader>

        {!selectedEvent ? (
          <div className="space-y-3 pt-2">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : events.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-8">No events found for this club</p>
            ) : (
              events.map(event => {
                const d = new Date(event.event_date);
                const isPast = d < new Date();
                return (
                  <div
                    key={event.id}
                    onClick={() => viewAttendance(event)}
                    className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-white/40 hover:bg-white/70 cursor-pointer transition-colors group"
                  >
                    <div className="rounded-lg shadow-sm w-12 h-12 flex flex-col items-center justify-center border border-border bg-white shrink-0">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        {d.toLocaleString('default', { month: 'short' }).toUpperCase()}
                      </span>
                      <span className="text-lg font-bold leading-none text-foreground">{d.getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-foreground truncate">{event.name}</h4>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(event.event_date)}{event.end_date ? ` – ${formatTime(event.end_date)}` : ''}</span>
                        <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{event.event_type}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-center">
                        <p className="text-lg font-bold text-foreground">{event.attendee_count}</p>
                        <p className="text-[10px] text-muted-foreground">Attended</p>
                      </div>
                      <Badge variant={isPast ? 'secondary' : 'default'} className="text-[10px]">
                        {isPast ? 'Past' : 'Upcoming'}
                      </Badge>
                      <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="pt-2">
            {/* Event info summary */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="secondary" className="text-xs"><Calendar className="w-3 h-3 mr-1" />{formatDate(selectedEvent.event_date)}</Badge>
              <Badge variant="outline" className="text-xs"><Clock className="w-3 h-3 mr-1" />{formatTime(selectedEvent.event_date)}{selectedEvent.end_date ? ` – ${formatTime(selectedEvent.end_date)}` : ''}</Badge>
              <Badge variant="outline" className="text-xs"><Shield className="w-3 h-3 mr-1" />{selectedEvent.access_type}</Badge>
              <Badge variant="outline" className="text-xs"><Users className="w-3 h-3 mr-1" />{attendees.length} attended</Badge>
            </div>

            {loadingAttendees ? (
              <div className="flex justify-center py-8">
                <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              </div>
            ) : attendees.length === 0 ? (
              <p className="text-sm text-muted-foreground italic text-center py-8">No attendance records for this event</p>
            ) : (
              <div className="border border-border/50 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 text-muted-foreground text-xs uppercase tracking-wider">
                      <th className="text-left px-4 py-2.5">#</th>
                      <th className="text-left px-4 py-2.5">Name</th>
                      <th className="text-left px-4 py-2.5">Roll No</th>
                      <th className="text-left px-4 py-2.5">Programme</th>
                      <th className="text-left px-4 py-2.5">Scanned At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendees.map((a, i) => (
                      <tr key={a.id} className="border-t border-border/30 hover:bg-white/50">
                        <td className="px-4 py-2.5 text-muted-foreground">{i + 1}</td>
                        <td className="px-4 py-2.5 font-medium text-foreground">{a.full_name}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{a.roll_no || '—'}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{a.programme || '—'}{a.section ? ` (${a.section})` : ''}</td>
                        <td className="px-4 py-2.5 text-muted-foreground">{formatTime(a.scanned_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ManageEventsModal;
