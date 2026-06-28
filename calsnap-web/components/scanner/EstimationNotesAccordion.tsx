import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';
import { cn } from '@/lib/utils/cn';

interface EstimationNotesAccordionProps {
  notes: string | null;
}

export function EstimationNotesAccordion({ notes }: EstimationNotesAccordionProps) {
  if (!notes) {
    return null;
  }

  return (
    <details className="rounded-lg border border-cs-border bg-cs-surface">
      <summary className={cn(typography.csBody, 'cursor-pointer px-4 py-3 font-medium')}>
        {copy('scanner.notes.title')}
      </summary>
      <p className={cn(typography.csCaption, 'border-t border-cs-border px-4 py-3')}>{notes}</p>
    </details>
  );
}
