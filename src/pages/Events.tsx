import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Eye, QrCode, Trash2, Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useClub } from '@/contexts/ClubContext';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

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
  clubs?: { name: string } | null;
}

const Events = () => {
  const [filter, setFilter] = useState('all');
  const { toast } = useToast();
  const { user } = useAuth();
  const { activeClub } = useClub();
  const navigate = useNavigate();

  const [events, setEvents] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<EventRow | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [attendanceCounts, setAttendanceCounts] = useState<Record<string, number>>({});

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('id, name, event_type, category, event_date, end_date, access_type, description, qr_token, club_id, clubs(name)')
      .order('event_date', { ascending: false });

    if (!error && data) {
      setEvents(data as any);
      // Fetch attendance counts
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

  useEffect(() => { fetchEvents(); }, []);

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

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Events</h1>
            <p className="text-sm text-muted-foreground">Manage and view all events</p>
          </div>
          <Button onClick={() => navigate('/create-event')} className="gradient-gold text-primary-foreground shadow-gold hover:opacity-90">
            <Plus className="w-4 h-4 mr-1" /> Create Event
          </Button>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredEvents.map(event => {
              const status = getStatus(event);
              const d = new Date(event.event_date);
              return (
                <Card key={event.id} className="shadow-card border-border/50 hover:shadow-elevated transition-shadow">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-base font-display">{event.name}</CardTitle>
                        <div className="flex gap-1.5 mt-1.5">
                          <Badge variant="outline" className="text-xs">{event.event_type}</Badge>
                          <Badge className={`text-xs ${event.category === 'Mandatory' ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-success/10 text-success border-success/20'}`} variant="outline">
                            {event.category}
                          </Badge>
                        </div>
                      </div>
                      <Badge variant={status === 'upcoming' ? 'default' : 'secondary'} className={status === 'upcoming' ? 'gradient-gold text-primary-foreground border-0' : ''}>
                        {status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{d.toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" />
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
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" className="flex-1" onClick={() => { setSelectedEvent(event); setViewDialogOpen(true); }}>
                        <Eye className="w-3.5 h-3.5 mr-1" /> View
                      </Button>
                      {event.qr_token && (
                        <Button variant="outline" size="sm" onClick={() => { setSelectedEvent(event); setQrDialogOpen(true); }}>
                          <QrCode className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(event.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
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
              <p><strong>Date:</strong> {new Date(selectedEvent.event_date).toLocaleString()}</p>
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
    </DashboardLayout>
  );
};

export default Events;
