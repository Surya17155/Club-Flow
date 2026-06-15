import * as faceapi from 'face-api.js';

let loadPromise: Promise<void> | null = null;

const MODEL_URL = '/models';

export function ensureFaceModels(): Promise<void> {
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    await Promise.all([
      faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
  })().catch((err) => {
    loadPromise = null;
    throw err;
  });
  return loadPromise;
}

export { faceapi };
