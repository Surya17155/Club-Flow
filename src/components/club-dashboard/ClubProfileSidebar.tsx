import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface PostHolder {
  user_id: string;
  role: string;
  full_name: string;
  avatar_url: string | null;
}

const roleLabelMap: Record<string, string> = {
  president: 'President',
  vice_president: 'Vice President',
  secretary: 'Secretary',
  social_media_head: 'Social Media Head',
};

const roleOrder: ('president' | 'vice_president' | 'secretary' | 'social_media_head')[] = ['president', 'vice_president', 'secretary', 'social_media_head'];

interface Props {
  clubId: string;
  clubName: string;
  clubAbout?: string | null;
  clubLogo?: string | null;
}

const ClubProfileSidebar = ({ clubId, clubName, clubAbout, clubLogo }: Props) => {
  const [postHolders, setPostHolders] = useState<PostHolder[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('club_members')
        .select('user_id, role, profiles(full_name, avatar_url)')
        .eq('club_id', clubId)
        .in('role', roleOrder as any);
      if (data) {
        setPostHolders(
          (data as any[])
            .map(m => ({
              user_id: m.user_id,
              role: m.role,
              full_name: m.profiles?.full_name ?? 'Unknown',
              avatar_url: m.profiles?.avatar_url ?? null,
            }))
            .sort((a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role))
        );
      }
    };
    fetch();
  }, [clubId]);

  return (
    <div className="glass-card p-6 h-full flex flex-col gap-6">
      {/* Club Logo & Name */}
      <div className="flex flex-col items-center text-center mt-2">
        <div className="w-20 h-20 rounded-full bg-foreground flex items-center justify-center mb-4 shadow-xl border-4 border-white/20 overflow-hidden">
          {clubLogo ? (
            <img src={clubLogo} alt={clubName} className="w-full h-full object-cover" />
          ) : (
            <span className="text-3xl font-display font-bold text-background">{clubName[0]}</span>
          )}
        </div>
        <h2 className="text-xl font-bold text-foreground">{clubName}</h2>
        <Badge variant="outline" className="mt-2 text-xs">Official Dashboard</Badge>
      </div>

      <hr className="border-border/30" />

      {/* About */}
      {clubAbout && (
        <>
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">About</h3>
            <p className="text-sm text-foreground/80 leading-relaxed">{clubAbout}</p>
          </div>
          <hr className="border-border/30" />
        </>
      )}

      {/* Post-holders */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Current Post-holders</h3>
        <div className="space-y-2">
          {postHolders.length > 0 ? postHolders.map(ph => (
            <div key={ph.user_id} className="bg-white/30 rounded-xl p-3 flex justify-between items-center text-sm">
              <span className="font-medium text-muted-foreground">{roleLabelMap[ph.role] ?? ph.role}</span>
              <span className="font-semibold text-foreground">{ph.full_name}</span>
            </div>
          )) : (
            <p className="text-sm text-muted-foreground italic">No post-holders assigned</p>
          )}
        </div>
      </div>

      <div className="mt-auto" />
    </div>
  );
};

export default ClubProfileSidebar;
