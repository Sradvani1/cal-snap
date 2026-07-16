/**
 * Wipes all CalSnap user data from Firebase Auth, Firestore, and Storage.
 * Requires FIREBASE_ADMIN_* credentials (see .env.local.example).
 *
 * Usage (from calsnap-web/):
 *   node --env-file=.env.local scripts/wipe-firebase-data.mjs
 *   node --env-file=.env.local scripts/wipe-firebase-data.mjs --confirm calsnap-web
 */

import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

const projectId =
  process.env.FIREBASE_ADMIN_PROJECT_ID ??
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ??
  'calsnap-web';

const confirmArg = process.argv.find((arg) => arg.startsWith('--confirm='));
const confirmedProject = confirmArg?.slice('--confirm='.length);

if (confirmedProject !== projectId) {
  console.error(
    `Refusing to wipe project "${projectId}". Re-run with:\n` +
      `  node --env-file=.env.local scripts/wipe-firebase-data.mjs --confirm=${projectId}`,
  );
  process.exit(1);
}

if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true') {
  console.error('Refusing to wipe while NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true');
  process.exit(1);
}

const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

if (!clientEmail || !privateKey) {
  console.error('Missing FIREBASE_ADMIN_CLIENT_EMAIL or FIREBASE_ADMIN_PRIVATE_KEY');
  process.exit(1);
}

if (getApps().length === 0) {
  initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

const auth = getAuth();
const db = getFirestore();
const bucket = getStorage().bucket();

async function deleteAllAuthUsers() {
  let pageToken;
  let total = 0;

  do {
    const page = await auth.listUsers(1000, pageToken);
    const uids = page.users.map((user) => user.uid);
    if (uids.length > 0) {
      const result = await auth.deleteUsers(uids);
      total += result.successCount;
      if (result.failureCount > 0) {
        console.warn('Auth delete failures:', result.errors);
      }
    }
    pageToken = page.pageToken;
  } while (pageToken);

  console.log(`Deleted ${total} auth user(s)`);
}

async function deleteFirestoreUsers() {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.listDocuments();
  if (snapshot.length === 0) {
    console.log('No Firestore user root documents');
    return;
  }

  for (const userDoc of snapshot) {
    await db.recursiveDelete(userDoc);
    console.log(`Deleted Firestore data for ${userDoc.id}`);
  }
}

async function deleteUserStorage() {
  const [files] = await bucket.getFiles({ prefix: 'users/' });
  if (files.length === 0) {
    console.log('No Storage objects under users/');
    return;
  }

  await Promise.all(
    files.map((file) =>
      file.delete().catch((error) => {
        console.warn(`Failed to delete ${file.name}:`, error.message);
      }),
    ),
  );
  console.log(`Deleted ${files.length} Storage object(s) under users/`);
}

console.log(`Wiping Firebase project: ${projectId}`);
await deleteAllAuthUsers();
await deleteFirestoreUsers();
await deleteUserStorage();
console.log('Done.');
