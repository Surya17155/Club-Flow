import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Loader2, Camera as CameraIcon, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ensureFaceModels, faceapi } from '@/lib/face/faceApiLoader';
import { deserializeDescriptor, FACE_MATCH_THRESHOLD } from '@/lib/face/faceDescriptor';

const NEO = {
  page: { background: '#F4EFE7', fontFamily: "'Space Grotesk', sans-serif", minHeight: '100vh' } as React.CSSProperties,
  card: {
    background: '#FFFDF9',
    border: '2px solid #111',
    borderRadius: '12px',
    boxShadow: '4px 4px 0 #111',
  } as React.CSSProperties,
  btn: {
    background: '#E98A3A',
    color: '#111',
    border: '2px solid #111',
    borderRadius: '8px',
    boxShadow: '3px 3px 0 #111',
    fontWeight: 700,
  } as React.CSSProperties,
  btnDark: {
    background: '#111',
    color: '#fff',
    border: '2px solid #111',
    borderRadius: '8px',
    boxShadow: '3px 3px 0 #E98A3A',
    fontWeight: 700,
  } as React.CSSProperties,
};

type EventRow = {
  id: string;
  name: string;
  club_id: string;
  access_type: string;
  attendance_mode: string | null;
};

type LabeledMember = { userId: string; name: string; descriptor: Float32Array };

