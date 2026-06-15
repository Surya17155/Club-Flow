import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Edit3, BarChart3, Trash2, ExternalLink, Clock, User as UserIcon, Building2, CalendarClock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useClub } from '@/contexts/ClubContext';
import { toast } from 'sonner';
import { preloadRoute } from '@/lib/routePreload';

const BG = '#F4EFE7';
const CARD = '#FFFDF5';
const BORDER = '2px solid #111';
const SHADOW = '4px 4px 0px #111';
const PAGE_SIZE = 24;

interface FormRow {
  id: string;
  title: string;
  description: string | null;
  club_id: string;
  created_by: string | null;
  is_published: boolean;
  is_public?: boolean;
  accepting_responses: boolean;
  deadline: string | null;
  created_at: string;
}

type AvailableStatus = 'pending' | 'completed' | 'closed';

export default function Forms() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeClub, clubs } = useClub();

  const [viewMode, setViewMode] = useState<'personal' | 'club'>(
    () => (localStorage.getItem('dashboardViewMode') as 'personal' | 'club') || 'personal'
  );
  useEffect(() => {
    const sync = () =>
      setViewMode((localStorage.getItem('dashboardViewMode') as 'personal' | 'club') || 'personal');
    window.addEventListener('viewModeChanged', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('viewModeChanged', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);
  const isClubMode = viewMode === 'club';

  const tab: 'available' | 'manage' = isClubMode ? 'manage' : 'available';
  const [availableStatus, setAvailableStatus] = useState<AvailableStatus>('pending');
  const [forms, setForms] = useState<FormRow[]>([]);
  const [submittedMap, setSubmittedMap] = useState<Record<string, string>>({}); // form_id -> submitted_at
  const [clubNames, setClubNames] = useState<Record<string, string>>({});
  const [creatorNames, setCreatorNames] = useState<Record<string, string>>({});
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const requestSeq = useRef(0);
  const clubIdsKey = clubs.map((club) => club.club_id).join(',');

  const isPresidentOfActive = useMemo(
    () => !!clubs.find((c) => c.club_id === activeClub?.club_id && c.role === 'president'),
    [clubs, activeClub?.club_id]
  );

  const load = useCallback(async () => {
    const seq = ++requestSeq.current;
    setLoading(true);
    let query = supabase
      .from('forms')
      .select('id, title, description, club_id, created_by, is_published, is_public, accepting_responses, deadline, created_at')
      .order('created_at', { ascending: false })
      .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);
    if (tab === 'manage') {
      if (!activeClub?.club_id) { setForms([]); setLoading(false); return; }
      query = query.eq('club_id', activeClub.club_id);
    } else {
      const clubIds = clubs.map((club) => club.club_id);
      if (clubIds.length === 0) { setForms([]); setLoading(false); return; }
      query = query.eq('is_published', true).in('club_id', clubIds);
    }
    const { data, error } = await query;
    if (seq !== requestSeq.current) return;
    if (error) { toast.error(error.message); setLoading(false); return; }
    const rows = (data as FormRow[]) || [];
    setForms(rows);

    if (rows.length) {
      const formIds = rows.map((f) => f.id);
      const clubIds = Array.from(new Set(rows.map((f) => f.club_id)));
      const creatorIds = Array.from(new Set(rows.map((f) => f.created_by).filter(Boolean) as string[]));

      const [clubsRes, profilesRes, qRes, respRes] = await Promise.all([
        clubIds.length ? supabase.from('clubs').select('id, name').in('id', clubIds) : Promise.resolve({ data: [] as any[] }),
        creatorIds.length ? supabase.from('profiles').select('user_id, full_name').in('user_id', creatorIds) : Promise.resolve({ data: [] as any[] }),
        supabase.from('form_questions').select('form_id').in('form_id', formIds),
        user
          ? supabase.from('form_responses').select('form_id, submitted_at').eq('user_id', user.id).in('form_id', formIds)
          : Promise.resolve({ data: [] as any[] }),
      ]);
      if (seq !== requestSeq.current) return;

      const cn: Record<string, string> = {};
      (clubsRes.data ?? []).forEach((c: any) => { cn[c.id] = c.name; });
      setClubNames(cn);

      const pn: Record<string, string> = {};
      (profilesRes.data ?? []).forEach((p: any) => { pn[p.user_id] = p.full_name; });
      setCreatorNames(pn);

      const qc: Record<string, number> = {};
      (qRes.data ?? []).forEach((q: any) => { qc[q.form_id] = (qc[q.form_id] ?? 0) + 1; });
      setQuestionCounts(qc);

      const sm: Record<string, string> = {};
      (respRes.data ?? []).forEach((r: any) => { sm[r.form_id] = r.submitted_at; });
      setSubmittedMap(sm);
    } else {
      setClubNames({}); setCreatorNames({}); setQuestionCounts({}); setSubmittedMap({});
    }
    setLoading(false);
  }, [activeClub?.club_id, clubIdsKey, page, tab, user?.id]);

  useEffect(() => { setPage(0); }, [tab, activeClub?.club_id, clubIdsKey]);
  useEffect(() => { load(); }, [load]);

  // Refresh on focus + on app-wide form mutations (avoids realtime overhead)
  useEffect(() => {
    const onRefresh = () => load();
    window.addEventListener('focus', onRefresh);
    window.addEventListener('formsChanged', onRefresh);
    return () => {
      window.removeEventListener('focus', onRefresh);
      window.removeEventListener('formsChanged', onRefresh);
    };
    // eslint-disable-next-line
  }, [load]);


  const now = useMemo(() => Date.now(), [forms]);

  const classify = (f: FormRow): AvailableStatus => {
    const submitted = !!submittedMap[f.id];
    const expired = f.deadline ? new Date(f.deadline).getTime() < now : false;
    if (submitted) return 'completed';
    if (expired || !f.accepting_responses) return 'closed';
    return 'pending';
  };

  const visibleForms = useMemo(() => {
    if (tab !== 'available') return forms;
    return forms.filter((f) => classify(f) === availableStatus);
  }, [forms, submittedMap, tab, availableStatus, now]);

  const countFor = (s: AvailableStatus) => forms.filter((f) => classify(f) === s).length;

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this form and all its responses?')) return;
    const { error } = await supabase.from('forms').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Form deleted'); window.dispatchEvent(new Event('formsChanged')); load(); }
  };

  const handleCreate = () => {
    if (!isClubMode) { toast.error('Switch to Club mode to create forms'); return; }
    if (!isPresidentOfActive) { toast.error('Only the club president can create forms'); return; }
    navigate('/forms/new');
  };

  const subtitle = isClubMode
    ? `Manage forms for ${activeClub?.club_name ?? 'this club'}.`
    : 'Forms shared with you from your clubs.';

  const estimateMinutes = (id: string) => Math.max(1, Math.ceil((questionCounts[id] ?? 0) * 0.5));

  const statusPill = (status: AvailableStatus) => {
    const map: Record<AvailableStatus, { bg: string; label: string }> = {
      pending: { bg: '#FDE8D0', label: 'PENDING' },
      completed: { bg: '#C7F0BA', label: 'COMPLETED' },
      closed: { bg: '#E5E5E5', label: 'CLOSED' },
    };
    const s = map[status];
    return (
      <span className="text-[10px] font-bold px-2 py-0.5" style={{ background: s.bg, border: '1.5px solid #111', borderRadius: '999px' }}>
        {s.label}
      </span>
    );
  };

  return (
    <div style={{ background: BG, fontFamily: "'Space Grotesk', sans-serif", minHeight: '100vh' }} className="px-4 py-6 md:px-8">
      <div className="max-w-5xl mx-auto">

        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black" style={{ color: '#111', letterSpacing: '-0.02em' }}>
              {isClubMode ? 'Manage Forms' : 'My Forms'}
            </h1>
            <p className="text-sm mt-1" style={{ color: '#555' }}>{subtitle}</p>
          </div>
          {isClubMode && isPresidentOfActive && (
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold transition-transform active:scale-[0.98]"
              style={{ background: '#E98A3A', color: '#111', border: BORDER, borderRadius: '6px', boxShadow: SHADOW }}
            >
              <Plus className="w-4 h-4" /> Create Form
            </button>
          )}
        </div>

        {!isClubMode && (
          <div className="text-[11px] mb-4 px-3 py-2 inline-block" style={{ background: CARD, border: '1.5px solid #111', borderRadius: '6px', color: '#666' }}>
            To create or manage forms, switch to <b>Club mode</b> from the sidebar.
          </div>
        )}

        {tab === 'available' && (
          <div className="flex flex-wrap gap-2 mb-4">
            {(['pending', 'completed', 'closed'] as AvailableStatus[]).map((s) => {
              const active = availableStatus === s;
              const label = s.charAt(0).toUpperCase() + s.slice(1);
              return (
                <button
                  key={s}
                  onClick={() => setAvailableStatus(s)}
                  className="px-3 py-1.5 text-xs font-bold"
                  style={{
                    background: active ? '#E98A3A' : CARD,
                    color: '#111',
                    border: '1.5px solid #111',
                    borderRadius: '999px',
                    boxShadow: active ? 'none' : '2px 2px 0px #111',
                  }}
                >
                  {label} ({countFor(s)})
                </button>
              );
            })}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-sm font-semibold" style={{ color: '#555' }}>Loading forms…</div>
        ) : visibleForms.length === 0 ? (
          <div className="text-center py-16 px-6" style={{ background: CARD, border: BORDER, borderRadius: '10px', boxShadow: SHADOW }}>
            <FileText className="w-12 h-12 mx-auto mb-3" style={{ color: '#E98A3A' }} />
            <div className="font-bold mb-1">
              {tab === 'manage'
                ? 'No forms yet'
                : availableStatus === 'pending'
                ? 'No pending forms'
                : availableStatus === 'completed'
                ? 'Nothing completed yet'
                : 'No closed forms'}
            </div>
            <div className="text-xs" style={{ color: '#666' }}>
              {tab === 'manage'
                ? 'Create your first form to get started.'
                : 'Forms from your clubs will appear here once published.'}
            </div>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {visibleForms.map((f) => {
              const status = tab === 'available' ? classify(f) : (f.is_published ? 'pending' : 'closed');
              const clubName = clubNames[f.club_id] ?? 'Club';
              const creatorName = f.created_by ? creatorNames[f.created_by] ?? 'Unknown' : '—';
              return (
                <div
                  key={f.id}
                  className="p-4 flex flex-col"
                  style={{ background: CARD, border: BORDER, borderRadius: '8px', boxShadow: SHADOW }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="font-bold text-base leading-tight" style={{ color: '#111' }}>{f.title}</h3>
                    {tab === 'available'
                      ? statusPill(status as AvailableStatus)
                      : (
                        <span className="text-[10px] font-bold px-2 py-0.5" style={{ background: f.is_published ? '#C7F0BA' : '#FDE8D0', border: '1.5px solid #111', borderRadius: '999px' }}>
                          {f.is_published ? 'LIVE' : 'DRAFT'}
                        </span>
                      )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold mb-2" style={{ color: '#666' }}>
                    <span className="inline-flex items-center gap-1"><Building2 className="w-3 h-3" /> {clubName}</span>
                    {tab === 'manage' ? null : (
                      <span className="inline-flex items-center gap-1"><UserIcon className="w-3 h-3" /> {creatorName}</span>
                    )}
                  </div>

                  {f.description && (
                    <p className="text-xs mb-2 line-clamp-2" style={{ color: '#555' }}>{f.description}</p>
                  )}

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold mb-3" style={{ color: '#888' }}>
                    {f.deadline && (
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="w-3 h-3" /> Due {new Date(f.deadline).toLocaleDateString()}
                      </span>
                    )}
                    {tab === 'available' && status === 'pending' && (
                      <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> ~{estimateMinutes(f.id)} min</span>
                    )}
                    {tab === 'available' && status === 'completed' && submittedMap[f.id] && (
                      <span className="inline-flex items-center gap-1">
                        Submitted {new Date(submittedMap[f.id]).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mt-auto pt-2">
                    {tab === 'available' && status === 'pending' && (
                      <button
                        onClick={() => navigate(`/forms/${f.id}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold"
                        style={{ background: '#E98A3A', color: '#111', border: '1.5px solid #111', borderRadius: '6px' }}
                      >
                        <ExternalLink className="w-3 h-3" /> Fill Form
                      </button>
                    )}
                    {tab === 'available' && status === 'completed' && (
                      <button
                        onClick={() => navigate(`/forms/${f.id}`)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold"
                        style={{ background: CARD, border: '1.5px solid #111', borderRadius: '6px' }}
                      >
                        <ExternalLink className="w-3 h-3" /> View Submission
                      </button>
                    )}
                    {tab === 'available' && status === 'closed' && (
                      <button
                        disabled
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold opacity-60 cursor-not-allowed"
                        style={{ background: '#E5E5E5', border: '1.5px solid #111', borderRadius: '6px' }}
                      >
                        Closed
                      </button>
                    )}
                    {tab === 'manage' && (
                      <>
                        <button
                          onClick={() => navigate(`/forms/${f.id}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold"
                          style={{ background: CARD, border: '1.5px solid #111', borderRadius: '6px' }}
                        >
                          <ExternalLink className="w-3 h-3" /> View
                        </button>
                        <button
                          onClick={() => navigate(`/forms/${f.id}/edit`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold"
                          style={{ background: CARD, border: '1.5px solid #111', borderRadius: '6px' }}
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                        <button
                          onClick={() => navigate(`/forms/${f.id}/responses`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold"
                          style={{ background: '#111', color: '#FFFDF5', border: '1.5px solid #111', borderRadius: '6px' }}
                        >
                          <BarChart3 className="w-3 h-3" /> Responses
                        </button>
                        <button
                          onClick={() => handleDelete(f.id)}
                          className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-bold ml-auto"
                          style={{ background: '#FFD2D2', border: '1.5px solid #111', borderRadius: '6px' }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
