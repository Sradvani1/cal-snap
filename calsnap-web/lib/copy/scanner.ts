export const scannerCopy = {
  'scanner.title': 'Scan meal',
  'scanner.edit.title': 'Edit meal',
  'scanner.discard': 'Discard',
  'scanner.confirm.discardScan':
    'Discard unsaved meal scan? Your progress will be lost.',
  'scanner.confirm.discardScanShort': 'Discard unsaved meal scan?',
  'scanner.confirm.discardEdits': 'Discard unsaved edits? Your changes will be lost.',
  'scanner.confirm.discardTitle': 'Discard changes?',
  'scanner.capture.prompt': 'Take a photo, or describe your meal below',
  'scanner.capture.camera': 'Camera',
  'scanner.capture.gallery': 'Gallery',
  'scanner.capture.description': 'Description',
  'scanner.capture.addDescription': 'Add meal description',
  'scanner.capture.editDescription': 'Edit',
  'scanner.capture.saveDescription': 'Save Description',
  'scanner.capture.cancelDescription': 'Cancel',
  'scanner.capture.descriptionHelper':
    'Describe what you ate so we can estimate nutritional values.',
  'scanner.capture.descriptionPlaceholder': 'e.g. 2 eggs, 2 slices toast, coffee with milk',
  'scanner.capture.analyze': 'Analyze',
  'scanner.capture.photoAlt': 'Selected meal',
  'scanner.analyzing.title': 'Analyzing your meal…',
  'scanner.analyzing.subtitle': 'This usually takes a few seconds',
  'scanner.error.offline':
    'You appear to be offline. Check your connection and try again.',
  'scanner.error.api':
    'Analysis failed. The service may be unavailable — try again.',
  'scanner.error.parse':
    'Could not read the analysis response. Try again.',
  'scanner.error.unrecognizable':
    'Could not identify food from this input. Try a different photo or rephrase your description.',
  'scanner.error.photoPrep': 'Could not prepare this photo. Try a different image.',
  'scanner.error.retry': 'Retry',
  'scanner.result.lowConfidence':
    'All items have low confidence — review portions carefully before logging.',
  'scanner.result.items': 'Items',
  'scanner.result.logMeal': 'Log this meal',
  'scanner.result.logging': 'Logging…',
  'scanner.result.saveChanges': 'Save changes',
  'scanner.result.saving': 'Saving…',
  'scanner.result.reAnalyze': 'Re-analyze',
  'scanner.result.discard': 'Discard',
  'scanner.result.photoAlt': 'Meal',
  'scanner.error.logFailed': 'Failed to log meal. Try again.',
  'scanner.error.saveFailed': 'Failed to save meal. Try again.',
  'scanner.error.mealNotFound': 'Meal not found.',
  'scanner.error.mealLoadFailed': 'Could not load meal.',
  'scanner.error.backToLog': 'Back to log',
  'scanner.mealType.title': 'Meal type',
  'scanner.mealType.suggested': 'Suggested: {{type}}',
  'scanner.confidence.high': 'High confidence',
  'scanner.confidence.medium': 'Medium confidence',
  'scanner.confidence.low': 'Low confidence',
  'scanner.item.review': 'Review',
  'scanner.item.edit': 'Edit',
  'scanner.editSheet.title': 'Edit item',
  'scanner.editSheet.weightLabel': 'Weight (g)',
  'scanner.editSheet.weightHint':
    'Calories and macros scale proportionally when weight changes.',
  'scanner.notes.title': 'Estimation notes',
} as const;

export type ScannerCopyKey = keyof typeof scannerCopy;
