import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, Users, Tag, Shield, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { format } from 'date-fns';

interface PastEvent {
  id: string;
  name: string;
  event_date: string;
  month: string;
  day: string;
  timeAgo: string;
}

interface EventDetail {
  id: string;
  name: string;
  description: string | null;
  event_date: string;
  end_date: string | null;
  category: string;
  event_type: string;
  access_type: string;
  participant_count: number;
}

interface Props {
  clubId: string;
  clubName: string;
}

const eventTypeLabelMap: Record<string, string> = {
  workshop: 'Workshop', seminar: 'Seminar', hackathon: 'Hackathon',
  industrial_visit: 'Industrial Visit', guest_lecture: 'Guest Lecture',
  competition: 'Competition', social: 'Social', other: 'Other',
};

const ClubPreviousEvents = ({ clubId, clubName }: Props) => {
  const [events, setEvents] = useState<PastEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<EventDetail | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from('events')
        .select('id, name, event_date')
        .eq('club_id', clubId)
        .lt('event_date', now)
        .order('event_date', { ascending: false })
        .limit(10);

      if (data) {
        setEvents(data.map(e => {
          const d = new Date(e.event_date);
          const diffDays = Math.ceil((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
          return {
            id: e.id,
            name: e.name,
            event_date: e.event_date,
            month: d.toLocaleString('default', { month: 'short' }).toUpperCase(),
            day: String(d.getDate()).padStart(2, '0'),
            timeAgo: diffDays === 0 ? 'Today' : diffDays === 1 ? 'Yesterday' : `${diffDays} days ago`,
          };
        }));
      }
    };
    fetchEvents();
  }, [clubId]);

  const handleEventClick = async (eventId: string) => {
    setLoadingDetail(true);
    setDialogOpen(true);

    const [eventRes, attendanceRes] = await Promise.all([
      supabase.from('events').select('id, name, description, event_date, end_date, category, event_type, access_type').eq('id', eventId).single(),
      supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('event_id', eventId).eq('status', 'present'),
    ]);

    if (eventRes.data) {
      setSelectedEvent({
        ...eventRes.data,
        participant_count: attendanceRes.count ?? 0,
      });
    }
    setLoadingDetail(false);
  };

  const formatDateTime = (dateStr: string) => {
    return format(new Date(dateStr), "EEEE, MMMM d, yyyy 'at' h:mm a");
  };

  return (
    <div className="border-[3px] border-[#111] rounded-[6px] bg-white p-5 h-full" style={{ boxShadow: '4px 4px 0px #111' }}>
      <h3 className="text-sm font-black text-[#111] uppercase tracking-wider mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Previous Events</h3>

      <div className="space-y-3 max-h-[400px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
        {events.length > 0 ? events.map(event => (
          <div
            key={event.id}
            onClick={() => handleEventClick(event.id)}
            className="flex items-center justify-between p-3 rounded-[6px] border-[2px] border-[#111] hover:bg-[#FDE8D0] hover:translate-y-[-2px] transition-all cursor-pointer"
            style={{ boxShadow: '2px 2px 0px #111' }}
          >
            <div className="flex items-center gap-3">
              <div className="border-[2px] border-[#111] rounded-[4px] overflow-hidden flex flex-col items-center min-w-[3rem]">
                <div className="bg-[#111] w-full py-0.5 flex items-center justify-center">
                  <span className="text-[9px] text-white font-black uppercase tracking-wide">{event.month}</span>
                </div>
                <div className="flex items-center justify-center py-1 bg-white">
                  <span className="text-lg font-black text-[#111] leading-none">{event.day}</span>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-[#111] text-sm">{event.name}</h4>
                <p className="text-xs text-[#111]/50 font-medium">{event.timeAgo}</p>
              </div>
            </div>
            <Calendar className="w-4 h-4 text-[#111]/40" />
          </div>
        )) : (
          <p className="text-sm text-[#111]/50 font-medium text-center py-4">No previous events</p>
        )}
      </div>

      {/* Event Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="max-w-md"
          style={{
            border: '3px solid #111111',
            borderRadius: '16px',
            boxShadow: '6px 6px 0px #111111',
            background: '#FFFDF5',
          }}
        >
          <DialogHeader>
            <DialogTitle
              className="flex items-center gap-2"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#111111' }}
            >
              <Calendar className="w-5 h-5" style={{ color: '#E98A3A' }} />
              {loadingDetail ? 'Loading...' : 'Past Event Details'}
            </DialogTitle>
            <DialogDescription>
              Event details for {clubName}
            </DialogDescription>
          </DialogHeader>
          {loadingDetail ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-[3px] border-[#111]/30 border-t-[#111] rounded-full animate-spin" />
            </div>
          ) : selectedEvent ? (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div
                className="p-4 space-y-3"
                style={{
                  border: '2px solid #111111',
                  borderRadius: '12px',
                  boxShadow: '3px 3px 0px #111111',
                  background: '#FFFFFF',
                }}
              >
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#E98A3A' }}>
                  {clubName}
                </p>
                <h4
                  className="font-bold text-base"
                  style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#111111' }}
                >
                  {selectedEvent.name}
                </h4>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5" style={{ color: '#555' }}>
                    <Calendar className="w-3.5 h-3.5" style={{ color: '#E98A3A' }} />
                    <span>{format(new Date(selectedEvent.event_date), 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-1.5" style={{ color: '#555' }}>
                    <Clock className="w-3.5 h-3.5" style={{ color: '#E98A3A' }} />
                    <span>
                      {format(new Date(selectedEvent.event_date), 'h:mm a')}
                      {selectedEvent.end_date ? ` – ${format(new Date(selectedEvent.end_date), 'h:mm a')}` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 flex items-center gap-1"
                    style={{ border: '2px solid #111', borderRadius: '6px', background: '#FFF8E1', color: '#111' }}
                  >
                    <Tag className="w-3 h-3" />
                    {eventTypeLabelMap[selectedEvent.event_type] ?? selectedEvent.event_type}
                  </span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 flex items-center gap-1"
                    style={{ border: '2px solid #111', borderRadius: '6px', background: '#FFFDF5', color: '#111' }}
                  >
                    <Shield className="w-3 h-3" />
                    {selectedEvent.access_type === 'open' ? 'Open for All' : 'Club Only'}
                  </span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 flex items-center gap-1"
                    style={{
                      border: '2px solid #111',
                      borderRadius: '6px',
                      background: '#E8F5E9',
                      color: '#111',
                    }}
                  >
                    <Users className="w-3 h-3" />
                    {selectedEvent.participant_count} Participants
                  </span>
                </div>

                {selectedEvent.description && (
                  <div style={{ borderTop: '2px solid #111', paddingTop: '8px' }}>
                    <h5 className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#888' }}>
                      Description
                    </h5>
                    <p className="text-xs leading-relaxed" style={{ color: '#555' }}>
                      {selectedEvent.description}
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClubPreviousEvents;
