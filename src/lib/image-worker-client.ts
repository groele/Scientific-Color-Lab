import type { AnalyzerWorkerRequest, AnalyzerWorkerResponse, ImageAnalysisResult } from '@/domain/models';

let worker: Worker | null = null;

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL('../workers/image-analysis.worker.ts', import.meta.url), { type: 'module' });
  }

  return worker;
}

function drawToCanvas(
  drawable: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
) {
  const maxDimension = 240;
  const scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Canvas 2D context is unavailable.');
  }

  context.drawImage(drawable, 0, 0, width, height);
  const imageData = context.getImageData(0, 0, width, height);
  return { width, height, pixels: imageData.data.buffer };
}

async function loadWithImageBitmap(file: Blob) {
  const bitmap = await createImageBitmap(file);
  const result = drawToCanvas(bitmap, bitmap.width, bitmap.height);
  bitmap.close();
  return result;
}

async function loadWithHtmlImage(file: Blob) {
  const url = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error('The source image could not be decoded.'));
      element.src = url;
    });

    return drawToCanvas(image, image.naturalWidth, image.naturalHeight);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function analyzePixelsWithWorker(payload: AnalyzerWorkerRequest) {
  return new Promise<ImageAnalysisResult>((resolve, reject) => {
    const currentWorker = getWorker();
    const handleMessage = (event: MessageEvent<AnalyzerWorkerResponse>) => {
      cleanup();
      resolve(event.data.result);
    };
    const handleError = (error: ErrorEvent) => {
      cleanup();
      reject(error.error ?? new Error(error.message));
    };
    const cleanup = () => {
      currentWorker.removeEventListener('message', handleMessage);
      currentWorker.removeEventListener('error', handleError);
    };

    currentWorker.addEventListener('message', handleMessage);
    currentWorker.addEventListener('error', handleError);
    currentWorker.postMessage(payload, [payload.pixels]);
  });
}

export async function loadImagePixels(file: Blob) {
  try {
    return await loadWithImageBitmap(file);
  } catch {
    return loadWithHtmlImage(file);
  }
}
