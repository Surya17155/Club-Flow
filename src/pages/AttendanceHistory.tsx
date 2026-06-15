import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePersonalStats } from '@/hooks/usePersonalStats';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';
import { Calendar, Clock, Users, Tag, Shield, CheckCircle, MessageSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { format } from 'date-fns';
import EventFeedbackModal from '@/components/dashboard/EventFeedbackModal';

interface AttendanceRecord {
  id: string;
  event_id: string;
  status: string;
  scanned_at: string;
  event_name: string;
  event_date: string;
  club_name: string;
  event_type: string;
  attendance_given: boolean;
}

export default function AttendanceHistory() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { stats, loading } = usePersonalStats();
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | null>(null);
  const [feedbackEvent, setFeedbackEvent] = useState<{ id: string; name: string } | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const viewMode = (localStorage.getItem('dashboardViewMode') as 'personal' | 'club') || 'personal';
  const isPersonalMode = viewMode === 'personal';

  const records = stats.attendanceRecords;

  return (
    <div className="min-h-screen" style={{ background: '#F4EFE7' }}>

      {/* Header */}
      <div className="pt-12 px-5 pb-4 text-center">
        <h1 className="text-2xl font-black" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#111' }}>
          Attendance History
        </h1>
        <p className="text-sm font-semibold mt-1" style={{ color: '#888', fontFamily: "'Space Grotesk', sans-serif" }}>
          {records.length} event{records.length !== 1 ? 's' : ''} attended
        </p>
      </div>

      {/* Content */}
      <div className="px-4 pb-28 space-y-3">
        {records.length === 0 ? (
          <div className="text-center py-20">
            <Calendar className="w-12 h-12 mx-auto mb-3" style={{ color: '#ccc' }} />
            <p className="text-sm font-bold" style={{ color: '#888', fontFamily: "'Space Grotesk', sans-serif" }}>
              No attendance records yet
            </p>
          </div>
        ) : (
          records.map((record) => {
            const eventDate = new Date(record.event_date);
            return (
              <div
                key={record.id}
                className="w-full text-left transition-all"
                style={{
                  background: '#FFFDF5',
                  border: '2px solid #111',
                  boxShadow: '4px 4px 0px #111',
                  padding: '14px 16px',
                }}
              >
                <button
                  onClick={() => setSelectedRecord(record)}
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-black truncate" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#111' }}>
                        {record.event_name}
                      </h3>
                      <p className="text-xs font-bold mt-0.5" style={{ color: '#E98A3A', fontFamily: "'Space Grotesk', sans-serif" }}>
                        {record.club_name}
                      </p>
                    </div>
                    <span
                      className="text-[11px] font-bold shrink-0 mt-0.5"
                      style={{ color: '#888', fontFamily: "'Space Grotesk', sans-serif" }}
                    >
                      {eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </button>
                {isPersonalMode && (
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => { setFeedbackEvent({ id: record.event_id, name: record.event_name }); setFeedbackOpen(true); }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold transition-all active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
                      style={{
                        background: '#FFFDF5',
                        border: '2px solid #111',
                        boxShadow: '2px 2px 0px #111',
                        fontFamily: "'Space Grotesk', sans-serif",
                        color: '#111',
                      }}
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> Review
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Event Detail Dialog */}
      <Dialog open={!!selectedRecord} onOpenChange={(open) => { if (!open) setSelectedRecord(null); }}>
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
              Attendance Details
            </DialogTitle>
            <DialogDescription>
              Event attendance record
            </DialogDescription>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              <div
                className="p-4 space-y-3"
                style={{
                  border: '2px solid #111111',
                  borderRadius: '12px',
                  boxShadow: '3px 3px 0px #111111',
                  background: '#FFFFFF',
                }}
              >
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#E98A3A' }}>
                  {selectedRecord.club_name}
                </p>
                <h4
                  className="font-bold text-base"
                  style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#111111' }}
                >
                  {selectedRecord.event_name}
                </h4>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-1.5" style={{ color: '#555' }}>
                    <Calendar className="w-3.5 h-3.5" style={{ color: '#E98A3A' }} />
                    <span>{format(new Date(selectedRecord.event_date), 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-1.5" style={{ color: '#555' }}>
                    <Clock className="w-3.5 h-3.5" style={{ color: '#E98A3A' }} />
                    <span>Scanned at {format(new Date(selectedRecord.scanned_at), 'h:mm a, MMM d, yyyy')}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {selectedRecord.event_type && (
                    <span
                      className="text-[10px] font-bold px-2 py-0.5 flex items-center gap-1"
                      style={{ border: '2px solid #111', borderRadius: '6px', background: '#FFF8E1', color: '#111' }}
                    >
                      <Tag className="w-3 h-3" />
                      {selectedRecord.event_type.replace(/_/g, ' ')}
                    </span>
                  )}
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 flex items-center gap-1"
                    style={{
                      border: '2px solid #111',
                      borderRadius: '6px',
                      background: selectedRecord.attendance_given ? '#E8F5E9' : '#FFEBEE',
                      color: '#111',
                    }}
                  >
                    <CheckCircle className="w-3 h-3" />
                    {selectedRecord.attendance_given ? 'Attendance Granted' : 'Attendance Pending'}
                  </span>
                </div>
              </div>
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

      {/* Bottom Nav */}
      {isMobile && <MobileBottomNav />}
    </div>
  );
}
