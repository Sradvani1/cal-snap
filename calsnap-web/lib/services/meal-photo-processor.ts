import { AppConstants } from '@/lib/constants';

export interface PreparedMealImage {
  blob: Blob;
  mimeType: 'image/jpeg';
  pixelWidth: number;
  pixelHeight: number;
  byteCount: number;
}

export type MealPhotoProcessorErrorCode = 'encodingFailed' | 'hardByteCapExceeded';

export class MealPhotoProcessorError extends Error {
  constructor(public readonly code: MealPhotoProcessorErrorCode) {
    super(code);
    this.name = 'MealPhotoProcessorError';
  }
}

export interface RetryStep {
  maxLongEdge: number;
  quality: number;
}

/** Bounded retry sequence that preserves resolution before final quality fallbacks. */
export function mealPhotoRetrySteps(): RetryStep[] {
  const steps: RetryStep[] = [];
  const longEdges = AppConstants.MealPhoto.longEdgeRetrySteps.filter(
    (maxLongEdge) => maxLongEdge >= AppConstants.MealPhoto.minLongEdgePx,
  );
  const qualities = AppConstants.MealPhoto.qualityRetrySteps.filter(
    (quality) => quality >= AppConstants.MealPhoto.minJPEGQuality,
  );
  const preferredQuality = qualities[0];
  const smallestLongEdge = longEdges.at(-1);

  if (preferredQuality === undefined || smallestLongEdge === undefined) {
    return steps;
  }

  for (const quality of qualities) {
    steps.push({ maxLongEdge: longEdges[0], quality });
  }
  for (const maxLongEdge of longEdges.slice(1)) {
    steps.push({ maxLongEdge, quality: preferredQuality });
  }
  for (const quality of qualities.slice(1)) {
    steps.push({ maxLongEdge: smallestLongEdge, quality });
  }
  return steps;
}

/** Scale dimensions so the long edge does not exceed maxLongEdge (never upscale). */
export function scaledDimensions(
  width: number,
  height: number,
  maxLongEdge: number,
): { width: number; height: number } {
  const longEdge = Math.max(width, height);
  if (longEdge <= maxLongEdge) {
    return { width, height };
  }
  const scale = maxLongEdge / longEdge;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

export function selectFirstUnderByteCap(
  candidates: Array<{ byteCount: number } & RetryStep>,
): ({ byteCount: number } & RetryStep) | null {
  return candidates.find((c) => c.byteCount <= AppConstants.MealPhoto.hardMaxBytes) ?? null;
}

function createCanvas(width: number, height: number): HTMLCanvasElement | OffscreenCanvas {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

async function canvasToJpegBlob(
  canvas: HTMLCanvasElement | OffscreenCanvas,
  quality: number,
): Promise<Blob | null> {
  if (canvas instanceof OffscreenCanvas) {
    return canvas.convertToBlob({ type: 'image/jpeg', quality });
  }
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', quality);
  });
}

async function encodeBitmap(
  bitmap: ImageBitmap,
  maxLongEdge: number,
  quality: number,
): Promise<PreparedMealImage | null> {
  const { width, height } = scaledDimensions(bitmap.width, bitmap.height, maxLongEdge);
  const canvas = createCanvas(width, height);
  const context = canvas.getContext('2d');
  if (!context) {
    return null;
  }

  context.drawImage(bitmap, 0, 0, width, height);

  const blob = await canvasToJpegBlob(canvas, quality);
  if (!blob) {
    return null;
  }

  return {
    blob,
    mimeType: 'image/jpeg',
    pixelWidth: width,
    pixelHeight: height,
    byteCount: blob.size,
  };
}

export async function prepareForAnalysisAndStorage(file: File): Promise<PreparedMealImage> {
  const bitmap = await createImageBitmap(file);
  try {
    let didEncode = false;

    for (const step of mealPhotoRetrySteps()) {
      const prepared = await encodeBitmap(bitmap, step.maxLongEdge, step.quality);
      if (!prepared) {
        continue;
      }
      didEncode = true;
      if (prepared.byteCount <= AppConstants.MealPhoto.hardMaxBytes) {
        return prepared;
      }
    }

    if (!didEncode) {
      throw new MealPhotoProcessorError('encodingFailed');
    }
    throw new MealPhotoProcessorError('hardByteCapExceeded');
  } finally {
    bitmap.close();
  }
}
