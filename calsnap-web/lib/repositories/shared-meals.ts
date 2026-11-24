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
  type DocumentReference,
  type Firestore,
} from 'firebase/firestore';
import { deleteObject, getBlob, ref, uploadBytes } from 'firebase/storage';
import { z } from 'zod';
import { getFirebaseStorage, getFirestoreDb } from '@/lib/firebase/client';
import type { MealEntry } from '@/lib/models/meal-entry';
import { mealDocToEntry, mealEntryToDoc } from '@/lib/models/meal-entry-doc';
import { parseFirestoreDoc } from '@/lib/models/validate-doc';
import {
  createMeal,
  deleteMealPhoto,
  setMealPhotoPath,
  uploadMealPhoto,
} from '@/lib/repositories/meals';
import { sharedMealPhotoStoragePath } from '@/lib/shares/shared-meal-summary';

export { sharedMealPhotoStoragePath };

const DAY_MS = 24 * 60 * 60 * 1000;
export const SHARED_MEAL_TTL_MS = 3 * DAY_MS;

export class SharedMealUnavailableError extends Error {
  constructor(readonly addedMealId: string | null = null) {
    super('Shared meal is expired or does not exist.');
    this.name = 'SharedMealUnavailableError';
  }
}

const sharedMealDocSchema = z.object({ meal: z.unknown() });

const ownedShareSchema = z.object({
  expiresAt: z.instanceof(Timestamp),
  contentKey: z.string().optional(),
  meal: z.object({ photoStoragePath: z.string().optional() }),
});

export interface SharedMealView {
  entry: MealEntry;
  addedMealId: string | null;
}

export function sharedMealLogId(shareId: string): string {
  return `shared-${shareId}`;
}

function errorCode(error: unknown): string | undefined {
  return typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : undefined;
}

function sortedKeysReplacer(_key: string, value: unknown): unknown {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)));
  }
  return value;
}

async function contentKeyFor(entry: MealEntry): Promise<string> {
  const json = JSON.stringify(
    {
      ...entry,
      id: '',
      userId: '',
      photoStoragePath: undefined,
      hasPhoto: Boolean(entry.photoStoragePath),
      timestamp: entry.timestamp.getTime(),
    },
    sortedKeysReplacer,
  );
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(json));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function existingLogId(uid: string, shareId: string, db: Firestore): Promise<string | null> {
  const logId = sharedMealLogId(shareId);
  const existing = await getDoc(doc(db, 'users', uid, 'meals', logId));
  return existing.exists() ? logId : null;
}

async function unavailableError(uid: string, shareId: string, db: Firestore) {
  return new SharedMealUnavailableError(await existingLogId(uid, shareId, db));
}

async function copyPhotoForShare(
  uid: string,
  shareId: string,
  sourcePath: string,
): Promise<string | undefined> {
  const storage = getFirebaseStorage();
  try {
    const blob = await getBlob(ref(storage, sourcePath));
    const path = sharedMealPhotoStoragePath(uid, shareId);
    await uploadBytes(ref(storage, path), blob, { contentType: 'image/jpeg' });
    return path;
  } catch (error) {
    if (errorCode(error) === 'storage/object-not-found') {
      return undefined;
    }
    throw error;
  }
}

interface ExpiredShare {
  id: string;
  ref: DocumentReference;
  photoStoragePath?: string;
}

async function removeExpiredShares(expired: ExpiredShare[]): Promise<void> {
  await Promise.all(
    expired.map(async (share) => {
      try {
        await deleteDoc(share.ref);
        if (share.photoStoragePath) {
          await deleteObject(ref(getFirebaseStorage(), share.photoStoragePath));
        }
      } catch (error) {
        console.warn(`Failed to remove expired shared meal ${share.id}:`, error);
      }
    }),
  );
}

export async function createSharedMeal(
  uid: string,
  entry: MealEntry,
  db: Firestore = getFirestoreDb(),
): Promise<string> {
  const contentKey = await contentKeyFor(entry);
  const ownShares = await getDocs(query(collection(db, 'sharedMeals'), where('ownerUid', '==', uid)));
  const nowMs = Date.now();
  const expired: ExpiredShare[] = [];
  let reusableId: string | undefined;

  for (const docSnap of ownShares.docs) {
    const parsed = ownedShareSchema.safeParse(docSnap.data());
    if (!parsed.success) continue;
    if (parsed.data.expiresAt.toMillis() <= nowMs) {
      expired.push({
        id: docSnap.id,
        ref: docSnap.ref,
        photoStoragePath: parsed.data.meal.photoStoragePath,
      });
    } else if (
      parsed.data.contentKey === contentKey &&
      parsed.data.expiresAt.toMillis() - nowMs >= DAY_MS
    ) {
      reusableId ??= docSnap.id;
    }
  }

  await removeExpiredShares(expired);

  if (reusableId) {
    return reusableId;
  }

  const shareId = crypto.randomUUID();
  const photoStoragePath = entry.photoStoragePath
    ? await copyPhotoForShare(uid, shareId, entry.photoStoragePath)
    : undefined;

  await setDoc(doc(db, 'sharedMeals', shareId), {
    ownerUid: uid,
    expiresAt: Timestamp.fromMillis(nowMs + SHARED_MEAL_TTL_MS),
    contentKey,
    meal: mealEntryToDoc({ ...entry, userId: '', photoStoragePath }),
  });
  return shareId;
}

export async function fetchSharedMeal(
  uid: string,
  shareId: string,
  db: Firestore = getFirestoreDb(),
): Promise<SharedMealView> {
  let snapshot;
  try {
    snapshot = await getDoc(doc(db, 'sharedMeals', shareId));
  } catch (error) {
    if (errorCode(error) === 'permission-denied') {
      throw await unavailableError(uid, shareId, db);
    }
    throw error;
  }
  if (!snapshot.exists()) {
    throw await unavailableError(uid, shareId, db);
  }

  const { meal } = parseFirestoreDoc(sharedMealDocSchema, 'sharedMeals', shareId, snapshot.data());
  return {
    entry: mealDocToEntry(shareId, meal),
    addedMealId: await existingLogId(uid, shareId, db),
  };
}

export interface AddedSharedMeal {
  mealId: string;
  created: boolean;
}

/** Saves the shared meal to the recipient's log without its photo. */
export async function addSharedMealToLog(
  uid: string,
  shareId: string,
  entry: MealEntry,
  db: Firestore = getFirestoreDb(),
): Promise<AddedSharedMeal> {
  const mealId = sharedMealLogId(shareId);
  const existing = await getDoc(doc(db, 'users', uid, 'meals', mealId));
  if (existing.exists()) {
    return { mealId, created: false };
  }

  await createMeal({ ...entry, id: mealId, userId: uid, photoStoragePath: undefined }, db);
  return { mealId, created: true };
}

/** Copies the shared photo into the recipient's storage and attaches it to her meal. */
export async function attachSharedMealPhoto(
  uid: string,
  mealId: string,
  sourcePath: string,
): Promise<void> {
  let blob: Blob;
  try {
    blob = await getBlob(ref(getFirebaseStorage(), sourcePath));
  } catch (error) {
    // The share expired or was deleted after the meal was saved; the meal stays without a photo.
    if (errorCode(error) === 'storage/object-not-found' || errorCode(error) === 'storage/unauthorized') {
      return;
    }
    throw error;
  }

  const path = await uploadMealPhoto(uid, mealId, blob);
  try {
    await setMealPhotoPath(uid, mealId, path);
  } catch (error) {
    await deleteMealPhoto(path);
    throw error;
  }
}
