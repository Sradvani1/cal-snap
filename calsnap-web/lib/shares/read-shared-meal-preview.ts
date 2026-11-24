import { Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';
import { getAdminFirestore } from '@/lib/firebase/admin';
import {
  sharedMealPhotoStoragePath,
  type SharedMealSummaryInput,
} from '@/lib/shares/shared-meal-summary';

const sharedMealPreviewSchema = z.object({
  ownerUid: z.string().min(1),
  expiresAt: z.custom<Timestamp>((value) => value instanceof Timestamp),
  meal: z.object({
    mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
    totalCalories: z.number(),
    photoStoragePath: z.string().optional(),
    items: z.array(z.object({ name: z.string() })),
  }),
});

export interface SharedMealPreview {
  meal: SharedMealSummaryInput;
  photoStoragePath?: string;
}

/** Server-only: returns null when the share is missing, expired, or unreadable. */
export async function readSharedMealPreview(shareId: string): Promise<SharedMealPreview | null> {
  try {
    const snapshot = await getAdminFirestore().collection('sharedMeals').doc(shareId).get();
    if (!snapshot.exists) {
      return null;
    }
    const parsed = sharedMealPreviewSchema.safeParse(snapshot.data());
    if (!parsed.success || parsed.data.expiresAt.toMillis() <= Date.now()) {
      return null;
    }
    const expectedPhotoPath = sharedMealPhotoStoragePath(parsed.data.ownerUid, shareId);
    const photoStoragePath =
      parsed.data.meal.photoStoragePath === expectedPhotoPath ? expectedPhotoPath : undefined;
    return { meal: parsed.data.meal, photoStoragePath };
  } catch (error) {
    console.warn(`Could not read shared meal preview ${shareId}:`, error);
    return null;
  }
}
