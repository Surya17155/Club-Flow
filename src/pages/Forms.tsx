import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, FileText, Users, Edit3, BarChart3, Trash2, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useClub } from '@/contexts/ClubContext';
import { toast } from 'sonner';

const BG = '#F4EFE7';
const CARD = '#FFFDF5';
const BORDER = '2px solid #111';
const SHADOW = '4px 4px 0px #111';

interface FormRow {
  id: string;
  title: string;
  description: string | null;
  club_id: string;
  is_published: boolean;
  is_public?: boolean;
  accepting_responses: boolean;
  deadline: string | null;
  created_at: string;
}

type AvailableStatus = 'active' | 'pending' | 'completed';

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

  // Club mode → manage only. Personal mode → fill only.
  const tab: 'available' | 'manage' = isClubMode ? 'manage' : 'available';
  const [availableStatus, setAvailableStatus] = useState<AvailableStatus>('active');
  const [forms, setForms] = useState<FormRow[]>([]);
  const [submittedIds, setSubmittedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const isPresidentOfActive = useMemo(
    () => !!clubs.find((c) => c.club_id === activeClub?.club_id && c.role === 'president'),
    [clubs, activeClub?.club_id]
  );

  const load = async () => {
    setLoading(true);
    let query = supabase.from('forms').select('*').order('created_at', { ascending: false });
    if (tab === 'manage') {
      if (!activeClub?.club_id) { setForms([]); setLoading(false); return; }
      query = query.eq('club_id', activeClub.club_id);
    } else {
      query = query.eq('is_published', true);
    }
    const { data, error } = await query;
    if (error) toast.error(error.message);
    else setForms((data as FormRow[]) || []);

    if (user && data && data.length) {
      const { data: resp } = await supabase
        .from('form_responses')
        .select('form_id')
        .eq('user_id', user.id)
        .in('form_id', (data as FormRow[]).map((f) => f.id));
      setSubmittedIds(new Set((resp ?? []).map((r: any) => r.form_id)));
    } else {
      setSubmittedIds(new Set());
    }
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tab, activeClub?.club_id, user?.id]);

  const now = Date.now();
  const visibleForms = useMemo(() => {
    if (tab !== 'available') return forms;
    return forms.filter((f) => {
      const submitted = submittedIds.has(f.id);
      const expired = f.deadline ? new Date(f.deadline).getTime() < now : false;
      if (availableStatus === 'active') return !submitted && !expired;
      if (availableStatus === 'pending') return !submitted && expired; // missed deadline, never submitted
      return submitted; // completed
    });
  }, [forms, submittedIds, tab, availableStatus, now]);

  const countFor = (s: AvailableStatus) =>
    forms.filter((f) => {
      const submitted = submittedIds.has(f.id);
      const expired = f.deadline ? new Date(f.deadline).getTime() < now : false;
      if (s === 'active') return !submitted && !expired;
      if (s === 'pending') return !submitted && expired;
      return submitted;
    }).length;

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this form and all its responses?')) return;
    const { error } = await supabase.from('forms').delete().eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success('Form deleted'); load(); }
  };

  const handleCreate = () => {
    if (!isPresident) {
      toast.error('Only club presidents can create forms');
      return;
    }
    navigate('/forms/new');
  };

  return (
    <div style={{ background: BG, fontFamily: "'Space Grotesk', sans-serif", minHeight: '100vh' }} className="px-4 py-6 md:px-8">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-bold mb-6"
          style={{ background: CARD, color: '#111', border: BORDER, borderRadius: '6px', boxShadow: '3px 3px 0px #111' }}
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-black" style={{ color: '#111', letterSpacing: '-0.02em' }}>
              Smart Forms
            </h1>
            <p className="text-sm mt-1" style={{ color: '#555' }}>
              Surveys, registrations, feedback — profile auto-attached.
            </p>
          </div>
          {isPresident && (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-bold"
              style={{ background: '#E98A3A', color: '#111', border: BORDER, borderRadius: '6px', boxShadow: SHADOW }}
            >
              <Plus className="w-4 h-4" /> Create Form
            </motion.button>
          )}
        </div>

        <div className="flex gap-2 mb-5">
          <button
            onClick={() => setTab('available')}
            className="px-4 py-2 text-sm font-bold"
            style={{
              background: tab === 'available' ? '#111' : CARD,
              color: tab === 'available' ? '#FFFDF5' : '#111',
              border: BORDER, borderRadius: '6px',
              boxShadow: tab === 'available' ? 'none' : '3px 3px 0px #111',
            }}
          >
            Available Forms
          </button>
          {isPresident && (
            <button
              onClick={() => setTab('manage')}
              className="px-4 py-2 text-sm font-bold"
              style={{
                background: tab === 'manage' ? '#111' : CARD,
                color: tab === 'manage' ? '#FFFDF5' : '#111',
                border: BORDER, borderRadius: '6px',
                boxShadow: tab === 'manage' ? 'none' : '3px 3px 0px #111',
              }}
            >
              Manage My Forms
            </button>
          )}
        </div>

        {tab === 'available' && (
          <div className="flex flex-wrap gap-2 mb-4">
            {(['active', 'pending', 'completed'] as AvailableStatus[]).map((s) => {
              const active = availableStatus === s;
              const label = s === 'active' ? 'Active' : s === 'pending' ? 'Pending' : 'Completed';
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
                : availableStatus === 'active'
                ? 'No active forms'
                : availableStatus === 'pending'
                ? 'Nothing pending'
                : 'Nothing completed yet'}
            </div>
            <div className="text-xs" style={{ color: '#666' }}>
              {tab === 'manage'
                ? 'Create your first form to get started.'
                : 'Forms from your clubs will appear here once published.'}
            </div>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {visibleForms.map((f) => (
              <motion.div
                key={f.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 flex flex-col"
                style={{ background: CARD, border: BORDER, borderRadius: '8px', boxShadow: SHADOW }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-base leading-tight" style={{ color: '#111' }}>{f.title}</h3>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5"
                    style={{
                      background: f.is_published ? '#C7F0BA' : '#FDE8D0',
                      border: '1.5px solid #111', borderRadius: '999px',
                    }}
                  >
                    {f.is_published ? 'LIVE' : 'DRAFT'}
                  </span>
                </div>
                {f.description && (
                  <p className="text-xs mb-3 line-clamp-2" style={{ color: '#555' }}>{f.description}</p>
                )}
                {f.deadline && (
                  <div className="text-[11px] font-semibold mb-3" style={{ color: '#888' }}>
                    Deadline: {new Date(f.deadline).toLocaleString()}
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mt-auto pt-2">
                  {tab === 'available' && (
                    <button
                      onClick={() => navigate(`/forms/${f.id}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold"
                      style={{ background: '#E98A3A', color: '#111', border: '1.5px solid #111', borderRadius: '6px' }}
                    >
                      <ExternalLink className="w-3 h-3" /> Open
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
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
