import { NextRequest, NextResponse } from 'next/server';
import { verifyApiSession } from '@/lib/auth/verify-api-session';
import { AppConstants } from '@/lib/constants';
import { analyzeMealImage, GeminiAnalysisError } from '@/lib/gemini/analyze-meal';

const IMAGE_SIZE_BUFFER_BYTES = 64 * 1024;

export async function POST(request: NextRequest) {
  const session = await verifyApiSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.GEMINI_API_KEY?.trim()) {
    return NextResponse.json({ error: 'Analysis unavailable' }, { status: 503 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const imageField = formData.get('image');
  if (!(imageField instanceof File)) {
    return NextResponse.json({ error: 'Missing image' }, { status: 400 });
  }

  const mime = imageField.type;
  if (
    mime &&
    mime !== 'image/jpeg' &&
    mime !== 'application/octet-stream'
  ) {
    return NextResponse.json({ error: 'Image must be JPEG' }, { status: 400 });
  }

  const maxBytes = AppConstants.MealPhoto.hardMaxBytes + IMAGE_SIZE_BUFFER_BYTES;
  if (imageField.size > maxBytes) {
    return NextResponse.json({ error: 'Image too large' }, { status: 400 });
  }

  const descriptionField = formData.get('description');
  const description =
    typeof descriptionField === 'string' && descriptionField.trim().length > 0
      ? descriptionField.trim()
      : undefined;

  const buffer = Buffer.from(await imageField.arrayBuffer());

  try {
    const response = await analyzeMealImage({
      imageBytes: buffer,
      mimeType: 'image/jpeg',
      description,
    });

    if (response.items.length === 0) {
      return NextResponse.json({ error: 'unrecognizable' }, { status: 422 });
    }

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof GeminiAnalysisError) {
      if (error.code === 'emptyResponse') {
        return NextResponse.json({ error: 'unrecognizable' }, { status: 422 });
      }
      if (error.code === 'validationFailed' || error.code === 'invalidJSON') {
        return NextResponse.json({ error: 'Analysis parse failed' }, { status: 502 });
      }
      return NextResponse.json({ error: 'Analysis failed' }, { status: 502 });
    }
    return NextResponse.json({ error: 'Analysis failed' }, { status: 502 });
  }
}
