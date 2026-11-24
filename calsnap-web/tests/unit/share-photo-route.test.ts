import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  readSharedMealPreview: vi.fn(),
  download: vi.fn(),
  file: vi.fn(),
  bucket: vi.fn(),
}));

vi.mock('@/lib/shares/read-shared-meal-preview', () => ({
  readSharedMealPreview: mocks.readSharedMealPreview,
}));

vi.mock('@/lib/firebase/admin', () => ({
  getAdminStorage: () => ({ bucket: mocks.bucket }),
}));

import { GET } from '@/app/api/share/[shareId]/photo/route';

function call(shareId: string) {
  return GET(new Request('http://localhost'), { params: Promise.resolve({ shareId }) });
}

describe('GET /api/share/[shareId]/photo', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', 'calsnap-web.firebasestorage.app');
    mocks.bucket.mockReturnValue({ file: mocks.file });
    mocks.file.mockReturnValue({ download: mocks.download });
  });

  it('serves the photo for a live share', async () => {
    mocks.readSharedMealPreview.mockResolvedValue({
      meal: { mealType: 'dinner', totalCalories: 1, items: [] },
      photoStoragePath: 'sharedMeals/alice/share-1/photo.jpg',
    });
    mocks.download.mockResolvedValue([Buffer.from([1, 2, 3])]);

    const response = await call('share-1');

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('image/jpeg');
    expect(mocks.bucket).toHaveBeenCalledWith('calsnap-web.firebasestorage.app');
    expect(mocks.file).toHaveBeenCalledWith('sharedMeals/alice/share-1/photo.jpg');
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([1, 2, 3]));
  });

  it('returns 404 for expired or photo-less shares', async () => {
    mocks.readSharedMealPreview.mockResolvedValue(null);

    expect((await call('share-1')).status).toBe(404);
    expect(mocks.download).not.toHaveBeenCalled();
  });

  it('returns 500 when the storage bucket is not configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', '');
    mocks.readSharedMealPreview.mockResolvedValue({
      meal: { mealType: 'dinner', totalCalories: 1, items: [] },
      photoStoragePath: 'sharedMeals/alice/share-1/photo.jpg',
    });
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      expect((await call('share-1')).status).toBe(500);
      expect(error).toHaveBeenCalled();
    } finally {
      error.mockRestore();
    }
  });

  it('returns 404 when the photo cannot be downloaded', async () => {
    mocks.readSharedMealPreview.mockResolvedValue({
      meal: { mealType: 'dinner', totalCalories: 1, items: [] },
      photoStoragePath: 'sharedMeals/alice/share-1/photo.jpg',
    });
    mocks.download.mockRejectedValue(new Error('not found'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      expect((await call('share-1')).status).toBe(404);
    } finally {
      warn.mockRestore();
    }
  });
});
