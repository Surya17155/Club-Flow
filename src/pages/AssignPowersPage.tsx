import { useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { DashboardSidebar } from '@/components/layout/DashboardSidebar';
import { Switch } from '@/components/ui/switch';
import { useClub } from '@/contexts/ClubContext';
import { useDelegatedPowers, AVAILABLE_POWERS } from '@/hooks/useDelegatedPowers';
import { toast } from 'sonner';
import { Shield, ChevronDown } from 'lucide-react';
import VerifiedBadge, { getRoleBadgeVariant } from '@/components/ui/VerifiedBadge';
import { motion, AnimatePresence } from 'framer-motion';
import { getCachedAssignableMembers, preloadAssignableMembers } from '@/lib/preloadCache';

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

const AssignPowersPage = () => {
  const { activeClub } = useClub();
  const { powers, grantPower, revokePower } = useDelegatedPowers(activeClub?.club_id);
  const [members, setMembers] = useState<ClubMember[]>(() => activeClub ? (getCachedAssignableMembers(activeClub.club_id) ?? []) as ClubMember[] : []);
  const [toggling, setToggling] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeClub) return;
    const fetchMembers = async () => {
      const cached = getCachedAssignableMembers(activeClub.club_id);
      if (cached) setMembers(cached as ClubMember[]);
      setMembers(await preloadAssignableMembers(activeClub.club_id, true) as ClubMember[]);
    };
    fetchMembers();
  }, [activeClub?.club_id]);

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

  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen flex antialiased" style={{ backgroundColor: '#F4EFE7' }}>
      {!isMobile && <DashboardSidebar />}
      <div className="flex-1 overflow-y-auto" style={{ padding: isMobile ? '48px 16px 24px' : '24px 28px' }}>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
            <Shield className="w-6 h-6" style={{ color: '#E98A3A' }} />
            <div className="text-center md:text-left">
              <h1 className="text-2xl font-black" style={{ fontFamily: "'Space Grotesk', sans-serif", color: '#111' }}>
                Assign Powers
              </h1>
              <p className="text-sm mt-0.5" style={{ color: '#6B7280', fontFamily: "'Space Grotesk', sans-serif" }}>
                Delegate abilities to club post holders
              </p>
            </div>
          </div>

          {members.length === 0 ? (
            <div
              className="text-center py-12"
              style={{
                background: '#FFFDF7',
                border: '3px solid #111',
                borderRadius: '14px',
                boxShadow: '4px 4px 0px #111',
                fontFamily: "'Space Grotesk', sans-serif",
                color: '#6B7280',
              }}
            >
              No post holders found to delegate powers to.
            </div>
          ) : (
            <div className="space-y-3">
              {members.map(member => {
                const isExpanded = expandedId === member.user_id;
                const badgeVariant = getRoleBadgeVariant(member.role);
                return (
                  <div
                    key={member.user_id}
                    style={{
                      background: '#FFFDF7',
                      border: '3px solid #111',
                      borderRadius: '14px',
                      boxShadow: isExpanded ? '2px 2px 0px #111' : '4px 4px 0px #111',
                      transition: 'box-shadow 0.15s, transform 0.15s',
                      transform: isExpanded ? 'translate(2px,2px)' : 'none',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : member.user_id)}
                      className="flex items-center gap-3 w-full p-4 text-left"
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black shrink-0"
                        style={{ background: '#E98A3A', color: '#111', border: '2px solid #111' }}
                      >
                        {member.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate flex items-center gap-1" style={{ color: '#111', fontFamily: "'Space Grotesk', sans-serif" }}>
                          {member.full_name}
                          {badgeVariant && <VerifiedBadge variant={badgeVariant} size={14} />}
                        </p>
                        <span
                          className="text-xs px-2 py-0.5 rounded font-bold inline-block mt-0.5"
                          style={{
                            background: member.role === 'vice_president' ? '#E7E3FF' : '#DDEBFF',
                            color: '#111',
                            border: '1.5px solid #111',
                            fontFamily: "'Space Grotesk', sans-serif",
                          }}
                        >
                          {roleLabelMap[member.role] ?? member.role}
                        </span>
                      </div>
                      <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                        <ChevronDown className="w-5 h-5" style={{ color: '#111' }} />
                      </motion.div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-2" style={{ borderTop: '2px solid #111' }}>
                            <div className="pt-3 space-y-2">
                              {AVAILABLE_POWERS.map(power => {
                                const has = hasPower(member.user_id, power.key);
                                const isToggling = toggling === `${member.user_id}-${power.key}`;
                                return (
                                  <div
                                    key={power.key}
                                    className="flex items-center justify-between py-2.5 px-3"
                                    style={{
                                      background: has ? '#FFF4D6' : '#F4EFE7',
                                      border: '2px solid #111',
                                      borderRadius: '10px',
                                      boxShadow: '2px 2px 0px #111',
                                    }}
                                  >
                                    <div className="min-w-0 flex-1">
                                      <p className="text-sm font-bold" style={{ color: '#111', fontFamily: "'Space Grotesk', sans-serif" }}>{power.label}</p>
                                      <p className="text-xs" style={{ color: '#6B7280', fontFamily: "'Space Grotesk', sans-serif" }}>{power.description}</p>
                                    </div>
                                    <Switch
                                      checked={has}
                                      onCheckedChange={() => handleToggle(member.user_id, power.key, has)}
                                      disabled={isToggling}
                                      className="shrink-0 ml-3"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AssignPowersPage;
