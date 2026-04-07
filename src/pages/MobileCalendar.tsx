import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, Tag, Shield, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useClub } from '@/contexts/ClubContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';
import { useIsMobile } from '@/hooks/use-mobile';

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

const MobileCalendar = () => {
  const { user } = useAuth();
  const { activeClub } = useClub();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

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
        .select('id, name, event_date, end_date, description, event_type, category, access_type, attendance_given, club_id, clubs(name)')
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
          attendance_given: e.attendance_given,
          club_id: e.club_id,
          club_name: e.clubs?.name,
        }))
      );
    };
    fetchEvents();
  }, [user, year, month, viewMode, activeClub?.club_id]);

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
    <div
      className="min-h-screen pb-24"
      style={{
        background: '#F4EFE7',
        scrollbarWidth: 'none',
      }}
    >
      <style>{`::-webkit-scrollbar { display: none; }`}</style>


      {/* Calendar Card */}
      <div className="px-4" style={{ paddingTop: '60px' }}>
        <div
          style={{
            background: '#FFFDF7',
            border: '3px solid #111',
            borderRadius: '14px',
            boxShadow: '4px 4px 0px #111',
          }}
        >
          {/* Month navigation header */}
          <div
            className="px-4 py-3 flex justify-between items-center"
            style={{ borderBottom: '2px solid #111', background: 'rgba(246,225,207,0.3)' }}
          >
            <h3
              className="text-sm uppercase tracking-wide"
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: '#111' }}
            >
              {viewMode === 'personal' ? 'College Calendar' : `${activeClub?.club_name || 'Club'} Calendar`}
            </h3>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={prevMonth}
                className="p-1.5 transition-all active:translate-x-[1px] active:translate-y-[1px]"
                style={{ border: '2px solid #111', borderRadius: '6px', background: 'transparent' }}
              >
                <ChevronLeft className="w-4 h-4" style={{ color: '#111' }} />
              </button>
              <span
                className="text-xs px-2 text-center"
                style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: '#111' }}
              >
                {MONTHS[month].toUpperCase()} {year}
              </span>
              <button
                onClick={nextMonth}
                className="p-1.5 transition-all active:translate-x-[1px] active:translate-y-[1px]"
                style={{ border: '2px solid #111', borderRadius: '6px', background: 'transparent' }}
              >
                <ChevronRight className="w-4 h-4" style={{ color: '#111' }} />
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="px-3 pt-3">
            <div className="grid grid-cols-7 gap-1 mb-1">
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

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1 pb-3">
              {calendarCells.map((cell) => {
                const hasEvents = cell.events.length > 0;

                if (!cell.isCurrentMonth) {
                  return (
                    <div
                      key={cell.key}
                      className="aspect-square flex items-center justify-center"
                      style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontWeight: 700,
                        color: 'rgba(17,17,17,0.2)',
                        fontSize: '11px',
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
                    className="aspect-square flex flex-col items-center justify-center transition-all duration-200 select-none active:scale-95"
                    style={{
                      border: '2px solid #111',
                      borderRadius: '6px',
                      background: cell.isToday ? '#E98A3A' : hasEvents ? '#F6E1CF' : '#FFFFFF',
                      cursor: hasEvents ? 'pointer' : 'default',
                      fontFamily: "'Space Grotesk', sans-serif",
                    }}
                  >
                    <span className="font-bold text-[11px] leading-none" style={{ color: '#111' }}>
                      {cell.day}
                    </span>
                    {cell.isToday ? (
                      <span className="text-[5px] font-bold leading-none mt-0.5" style={{ color: '#111' }}>
                        TODAY
                      </span>
                    ) : hasEvents ? (
                      <div className="w-1 h-1 rounded-full mt-0.5" style={{ background: '#E98A3A' }} />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Events list */}
        {events.length > 0 && (
          <div className="mt-4 space-y-2 pb-4">
            <h3
              className="text-sm font-bold uppercase px-1"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#111' }}
            >
              Events this month ({events.length})
            </h3>
            {events.map((ev) => {
              const d = new Date(ev.event_date);
              return (
                <div
                  key={ev.id}
                  onClick={() => {
                    setSelectedDayEvents([ev]);
                    setSelectedDay(d.getDate());
                    setDialogOpen(true);
                  }}
                  className="flex items-center gap-3 p-3 cursor-pointer active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                  style={{
                    background: '#FFFDF7',
                    border: '2px solid #111',
                    boxShadow: '3px 3px 0px #111',
                  }}
                >
                  <div
                    className="w-10 h-10 flex flex-col items-center justify-center shrink-0"
                    style={{ border: '2px solid #111', background: '#F6E1CF' }}
                  >
                    <span className="text-[8px] font-bold uppercase" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#111' }}>
                      {format(d, 'MMM')}
                    </span>
                    <span className="text-sm font-bold leading-none" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#111' }}>
                      {d.getDate()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold uppercase truncate" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#111' }}>
                      {ev.name}
                    </h4>
                    <p className="text-[10px] mt-0.5" style={{ color: '#6B7280', fontFamily: "'Space Grotesk', sans-serif" }}>
                      {ev.club_name} • {format(d, 'h:mm a')}
                    </p>
                  </div>
                  {ev.event_type && (
                    <span
                      className="text-[8px] font-bold uppercase px-1.5 py-0.5 shrink-0"
                      style={{ border: '1.5px solid #111', background: '#FFF8E1', fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      {ev.event_type}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {events.length === 0 && (
          <div
            className="mt-4 p-8 text-center"
            style={{
              background: '#FFFDF7',
              border: '2px solid #111',
              boxShadow: '4px 4px 0px #111',
            }}
          >
            <Calendar className="w-8 h-8 mx-auto mb-2" style={{ color: '#6B7280' }} />
            <p className="text-sm" style={{ color: '#6B7280', fontFamily: "'Space Grotesk', sans-serif" }}>
              No events this month
            </p>
          </div>
        )}
      </div>

      {/* Event Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className="max-w-[calc(100vw-32px)]"
          style={{
            border: '3px solid #111',
            borderRadius: '16px',
            boxShadow: '6px 6px 0px #111',
            background: '#FFFDF5',
          }}
        >
          <DialogHeader>
            <DialogTitle
              className="flex items-center gap-2 text-base"
              style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#111' }}
            >
              <Calendar className="w-4 h-4" style={{ color: '#E98A3A' }} />
              Events on {selectedDay} {MONTHS[month]}
            </DialogTitle>
            <DialogDescription>
              {selectedDayEvents.length} event{selectedDayEvents.length !== 1 ? 's' : ''}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {selectedDayEvents.map((ev) => (
              <div
                key={ev.id}
                className="p-3 space-y-2"
                style={{
                  border: '2px solid #111',
                  borderRadius: '10px',
                  boxShadow: '3px 3px 0px #111',
                  background: '#FFFFFF',
                }}
              >
                {ev.club_name && (
                  <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#E98A3A' }}>
                    {ev.club_name}
                  </p>
                )}
                <h4
                  className="font-bold text-sm"
                  style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#111' }}
                >
                  {ev.name}
                </h4>

                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-1.5" style={{ color: '#555' }}>
                    <Calendar className="w-3 h-3" style={{ color: '#E98A3A' }} />
                    <span>{format(new Date(ev.event_date), 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-1.5" style={{ color: '#555' }}>
                    <Clock className="w-3 h-3" style={{ color: '#E98A3A' }} />
                    <span>
                      {format(new Date(ev.event_date), 'h:mm a')}
                      {ev.end_date ? ` – ${format(new Date(ev.end_date), 'h:mm a')}` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {ev.event_type && (
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 flex items-center gap-0.5"
                      style={{ border: '1.5px solid #111', borderRadius: '4px', background: '#FFF8E1', color: '#111' }}
                    >
                      <Tag className="w-2.5 h-2.5" />
                      {ev.event_type}
                    </span>
                  )}
                  {ev.access_type && (
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 flex items-center gap-0.5"
                      style={{ border: '1.5px solid #111', borderRadius: '4px', background: '#FFFDF5', color: '#111' }}
                    >
                      <Shield className="w-2.5 h-2.5" />
                      {ev.access_type === 'open' ? 'Open' : 'Club Only'}
                    </span>
                  )}
                  {ev.attendance_given !== undefined && (
                    <span
                      className="text-[9px] font-bold px-1.5 py-0.5 flex items-center gap-0.5"
                      style={{
                        border: '1.5px solid #111',
                        borderRadius: '4px',
                        background: ev.attendance_given ? '#E8F5E9' : '#F5F5F5',
                        color: '#111',
                      }}
                    >
                      <CheckCircle className="w-2.5 h-2.5" />
                      {ev.attendance_given ? 'Att.' : 'No Att.'}
                    </span>
                  )}
                </div>

                {ev.description && (
                  <div style={{ borderTop: '2px solid #111', paddingTop: '6px' }}>
                    <p className="text-[11px] leading-relaxed" style={{ color: '#555' }}>
                      {ev.description}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {isMobile && <MobileBottomNav />}
    </div>
  );
};

export default MobileCalendar;
