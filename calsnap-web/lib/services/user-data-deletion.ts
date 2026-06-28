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
import type { MealEntryDoc } from '@/lib/models/meal-entry-doc';
import { PROFILE_DOC_ID } from '@/lib/models/profile-doc';
import { docToMealEntry } from '@/lib/repositories/meals';
import { weighInSnoozeKey } from '@/lib/progress/weigh-in-snooze';

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
        await onEachDoc(docSnap.id, docSnap.data() as Record<string, unknown>);
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
): Promise<void> {
  try {
    const folderRef = ref(storage, prefix);
    const listing = await listAll(folderRef);
    await Promise.all(
      listing.items.map((item) =>
        deleteObject(item).catch((error) => {
          console.warn('Failed to delete Storage object:', item.fullPath, error);
        }),
      ),
    );
    await Promise.all(
      listing.prefixes.map((subfolder) => deleteStoragePrefix(storage, subfolder.fullPath)),
    );
  } catch (error) {
    console.warn('Failed to list Storage prefix:', prefix, error);
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
    const entry = docToMealEntry(_id, data as unknown as MealEntryDoc);
    if (entry.photoStoragePath) {
      await deleteMealPhoto(entry.photoStoragePath, storage);
    }
  });

  await deleteSubcollectionInBatches(db, uid, 'weighIns');

  await deleteDoc(doc(db, 'users', uid, 'profile', PROFILE_DOC_ID));

  await deleteStoragePrefix(storage, `users/${uid}/meals`);

  clearUserLocalStorage(uid);
}
