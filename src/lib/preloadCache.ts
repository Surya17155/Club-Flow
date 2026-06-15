import { supabase } from '@/integrations/supabase/client';
import { isSuperAdminUser } from '@/lib/superAdminMode';

const db = supabase as any;
const CACHE_TTL = 1000 * 60 * 5;

type CacheEntry<T> = {
  data?: T;
  promise?: Promise<T>;
  fetchedAt?: number;
};

export type CacheStatusSnapshot = {
  active: number;
  completed: number;
  total: number;
  lastLabel: string;
  lastSource: 'idle' | 'warmed-cache' | 'fresh-fetch';
  updatedAt: number;
};

let cacheStatus: CacheStatusSnapshot = {
  active: 0,
  completed: 0,
  total: 0,
  lastLabel: 'Idle',
  lastSource: 'idle',
  updatedAt: Date.now(),
};

const cacheStatusListeners = new Set<(snapshot: CacheStatusSnapshot) => void>();
const emitCacheStatus = () => cacheStatusListeners.forEach((listener) => listener(cacheStatus));
const setCacheStatus = (updates: Partial<CacheStatusSnapshot>) => {
  cacheStatus = { ...cacheStatus, ...updates, updatedAt: Date.now() };
  emitCacheStatus();
};

export const getCacheStatusSnapshot = () => cacheStatus;
export const subscribeCacheStatus = (listener: (snapshot: CacheStatusSnapshot) => void) => {
  cacheStatusListeners.add(listener);
  listener(cacheStatus);
  return () => { cacheStatusListeners.delete(listener); };
};

const noteCacheHit = (label: string) => {
  setCacheStatus({ lastLabel: label, lastSource: 'warmed-cache' });
};

const beginFreshFetch = (label: string) => {
  setCacheStatus({
    active: cacheStatus.active + 1,
    completed: cacheStatus.active === 0 ? 0 : cacheStatus.completed,
    total: cacheStatus.active === 0 ? 1 : cacheStatus.total + 1,
    lastLabel: label,
    lastSource: 'fresh-fetch',
  });
};

const finishFreshFetch = (label: string) => {
  setCacheStatus({
    active: Math.max(0, cacheStatus.active - 1),
    completed: cacheStatus.completed + 1,
    lastLabel: label,
    lastSource: 'fresh-fetch',
  });
};

const isFresh = <T,>(entry?: CacheEntry<T>) =>
  !!entry && 'data' in entry && !!entry.fetchedAt && Date.now() - entry.fetchedAt < CACHE_TTL;

const read = <T,>(cache: Map<string, CacheEntry<T>>, key: string) => {
  const entry = cache.get(key);
  return isFresh(entry) ? entry?.data : undefined;
};

const cached = <T,>(cache: Map<string, CacheEntry<T>>, key: string, loader: () => Promise<T>, force = false, fallback?: T) => {
  const entry = cache.get(key);
  if (!force && isFresh(entry)) {
    noteCacheHit(key);
    return Promise.resolve(entry!.data as T);
  }
  if (entry?.promise) return entry.promise;

  beginFreshFetch(key);
  const promise = loader().then((data) => {
    cache.set(key, { data, fetchedAt: Date.now() });
    return data;
  }).catch((error) => {
    if (entry && 'data' in entry) return entry.data as T;
    if (fallback !== undefined) {
      cache.set(key, { data: fallback, fetchedAt: Date.now() });
      return fallback;
    }
    cache.delete(key);
    throw error;
  }).finally(() => {
    finishFreshFetch(key);
  });

  cache.set(key, { ...entry, promise });
  return promise;
};

export interface CachedUserClub {
  club_id: string;
  club_name: string;
  role: string;
  logo_url: string | null;
}

export interface CachedPersonalStats {
  clubCount: number;
  eventsAttended: number;
  totalEventsAttendance: number;
  attendanceRate: number;
  recentAttendance: { name: string; attended: number }[];
  attendanceRecords: any[];
}

export interface CachedClubStats {
  totalMembers: number;
  totalEvents: number;
  avgAttendanceRate: number;
  chartData: { name: string; attendance: number; engagement: number }[];
}

export interface CachedEventsData {
  events: any[];
  attendanceCounts: Record<string, number>;
}

export interface CachedDiscoverData {
  clubs: any[];
  myClubIds: string[];
  myRequests: [string, string][];
}

