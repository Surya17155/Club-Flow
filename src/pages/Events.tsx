import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Eye, QrCode, Trash2, Plus, MessageSquare, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useClub } from '@/contexts/ClubContext';
import { useDelegatedPowers } from '@/hooks/useDelegatedPowers';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import EventFeedbackModal from '@/components/dashboard/EventFeedbackModal';

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

const Events = () => {
  const [filter, setFilter] = useState('all');
  const { toast } = useToast();
  const { user } = useAuth();
  const { activeClub } = useClub();
  const { hasPower } = useDelegatedPowers();
  const navigate = useNavigate();

  // Read viewMode from localStorage (set by AdminDashboard)
  const [viewMode, setViewMode] = useState<'personal' | 'club'>(() => {
    return (localStorage.getItem('dashboardViewMode') as 'personal' | 'club') || 'personal';
  });

  // Listen for storage changes
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
      // Personal mode: show all events from today onwards
      query = query.gte('event_date', new Date().toISOString());
    } else if (viewMode === 'club' && activeClub) {
      // Club mode: show only this club's events
      query = query.eq('club_id', activeClub.club_id);
    }

    const { data, error } = await query;

    if (!error && data) {
      setEvents(data as any);
      const ids = data.map((e: any) => e.id);
      if (ids.length > 0) {
        const { data: attData } = await supabase
          .from('attendance')
          .select('event_id')
          .in('event_id', ids);
        const counts: Record<string, number> = {};
        (attData ?? []).forEach((a: any) => {
          counts[a.event_id] = (counts[a.event_id] || 0) + 1;
        });
        setAttendanceCounts(counts);
      }
    }
    setLoading(false);
  };

  useEffect(() => { fetchEvents(); }, [viewMode, activeClub?.club_id]);

  const handleDelete = async (eventId: string) => {
    const { error } = await supabase.from('events').delete().eq('id', eventId);
    if (error) {
      toast({ title: 'Error', description: 'Failed to delete event. You may not have permission.', variant: 'destructive' });
    } else {
      toast({ title: 'Event deleted' });
      setEvents(prev => prev.filter(e => e.id !== eventId));
    }
  };

  const getStatus = (event: EventRow) => {
    return new Date(event.event_date) > new Date() ? 'upcoming' : 'completed';
  };

  const filteredEvents = events.filter(e => filter === 'all' || getStatus(e) === filter);

  // Show create button only in club mode AND user has permission
  const canCreateEvent = viewMode === 'club' && hasPower('create_event');

  // Show delete only for authorized users in club mode
  const canManageEvents = viewMode === 'club' && hasPower('create_event');

  return (
    <DashboardLayout>
      <div className="space-y-4 sm:space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-foreground">
              {viewMode === 'personal' ? 'All College Events' : `${activeClub?.club_name || 'Club'} Events`}
            </h1>
            <p className="text-sm text-muted-foreground">
              {viewMode === 'personal' ? 'Upcoming events across all clubs' : 'Events for your club'}
            </p>
          </div>
          {canCreateEvent && (
            <Button onClick={() => navigate('/create-event')} className="gradient-gold text-primary-foreground shadow-gold hover:opacity-90 w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-1" /> Create Event
            </Button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto">
          {['all', 'upcoming', 'completed'].map(f => (
            <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm"
              onClick={() => setFilter(f)}
              className={filter === f ? 'gradient-gold text-primary-foreground' : ''}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No events found.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvents.map(event => {
              const status = getStatus(event);
              const d = new Date(event.event_date);
              const isPast = status === 'completed';
              return (
                <Card key={event.id} className="shadow-card border-border/50 hover:shadow-elevated transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <CardTitle className="text-base font-display truncate">{event.name}</CardTitle>
                        <div className="flex gap-1.5 mt-1.5 flex-wrap">
                          <Badge variant="outline" className="text-xs">{event.event_type}</Badge>
                          <Badge className={`text-xs ${event.category === 'Mandatory' ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-success/10 text-success border-success/20'}`} variant="outline">
                            {event.category}
                          </Badge>
                          {event.attendance_given && (
                            <Badge className="text-xs bg-success/15 text-success border-success/20" variant="outline">
                              <CheckCircle className="w-3 h-3 mr-0.5" /> Attendance
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Badge variant={status === 'upcoming' ? 'default' : 'secondary'} className={`shrink-0 ${status === 'upcoming' ? 'gradient-gold text-primary-foreground border-0' : ''}`}>
                        {status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>{d.toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          {d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                          {event.end_date && (
                            <> – {new Date(event.end_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>{attendanceCounts[event.id] || 0} attendees</span>
                      </div>
                      {(event as any).clubs?.name && (
                        <div className="text-xs text-muted-foreground">
                          Club: {(event as any).clubs.name}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-4 flex-wrap">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => { setSelectedEvent(event); setViewDialogOpen(true); }}>
                        <Eye className="w-3.5 h-3.5 mr-1" /> View
                      </Button>
                      {isPast && (
                        <Button variant="outline" size="sm" onClick={() => { setFeedbackEvent({ id: event.id, name: event.name }); setFeedbackOpen(true); }}>
                          <MessageSquare className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {event.qr_token && (
                        <Button variant="outline" size="sm" onClick={() => { setSelectedEvent(event); setQrDialogOpen(true); }}>
                          <QrCode className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {canManageEvents && (
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(event.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* View Event Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.name}</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-3 text-sm">
              <p><strong>Type:</strong> {selectedEvent.event_type}</p>
              <p><strong>Category:</strong> {selectedEvent.category}</p>
              <p><strong>Access:</strong> {selectedEvent.access_type}</p>
              <p><strong>Start:</strong> {new Date(selectedEvent.event_date).toLocaleString()}</p>
              {selectedEvent.end_date && (
                <p><strong>End:</strong> {new Date(selectedEvent.end_date).toLocaleString()}</p>
              )}
              <p><strong>Attendees:</strong> {attendanceCounts[selectedEvent.id] || 0}</p>
              {selectedEvent.description && <p><strong>Description:</strong> {selectedEvent.description}</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* QR Dialog */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="sm:max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>QR Code — {selectedEvent?.name}</DialogTitle>
          </DialogHeader>
          {selectedEvent?.qr_token && (
            <div className="flex justify-center py-4">
              <QRCodeSVG value={`${window.location.origin}/mark-attendance/${selectedEvent.qr_token}`} size={200} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Feedback Modal */}
      {feedbackEvent && (
        <EventFeedbackModal
          open={feedbackOpen}
          onOpenChange={setFeedbackOpen}
          eventId={feedbackEvent.id}
          eventName={feedbackEvent.name}
        />
      )}
    </DashboardLayout>
  );
};

export default Events;
