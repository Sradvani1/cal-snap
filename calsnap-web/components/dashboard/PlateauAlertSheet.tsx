'use client';

import { AppDialog } from '@/components/design/AppDialog';
import { SecondaryButton } from '@/components/design/PrimaryButton';
import { Button } from '@/components/ui/button';
import { copy } from '@/lib/copy';

interface PlateauAlertSheetProps {
  open: boolean;
  onDietBreak: () => void;
  onSmallReduction: () => void;
  onDismiss: () => void;
}

export function PlateauAlertSheet({
  open,
  onDietBreak,
  onSmallReduction,
  onDismiss,
}: PlateauAlertSheetProps) {
  return (
    <AppDialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onDismiss();
        }
      }}
      title={copy('dashboard.plateau.title')}
      description={copy('dashboard.plateau.body')}
    >
      <div className="space-y-3">
        <SecondaryButton
          fullWidth
          type="button"
          onClick={onDietBreak}
          className="h-auto flex-col items-start p-4 text-left"
        >
          <span className="block font-semibold text-cs-foreground">
            {copy('dashboard.plateau.dietBreak.title')}
          </span>
          <span className="mt-1 block text-xs font-normal text-cs-muted">
            {copy('dashboard.plateau.dietBreak.description')}
          </span>
        </SecondaryButton>

        <SecondaryButton
          fullWidth
          type="button"
          onClick={onSmallReduction}
          className="h-auto flex-col items-start p-4 text-left"
        >
          <span className="block font-semibold text-cs-foreground">
            {copy('dashboard.plateau.smallReduction.title')}
          </span>
          <span className="mt-1 block text-xs font-normal text-cs-muted">
            {copy('dashboard.plateau.smallReduction.description')}
          </span>
        </SecondaryButton>

        <Button type="button" variant="ghost" className="min-h-11 w-full" onClick={onDismiss}>
          {copy('dashboard.plateau.remindLater')}
        </Button>
      </div>
    </AppDialog>
  );
}