export interface CachedUpcomingEvent {
  id: string;
  name: string;
  event_date: string;
  end_date: string | null;
  description: string | null;
  event_type: string;
  category: string;
  access_type: string;
  attendance_given: boolean | null;
  clubs?: { name: string } | null;
  month: string;
  day: string;
  club_name: string;
  full_date: string;
  time: string;
  end_time: string | null;
}

const emptyPersonalStats: CachedPersonalStats = { clubCount: 0, eventsAttended: 0, totalEventsAttendance: 0, attendanceRate: 0, recentAttendance: [], attendanceRecords: [] };
const emptyClubStats: CachedClubStats = { totalMembers: 0, totalEvents: 0, avgAttendanceRate: 0, chartData: [] };
const emptySuperAdminStats = { totalClubs: 0, globalMembers: 0, totalEvents: 0, allEvents: [], clubs: [], members: [], upcomingEvents: [], growthData: [] };

const formatUpcomingEvent = (event: any): CachedUpcomingEvent => {
  const start = new Date(event.event_date);
  const end = event.end_date ? new Date(event.end_date) : null;
  return {
    ...event,
    month: start.toLocaleString('default', { month: 'short' }).toUpperCase(),
    day: String(start.getDate()),
    club_name: event.clubs?.name || '',
    full_date: start.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
    time: start.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    end_time: end ? end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null,
  };
};

const adminRoleCache = new Map<string, CacheEntry<boolean>>();
const userClubsCache = new Map<string, CacheEntry<CachedUserClub[]>>();
const profileCache = new Map<string, CacheEntry<any>>();
const personalStatsCache = new Map<string, CacheEntry<CachedPersonalStats>>();
const clubStatsCache = new Map<string, CacheEntry<CachedClubStats>>();
const delegatedPowersCache = new Map<string, CacheEntry<any[]>>();
const superAdminStatsCache = new Map<string, CacheEntry<any>>();
const eventsCache = new Map<string, CacheEntry<CachedEventsData>>();
const discoverCache = new Map<string, CacheEntry<CachedDiscoverData>>();
const outsidersCache = new Map<string, CacheEntry<any[]>>();
const clubMembersCache = new Map<string, CacheEntry<any[]>>();
const clubSettingsCache = new Map<string, CacheEntry<any>>();
const upcomingEventsCache = new Map<string, CacheEntry<CachedUpcomingEvent[]>>();
const joinRequestsCache = new Map<string, CacheEntry<any[]>>();
const assignableMembersCache = new Map<string, CacheEntry<any[]>>();

export const getCachedAdminStatus = (userId: string, email?: string | null) => {
  if (isSuperAdminUser(email)) return true;
  return read(adminRoleCache, userId);
};

export const preloadAdminStatus = (userId: string, email?: string | null, force = false) => {
  if (isSuperAdminUser(email)) {
    adminRoleCache.set(userId, { data: true, fetchedAt: Date.now() });
    return Promise.resolve(true);
  }
  return cached(adminRoleCache, userId, async () => {
    const { data } = await db.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin');
    return !!(data && data.length > 0);
  }, force);
};

export const getCachedUserClubs = (userId: string) => read(userClubsCache, userId);
export const preloadUserClubs = (userId: string, force = false) => cached(userClubsCache, userId, async () => {
  const { data, error } = await db.from('club_members').select('club_id, role, clubs(id, name, logo_url)').eq('user_id', userId);
  if (error || !data) return [];
  return data.map((m: any) => ({
    club_id: m.club_id,
    club_name: m.clubs?.name ?? '',
    role: m.role,
    logo_url: m.clubs?.logo_url ?? null,
  }));
}, force, []);

export const getCachedProfile = (userId: string) => read(profileCache, userId);
export const setCachedProfile = (userId: string, profile: any) => profileCache.set(userId, { data: profile, fetchedAt: Date.now() });
export const preloadProfile = (userId: string, force = false) => cached(profileCache, userId, async () => {
  const { data } = await db.from('profiles').select('*').eq('user_id', userId).maybeSingle();
  return data ?? null;
}, force, null);

