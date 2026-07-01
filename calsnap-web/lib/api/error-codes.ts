/** Stable machine-readable API error codes — clients branch on `code`, not localized `error`. */
export const ApiErrorCode = {
  Unauthorized: 'unauthorized',
  MissingIdToken: 'missing_id_token',
  SessionCreationFailed: 'session_creation_failed',
  AuthUnavailable: 'auth_unavailable',

  AnalysisUnavailable: 'analysis_unavailable',
  InvalidFormData: 'invalid_form_data',
  MissingImage: 'missing_image',
  InvalidImageType: 'invalid_image_type',
  ImageTooLarge: 'image_too_large',
  Unrecognizable: 'unrecognizable',
  AnalysisParseFailed: 'analysis_parse_failed',
  AnalysisFailed: 'analysis_failed',

  InsightUnavailable: 'insight_unavailable',
  InvalidJsonBody: 'invalid_json_body',
  InvalidPayload: 'invalid_payload',
  InsufficientLoggedDays: 'insufficient_logged_days',
  EmptyInsightResponse: 'empty_insight_response',
  InsightGenerationFailed: 'insight_generation_failed',
} as const;

export type ApiErrorCode = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];
