import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useClub } from '@/contexts/ClubContext';
import { useDelegatedPowers, AVAILABLE_POWERS } from '@/hooks/useDelegatedPowers';
import { toast } from 'sonner';
import { Shield, Loader2, ChevronDown } from 'lucide-react';
import VerifiedBadge, { getRoleBadgeVariant } from '@/components/ui/VerifiedBadge';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !effectiveClubId) return;
    const fetchMembers = async () => {
      setLoading(true);
      const { data: memberRows, error: memberError } = await supabase
        .from('club_members')
        .select('user_id, role')
        .eq('club_id', effectiveClubId)
        .neq('role', 'president')
        .neq('role', 'member')
        .neq('role', 'admin');

      if (!memberError && memberRows) {
        const userIds = memberRows.map((m) => m.user_id);
        let profileMap = new Map<string, { full_name: string | null }>();

        if (userIds.length > 0) {
          const { data: profileRows } = await supabase
            .from('profiles')
            .select('user_id, full_name')
            .in('user_id', userIds);
          profileMap = new Map((profileRows ?? []).map((p) => [p.user_id, p]));
        }

        setMembers(memberRows.map((m) => ({
          user_id: m.user_id,
          role: m.role,
          full_name: profileMap.get(m.user_id)?.full_name ?? 'Unknown',
        })));
      } else {
        setMembers([]);
      }
      setLoading(false);
    };
    fetchMembers();
  }, [open, effectiveClubId]);

  useEffect(() => {
    if (!open) setExpandedId(null);
  }, [open]);

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

  const getRoleColor = (role: string) => {
    if (role === 'president' || role === 'vice_president') return 'text-purple-300 bg-purple-500/20 border-purple-500/30';
    return 'text-blue-300 bg-blue-500/20 border-blue-500/30';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border max-w-md max-h-[80vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display gradient-gold bg-clip-text text-transparent text-lg">
            <Shield className="w-5 h-5 text-primary" />
            Assign Powers
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Delegate abilities to club post holders
          </p>
        </DialogHeader>

        {loading || powersLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : members.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No post holders found to delegate powers to.</p>
        ) : (
          <div className="space-y-2 mt-2">
            {members.map(member => {
              const isExpanded = expandedId === member.user_id;
              const badgeVariant = getRoleBadgeVariant(member.role);
              return (
                <div key={member.user_id} className="rounded-xl overflow-hidden bg-background border border-border shadow-sm">
                  <button
                    type="button"
                    onClick={() => setExpandedId(isExpanded ? null : member.user_id)}
                    className="flex items-center gap-3 w-full p-3 text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                      {member.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate flex items-center gap-1">
                        {member.full_name}
                        {badgeVariant && <VerifiedBadge variant={badgeVariant} size={14} />}
                      </p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${
                        member.role === 'president' || member.role === 'vice_president'
                          ? 'text-purple-700 bg-purple-100 border-purple-200'
                          : 'text-blue-700 bg-blue-100 border-blue-200'
                      }`}>
                        {roleLabelMap[member.role] ?? member.role}
                      </span>
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </motion.div>
                  </button>

                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 space-y-2 border-t border-border pt-2">
                          {AVAILABLE_POWERS.map(power => {
                            const has = hasPower(member.user_id, power.key);
                            const isToggling = toggling === `${member.user_id}-${power.key}`;
                            return (
                              <div key={power.key} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors shadow-sm">
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-medium text-foreground">{power.label}</p>
                                  <p className="text-xs text-muted-foreground">{power.description}</p>
                                </div>
                                <Switch
                                  checked={has}
                                  onCheckedChange={() => handleToggle(member.user_id, power.key, has)}
                                  disabled={isToggling}
                                  className="shrink-0 ml-2"
                                />
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AssignPowersModal;
