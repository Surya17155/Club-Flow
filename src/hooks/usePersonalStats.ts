import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getCachedPersonalStats, preloadPersonalStats } from '@/lib/preloadCache';

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
  const defaultStats: PersonalStats = {
    clubCount: 0, eventsAttended: 0, totalEventsAttendance: 0, attendanceRate: 0, recentAttendance: [], attendanceRecords: [],
  };
  const [stats, setStats] = useState<PersonalStats>(() => user ? getCachedPersonalStats(user.id) ?? defaultStats : defaultStats);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchStats = async () => {
      const cached = getCachedPersonalStats(user.id);
      if (cached) setStats(cached);
      setStats(await preloadPersonalStats(user.id));
    };

    fetchStats();
  }, [user?.id]);

  return { stats, loading };
};
