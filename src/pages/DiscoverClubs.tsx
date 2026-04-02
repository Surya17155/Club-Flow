import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Navigate, useNavigate } from 'react-router-dom';
import { Search, Users, ArrowLeft, Send, Check, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import ProfileDropdown from '@/components/dashboard/ProfileDropdown';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useIsMobile } from '@/hooks/use-mobile';

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

const DiscoverClubs = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [clubs, setClubs] = useState<ClubCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [myClubIds, setMyClubIds] = useState<Set<string>>(new Set());
  const [myRequests, setMyRequests] = useState<Map<string, string>>(new Map());
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [selectedClub, setSelectedClub] = useState<ClubCard | null>(null);
  const [joinMessage, setJoinMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user?.id]);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: clubsData }, { data: membersData }, { data: myMemberships }, { data: requests }] = await Promise.all([
      supabase.from('clubs').select('id, name, tagline, description, logo_url, category, club_type'),
      supabase.from('club_members').select('club_id'),
      supabase.from('club_members').select('club_id').eq('user_id', user!.id),
      supabase.from('club_join_requests').select('club_id, status').eq('user_id', user!.id),
    ]);

    const counts: Record<string, number> = {};
    (membersData ?? []).forEach((m: any) => {
      counts[m.club_id] = (counts[m.club_id] || 0) + 1;
    });

    setClubs((clubsData ?? []).map((c: any) => ({ ...c, memberCount: counts[c.id] || 0 })));
    setMyClubIds(new Set((myMemberships ?? []).map((m: any) => m.club_id)));
    const reqMap = new Map<string, string>();
    (requests ?? []).forEach((r: any) => reqMap.set(r.club_id, r.status));
    setMyRequests(reqMap);
    setLoading(false);
  };

  const handleJoinRequest = async () => {
    if (!selectedClub || !user) return;
    setSubmitting(true);
    const { error } = await supabase.from('club_join_requests').insert({
      user_id: user.id,
      club_id: selectedClub.id,
      message: joinMessage.trim() || null,
    });
    if (error) {
      toast.error(error.message.includes('duplicate') ? 'You already have a pending request for this club.' : 'Failed to send request.');
    } else {
      toast.success('Join request sent! The club president will review it.');
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
      setMyRequests(prev => {
        const m = new Map(prev);
        m.delete(clubId);
        return m;
      });
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center dashboard-corner-gradient">
        <div className="w-8 h-8 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;

  const filtered = clubs.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.tagline?.toLowerCase().includes(search.toLowerCase()) ||
    c.category?.toLowerCase().includes(search.toLowerCase())
  );

  const content = (
    <>
      <header className="relative z-20 flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          {isMobile && (
            <Button variant="ghost" size="icon" className="rounded-full" onClick={() => navigate('/admin')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
          )}
          <div>
            <h1 className="text-xl md:text-2xl font-bold font-display text-foreground">Discover Clubs</h1>
            <p className="text-sm text-muted-foreground">Browse and request to join clubs</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search clubs..."
              className="glass-input rounded-full py-2 pl-10 pr-4 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            />
          </div>
          {isMobile && <ProfileDropdown viewMode="personal" />}
        </div>
      </header>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No clubs found</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {filtered.map(club => {
            const isMember = myClubIds.has(club.id);
            const requestStatus = myRequests.get(club.id);
            return (
              <div key={club.id} className="glass-card p-5 sm:p-6 flex flex-col">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    {club.logo_url ? (
                      <img src={club.logo_url} alt={club.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <span className="text-primary font-bold text-lg">{club.name[0]}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-foreground truncate">{club.name}</h3>
                    {club.tagline && <p className="text-xs text-muted-foreground truncate">{club.tagline}</p>}
                  </div>
                </div>

                {club.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{club.description}</p>}

                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    <Users className="w-3 h-3 mr-1" />{club.memberCount} members
                  </Badge>
                  {club.category && <Badge variant="outline" className="text-xs">{club.category}</Badge>}
                  {club.club_type && <Badge variant="outline" className="text-xs">{club.club_type}</Badge>}
                </div>

                <div className="mt-auto">
                  {isMember ? (
                    <Button disabled className="w-full rounded-full" variant="secondary">
                      <Check className="w-4 h-4 mr-1" /> Already a Member
                    </Button>
                  ) : requestStatus === 'pending' ? (
                    <div className="flex gap-2">
                      <Button disabled className="flex-1 rounded-full" variant="secondary">
                        <Clock className="w-4 h-4 mr-1" /> Pending
                      </Button>
                      <Button variant="ghost" size="icon" className="rounded-full text-destructive" onClick={() => handleCancelRequest(club.id)}>
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : requestStatus === 'rejected' ? (
                    <Button disabled className="w-full rounded-full" variant="outline">
                      Request Declined
                    </Button>
                  ) : (
                    <Button className="w-full rounded-full gradient-gold text-primary-foreground" onClick={() => { setSelectedClub(club); setJoinDialogOpen(true); }}>
                      <Send className="w-4 h-4 mr-1" /> Request to Join
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={joinDialogOpen} onOpenChange={setJoinDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Request to Join {selectedClub?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Message (optional)</label>
              <Textarea
                placeholder="Tell the club president why you'd like to join..."
                value={joinMessage}
                onChange={e => setJoinMessage(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setJoinDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleJoinRequest} disabled={submitting} className="gradient-gold text-primary-foreground">
                {submitting ? 'Sending...' : 'Send Request'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );

  if (!isMobile) {
    return (
      <DashboardLayout showHeader={false}>
        <div className="space-y-4 sm:space-y-6 animate-fade-in text-foreground">{content}</div>
      </DashboardLayout>
    );
  }

  return <div className="min-h-screen relative antialiased p-4 sm:p-6 md:p-8 dashboard-corner-gradient text-foreground">{content}</div>;
};

export default DiscoverClubs;
