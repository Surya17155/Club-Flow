import { faceapi } from './faceApiLoader';

export const FACE_MATCH_THRESHOLD = 0.45;

export async function computeDescriptorFromImage(
  input: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement
): Promise<Float32Array | null> {
  const detection = await faceapi
    .detectSingleFace(input)
    .withFaceLandmarks()
    .withFaceDescriptor();
  return detection?.descriptor ?? null;
}

export function averageDescriptors(arr: Float32Array[]): Float32Array {
  if (!arr.length) throw new Error('No descriptors to average');
  const len = arr[0].length;
  const out = new Float32Array(len);
  for (const d of arr) {
    for (let i = 0; i < len; i++) out[i] += d[i];
  }
  for (let i = 0; i < len; i++) out[i] /= arr.length;
  return out;
}

export function serializeDescriptor(d: Float32Array): number[] {
  return Array.from(d);
}

export function deserializeDescriptor(json: unknown): Float32Array | null {
  if (!Array.isArray(json) || json.length !== 128) return null;
  return Float32Array.from(json as number[]);
}

export async function fileToImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    await img.decode();
    return img;
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}
