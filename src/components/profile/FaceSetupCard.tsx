import { useEffect, useRef, useState } from 'react';
import { Camera, Upload, CheckCircle2, Loader2, X, RefreshCw, ShieldCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useToast } from '@/hooks/use-toast';
import { ensureFaceModels } from '@/lib/face/faceApiLoader';
import {
  computeDescriptorFromImage,
  averageDescriptors,
  serializeDescriptor,
  fileToImage,
} from '@/lib/face/faceDescriptor';

const NEO = {
  card: {
    background: '#FFFFFF',
    border: '2px solid #111',
    borderRadius: '12px',
    boxShadow: '4px 4px 0 #111',
    padding: '20px',
  } as React.CSSProperties,
  slot: {
    background: '#FFFDF5',
    border: '2px dashed #111',
    borderRadius: '10px',
  } as React.CSSProperties,
  btn: {
    background: '#E98A3A',
    color: '#111',
    border: '2px solid #111',
    borderRadius: '8px',
    boxShadow: '3px 3px 0 #111',
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
  } as React.CSSProperties,
  btnDark: {
    background: '#111',
    color: '#fff',
    border: '2px solid #111',
    borderRadius: '8px',
    boxShadow: '3px 3px 0 #E98A3A',
    fontFamily: "'Space Grotesk', sans-serif",
    fontWeight: 700,
  } as React.CSSProperties,
  font: "'Space Grotesk', sans-serif",
};

type Slot = { dataUrl: string | null; file: File | null };