export const getCachedPersonalStats = (userId: string) => read(personalStatsCache, userId);
export const preloadPersonalStats = (userId: string, force = false) => cached(personalStatsCache, userId, async () => {
  const [clubsRes, attendanceRes] = await Promise.all([
    db.from('club_members').select('club_id, clubs(name)').eq('user_id', userId),
    db.from('attendance').select('id, event_id, status, scanned_at, events(name, event_date, event_type, attendance_given, clubs(name))').eq('student_id', userId).order('scanned_at', { ascending: false }),
  ]);
  const rawRecords = attendanceRes.data ?? [];
  const eventsAttended = rawRecords.filter((a: any) => a.status === 'present').length;
  const totalEventsAttendance = rawRecords.filter((a: any) => a.status === 'present' && a.events?.attendance_given === true).length;
  const attendanceRate = rawRecords.length > 0 ? Math.round((eventsAttended / rawRecords.length) * 100) : 0;
  return {
    clubCount: clubsRes.data?.length ?? 0,
    eventsAttended,
    totalEventsAttendance,
    attendanceRate,
    recentAttendance: rawRecords.slice(0, 8).reverse().map((a: any) => ({ name: a.events?.name?.slice(0, 12) || 'Event', attended: a.status === 'present' ? 100 : 0 })),
    attendanceRecords: rawRecords
      .filter((a: any) => a.status === 'present' && a.events?.attendance_given === true)
      .map((a: any) => ({
        id: a.id,
        event_id: a.event_id,
        status: a.status,
        scanned_at: a.scanned_at,
        event_name: a.events?.name || 'Unknown Event',
        event_date: a.events?.event_date || '',
        club_name: a.events?.clubs?.name || 'Unknown Club',
        event_type: a.events?.event_type || '',
        attendance_given: a.events?.attendance_given ?? false,
      })),
  };
}, force, emptyPersonalStats);

export const getCachedClubStats = (clubId?: string) => clubId ? read(clubStatsCache, clubId) : undefined;
export const preloadClubStats = (clubId: string, force = false) => cached(clubStatsCache, clubId, async () => {
  const [membersRes, eventsRes] = await Promise.all([
    db.from('club_members').select('id', { count: 'exact', head: true }).eq('club_id', clubId),
    db.from('events').select('id, name, event_date').eq('club_id', clubId).order('event_date', { ascending: true }),
  ]);
  const totalMembers = membersRes.count ?? 0;
  const events = eventsRes.data ?? [];
  let chartData: CachedClubStats['chartData'] = [];
  let avgAttendanceRate = 0;
  if (events.length > 0) {
    const eventIds = events.map((e: any) => e.id);
    const { data: attendanceData } = await db.from('attendance').select('event_id, status').in('event_id', eventIds);
    const attendanceByEvent: Record<string, { present: number; total: number }> = {};
    (attendanceData ?? []).forEach((a: any) => {
      if (!attendanceByEvent[a.event_id]) attendanceByEvent[a.event_id] = { present: 0, total: 0 };
      attendanceByEvent[a.event_id].total += 1;
      if (a.status === 'present') attendanceByEvent[a.event_id].present += 1;
    });
    chartData = events.slice(-10).map((e: any) => {
      const counts = attendanceByEvent[e.id] || { present: 0 };
      return { name: e.name.length > 12 ? `${e.name.slice(0, 12)}…` : e.name, attendance: counts.present, engagement: totalMembers > 0 ? Math.round((counts.present / totalMembers) * 100) : 0 };
    });
    const eventsWithAttendance = events.filter((e: any) => attendanceByEvent[e.id]);
    if (eventsWithAttendance.length > 0 && totalMembers > 0) {
      avgAttendanceRate = Math.round(eventsWithAttendance.reduce((sum: number, e: any) => sum + ((attendanceByEvent[e.id]?.present || 0) / totalMembers) * 100, 0) / eventsWithAttendance.length);
    }
  }
  return { totalMembers, totalEvents: events.length, avgAttendanceRate, chartData };
}, force, emptyClubStats);

const powersKey = (userId: string, clubId: string) => `${userId}:${clubId}`;
export const getCachedDelegatedPowers = (userId?: string, clubId?: string) => userId && clubId ? read(delegatedPowersCache, powersKey(userId, clubId)) : undefined;
export const preloadDelegatedPowers = (userId: string, clubId: string, force = false) => cached(delegatedPowersCache, powersKey(userId, clubId), async () => {
  const { data, error } = await db.from('delegated_powers').select('*').eq('club_id', clubId);
  return !error && data ? data : [];
}, force, []);

