import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Lock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { FormQuestion, IS_FILE, NEEDS_OPTIONS, PROFILE_SNAPSHOT_FIELDS, QuestionType } from '@/lib/formTypes';

const BG = '#F4EFE7';
const CARD = '#FFFDF5';
const BORDER = '2px solid #111';
const SHADOW = '4px 4px 0px #111';

interface FormMeta {
  id: string;
  title: string;
  description: string | null;
  is_published: boolean;
  accepting_responses: boolean;
  deadline: string | null;
  allow_multiple: boolean;
  anonymous: boolean;
  club_id: string;
}

export default function FormFill() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [form, setForm] = useState<FormMeta | null>(null);
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const { data: f, error } = await supabase.from('forms').select('*').eq('id', id).maybeSingle();
      if (error || !f) { toast.error('Form not found'); navigate('/forms'); return; }
      setForm(f as FormMeta);
      const { data: qs } = await supabase.from('form_questions').select('*').eq('form_id', id).order('position');
      setQuestions(
        (qs ?? []).map((q: any) => ({
          id: q.id, form_id: q.form_id, position: q.position, type: q.type as QuestionType,
          label: q.label, description: q.description, required: q.required,
          options: Array.isArray(q.options) ? q.options : [], config: q.config ?? {},
        }))
      );
      if (user && !f.allow_multiple) {
        const { data: existing } = await supabase.from('form_responses').select('id').eq('form_id', id).eq('user_id', user.id).maybeSingle();
        if (existing) setAlreadySubmitted(true);
      }
      setLoading(false);
    })();
  }, [id, user?.id]);

  const setA = (qid: string, v: any) => setAnswers((p) => ({ ...p, [qid]: v }));

  const submit = async () => {
    if (!user || !form || !id) return;
    for (const q of questions) {
      const a = answers[q.id];
      const f = files[q.id];
      if (q.required) {
        if (IS_FILE.includes(q.type) ? !f : (a === undefined || a === '' || (Array.isArray(a) && a.length === 0))) {
          toast.error(`"${q.label}" is required`); return;
        }
      }
    }

    setSubmitting(true);
    try {
      const snapshot: Record<string, any> = {};
      if (profile) for (const k of PROFILE_SNAPSHOT_FIELDS) snapshot[k] = (profile as any)[k] ?? null;

      const { data: resp, error: respErr } = await supabase
        .from('form_responses')
        .insert({ form_id: id, user_id: user.id, profile_snapshot: snapshot })
        .select('id').single();
      if (respErr) throw respErr;

      const answerRows: any[] = [];
      for (const q of questions) {
        let fileUrl: string | null = null;
        const file = files[q.id];
        if (IS_FILE.includes(q.type) && file) {
          const maxMB = q.config.maxFileSizeMB ?? 10;
          if (file.size > maxMB * 1024 * 1024) throw new Error(`${q.label}: file exceeds ${maxMB}MB`);
          const ext = file.name.split('.').pop();
          const path = `${id}/${user.id}/${resp.id}-${q.id}.${ext}`;
          const { error: upErr } = await supabase.storage.from('form-uploads').upload(path, file, { upsert: true });
          if (upErr) throw upErr;
          fileUrl = path;
        }
        const value = IS_FILE.includes(q.type) ? null : (answers[q.id] ?? null);
        answerRows.push({ response_id: resp.id, question_id: q.id, value, file_url: fileUrl });
      }
      if (answerRows.length) {
        const { error: aErr } = await supabase.from('form_answers').insert(answerRows);
        if (aErr) throw aErr;
      }
      setSubmitted(true);
      window.dispatchEvent(new Event('formsChanged'));
    } catch (e: any) {
      toast.error(e.message ?? 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div style={{ background: BG, minHeight: '100vh' }} className="flex items-center justify-center font-bold">Loading…</div>;
  if (!form) return null;

  if (submitted) {
    return (
      <div style={{ background: BG, fontFamily: "'Space Grotesk', sans-serif" }} className="min-h-screen flex items-center justify-center p-6">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="text-center p-8 max-w-sm" style={{ background: CARD, border: BORDER, borderRadius: '10px', boxShadow: SHADOW }}>
          <CheckCircle2 className="w-14 h-14 mx-auto mb-3" style={{ color: '#3a9d4f' }} />
          <h2 className="text-2xl font-black mb-1">Submitted!</h2>
          <p className="text-sm mb-4" style={{ color: '#555' }}>Your response has been recorded.</p>
          <button onClick={() => navigate('/forms')} className="px-4 py-2 text-sm font-bold"
            style={{ background: '#E98A3A', border: BORDER, borderRadius: '6px', boxShadow: '3px 3px 0px #111' }}>Done</button>
        </motion.div>
      </div>
    );
  }

  const closed = !form.is_published || !form.accepting_responses || (form.deadline && new Date(form.deadline) < new Date());

  return (
    <div style={{ background: BG, fontFamily: "'Space Grotesk', sans-serif", minHeight: '100vh' }} className="px-4 py-6 md:px-8">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate('/forms')} className="flex items-center gap-2 px-3 py-2 text-sm font-bold mb-5"
          style={{ background: CARD, border: BORDER, borderRadius: '6px', boxShadow: '3px 3px 0px #111' }}>
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="p-5 mb-4" style={{ background: CARD, border: BORDER, borderRadius: '10px', boxShadow: SHADOW }}>
          <h1 className="text-2xl md:text-3xl font-black mb-1" style={{ letterSpacing: '-0.02em' }}>{form.title}</h1>
          {form.description && <p className="text-sm" style={{ color: '#555' }}>{form.description}</p>}
          {form.deadline && (
            <div className="text-xs font-semibold mt-2" style={{ color: '#888' }}>
              Deadline: {new Date(form.deadline).toLocaleString()}
            </div>
          )}
          {profile && !form.anonymous && (
            <div className="mt-3 pt-3 text-[11px]" style={{ borderTop: '1.5px dashed #ddd', color: '#666' }}>
              <span className="font-bold">Submitting as:</span> {profile.full_name} • {profile.roll_no || '—'} • {profile.programme || '—'}
              <span className="block mt-0.5 italic">Your profile info is attached automatically.</span>
            </div>
          )}
        </div>

        {closed && (
          <div className="p-4 mb-4 text-sm font-bold flex items-center gap-2"
            style={{ background: '#FFD2D2', border: BORDER, borderRadius: '8px' }}>
            <Lock className="w-4 h-4" /> This form is not accepting responses.
          </div>
        )}
        {alreadySubmitted && !form.allow_multiple && (
          <div className="p-4 mb-4 text-sm font-bold"
            style={{ background: '#FDE8D0', border: BORDER, borderRadius: '8px' }}>
            You've already submitted this form.
          </div>
        )}

        {!closed && !alreadySubmitted && (
          <>
            <div className="space-y-3">
              {questions.map((q, i) => (
                <div key={q.id} className="p-4" style={{ background: CARD, border: BORDER, borderRadius: '8px', boxShadow: SHADOW }}>
                  <div className="font-bold mb-2">
                    {i + 1}. {q.label} {q.required && <span style={{ color: '#c43' }}>*</span>}
                  </div>
                  <QuestionInput q={q}
                    value={answers[q.id]}
                    onChange={(v) => setA(q.id, v)}
                    file={files[q.id] ?? null}
                    onFile={(f) => setFiles((p) => ({ ...p, [q.id]: f }))}
                  />
                </div>
              ))}
            </div>

            <motion.button whileTap={{ scale: 0.96 }} disabled={submitting} onClick={submit}
              className="mt-5 w-full py-3 text-sm font-bold"
              style={{ background: '#E98A3A', border: BORDER, borderRadius: '6px', boxShadow: SHADOW }}>
              {submitting ? 'Submitting…' : 'Submit'}
            </motion.button>
          </>
        )}
      </div>
    </div>
  );
}

function QuestionInput({ q, value, onChange, file, onFile }: {
  q: FormQuestion; value: any; onChange: (v: any) => void; file: File | null; onFile: (f: File | null) => void;
}) {
  const inp = { background: '#fff', border: '1.5px solid #111', borderRadius: '6px' };

  switch (q.type) {
    case 'short':
      return <input value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="w-full p-2 text-sm" style={inp} />;
    case 'long':
      return <textarea value={value ?? ''} onChange={(e) => onChange(e.target.value)} rows={4} className="w-full p-2 text-sm" style={inp} />;
    case 'mcq':
      return (
        <div className="space-y-1.5">
          {q.options.map((o) => (
            <label key={o} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name={q.id} checked={value === o} onChange={() => onChange(o)} /> {o}
            </label>
          ))}
        </div>
      );
    case 'checkbox':
      const arr: string[] = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-1.5">
          {q.options.map((o) => (
            <label key={o} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={arr.includes(o)}
                onChange={(e) => onChange(e.target.checked ? [...arr, o] : arr.filter((x) => x !== o))} /> {o}
            </label>
          ))}
        </div>
      );
    case 'dropdown':
      return (
        <select value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="w-full p-2 text-sm" style={inp}>
          <option value="">— select —</option>
          {q.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      );
    case 'date':
      return <input type="date" value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="p-2 text-sm" style={inp} />;
    case 'time':
      return <input type="time" value={value ?? ''} onChange={(e) => onChange(e.target.value)} className="p-2 text-sm" style={inp} />;
    case 'yesno':
      return (
        <div className="flex gap-2">
          {['Yes', 'No'].map((o) => (
            <button key={o} type="button" onClick={() => onChange(o)}
              className="px-4 py-1.5 text-sm font-bold"
              style={{ background: value === o ? '#E98A3A' : '#fff', border: '1.5px solid #111', borderRadius: '6px' }}>
              {o}
            </button>
          ))}
        </div>
      );
    case 'rating':
    case 'linear':
      const max = q.config.scaleMax ?? (q.type === 'rating' ? 5 : 10);
      return (
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: max }, (_, i) => i + 1).map((n) => (
            <button key={n} type="button" onClick={() => onChange(n)}
              className="w-9 h-9 text-sm font-bold"
              style={{ background: value === n ? '#E98A3A' : '#fff', border: '1.5px solid #111', borderRadius: '6px' }}>
              {n}
            </button>
          ))}
        </div>
      );
    case 'file':
    case 'image':
      return (
        <div>
          <input type="file"
            accept={q.type === 'image' ? 'image/*' : undefined}
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
            className="text-sm" />
          {file && <div className="text-xs mt-1 font-semibold">{file.name} • {(file.size / 1024 / 1024).toFixed(2)} MB</div>}
          <div className="text-[11px] mt-1" style={{ color: '#888' }}>Max {q.config.maxFileSizeMB ?? 10} MB</div>
        </div>
      );
  }
}
