import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Eye, QrCode, Trash2, Plus, MessageSquare, CheckCircle, Users, Download, FileText, FileSpreadsheet } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useClub } from '@/contexts/ClubContext';
import { useDelegatedPowers } from '@/hooks/useDelegatedPowers';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import EventFeedbackModal from '@/components/dashboard/EventFeedbackModal';
import { useDesign } from '@/contexts/DesignContext';
import { exportAttendanceXLSX } from '@/utils/exportAttendance';

interface AttendeeDetail {
  full_name: string;
  roll_no: string | null;
  phone: string | null;
  programme: string | null;
  section: string | null;
  year: string | null;
  class_coordinator: string | null;
  scanned_at: string;
  status: string;
  manually_added: boolean | null;
  email: string | null;
}

interface EventRow {
  id: string;
  name: string;
  event_type: string;
  category: string;
  event_date: string;
  end_date: string | null;
  access_type: string;
  description: string | null;
  qr_token: string | null;
  club_id: string;
  attendance_given?: boolean;
  clubs?: { name: string } | null;
}

const NEO = {
  card: {
    background: '#FFFFFF',
    border: '2px solid #111111',
    borderRadius: '12px',
    boxShadow: '4px 4px 0px #111111',
  } as React.CSSProperties,
  cardHover: {
    transform: 'translate(-2px, -2px)',
    boxShadow: '6px 6px 0px #111111',
  } as React.CSSProperties,
  cardReset: {
    transform: 'translate(0, 0)',
    boxShadow: '4px 4px 0px #111111',
  } as React.CSSProperties,
  font: "'Space Grotesk', sans-serif",
  btnPrimary: {
    background: '#E98A3A',
    color: '#111111',
    border: '2px solid #111111',
    borderRadius: '10px',
    boxShadow: '3px 3px 0px #111111',
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
  } as React.CSSProperties,
  btnBlack: {
    background: '#111111',
    color: '#FFFDF5',
    border: '2px solid #111111',
    borderRadius: '10px',
    boxShadow: '3px 3px 0px #111111',
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
  } as React.CSSProperties,
  btnOutline: {
    background: '#FFFDF5',
    color: '#111111',
    border: '2px solid #111111',
    borderRadius: '10px',
    boxShadow: '2px 2px 0px #111111',
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 600,
  } as React.CSSProperties,
  badge: {
    border: '2px solid #111',
    borderRadius: '6px',
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
  } as React.CSSProperties,
};

const hoverIn = (e: React.MouseEvent<HTMLElement>) => {
  e.currentTarget.style.transform = 'translate(-2px, -2px)';
  e.currentTarget.style.boxShadow = '6px 6px 0px #111111';
};
const hoverOut = (e: React.MouseEvent<HTMLElement>) => {
  e.currentTarget.style.transform = 'translate(0, 0)';
  e.currentTarget.style.boxShadow = '4px 4px 0px #111111';
};
const btnHoverIn = (e: React.MouseEvent<HTMLElement>) => {
  e.currentTarget.style.transform = 'translate(-1px, -1px)';
  e.currentTarget.style.boxShadow = '4px 4px 0px #111111';
};
const btnHoverOut = (e: React.MouseEvent<HTMLElement>) => {
  e.currentTarget.style.transform = 'translate(0, 0)';
  e.currentTarget.style.boxShadow = '3px 3px 0px #111111';
};

