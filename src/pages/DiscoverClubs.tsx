import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Search, Users, Send, Check, Clock, X } from 'lucide-react';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useIsMobile } from '@/hooks/use-mobile';
import { useDesign } from '@/contexts/DesignContext';
import { getCachedDiscoverClubs, preloadDiscoverClubs } from '@/lib/preloadCache';

interface ClubCard {
  id: string;
  name: string;
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  category: string | null;
  club_type: string | null;
  memberCount: number;
}

const NEO = {
  card: {
    background: '#FFFFFF',
    border: '2px solid #111111',
    borderRadius: '12px',
    boxShadow: '4px 4px 0px #111111',
  } as React.CSSProperties,
  font: "'Space Grotesk', sans-serif",
  btnPrimary: {
    background: '#E98A3A',
    color: '#111111',
    border: '2px solid #111111',
    borderRadius: '10px',
    boxShadow: '3px 3px 0px #111111',
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
  } as React.CSSProperties,
  btnOutline: {
    background: '#FFFDF5',
    color: '#111111',
    border: '2px solid #111111',
    borderRadius: '10px',
    boxShadow: '2px 2px 0px #111111',
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 600,
  } as React.CSSProperties,
  badge: {
    border: '2px solid #111',
    borderRadius: '6px',
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
    fontSize: '10px',
  } as React.CSSProperties,
};

const hoverIn = (e: React.MouseEvent<HTMLElement>) => {
  e.currentTarget.style.transform = 'translate(-2px, -2px)';
  e.currentTarget.style.boxShadow = '6px 6px 0px #111111';
};
const hoverOut = (e: React.MouseEvent<HTMLElement>) => {
  e.currentTarget.style.transform = 'translate(0, 0)';
  e.currentTarget.style.boxShadow = '4px 4px 0px #111111';
};

