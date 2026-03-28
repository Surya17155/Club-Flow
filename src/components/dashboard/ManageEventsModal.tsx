import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useClub } from '@/contexts/ClubContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Clock, ChevronRight, ArrowLeft, Tag, Shield, Trash2, Download, UserPlus, MessageSquare, QrCode, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { exportAttendanceXLSX } from '@/utils/exportAttendance';
import ManualAttendanceModal from './ManualAttendanceModal';
import EventFeedbackModal from './EventFeedbackModal';
import { useDelegatedPowers } from '@/hooks/useDelegatedPowers';

interface Attendee {
  id: string;
  student_id: string;
  scanned_at: string;
  status: string;
  manually_added: boolean | null;
  full_name: string;
  roll_no: string | null;
  programme: string | null;
  section: string | null;
  year: string | null;
  phone: string | null;
}

interface ClubEvent {
  id: string;
  name: string;
  event_date: string;
  end_date: string | null;
  description: string | null;
  event_type: string;
  category: string;
  access_type: string;
  club_id: string;
  attendee_count: number;
  qr_token: string | null;
}

const ManageEventsModal = ({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) => {
  const { activeClub } = useClub();
  const { isPresident } = useDelegatedPowers();
  const [events, setEvents] = useState<ClubEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ClubEvent | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loadingAttendees, setLoadingAttendees] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ClubEvent | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [manualAttendanceOpen, setManualAttendanceOpen] = useState(false);
  const [feedbackStats, setFeedbackStats] = useState<{ avg: number; count: number } | null>(null);
  const [qrViewOpen, setQrViewOpen] = useState(false);

  const fetchEvents = async () => {
    if (!activeClub) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('events')
      .select('id, name, event_date, end_date, description, event_type, category, access_type, club_id, qr_token')
      .eq('club_id', activeClub.club_id)
      .order('event_date', { ascending: false });

    if (error) {
      toast.error(error.message?.includes('security') ? 'Permission denied.' : 'Failed to load events');
      setLoading(false);
      return;
    }

    if (data) {
      const eventIds = data.map((e: any) => e.id);
      const { data: attData } = await supabase
        .from('attendance')
        .select('event_id')
        .in('event_id', eventIds);

      const countMap: Record<string, number> = {};
      attData?.forEach((a: any) => {
        countMap[a.event_id] = (countMap[a.event_id] || 0) + 1;
      });

      setEvents(data.map((e: any) => ({ ...e, attendee_count: countMap[e.id] || 0 })));
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!open || !activeClub) return;
    setSelectedEvent(null);
    fetchEvents();
  }, [open, activeClub?.club_id]);

  const viewAttendance = async (event: ClubEvent) => {
    setSelectedEvent(event);
    setLoadingAttendees(true);
    const { data, error } = await supabase
      .from('attendance')
      .select('id, student_id, scanned_at, status, manually_added')
      .eq('event_id', event.id)
      .order('scanned_at', { ascending: true });

    if (error) {
      toast.error('Failed to load attendance records');
      setLoadingAttendees(false);
      return;
    }

    if (data && data.length > 0) {
      const studentIds = data.map((a: any) => a.student_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, roll_no, programme, section, year, phone')
        .in('user_id', studentIds);

      const profileMap: Record<string, any> = {};
      profiles?.forEach((p: any) => { profileMap[p.user_id] = p; });

      setAttendees(data.map((a: any) => ({
        ...a,
        full_name: profileMap[a.student_id]?.full_name || 'Unknown',
        roll_no: profileMap[a.student_id]?.roll_no || null,
        programme: profileMap[a.student_id]?.programme || null,
        section: profileMap[a.student_id]?.section || null,
        year: profileMap[a.student_id]?.year || null,
        phone: profileMap[a.student_id]?.phone || null,
      })));
    } else {
      setAttendees([]);
    }

    // Fetch feedback stats
    const { data: fbData } = await supabase
      .from('event_feedback')
      .select('rating')
      .eq('event_id', event.id);
    if (fbData && fbData.length > 0) {
      const avg = fbData.reduce((s, f) => s + f.rating, 0) / fbData.length;
      setFeedbackStats({ avg: Math.round(avg * 10) / 10, count: fbData.length });
    } else {
      setFeedbackStats(null);
    }

    setLoadingAttendees(false);
  };

  const handleDeleteEvent = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    await supabase.from('attendance').delete().eq('event_id', deleteTarget.id);
    await supabase.from('event_participants').delete().eq('event_id', deleteTarget.id);
    await supabase.from('event_feedback').delete().eq('event_id', deleteTarget.id);
    const { error } = await supabase.from('events').delete().eq('id', deleteTarget.id);
    if (error) {
      toast.error('Failed to delete event');
    } else {
      toast.success(`"${deleteTarget.name}" deleted successfully`);
      setEvents(prev => prev.filter(e => e.id !== deleteTarget.id));
      if (selectedEvent?.id === deleteTarget.id) setSelectedEvent(null);
    }
    setDeleteTarget(null);
    setDeleting(false);
  };

  const handleExport = () => {
    if (!selectedEvent || attendees.length === 0) return;
    exportAttendanceXLSX(attendees, selectedEvent.name, selectedEvent.event_date);
    toast.success('Attendance exported to XLSX!');
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  const formatTime = (d: string) => new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[calc(100vw-2rem)] max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              {selectedEvent ? (
                <>
                  <button onClick={() => setSelectedEvent(null)} className="p-1 rounded-lg hover:bg-accent transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  {selectedEvent.name} — Attendance
                </>
              ) : (
                <>Manage Events — {activeClub?.club_name}</>
              )}
            </DialogTitle>
          </DialogHeader>

          {!selectedEvent ? (
            <div className="space-y-3 pt-2">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : events.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-8">No events found for this club</p>
              ) : (
                events.map(event => {
                  const d = new Date(event.event_date);
                  const isPast = d < new Date();
                  return (
                    <div
                      key={event.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-xl border border-border/50 bg-white/40 hover:bg-white/70 cursor-pointer transition-colors group"
                      onClick={() => viewAttendance(event)}
                    >
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className="rounded-lg shadow-sm w-10 h-10 sm:w-12 sm:h-12 flex flex-col items-center justify-center border border-border bg-white shrink-0">
                          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                            {d.toLocaleString('default', { month: 'short' }).toUpperCase()}
                          </span>
                          <span className="text-sm sm:text-lg font-bold leading-none text-foreground">{d.getDate()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">{event.name}</h4>
                          <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatTime(event.event_date)}{event.end_date ? ` – ${formatTime(event.end_date)}` : ''}</span>
                            <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{event.event_type}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 shrink-0 pl-13 sm:pl-0">
                        <div className="text-center">
                          <p className="text-sm sm:text-lg font-bold text-foreground">{event.attendee_count}</p>
                          <p className="text-[9px] sm:text-[10px] text-muted-foreground">Attended</p>
                        </div>
                        <Badge variant={isPast ? 'secondary' : 'default'} className="text-[9px] sm:text-[10px]">
                          {isPast ? 'Past' : 'Upcoming'}
                        </Badge>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(event); }}
                          className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors sm:opacity-0 sm:group-hover:opacity-100"
                          title="Delete event"
                        >
                          <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            <div className="pt-2">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary" className="text-xs"><Calendar className="w-3 h-3 mr-1" />{formatDate(selectedEvent.event_date)}</Badge>
                <Badge variant="outline" className="text-xs"><Clock className="w-3 h-3 mr-1" />{formatTime(selectedEvent.event_date)}{selectedEvent.end_date ? ` – ${formatTime(selectedEvent.end_date)}` : ''}</Badge>
                <Badge variant="outline" className="text-xs"><Shield className="w-3 h-3 mr-1" />{selectedEvent.access_type}</Badge>
                <Badge variant="outline" className="text-xs"><Users className="w-3 h-3 mr-1" />{attendees.length} attended</Badge>
                {feedbackStats && (
                  <Badge variant="outline" className="text-xs"><MessageSquare className="w-3 h-3 mr-1" />{feedbackStats.avg}★ ({feedbackStats.count})</Badge>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedEvent.qr_token && (
                  <button
                    onClick={() => setQrViewOpen(true)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <QrCode className="w-3.5 h-3.5" /> View QR Code
                  </button>
                )}
                {attendees.length > 0 && (
                  <button
                    onClick={handleExport}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors gradient-gold text-primary-foreground shadow-gold"
                  >
                    <Download className="w-3.5 h-3.5" /> Export XLSX
                  </button>
                )}
                {isPresident && (
                  <button
                    onClick={() => setManualAttendanceOpen(true)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors bg-accent hover:bg-accent/80 text-accent-foreground"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Add Manually
                  </button>
                )}
              </div>

              {loadingAttendees ? (
                <div className="flex justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : attendees.length === 0 ? (
                <p className="text-sm text-muted-foreground italic text-center py-8">No attendance records for this event</p>
              ) : (
                <div className="border border-border/50 rounded-xl overflow-x-auto">
                  <table className="w-full text-sm min-w-[600px]">
                    <thead>
                      <tr className="bg-muted/50 text-muted-foreground text-[10px] sm:text-xs uppercase tracking-wider">
                        <th className="text-left px-2 sm:px-4 py-2">#</th>
                        <th className="text-left px-2 sm:px-4 py-2">Name</th>
                        <th className="text-left px-2 sm:px-4 py-2">Roll No</th>
                        <th className="text-left px-2 sm:px-4 py-2">Phone</th>
                        <th className="text-left px-2 sm:px-4 py-2">Programme</th>
                        <th className="text-left px-2 sm:px-4 py-2">Year</th>
                        <th className="text-left px-2 sm:px-4 py-2">Section</th>
                        <th className="text-left px-2 sm:px-4 py-2">Scan Time</th>
                        <th className="text-left px-2 sm:px-4 py-2">Method</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendees.map((a, i) => (
                        <tr key={a.id} className="border-t border-border/30 hover:bg-white/50">
                          <td className="px-2 sm:px-4 py-2 text-muted-foreground text-xs">{i + 1}</td>
                          <td className="px-2 sm:px-4 py-2 font-medium text-foreground text-xs sm:text-sm whitespace-nowrap">{a.full_name}</td>
                          <td className="px-2 sm:px-4 py-2 text-muted-foreground text-xs">{a.roll_no || '—'}</td>
                          <td className="px-2 sm:px-4 py-2 text-muted-foreground text-xs">{a.phone || '—'}</td>
                          <td className="px-2 sm:px-4 py-2 text-muted-foreground text-xs">{a.programme || '—'}</td>
                          <td className="px-2 sm:px-4 py-2 text-muted-foreground text-xs">{a.year || '—'}</td>
                          <td className="px-2 sm:px-4 py-2 text-muted-foreground text-xs">{a.section || '—'}</td>
                          <td className="px-2 sm:px-4 py-2 text-muted-foreground text-xs whitespace-nowrap">{formatTime(a.scanned_at)}</td>
                          <td className="px-2 sm:px-4 py-2">
                            <Badge variant={a.manually_added ? 'outline' : 'secondary'} className="text-[9px] sm:text-[10px]">
                              {a.manually_added ? 'Manual' : 'QR'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>"{deleteTarget?.name}"</strong>? This will also remove all attendance records and feedback. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEvent} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* QR Code View Dialog */}
      {selectedEvent?.qr_token && (
        <Dialog open={qrViewOpen} onOpenChange={setQrViewOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-center">QR Code — {selectedEvent.name}</DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="bg-white p-4 rounded-xl shadow-sm" id="qr-code-container">
                <QRCodeSVG
                  value={`${window.location.origin}/mark-attendance/${selectedEvent.qr_token}`}
                  size={220}
                  level="H"
                />
              </div>
              <p className="text-xs text-muted-foreground text-center max-w-[250px]">
                Scan this QR code to mark attendance for this event
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    const svg = document.querySelector('#qr-code-container svg');
                    if (!svg) return;
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const img = new Image();
                    img.onload = () => {
                      canvas.width = img.width * 2;
                      canvas.height = img.height * 2;
                      ctx!.fillStyle = 'white';
                      ctx!.fillRect(0, 0, canvas.width, canvas.height);
                      ctx!.drawImage(img, 0, 0, canvas.width, canvas.height);
                      const a = document.createElement('a');
                      a.download = `${selectedEvent.name}-QR.png`;
                      a.href = canvas.toDataURL('image/png');
                      a.click();
                      toast.success('QR code downloaded!');
                    };
                    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
                  }}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors gradient-gold text-primary-foreground shadow-gold"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
                <button
                  onClick={async () => {
                    const url = `${window.location.origin}/mark-attendance/${selectedEvent.qr_token}`;
                    if (navigator.share) {
                      try {
                        await navigator.share({ title: `${selectedEvent.name} - Attendance QR`, url });
                        toast.success('Shared successfully!');
                      } catch { /* user cancelled */ }
                    } else {
                      await navigator.clipboard.writeText(url);
                      toast.success('Attendance link copied!');
                    }
                  }}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors bg-accent hover:bg-accent/80 text-accent-foreground"
                >
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {selectedEvent && (
        <ManualAttendanceModal
          open={manualAttendanceOpen}
          onOpenChange={setManualAttendanceOpen}
          eventId={selectedEvent.id}
          eventName={selectedEvent.name}
          clubId={selectedEvent.club_id}
          accessType={selectedEvent.access_type}
          onAdded={() => viewAttendance(selectedEvent)}
        />
      )}
    </>
  );
};

export default ManageEventsModal;
