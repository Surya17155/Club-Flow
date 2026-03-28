import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  const [totalClubs, setTotalClubs] = useState(0);
  const [globalMembers, setGlobalMembers] = useState(0);
  const [totalEvents, setTotalEvents] = useState(0);
  const [clubs, setClubs] = useState<ClubWithStats[]>([]);
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [growthData, setGrowthData] = useState<GrowthData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);

      // Fetch clubs with member and event counts
      const { data: clubsData } = await supabase.from('clubs').select('id, name, logo_url, description');
      const { data: membersData } = await supabase.from('club_members').select('id, user_id, club_id, role');
      const { data: eventsData } = await supabase.from('events').select('id, name, event_date, end_date, club_id, category, event_type, description');
      const { data: profilesData } = await supabase.from('profiles').select('user_id, full_name, email, avatar_url, programme, roll_no, section, year, semester, phone');
      const { data: participantsData } = await supabase.from('event_participants').select('event_id, user_id');

      const clubsList = clubsData || [];
      const membersList = membersData || [];
      const eventsList = eventsData || [];
      const profilesList = profilesData || [];
      const participantsList = participantsData || [];

      // Build lookup maps first
      const profileMap = new Map(profilesList.map(p => [p.user_id, p]));
      const clubMap = new Map(clubsList.map(c => [c.id, c.name]));

      // Stats
      setTotalClubs(clubsList.length);
      const uniqueMembers = new Set(membersList.map(m => m.user_id));
      setGlobalMembers(uniqueMembers.size);
      setTotalEvents(eventsList.length);

      // Clubs with stats
      const clubsWithStats: ClubWithStats[] = clubsList.map(club => {
        const presidentMember = membersList.find(m => m.club_id === club.id && m.role === 'president');
        const presidentProfile = presidentMember ? profileMap.get(presidentMember.user_id) : null;
        return {
          id: club.id,
          name: club.name,
          logo_url: club.logo_url,
          description: club.description,
          memberCount: membersList.filter(m => m.club_id === club.id).length,
          eventCount: eventsList.filter(e => e.club_id === club.id).length,
          president: presidentMember ? {
            user_id: presidentMember.user_id,
            full_name: presidentProfile?.full_name || 'Unknown',
            email: presidentProfile?.email || null,
          } : null,
        };
      });
      setClubs(clubsWithStats);

      // Members with profiles
      const profileMap = new Map(profilesList.map(p => [p.user_id, p]));
      const clubMap = new Map(clubsList.map(c => [c.id, c.name]));
      const membersWithProfiles: MemberWithProfile[] = membersList.map(m => {
        const profile = profileMap.get(m.user_id);
        return {
          membership_id: m.id,
          user_id: m.user_id,
          club_id: m.club_id,
          club_name: clubMap.get(m.club_id) || '',
          role: m.role,
          full_name: profile?.full_name || 'Unknown',
          email: profile?.email || null,
          avatar_url: profile?.avatar_url || null,
          programme: profile?.programme || null,
          roll_no: profile?.roll_no || null,
          section: profile?.section || null,
          year: profile?.year || null,
          semester: profile?.semester || null,
          phone: profile?.phone || null,
        };
      });
      setMembers(membersWithProfiles);

      // Upcoming events
      const now = new Date().toISOString();
      const participantCountMap = new Map<string, number>();
      participantsList.forEach(p => {
        participantCountMap.set(p.event_id, (participantCountMap.get(p.event_id) || 0) + 1);
      });
      const upcoming: UpcomingEvent[] = eventsList
        .filter(e => e.event_date >= now)
        .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
        .slice(0, 20)
        .map(e => ({
          id: e.id,
          name: e.name,
          event_date: e.event_date,
          end_date: e.end_date,
          club_name: clubMap.get(e.club_id) || '',
          club_id: e.club_id,
          participant_count: participantCountMap.get(e.id) || 0,
          category: e.category,
          event_type: e.event_type,
          description: e.description,
        }));
      setUpcomingEvents(upcoming);

      // Growth data - events per month
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentYear = new Date().getFullYear();
      const growth: GrowthData[] = monthNames.map((month, i) => {
        const eventsInMonth = eventsList.filter(e => {
          const d = new Date(e.event_date);
          return d.getFullYear() === currentYear && d.getMonth() === i;
        }).length;
        const membersInMonth = membersList.filter(m => {
          // Use joined_at if available; approximate
          return true; // count all for now
        }).length;
        return { month, events: eventsInMonth, members: Math.round(membersInMonth / 12) };
      });
      setGrowthData(growth);

      setLoading(false);
    };

    fetchAll();
  }, []);

  return { totalClubs, globalMembers, totalEvents, clubs, members, upcomingEvents, growthData, loading };
};
