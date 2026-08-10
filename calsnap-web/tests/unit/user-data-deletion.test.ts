import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  collection: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  writeBatch: vi.fn(),
  deleteObject: vi.fn(),
  listAll: vi.fn(),
  ref: vi.fn(),
}));

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<typeof import('firebase/firestore')>(
    'firebase/firestore',
  );
  return {
    ...actual,
    collection: mocks.collection,
    deleteDoc: mocks.deleteDoc,
    doc: mocks.doc,
    getDocs: mocks.getDocs,
    writeBatch: mocks.writeBatch,
  };
});

vi.mock('firebase/storage', async () => {
  const actual = await vi.importActual<typeof import('firebase/storage')>('firebase/storage');
  return {
    ...actual,
    deleteObject: mocks.deleteObject,
    listAll: mocks.listAll,
    ref: mocks.ref,
  };
});

import { deleteAllUserData } from '@/lib/services/user-data-deletion';

describe('deleteAllUserData', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.collection.mockReturnValue({});
    mocks.doc.mockReturnValue({});
    mocks.listAll.mockResolvedValue({ items: [], prefixes: [] });
    mocks.ref.mockReturnValue({});
  });

  it('deletes malformed meal documents instead of aborting the batch', async () => {
    const malformedRef = {};
    const batch = {
      commit: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn(),
    };
    mocks.writeBatch.mockReturnValue(batch);
    mocks.getDocs
      .mockResolvedValueOnce({
        docs: [
          {
            id: 'malformed-meal',
            data: () => ({ userId: 'user-1' }),
            ref: malformedRef,
          },
        ],
      })
      .mockResolvedValue({ docs: [] });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    try {
      await deleteAllUserData('user-1', {
        db: {} as never,
        storage: {} as never,
      });

      expect(batch.delete).toHaveBeenCalledWith(malformedRef);
      expect(batch.commit).toHaveBeenCalledOnce();
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('Skipping cleanup for malformed meals doc malformed-meal'),
        expect.any(Error),
      );
    } finally {
      warn.mockRestore();
    }
  });

  it('deletes objects found under the user meal prefix', async () => {
    const item = { fullPath: 'users/user-1/meals/meal-1/photo.jpg' };
    mocks.getDocs.mockResolvedValue({ docs: [] });
    mocks.listAll.mockResolvedValue({ items: [item], prefixes: [] });

    await deleteAllUserData('user-1', {
      db: {} as never,
      storage: {} as never,
    });

    expect(mocks.deleteObject).toHaveBeenCalledWith(item);
  });
});
