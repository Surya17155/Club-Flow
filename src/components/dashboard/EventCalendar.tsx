import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useClub } from '@/contexts/ClubContext';

interface CalendarEvent {
  id: string;
  name: string;
  event_date: string;
  club_id: string;
  club_name?: string;
}

const EVENT_COLORS = [
  { bg: 'bg-green-200', text: 'text-green-800' },
  { bg: 'bg-blue-200', text: 'text-blue-800' },
  { bg: 'bg-yellow-200', text: 'text-yellow-800' },
  { bg: 'bg-purple-200', text: 'text-purple-800' },
  { bg: 'bg-pink-200', text: 'text-pink-800' },
  { bg: 'bg-orange-200', text: 'text-orange-800' },
];

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface Props {
  mode: 'personal' | 'club';
}

const EventCalendar = ({ mode }: Props) => {
  const { user } = useAuth();
  const { activeClub } = useClub();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    if (!user) return;
    const fetchEvents = async () => {
      const startOfMonth = new Date(year, month, 1).toISOString();
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

      let query = supabase
        .from('events')
        .select('id, name, event_date, club_id, clubs(name)')
        .gte('event_date', startOfMonth)
        .lte('event_date', endOfMonth)
        .order('event_date');

      if (mode === 'club' && activeClub) {
        query = query.eq('club_id', activeClub.club_id);
      }

      const { data } = await query;
      setEvents(
        (data ?? []).map((e: any) => ({
          id: e.id,
          name: e.name,
          event_date: e.event_date,
          club_id: e.club_id,
          club_name: e.clubs?.name,
        }))
      );
    };
    fetchEvents();
  }, [user, year, month, mode, activeClub?.club_id]);

  // Club color map for consistent colors
  const clubColorMap = useMemo(() => {
    const map = new Map<string, number>();
    let idx = 0;
    events.forEach((e) => {
      if (!map.has(e.club_id)) {
        map.set(e.club_id, idx % EVENT_COLORS.length);
        idx++;
      }
    });
    return map;
  }, [events]);

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getEventsForDay = (day: number) => {
    return events.filter((e) => {
      const d = new Date(e.event_date);
      return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
    });
  };

  const today = new Date();
  const isToday = (day: number) =>
    today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

  return (
    <div className="glass-card p-6 flex flex-col h-full">
      <div className="flex justify-between items-center mb-5">
        <h3 className="text-lg font-bold text-foreground">
          {mode === 'personal' ? 'Upcoming Events Calendar' : 'Club Events Calendar'}
        </h3>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-white/50 transition-colors">
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <span className="text-sm font-semibold text-foreground min-w-[140px] text-center">
            {MONTHS[month]} {year}
          </span>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-white/50 transition-colors">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map((d) => (
          <div key={d} className="text-xs text-muted-foreground font-medium text-center py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 flex-1">
        {/* Empty cells for offset */}
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="h-14 border border-transparent p-1" />
        ))}

        {/* Day cells */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayEvents = getEventsForDay(day);
          return (
            <div
              key={day}
              className={`h-14 border border-border/30 p-1 flex flex-col items-end hover:bg-white/40 transition rounded-lg ${
                isToday(day) ? 'bg-primary/10 border-primary/30' : ''
              }`}
            >
              <span className={`text-xs ${isToday(day) ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                {day}
              </span>
              {dayEvents.slice(0, 1).map((ev) => {
                const colorIdx = clubColorMap.get(ev.club_id) ?? 0;
                const color = EVENT_COLORS[colorIdx];
                return (
                  <div
                    key={ev.id}
                    className={`w-full ${color.bg} ${color.text} text-[9px] leading-tight rounded px-1 py-0.5 mt-0.5 font-medium truncate`}
                    title={ev.name}
                  >
                    {ev.name}
                  </div>
                );
              })}
              {dayEvents.length > 1 && (
                <span className="text-[8px] text-muted-foreground">+{dayEvents.length - 1}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EventCalendar;
