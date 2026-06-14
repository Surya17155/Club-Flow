import { useState, useEffect } from 'react';
import { getCachedClubStats, preloadClubStats } from '@/lib/preloadCache';

interface ClubStats {
  totalMembers: number;
  totalEvents: number;
  avgAttendanceRate: number;
  chartData: { name: string; attendance: number; engagement: number }[];
}

export const useClubStats = (clubId: string | undefined) => {
  const defaultStats: ClubStats = {
    totalMembers: 0, totalEvents: 0, avgAttendanceRate: 0, chartData: [],
  };
  const [stats, setStats] = useState<ClubStats>(() => getCachedClubStats(clubId) ?? defaultStats);
  const [loading, setLoading] = useState(() => clubId ? !getCachedClubStats(clubId) : false);

  useEffect(() => {
    if (!clubId) { setLoading(false); return; }

    const fetchStats = async () => {
      const cached = getCachedClubStats(clubId);
      if (cached) setStats(cached);
      else setLoading(true);
      setStats(await preloadClubStats(clubId));
      setLoading(false);
    };

    fetchStats();
  }, [clubId]);

  return { stats, loading };
};
