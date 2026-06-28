import type { ScannerErrorKind } from '@/lib/scanner/use-meal-scanner';

interface ScannerErrorBannerProps {
  error: ScannerErrorKind;
  onRetry?: () => void;
  onManualEntry?: () => void;
}

const MESSAGES: Record<ScannerErrorKind, string> = {
  offline: 'You appear to be offline. Check your connection and try again.',
  api: 'Analysis failed. The service may be unavailable — try again or enter manually.',
  parse: 'Could not read the analysis response. Try again or enter manually.',
  unrecognizable: 'Could not identify food in this photo. Try a clearer image or enter manually.',
  photoPrep: 'Could not prepare this photo. Try a different image.',
};

export function ScannerErrorBanner({ error, onRetry, onManualEntry }: ScannerErrorBannerProps) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4" role="alert">
      <p className="text-sm text-red-800">{MESSAGES[error]}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="min-h-11 rounded-lg bg-red-800 px-4 py-2 text-sm font-medium text-white"
          >
            Retry
          </button>
        )}
        {onManualEntry && (
          <button
            type="button"
            onClick={onManualEntry}
            className="min-h-11 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-800"
          >
            Enter manually
          </button>
        )}
      </div>
    </div>
  );
}
