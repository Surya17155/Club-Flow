import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, Tag, Shield, Users, Mail, Phone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';

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

interface PresidentInfo {
  full_name: string;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
}

const EVENT_COLORS = [
  { bg: 'bg-green-200', text: 'text-green-800', border: 'border-green-300' },
  { bg: 'bg-blue-200', text: 'text-blue-800', border: 'border-blue-300' },
  { bg: 'bg-yellow-200', text: 'text-yellow-800', border: 'border-yellow-300' },
  { bg: 'bg-purple-200', text: 'text-purple-800', border: 'border-purple-300' },
  { bg: 'bg-pink-200', text: 'text-pink-800', border: 'border-pink-300' },
  { bg: 'bg-orange-200', text: 'text-orange-800', border: 'border-orange-300' },
  { bg: 'bg-teal-200', text: 'text-teal-800', border: 'border-teal-300' },
  { bg: 'bg-red-200', text: 'text-red-800', border: 'border-red-300' },
];

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const SuperAdminCalendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDayEvents, setSelectedDayEvents] = useState<CalendarEvent[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [eventDetailOpen, setEventDetailOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [presidentInfo, setPresidentInfo] = useState<PresidentInfo | null>(null);
  const [loadingPresident, setLoadingPresident] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    const fetchEvents = async () => {
      const startOfMonth = new Date(year, month, 1).toISOString();
      const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

      const { data } = await supabase
        .from('events')
        .select('id, name, event_date, end_date, description, event_type, category, access_type, club_id, clubs(name)')
        .gte('event_date', startOfMonth)
        .lte('event_date', endOfMonth)
        .order('event_date');

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
  }, [year, month]);

  const fetchPresidentForClub = async (clubId: string) => {
    setLoadingPresident(true);
    setPresidentInfo(null);
    const { data: memberData } = await supabase
      .from('club_members')
      .select('user_id')
      .eq('club_id', clubId)
      .eq('role', 'president')
      .limit(1);

    if (memberData && memberData.length > 0) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, phone, avatar_url')
        .eq('user_id', memberData[0].user_id)
        .single();

      if (profile) {
        setPresidentInfo(profile);
      }
    }
    setLoadingPresident(false);
  };

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

  const handleEventClick = (ev: CalendarEvent) => {
    setSelectedEvent(ev);
    setDialogOpen(false);
    setEventDetailOpen(true);
    fetchPresidentForClub(ev.club_id);
  };

  // Club legend
  const clubLegend = useMemo(() => {
    const seen = new Map<string, { name: string; colorIdx: number }>();
    events.forEach((e) => {
      if (!seen.has(e.club_id)) {
        seen.set(e.club_id, { name: e.club_name || 'Unknown', colorIdx: clubColorMap.get(e.club_id) ?? 0 });
      }
    });
    return Array.from(seen.values());
  }, [events, clubColorMap]);

  return (
    <section className="glass-card p-6">
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Platform Event Calendar
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">All events across all clubs</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-accent/50 transition-colors">
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <span className="text-sm font-semibold text-foreground min-w-[150px] text-center">
            {MONTHS[month]} {year}
          </span>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-accent/50 transition-colors">
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Club color legend */}
      {clubLegend.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {clubLegend.map((c, i) => {
            const color = EVENT_COLORS[c.colorIdx];
            return (
              <span key={i} className={`${color.bg} ${color.text} text-[10px] font-medium px-2 py-0.5 rounded-full`}>
                {c.name}
              </span>
            );
          })}
        </div>
      )}

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map((d) => (
          <div key={d} className="text-xs text-muted-foreground font-semibold text-center py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="h-20 border border-transparent p-1" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const dayEvents = getEventsForDay(day);
          const hasEvents = dayEvents.length > 0;
          return (
            <div
              key={day}
              onClick={() => handleDayClick(day)}
              className={`h-20 border border-border/30 p-1.5 flex flex-col transition rounded-lg ${
                isToday(day) ? 'bg-primary/10 border-primary/40 ring-1 ring-primary/20' : ''
              } ${hasEvents ? 'cursor-pointer hover:bg-primary/5 hover:border-primary/20' : 'hover:bg-accent/20'}`}
            >
              <span className={`text-xs mb-0.5 ${isToday(day) ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                {day}
              </span>
              <div className="flex flex-col gap-0.5 overflow-hidden flex-1">
                {dayEvents.slice(0, 2).map((ev) => {
                  const colorIdx = clubColorMap.get(ev.club_id) ?? 0;
                  const color = EVENT_COLORS[colorIdx];
                  return (
                    <div
                      key={ev.id}
                      className={`w-full ${color.bg} ${color.text} text-[9px] leading-tight rounded px-1 py-0.5 font-medium truncate`}
                      title={`${ev.name} (${ev.club_name})`}
                    >
                      {ev.name}
                    </div>
                  );
                })}
                {dayEvents.length > 2 && (
                  <span className="text-[9px] text-muted-foreground font-medium">+{dayEvents.length - 2} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Day Events List Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Events on {selectedDay} {MONTHS[month]} {year}
            </DialogTitle>
            <DialogDescription>
              {selectedDayEvents.length} event{selectedDayEvents.length !== 1 ? 's' : ''} — click an event for details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {selectedDayEvents.map((ev) => {
              const colorIdx = clubColorMap.get(ev.club_id) ?? 0;
              const color = EVENT_COLORS[colorIdx];
              return (
                <button
                  key={ev.id}
                  onClick={() => handleEventClick(ev)}
                  className={`w-full text-left rounded-xl border ${color.border} p-4 space-y-2 hover:shadow-md transition-shadow bg-card`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-foreground text-sm">{ev.name}</h4>
                      <p className="text-xs text-muted-foreground">{ev.club_name}</p>
                    </div>
                    <Badge className={`${color.bg} ${color.text} border-0 text-[10px] shrink-0`}>
                      {ev.event_type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-primary" />
                      {format(new Date(ev.event_date), 'h:mm a')}
                    </span>
                    {ev.category && (
                      <span className="flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {ev.category}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Event Detail + President Contact Dialog */}
      <Dialog open={eventDetailOpen} onOpenChange={setEventDetailOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Event Details
            </DialogTitle>
            <DialogDescription>Full information about this event</DialogDescription>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-5">
              {/* Event info */}
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-bold text-foreground">{selectedEvent.name}</h3>
                  <p className="text-sm text-muted-foreground">Organized by <span className="font-medium text-foreground">{selectedEvent.club_name}</span></p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Starts</p>
                      <p className="text-foreground text-xs font-medium">{format(new Date(selectedEvent.event_date), 'MMM d, yyyy h:mm a')}</p>
                    </div>
                  </div>
                  {selectedEvent.end_date && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Ends</p>
                        <p className="text-foreground text-xs font-medium">{format(new Date(selectedEvent.end_date), 'MMM d, yyyy h:mm a')}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {selectedEvent.event_type && (
                    <Badge variant="secondary" className="text-[10px]">
                      <Tag className="w-3 h-3 mr-1" />
                      {selectedEvent.event_type}
                    </Badge>
                  )}
                  {selectedEvent.category && (
                    <Badge variant="outline" className="text-[10px]">
                      {selectedEvent.category}
                    </Badge>
                  )}
                  {selectedEvent.access_type && (
                    <Badge variant="outline" className="text-[10px]">
                      <Shield className="w-3 h-3 mr-1" />
                      {selectedEvent.access_type}
                    </Badge>
                  )}
                </div>

                {selectedEvent.description && (
                  <p className="text-sm text-muted-foreground leading-relaxed border-t border-border/30 pt-3">
                    {selectedEvent.description}
                  </p>
                )}
              </div>

              {/* President contact card */}
              <div className="border-t border-border/40 pt-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Club President</h4>
                {loadingPresident ? (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm">
                    <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    Loading...
                  </div>
                ) : presidentInfo ? (
                  <div className="rounded-xl border border-border/50 bg-accent/20 p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={presidentInfo.avatar_url || undefined} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                          {presidentInfo.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{presidentInfo.full_name}</p>
                        <Badge variant="secondary" className="text-[10px]">President</Badge>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {presidentInfo.email && (
                        <a
                          href={`mailto:${presidentInfo.email}`}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors bg-primary/10 hover:bg-primary/20 text-primary"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          Email
                        </a>
                      )}
                      {presidentInfo.phone && (
                        <a
                          href={`tel:${presidentInfo.phone}`}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors bg-primary/10 hover:bg-primary/20 text-primary"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          Call
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No president assigned to this club.</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default SuperAdminCalendar;
