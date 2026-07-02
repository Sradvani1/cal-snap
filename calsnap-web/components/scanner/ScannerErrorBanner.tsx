import type { ScannerErrorKind } from '@/lib/scanner/use-meal-scanner';
import { copy } from '@/lib/copy';
import { formFieldFocusRingClassName } from '@/lib/design/form-field';
import { typography } from '@/lib/design/typography';
import { cn } from '@/lib/utils/cn';

interface ScannerErrorBannerProps {
  error: ScannerErrorKind;
  onRetry?: () => void;
  onManualEntry?: () => void;
}

function errorMessage(error: ScannerErrorKind): string {
  switch (error) {
    case 'offline':
      return copy('scanner.error.offline');
    case 'api':
      return copy('scanner.error.api');
    case 'parse':
      return copy('scanner.error.parse');
    case 'unrecognizable':
      return copy('scanner.error.unrecognizable');
    case 'photoPrep':
      return copy('scanner.error.photoPrep');
  }
}

export function ScannerErrorBanner({ error, onRetry, onManualEntry }: ScannerErrorBannerProps) {
  return (
    <div
      className="rounded-xl border border-cs-danger/30 bg-cs-danger/10 p-4"
      role="alert"
    >
      <p className={cn(typography.csBody, 'text-cs-danger-text')}>{errorMessage(error)}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="min-h-11 rounded-lg bg-cs-danger px-4 py-2 text-sm font-medium text-cs-on-primary"
          >
            {copy('scanner.error.retry')}
          </button>
        )}
        {onManualEntry && (
          <button
            type="button"
            onClick={onManualEntry}
            className={cn(
              'min-h-11 rounded-lg border border-cs-danger/30 bg-cs-surface px-4 py-2 text-sm font-medium text-cs-danger-text',
              formFieldFocusRingClassName,
            )}
          >
            {copy('scanner.capture.manualEntry')}
          </button>
        )}
      </div>
    </div>
  );
}
