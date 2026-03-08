import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Calendar } from 'lucide-react';

interface UpcomingEvent {
  id: string;
  name: string;
  event_date: string;
  month: string;
  day: string;
  daysAway: string;
}

interface Props {
  clubId: string;
  clubLogo?: string | null;
  clubName: string;
}

const ClubUpcomingEvents = ({ clubId, clubLogo, clubName }: Props) => {
  const [events, setEvents] = useState<UpcomingEvent[]>([]);

  useEffect(() => {
    const fetch = async () => {
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
    fetch();
  }, [clubId]);

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
          <div key={event.id} className="flex items-center justify-between p-2 rounded-xl hover:bg-white/30 transition cursor-pointer">
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
    </div>
  );
};

export default ClubUpcomingEvents;
