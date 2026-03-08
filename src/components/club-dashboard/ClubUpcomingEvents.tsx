import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Calendar, Clock, Users, Tag, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

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
  clubLogo?: string | null;
  clubName: string;
}

const eventTypeLabelMap: Record<string, string> = {
  workshop: 'Workshop', seminar: 'Seminar', hackathon: 'Hackathon',
  industrial_visit: 'Industrial Visit', guest_lecture: 'Guest Lecture',
  competition: 'Competition', social: 'Social', other: 'Other',
};

const ClubUpcomingEvents = ({ clubId, clubLogo, clubName }: Props) => {
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
    <div className="glass-card p-5 h-full">
      {/* Club logo at top */}
      <div className="w-16 h-16 rounded-full bg-foreground flex items-center justify-center mb-4 shadow-xl border-4 border-white/20 overflow-hidden mx-auto">
        {clubLogo ? (
          <img src={clubLogo} alt={clubName} className="w-full h-full object-cover" />
        ) : (
          <span className="text-2xl font-display font-bold text-background">{clubName[0]}</span>
        )}
      </div>

      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Upcoming Events</h3>

      <div className="space-y-3">
        {events.length > 0 ? events.map(event => (
          <div
            key={event.id}
            onClick={() => handleEventClick(event.id)}
            className="flex items-center justify-between p-2 rounded-xl hover:bg-white/30 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="bg-white rounded-lg shadow-sm border border-border flex flex-col items-center justify-start h-14 min-w-[3.5rem] overflow-hidden">
                <div className="bg-destructive w-full h-5 flex items-center justify-center">
                  <span className="text-[9px] text-destructive-foreground font-bold uppercase tracking-wide">{event.month}</span>
                </div>
                <div className="flex items-center justify-center h-full pb-1">
                  <span className="text-xl font-bold text-foreground leading-none">{event.day}</span>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-foreground text-sm">{event.name}</h4>
                <p className="text-xs text-muted-foreground">{event.daysAway}</p>
              </div>
            </div>
            <Calendar className="w-5 h-5 text-muted-foreground" />
          </div>
        )) : (
          <p className="text-sm text-muted-foreground italic text-center py-4">No upcoming events</p>
        )}
      </div>

      {/* Event Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{loadingDetail ? 'Loading...' : selectedEvent?.name}</DialogTitle>
            <DialogDescription>Event details for {clubName}</DialogDescription>
          </DialogHeader>
          {loadingDetail ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          ) : selectedEvent ? (
            <div className="space-y-4">
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">{eventTypeLabelMap[selectedEvent.event_type] ?? selectedEvent.event_type}</Badge>
                <Badge variant="outline" className="capitalize">{selectedEvent.category}</Badge>
                <Badge variant="outline">{selectedEvent.access_type}</Badge>
              </div>

              {/* Date & Time */}
              <div className="flex items-start gap-3 text-sm">
                <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground">{formatDateTime(selectedEvent.event_date)}</p>
                  {selectedEvent.end_date && (
                    <p className="text-muted-foreground">Ends: {formatDateTime(selectedEvent.end_date)}</p>
                  )}
                </div>
              </div>

              {/* Participants */}
              <div className="flex items-center gap-3 text-sm">
                <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-foreground">{selectedEvent.participant_count} Registered Participants</span>
              </div>

              {/* Description */}
              {selectedEvent.description && (
                <div className="pt-2 border-t border-border/50">
                  <p className="text-sm text-muted-foreground leading-relaxed">{selectedEvent.description}</p>
                </div>
              )}

              {!selectedEvent.description && (
                <div className="pt-2 border-t border-border/50">
                  <p className="text-sm text-muted-foreground italic">No description provided.</p>
                </div>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClubUpcomingEvents;