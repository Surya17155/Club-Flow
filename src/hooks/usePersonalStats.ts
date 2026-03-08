import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface PersonalStats {
  clubCount: number;
  eventsAttended: number;
  totalEvents: number;
  attendanceRate: number;
  recentAttendance: { name: string; attended: number }[];
}

export const usePersonalStats = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<PersonalStats>({
    clubCount: 0, eventsAttended: 0, totalEvents: 0, attendanceRate: 0, recentAttendance: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const fetchStats = async () => {
      setLoading(true);

      const [clubsRes, attendanceRes] = await Promise.all([
        supabase.from('club_members').select('club_id, clubs(name)').eq('user_id', user.id),
        supabase.from('attendance').select('id, event_id, status, scanned_at, events(name, event_date)').eq('student_id', user.id).order('scanned_at', { ascending: false }),
      ]);

      const clubCount = clubsRes.data?.length ?? 0;
      const attendanceRecords = attendanceRes.data ?? [];
      const eventsAttended = attendanceRecords.filter((a: any) => a.status === 'present').length;
      const totalEvents = attendanceRecords.length;
      const attendanceRate = totalEvents > 0 ? Math.round((eventsAttended / totalEvents) * 100) : 0;

      // Build chart data from last events
      const recentAttendance = attendanceRecords.slice(0, 8).reverse().map((a: any) => ({
        name: (a.events as any)?.name?.slice(0, 12) || 'Event',
        attended: a.status === 'present' ? 100 : 0,
      }));

      setStats({ clubCount, eventsAttended, totalEvents, attendanceRate, recentAttendance });
      setLoading(false);
    };

    fetchStats();
  }, [user?.id]);

  return { stats, loading };
};