export const getCachedSuperAdminStats = () => read(superAdminStatsCache, 'all');
export const preloadSuperAdminStats = (force = false) => cached(superAdminStatsCache, 'all', async () => {
  const [{ data: clubsData }, { data: membersData }, { data: eventsData }, { data: profilesData }, { data: participantsData }] = await Promise.all([
    db.from('clubs').select('id, name, logo_url, description'),
    db.from('club_members').select('id, user_id, club_id, role'),
    db.from('events').select('id, name, event_date, end_date, club_id, category, event_type, description'),
    db.from('profiles').select('user_id, full_name, email, avatar_url, programme, roll_no, section, year, semester, phone'),
    db.from('event_participants').select('event_id, user_id'),
  ]);
  const clubsList = clubsData || [];
  const membersList = membersData || [];
  const eventsList = eventsData || [];
  const profilesList = profilesData || [];
  const participantsList = participantsData || [];
  const profileMap = new Map(profilesList.map((p: any) => [p.user_id, p]));
  const clubMap = new Map(clubsList.map((c: any) => [c.id, c.name]));
  const participantCountMap = new Map<string, number>();
  participantsList.forEach((p: any) => participantCountMap.set(p.event_id, (participantCountMap.get(p.event_id) || 0) + 1));
  const now = new Date().toISOString();
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const currentYear = new Date().getFullYear();

  return {
    totalClubs: clubsList.length,
    globalMembers: new Set(membersList.map((m: any) => m.user_id)).size,
    totalEvents: eventsList.length,
    allEvents: eventsList.map((e: any) => ({ ...e, club_name: clubMap.get(e.club_id) || '', participant_count: participantCountMap.get(e.id) || 0 })),
    clubs: clubsList.map((club: any) => {
      const presidentMember = membersList.find((m: any) => m.club_id === club.id && m.role === 'president');
      const presidentProfile = presidentMember ? profileMap.get(presidentMember.user_id) as any : null;
      return {
        id: club.id,
        name: club.name,
        logo_url: club.logo_url,
        description: club.description,
        memberCount: membersList.filter((m: any) => m.club_id === club.id).length,
        eventCount: eventsList.filter((e: any) => e.club_id === club.id).length,
        president: presidentMember ? { user_id: presidentMember.user_id, full_name: presidentProfile?.full_name || 'Unknown', email: presidentProfile?.email || null } : null,
      };
    }),
    members: membersList.map((m: any) => {
      const profile = profileMap.get(m.user_id) as any;
      return { membership_id: m.id, user_id: m.user_id, club_id: m.club_id, club_name: clubMap.get(m.club_id) || '', role: m.role, full_name: profile?.full_name || 'Unknown', email: profile?.email || null, avatar_url: profile?.avatar_url || null, programme: profile?.programme || null, roll_no: profile?.roll_no || null, section: profile?.section || null, year: profile?.year || null, semester: profile?.semester || null, phone: profile?.phone || null };
    }),
    upcomingEvents: eventsList.filter((e: any) => e.event_date >= now).sort((a: any, b: any) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime()).slice(0, 20).map((e: any) => ({ id: e.id, name: e.name, event_date: e.event_date, end_date: e.end_date, club_name: clubMap.get(e.club_id) || '', club_id: e.club_id, participant_count: participantCountMap.get(e.id) || 0, category: e.category, event_type: e.event_type, description: e.description })),
    growthData: monthNames.map((month, i) => ({ month, events: eventsList.filter((e: any) => { const d = new Date(e.event_date); return d.getFullYear() === currentYear && d.getMonth() === i; }).length, members: Math.round(membersList.length / 12) })),
  };
}, force, emptySuperAdminStats);

const eventsKey = (viewMode: 'personal' | 'club', clubId?: string | null) => `${viewMode}:${viewMode === 'club' ? clubId || 'all' : 'all'}`;
export const getCachedEvents = (viewMode: 'personal' | 'club', clubId?: string | null) => read(eventsCache, eventsKey(viewMode, clubId));
export const preloadEvents = (viewMode: 'personal' | 'club', clubId?: string | null, force = false) => cached(eventsCache, eventsKey(viewMode, clubId), async () => {
  let query = db.from('events').select('id, name, event_type, category, event_date, end_date, access_type, description, qr_token, club_id, attendance_given, clubs(name)').order('event_date', { ascending: true });
  if (viewMode === 'club' && clubId) query = query.eq('club_id', clubId);
  const { data, error } = await query;
  const events = !error && data ? data : [];
  const ids = events.map((e: any) => e.id);
  const attendanceCounts: Record<string, number> = {};
  if (ids.length > 0) {
    const { data: attData } = await db.from('attendance').select('event_id').in('event_id', ids);
    (attData ?? []).forEach((a: any) => { attendanceCounts[a.event_id] = (attendanceCounts[a.event_id] || 0) + 1; });
  }
  return { events, attendanceCounts };
}, force, { events: [], attendanceCounts: {} });

