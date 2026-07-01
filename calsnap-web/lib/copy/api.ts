export const apiCopy = {
  'api.error.unauthorized': 'Unauthorized',
  'api.session.missingIdToken': 'Missing sign-in token',
  'api.session.invalidJson': 'Invalid request body',
  'api.session.creationFailed': 'Could not create session',
  'api.session.unavailable': 'Sign-in is temporarily unavailable',

  'api.analyze.unavailable': 'Analysis unavailable',
  'api.analyze.invalidFormData': 'Invalid form data',
  'api.analyze.missingImage': 'Missing image',
  'api.analyze.invalidImageType': 'Image must be JPEG',
  'api.analyze.imageTooLarge': 'Image too large',
  'api.analyze.unrecognizable': 'Could not recognize food in this photo',
  'api.analyze.parseFailed': 'Analysis parse failed',
  'api.analyze.failed': 'Analysis failed',

  'api.insight.unavailable': 'Insight unavailable',
  'api.insight.invalidJson': 'Invalid JSON body',
  'api.insight.invalidPayload': 'Invalid payload',
  'api.insight.insufficientDays': 'Insufficient logged days',
  'api.insight.emptyResponse': 'Empty insight response',
  'api.insight.failed': 'Insight generation failed',
} as const;
