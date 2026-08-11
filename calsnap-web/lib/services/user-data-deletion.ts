import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';
import { deleteObject, listAll, ref } from 'firebase/storage';
import {
  maintenanceModeKey,
  plateauSnoozeKey,
} from '@/lib/dashboard/plateau-state';
import { getFirestoreDb, getFirebaseStorage } from '@/lib/firebase/client';
import { mealDocToEntry } from '@/lib/models/meal-entry-doc';
import { PROFILE_DOC_ID } from '@/lib/models/profile-doc';
import { weighInSnoozeKey } from '@/lib/progress/weigh-in-snooze';
import {
  pwaInstallDismissedKey,
  pwaInstallEligibleKey,
} from '@/lib/pwa/install-storage';

const BATCH_SIZE = 450;

export interface DeleteAllUserDataDeps {
  db?: Firestore;
  storage?: ReturnType<typeof getFirebaseStorage>;
}

async function deleteSubcollectionInBatches(
  db: Firestore,
  uid: string,
  subcollection: string,
  onEachDoc?: (docId: string, data: Record<string, unknown>) => Promise<void>,
): Promise<void> {
  const snapshot = await getDocs(collection(db, 'users', uid, subcollection));
  const docs = snapshot.docs;

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const chunk = docs.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    for (const docSnap of chunk) {
      if (onEachDoc) {
        try {
          await onEachDoc(docSnap.id, docSnap.data() as Record<string, unknown>);
        } catch (error) {
          console.warn(
            `Skipping cleanup for malformed ${subcollection} doc ${docSnap.id}:`,
            error,
          );
        }
      }
      batch.delete(docSnap.ref);
    }
    await batch.commit();
  }
}

async function deleteMealPhoto(path: string, storage: ReturnType<typeof getFirebaseStorage>): Promise<void> {
  try {
    await deleteObject(ref(storage, path));
  } catch (error) {
    console.warn('Failed to delete meal photo from Storage:', error);
  }
}

async function deleteStoragePrefix(
  storage: ReturnType<typeof getFirebaseStorage>,
  prefix: string,
): Promise<boolean> {
  try {
    const folderRef = ref(storage, prefix);
    const listing = await listAll(folderRef);
    await Promise.all(listing.items.map((item) => deleteObject(item)));
    const childResults = await Promise.all(
      listing.prefixes.map((subfolder) => deleteStoragePrefix(storage, subfolder.fullPath)),
    );
    return childResults.every(Boolean);
  } catch (error) {
    console.warn('Failed to clean Storage prefix:', prefix, error);
    return false;
  }
}

export function clearUserLocalStorage(uid: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  const keys = [
    plateauSnoozeKey(uid),
    maintenanceModeKey(uid),
    weighInSnoozeKey(uid),
    pwaInstallEligibleKey(uid),
    pwaInstallDismissedKey(uid),
  ];
  for (const key of keys) {
    window.localStorage.removeItem(key);
  }
}

export async function deleteAllUserData(
  uid: string,
  deps: DeleteAllUserDataDeps = {},
): Promise<void> {
  const db = deps.db ?? getFirestoreDb();
  const storage = deps.storage ?? getFirebaseStorage();

  await deleteSubcollectionInBatches(db, uid, 'meals', async (_id, data) => {
    const entry = mealDocToEntry(_id, data);
    if (entry.photoStoragePath) {
      await deleteMealPhoto(entry.photoStoragePath, storage);
    }
  });

  await deleteSubcollectionInBatches(db, uid, 'weighIns');

  await deleteSubcollectionInBatches(db, uid, 'favorites');

  await deleteDoc(doc(db, 'users', uid, 'profile', PROFILE_DOC_ID));

  const storageCleanupSucceeded = await deleteStoragePrefix(storage, `users/${uid}/meals`);

  clearUserLocalStorage(uid);

  if (!storageCleanupSucceeded) {
    console.warn(`User data deleted but Storage cleanup remains incomplete for ${uid}`);
  }
}
