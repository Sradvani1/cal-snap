import { NextResponse } from 'next/server';
import { getAdminStorage } from '@/lib/firebase/admin';
import { readSharedMealPreview } from '@/lib/shares/read-shared-meal-preview';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ shareId: string }> },
) {
  const { shareId } = await params;
  const preview = await readSharedMealPreview(shareId);
  if (!preview?.photoStoragePath) {
    return new NextResponse(null, { status: 404 });
  }

  const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  if (!bucketName) {
    console.error('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is not set; shared meal photos cannot be served.');
    return new NextResponse(null, { status: 500 });
  }

  try {
    const [bytes] = await getAdminStorage().bucket(bucketName).file(preview.photoStoragePath).download();
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'private, max-age=300',
      },
    });
  } catch (error) {
    console.warn(`Could not read shared meal photo ${shareId}:`, error);
    return new NextResponse(null, { status: 404 });
  }
}
