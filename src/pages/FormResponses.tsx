import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Trash2, FileDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { FormQuestion, IS_FILE, PROFILE_SNAPSHOT_FIELDS, QuestionType } from '@/lib/formTypes';

const BG = '#F4EFE7';
const CARD = '#FFFDF5';
const BORDER = '2px solid #111';
const SHADOW = '4px 4px 0px #111';

interface ResponseRow {
  id: string;
  submitted_at: string;
  profile_snapshot: Record<string, any>;
  user_id: string;
}
interface AnswerRow {
  id: string; response_id: string; question_id: string; value: any; file_url: string | null;
}

export default function FormResponses() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [questions, setQuestions] = useState<FormQuestion[]>([]);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [answers, setAnswers] = useState<AnswerRow[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigned, setAssigned] = useState(0);
  const [viewed, setViewed] = useState(0);
  const [started, setStarted] = useState(0);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const { data: f } = await supabase.from('forms').select('title, club_id, is_public').eq('id', id).maybeSingle();
    setTitle(f?.title ?? 'Form');
    const { data: qs } = await supabase.from('form_questions').select('*').eq('form_id', id).order('position');
    setQuestions((qs ?? []).map((q: any) => ({
      id: q.id, form_id: q.form_id, position: q.position, type: q.type as QuestionType,
      label: q.label, description: q.description, required: q.required,
      options: Array.isArray(q.options) ? q.options : [], config: q.config ?? {},
    })));
    const { data: rs } = await supabase.from('form_responses').select('*').eq('form_id', id).order('submitted_at', { ascending: false });
    setResponses((rs as ResponseRow[]) ?? []);
    if (rs && rs.length) {
      const { data: ans } = await supabase.from('form_answers').select('*').in('response_id', rs.map((r: any) => r.id));
      setAnswers((ans as AnswerRow[]) ?? []);
    } else setAnswers([]);

    // Analytics
    if (f?.club_id) {
      const { count: memberCount } = await supabase
        .from('club_members')
        .select('user_id', { count: 'exact', head: true })
        .eq('club_id', f.club_id);
      setAssigned(memberCount ?? 0);
    }
    const { data: views } = await supabase.from('form_views').select('user_id, started').eq('form_id', id);
    setViewed((views ?? []).length);
    setStarted((views ?? []).filter((v: any) => v.started).length);

    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);


  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return responses;
    return responses.filter((r) => JSON.stringify(r.profile_snapshot).toLowerCase().includes(q));
  }, [responses, search]);

  const answerFor = (responseId: string, questionId: string) =>
    answers.find((a) => a.response_id === responseId && a.question_id === questionId);

  const fileSignedUrl = async (path: string) => {
    const { data } = await supabase.storage.from('form-uploads').createSignedUrl(path, 3600);
    if (data?.signedUrl) window.open(data.signedUrl, '_blank');
  };

  const renderAnswer = (a: AnswerRow | undefined, q: FormQuestion) => {
    if (!a) return '—';
    if (IS_FILE.includes(q.type) && a.file_url) {
      return (
        <button onClick={() => fileSignedUrl(a.file_url!)} className="text-xs font-bold underline" style={{ color: '#E98A3A' }}>
          View file
        </button>
      );
    }
    const v = a.value;
    if (v == null) return '—';
    if (Array.isArray(v)) return v.join(', ');
    return String(v);
  };

  const exportXLSX = () => {
    const rows = filtered.map((r, i) => {
      const row: Record<string, any> = { 'S.No': i + 1 };
      for (const k of PROFILE_SNAPSHOT_FIELDS) row[k] = r.profile_snapshot?.[k] ?? '';
      for (const q of questions) {
        const a = answerFor(r.id, q.id);
        if (IS_FILE.includes(q.type)) row[q.label] = a?.file_url ?? '';
        else if (Array.isArray(a?.value)) row[q.label] = a!.value.join(', ');
        else row[q.label] = a?.value ?? '';
      }
      row['Submitted At'] = new Date(r.submitted_at).toLocaleString();
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Responses');
    XLSX.writeFile(wb, `${title.replace(/[^a-z0-9]/gi, '_')}_responses.xlsx`);
  };

  const exportCSV = () => {
    const headers = ['S.No', ...PROFILE_SNAPSHOT_FIELDS, ...questions.map((q) => q.label), 'Submitted At'];
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [headers.map(esc).join(',')];
    filtered.forEach((r, i) => {
      const row: any[] = [i + 1];
      for (const k of PROFILE_SNAPSHOT_FIELDS) row.push(r.profile_snapshot?.[k] ?? '');
      for (const q of questions) {
        const a = answerFor(r.id, q.id);
        if (IS_FILE.includes(q.type)) row.push(a?.file_url ?? '');
        else if (Array.isArray(a?.value)) row.push(a!.value.join(', '));
        else row.push(a?.value ?? '');
      }
      row.push(new Date(r.submitted_at).toLocaleString());
      lines.push(row.map(esc).join(','));
    });
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${title.replace(/[^a-z0-9]/gi, '_')}_responses.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const deleteResponse = async (rid: string) => {
    if (!confirm('Delete this response?')) return;
    const { error } = await supabase.from('form_responses').delete().eq('id', rid);
    if (error) toast.error(error.message);
    else { toast.success('Deleted'); load(); }
  };

  return (
    <div style={{ background: BG, fontFamily: "'Space Grotesk', sans-serif", minHeight: '100vh' }} className="px-4 py-6 md:px-8">
      <div className="max-w-7xl mx-auto">
        <button onClick={() => navigate('/forms')} className="flex items-center gap-2 px-3 py-2 text-sm font-bold mb-5"
          style={{ background: CARD, border: BORDER, borderRadius: '6px', boxShadow: '3px 3px 0px #111' }}>
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black">{title}</h1>
            <p className="text-sm" style={{ color: '#555' }}>{responses.length} response{responses.length === 1 ? '' : 's'}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCSV} disabled={!responses.length}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold"
              style={{ background: CARD, border: BORDER, borderRadius: '6px', boxShadow: '3px 3px 0px #111' }}>
              <Download className="w-3.5 h-3.5" /> CSV
            </button>
            <button onClick={exportXLSX} disabled={!responses.length}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold"
              style={{ background: '#E98A3A', border: BORDER, borderRadius: '6px', boxShadow: '3px 3px 0px #111' }}>
              <FileDown className="w-3.5 h-3.5" /> Excel
            </button>
          </div>
        </div>

        {/* Analytics tiles */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
          {[
            { label: 'Assigned', value: assigned, bg: '#FDE8D0' },
            { label: 'Viewed', value: viewed, bg: '#FFF3B0' },
            { label: 'Started', value: started, bg: '#D6E8FF' },
            { label: 'Completed', value: responses.length, bg: '#C7F0BA' },
            { label: 'Completion Rate', value: assigned ? `${((responses.length / assigned) * 100).toFixed(1)}%` : '—', bg: '#E98A3A' },
          ].map((s) => (
            <div key={s.label} className="p-3" style={{ background: s.bg, border: BORDER, borderRadius: '8px', boxShadow: '3px 3px 0px #111' }}>
              <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#444' }}>{s.label}</div>
              <div className="text-xl font-black mt-1">{s.value}</div>
            </div>
          ))}
        </div>



        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, roll no, email…"
          className="w-full md:w-72 p-2 text-sm mb-3" style={{ background: '#fff', border: '1.5px solid #111', borderRadius: '6px' }} />

        {loading ? <div className="font-bold text-sm">Loading…</div> : responses.length === 0 ? (
          <div className="text-center py-12 px-6" style={{ background: CARD, border: BORDER, borderRadius: '8px', boxShadow: SHADOW }}>
            <div className="font-bold">No responses yet</div>
          </div>
        ) : (
          <div className="overflow-x-auto" style={{ background: CARD, border: BORDER, borderRadius: '8px', boxShadow: SHADOW }}>
            <table className="w-full text-xs">
              <thead>
                <tr style={{ background: '#FDE8D0', borderBottom: BORDER }}>
                  <th className="p-2 text-left font-bold">#</th>
                  <th className="p-2 text-left font-bold">Name</th>
                  <th className="p-2 text-left font-bold">Roll No</th>
                  <th className="p-2 text-left font-bold">Programme</th>
                  <th className="p-2 text-left font-bold">Section</th>
                  {questions.map((q) => (
                    <th key={q.id} className="p-2 text-left font-bold whitespace-nowrap">{q.label}</th>
                  ))}
                  <th className="p-2 text-left font-bold whitespace-nowrap">Submitted</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td className="p-2 font-bold">{i + 1}</td>
                    <td className="p-2">{r.profile_snapshot?.full_name ?? '—'}</td>
                    <td className="p-2">{r.profile_snapshot?.roll_no ?? '—'}</td>
                    <td className="p-2">{r.profile_snapshot?.programme ?? '—'}</td>
                    <td className="p-2">{r.profile_snapshot?.section ?? '—'}</td>
                    {questions.map((q) => (
                      <td key={q.id} className="p-2 max-w-[240px]">{renderAnswer(answerFor(r.id, q.id), q)}</td>
                    ))}
                    <td className="p-2 whitespace-nowrap">{new Date(r.submitted_at).toLocaleString()}</td>
                    <td className="p-2">
                      <button onClick={() => deleteResponse(r.id)} className="p-1.5"
                        style={{ background: '#FFD2D2', border: '1.5px solid #111', borderRadius: '6px' }}>
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
