import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

interface PersonalStats {
  clubCount: number;
  eventsAttended: number;
  totalEventsAttendance: number;
  attendanceRate: number;
  recentAttendance: { name: string; attended: number }[];
  attendanceRecords: AttendanceRecord[];
}

export const usePersonalStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<PersonalStats>({
    clubCount: 0, eventsAttended: 0, totalEventsAttendance: 0, attendanceRate: 0, recentAttendance: [], attendanceRecords: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const fetchStats = async () => {
      setLoading(true);

      const [clubsRes, attendanceRes] = await Promise.all([
        supabase.from('club_members').select('club_id, clubs(name)').eq('user_id', user.id),
        supabase.from('attendance').select('id, event_id, status, scanned_at, events(name, event_date, event_type, attendance_given, clubs(name))').eq('student_id', user.id).order('scanned_at', { ascending: false }),
      ]);

      const clubCount = clubsRes.data?.length ?? 0;
      const rawRecords = attendanceRes.data ?? [];
      const eventsAttended = rawRecords.filter((a: any) => a.status === 'present').length;
      
      // Total Events Attendance = events where student was present AND attendance_given is true
      const totalEventsAttendance = rawRecords.filter(
        (a: any) => a.status === 'present' && (a.events as any)?.attendance_given === true
      ).length;
      
      const totalEvents = rawRecords.length;
      const attendanceRate = totalEvents > 0 ? Math.round((eventsAttended / totalEvents) * 100) : 0;

      // Build chart data from last events
      const recentAttendance = rawRecords.slice(0, 8).reverse().map((a: any) => ({
        name: (a.events as any)?.name?.slice(0, 12) || 'Event',
        attended: a.status === 'present' ? 100 : 0,
      }));

      // Build detailed records for attendance history
      const attendanceRecords: AttendanceRecord[] = rawRecords
        .filter((a: any) => a.status === 'present' && (a.events as any)?.attendance_given === true)
        .map((a: any) => ({
          id: a.id,
          event_id: a.event_id,
          status: a.status,
          scanned_at: a.scanned_at,
          event_name: (a.events as any)?.name || 'Unknown Event',
          event_date: (a.events as any)?.event_date || '',
          club_name: (a.events as any)?.clubs?.name || 'Unknown Club',
          event_type: (a.events as any)?.event_type || '',
          attendance_given: (a.events as any)?.attendance_given ?? false,
        }));

      setStats({ clubCount, eventsAttended, totalEventsAttendance, attendanceRate, recentAttendance, attendanceRecords });
      setLoading(false);
    };

    fetchStats();
  }, [user?.id]);

  return { stats, loading };
};
