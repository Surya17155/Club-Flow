import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, Tag, Shield, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useClub } from '@/contexts/ClubContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
  attendance_given?: boolean;
  club_id: string;
  club_name?: string;
}

interface CalendarCell {
  key: string;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
}

const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

interface Props {
  mode: 'personal' | 'club';
}

const NeoBrutalCalendar = ({ mode }: Props) => {
  const { user } = useAuth();
  const { activeClub } = useClub();
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
        .select('id, name, event_date, end_date, description, event_type, category, access_type, attendance_given, club_id, clubs(name)')
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
          end_date: e.end_date,
          description: e.description,
          event_type: e.event_type,
          category: e.category,
          access_type: e.access_type,
          club_id: e.club_id,
          attendance_given: e.attendance_given,
          club_name: e.clubs?.name,
        }))
      );
    };

    fetchEvents();
  }, [user, year, month, mode, activeClub?.club_id]);

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getEventsForDate = (targetDate: Date) => {
    return events.filter((event) => {
      const eventDate = new Date(event.event_date);
      return (
        eventDate.getDate() === targetDate.getDate() &&
        eventDate.getMonth() === targetDate.getMonth() &&
        eventDate.getFullYear() === targetDate.getFullYear()
      );
    });
  };

  const today = new Date();

  const calendarCells = useMemo<CalendarCell[]>(() => {
    return Array.from({ length: 42 }, (_, index) => {
      const offsetDay = index - startOffset;
      let cellDate: Date;
      let isCurrentMonth = true;

      if (offsetDay < 0) {
        cellDate = new Date(year, month - 1, daysInPrevMonth + offsetDay + 1);
        isCurrentMonth = false;
      } else if (offsetDay >= daysInMonth) {
        cellDate = new Date(year, month + 1, offsetDay - daysInMonth + 1);
        isCurrentMonth = false;
      } else {
        cellDate = new Date(year, month, offsetDay + 1);
      }

      const dayEvents = getEventsForDate(cellDate);
      const isToday =
        cellDate.getDate() === today.getDate() &&
        cellDate.getMonth() === today.getMonth() &&
        cellDate.getFullYear() === today.getFullYear();

      return {
        key: `${cellDate.getFullYear()}-${cellDate.getMonth()}-${cellDate.getDate()}`,
        day: cellDate.getDate(),
        isCurrentMonth,
        isToday,
        events: dayEvents,
      };
    });
  }, [daysInMonth, daysInPrevMonth, events, month, startOffset, today, year]);

  const handleDayClick = (day: number, dayEvents: CalendarEvent[]) => {
    if (dayEvents.length === 0) return;
    setSelectedDayEvents(dayEvents);
    setSelectedDay(day);
    setDialogOpen(true);
  };

  return (
    <div className="flex flex-col">
      <div
        className="px-4 py-3 flex justify-between items-center gap-2"
        style={{ borderBottom: '2px solid #111111', background: 'rgba(246,225,207,0.3)' }}
      >
          <h3
            className="text-base uppercase tracking-wide"
          style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: '#111111', letterSpacing: '-0.5px' }}
        >
          Attendance Calendar
        </h3>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={prevMonth}
            className="p-1.5 transition-all"
            style={{ border: '2px solid #111111', borderRadius: '6px', background: 'transparent' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#111111';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#111111';
            }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span
            className="text-sm px-3 text-center"
            style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: '#111111' }}
          >
            {MONTHS[month].toUpperCase()} {year}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 transition-all"
            style={{ border: '2px solid #111111', borderRadius: '6px', background: 'transparent' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#111111';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#111111';
            }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-7 gap-1.5 mb-1.5">
          {DAYS.map((day) => (
            <div
              key={day}
              className="text-center text-[9px] uppercase leading-none"
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: 'rgba(17,17,17,0.4)' }}
            >
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-2 auto-rows-[clamp(72px,8vw,108px)]">
          {calendarCells.map((cell) => {
            const hasEvents = cell.events.length > 0;

            if (!cell.isCurrentMonth) {
              return (
                <div
                  key={cell.key}
                  className="h-full flex items-center justify-center"
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 700,
                    color: 'rgba(17,17,17,0.2)',
                     fontSize: '12px',
                  }}
                >
                  {cell.day}
                </div>
              );
            }

            return (
              <div
                key={cell.key}
                onClick={() => handleDayClick(cell.day, cell.events)}
                className="h-full min-h-0 flex flex-col items-center justify-center transition-all duration-200 select-none"
                style={{
                  border: '2px solid #111111',
                  borderRadius: '8px',
                  background: cell.isToday ? '#E98A3A' : hasEvents ? '#F6E1CF' : '#FFFFFF',
                  cursor: hasEvents ? 'pointer' : 'default',
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translate(-2px, -2px)';
                  e.currentTarget.style.boxShadow = '4px 4px 0px #111111';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translate(0, 0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                 <span className="font-bold text-xs leading-none" style={{ color: '#111111' }}>
                  {cell.day}
                </span>
                {cell.isToday ? (
                   <span className="text-[6px] font-bold leading-none mt-1" style={{ color: '#111111' }}>
                    TODAY
                  </span>
                ) : hasEvents ? (
                   <div className="w-1.5 h-1.5 rounded-full mt-1" style={{ background: '#E98A3A' }} />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

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
              Events on {selectedDay} {MONTHS[month]} {year}
            </DialogTitle>
            <DialogDescription>
              {selectedDayEvents.length} event{selectedDayEvents.length !== 1 ? 's' : ''} scheduled
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {selectedDayEvents.map((ev) => (
              <div
                key={ev.id}
                className="p-4 space-y-3"
                style={{
                  border: '2px solid #111111',
                  borderRadius: '12px',
                  boxShadow: '3px 3px 0px #111111',
                  background: '#FFFFFF',
                }}
              >
                {ev.club_name && (
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#E98A3A' }}>
                    {ev.club_name}
                  </p>
                )}
                <h4
                  className="font-bold text-base"
                  style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#111111' }}
                >
                  {ev.name}
                </h4>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5" style={{ color: '#555' }}>
                    <Calendar className="w-3.5 h-3.5" style={{ color: '#E98A3A' }} />
                    <span>{format(new Date(ev.event_date), 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-1.5" style={{ color: '#555' }}>
                    <Clock className="w-3.5 h-3.5" style={{ color: '#E98A3A' }} />
                    <span>
                      {format(new Date(ev.event_date), 'h:mm a')}
                      {ev.end_date ? ` – ${format(new Date(ev.end_date), 'h:mm a')}` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {ev.event_type && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 flex items-center gap-1"
                      style={{ border: '2px solid #111', borderRadius: '6px', background: '#FFF8E1', color: '#111' }}
                    >
                      <Tag className="w-3 h-3" />
                      {ev.event_type}
                    </span>
                  )}
                  {ev.access_type && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 flex items-center gap-1"
                      style={{ border: '2px solid #111', borderRadius: '6px', background: '#FFFDF5', color: '#111' }}
                    >
                      <Shield className="w-3 h-3" />
                      {ev.access_type === 'open' ? 'Open for All' : 'Club Only'}
                    </span>
                  )}
                  {ev.attendance_given !== undefined && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 flex items-center gap-1"
                      style={{
                        border: '2px solid #111',
                        borderRadius: '6px',
                        background: ev.attendance_given ? '#E8F5E9' : '#F5F5F5',
                        color: '#111',
                      }}
                    >
                      <CheckCircle className="w-3 h-3" />
                      {ev.attendance_given ? 'Attendance' : 'No Attendance'}
                    </span>
                  )}
                </div>

                {ev.description && (
                  <div style={{ borderTop: '2px solid #111', paddingTop: '8px' }}>
                    <h5 className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#888' }}>
                      Description
                    </h5>
                    <p className="text-xs leading-relaxed" style={{ color: '#555' }}>
                      {ev.description}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NeoBrutalCalendar;