export const FaceSetupCard = () => {
  const { user } = useAuth();
  const { profile, refetch } = useProfile();
  const { toast } = useToast();
  const enrolled = !!(profile as any)?.face_descriptor;
  const enrolledAt = (profile as any)?.face_enrolled_at as string | undefined;

  const [slots, setSlots] = useState<Slot[]>([
    { dataUrl: null, file: null },
    { dataUrl: null, file: null },
    { dataUrl: null, file: null },
  ]);
  const [snapIndex, setSnapIndex] = useState<number | null>(null);
  const [processing, setProcessing] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [reEnrolling, setReEnrolling] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const uploadRefs = useRef<(HTMLInputElement | null)[]>([]);

  const showSetup = !enrolled || reEnrolling;

  useEffect(() => {
    if (snapIndex === null) {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (err: any) {
        toast({ title: 'Camera access denied', description: err.message, variant: 'destructive' });
        setSnapIndex(null);
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [snapIndex, toast]);

  const handleSnap = () => {
    if (snapIndex === null || !videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `face-${snapIndex + 1}.jpg`, { type: 'image/jpeg' });
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setSlots((prev) => {
        const next = [...prev];
        next[snapIndex] = { dataUrl, file };
        return next;
      });
      setSnapIndex(null);
    }, 'image/jpeg', 0.9);
  };

  const handleUpload = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSlots((prev) => {
        const next = [...prev];
        next[index] = { dataUrl: reader.result as string, file };
        return next;
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const clearSlot = (index: number) => {
    setSlots((prev) => {
      const next = [...prev];
      next[index] = { dataUrl: null, file: null };
      return next;
    });
  };

  const generateFaceId = async () => {
    if (!user) return;
    if (slots.some((s) => !s.file)) {
      toast({ title: 'Please provide all 3 photos', variant: 'destructive' });
      return;
    }
    setProcessing(true);
    setModelsLoading(true);
    try {
      await ensureFaceModels();
      setModelsLoading(false);

      const descriptors: Float32Array[] = [];
      for (let i = 0; i < slots.length; i++) {
        const img = await fileToImage(slots[i].file!);
        const d = await computeDescriptorFromImage(img);
        if (!d) {
          toast({
            title: `No face detected in photo ${i + 1}`,
            description: 'Please retake or upload a clearer photo.',
            variant: 'destructive',
          });
          setProcessing(false);
          return;
        }
        descriptors.push(d);
      }

      const master = averageDescriptors(descriptors);

      const { error } = await supabase
        .from('profiles')
        .update({
          face_descriptor: serializeDescriptor(master) as any,
          face_enrolled_at: new Date().toISOString(),
        } as any)
        .eq('user_id', user.id);
      if (error) throw error;

      toast({ title: 'Face ID enrolled', description: 'You can now be recognized at events.' });
      setSlots([
        { dataUrl: null, file: null },
        { dataUrl: null, file: null },
        { dataUrl: null, file: null },
      ]);
      setReEnrolling(false);
      await refetch(true);
    } catch (err: any) {
      toast({ title: 'Enrollment failed', description: err.message, variant: 'destructive' });
    } finally {
      setProcessing(false);
      setModelsLoading(false);
    }
  };

  return (
    <div style={NEO.card} className="w-full min-w-0 overflow-hidden">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-bold flex items-center gap-2" style={{ fontFamily: NEO.font, color: '#111' }}>
          <ShieldCheck className="w-5 h-5" /> Face Setup
        </h2>
        {enrolled && !reEnrolling && (
          <span
            className="text-xs px-3 py-1 flex items-center gap-1.5"
            style={{ ...NEO.btn, background: '#86EFAC', boxShadow: '2px 2px 0 #111' }}
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Face ID active
          </span>
        )}
      </div>

      {enrolled && !reEnrolling && (
        <div className="space-y-3">
          <p className="text-sm" style={{ color: '#555', fontFamily: NEO.font }}>
            Your face is enrolled and ready for attendance scanning.
            {enrolledAt && <> Enrolled {new Date(enrolledAt).toLocaleDateString()}.</>}
          </p>
          <button
            onClick={() => setReEnrolling(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm"
            style={NEO.btnDark}
          >
            <RefreshCw className="w-4 h-4" /> Re-enroll
          </button>
        </div>
      )}

      {showSetup && (
        <>
          <p className="text-xs mb-4" style={{ color: '#666', fontFamily: NEO.font }}>
            Provide 3 clear, well-lit photos of your face. Photos are processed locally in your browser and never uploaded —
            only an anonymous mathematical fingerprint is saved.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            {slots.map((slot, i) => (
              <div key={i} style={NEO.slot} className="aspect-square flex flex-col items-center justify-center p-2 relative">
                {slot.dataUrl ? (
                  <>
                    <img src={slot.dataUrl} alt={`Face ${i + 1}`} className="w-full h-full object-cover rounded-md" />
                    <button
                      onClick={() => clearSlot(i)}
                      className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full"
                      style={{ background: '#111', color: '#fff' }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 w-full">
                    <span className="text-3xl font-black" style={{ fontFamily: NEO.font, color: '#111' }}>
                      {i + 1}
                    </span>
                    <button
                      onClick={() => setSnapIndex(i)}
                      className="w-full px-2 py-1.5 text-xs flex items-center justify-center gap-1.5"
                      style={NEO.btn}
                    >
                      <Camera className="w-3.5 h-3.5" /> Snap
                    </button>
                    <button
                      onClick={() => uploadRefs.current[i]?.click()}
                      className="w-full px-2 py-1.5 text-xs flex items-center justify-center gap-1.5"
                      style={{ ...NEO.btn, background: '#FFF8F0' }}
                    >
                      <Upload className="w-3.5 h-3.5" /> Upload
                    </button>
                    <input
                      ref={(el) => (uploadRefs.current[i] = el)}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleUpload(i, e)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3 flex-wrap">
            <button
              onClick={generateFaceId}
              disabled={processing || slots.some((s) => !s.file)}
              className="flex items-center gap-2 px-5 py-2.5 text-sm disabled:opacity-50"
              style={NEO.btn}
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {modelsLoading ? 'Loading models…' : 'Generating Face ID…'}
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" /> Generate Face ID
                </>
              )}
            </button>
            {reEnrolling && (
              <button
                onClick={() => {
                  setReEnrolling(false);
                  setSlots([
                    { dataUrl: null, file: null },
                    { dataUrl: null, file: null },
                    { dataUrl: null, file: null },
                  ]);
                }}
                className="px-5 py-2.5 text-sm"
                style={NEO.btnDark}
              >
                Cancel
              </button>
            )}
          </div>
        </>
      )}

      {/* Snap modal */}
      {snapIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
          <div style={{ ...NEO.card, padding: '16px', maxWidth: '480px', width: '100%' }}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold" style={{ fontFamily: NEO.font, color: '#111' }}>
                Snap photo {snapIndex + 1}
              </h3>
              <button onClick={() => setSnapIndex(null)} className="p-1"><X className="w-5 h-5" /></button>
            </div>
            <video
              ref={videoRef}
              playsInline
              muted
              className="w-full rounded-md"
              style={{ border: '2px solid #111', background: '#000', transform: 'scaleX(-1)' }}
            />
            <div className="flex gap-3 mt-3">
              <button onClick={() => setSnapIndex(null)} className="flex-1 py-2.5 text-sm" style={NEO.btnDark}>
                Cancel
              </button>
              <button onClick={handleSnap} className="flex-1 py-2.5 text-sm flex items-center justify-center gap-2" style={NEO.btn}>
                <Camera className="w-4 h-4" /> Capture
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
