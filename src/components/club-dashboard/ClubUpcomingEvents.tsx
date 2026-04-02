import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, Users } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface UpcomingEvent {
  id: string;
  name: string;
  event_date: string;
  month: string;
  day: string;
  daysAway: string;
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

const ClubUpcomingEvents = ({ clubId, clubName }: Props) => {
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
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
        .gte('event_date', now)
        .order('event_date', { ascending: true })
        .limit(5);

      if (data) {
        setEvents(data.map(e => {
          const d = new Date(e.event_date);
          const diffDays = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          return {
            id: e.id,
            name: e.name,
            event_date: e.event_date,
            month: d.toLocaleString('default', { month: 'short' }).toUpperCase(),
            day: String(d.getDate()).padStart(2, '0'),
            daysAway: diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : `in ${diffDays} days`,
          };
        }));
      }
    };
    fetchEvents();
  }, [clubId]);

  const handleEventClick = async (eventId: string) => {
    setLoadingDetail(true);
    setDialogOpen(true);

    const [eventRes, participantRes] = await Promise.all([
      supabase.from('events').select('id, name, description, event_date, end_date, category, event_type, access_type').eq('id', eventId).single(),
      supabase.from('event_participants').select('id', { count: 'exact', head: true }).eq('event_id', eventId),
    ]);

    if (eventRes.data) {
      setSelectedEvent({
        ...eventRes.data,
        participant_count: participantRes.count ?? 0,
      });
    }
    setLoadingDetail(false);
  };

  const formatDateTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) +
      ' at ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="border-[3px] border-[#111] rounded-[6px] bg-white p-5 h-full" style={{ boxShadow: '4px 4px 0px #111' }}>
      <h3 className="text-sm font-black text-[#111] uppercase tracking-wider mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Upcoming Events</h3>

      <div className="space-y-3">
        {events.length > 0 ? events.map(event => (
          <div
            key={event.id}
            onClick={() => handleEventClick(event.id)}
            className="flex items-center justify-between p-3 rounded-[6px] border-[2px] border-[#111] hover:bg-[#FDE8D0] hover:translate-y-[-2px] transition-all cursor-pointer"
            style={{ boxShadow: '2px 2px 0px #111' }}
          >
            <div className="flex items-center gap-3">
              <div className="border-[2px] border-[#111] rounded-[4px] overflow-hidden flex flex-col items-center min-w-[3rem]">
                <div className="bg-[#E98A3A] w-full py-0.5 flex items-center justify-center">
                  <span className="text-[9px] text-[#111] font-black uppercase tracking-wide">{event.month}</span>
                </div>
                <div className="flex items-center justify-center py-1 bg-white">
                  <span className="text-lg font-black text-[#111] leading-none">{event.day}</span>
                </div>
              </div>
              <div>
                <h4 className="font-bold text-[#111] text-sm">{event.name}</h4>
                <p className="text-xs text-[#111]/50 font-medium">{event.daysAway}</p>
              </div>
            </div>
            <Calendar className="w-4 h-4 text-[#111]/40" />
          </div>
        )) : (
          <p className="text-sm text-[#111]/50 font-medium text-center py-4">No upcoming events</p>
        )}
      </div>

      {/* Event Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md border-[3px] border-[#111] rounded-[6px] bg-white" style={{ boxShadow: '6px 6px 0px #111' }}>
          <DialogHeader>
            <DialogTitle className="font-black text-[#111]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{loadingDetail ? 'Loading...' : selectedEvent?.name}</DialogTitle>
            <DialogDescription className="text-[#111]/50 font-medium">Event details for {clubName}</DialogDescription>
          </DialogHeader>
          {loadingDetail ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-[3px] border-[#111]/30 border-t-[#111] rounded-full animate-spin" />
            </div>
          ) : selectedEvent ? (
            <div className="space-y-4">
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 text-xs font-bold border-[2px] border-[#111] rounded-[4px] bg-[#E98A3A] text-[#111]">{eventTypeLabelMap[selectedEvent.event_type] ?? selectedEvent.event_type}</span>
                <span className="px-3 py-1 text-xs font-bold border-[2px] border-[#111] rounded-[4px] bg-white text-[#111] capitalize">{selectedEvent.category}</span>
                <span className="px-3 py-1 text-xs font-bold border-[2px] border-[#111] rounded-[4px] bg-white text-[#111]">{selectedEvent.access_type === 'open' ? 'Open for All' : 'Only for Club Members'}</span>
              </div>

              {/* Date & Time */}
              <div className="flex items-start gap-3 text-sm">
                <Clock className="w-4 h-4 text-[#111]/60 mt-0.5 shrink-0" />
                <div>
                  <p className="font-bold text-[#111]">{formatDateTime(selectedEvent.event_date)}</p>
                  {selectedEvent.end_date && (
                    <p className="text-[#111]/50 font-medium">Ends: {formatDateTime(selectedEvent.end_date)}</p>
                  )}
                </div>
              </div>

              {/* Participants */}
              <div className="flex items-center gap-3 text-sm">
                <Users className="w-4 h-4 text-[#111]/60 shrink-0" />
                <span className="text-[#111] font-bold">{selectedEvent.participant_count} Registered Participants</span>
              </div>

              {/* Description */}
              <div className="pt-2 border-t-[2px] border-[#111]/20">
                <p className="text-sm text-[#111]/70 leading-relaxed font-medium">
                  {selectedEvent.description || 'No description provided.'}
                </p>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClubUpcomingEvents;