export const getCachedDiscoverClubs = (userId: string) => read(discoverCache, userId);
export const preloadDiscoverClubs = (userId: string, force = false) => cached(discoverCache, userId, async () => {
  const [{ data: clubsData }, { data: membersData }, { data: myMemberships }, { data: requests }] = await Promise.all([
    db.from('clubs').select('id, name, tagline, description, logo_url, category, club_type'),
    db.from('club_members').select('club_id'),
    db.from('club_members').select('club_id').eq('user_id', userId),
    db.from('club_join_requests').select('club_id, status').eq('user_id', userId),
  ]);
  const counts: Record<string, number> = {};
  (membersData ?? []).forEach((m: any) => { counts[m.club_id] = (counts[m.club_id] || 0) + 1; });
  return {
    clubs: (clubsData ?? []).map((c: any) => ({ ...c, memberCount: counts[c.id] || 0 })),
    myClubIds: (myMemberships ?? []).map((m: any) => m.club_id),
    myRequests: (requests ?? []).map((r: any) => [r.club_id, r.status]),
  };
}, force, { clubs: [], myClubIds: [], myRequests: [] });

export const getCachedOutsiders = () => read(outsidersCache, 'all');
export const preloadOutsiders = (force = false) => cached(outsidersCache, 'all', async () => {
  const { data, error } = await supabase.functions.invoke('manage-outsider', { method: 'GET' });
  if (error) throw error;
  return data?.outsiders || [];
}, force, []);

export const getCachedClubSettings = (clubId?: string) => clubId ? read(clubSettingsCache, clubId) : undefined;
export const setCachedClubSettings = (clubId: string, data: any) => clubSettingsCache.set(clubId, { data, fetchedAt: Date.now() });
export const preloadClubSettings = (clubId: string, force = false) => cached(clubSettingsCache, clubId, async () => {
  const { data } = await db.from('clubs').select('name, tagline, about, category, logo_url, social_instagram, social_linkedin').eq('id', clubId).maybeSingle();
  return data ?? null;
}, force, null);

export const getCachedUpcomingEvents = () => read(upcomingEventsCache, 'upcoming');
export const preloadUpcomingEvents = (force = false) => cached(upcomingEventsCache, 'upcoming', async () => {
  const now = new Date().toISOString();
  const { data } = await db
    .from('events')
    .select('id, name, event_date, end_date, description, event_type, category, access_type, attendance_given, clubs(name)')
    .gte('event_date', now)
    .order('event_date', { ascending: true })
    .limit(10);
  return (data ?? []).map(formatUpcomingEvent);
}, force, []);

export const getCachedClubMembers = (clubId: string) => read(clubMembersCache, clubId);
export const preloadClubMembers = (clubId: string, force = false) => cached(clubMembersCache, clubId, async () => {
  const { data: membersData, error } = await db.from('club_members').select('id, user_id, role, joined_at').eq('club_id', clubId).order('joined_at', { ascending: true });
  if (error) return [];
  if (!membersData || membersData.length === 0) return [];
  const userIds = membersData.map((m: any) => m.user_id);
  const { data: profilesData } = await db.from('profiles').select('user_id, full_name, email, programme, roll_no, avatar_url, phone, year, section, about, social_linkedin, social_instagram, social_gmail').in('user_id', userIds);
  const profileMap = new Map((profilesData ?? []).map((p: any) => [p.user_id, p]));
  return membersData.map((m: any) => ({
    id: m.id,
    user_id: m.user_id,
    role: m.role,
    joined_at: m.joined_at,
    ...((profileMap.get(m.user_id) as Record<string, any> | undefined) ?? {}),
  }));
}, force, []);

