import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, Calendar, Clock, Users, Tag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

interface AttendanceHistoryModalProps {
  open: boolean;
  onClose: () => void;
  records: AttendanceRecord[];
}

export function AttendanceHistoryModal({ open, onClose, records }: AttendanceHistoryModalProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-4 top-[8%] bottom-[8%] z-50 flex items-start justify-center"
            initial={{ opacity: 0, scale: 0.9, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 40 }}
            transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          >
            <div
              className="w-full max-w-md max-h-full overflow-y-auto rounded-3xl border border-border/40 shadow-2xl"
              style={{
                background: 'rgba(255,255,255,0.88)',
                backdropFilter: 'blur(40px) saturate(1.4)',
                WebkitBackdropFilter: 'blur(40px) saturate(1.4)',
              }}
            >
              {/* Header */}
              <div className="sticky top-0 z-10 flex items-center justify-between p-5 pb-3 border-b border-border/20" style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)' }}>
                <div>
                  <h2 className="text-lg font-bold text-foreground font-display">Attendance History</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{records.length} events with attendance</p>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted/60 flex items-center justify-center hover:bg-muted transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              {/* Records List */}
              <div className="p-4 space-y-2">
                {records.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No attendance records yet</p>
                  </div>
                ) : (
                  records.map((record) => {
                    const isExpanded = expandedId === record.id;
                    const eventDate = new Date(record.event_date);
                    const scanDate = new Date(record.scanned_at);
                    return (
                      <div key={record.id} className="rounded-2xl border border-border/30 overflow-hidden bg-white/50">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : record.id)}
                          className="w-full flex items-center gap-3 p-3.5 text-left"
                        >
                          <div className="flex flex-col items-center justify-center w-11 h-13 rounded-xl bg-primary/10 shrink-0 px-1.5 py-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-primary">
                              {eventDate.toLocaleString('default', { month: 'short' })}
                            </span>
                            <span className="text-base font-bold leading-none text-primary">{eventDate.getDate()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-semibold text-foreground truncate">{record.event_name}</h4>
                            <p className="text-xs text-muted-foreground">{record.club_name}</p>
                          </div>
                          <Badge className="shrink-0 bg-success/15 text-success border-success/20 text-[10px]">
                            ✓ Present
                          </Badge>
                          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: 'easeInOut' }}
                              className="overflow-hidden"
                            >
                              <div className="px-4 pb-4 pt-1 space-y-2.5 border-t border-border/20">
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Calendar className="w-3.5 h-3.5 text-primary" />
                                  <span>{eventDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Clock className="w-3.5 h-3.5 text-primary" />
                                  <span>Scanned at {scanDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Users className="w-3.5 h-3.5 text-primary" />
                                  <span>{record.club_name}</span>
                                </div>
                                {record.event_type && (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Tag className="w-3.5 h-3.5 text-primary" />
                                    <span className="capitalize">{record.event_type.replace(/_/g, ' ')}</span>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}