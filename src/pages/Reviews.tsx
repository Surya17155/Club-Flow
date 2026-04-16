import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useClub } from '@/contexts/ClubContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { MobileBottomNav } from '@/components/mobile/MobileBottomNav';
import { DesktopFrame } from '@/components/layout/DesktopFrame';
import { Star, ChevronDown, MessageSquare, User, Calendar, Clock, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { format } from 'date-fns';

const NEO = {
  font: "'Space Grotesk', sans-serif",
  card: {
    background: '#FFFDF5',
    border: '2px solid #111',
    boxShadow: '4px 4px 0px #111',
  } as React.CSSProperties,
  btnOutline: {
    background: '#FFFDF5',
    color: '#111',
    border: '2px solid #111',
    borderRadius: '8px',
    boxShadow: '2px 2px 0px #111',
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 600,
  } as React.CSSProperties,
};

interface ReviewData {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  reviewer_name: string;
  reviewer_avatar: string | null;
  reviewer_programme: string | null;
  reviewer_year: string | null;
  reviewer_email: string | null;
  reviewer_roll_no: string | null;
  reviewer_section: string | null;
  reviewer_semester: string | null;
  reviewer_about: string | null;
}

interface EventWithReviews {
  id: string;
  name: string;
  event_date: string;
  event_type: string;
  club_name: string;
  club_id: string;
  reviews: ReviewData[];
  avg_rating: number;
  review_count: number;
}

export default function Reviews() {
  const { user } = useAuth();
  const { activeClub } = useClub();
  const isMobile = useIsMobile();
  const [events, setEvents] = useState<EventWithReviews[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [profileUser, setProfileUser] = useState<ReviewData | null>(null);

  const viewMode = (localStorage.getItem('dashboardViewMode') as 'personal' | 'club') || 'personal';
  const isClubMode = viewMode === 'club';

  // Check if user is a post holder in the active club
  const isPostHolder = activeClub && ['president', 'vice_president', 'secretary', 'social_media_head', 'technical_pr_head', 'general_secretary', 'deputy_secretary', 'treasurer', 'deputy_treasurer', 'assistant_treasurer', 'social_media_coordinator', 'technical_pr_coordinator'].includes(activeClub.role);

  const canViewReviews = isClubMode && isPostHolder;

  const fetchReviews = useCallback(async () => {
    if (!user || !canViewReviews || !activeClub) { setLoading(false); return; }
    setLoading(true);

    // Fetch past events for the active club
    const { data: eventsData } = await supabase
      .from('events')
      .select('id, name, event_date, event_type, club_id, clubs(name)')
      .eq('club_id', activeClub.club_id)
      .lt('event_date', new Date().toISOString())
      .order('event_date', { ascending: false });

    if (!eventsData || eventsData.length === 0) { setEvents([]); setLoading(false); return; }

    // Fetch all feedback for these events
    const eventIds = eventsData.map(e => e.id);
    const { data: feedbackData } = await supabase
      .from('event_feedback')
      .select('*')
      .in('event_id', eventIds);

    if (!feedbackData || feedbackData.length === 0) {
      setEvents(eventsData.map(e => ({
        id: e.id,
        name: e.name,
        event_date: e.event_date,
        event_type: e.event_type,
        club_name: (e.clubs as any)?.name || '',
        club_id: e.club_id,
        reviews: [],
        avg_rating: 0,
        review_count: 0,
      })));
      setLoading(false);
      return;
    }

    // Fetch reviewer profiles
    const reviewerIds = [...new Set(feedbackData.map(f => f.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url, programme, year, email, roll_no, section, semester, about')
      .in('user_id', reviewerIds);

    const profileMap = new Map((profiles || []).map(p => [p.user_id, p]));

    const eventsWithReviews: EventWithReviews[] = eventsData.map(event => {
      const eventFeedback = feedbackData.filter(f => f.event_id === event.id);
      const reviews: ReviewData[] = eventFeedback.map(f => {
        const profile = profileMap.get(f.user_id);
        return {
          id: f.id,
          rating: f.rating,
          comment: f.comment,
          created_at: f.created_at,
          user_id: f.user_id,
          reviewer_name: profile?.full_name || 'Unknown',
          reviewer_avatar: profile?.avatar_url || null,
          reviewer_programme: profile?.programme || null,
          reviewer_year: profile?.year || null,
          reviewer_email: profile?.email || null,
          reviewer_roll_no: profile?.roll_no || null,
          reviewer_section: profile?.section || null,
          reviewer_semester: profile?.semester || null,
          reviewer_about: profile?.about || null,
        };
      });
      const avg = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
      return {
        id: event.id,
        name: event.name,
        event_date: event.event_date,
        event_type: event.event_type,
        club_name: (event.clubs as any)?.name || '',
        club_id: event.club_id,
        reviews,
        avg_rating: Math.round(avg * 10) / 10,
        review_count: reviews.length,
      };
    });

    setEvents(eventsWithReviews);
    setLoading(false);
  }, [user?.id, activeClub?.club_id, canViewReviews]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);

  const renderStars = (rating: number, size = 'w-4 h-4') => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(s => (
        <Star key={s} className={size} style={{ fill: s <= rating ? '#E98A3A' : 'transparent', color: s <= rating ? '#E98A3A' : '#ccc' }} />
      ))}
    </div>
  );

  const content = (
    <div className="min-h-screen" style={{ background: '#F4EFE7' }}>
      {/* Header */}
      <div className={`${isMobile ? 'pt-12' : 'pt-8'} px-5 pb-4 text-center`}>
        <h1 className="text-2xl font-black" style={{ fontFamily: NEO.font, color: '#111' }}>
          Event Reviews
        </h1>
        <p className="text-sm font-semibold mt-1" style={{ color: '#888', fontFamily: NEO.font }}>
          {canViewReviews ? `${events.filter(e => e.review_count > 0).length} events with reviews` : 'Access restricted'}
        </p>
      </div>

      <div className={`${isMobile ? 'px-4 pb-28' : 'px-6 pb-8 max-w-3xl mx-auto'} space-y-3`}>
        {!canViewReviews ? (
          <div className="text-center py-20">
            <MessageSquare className="w-12 h-12 mx-auto mb-3" style={{ color: '#ccc' }} />
            <p className="text-sm font-bold" style={{ color: '#888', fontFamily: NEO.font }}>
              {isClubMode ? 'Only club post holders can view reviews.' : 'Switch to Club Mode to view event reviews.'}
            </p>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-[#E98A3A] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare className="w-12 h-12 mx-auto mb-3" style={{ color: '#ccc' }} />
            <p className="text-sm font-bold" style={{ color: '#888', fontFamily: NEO.font }}>No past events found</p>
          </div>
        ) : (
          events.map(event => {
            const isExpanded = expandedEventId === event.id;
            return (
              <div key={event.id}>
                {/* Event tile */}
                <button
                  onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                  className="w-full text-left transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
                  style={{ ...NEO.card, padding: '14px 16px' }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-black truncate" style={{ fontFamily: NEO.font, color: '#111' }}>
                        {event.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-bold" style={{ color: '#E98A3A' }}>{event.club_name}</span>
                        <span className="text-[10px]" style={{ color: '#aaa' }}>•</span>
                        <span className="text-[11px] font-semibold" style={{ color: '#888' }}>
                          {format(new Date(event.event_date), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {event.review_count > 0 && (
                        <div className="text-right">
                          <div className="flex items-center gap-1">
                            <Star className="w-3.5 h-3.5" style={{ fill: '#E98A3A', color: '#E98A3A' }} />
                            <span className="text-sm font-black" style={{ color: '#111' }}>{event.avg_rating}</span>
                          </div>
                          <span className="text-[10px] font-semibold" style={{ color: '#888' }}>
                            {event.review_count} review{event.review_count !== 1 ? 's' : ''}
                          </span>
                        </div>
                      )}
                      {event.review_count === 0 && (
                        <span className="text-[11px] font-semibold" style={{ color: '#aaa' }}>No reviews</span>
                      )}
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        style={{ color: '#888' }}
                      />
                    </div>
                  </div>
                </button>

                {/* Reviews drawer */}
                {isExpanded && (
                  <div
                    className="mt-[-2px] overflow-hidden"
                    style={{ border: '2px solid #111', borderTop: 'none', background: '#FFFDF5', boxShadow: '4px 4px 0px #111' }}
                  >
                    {event.reviews.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-sm font-semibold" style={{ color: '#aaa', fontFamily: NEO.font }}>No reviews yet</p>
                      </div>
                    ) : (
                      <div className="max-h-[320px] overflow-y-auto">
                        {event.reviews.map((review, idx) => (
                          <div
                            key={review.id}
                            className="px-4 py-3"
                            style={{ borderTop: idx > 0 ? '1px solid #e5e0d8' : 'none' }}
                          >
                            <div className="flex items-start gap-3">
                              <button onClick={() => setProfileUser(review)} className="shrink-0">
                                <Avatar className="w-9 h-9" style={{ border: '2px solid #111' }}>
                                  <AvatarImage src={review.reviewer_avatar || ''} />
                                  <AvatarFallback style={{ background: '#E98A3A', color: '#111', fontFamily: NEO.font, fontWeight: 700, fontSize: '12px' }}>
                                    {review.reviewer_name.charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                              </button>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <div>
                                    <p className="text-sm font-bold" style={{ color: '#111', fontFamily: NEO.font }}>{review.reviewer_name}</p>
                                    <p className="text-[11px]" style={{ color: '#888' }}>
                                      {[review.reviewer_programme, review.reviewer_year].filter(Boolean).join(' • ') || 'Student'}
                                    </p>
                                  </div>
                                  {renderStars(review.rating, 'w-3.5 h-3.5')}
                                </div>
                                {review.comment && (
                                  <p className="text-xs mt-1.5 leading-relaxed" style={{ color: '#444', fontFamily: NEO.font }}>
                                    {review.comment}
                                  </p>
                                )}
                                <p className="text-[10px] mt-1" style={{ color: '#bbb' }}>
                                  {format(new Date(review.created_at), 'MMM d, yyyy')}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Profile popup */}
      <Dialog open={!!profileUser} onOpenChange={(open) => { if (!open) setProfileUser(null); }}>
        <DialogContent
          className="sm:max-w-sm p-0 overflow-hidden [&>button:last-child]:hidden"
          style={{ ...NEO.card, borderRadius: '16px', fontFamily: NEO.font }}
        >
          {profileUser && (
            <>
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '2px solid #111' }}>
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="w-11 h-11" style={{ border: '2px solid #111' }}>
                    <AvatarImage src={profileUser.reviewer_avatar || ''} />
                    <AvatarFallback style={{ background: '#E98A3A', color: '#111', fontWeight: 700, fontSize: '14px' }}>
                      {profileUser.reviewer_name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h3 className="text-sm font-black truncate" style={{ color: '#111' }}>{profileUser.reviewer_name}</h3>
                    <p className="text-xs" style={{ color: '#888' }}>{profileUser.reviewer_email || 'No email'}</p>
                  </div>
                </div>
                <button
                  onClick={() => setProfileUser(null)}
                  className="w-8 h-8 flex items-center justify-center transition-all"
                  style={{ background: '#E98A3A', border: '2px solid #111', borderRadius: '8px', boxShadow: '2px 2px 0px #111' }}
                >
                  ✕
                </button>
              </div>
              <div className="px-5 py-4 space-y-3">
                {[
                  { label: 'Programme', value: profileUser.reviewer_programme },
                  { label: 'Year', value: profileUser.reviewer_year },
                  { label: 'Semester', value: profileUser.reviewer_semester },
                  { label: 'Section', value: profileUser.reviewer_section },
                  { label: 'Roll No', value: profileUser.reviewer_roll_no },
                ].filter(f => f.value).map(field => (
                  <div key={field.label} className="flex justify-between items-center py-1.5" style={{ borderBottom: '1px solid #e5e0d8' }}>
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#888' }}>{field.label}</span>
                    <span className="text-sm font-semibold" style={{ color: '#111' }}>{field.value}</span>
                  </div>
                ))}
                {profileUser.reviewer_about && (
                  <div className="pt-1">
                    <span className="text-xs font-bold uppercase tracking-wider" style={{ color: '#888' }}>About</span>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: '#444' }}>{profileUser.reviewer_about}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {isMobile && <MobileBottomNav />}
    </div>
  );

  return isMobile ? content : <DesktopFrame>{content}</DesktopFrame>;
}
