import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePersonalStats } from '@/hooks/usePersonalStats';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';
import { Calendar, Clock, Users, Tag, Shield, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { format } from 'date-fns';

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
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-[#E98A3A] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : records.length === 0 ? (
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
              <button
                key={record.id}
                onClick={() => setSelectedRecord(record)}
                className="w-full text-left transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                style={{
                  background: '#FFFDF5',
                  border: '2px solid #111',
                  boxShadow: '4px 4px 0px #111',
                  padding: '14px 16px',
                }}
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
            );
          })
        )}
      </div>

      {/* Event Detail Popup */}
      {selectedRecord && (
        <EventDetailPopup record={selectedRecord} onClose={() => setSelectedRecord(null)} />
      )}

      {/* Bottom Nav */}
      {isMobile && <MobileBottomNav />}
    </div>
  );
}