const DiscoverClubs = () => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const { activeDesign } = useDesign();
  const isNeo = activeDesign === 'design-2';
  const cachedDiscover = user ? getCachedDiscoverClubs(user.id) : undefined;
  const [clubs, setClubs] = useState<ClubCard[]>(cachedDiscover?.clubs ?? []);
  const [search, setSearch] = useState('');
  const [myClubIds, setMyClubIds] = useState<Set<string>>(() => new Set(cachedDiscover?.myClubIds ?? []));
  const [myRequests, setMyRequests] = useState<Map<string, string>>(() => new Map(cachedDiscover?.myRequests ?? []));
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState<ClubCard | null>(null);
  const [joinMessage, setJoinMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    const cached = getCachedDiscoverClubs(user!.id);
    if (cached) {
      setClubs(cached.clubs);
      setMyClubIds(new Set(cached.myClubIds));
      setMyRequests(new Map(cached.myRequests));
    }
    const data = await preloadDiscoverClubs(user!.id);
    setClubs(data.clubs);
    setMyClubIds(new Set(data.myClubIds));
    setMyRequests(new Map(data.myRequests));
  };

  const handleJoinRequest = async () => {
    if (!selectedClub || !user) return;
    setSubmitting(true);
    const { error } = await supabase.from('club_join_requests').insert({ user_id: user.id, club_id: selectedClub.id, message: joinMessage.trim() || null });
    if (error) {
      toast.error(error.message.includes('duplicate') ? 'You already have a pending request.' : 'Failed to send request.');
    } else {
      toast.success('Join request sent!');
      setMyRequests(prev => new Map(prev).set(selectedClub.id, 'pending'));
    }
    setJoinDialogOpen(false);
    setJoinMessage('');
    setSubmitting(false);
  };

  const handleCancelRequest = async (clubId: string) => {
    const { error } = await supabase.from('club_join_requests').delete().eq('club_id', clubId).eq('user_id', user!.id);
    if (!error) {
      toast.success('Request cancelled');
      setMyRequests(prev => { const m = new Map(prev); m.delete(clubId); return m; });
    }
  };

  if (!user) return <div className="min-h-screen" style={{ backgroundColor: '#F4EFE7' }} />;

  const filtered = clubs.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.tagline?.toLowerCase().includes(search.toLowerCase()) ||
    c.category?.toLowerCase().includes(search.toLowerCase())
  );

  const content = (
    <>
      <header className="flex flex-col sm:flex-row justify-between items-center sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="text-center md:text-left">
            <h1 className="text-xl md:text-2xl font-bold" style={isNeo ? { fontFamily: NEO.font, color: '#111', letterSpacing: '-0.02em' } : {}}>
              Discover Clubs
            </h1>
            <p className="text-sm" style={{ color: isNeo ? '#888' : undefined }}>Browse and request to join clubs</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#888' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search clubs..."
              className="py-2 pl-10 pr-4 w-full sm:w-64 text-sm outline-none"
              style={isNeo ? {
                border: '2px solid #111',
                borderRadius: '10px',
                background: '#FFFDF5',
                fontFamily: NEO.font,
              } : {
                borderRadius: '9999px',
                background: 'rgba(255,255,255,0.5)',
                border: '1px solid var(--border)',
              }}
            />
          </div>
          
        </div>
      </header>

      {filtered.length === 0 ? (
        <div className="text-center py-12" style={{ color: '#888', fontFamily: isNeo ? NEO.font : undefined }}>No clubs found</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map(club => {
            const isMember = myClubIds.has(club.id);
            const requestStatus = myRequests.get(club.id);

            if (!isNeo) {
              return (
                <div key={club.id} className="glass-card p-5 sm:p-6 flex flex-col">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      {club.logo_url ? <img src={club.logo_url} alt={club.name} className="w-10 h-10 rounded-full object-cover" /> : <span className="text-primary font-bold text-lg">{club.name[0]}</span>}
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-foreground truncate">{club.name}</h3>
                      {club.tagline && <p className="text-xs text-muted-foreground truncate">{club.tagline}</p>}
                    </div>
                  </div>
                  {club.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{club.description}</p>}
                  <div className="flex items-center gap-2 mb-4 flex-wrap">
                    <Badge variant="secondary" className="text-xs"><Users className="w-3 h-3 mr-1" />{club.memberCount} members</Badge>
                    {club.category && <Badge variant="outline" className="text-xs">{club.category}</Badge>}
                  </div>
                  <div className="mt-auto">
                    {isMember ? <Button disabled className="w-full rounded-full" variant="secondary"><Check className="w-4 h-4 mr-1" /> Already a Member</Button>
                    : requestStatus === 'pending' ? (
                      <div className="flex gap-2">
                        <Button disabled className="flex-1 rounded-full" variant="secondary"><Clock className="w-4 h-4 mr-1" /> Pending</Button>
                        <Button variant="ghost" size="icon" className="rounded-full text-destructive" onClick={() => handleCancelRequest(club.id)}><X className="w-4 h-4" /></Button>
                      </div>
                    ) : requestStatus === 'rejected' ? <Button disabled className="w-full rounded-full" variant="outline">Request Declined</Button>
                    : <Button className="w-full rounded-full gradient-gold text-primary-foreground" onClick={() => { setSelectedClub(club); setJoinDialogOpen(true); }}><Send className="w-4 h-4 mr-1" /> Request to Join</Button>}
                  </div>
                </div>
              );
            }

            // Neo card
            return (
              <div
                key={club.id}
                className="flex flex-col p-5 transition-all duration-200"
                style={NEO.card}
                onMouseEnter={hoverIn}
                onMouseLeave={hoverOut}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                    style={{ border: '2px solid #111', background: '#FFF8E1' }}
                  >
                    {club.logo_url ? <img src={club.logo_url} alt={club.name} className="w-10 h-10 rounded-full object-cover" /> : <span className="font-bold text-lg" style={{ color: '#E98A3A' }}>{club.name[0]}</span>}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold truncate" style={{ fontFamily: NEO.font, color: '#111' }}>{club.name}</h3>
                    {club.tagline && <p className="text-xs truncate" style={{ color: '#888' }}>{club.tagline}</p>}
                  </div>
                </div>
                {club.description && <p className="text-sm mb-3 line-clamp-2" style={{ color: '#555' }}>{club.description}</p>}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span className="text-[10px] font-bold px-2 py-0.5 flex items-center gap-1" style={{ ...NEO.badge, background: '#FFF8E1' }}>
                    <Users className="w-3 h-3" />{club.memberCount} members
                  </span>
                  {club.category && <span className="text-[10px] font-bold px-2 py-0.5" style={{ ...NEO.badge, background: '#FFFDF5' }}>{club.category}</span>}
                </div>
                <div className="mt-auto">
                  {isMember ? (
                    <button disabled className="w-full py-2.5 text-sm opacity-60" style={{ ...NEO.btnOutline, cursor: 'not-allowed' }}>
                      <Check className="w-4 h-4 inline mr-1" /> Already a Member
                    </button>
                  ) : requestStatus === 'pending' ? (
                    <div className="flex gap-2">
                      <button disabled className="flex-1 py-2.5 text-sm opacity-60" style={{ ...NEO.btnOutline, cursor: 'not-allowed' }}>
                        <Clock className="w-4 h-4 inline mr-1" /> Pending
                      </button>
                      <button
                        className="px-3 py-2.5 text-sm transition-all"
                        style={{ ...NEO.btnOutline, color: '#DC2626' }}
                        onClick={() => handleCancelRequest(club.id)}
                        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate(-1px, -1px)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.transform = 'translate(0,0)'; }}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : requestStatus === 'rejected' ? (
                    <button disabled className="w-full py-2.5 text-sm opacity-60" style={{ ...NEO.btnOutline, cursor: 'not-allowed' }}>Request Declined</button>
                  ) : (
                    <button
                      className="w-full py-2.5 text-sm flex items-center justify-center gap-2 transition-all"
                      style={NEO.btnPrimary}
                      onClick={() => { setSelectedClub(club); setJoinDialogOpen(true); }}
                      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translate(-1px, -1px)'; e.currentTarget.style.boxShadow = '4px 4px 0px #111'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translate(0,0)'; e.currentTarget.style.boxShadow = '3px 3px 0px #111'; }}
                    >
                      <Send className="w-4 h-4" /> Request to Join
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
        <DialogContent
          className="sm:max-w-md"
          style={isNeo ? { border: '3px solid #111', borderRadius: '16px', boxShadow: '6px 6px 0px #111', background: '#FFFDF5' } : {}}
        >
          <DialogHeader>
            <DialogTitle style={isNeo ? { fontFamily: NEO.font } : {}}>Request to Join {selectedClub?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium" style={{ color: '#111' }}>Message (optional)</label>
              <Textarea
                placeholder="Tell the club president why you'd like to join..."
                value={joinMessage}
                onChange={e => setJoinMessage(e.target.value)}
                className="mt-1"
                rows={3}
                style={isNeo ? { border: '2px solid #111', borderRadius: '10px', background: '#FFFDF5' } : {}}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setJoinDialogOpen(false)}
                className="px-5 py-2 text-sm transition-all"
                style={isNeo ? NEO.btnOutline : {}}
                onMouseEnter={isNeo ? (e) => { e.currentTarget.style.transform = 'translate(-1px, -1px)'; } : undefined}
                onMouseLeave={isNeo ? (e) => { e.currentTarget.style.transform = 'translate(0,0)'; } : undefined}
              >
                Cancel
              </button>
              <button
                onClick={handleJoinRequest}
                disabled={submitting}
                className="px-5 py-2 text-sm transition-all"
                style={isNeo ? NEO.btnPrimary : {}}
                onMouseEnter={isNeo ? (e) => { e.currentTarget.style.transform = 'translate(-1px, -1px)'; e.currentTarget.style.boxShadow = '4px 4px 0px #111'; } : undefined}
                onMouseLeave={isNeo ? (e) => { e.currentTarget.style.transform = 'translate(0,0)'; e.currentTarget.style.boxShadow = '3px 3px 0px #111'; } : undefined}
              >
                {submitting ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );

  if (!isMobile) {
    return (
      <DashboardLayout showHeader={false}>
        <div className="space-y-4 sm:space-y-6 animate-fade-in">{content}</div>
      </DashboardLayout>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: isNeo ? '#F4EFE7' : undefined }}>
      <div className="relative antialiased p-4 sm:p-6 md:p-8">{content}</div>
      <MobileBottomNav />
    </div>
  );
};

export default DiscoverClubs;
