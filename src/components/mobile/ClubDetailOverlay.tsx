import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Instagram, Linkedin, Mail, Phone, Users, Tag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface PostHolder {
  role: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  social_instagram: string | null;
  social_linkedin: string | null;
}

interface ClubDetail {
  id: string;
  name: string;
  about: string | null;
  description: string | null;
  category: string | null;
  club_type: string | null;
  logo_url: string | null;
  social_instagram: string | null;
  social_linkedin: string | null;
  postHolders: PostHolder[];
}

interface ClubDetailOverlayProps {
  clubId: string | null;
  onClose: () => void;
}

const roleLabelMap: Record<string, string> = {
  president: 'President',
  vice_president: 'Vice President',
  secretary: 'Secretary',
  social_media_head: 'Social Media Head',
  member: 'Member',
};

const rolePriority: Record<string, number> = {
  president: 0,
  vice_president: 1,
  secretary: 2,
  social_media_head: 3,
  member: 4,
};

export function ClubDetailOverlay({ clubId, onClose }: ClubDetailOverlayProps) {
  const [detail, setDetail] = useState<ClubDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!clubId) { setDetail(null); return; }
    const fetch = async () => {
      setLoading(true);
      const [{ data: club }, { data: members }] = await Promise.all([
        supabase.from('clubs').select('id, name, about, description, category, club_type, logo_url, social_instagram, social_linkedin').eq('id', clubId).single(),
        supabase.from('club_members').select('role, user_id, profiles(full_name, email, phone, social_instagram, social_linkedin)').eq('club_id', clubId),
      ]);

      if (club) {
        const postHolders: PostHolder[] = (members ?? [])
          .filter((m: any) => m.role !== 'member')
          .map((m: any) => ({
            role: m.role,
            full_name: m.profiles?.full_name ?? 'Unknown',
            email: m.profiles?.email ?? null,
            phone: m.profiles?.phone ?? null,
            social_instagram: m.profiles?.social_instagram ?? null,
            social_linkedin: m.profiles?.social_linkedin ?? null,
          }))
          .sort((a: PostHolder, b: PostHolder) => (rolePriority[a.role] ?? 99) - (rolePriority[b.role] ?? 99));

        setDetail({ ...club, postHolders });
      }
      setLoading(false);
    };
    fetch();
  }, [clubId]);

  const initials = detail?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? '';

  return (
    <AnimatePresence>
      {clubId && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            onClick={onClose}
          />

          {/* Card */}
          <motion.div
            className="fixed inset-0 z-[61] flex items-center justify-center p-5 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="pointer-events-auto w-full max-w-[360px] max-h-[80vh] overflow-y-auto rounded-[22px] bg-card border border-border"
              style={{
                boxShadow: '0 25px 60px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.05)',
              }}
              initial={{ scale: 0.85, y: 40, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.85, y: 40, opacity: 0 }}
              transition={{
                type: 'spring',
                damping: 30,
                stiffness: 350,
                mass: 0.8,
              }}
            >
              {loading || !detail ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-7 h-7 border-[3px] border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {/* Close button */}
                  <button
                    onClick={onClose}
                    className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-muted/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Logo / Header */}
                  <div className="relative w-full overflow-hidden" style={{ margin: '10px 10px 0 10px', width: 'calc(100% - 20px)', aspectRatio: '16 / 9', borderRadius: '16px' }}>
                    {detail.logo_url ? (
                      <img src={detail.logo_url} alt={detail.name} className="w-full h-full object-cover" />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center text-4xl font-bold"
                        style={{ background: 'linear-gradient(145deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.25))', color: 'hsl(var(--primary))' }}
                      >
                        {initials}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="px-5 pt-4 pb-5 space-y-4">
                    {/* Name + badges */}
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold font-display text-foreground">{detail.name}</h2>
                        <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0" style={{ background: 'hsl(var(--primary))' }}>
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2.5 5L4.5 7L7.5 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {detail.category && (
                          <Badge variant="secondary" className="text-[10px]">
                            <Tag className="w-3 h-3 mr-1" />{detail.category}
                          </Badge>
                        )}
                        {detail.club_type && (
                          <Badge variant="outline" className="text-[10px]">{detail.club_type}</Badge>
                        )}
                      </div>
                    </div>

                    {/* About */}
                    {(detail.about || detail.description) && (
                      <div>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">About</h3>
                        <p className="text-sm text-foreground leading-relaxed">
                          {detail.about || detail.description}
                        </p>
                      </div>
                    )}

                    {/* Post Holders */}
                    {detail.postHolders.length > 0 && (
                      <div>
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Post Holders</h3>
                        <div className="space-y-3">
                          {detail.postHolders.map((ph, i) => (
                            <div key={i} className="rounded-xl bg-muted/40 p-3 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-foreground">{ph.full_name}</span>
                                <Badge variant="secondary" className="text-[10px] bg-primary/10 text-primary border-0">
                                  {roleLabelMap[ph.role] ?? ph.role}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {ph.email && (
                                  <a href={`mailto:${ph.email}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                                    <Mail className="w-3 h-3" />{ph.email}
                                  </a>
                                )}
                                {ph.phone && (
                                  <a href={`tel:${ph.phone}`} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                                    <Phone className="w-3 h-3" />{ph.phone}
                                  </a>
                                )}
                              </div>
                              {(ph.social_instagram || ph.social_linkedin) && (
                                <div className="flex gap-3 pt-0.5">
                                  {ph.social_instagram && (
                                    <a
                                      href={ph.social_instagram.startsWith('http') ? ph.social_instagram : `https://instagram.com/${ph.social_instagram}`}
                                      target="_blank" rel="noopener noreferrer"
                                      className="text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                      <Instagram className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                  {ph.social_linkedin && (
                                    <a
                                      href={ph.social_linkedin.startsWith('http') ? ph.social_linkedin : `https://linkedin.com/in/${ph.social_linkedin}`}
                                      target="_blank" rel="noopener noreferrer"
                                      className="text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                      <Linkedin className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Club Social Links */}
                    {(detail.social_instagram || detail.social_linkedin) && (
                      <div className="flex justify-center gap-5 pt-1 border-t border-border pt-3">
                        {detail.social_instagram && (
                          <a
                            href={detail.social_instagram.startsWith('http') ? detail.social_instagram : `https://instagram.com/${detail.social_instagram}`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Instagram className="w-5 h-5" />
                          </a>
                        )}
                        {detail.social_linkedin && (
                          <a
                            href={detail.social_linkedin.startsWith('http') ? detail.social_linkedin : `https://linkedin.com/company/${detail.social_linkedin}`}
                            target="_blank" rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <Linkedin className="w-5 h-5" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
