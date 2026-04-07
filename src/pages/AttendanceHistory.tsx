import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePersonalStats } from '@/hooks/usePersonalStats';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';
import { ChevronLeft, Calendar, Clock, Users, Tag, CheckCircle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

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

function EventDetailPopup({ record, onClose }: { record: AttendanceRecord; onClose: () => void }) {
  const eventDate = new Date(record.event_date);
  const scanDate = new Date(record.scanned_at);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="w-full max-w-md"
          style={{
            background: '#FFFDF5',
            border: '3px solid #111',
            boxShadow: '6px 6px 0px #111',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4" style={{ borderBottom: '3px solid #111' }}>
            <h3 className="text-lg font-black" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#111' }}>
              Event Details
            </h3>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center transition-all active:translate-x-[1px] active:translate-y-[1px]"
              style={{ border: '2px solid #111', background: '#F4EFE7' }}
            >
              <X className="w-4 h-4" style={{ color: '#111' }} />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-4">
            <div>
              <h4 className="text-xl font-black" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#111' }}>
                {record.event_name}
              </h4>
              <p className="text-sm font-bold mt-1" style={{ color: '#E98A3A', fontFamily: "'Space Grotesk', sans-serif" }}>
                {record.club_name}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center" style={{ background: '#E98A3A', border: '2px solid #111' }}>
                  <Calendar className="w-4 h-4" style={{ color: '#111' }} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase" style={{ color: '#888', fontFamily: "'Space Grotesk', sans-serif" }}>Date</p>
                  <p className="text-sm font-bold" style={{ color: '#111', fontFamily: "'Space Grotesk', sans-serif" }}>
                    {eventDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center" style={{ background: '#E98A3A', border: '2px solid #111' }}>
                  <Clock className="w-4 h-4" style={{ color: '#111' }} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase" style={{ color: '#888', fontFamily: "'Space Grotesk', sans-serif" }}>Scanned At</p>
                  <p className="text-sm font-bold" style={{ color: '#111', fontFamily: "'Space Grotesk', sans-serif" }}>
                    {scanDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} — {scanDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center" style={{ background: '#E98A3A', border: '2px solid #111' }}>
                  <Users className="w-4 h-4" style={{ color: '#111' }} />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase" style={{ color: '#888', fontFamily: "'Space Grotesk', sans-serif" }}>Club</p>
                  <p className="text-sm font-bold" style={{ color: '#111', fontFamily: "'Space Grotesk', sans-serif" }}>
                    {record.club_name}
                  </p>
                </div>
              </div>

              {record.event_type && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 flex items-center justify-center" style={{ background: '#E98A3A', border: '2px solid #111' }}>
                    <Tag className="w-4 h-4" style={{ color: '#111' }} />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase" style={{ color: '#888', fontFamily: "'Space Grotesk', sans-serif" }}>Event Type</p>
                    <p className="text-sm font-bold capitalize" style={{ color: '#111', fontFamily: "'Space Grotesk', sans-serif" }}>
                      {record.event_type.replace(/_/g, ' ')}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Attendance Badge */}
            <div
              className="flex items-center gap-2 px-4 py-3 mt-2"
              style={{
                background: record.attendance_given ? '#D1FAE5' : '#FEF3C7',
                border: '2px solid #111',
                boxShadow: '3px 3px 0px #111',
              }}
            >
              <CheckCircle className="w-5 h-5" style={{ color: record.attendance_given ? '#059669' : '#D97706' }} />
              <span className="text-sm font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#111' }}>
                {record.attendance_given ? 'Attendance Granted' : 'Attendance Pending'}
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
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
