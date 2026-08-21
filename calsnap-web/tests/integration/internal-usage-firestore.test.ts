/**
 * Internal usage documents are server-managed and must never be browser-accessible.
 * Run with: pnpm test:integration
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  assertFails,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { afterAll, beforeAll, describe, it } from 'vitest';

let testEnv: RulesTestEnvironment;

describe('internal usage Firestore rules', () => {
  beforeAll(async () => {
    const rules = fs.readFileSync(path.join(process.cwd(), 'firestore.rules'), 'utf8');
    testEnv = await initializeTestEnvironment({
      projectId: 'demo-calsnap',
      firestore: { rules },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('denies browser reads and writes to aggregate and dedupe documents', async () => {
    const db = testEnv.authenticatedContext('alice').firestore();
    const aggregate = doc(db, 'internalUsageDaily', '2026-08-20_0');
    const dedupe = doc(db, 'internalUsageDedupe', '2026-08-20_hash');

    await assertFails(setDoc(aggregate, { date: '2026-08-20', activeUsers: 1 }));
    await assertFails(getDoc(aggregate));
    await assertFails(setDoc(dedupe, { acceptedEventCount: 1 }));
    await assertFails(getDoc(dedupe));
  });
});
