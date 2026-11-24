import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  readSharedMealPreview: vi.fn(),
}));

vi.mock('@/lib/shares/read-shared-meal-preview', () => ({
  readSharedMealPreview: mocks.readSharedMealPreview,
}));

import { generateMetadata } from '@/app/(app)/share/[shareId]/layout';

function metadataFor(shareId: string) {
  return generateMetadata({
    children: null,
    params: Promise.resolve({ shareId }),
  });
}

const livePreview = {
  meal: {
    mealType: 'dinner' as const,
    totalCalories: 850,
    items: [{ name: 'Salmon' }, { name: 'Rice' }],
  },
  photoStoragePath: 'sharedMeals/alice/share-1/photo.jpg',
};

describe('share page metadata', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://calsnap-web.vercel.app/');
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', '');
    vi.stubEnv('VERCEL_URL', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('describes a live share with its photo', async () => {
    mocks.readSharedMealPreview.mockResolvedValue(livePreview);

    const metadata = await metadataFor('share-1');

    expect(metadata.title).toBe('Dinner · 850 kcal');
    expect(metadata.description).toBe('Salmon, Rice');
    expect(metadata.openGraph).toMatchObject({
      images: ['https://calsnap-web.vercel.app/api/share/share-1/photo'],
    });
  });

  it('falls back to VERCEL_PROJECT_PRODUCTION_URL when NEXT_PUBLIC_APP_URL is unset', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
    vi.stubEnv('VERCEL_PROJECT_PRODUCTION_URL', 'calsnap-web.vercel.app');
    mocks.readSharedMealPreview.mockResolvedValue(livePreview);

    const metadata = await metadataFor('share-1');

    expect(metadata.openGraph).toMatchObject({
      images: ['https://calsnap-web.vercel.app/api/share/share-1/photo'],
    });
  });

  it('omits the image when no site URL is configured', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
    mocks.readSharedMealPreview.mockResolvedValue(livePreview);

    const metadata = await metadataFor('share-1');

    expect(metadata.openGraph).toMatchObject({ images: undefined });
  });

  it('omits the image when the share has no photo', async () => {
    mocks.readSharedMealPreview.mockResolvedValue({ ...livePreview, photoStoragePath: undefined });

    const metadata = await metadataFor('share-1');

    expect(metadata.openGraph).toMatchObject({ images: undefined });
  });

  it('uses a generic title with no meal details for an unavailable share', async () => {
    mocks.readSharedMealPreview.mockResolvedValue(null);

    const metadata = await metadataFor('share-1');

    expect(metadata).toEqual({ title: 'Shared meal' });
  });
});
