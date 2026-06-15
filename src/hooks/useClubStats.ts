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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!clubId) return;

    const fetchStats = async () => {
      const cached = getCachedClubStats(clubId);
      if (cached) { setStats(cached); return; }
      setStats(await preloadClubStats(clubId));
    };

    fetchStats();
  }, [clubId]);

  return { stats, loading };
};