const FaceScanner = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);
  const pausedRef = useRef(false);

  const [event, setEvent] = useState<EventRow | null>(null);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [loadingMsg, setLoadingMsg] = useState('Loading…');
  const [error, setError] = useState<string | null>(null);
  const [members, setMembers] = useState<LabeledMember[]>([]);
  const [markedIds, setMarkedIds] = useState<Set<string>>(new Set());
  const [recent, setRecent] = useState<{ name: string; at: number }[]>([]);
  const [flashName, setFlashName] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  // Bootstrap: event + authorization + members
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user || !eventId) return;
      try {
        setLoadingMsg('Loading event…');
        const { data: ev, error: evErr } = await supabase
          .from('events')
          .select('id, name, club_id, access_type, attendance_mode')
          .eq('id', eventId)
          .single();
        if (evErr) throw evErr;
        if (cancelled) return;
        setEvent(ev as EventRow);

        // Authorize: admin role or club admin role
        const { data: cm } = await supabase
          .from('club_members')
          .select('role')
          .eq('club_id', (ev as any).club_id)
          .eq('user_id', user.id)
          .maybeSingle();
        const isClubAdmin = cm && ['president', 'vice_president', 'secretary'].includes((cm as any).role);
        if (!isClubAdmin) {
          const { data: roles } = await supabase.from('user_roles').select('role').eq('user_id', user.id);
          const isAdmin = (roles || []).some((r: any) => r.role === 'admin');
          if (!isAdmin) {
            setAuthorized(false);
            return;
          }
        }
        setAuthorized(true);

        setLoadingMsg('Loading face models…');
        await ensureFaceModels();

        setLoadingMsg('Loading enrolled members…');
        // Fetch club members and their profile descriptors
        const { data: clubMembers, error: cmErr } = await supabase
          .from('club_members')
          .select('user_id')
          .eq('club_id', (ev as any).club_id);
        if (cmErr) throw cmErr;
        const userIds = (clubMembers || []).map((m: any) => m.user_id);
        if (userIds.length === 0) {
          setMembers([]);
        } else {
          const { data: profs, error: pErr } = await supabase
            .from('profiles')
            .select('user_id, full_name, face_descriptor')
            .in('user_id', userIds);
          if (pErr) throw pErr;
          const labeled: LabeledMember[] = [];
          for (const p of profs || []) {
            const d = deserializeDescriptor((p as any).face_descriptor);
            if (d) labeled.push({ userId: (p as any).user_id, name: (p as any).full_name || 'Unknown', descriptor: d });
          }
          setMembers(labeled);
        }

        // Pre-fetch existing attendance for this event
        const { data: att } = await supabase
          .from('attendance')
          .select('student_id')
          .eq('event_id', eventId);
        setMarkedIds(new Set((att || []).map((a: any) => a.student_id)));

        setLoadingMsg('Starting camera…');
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setScanning(true);
        setLoadingMsg('');
      } catch (err: any) {
        if (!cancelled) setError(err.message || 'Failed to start scanner');
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [eventId, user]);

  // Matcher (memoised)
  const matcher = useMemo(() => {
    if (members.length === 0) return null;
    const labeled = members.map(
      (m) => new faceapi.LabeledFaceDescriptors(m.userId, [m.descriptor])
    );
    return new faceapi.FaceMatcher(labeled, FACE_MATCH_THRESHOLD);
  }, [members]);

  // Scan loop
  useEffect(() => {
    if (!scanning || !matcher || !event) return;
    intervalRef.current = window.setInterval(async () => {
      if (pausedRef.current || !videoRef.current) return;
      const video = videoRef.current;
      if (video.readyState < 2) return;
      try {
        const det = await faceapi
          .detectSingleFace(video)
          .withFaceLandmarks()
          .withFaceDescriptor();
        if (!det) return;
        const match = matcher.findBestMatch(det.descriptor);
        if (match.label === 'unknown' || match.distance >= FACE_MATCH_THRESHOLD) return;
        const userId = match.label;
        if (markedIds.has(userId)) return;
        const member = members.find((m) => m.userId === userId);
        if (!member) return;

        pausedRef.current = true;
        const { error: insErr } = await supabase.from('attendance').insert({
          event_id: event.id,
          student_id: userId,
          status: 'present',
          method: 'face',
        } as any);
        if (insErr && !insErr.message.toLowerCase().includes('duplicate')) {
          console.warn('attendance insert failed', insErr);
        }
        setMarkedIds((prev) => new Set(prev).add(userId));
        setRecent((prev) => [{ name: member.name, at: Date.now() }, ...prev].slice(0, 8));
        setFlashName(member.name);
        window.setTimeout(() => {
          setFlashName(null);
          pausedRef.current = false;
        }, 1800);
      } catch (err) {
        console.warn('scan error', err);
      }
    }, 500);
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [scanning, matcher, event, markedIds, members]);

  if (authorized === false) {
    return (
      <div style={NEO.page} className="flex items-center justify-center p-6">
        <div style={NEO.card} className="p-6 max-w-sm text-center">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3" style={{ color: '#E98A3A' }} />
          <h1 className="text-lg font-black mb-2">Access denied</h1>
          <p className="text-sm mb-4" style={{ color: '#555' }}>
            Only club organisers can run the face scanner.
          </p>
          <button onClick={() => navigate(-1)} className="px-5 py-2 text-sm" style={NEO.btn}>Back</button>
        </div>
      </div>
    );
  }

  return (
    <div style={NEO.page}>
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <header className="flex items-center justify-between mb-4 gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm flex items-center gap-2"
            style={NEO.btnDark}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <div className="text-right">
            <h1 className="text-lg sm:text-xl font-black" style={{ color: '#111' }}>{event?.name || 'Event'}</h1>
            <p className="text-xs" style={{ color: '#555' }}>Face ID Attendance</p>
          </div>
          {scanning ? (
            <span className="px-3 py-1 text-xs flex items-center gap-1.5" style={{ ...NEO.btn, background: '#86EFAC', boxShadow: '2px 2px 0 #111' }}>
              <span className="w-2 h-2 rounded-full" style={{ background: '#15803d', boxShadow: '0 0 6px #15803d' }} />
              LIVE
            </span>
          ) : (
            <span className="px-3 py-1 text-xs" style={{ ...NEO.btnDark, boxShadow: '2px 2px 0 #E98A3A' }}>OFF</span>
          )}
        </header>

        <div style={NEO.card} className="overflow-hidden mb-4 relative">
          <div className="relative bg-black aspect-video">
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {/* Scan frame overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                style={{
                  width: '60%',
                  height: '70%',
                  border: '3px solid #E98A3A',
                  borderRadius: '12px',
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.25)',
                }}
              />
            </div>
            {/* Loading overlay */}
            {loadingMsg && !error && (
              <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(17,17,17,0.7)' }}>
                <div className="flex items-center gap-2 text-white text-sm font-bold">
                  <Loader2 className="w-5 h-5 animate-spin" /> {loadingMsg}
                </div>
              </div>
            )}
            {/* Error overlay */}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center p-4" style={{ background: 'rgba(17,17,17,0.85)' }}>
                <div style={NEO.card} className="p-4 max-w-sm text-center">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2" style={{ color: '#E98A3A' }} />
                  <p className="text-sm font-bold" style={{ color: '#111' }}>{error}</p>
                </div>
              </div>
            )}
            {/* Success flash */}
            {flashName && (
              <div className="absolute inset-0 flex items-center justify-center animate-in fade-in duration-200" style={{ background: 'rgba(34,197,94,0.85)' }}>
                <div className="text-center text-white">
                  <CheckCircle2 className="w-16 h-16 mx-auto mb-2" />
                  <p className="text-2xl font-black">Marked</p>
                  <p className="text-lg font-bold">{flashName}</p>
                </div>
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 text-center text-xs sm:text-sm font-bold" style={{ borderTop: '2px solid #111' }}>
            <div className="p-3" style={{ borderRight: '2px solid #111' }}>
              <div style={{ color: '#555' }}>Status</div>
              <div className="mt-1" style={{ color: '#111' }}>{scanning ? 'Scanning…' : 'Idle'}</div>
            </div>
            <div className="p-3" style={{ borderRight: '2px solid #111' }}>
              <div style={{ color: '#555' }}>Enrolled</div>
              <div className="mt-1" style={{ color: '#111' }}>{members.length}</div>
            </div>
            <div className="p-3">
              <div style={{ color: '#555' }}>Marked</div>
              <div className="mt-1" style={{ color: '#E98A3A' }}>{markedIds.size}</div>
            </div>
          </div>
        </div>

        <div style={NEO.card} className="p-4">
          <h2 className="text-sm font-black mb-3 flex items-center gap-2" style={{ color: '#111' }}>
            <CameraIcon className="w-4 h-4" /> Recently marked
          </h2>
          {recent.length === 0 ? (
            <p className="text-xs" style={{ color: '#888' }}>No one scanned yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {recent.map((r, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 text-xs font-bold"
                  style={{ ...NEO.btn, background: '#FFF8E1', boxShadow: '2px 2px 0 #111' }}
                >
                  {r.name}
                </span>
              ))}
            </div>
          )}
          {members.length === 0 && !loadingMsg && !error && (
            <p className="text-xs mt-3" style={{ color: '#b91c1c' }}>
              No club members have enrolled their Face ID yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FaceScanner;
