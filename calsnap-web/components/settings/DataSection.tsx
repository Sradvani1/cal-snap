'use client';

import { SecondaryButton } from '@/components/design/PrimaryButton';
import { SectionCard } from '@/components/design/SectionCard';
import { copy } from '@/lib/copy';
import { formFieldFocusRingClassName } from '@/lib/design/form-field';
import { cn } from '@/lib/utils/cn';

interface DataSectionProps {
  onExport: () => void;
  onDelete: () => void;
  isExporting: boolean;
}

export function DataSection({ onExport, onDelete, isExporting }: DataSectionProps) {
  return (
    <SectionCard title={copy('settings.section.yourData')}>
      <div className="flex flex-col gap-3">
        <SecondaryButton
          type="button"
          onClick={onExport}
          disabled={isExporting}
          fullWidth
          className="min-h-11 disabled:opacity-50"
        >
          {isExporting ? copy('settings.data.exporting') : copy('settings.data.export')}
        </SecondaryButton>
        <button
          type="button"
          onClick={onDelete}
          className={cn(
            'min-h-11 rounded-lg border border-cs-danger/30 bg-cs-danger/10 px-4 py-3 text-sm font-medium text-cs-danger-text hover:bg-cs-danger/15',
            formFieldFocusRingClassName,
          )}
        >
          {copy('settings.data.deleteAll')}
        </button>
      </div>
    </SectionCard>
  );
}
