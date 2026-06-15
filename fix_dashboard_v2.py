import sys

with open('src/pages/ClubDashboard.tsx', 'r') as f:
    content = f.read()

# 1. Update imports
content = content.replace(
    "import { getCachedAdminStatus, preloadAdminStatus } from '@/lib/preloadCache';",
    "import { getCachedAdminStatus, preloadAdminStatus, getCachedClubMembers, preloadClubMembers, getCachedClubSettings, preloadClubSettings } from '@/lib/preloadCache';"
)

# 2. Update clubNameOverride Effect
old_effect = """  useEffect(() => {
    if (!routeClubId) { setClubNameOverride(null); return; }
    if (routeClubId === activeClub?.club_id) { setClubNameOverride(activeClub.club_name); return; }
    let cancelled = false;
    setClubNameOverride(null);
    supabase.from('clubs').select('name').eq('id', routeClubId).maybeSingle().then(({ data }) => {
      if (!cancelled && data) setClubNameOverride(data.name);
    });
    return () => { cancelled = true; };
  }, [routeClubId, activeClub?.club_id, activeClub?.club_name]);"""

new_effect = """  useEffect(() => {
    if (!routeClubId) { setClubNameOverride(null); return; }
    if (routeClubId === activeClub?.club_id) { setClubNameOverride(activeClub.club_name); return; }
    let cancelled = false;
    setClubNameOverride(null);
    const fetch = async () => {
      const cached = getCachedClubSettings(routeClubId);
      if (cached) setClubNameOverride(cached.name);
      const data = await preloadClubSettings(routeClubId);
      if (!cancelled && data) setClubNameOverride(data.name);
    };
    fetch();
    return () => { cancelled = true; };
  }, [routeClubId, activeClub?.club_id, activeClub?.club_name]);"""

content = content.replace(old_effect, new_effect)

# 3. Update clubDetails logic
old_details = """  const [clubDetails, setClubDetails] = useState<{ about: string | null; logo_url: string | null; social_instagram: string | null; social_linkedin: string | null; tagline: string | null }>({ about: null, logo_url: null, social_instagram: null, social_linkedin: null, tagline: null });
  useEffect(() => {
    if (!clubId) return;
    supabase.from('clubs').select('about, logo_url, social_instagram, social_linkedin, tagline').eq('id', clubId).maybeSingle().then(({ data }: any) => {
      if (data) setClubDetails(data);
    });
  }, [clubId]);"""

new_details = """  const [clubDetails, setClubDetails] = useState(clubId ? getCachedClubSettings(clubId) ?? { about: null, logo_url: null, social_instagram: null, social_linkedin: null, tagline: null } : { about: null, logo_url: null, social_instagram: null, social_linkedin: null, tagline: null });
  useEffect(() => {
    if (!clubId) return;
    const fetch = async () => {
      const cached = getCachedClubSettings(clubId);
      if (cached) setClubDetails(cached);
      const data = await preloadClubSettings(clubId);
      if (data) setClubDetails(data);
    };
    fetch();
  }, [clubId]);"""

content = content.replace(old_details, new_details)

# 4. Update postHolders logic
old_postholders = """  const [postHolders, setPostHolders] = useState<PostHolder[]>([]);
  useEffect(() => {
    if (!clubId) return;
    const fetchPostHolders = async () => {
      const { data: membersData } = await supabase
        .from('club_members')
        .select('user_id, role')
        .eq('club_id', clubId)
        .in('role', roleOrder as any);
      if (!membersData || membersData.length === 0) { setPostHolders([]); return; }
      const userIds = membersData.map(m => m.user_id);
      const { data: profilesData } = await supabase.from('profiles').select('user_id, full_name, avatar_url, programme, year, email, phone, about').in('user_id', userIds);
      const profileMap = new Map((profilesData ?? []).map(p => [p.user_id, p]));
      setPostHolders(
        membersData
          .map(m => {
            const profile = profileMap.get(m.user_id);
            return {
              user_id: m.user_id,
              role: m.role,
              full_name: profile?.full_name ?? 'Unknown',
              avatar_url: profile?.avatar_url ?? null,
              programme: profile?.programme ?? null,
              year: profile?.year ?? null,
              email: profile?.email ?? null,
              phone: profile?.phone ?? null,
              about: profile?.about ?? null,
            };
          })
          .sort((a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role))
      );
    };
    fetchPostHolders();
  }, [clubId]);"""

new_postholders = """  const [postHolders, setPostHolders] = useState<PostHolder[]>(() => {
    if (!clubId) return [];
    const cached = getCachedClubMembers(clubId);
    return cached ? cached.filter((m: any) => roleOrder.includes(m.role)).sort((a: any, b: any) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role)) : [];
  });
  useEffect(() => {
    if (!clubId) return;
    const fetchPostHolders = async () => {
      const cached = getCachedClubMembers(clubId);
      if (cached) {
        setPostHolders(cached.filter((m: any) => roleOrder.includes(m.role)).sort((a: any, b: any) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role)));
      }
      const data = await preloadClubMembers(clubId);
      if (data) {
        setPostHolders(data.filter((m: any) => roleOrder.includes(m.role)).sort((a: any, b: any) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role)));
      }
    };
    fetchPostHolders();
  }, [clubId]);"""

content = content.replace(old_postholders, new_postholders)

with open('src/pages/ClubDashboard.tsx', 'w') as f:
    f.write(content)
