import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ClubStats {
  totalMembers: number;
  totalEvents: number;
  avgAttendanceRate: number;
  chartData: { name: string; attendance: number; engagement: number }[];
}

export const useClubStats = (clubId: string | undefined) => {
  const [stats, setStats] = useState<ClubStats>({
    totalMembers: 0, totalEvents: 0, avgAttendanceRate: 0, chartData: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!clubId) { setLoading(false); return; }

    const fetchStats = async () => {
      setLoading(true);

      const [membersRes, eventsRes] = await Promise.all([
        supabase.from('club_members').select('id', { count: 'exact', head: true }).eq('club_id', clubId),
        supabase.from('events').select('id, name, event_date').eq('club_id', clubId).order('event_date', { ascending: true }),
      ]);

      const totalMembers = membersRes.count ?? 0;
      const events = eventsRes.data ?? [];
      const totalEvents = events.length;

      // Fetch attendance counts per event
      let chartData: ClubStats['chartData'] = [];
      let totalRate = 0;

      if (events.length > 0) {
        const eventIds = events.map(e => e.id);
        const { data: attendanceData } = await supabase
          .from('attendance')
          .select('event_id, status')
          .in('event_id', eventIds);

        const attendanceByEvent: Record<string, { present: number; total: number }> = {};
        (attendanceData ?? []).forEach((a: any) => {
          if (!attendanceByEvent[a.event_id]) attendanceByEvent[a.event_id] = { present: 0, total: 0 };
          attendanceByEvent[a.event_id].total++;
          if (a.status === 'present') attendanceByEvent[a.event_id].present++;
        });

        // Use last 10 events for chart
        const recentEvents = events.slice(-10);
        chartData = recentEvents.map(e => {
          const counts = attendanceByEvent[e.id] || { present: 0, total: 0 };
          const rate = totalMembers > 0 ? Math.round((counts.present / totalMembers) * 100) : 0;
          return {
            name: e.name.length > 12 ? e.name.slice(0, 12) + '…' : e.name,
            attendance: counts.present,
            engagement: rate,
          };
        });

        // Average attendance rate across all events
        const eventsWithAttendance = events.filter(e => attendanceByEvent[e.id]);
        if (eventsWithAttendance.length > 0 && totalMembers > 0) {
          totalRate = Math.round(
            eventsWithAttendance.reduce((sum, e) => {
              const c = attendanceByEvent[e.id] || { present: 0 };
              return sum + (c.present / totalMembers) * 100;
            }, 0) / eventsWithAttendance.length
          );
        }
      }

      setStats({ totalMembers, totalEvents, avgAttendanceRate: totalRate, chartData });
      setLoading(false);
    };

    fetchStats();
  }, [clubId]);

  return { stats, loading };
};
