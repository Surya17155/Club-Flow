import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Check, X, UserPlus } from 'lucide-react';
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
        <div className="w-6 h-6 border-[3px] border-[#111]/30 border-t-[#111] rounded-full animate-spin" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-6 text-[#111]/50 text-sm font-medium">
        No pending join requests
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {requests.map(req => (
        <div key={req.id} className="flex items-center gap-4 p-4 rounded-[6px] border-[2px] border-[#111] bg-white" style={{ boxShadow: '3px 3px 0px #111' }}>
          <div className="w-10 h-10 rounded-[4px] bg-[#FDE8D0] border-[2px] border-[#111] flex items-center justify-center shrink-0">
            <UserPlus className="w-5 h-5 text-[#111]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-[#111]">{req.full_name}</p>
            <div className="flex items-center gap-2 text-xs text-[#111]/50 font-medium flex-wrap">
              {req.roll_no && <span>{req.roll_no}</span>}
              {req.programme && <span>• {req.programme}</span>}
              <span>• {new Date(req.created_at).toLocaleDateString()}</span>
            </div>
            {req.message && (
              <p className="text-xs text-[#111]/40 mt-1 italic font-medium">"{req.message}"</p>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => handleAction(req, 'approved')}
              className="w-9 h-9 flex items-center justify-center bg-[#E98A3A] border-[2px] border-[#111] rounded-[4px] text-[#111] font-bold hover:translate-y-[1px] hover:shadow-none transition-all"
              style={{ boxShadow: '2px 2px 0px #111' }}
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleAction(req, 'rejected')}
              className="w-9 h-9 flex items-center justify-center bg-white border-[2px] border-[#111] rounded-[4px] text-[#111] font-bold hover:translate-y-[1px] hover:shadow-none transition-all"
              style={{ boxShadow: '2px 2px 0px #111' }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default JoinRequestsPanel;
