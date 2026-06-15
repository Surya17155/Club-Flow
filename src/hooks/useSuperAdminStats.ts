import { useState, useEffect } from 'react';
import { getCachedSuperAdminStats, preloadSuperAdminStats } from '@/lib/preloadCache';

interface ClubWithStats {
  id: string;
  name: string;
  logo_url: string | null;
  description: string | null;
  memberCount: number;
  eventCount: number;
  president?: { user_id: string; full_name: string; email: string | null } | null;
}

interface MemberWithProfile {
  membership_id: string;
  user_id: string;
  club_id: string;
  club_name: string;
  role: string;
  full_name: string;
  email: string | null;
  avatar_url: string | null;
  programme: string | null;
  roll_no: string | null;
  section: string | null;
  year: string | null;
  semester: string | null;
  phone: string | null;
}

interface UpcomingEvent {
  id: string;
  name: string;
  event_date: string;
  end_date: string | null;
  club_name: string;
  club_id: string;
  participant_count: number;
  category: string;
  event_type: string;
  description: string | null;
}

interface GrowthData {
  month: string;
  events: number;
  members: number;
}

export const useSuperAdminStats = () => {
  const cachedStats = getCachedSuperAdminStats();
  const [totalClubs, setTotalClubs] = useState(cachedStats?.totalClubs ?? 0);
  const [globalMembers, setGlobalMembers] = useState(cachedStats?.globalMembers ?? 0);
  const [totalEvents, setTotalEvents] = useState(cachedStats?.totalEvents ?? 0);
  const [clubs, setClubs] = useState<ClubWithStats[]>(cachedStats?.clubs ?? []);
  const [members, setMembers] = useState<MemberWithProfile[]>(cachedStats?.members ?? []);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>(cachedStats?.upcomingEvents ?? []);
  const [growthData, setGrowthData] = useState<GrowthData[]>(cachedStats?.growthData ?? []);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAll = async () => {
      const cached = getCachedSuperAdminStats();
      if (cached) {
        setTotalClubs(cached.totalClubs);
        setGlobalMembers(cached.globalMembers);
        setTotalEvents(cached.totalEvents);
        setClubs(cached.clubs);
        setMembers(cached.members);
        setUpcomingEvents(cached.upcomingEvents);
        setGrowthData(cached.growthData);
      }
      const data = await preloadSuperAdminStats();
      setTotalClubs(data.totalClubs);
      setGlobalMembers(data.globalMembers);
      setTotalEvents(data.totalEvents);
      setClubs(data.clubs);
      setMembers(data.members);
      setUpcomingEvents(data.upcomingEvents);
      setGrowthData(data.growthData);
    };

    fetchAll();
  }, []);

  return { totalClubs, globalMembers, totalEvents, clubs, members, upcomingEvents, growthData, loading };
};
