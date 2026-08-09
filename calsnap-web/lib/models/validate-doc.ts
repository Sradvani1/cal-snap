import type { ZodType } from 'zod';

export function parseFirestoreDoc<T>(
  schema: ZodType<T>,
  collectionName: string,
  docId: string,
  raw: unknown,
): T {
  try {
    return schema.parse(raw);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Invalid Firestore document ${collectionName}/${docId}: ${reason}`,
    );
  }
}

interface FirestoreDocSnapshot {
  id: string;
  data: () => unknown;
}

export function mapValidFirestoreDocs<T>(
  docs: readonly FirestoreDocSnapshot[],
  collectionName: string,
  mapper: (docId: string, raw: unknown) => T,
): T[] {
  const result: T[] = [];

  for (const docSnap of docs) {
    try {
      result.push(mapper(docSnap.id, docSnap.data()));
    } catch (error) {
      console.warn(
        `Skipping malformed ${collectionName} doc ${docSnap.id}:`,
        error,
      );
    }
  }

  return result;
}
