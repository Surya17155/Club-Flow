import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Instagram, Linkedin, Phone, Tag, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface PostHolder {
  role: string;
  full_name: string;
  phone: string | null;
  programme: string | null;
  year: string | null;
}

interface ClubDetail {
  name: string;
  about: string | null;
  description: string | null;
  category: string | null;
  club_type: string | null;
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
};

const rolePriority: Record<string, number> = {
  president: 0,
  vice_president: 1,
  secretary: 2,
  social_media_head: 3,
};

export function ClubDetailOverlay({ clubId, onClose }: ClubDetailOverlayProps) {
  const [detail, setDetail] = useState<ClubDetail | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!clubId) { setDetail(null); return; }
    const fetchData = async () => {
      setLoading(true);
      const [{ data: club }, { data: members }] = await Promise.all([
        supabase.from('clubs').select('name, about, description, category, club_type, social_instagram, social_linkedin').eq('id', clubId).single(),
        supabase.from('club_members').select('role, profiles(full_name, phone, programme, year)').eq('club_id', clubId),
      ]);

      if (club) {
        const postHolders: PostHolder[] = (members ?? [])
          .filter((m: any) => m.role !== 'member')
          .map((m: any) => ({
            role: m.role,
            full_name: m.profiles?.full_name ?? 'Unknown',
            phone: m.profiles?.phone ?? null,
            programme: m.profiles?.programme ?? null,
            year: m.profiles?.year ?? null,
          }))
          .sort((a: PostHolder, b: PostHolder) => (rolePriority[a.role] ?? 99) - (rolePriority[b.role] ?? 99));

        setDetail({ ...club, postHolders });
      }
      setLoading(false);
    };
    fetchData();
  }, [clubId]);

  const president = detail?.postHolders.find(p => p.role === 'president');
  const otherHolders = detail?.postHolders.filter(p => p.role !== 'president') ?? [];

  return (
    <AnimatePresence>
      {clubId && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-[60]"
            style={{ background: 'rgba(17,17,17,0.5)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Card */}
          <motion.div
            className="fixed inset-0 z-[61] flex items-center justify-center p-5 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="pointer-events-auto relative w-full max-w-[360px] max-h-[80vh] overflow-y-auto"
              style={{
                background: '#FFFDF5',
                border: '2px solid #111',
                boxShadow: '6px 6px 0px #111',
                fontFamily: "'Space Grotesk', sans-serif",
                scrollbarWidth: 'none',
              }}
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 30, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {loading || !detail ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-7 h-7 border-[3px] border-[#E98A3A]/30 border-t-[#E98A3A] rounded-full animate-spin" />
                </div>
              ) : (
                <div className="p-5 space-y-4">
                  {/* Close button */}
                  <button
                    onClick={onClose}
                    className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center font-bold text-sm"
                    style={{
                      background: '#E98A3A',
                      border: '2px solid #111',
                      boxShadow: '2px 2px 0px #111',
                      color: '#111',
                    }}
                  >
                    ✕
                  </button>

                  {/* Club Name + Tags */}
                  <div className="pr-10">
                    <h2 className="text-lg font-black uppercase" style={{ color: '#111' }}>
                      {detail.name}
                    </h2>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {detail.category && (
                        <span
                          className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-1"
                          style={{ background: '#F6E1CF', border: '1.5px solid #111', color: '#111' }}
                        >
                          <Tag className="w-3 h-3" />{detail.category}
                        </span>
                      )}
                      {detail.club_type && (
                        <span
                          className="inline-flex items-center text-[10px] font-bold uppercase px-2 py-1"
                          style={{ background: '#FFFDF5', border: '1.5px solid #111', color: '#111' }}
                        >
                          {detail.club_type}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Divider */}
                  <div style={{ borderTop: '2px solid #111' }} />

                  {/* About */}
                  {(detail.about || detail.description) && (
                    <>
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: '#6B7280' }}>About</h3>
                        <p className="text-sm leading-relaxed" style={{ color: '#111' }}>
                          {detail.about || detail.description}
                        </p>
                      </div>
                      <div style={{ borderTop: '2px solid #111' }} />
                    </>
                  )}

                  {/* Social Links */}
                  {(detail.social_instagram || detail.social_linkedin) && (
                    <>
                      <div className="flex gap-3">
                        {detail.social_instagram && (
                          <a
                            href={detail.social_instagram.startsWith('http') ? detail.social_instagram : `https://instagram.com/${detail.social_instagram}`}
                            target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2"
                            style={{ background: '#fff', border: '1.5px solid #111', boxShadow: '2px 2px 0px #111', color: '#111' }}
                          >
                            <Instagram className="w-3.5 h-3.5" />Instagram
                          </a>
                        )}
                        {detail.social_linkedin && (
                          <a
                            href={detail.social_linkedin.startsWith('http') ? detail.social_linkedin : `https://linkedin.com/company/${detail.social_linkedin}`}
                            target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2"
                            style={{ background: '#fff', border: '1.5px solid #111', boxShadow: '2px 2px 0px #111', color: '#111' }}
                          >
                            <Linkedin className="w-3.5 h-3.5" />LinkedIn
                          </a>
                        )}
                      </div>
                      <div style={{ borderTop: '2px solid #111' }} />
                    </>
                  )}

                  {/* President */}
                  {president && (
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>President</h3>
                      <div
                        className="p-3 space-y-1"
                        style={{ background: '#F6E1CF', border: '2px solid #111', boxShadow: '3px 3px 0px #111' }}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold" style={{ color: '#111' }}>{president.full_name}</span>
                          <span
                            className="text-[10px] font-black uppercase px-2 py-0.5"
                            style={{ background: '#E98A3A', border: '1.5px solid #111', color: '#111' }}
                          >
                            President
                          </span>
                        </div>
                        {(president.programme || president.year) && (
                          <p className="text-xs" style={{ color: '#6B7280' }}>
                            {[president.programme, president.year].filter(Boolean).join(' • ')}
                          </p>
                        )}
                        {president.phone && (
                          <a href={`tel:${president.phone}`} className="flex items-center gap-1.5 text-xs pt-0.5" style={{ color: '#111' }}>
                            <Phone className="w-3 h-3" />{president.phone}
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Other Post Holders */}
                  {otherHolders.length > 0 && (
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>Post Holders</h3>
                      <div className="space-y-2">
                        {otherHolders.map((ph, i) => (
                          <div
                            key={i}
                            className="p-3 space-y-1"
                            style={{ background: '#fff', border: '1.5px solid #111', boxShadow: '2px 2px 0px #111' }}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold" style={{ color: '#111' }}>{ph.full_name}</span>
                              <span
                                className="text-[10px] font-bold uppercase px-2 py-0.5"
                                style={{ background: '#FFFDF5', border: '1.5px solid #111', color: '#111' }}
                              >
                                {roleLabelMap[ph.role] ?? ph.role}
                              </span>
                            </div>
                            {(ph.programme || ph.year) && (
                              <p className="text-xs" style={{ color: '#6B7280' }}>
                                {[ph.programme, ph.year].filter(Boolean).join(' • ')}
                              </p>
                            )}
                            {ph.phone && (
                              <a href={`tel:${ph.phone}`} className="flex items-center gap-1.5 text-xs pt-0.5" style={{ color: '#111' }}>
                                <Phone className="w-3 h-3" />{ph.phone}
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
