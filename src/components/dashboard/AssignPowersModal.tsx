import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useClub } from '@/contexts/ClubContext';
import { useDelegatedPowers, AVAILABLE_POWERS } from '@/hooks/useDelegatedPowers';
import { toast } from 'sonner';
import { Shield, Loader2 } from 'lucide-react';
import VerifiedBadge, { getRoleBadgeVariant } from '@/components/ui/VerifiedBadge';

interface ClubMember {
  user_id: string;
  role: string;
  full_name: string;
}

const roleLabelMap: Record<string, string> = {
  admin: 'Admin', president: 'President', vice_president: 'Vice President',
  social_media_head: 'Social Media Head', social_media_coordinator: 'Social Media Coordinator',
  technical_pr_head: 'Technical & PR Head', technical_pr_coordinator: 'Technical & PR Coordinator',
  general_secretary: 'General Secretary', secretary: 'Secretary',
  deputy_secretary: 'Deputy Secretary', treasurer: 'Treasurer',
  deputy_treasurer: 'Deputy Treasurer', assistant_treasurer: 'Assistant Treasurer',
  member: 'Member',
};

interface AssignPowersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clubId?: string;
}

const AssignPowersModal = ({ open, onOpenChange, clubId }: AssignPowersModalProps) => {
  const { activeClub } = useClub();
  const effectiveClubId = clubId || activeClub?.club_id;
  const { powers, grantPower, revokePower, loading: powersLoading } = useDelegatedPowers(effectiveClubId);
  const [members, setMembers] = useState<ClubMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !effectiveClubId) return;
    const fetchMembers = async () => {
      setLoading(true);
      const { data: memberRows, error: memberError } = await supabase
        .from('club_members')
        .select('user_id, role')
        .eq('club_id', effectiveClubId)
        .neq('role', 'president');

      if (!memberError && memberRows) {
        const userIds = memberRows.map((member) => member.user_id);
        let profileMap = new Map<string, { full_name: string | null }>();

        if (userIds.length > 0) {
          const { data: profileRows } = await supabase
            .from('profiles')
            .select('user_id, full_name')
            .in('user_id', userIds);

          profileMap = new Map((profileRows ?? []).map((profile) => [profile.user_id, profile]));
        }

        setMembers(memberRows.map((member) => ({
          user_id: member.user_id,
          role: member.role,
          full_name: profileMap.get(member.user_id)?.full_name ?? 'Unknown',
        })));
      } else {
        setMembers([]);
      }
      setLoading(false);
    };
    fetchMembers();
  }, [open, effectiveClubId]);

  const hasPower = (userId: string, power: string) =>
    powers.some(p => p.user_id === userId && p.power === power);

  const handleToggle = async (userId: string, power: string, currentlyHas: boolean) => {
    const key = `${userId}-${power}`;
    setToggling(key);
    const error = currentlyHas
      ? await revokePower(userId, power)
      : await grantPower(userId, power);
    if (error) {
      toast.error('Failed to update power');
    } else {
      toast.success(currentlyHas ? 'Power revoked' : 'Power granted');
    }
    setToggling(null);
  };

  // Filter to non-president, non-admin members (people who need delegation)
  const delegatableMembers = members.filter(m => m.role !== 'admin');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-white/20 max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display gradient-gold bg-clip-text text-transparent text-lg">
            <Shield className="w-5 h-5 text-primary" />
            Assign Powers
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Delegate specific abilities to club post holders
          </p>
        </DialogHeader>

        {loading || powersLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : delegatableMembers.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No members to delegate powers to.</p>
        ) : (
          <div className="space-y-4 mt-2">
            {delegatableMembers.map(member => (
              <div key={member.user_id} className="glass-input rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-foreground inline-flex items-center">{member.full_name}{getRoleBadgeVariant(member.role) && <VerifiedBadge variant={getRoleBadgeVariant(member.role)!} size={14} />}</p>
                    <p className="text-xs text-muted-foreground">{roleLabelMap[member.role] ?? member.role}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {AVAILABLE_POWERS.map(power => {
                    const has = hasPower(member.user_id, power.key);
                    const isToggling = toggling === `${member.user_id}-${power.key}`;
                    return (
                      <div key={power.key} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-white/30 transition-colors">
                        <div>
                          <p className="text-sm font-medium text-foreground">{power.label}</p>
                          <p className="text-xs text-muted-foreground">{power.description}</p>
                        </div>
                        <Switch
                          checked={has}
                          onCheckedChange={() => handleToggle(member.user_id, power.key, has)}
                          disabled={isToggling}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AssignPowersModal;
