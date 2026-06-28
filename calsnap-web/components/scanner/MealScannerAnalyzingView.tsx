import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';
import { cn } from '@/lib/utils/cn';

interface MealScannerAnalyzingViewProps {
  onCancel: () => void;
}

export function MealScannerAnalyzingView({ onCancel }: MealScannerAnalyzingViewProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-cs-border bg-cs-surface px-6 py-16 text-center">
      <div
        className="mb-4 h-10 w-10 animate-spin rounded-full border-2 border-cs-border border-t-cs-foreground"
        aria-hidden
      />
      <p className={cn(typography.csBody, 'font-medium')}>{copy('scanner.analyzing.title')}</p>
      <p className={cn(typography.csCaption, 'mt-1')}>{copy('scanner.analyzing.subtitle')}</p>
      <button
        type="button"
        onClick={onCancel}
        className="mt-6 min-h-11 rounded-lg border border-cs-border px-4 py-2 text-sm font-medium text-cs-foreground"
      >
        {copy('common.button.cancel')}
      </button>
    </div>
  );
}