const Events = () => {
  const [filter, setFilter] = useState('all');
  const { toast } = useToast();
  const { user } = useAuth();
  const { activeClub } = useClub();
  const { hasPower } = useDelegatedPowers();
  const navigate = useNavigate();
  const { activeDesign } = useDesign();
  const isNeo = activeDesign === 'design-2';

  const [viewMode, setViewMode] = useState<'personal' | 'club'>(() => {
    return (localStorage.getItem('dashboardViewMode') as 'personal' | 'club') || 'personal';
  });

  useEffect(() => {
    const handler = () => {
      setViewMode((localStorage.getItem('dashboardViewMode') as 'personal' | 'club') || 'personal');
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventRow | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [attendanceCounts, setAttendanceCounts] = useState<Record<string, number>>({});
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackEvent, setFeedbackEvent] = useState<{ id: string; name: string } | null>(null);

  const fetchEvents = async () => {
    setLoading(true);
    let query = supabase
      .from('events')
      .select('id, name, event_type, category, event_date, end_date, access_type, description, qr_token, club_id, attendance_given, clubs(name)')
      .order('event_date', { ascending: true });

    if (viewMode === 'personal') {
      query = query.gte('event_date', new Date().toISOString());
    } else if (viewMode === 'club' && activeClub) {
      query = query.eq('club_id', activeClub.club_id);
    }

    const { data, error } = await query;
    if (!error && data) {
      setEvents(data as any);
      const ids = data.map((e: any) => e.id);
      if (ids.length > 0) {
        const { data: attData } = await supabase.from('attendance').select('event_id').in('event_id', ids);
        const counts: Record<string, number> = {};
        (attData ?? []).forEach((a: any) => { counts[a.event_id] = (counts[a.event_id] || 0) + 1; });
        setAttendanceCounts(counts);
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, [viewMode, activeClub?.club_id]);

  const handleDelete = async (eventId: string) => {
    const { error } = await supabase.from('events').delete().eq('id', eventId);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete event.', variant: 'destructive' });
    } else {
      toast({ title: 'Event deleted' });
      setEvents(prev => prev.filter(e => e.id !== eventId));
    }
  };

  const getStatus = (event: EventRow) => new Date(event.event_date) > new Date() ? 'upcoming' : 'completed';
  const filteredEvents = events.filter(e => filter === 'all' || getStatus(e) === filter);
  const canCreateEvent = viewMode === 'club' && hasPower('create_event');
  const canManageEvents = viewMode === 'club' && hasPower('create_event');

  const filterBtns = ['all', 'upcoming', 'completed'];

  return (
    <DashboardLayout>
      <div className="space-y-5 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-3">
          <div className="text-center md:text-left">
            <h1
              className="text-xl sm:text-2xl font-bold"
              style={isNeo ? { fontFamily: NEO.font, color: '#111111', letterSpacing: '-0.02em' } : {}}
            >
              {viewMode === 'personal' ? 'All College Events' : `${activeClub?.club_name || 'Club'} Events`}
            </h1>
            <p className="text-sm" style={{ color: isNeo ? '#888' : undefined }}>
              {viewMode === 'personal' ? 'Upcoming events across all clubs' : 'Events for your club'}
            </p>
          </div>
          {canCreateEvent && (
            <button
              onClick={() => navigate('/create-event')}
              className="flex items-center gap-2 px-5 py-2.5 text-sm transition-all"
              style={isNeo ? NEO.btnPrimary : { background: 'var(--primary)', color: 'white', borderRadius: '9999px' }}
              onMouseEnter={isNeo ? btnHoverIn : undefined}
              onMouseLeave={isNeo ? btnHoverOut : undefined}
            >
              <Plus className="w-4 h-4" /> Create Event
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          {filterBtns.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-4 py-2 text-sm transition-all"
              style={isNeo ? {
                ...(filter === f ? NEO.btnPrimary : NEO.btnOutline),
                fontSize: '13px',
              } : {
                background: filter === f ? 'var(--primary)' : 'transparent',
                color: filter === f ? 'white' : 'var(--foreground)',
                borderRadius: '8px',
                border: filter === f ? 'none' : '1px solid var(--border)',
              }}
              onMouseEnter={isNeo ? (e) => { e.currentTarget.style.transform = 'translate(-1px, -1px)'; } : undefined}
              onMouseLeave={isNeo ? (e) => { e.currentTarget.style.transform = 'translate(0, 0)'; } : undefined}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-[3px] border-[#E98A3A]/30 border-t-[#E98A3A] rounded-full animate-spin" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <p className="text-center py-12" style={{ color: '#888', fontFamily: isNeo ? NEO.font : undefined }}>No events found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredEvents.map(event => {
              const status = getStatus(event);
              const d = new Date(event.event_date);
              const isPast = status === 'completed';

              if (!isNeo) {
                return (
                  <Card key={event.id} className="shadow-card border-border/50 hover:shadow-elevated transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <CardTitle className="text-base font-display truncate">{event.name}</CardTitle>
                          <div className="flex gap-1.5 mt-1.5 flex-wrap">
                            <Badge variant="outline" className="text-xs">{event.event_type}</Badge>
                            <Badge className={`text-xs ${event.category === 'Mandatory' ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-success/10 text-success border-success/20'}`} variant="outline">{event.category}</Badge>
                            {event.attendance_given && <Badge className="text-xs bg-success/15 text-success border-success/20" variant="outline"><CheckCircle className="w-3 h-3 mr-0.5" /> Attendance</Badge>}
                          </div>
                        </div>
                        <Badge variant={status === 'upcoming' ? 'default' : 'secondary'} className={`shrink-0 ${status === 'upcoming' ? 'gradient-gold text-primary-foreground border-0' : ''}`}>{status}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 shrink-0" /><span>{d.toLocaleDateString()}</span></div>
                        <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5 shrink-0" /><span>{d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}{event.end_date && <> – {new Date(event.end_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</>}</span></div>
                        <div className="flex items-center gap-2"><span>{attendanceCounts[event.id] || 0} attendees</span></div>
                        {(event as any).clubs?.name && <div className="text-xs text-muted-foreground">Club: {(event as any).clubs.name}</div>}
                      </div>
                      <div className="flex gap-2 mt-4 flex-wrap">
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => { setSelectedEvent(event); setViewDialogOpen(true); }}><Eye className="w-3.5 h-3.5 mr-1" /> View</Button>
                        {isPast && <Button variant="outline" size="sm" onClick={() => { setFeedbackEvent({ id: event.id, name: event.name }); setFeedbackOpen(true); }}><MessageSquare className="w-3.5 h-3.5" /></Button>}
                        {canManageEvents && event.qr_token && <Button variant="outline" size="sm" onClick={() => { setSelectedEvent(event); setQrDialogOpen(true); }}><QrCode className="w-3.5 h-3.5" /></Button>}
                        {canManageEvents && <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(event.id)}><Trash2 className="w-3.5 h-3.5" /></Button>}
                      </div>
                    </CardContent>
                  </Card>
                );
              }

              // Neo Brutalism card
              return (
                <div
                  key={event.id}
                  className="flex flex-col p-5 transition-all duration-200"
                  style={NEO.card}
                  onMouseEnter={hoverIn}
                  onMouseLeave={hoverOut}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-bold truncate" style={{ fontFamily: NEO.font, color: '#111' }}>{event.name}</h3>
                      <div className="flex gap-1.5 mt-1.5 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5" style={{ ...NEO.badge, background: '#FFF8E1' }}>{event.event_type}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5" style={{ ...NEO.badge, background: event.category === 'Mandatory' ? '#FFEBEE' : '#E8F5E9' }}>{event.category}</span>
                        {event.attendance_given && (
                          <span className="text-[10px] font-bold px-2 py-0.5 flex items-center gap-1" style={{ ...NEO.badge, background: '#E8F5E9' }}>
                            <CheckCircle className="w-3 h-3" /> Attendance
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className="text-[10px] font-bold px-2.5 py-1 shrink-0 uppercase"
                      style={{
                        ...NEO.badge,
                        background: status === 'upcoming' ? '#E98A3A' : '#F5F5F5',
                        color: '#111',
                      }}
                    >
                      {status}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-sm mb-3" style={{ color: '#555' }}>
                    <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5" style={{ color: '#E98A3A' }} /><span>{d.toLocaleDateString()}</span></div>
                    <div className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" style={{ color: '#E98A3A' }} /><span>{d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}{event.end_date && ` – ${new Date(event.end_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}</span></div>
                    <p className="text-xs" style={{ color: '#888' }}>{attendanceCounts[event.id] || 0} attendees</p>
                    {(event as any).clubs?.name && <p className="text-xs" style={{ color: '#888' }}>Club: {(event as any).clubs.name}</p>}
                  </div>

                  <div className="flex gap-2 mt-auto flex-wrap">
                    <button
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs transition-all"
                      style={NEO.btnOutline}
                      onClick={() => { setSelectedEvent(event); setViewDialogOpen(true); }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate(-1px, -1px)'; e.currentTarget.style.boxShadow = '3px 3px 0px #111'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translate(0,0)'; e.currentTarget.style.boxShadow = '2px 2px 0px #111'; }}
                    >
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    {isPast && (
                      <button
                        className="px-3 py-2 text-xs transition-all"
                        style={NEO.btnOutline}
                        onClick={() => { setFeedbackEvent({ id: event.id, name: event.name }); setFeedbackOpen(true); }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate(-1px, -1px)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translate(0,0)'; }}
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {canManageEvents && event.qr_token && (
                      <button
                        className="px-3 py-2 text-xs transition-all"
                        style={NEO.btnOutline}
                        onClick={() => { setSelectedEvent(event); setQrDialogOpen(true); }}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate(-1px, -1px)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translate(0,0)'; }}
                      >
                        <QrCode className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {canManageEvents && (
                      <button
                        className="px-3 py-2 text-xs transition-all"
                        style={{ ...NEO.btnOutline, color: '#DC2626' }}
                        onClick={() => handleDelete(event.id)}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate(-1px, -1px)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translate(0,0)'; }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* View Event Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent
          className="sm:max-w-md"
          style={isNeo ? { border: '3px solid #111', borderRadius: '16px', boxShadow: '6px 6px 0px #111', background: '#FFFDF5' } : {}}
        >
          <DialogHeader>
            {selectedEvent && (selectedEvent as any).clubs?.name && (
              <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#E98A3A' }}>{(selectedEvent as any).clubs.name}</p>
            )}
            <DialogTitle style={isNeo ? { fontFamily: NEO.font } : {}}>{selectedEvent?.name}</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-3 text-sm">
              <p><strong>Date:</strong> {new Date(selectedEvent.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
              <p><strong>Time:</strong> {new Date(selectedEvent.event_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}{selectedEvent.end_date ? ` – ${new Date(selectedEvent.end_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` : ''}</p>
              {selectedEvent.description && (
                <div style={isNeo ? { borderTop: '2px solid #111', paddingTop: '12px' } : { borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                  <p style={{ color: '#555' }}>{selectedEvent.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* QR Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent
          className="sm:max-w-sm text-center"
          style={isNeo ? { border: '3px solid #111', borderRadius: '16px', boxShadow: '6px 6px 0px #111', background: '#FFFDF5' } : {}}
        >
          <DialogHeader>
            <DialogTitle style={isNeo ? { fontFamily: NEO.font } : {}}>QR Code — {selectedEvent?.name}</DialogTitle>
          </DialogHeader>
          {selectedEvent?.qr_token && (
            <div className="flex justify-center py-4">
              <QRCodeSVG value={`${window.location.origin}/mark-attendance/${selectedEvent.qr_token}`} size={200} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {feedbackEvent && (
        <EventFeedbackModal open={feedbackOpen} onOpenChange={setFeedbackOpen} eventId={feedbackEvent.id} eventName={feedbackEvent.name} />
      )}
    </DashboardLayout>
  );
};

export default Events;
