import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, Tag, Shield, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useClub } from '@/contexts/ClubContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';

interface CalendarEvent {
  id: string;
  name: string;
  event_date: string;
  end_date?: string | null;
  description?: string | null;
  event_type?: string;
  category?: string;
  access_type?: string;
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

const MobileCalendar = () => {
  const { user } = useAuth();
  const { activeClub } = useClub();
  const navigate = useNavigate();

  const [viewMode] = useState<'personal' | 'club'>(() => {
    return (localStorage.getItem('dashboardViewMode') as 'personal' | 'club') || 'personal';
  });

  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDayEvents, setSelectedDayEvents] = useState<CalendarEvent[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    if (!user) return;
    const fetchEvents = async () => {
      const startOfMonth = new Date(year, month, 1).toISOString();
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

      let query = supabase
        .from('events')
        .select('id, name, event_date, end_date, description, event_type, category, access_type, club_id, clubs(name)')
        .gte('event_date', startOfMonth)
        .lte('event_date', endOfMonth)
        .order('event_date');

      if (viewMode === 'club' && activeClub) {
        query = query.eq('club_id', activeClub.club_id);
      }

      const { data } = await query;
      setEvents(
        (data ?? []).map((e: any) => ({
          id: e.id,
          name: e.name,
          event_date: e.event_date,
          end_date: e.end_date,
          description: e.description,
          event_type: e.event_type,
          category: e.category,
          access_type: e.access_type,
          club_id: e.club_id,
          club_name: e.clubs?.name,
        }))
      );
    };
    fetchEvents();
  }, [user, year, month, viewMode, activeClub?.club_id]);

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

  const handleDayClick = (day: number) => {
    const dayEvents = getEventsForDay(day);
    if (dayEvents.length > 0) {
      setSelectedDayEvents(dayEvents);
      setSelectedDay(day);
      setDialogOpen(true);
    }
  };

  return (
    <div
      className="min-h-screen pb-24 dashboard-corner-gradient"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <style>{`::-webkit-scrollbar { display: none; }`}</style>

      {/* Header */}
      <div className="sticky top-0 z-30 px-4 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl hover:bg-white/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div>
            <h1 className="text-lg font-bold font-display text-foreground">
              {viewMode === 'personal' ? 'College Calendar' : `${activeClub?.club_name || 'Club'} Calendar`}
            </h1>
            <p className="text-xs text-muted-foreground">
              {viewMode === 'personal' ? 'All college events' : 'Club-specific events'}
            </p>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="px-4 pt-2">
        <div className="glass-card p-4">
          {/* Month navigation */}
          <div className="flex justify-between items-center mb-4">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-white/50 transition-colors">
              <ChevronLeft className="w-5 h-5 text-muted-foreground" />
            </button>
            <span className="text-base font-bold text-foreground">
              {MONTHS[month]} {year}
            </span>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-white/50 transition-colors">
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((d) => (
              <div key={d} className="text-[10px] text-muted-foreground font-semibold text-center py-1.5">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-[2px]">
            {Array.from({ length: firstDayOfMonth }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square p-0.5" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dayEvents = getEventsForDay(day);
              const hasEvents = dayEvents.length > 0;
              return (
                <div
                  key={day}
                  onClick={() => handleDayClick(day)}
                  className={`aspect-square p-0.5 flex flex-col items-center justify-start rounded-lg transition ${
                    isToday(day) ? 'bg-primary/10 ring-1 ring-primary/30' : ''
                  } ${hasEvents ? 'cursor-pointer active:scale-95' : ''}`}
                >
                  <span className={`text-xs mt-0.5 ${isToday(day) ? 'font-bold text-primary' : 'text-foreground'}`}>
                    {day}
                  </span>
                  {hasEvents && (
                    <div className="flex gap-[2px] mt-0.5 flex-wrap justify-center">
                      {dayEvents.slice(0, 3).map((ev) => {
                        const colorIdx = clubColorMap.get(ev.club_id) ?? 0;
                        const color = EVENT_COLORS[colorIdx];
                        return (
                          <div
                            key={ev.id}
                            className={`w-1.5 h-1.5 rounded-full ${color.bg}`}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Events list for current month */}
        {events.length > 0 && (
          <div className="mt-4 space-y-2">
            <h3 className="text-sm font-bold text-foreground px-1">
              Events this month ({events.length})
            </h3>
            {events.map((ev) => {
              const colorIdx = clubColorMap.get(ev.club_id) ?? 0;
              const color = EVENT_COLORS[colorIdx];
              const d = new Date(ev.event_date);
              return (
                <div
                  key={ev.id}
                  onClick={() => {
                    setSelectedDayEvents([ev]);
                    setSelectedDay(d.getDate());
                    setDialogOpen(true);
                  }}
                  className="glass-card p-3 flex items-center gap-3 active:scale-[0.98] transition-transform cursor-pointer"
                >
                  <div className={`w-10 h-10 rounded-xl ${color.bg} flex flex-col items-center justify-center shrink-0`}>
                    <span className={`text-[9px] font-bold uppercase ${color.text}`}>
                      {format(d, 'MMM')}
                    </span>
                    <span className={`text-sm font-bold leading-none ${color.text}`}>
                      {d.getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-foreground truncate">{ev.name}</h4>
                    <p className="text-[11px] text-muted-foreground">
                      {ev.club_name} • {format(d, 'h:mm a')}
                    </p>
                  </div>
                  {ev.event_type && (
                    <Badge variant="outline" className="text-[9px] shrink-0">
                      {ev.event_type}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {events.length === 0 && (
          <div className="glass-card p-8 text-center mt-4">
            <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No events this month</p>
          </div>
        )}
      </div>

      {/* Event Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-[calc(100vw-32px)] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Calendar className="w-4 h-4 text-primary" />
              Events on {selectedDay} {MONTHS[month]}
            </DialogTitle>
            <DialogDescription>
              {selectedDayEvents.length} event{selectedDayEvents.length !== 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {selectedDayEvents.map((ev) => {
              const colorIdx = clubColorMap.get(ev.club_id) ?? 0;
              const color = EVENT_COLORS[colorIdx];
              return (
                <div key={ev.id} className={`rounded-xl border border-border/50 p-3 space-y-2 ${color.bg}/20`}>
                  <div>
                    <h4 className="font-semibold text-foreground text-sm">{ev.name}</h4>
                    {ev.club_name && (
                      <p className="text-[11px] text-muted-foreground mt-0.5">by {ev.club_name}</p>
                    )}
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Clock className="w-3 h-3 text-primary" />
                      <span>{format(new Date(ev.event_date), 'MMM d, yyyy h:mm a')}</span>
                    </div>
                    {ev.end_date && (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Clock className="w-3 h-3 text-primary" />
                        <span>End: {format(new Date(ev.end_date), 'h:mm a')}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {ev.event_type && (
                      <Badge variant="secondary" className="text-[9px]">
                        <Tag className="w-2.5 h-2.5 mr-0.5" />
                        {ev.event_type}
                      </Badge>
                    )}
                    {ev.category && (
                      <Badge variant="outline" className="text-[9px]">{ev.category}</Badge>
                    )}
                    {ev.access_type && (
                      <Badge variant="outline" className="text-[9px]">
                        <Shield className="w-2.5 h-2.5 mr-0.5" />
                        {ev.access_type}
                      </Badge>
                    )}
                  </div>

                  {ev.description && (
                    <p className="text-[11px] text-muted-foreground leading-relaxed border-t border-border/30 pt-2">
                      {ev.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <MobileBottomNav />
    </div>
  );
};

export default MobileCalendar;
