import { NextRequest, NextResponse } from 'next/server';
import { ApiErrorCode } from '@/lib/api/error-codes';
import { verifyBearerToken } from '@/lib/auth/verify-bearer-token';
import { AppConstants } from '@/lib/constants';
import { copy, type CopyKey } from '@/lib/copy';
import { analyzeMealImage, GeminiAnalysisError } from '@/lib/gemini/analyze-meal';

const IMAGE_SIZE_BUFFER_BYTES = 64 * 1024;

function apiError(copyKey: CopyKey, code: (typeof ApiErrorCode)[keyof typeof ApiErrorCode], status: number) {
  return NextResponse.json({ error: copy(copyKey), code }, { status });
}

export async function POST(request: NextRequest) {
  const session = await verifyBearerToken(request);
  if (!session) {
    return apiError('api.error.unauthorized', ApiErrorCode.Unauthorized, 401);
  }

  if (!process.env.GEMINI_API_KEY?.trim()) {
    return apiError('api.analyze.unavailable', ApiErrorCode.AnalysisUnavailable, 503);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return apiError('api.analyze.invalidFormData', ApiErrorCode.InvalidFormData, 400);
  }

  const descriptionField = formData.get('description');
  const description =
    typeof descriptionField === 'string' && descriptionField.trim().length > 0
      ? descriptionField.trim()
      : undefined;

  const imageField = formData.get('image');
  const hasImage = imageField instanceof File;

  if (!hasImage && !description) {
    return apiError('api.analyze.missingInput', ApiErrorCode.MissingInput, 400);
  }

  if (hasImage) {
    const mime = imageField.type;
    if (
      mime &&
      mime !== 'image/jpeg' &&
      mime !== 'application/octet-stream'
    ) {
      return apiError('api.analyze.invalidImageType', ApiErrorCode.InvalidImageType, 400);
    }

    const maxBytes = AppConstants.MealPhoto.hardMaxBytes + IMAGE_SIZE_BUFFER_BYTES;
    if (imageField.size > maxBytes) {
      return apiError('api.analyze.imageTooLarge', ApiErrorCode.ImageTooLarge, 400);
    }
  }

  const imageBytes = hasImage ? Buffer.from(await imageField.arrayBuffer()) : undefined;
  const mimeType = hasImage && imageField.type ? imageField.type : 'image/jpeg';

  try {
    const response = await analyzeMealImage({
      imageBytes,
      mimeType,
      description,
    });

    if (response.items.length === 0) {
      return apiError('api.analyze.unrecognizable', ApiErrorCode.Unrecognizable, 422);
    }

    return NextResponse.json(response);
  } catch (error) {
    if (error instanceof GeminiAnalysisError) {
      if (error.code === 'emptyResponse') {
        return apiError('api.analyze.unrecognizable', ApiErrorCode.Unrecognizable, 422);
      }
      if (error.code === 'validationFailed' || error.code === 'invalidJSON') {
        return apiError('api.analyze.parseFailed', ApiErrorCode.AnalysisParseFailed, 502);
      }
      return apiError('api.analyze.failed', ApiErrorCode.AnalysisFailed, 502);
    }
    return apiError('api.analyze.failed', ApiErrorCode.AnalysisFailed, 502);
  }
}