export const getCachedJoinRequests = (clubId: string) => read(joinRequestsCache, clubId);
export const preloadJoinRequests = (clubId: string, force = false) => cached(joinRequestsCache, clubId, async () => {
  const { data, error } = await db.from('club_join_requests').select('id, user_id, message, status, created_at').eq('club_id', clubId).eq('status', 'pending').order('created_at', { ascending: true });
  if (error || !data) return [];
  const userIds = data.map((r: any) => r.user_id);
  if (userIds.length === 0) return [];
  const { data: profiles } = await db.from('profiles').select('user_id, full_name, email, programme, roll_no').in('user_id', userIds);
  const profileMap = new Map((profiles ?? []).map((p: any) => [p.user_id, p]));
  return data.map((r: any) => ({ ...r, full_name: (profileMap.get(r.user_id) as any)?.full_name || 'Unknown', email: (profileMap.get(r.user_id) as any)?.email || null, programme: (profileMap.get(r.user_id) as any)?.programme || null, roll_no: (profileMap.get(r.user_id) as any)?.roll_no || null }));
}, force, []);

export const getCachedAssignableMembers = (clubId: string) => read(assignableMembersCache, clubId);
export const preloadAssignableMembers = (clubId: string, force = false) => cached(assignableMembersCache, clubId, async () => {
  const { data: memberRows, error } = await db.from('club_members').select('user_id, role').eq('club_id', clubId).neq('role', 'president').neq('role', 'member').neq('role', 'admin');
  if (error || !memberRows?.length) return [];
  const userIds = memberRows.map((m: any) => m.user_id);
  const { data: profileRows } = await db.from('profiles').select('user_id, full_name').in('user_id', userIds);
  const profileMap = new Map((profileRows ?? []).map((p: any) => [p.user_id, p]));
  return memberRows.map((m: any) => ({ user_id: m.user_id, role: m.role, full_name: (profileMap.get(m.user_id) as any)?.full_name ?? 'Unknown' }));
}, force, []);

export type RoutePreloadContext = {
  userId?: string | null;
  email?: string | null;
  activeClubId?: string | null;
  clubIds?: string[];
};

export const preloadRouteData = (path: string, ctx: RoutePreloadContext, force = false) => {
  if (!ctx.userId) return Promise.resolve([] as PromiseSettledResult<unknown>[]);

  const clubIds = Array.from(new Set([ctx.activeClubId, ...(ctx.clubIds ?? [])].filter(Boolean) as string[]));
  const activeClubId = ctx.activeClubId ?? clubIds[0];
  const tasks: Promise<unknown>[] = [preloadProfile(ctx.userId, force), preloadUserClubs(ctx.userId, force)];

  if (path === '/admin' || path === '/dashboard') {
    tasks.push(preloadPersonalStats(ctx.userId, force), preloadUpcomingEvents(force), preloadEvents('personal', null, force));
  }
  if (path === '/events' || path === '/scan' || path === '/calendar') {
    tasks.push(preloadEvents('personal', null, force));
    if (activeClubId) tasks.push(preloadEvents('club', activeClubId, force));
  }
  if (path === '/discover') tasks.push(preloadDiscoverClubs(ctx.userId, force));
  if (path === '/attendance-history') tasks.push(preloadPersonalStats(ctx.userId, force));
  if (path === '/profile' || path === '/settings') tasks.push(preloadProfile(ctx.userId, force));
  if (path === '/super-admin' || path === '/global-reports') {
    tasks.push(preloadAdminStatus(ctx.userId, ctx.email, force), preloadSuperAdminStats(force));
  }
  if (path === '/manage-outsiders') tasks.push(preloadOutsiders(force));
  if (activeClubId && (path === '/clubs' || path.startsWith('/club/'))) {
    tasks.push(preloadClubStats(activeClubId, force), preloadClubMembers(activeClubId, force), preloadJoinRequests(activeClubId, force));
  }
  if (activeClubId && path === '/club-settings') tasks.push(preloadClubSettings(activeClubId, force));
  if (activeClubId && path === '/assign-powers') tasks.push(preloadDelegatedPowers(ctx.userId, activeClubId, force), preloadAssignableMembers(activeClubId, force));
  if (activeClubId && path === '/create-event') tasks.push(preloadDelegatedPowers(ctx.userId, activeClubId, force), preloadClubSettings(activeClubId, force));
  if (activeClubId && (path === '/chatbot' || path === '/reviews')) tasks.push(preloadEvents('club', activeClubId, force));

  return Promise.allSettled(tasks);
};
