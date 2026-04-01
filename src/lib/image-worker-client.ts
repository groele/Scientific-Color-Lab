import type { AnalyzerOptions, AnalyzerWorkerRequest, AnalyzerWorkerResponse, ImageAnalysisResult } from '@/domain/models';

let worker: Worker | null = null;
const maxDimensionByMode: Record<AnalyzerOptions['detailLevel'], number> = {
  compact: 280,
  balanced: 420,
  complete: 560,
};

export class ImageAnalysisClientError extends Error {
  code: 'decode-failure' | 'canvas-unavailable' | 'worker-failure' | 'stale-result-discarded';

  constructor(code: ImageAnalysisClientError['code'], message: string) {
    super(message);
    this.code = code;
  }
}

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
  options: AnalyzerOptions,
) {
  const maxDimension = maxDimensionByMode[options.detailLevel];
  const scale = Math.min(1, maxDimension / Math.max(sourceWidth, sourceHeight));
  const width = Math.max(1, Math.round(sourceWidth * scale));
  const height = Math.max(1, Math.round(sourceHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new ImageAnalysisClientError('canvas-unavailable', 'Canvas 2D context is unavailable.');
  }

  context.drawImage(drawable, 0, 0, width, height);
  const imageData = context.getImageData(0, 0, width, height);
  return { sourceWidth, sourceHeight, width, height, pixels: imageData.data.buffer };
}

async function loadWithImageBitmap(file: Blob, options: AnalyzerOptions) {
  const bitmap = await createImageBitmap(file);
  const result = drawToCanvas(bitmap, bitmap.width, bitmap.height, options);
  bitmap.close();
  return result;
}

async function loadWithHtmlImage(file: Blob, options: AnalyzerOptions) {
  const url = URL.createObjectURL(file);

  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new ImageAnalysisClientError('decode-failure', 'The source image could not be decoded.'));
      element.src = url;
    });

    return drawToCanvas(image, image.naturalWidth, image.naturalHeight, options);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function analyzePixelsWithWorker(payload: AnalyzerWorkerRequest) {
  return new Promise<ImageAnalysisResult>((resolve, reject) => {
    const currentWorker = getWorker();
    const handleMessage = (event: MessageEvent<AnalyzerWorkerResponse>) => {
      if (event.data.requestId !== payload.requestId) {
        return;
      }
      cleanup();
      resolve(event.data.result);
    };
    const handleError = (error: ErrorEvent) => {
      cleanup();
      reject(
        error.error instanceof Error
          ? error.error
          : new ImageAnalysisClientError('worker-failure', error.message || 'Image analysis worker failed.'),
      );
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

export async function loadImagePixels(file: Blob, options: AnalyzerOptions) {
  try {
    return await loadWithImageBitmap(file, options);
  } catch {
    return loadWithHtmlImage(file, options);
  }
}
