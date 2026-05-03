import { useState, useEffect } from 'react';
import { Navigate, useNavigate, useSearchParams, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useClub } from '@/contexts/ClubContext';
import { useDelegatedPowers } from '@/hooks/useDelegatedPowers';
import { useClubStats } from '@/hooks/useClubStats';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { ChevronLeft, Users, Calendar as CalendarIcon } from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  HoverCard, HoverCardContent, HoverCardTrigger,
} from '@/components/ui/hover-card';
import ManageEventsModal from '@/components/dashboard/ManageEventsModal';
import ClubPreviousEvents from '@/components/club-dashboard/ClubPreviousEvents';
import NeoBrutalCalendar from '@/components/dashboard/NeoBrutalCalendar';
import MemberManagement from '@/components/club-dashboard/MemberManagement';
import JoinRequestsPanel from '@/components/club-dashboard/JoinRequestsPanel';
import { Button } from '@/components/ui/button';
import { MobileClubProfileCard } from '@/components/mobile/MobileClubProfileCard';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';
import { DashboardLayout } from '@/components/layout/DashboardLayout';



interface PostHolder {
  user_id: string;
  role: string;
  full_name: string;
  avatar_url?: string | null;
  programme?: string | null;
  year?: string | null;
  email?: string | null;
  phone?: string | null;
  about?: string | null;
}

const roleOrder = ['president', 'vice_president', 'secretary', 'social_media_head'];

const ClubDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { activeClub } = useClub();
  const { hasPower, isPresident } = useDelegatedPowers();
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  const [searchParams] = useSearchParams();
  const { id: routeClubId } = useParams();

  const clubId = routeClubId || activeClub?.club_id;
  const [clubNameOverride, setClubNameOverride] = useState<string | null>(null);

  useEffect(() => {
    if (!routeClubId) { setClubNameOverride(null); return; }
    if (routeClubId === activeClub?.club_id) { setClubNameOverride(activeClub.club_name); return; }
    let cancelled = false;
    setClubNameOverride(null);
    supabase.from('clubs').select('name').eq('id', routeClubId).maybeSingle().then(({ data }) => {
      if (!cancelled && data) setClubNameOverride(data.name);
    });
    return () => { cancelled = true; };
  }, [routeClubId, activeClub?.club_id, activeClub?.club_name]);

  const { stats: clubStats } = useClubStats(clubId);
  const [manageEventsOpen, setManageEventsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'requests'>(
    searchParams.get('tab') === 'members' ? 'members' : searchParams.get('tab') === 'requests' ? 'requests' : 'overview'
  );

  const cameFromSuperAdmin = location.state?.from === 'super-admin';
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isRoleCheckComplete, setIsRoleCheckComplete] = useState(false);

  useEffect(() => {
    if (!user) return;
    const checkSuperAdmin = async () => {
      setIsRoleCheckComplete(false);
      const { data } = await supabase.from('user_roles').select('role').eq('user_id', user.id).eq('role', 'admin');
      setIsSuperAdmin(!!(data && data.length > 0));
      setIsRoleCheckComplete(true);
    };
    checkSuperAdmin();
  }, [user?.id]);

  // Club details
  const [clubDetails, setClubDetails] = useState<{ about: string | null; logo_url: string | null; social_instagram: string | null; social_linkedin: string | null; tagline: string | null }>({ about: null, logo_url: null, social_instagram: null, social_linkedin: null, tagline: null });
  useEffect(() => {
    if (!clubId) return;
    supabase.from('clubs').select('about, logo_url, social_instagram, social_linkedin, tagline').eq('id', clubId).maybeSingle().then(({ data }: any) => {
      if (data) setClubDetails(data);
    });
  }, [clubId]);

  // Post holders for mobile card
  const [postHolders, setPostHolders] = useState<PostHolder[]>([]);
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
  }, [clubId]);




  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F4EFE7' }}>
        <div className="w-8 h-8 border-[3px] border-[#111]/30 border-t-[#111] rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  if (!isRoleCheckComplete) {
    if (isMobile) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F4EFE7' }}>
          <div className="w-8 h-8 border-[3px] border-[#111]/30 border-t-[#111] rounded-full animate-spin" />
        </div>
      );
    }
    return (
      <DashboardLayout showHeader={false}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="w-8 h-8 border-[3px] border-[#111]/30 border-t-[#111] rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const hasAccess = isPresident || hasPower('manage_club') || isSuperAdmin;
  if ((!hasAccess && !isSuperAdmin) || !clubId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#F4EFE7' }}>
        <div className="p-8 text-center max-w-md border-[3px] border-[#111] rounded-[6px] bg-white" style={{ boxShadow: '4px 4px 0px #111' }}>
          <h2 className="text-xl font-bold text-[#111] mb-2" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Access Restricted</h2>
          <p className="text-sm text-[#111]/60 mb-4">Only the club president or users with official dashboard access can view this page.</p>
          <button onClick={() => navigate('/dashboard')} className="px-6 py-2.5 bg-[#E98A3A] text-[#111] font-bold text-sm border-[3px] border-[#111] rounded-[6px] hover:translate-y-[2px] hover:shadow-none transition-all" style={{ boxShadow: '3px 3px 0px #111' }}>Go to Dashboard</button>
        </div>
      </div>
    );
  }

  const clubName = routeClubId
    ? (routeClubId === activeClub?.club_id ? activeClub?.club_name : clubNameOverride) || 'Club'
    : activeClub?.club_name || clubNameOverride || 'Club';

  // Find president
  const president = postHolders.find(ph => ph.role === 'president');

  // ─── MOBILE LAYOUT ─────────────────────────────────────────
  if (isMobile) {
    return (
      <div
        className="min-h-screen pb-20 overflow-x-hidden"
        style={{ backgroundColor: '#F4EFE7', scrollbarWidth: 'none', msOverflowStyle: 'none', fontFamily: "'Space Grotesk', sans-serif" }}
      >
        <style>{`::-webkit-scrollbar { display: none; }`}</style>


        {/* Fixed header */}
        <header className="fixed top-0 left-0 right-0 z-30 px-4 pb-3 safe-area-top" style={{ backgroundColor: '#F4EFE7', paddingTop: 'calc(env(safe-area-inset-top, 0px) + 52px)' }}>


          {/* Tab toggle - Neo Brutalism */}
          <div className="flex p-1 rounded-[6px] border-[3px] border-[#111] bg-white max-w-[320px] mx-auto" style={{ boxShadow: '3px 3px 0px #111' }}>
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 py-2 px-3 rounded-[4px] text-xs font-bold transition-all ${activeTab === 'overview' ? 'bg-[#E98A3A] text-[#111] border-[2px] border-[#111]' : 'text-[#111]/50'}`}
              style={activeTab === 'overview' ? { boxShadow: '2px 2px 0px #111' } : {}}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`flex-1 py-2 px-3 rounded-[4px] text-xs font-bold transition-all ${activeTab === 'members' ? 'bg-[#E98A3A] text-[#111] border-[2px] border-[#111]' : 'text-[#111]/50'}`}
              style={activeTab === 'members' ? { boxShadow: '2px 2px 0px #111' } : {}}
            >
              Members
            </button>
            {isPresident && (
              <button
                onClick={() => setActiveTab('requests')}
                className={`flex-1 py-2 px-3 rounded-[4px] text-xs font-bold transition-all ${activeTab === 'requests' ? 'bg-[#E98A3A] text-[#111] border-[2px] border-[#111]' : 'text-[#111]/50'}`}
                style={activeTab === 'requests' ? { boxShadow: '2px 2px 0px #111' } : {}}
              >
                Requests
              </button>
            )}
          </div>
        </header>

        {/* Spacer for fixed header */}
        <div className={`${isPresident ? 'h-[130px]' : 'h-[120px]'} safe-area-top`} />

        <main className="px-4 py-4 space-y-5">
          {activeTab === 'overview' ? (
            <>
              {/* Club Profile Card */}
              <MobileClubProfileCard
                clubName={clubName}
                clubLogo={clubDetails.logo_url}
                clubAbout={clubDetails.about}
                postHolders={president ? [president] : []}
                socialInstagram={clubDetails.social_instagram}
                socialLinkedin={clubDetails.social_linkedin}
                tagline={clubDetails.tagline}
              />

              {/* Stats Row - Only 2 cards */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 text-center border-[3px] border-[#111] rounded-[6px] bg-white" style={{ boxShadow: '4px 4px 0px #111' }}>
                  <Users className="w-5 h-5 text-[#111] mx-auto mb-1.5" />
                  <h3 className="text-2xl font-black text-[#111]">{clubStats.totalMembers}</h3>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#111]/60 mt-0.5">Total Members</p>
                </div>
                <div className="p-4 text-center border-[3px] border-[#111] rounded-[6px]" style={{ backgroundColor: '#FDE8D0', boxShadow: '4px 4px 0px #111' }}>
                  <CalendarIcon className="w-5 h-5 text-[#111] mx-auto mb-1.5" />
                  <h3 className="text-2xl font-black text-[#111]">{clubStats.totalEvents}</h3>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#111]/60 mt-0.5">Total Events</p>
                </div>
              </div>

              {/* Previous Events */}
              <section>
                <ClubPreviousEvents clubId={clubId} clubName={clubName} />
              </section>
            </>
          ) : activeTab === 'members' ? (
            <MemberManagement clubId={clubId} isSuperAdmin={isSuperAdmin} />
          ) : (
            <div className="border-[3px] border-[#111] rounded-[6px] bg-white p-4" style={{ boxShadow: '4px 4px 0px #111' }}>
              <h2 className="text-base font-black text-[#111] mb-3" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Pending Join Requests</h2>
              <JoinRequestsPanel clubId={clubId} />
            </div>
          )}
        </main>

        <MobileBottomNav />
        <ManageEventsModal open={manageEventsOpen} onOpenChange={setManageEventsOpen} />
      </div>
    );
  }

  // ─── DESKTOP LAYOUT ────────────────────────────
  return (
    <DashboardLayout showHeader={false}>
      <div className="space-y-6 animate-fade-in text-foreground">
        <header className="relative z-20 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(cameFromSuperAdmin ? '/super-admin' : '/admin')}
                className="w-9 h-9 flex items-center justify-center border-[3px] border-[#111] rounded-[6px] bg-[#111] text-white hover:translate-y-[1px] transition-all"
                style={{ boxShadow: '2px 2px 0px #E98A3A' }}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl md:text-2xl font-black text-[#111]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {clubName} <span className="text-[#E98A3A]">Official</span>
              </h1>
            </div>
            {/* President info with hover card */}
            {president && (
              <div className="ml-12">
                <HoverCard openDelay={200}>
                  <HoverCardTrigger asChild>
                    <button className="flex items-center gap-2 cursor-pointer group">
                      <span
                        className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-[4px]"
                        style={{ background: '#E98A3A', color: '#111', border: '2px solid #111', fontFamily: "'Space Grotesk', sans-serif" }}
                      >
                        President
                      </span>
                      <span className="text-sm font-bold text-[#111] group-hover:text-[#E98A3A] transition-colors" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                        {president.full_name}
                      </span>
                    </button>
                  </HoverCardTrigger>
                  <HoverCardContent
                    align="start"
                    className="w-80 p-0 overflow-hidden"
                    style={{ border: '3px solid #111', borderRadius: '10px', boxShadow: '6px 6px 0px #111', background: '#FFFDF5' }}
                  >
                    <div className="p-4 flex items-center gap-4" style={{ borderBottom: '2px solid #111', background: '#FDE8D0' }}>
                      <div
                        className="w-14 h-14 rounded-full overflow-hidden shrink-0 flex items-center justify-center"
                        style={{ border: '3px solid #111', background: '#E98A3A' }}
                      >
                        {president.avatar_url ? (
                          <img src={president.avatar_url} alt={president.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg font-black text-[#111]">{president.full_name[0]}</span>
                        )}
                      </div>
                      <div>
                        <h4 className="text-base font-black text-[#111]" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{president.full_name}</h4>
                        <span
                          className="inline-block px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-[4px] mt-1"
                          style={{ background: '#E98A3A', color: '#111', border: '2px solid #111' }}
                        >
                          President
                        </span>
                      </div>
                    </div>
                    <div className="p-4 space-y-2.5 text-xs" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                      {president.programme && (
                        <div className="flex justify-between">
                          <span className="font-bold text-[#111]/50 uppercase tracking-wider">Programme</span>
                          <span className="font-bold text-[#111]">{president.programme}{president.year ? ` • ${president.year}` : ''}</span>
                        </div>
                      )}
                      {president.email && (
                        <div className="flex justify-between">
                          <span className="font-bold text-[#111]/50 uppercase tracking-wider">Email</span>
                          <span className="font-bold text-[#111] truncate ml-2">{president.email}</span>
                        </div>
                      )}
                      {president.phone && (
                        <div className="flex justify-between">
                          <span className="font-bold text-[#111]/50 uppercase tracking-wider">Phone</span>
                          <span className="font-bold text-[#111]">{president.phone}</span>
                        </div>
                      )}
                      {president.about && (
                        <div className="pt-2" style={{ borderTop: '2px solid #111' }}>
                          <span className="font-bold text-[#111]/50 uppercase tracking-wider text-[10px] block mb-1">About</span>
                          <p className="text-[#111]/70 leading-relaxed">{president.about}</p>
                        </div>
                      )}
                    </div>
                  </HoverCardContent>
                </HoverCard>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Neo Brutalism Tab Toggle */}
            <div className="flex p-1 rounded-[6px] border-[3px] border-[#111] bg-white" style={{ boxShadow: '3px 3px 0px #111' }}>
              <button onClick={() => setActiveTab('overview')} className={`px-4 py-1.5 rounded-[4px] text-sm font-bold transition-all ${activeTab === 'overview' ? 'bg-[#E98A3A] text-[#111] border-[2px] border-[#111]' : 'text-[#111]/50'}`} style={activeTab === 'overview' ? { boxShadow: '2px 2px 0px #111' } : {}}>Overview</button>
              <button onClick={() => setActiveTab('members')} className={`px-4 py-1.5 rounded-[4px] text-sm font-bold transition-all ${activeTab === 'members' ? 'bg-[#E98A3A] text-[#111] border-[2px] border-[#111]' : 'text-[#111]/50'}`} style={activeTab === 'members' ? { boxShadow: '2px 2px 0px #111' } : {}}>Members</button>
              {isPresident && (
                <button onClick={() => setActiveTab('requests')} className={`px-4 py-1.5 rounded-[4px] text-sm font-bold transition-all ${activeTab === 'requests' ? 'bg-[#E98A3A] text-[#111] border-[2px] border-[#111]' : 'text-[#111]/50'}`} style={activeTab === 'requests' ? { boxShadow: '2px 2px 0px #111' } : {}}>Requests</button>
              )}
            </div>
          </div>
        </header>

        {activeTab === 'overview' ? (
          <>
            {/* Stats - 2 cards */}
            <section className="grid grid-cols-2 md:grid-cols-2 gap-4 max-w-md">
              <div className="p-5 text-center border-[3px] border-[#111] rounded-[6px] bg-white" style={{ boxShadow: '4px 4px 0px #111' }}>
                <Users className="w-6 h-6 text-[#111] mx-auto mb-2" />
                <h3 className="text-3xl font-black text-[#111]">{clubStats.totalMembers}</h3>
                <p className="text-xs font-bold uppercase tracking-wider text-[#111]/60 mt-1">Total Members</p>
              </div>
              <div className="p-5 text-center border-[3px] border-[#111] rounded-[6px]" style={{ backgroundColor: '#FDE8D0', boxShadow: '4px 4px 0px #111' }}>
                <CalendarIcon className="w-6 h-6 text-[#111] mx-auto mb-2" />
                <h3 className="text-3xl font-black text-[#111]">{clubStats.totalEvents}</h3>
                <p className="text-xs font-bold uppercase tracking-wider text-[#111]/60 mt-1">Total Events</p>
              </div>
            </section>

            <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8">
                {/* Calendar - same as personal dashboard */}
                <div className="border-[3px] border-[#111] rounded-[6px] bg-white overflow-hidden" style={{ boxShadow: '4px 4px 0px #111' }}>
                  <NeoBrutalCalendar mode="club" />
                </div>
              </div>
              <div className="lg:col-span-4">
                <ClubPreviousEvents clubId={clubId} clubName={clubName} />
              </div>
            </main>
          </>
        ) : activeTab === 'members' ? (
          <MemberManagement clubId={clubId} isSuperAdmin={isSuperAdmin} />
        ) : (
          <div className="border-[3px] border-[#111] rounded-[6px] bg-white p-6" style={{ boxShadow: '4px 4px 0px #111' }}>
            <h2 className="text-lg font-black text-[#111] mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Pending Join Requests</h2>
            <JoinRequestsPanel clubId={clubId} />
          </div>
        )}

        <ManageEventsModal open={manageEventsOpen} onOpenChange={setManageEventsOpen} />
      </div>
    </DashboardLayout>
  );
};

export default ClubDashboard;
