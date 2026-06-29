/**
 * Storage rules integration test — run with Firebase emulators:
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
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { afterAll, beforeAll, describe, it } from 'vitest';

let testEnv: RulesTestEnvironment;

describe('storage rules', () => {
  beforeAll(async () => {
    const rulesPath = path.join(process.cwd(), 'storage.rules');
    const rules = fs.readFileSync(rulesPath, 'utf8');
    testEnv = await initializeTestEnvironment({
      projectId: 'demo-calsnap',
      storage: { rules },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('allows owner read/write on meal photos', async () => {
    const alice = testEnv.authenticatedContext('alice');
    const storage = alice.storage();
    const objectRef = ref(storage, 'users/alice/meals/meal-1/photo.jpg');
    const payload = new Uint8Array([1, 2, 3, 4]);

    await assertSucceeds(uploadBytes(objectRef, payload, { contentType: 'image/jpeg' }));
    await assertSucceeds(getDownloadURL(objectRef));
  });

  it('denies cross-user write', async () => {
    const bob = testEnv.authenticatedContext('bob');
    const storage = bob.storage();
    const objectRef = ref(storage, 'users/alice/meals/meal-1/photo.jpg');
    const payload = new Uint8Array([1, 2, 3, 4]);

    await assertFails(uploadBytes(objectRef, payload, { contentType: 'image/jpeg' }));
  });

  it('denies cross-user read', async () => {
    const alice = testEnv.authenticatedContext('alice');
    const aliceStorage = alice.storage();
    const objectRef = ref(aliceStorage, 'users/alice/meals/meal-1/photo.jpg');
    const payload = new Uint8Array([1, 2, 3, 4]);
    await assertSucceeds(uploadBytes(objectRef, payload, { contentType: 'image/jpeg' }));

    const bob = testEnv.authenticatedContext('bob');
    const bobStorage = bob.storage();
    const bobRef = ref(bobStorage, 'users/alice/meals/meal-1/photo.jpg');

    await assertFails(getDownloadURL(bobRef));
  });
});
