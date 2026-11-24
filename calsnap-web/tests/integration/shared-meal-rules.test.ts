/**
 * Shared meal rules integration test — run with Firebase emulators:
 *
 *   pnpm test:integration
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { afterAll, beforeAll, describe, it } from 'vitest';

let testEnv: RulesTestEnvironment;

const DAY_MS = 24 * 60 * 60 * 1000;

describe('shared meal rules', () => {
  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'demo-calsnap',
      firestore: { rules: fs.readFileSync(path.join(process.cwd(), 'firestore.rules'), 'utf8') },
      storage: { rules: fs.readFileSync(path.join(process.cwd(), 'storage.rules'), 'utf8') },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  async function seedShare(shareId: string, ownerUid: string, expiresInMs: number) {
    await testEnv.withSecurityRulesDisabled(async (ctx) => {
      await setDoc(doc(ctx.firestore(), 'sharedMeals', shareId), {
        ownerUid,
        expiresAt: Timestamp.fromMillis(Date.now() + expiresInMs),
        meal: {},
      });
      await uploadBytes(ref(ctx.storage(), `sharedMeals/${ownerUid}/${shareId}/photo.jpg`), new Uint8Array([1]), {
        contentType: 'image/jpeg',
      });
    });
  }

  it('lets the owner create a share for themselves only', async () => {
    const alice = testEnv.authenticatedContext('alice-create').firestore();
    const payload = {
      ownerUid: 'alice-create',
      expiresAt: Timestamp.fromMillis(Date.now() + 3 * DAY_MS),
      meal: {},
    };

    await assertSucceeds(setDoc(doc(alice, 'sharedMeals', 'share-create-own'), payload));
    await assertFails(
      setDoc(doc(alice, 'sharedMeals', 'share-create-other'), { ...payload, ownerUid: 'bob-create' }),
    );
  });

  it('rejects shares that try to last longer than three days', async () => {
    const alice = testEnv.authenticatedContext('alice-long').firestore();

    await assertFails(
      setDoc(doc(alice, 'sharedMeals', 'share-long'), {
        ownerUid: 'alice-long',
        expiresAt: Timestamp.fromMillis(Date.now() + 30 * DAY_MS),
        meal: {},
      }),
    );
  });

  it('lets any signed-in user read an unexpired share but not an expired one', async () => {
    await seedShare('share-live', 'alice-read', 3 * DAY_MS);
    await seedShare('share-expired', 'alice-read', -DAY_MS);
    const bob = testEnv.authenticatedContext('bob-read').firestore();

    await assertSucceeds(getDoc(doc(bob, 'sharedMeals', 'share-live')));
    await assertFails(getDoc(doc(bob, 'sharedMeals', 'share-expired')));
    await assertFails(getDoc(doc(testEnv.unauthenticatedContext().firestore(), 'sharedMeals', 'share-live')));
  });

  it('blocks listing other users shares, but owners can list their own', async () => {
    await seedShare('share-listed', 'alice-list', 3 * DAY_MS);
    const bob = testEnv.authenticatedContext('bob-list').firestore();
    const alice = testEnv.authenticatedContext('alice-list').firestore();

    await assertFails(getDocs(collection(bob, 'sharedMeals')));
    await assertSucceeds(
      getDocs(query(collection(alice, 'sharedMeals'), where('ownerUid', '==', 'alice-list'))),
    );
  });

  it('lets only the owner delete a share and blocks updates', async () => {
    await seedShare('share-delete', 'alice-delete', 3 * DAY_MS);
    const bob = testEnv.authenticatedContext('bob-delete').firestore();
    const alice = testEnv.authenticatedContext('alice-delete').firestore();

    await assertFails(setDoc(doc(alice, 'sharedMeals', 'share-delete'), { ownerUid: 'alice-delete' }, { merge: true }));
    await assertFails(deleteDoc(doc(bob, 'sharedMeals', 'share-delete')));
    await assertSucceeds(deleteDoc(doc(alice, 'sharedMeals', 'share-delete')));
  });

  it('lets a signed-in user read a shared photo only while the share is live', async () => {
    await seedShare('share-photo-live', 'alice-photo', 3 * DAY_MS);
    await seedShare('share-photo-expired', 'alice-photo', -DAY_MS);
    const bob = testEnv.authenticatedContext('bob-photo').storage();

    await assertSucceeds(getDownloadURL(ref(bob, 'sharedMeals/alice-photo/share-photo-live/photo.jpg')));
    await assertFails(getDownloadURL(ref(bob, 'sharedMeals/alice-photo/share-photo-expired/photo.jpg')));
  });

  it('blocks writing another user shared photos', async () => {
    const bob = testEnv.authenticatedContext('bob-write').storage();

    await assertFails(
      uploadBytes(ref(bob, 'sharedMeals/alice-write/share-x/photo.jpg'), new Uint8Array([1]), {
        contentType: 'image/jpeg',
      }),
    );
  });
});
