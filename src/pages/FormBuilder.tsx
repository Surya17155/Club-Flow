import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Save, Send, CircleDot } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useClub } from '@/contexts/ClubContext';
import { toast } from 'sonner';
import {
  FormQuestion, QuestionType, QUESTION_TYPE_LABELS, NEEDS_OPTIONS, IS_FILE,
} from '@/lib/formTypes';

const BG = '#F4EFE7';
const CARD = '#FFFDF5';
const BORDER = '2px solid #111';
const SHADOW = '4px 4px 0px #111';

type DraftQuestion = Omit<FormQuestion, 'id' | 'form_id'> & { id?: string; _localId: string };

export default function FormBuilder() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const { user } = useAuth();
  const { activeClub, clubs } = useClub();

  // Forms are always scoped to the currently selected club — no chooser.
  const activeMembership = clubs.find((c) => c.club_id === activeClub?.club_id);
  const canCreateHere = activeMembership?.role === 'president';
  const clubId = activeClub?.club_id ?? '';
  const clubName = activeClub?.club_name ?? '';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [questions, setQuestions] = useState<DraftQuestion[]>([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);


  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      const { data: form, error } = await supabase.from('forms').select('*').eq('id', id!).maybeSingle();
      if (error || !form) { toast.error('Form not found'); navigate('/forms'); return; }
      setTitle(form.title);
      setDescription(form.description ?? '');
      setDeadline(form.deadline ? new Date(form.deadline).toISOString().slice(0, 16) : '');
      setAllowMultiple(form.allow_multiple);
      setAnonymous(form.anonymous);
      setIsPublic((form as any).is_public ?? false);
      setIsPublished(form.is_published);

      const { data: qs } = await supabase.from('form_questions').select('*').eq('form_id', id!).order('position');
      setQuestions(
        (qs ?? []).map((q: any) => ({
          _localId: q.id,
          id: q.id,
          position: q.position,
          type: q.type as QuestionType,
          label: q.label,
          description: q.description,
          required: q.required,
          options: Array.isArray(q.options) ? q.options : [],
          config: q.config ?? {},
        }))
      );
      setLoading(false);
    })();
  }, [id]);


  const addQuestion = (type: QuestionType) => {
    setQuestions((qs) => [
      ...qs,
      {
        _localId: crypto.randomUUID(),
        position: qs.length,
        type,
        label: '',
        description: null,
        required: false,
        options: NEEDS_OPTIONS.includes(type) ? ['Option 1'] : [],
        config: type === 'rating' ? { scaleMax: 5 } : type === 'linear' ? { scaleMax: 10 } : IS_FILE.includes(type) ? { maxFileSizeMB: 10 } : {},
      },
    ]);
  };

  const updateQ = (localId: string, patch: Partial<DraftQuestion>) => {
    setQuestions((qs) => qs.map((q) => (q._localId === localId ? { ...q, ...patch } : q)));
  };
  const removeQ = (localId: string) => setQuestions((qs) => qs.filter((q) => q._localId !== localId));
  const moveQ = (localId: string, dir: -1 | 1) => {
    setQuestions((qs) => {
      const idx = qs.findIndex((q) => q._localId === localId);
      if (idx < 0) return qs;
      const j = idx + dir;
      if (j < 0 || j >= qs.length) return qs;
      const out = [...qs];
      [out[idx], out[j]] = [out[j], out[idx]];
      return out.map((q, i) => ({ ...q, position: i }));
    });
  };

  const save = async (publish?: boolean) => {
    if (!user) return;
    if (!clubId) { toast.error('Pick a club'); return; }
    if (!title.trim()) { toast.error('Form title is required'); return; }
    if (questions.length === 0) { toast.error('Add at least one question'); return; }
    for (const q of questions) {
      if (!q.label.trim()) { toast.error('Every question needs a label'); return; }
      if (NEEDS_OPTIONS.includes(q.type) && q.options.filter((o) => o.trim()).length < 2) {
        toast.error(`"${q.label || 'Untitled'}" needs at least 2 options`); return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        club_id: clubId,
        created_by: user.id,
        title: title.trim(),
        description: description.trim() || null,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        allow_multiple: allowMultiple,
        anonymous,
        is_public: false,
        is_published: publish ?? isPublished,
      } as any;

      let formId = id;
      if (isEdit) {
        const { error } = await supabase.from('forms').update(payload).eq('id', id!);
        if (error) throw error;
        await supabase.from('form_questions').delete().eq('form_id', id!);
      } else {
        const { data, error } = await supabase.from('forms').insert(payload).select('id').single();
        if (error) throw error;
        formId = data.id;
      }

      const qRows = questions.map((q, i) => ({
        form_id: formId!,
        position: i,
        type: q.type as string,
        label: q.label.trim(),
        description: q.description?.trim() || null,
        required: q.required,
        options: (NEEDS_OPTIONS.includes(q.type) ? q.options.filter((o) => o.trim()) : []) as any,
        config: (q.config ?? {}) as any,
      }));
      if (qRows.length) {
        const { error } = await supabase.from('form_questions').insert(qRows);
        if (error) throw error;
      }

      if (publish) {
        toast.success('✓ Form Published Successfully', { description: 'The form is now visible to eligible club members.' });
      } else {
        toast.success('Saved');
      }
      window.dispatchEvent(new Event('formsChanged'));
      navigate('/forms');


    } catch (e: any) {
      toast.error(e.message ?? 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ background: BG, minHeight: '100vh' }} className="flex items-center justify-center font-bold">Loading…</div>;

  if (!activeClub) {
    return (
      <div style={{ background: BG, fontFamily: "'Space Grotesk', sans-serif" }} className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center p-6" style={{ background: CARD, border: BORDER, borderRadius: '8px', boxShadow: SHADOW }}>
          <div className="font-bold mb-2">No active club selected.</div>
          <button onClick={() => navigate('/forms')} className="text-sm underline">Go to Forms</button>
        </div>
      </div>
    );
  }

  if (!canCreateHere) {
    return (
      <div style={{ background: BG, fontFamily: "'Space Grotesk', sans-serif" }} className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center p-6 max-w-md" style={{ background: CARD, border: BORDER, borderRadius: '8px', boxShadow: SHADOW }}>
          <div className="font-bold mb-2">Only the president of {clubName} can create forms for this club.</div>
          <button onClick={() => navigate('/forms')} className="text-sm underline">Go to Forms</button>
        </div>
      </div>
    );
  }

  const statusLabel = isPublished ? 'PUBLISHED' : 'DRAFT';
  const statusBg = isPublished ? '#C7F0BA' : '#FDE8D0';

  return (
    <div style={{ background: BG, fontFamily: "'Space Grotesk', sans-serif", minHeight: '100vh' }} className="px-4 pb-32 md:px-8">
      <div className="max-w-3xl mx-auto pt-16 md:pt-8">
        <h1 className="text-3xl font-black mb-1">{isEdit ? 'Edit Form' : 'Create Form'}</h1>
        <div className="text-xs font-bold mb-4" style={{ color: '#666' }}>
          For <span style={{ color: '#E98A3A' }}>{clubName}</span>
        </div>

        {/* Settings */}
        <div className="p-5 mb-5 space-y-3" style={{ background: CARD, border: BORDER, borderRadius: '8px', boxShadow: SHADOW }}>

          <Field label="Form Title *">
            <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200}
              className="w-full p-2 text-sm font-semibold" style={{ background: '#fff', border: '1.5px solid #111', borderRadius: '6px' }} />
          </Field>
          <Field label="Description">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1000} rows={2}
              className="w-full p-2 text-sm" style={{ background: '#fff', border: '1.5px solid #111', borderRadius: '6px' }} />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="Deadline">
              <input type="datetime-local" value={deadline} onChange={(e) => setDeadline(e.target.value)}
                className="w-full p-2 text-sm font-semibold" style={{ background: '#fff', border: '1.5px solid #111', borderRadius: '6px' }} />
            </Field>
            <Toggle label="Allow multiple responses" value={allowMultiple} onChange={setAllowMultiple} />
            <Toggle label="Anonymous mode" value={anonymous} onChange={setAnonymous} />
          </div>
          <div className="text-[11px]" style={{ color: '#666' }}>
            This form will only be visible to members of <span style={{ color: '#E98A3A', fontWeight: 700 }}>{clubName}</span>.
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-3 mb-5">
          {questions.map((q, i) => (
            <div key={q._localId} className="p-4" style={{ background: CARD, border: BORDER, borderRadius: '8px', boxShadow: SHADOW }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex flex-col">
                  <button onClick={() => moveQ(q._localId, -1)} className="text-xs px-1">▲</button>
                  <button onClick={() => moveQ(q._localId, 1)} className="text-xs px-1">▼</button>
                </div>
                <span className="text-xs font-bold px-2 py-0.5" style={{ background: '#FDE8D0', border: '1.5px solid #111', borderRadius: '999px' }}>
                  Q{i + 1} • {QUESTION_TYPE_LABELS[q.type]}
                </span>
                <label className="ml-auto flex items-center gap-1.5 text-xs font-bold">
                  <input type="checkbox" checked={q.required} onChange={(e) => updateQ(q._localId, { required: e.target.checked })} />
                  Required
                </label>
                <button onClick={() => removeQ(q._localId)} className="p-1.5" style={{ background: '#FFD2D2', border: '1.5px solid #111', borderRadius: '6px' }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <input
                placeholder="Question text"
                value={q.label}
                onChange={(e) => updateQ(q._localId, { label: e.target.value })}
                className="w-full p-2 mb-2 text-sm font-semibold"
                style={{ background: '#fff', border: '1.5px solid #111', borderRadius: '6px' }}
              />

              {NEEDS_OPTIONS.includes(q.type) && (
                <div className="space-y-1.5">
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex gap-2">
                      <input value={opt}
                        onChange={(e) => {
                          const next = [...q.options]; next[oi] = e.target.value;
                          updateQ(q._localId, { options: next });
                        }}
                        className="flex-1 p-2 text-sm" style={{ background: '#fff', border: '1.5px solid #111', borderRadius: '6px' }} />
                      <button onClick={() => updateQ(q._localId, { options: q.options.filter((_, x) => x !== oi) })}
                        className="px-2" style={{ background: '#FFD2D2', border: '1.5px solid #111', borderRadius: '6px' }}>×</button>
                    </div>
                  ))}
                  <button onClick={() => updateQ(q._localId, { options: [...q.options, `Option ${q.options.length + 1}`] })}
                    className="text-xs font-bold px-2 py-1" style={{ border: '1.5px solid #111', borderRadius: '6px' }}>+ Add option</button>
                </div>
              )}

              {(q.type === 'rating' || q.type === 'linear') && (
                <div className="flex items-center gap-2 text-xs font-bold">
                  Max:
                  <input type="number" min={2} max={10} value={q.config.scaleMax ?? 5}
                    onChange={(e) => updateQ(q._localId, { config: { ...q.config, scaleMax: Number(e.target.value) } })}
                    className="w-16 p-1" style={{ background: '#fff', border: '1.5px solid #111', borderRadius: '6px' }} />
                </div>
              )}

              {IS_FILE.includes(q.type) && (
                <div className="flex items-center gap-3 text-xs font-bold">
                  Max size (MB):
                  <input type="number" min={1} max={50} value={q.config.maxFileSizeMB ?? 10}
                    onChange={(e) => updateQ(q._localId, { config: { ...q.config, maxFileSizeMB: Number(e.target.value) } })}
                    className="w-16 p-1" style={{ background: '#fff', border: '1.5px solid #111', borderRadius: '6px' }} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add question */}
        <div className="p-4 mb-5" style={{ background: CARD, border: BORDER, borderRadius: '8px', boxShadow: SHADOW }}>
          <div className="text-xs font-bold mb-2 uppercase tracking-wider">Add question</div>
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(QUESTION_TYPE_LABELS) as QuestionType[]).map((t) => (
              <button key={t} onClick={() => addQuestion(t)}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold"
                style={{ background: '#FDE8D0', border: '1.5px solid #111', borderRadius: '6px' }}>
                <Plus className="w-3 h-3" /> {QUESTION_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky bottom action bar */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 px-4 py-3 md:px-8"
        style={{
          background: CARD,
          borderTop: BORDER,
          boxShadow: '0 -4px 0px #111',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)',
        }}
      >
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-bold"
            style={{ background: statusBg, border: '1.5px solid #111', borderRadius: '999px' }}
          >
            <CircleDot className="w-3 h-3" /> {statusLabel}
          </div>

          <motion.button
            whileTap={{ scale: 0.96 }}
            disabled={saving}
            onClick={() => save(false)}
            className="ml-auto flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold"
            style={{ background: CARD, border: BORDER, borderRadius: '6px', boxShadow: '3px 3px 0px #111' }}
          >
            <Save className="w-4 h-4" /> Save draft
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.96 }}
            disabled={saving}
            onClick={() => setConfirmPublish(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold"
            style={{ background: '#E98A3A', border: BORDER, borderRadius: '6px', boxShadow: '3px 3px 0px #111' }}
          >
            <Send className="w-4 h-4" /> {saving ? 'Saving…' : 'Publish'}
          </motion.button>
        </div>
      </div>

      {confirmPublish && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: 'rgba(0,0,0,0.45)' }}
          onClick={() => !saving && setConfirmPublish(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md p-5"
            style={{ background: CARD, border: BORDER, borderRadius: '10px', boxShadow: SHADOW }}
          >
            <h3 className="text-xl font-black mb-2">Publish Form?</h3>
            <p className="text-sm mb-5" style={{ color: '#555' }}>
              This form will become available to all eligible club members immediately.
            </p>
            <div className="flex justify-end gap-2">
              <button
                disabled={saving}
                onClick={() => setConfirmPublish(false)}
                className="px-4 py-2 text-sm font-bold"
                style={{ background: CARD, border: BORDER, borderRadius: '6px', boxShadow: '3px 3px 0px #111' }}
              >
                Cancel
              </button>
              <button
                disabled={saving}
                onClick={async () => { await save(true); setConfirmPublish(false); }}
                className="px-4 py-2 text-sm font-bold"
                style={{ background: '#E98A3A', border: BORDER, borderRadius: '6px', boxShadow: '3px 3px 0px #111' }}
              >
                {saving ? 'Publishing…' : 'Publish Form'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}


function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-bold mb-1 uppercase tracking-wider" style={{ color: '#555' }}>{label}</div>
      {children}
    </div>
  );
}
function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm font-bold cursor-pointer">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}
