import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, Tag, Shield, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useClub } from '@/contexts/ClubContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
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
  // Convert Sunday=0 to Monday-based: Mon=0, Tue=1, ..., Sun=6
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

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
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="px-6 py-4 flex justify-between items-center"
        style={{ borderBottom: '2px solid #111111', background: 'rgba(246,225,207,0.3)' }}
      >
        <h3
          className="text-lg uppercase tracking-wide"
          style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: '#111111', letterSpacing: '-0.5px' }}
        >
          Attendance Calendar
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-1.5 transition-all"
            style={{ border: '2px solid #111111', borderRadius: '6px', background: 'transparent' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#111111'; e.currentTarget.style.color = '#FFFFFF'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#111111'; }}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span
            className="text-sm px-4"
            style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: '#111111' }}
          >
            {MONTHS[month].toUpperCase()} {year}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 transition-all"
            style={{ border: '2px solid #111111', borderRadius: '6px', background: 'transparent' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#111111'; e.currentTarget.style.color = '#FFFFFF'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#111111'; }}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Body */}
      <div className="flex-1 p-5 flex flex-col">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-3 mb-3">
          {DAYS.map((d) => (
            <div
              key={d}
              className="text-center text-[10px] uppercase"
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: 'rgba(17,17,17,0.4)' }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-3 flex-1">
          {/* Previous month trailing days */}
          {Array.from({ length: startOffset }).map((_, i) => (
            <div
              key={`prev-${i}`}
              className="aspect-square flex items-center justify-center"
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, color: 'rgba(17,17,17,0.2)' }}
            >
              {daysInPrevMonth - startOffset + 1 + i}
            </div>
          ))}

          {/* Current month days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dayEvents = getEventsForDay(day);
            const hasEvents = dayEvents.length > 0;
            const todayDay = isToday(day);

            return (
              <div
                key={day}
                onClick={() => handleDayClick(day)}
                className="aspect-square flex flex-col items-center justify-center transition-all duration-200"
                style={{
                  border: '2px solid #111111',
                  borderRadius: '10px',
                  background: todayDay ? '#E98A3A' : hasEvents ? '#F6E1CF' : '#FFFFFF',
                  cursor: hasEvents ? 'pointer' : 'default',
                  fontFamily: "'Space Grotesk', sans-serif",
                }}
                onMouseEnter={(e) => {
                  if (hasEvents || todayDay) {
                    e.currentTarget.style.transform = 'translate(-2px, -2px)';
                    e.currentTarget.style.boxShadow = '4px 4px 0px #111111';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translate(0, 0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span className="font-bold text-sm" style={{ color: todayDay ? '#111111' : '#111111' }}>
                  {day}
                </span>
                {todayDay && (
                  <span className="text-[7px] font-bold mt-0.5" style={{ color: '#111111' }}>TODAY</span>
                )}
                {hasEvents && !todayDay && (
                  <div className="w-1.5 h-1.5 rounded-full mt-0.5" style={{ background: '#E98A3A' }} />
                )}
                {hasEvents && todayDay && (
                  <div className="w-1.5 h-1.5 rounded-full mt-0.5" style={{ background: '#111111' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Event Details Dialog */}
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
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#E98A3A' }}>{ev.club_name}</p>
                )}
                <h4 className="font-bold text-base" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#111111' }}>{ev.name}</h4>

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
                    <h5 className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#888' }}>Description</h5>
                    <p className="text-xs leading-relaxed" style={{ color: '#555' }}>{ev.description}</p>
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
