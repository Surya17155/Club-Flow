import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, Clock, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

interface JoinRequest {
  id: string;
  user_id: string;
  message: string | null;
  status: string;
  created_at: string;
  full_name: string;
  email: string | null;
  programme: string | null;
  roll_no: string | null;
}

const JoinRequestsPanel = ({ clubId }: { clubId: string }) => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('club_join_requests')
      .select('id, user_id, message, status, created_at')
      .eq('club_id', clubId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true });

    if (error || !data) { setLoading(false); return; }

    if (data.length > 0) {
      const userIds = data.map((r: any) => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, programme, roll_no')
        .in('user_id', userIds);

      const profileMap: Record<string, any> = {};
      (profiles ?? []).forEach((p: any) => { profileMap[p.user_id] = p; });

      setRequests(data.map((r: any) => ({
        ...r,
        full_name: profileMap[r.user_id]?.full_name || 'Unknown',
        email: profileMap[r.user_id]?.email || null,
        programme: profileMap[r.user_id]?.programme || null,
        roll_no: profileMap[r.user_id]?.roll_no || null,
      })));
    } else {
      setRequests([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, [clubId]);

  const handleAction = async (request: JoinRequest, action: 'approved' | 'rejected') => {
    if (action === 'approved') {
      // Insert into club_members
      const { error: memberError } = await supabase.from('club_members').insert({
        club_id: clubId,
        user_id: request.user_id,
        role: 'member',
      });
      if (memberError) {
        toast.error(memberError.message.includes('duplicate') ? 'User is already a member.' : 'Failed to add member.');
        return;
      }
    }

    const { error } = await supabase
      .from('club_join_requests')
      .update({ status: action, reviewed_by: user!.id, updated_at: new Date().toISOString() })
      .eq('id', request.id);

    if (error) {
      toast.error('Failed to update request.');
    } else {
      toast.success(action === 'approved' ? `${request.full_name} has been added to the club!` : `Request from ${request.full_name} declined.`);
      setRequests(prev => prev.filter(r => r.id !== request.id));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground text-sm italic">
        No pending join requests
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map(req => (
        <div key={req.id} className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-white/40">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <UserPlus className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">{req.full_name}</p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
              {req.roll_no && <span>{req.roll_no}</span>}
              {req.programme && <span>• {req.programme}</span>}
              <span>• {new Date(req.created_at).toLocaleDateString()}</span>
            </div>
            {req.message && (
              <p className="text-xs text-muted-foreground mt-1 italic">"{req.message}"</p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <Button size="sm" className="rounded-full gradient-gold text-primary-foreground" onClick={() => handleAction(req, 'approved')}>
              <Check className="w-4 h-4" />
            </Button>
            <Button size="sm" variant="outline" className="rounded-full text-destructive" onClick={() => handleAction(req, 'rejected')}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default JoinRequestsPanel;
