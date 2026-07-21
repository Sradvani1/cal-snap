'use client';

import { PrimaryButton } from '@/components/design/PrimaryButton';
import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils/cn';

interface MealDetailActionsProps {
  hasChanges: boolean;
  itemCount: number;
  isSaving: boolean;
  isDeleting: boolean;
  savedFavorite: boolean;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
  onSaveFavorite: () => void;
}

export function MealDetailActions({
  hasChanges,
  itemCount,
  isSaving,
  isDeleting,
  savedFavorite,
  onSave,
  onCancel,
  onDelete,
  onSaveFavorite,
}: MealDetailActionsProps) {
  return (
    <div className="flex flex-col gap-3">
      <PrimaryButton
        type="button"
        disabled={!hasChanges || itemCount === 0 || isSaving}
        onClick={onSave}
        fullWidth
        className="min-h-11"
      >
        {isSaving ? copy('scanner.result.saving') : copy('scanner.result.saveChanges')}
      </PrimaryButton>

      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={!hasChanges}
          onClick={onCancel}
          className="min-h-11 flex-1 rounded-lg px-4 py-2 text-sm font-medium text-cs-muted hover:text-cs-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cs-primary focus-visible:ring-offset-2 disabled:opacity-50"
        >
          {copy('common.button.cancel')}
        </button>

        <button
          type="button"
          onClick={onSaveFavorite}
          disabled={savedFavorite}
          className={cn(
            'flex min-h-11 min-w-11 items-center justify-center rounded-lg text-lg',
            savedFavorite
              ? 'text-cs-danger'
              : 'text-cs-muted hover:text-cs-danger focus-visible:text-cs-danger',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cs-primary focus-visible:ring-offset-2',
          )}
          aria-label={savedFavorite ? copy('mealLog.actions.savedFavorite') : copy('mealLog.actions.saveFavorite')}
        >
          {savedFavorite ? '♥' : '♡'}
        </button>

        <button
          type="button"
          disabled={isDeleting}
          onClick={onDelete}
          className={cn(
            'min-h-11 flex-1 rounded-lg px-4 py-2 text-sm font-medium text-cs-danger focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cs-primary focus-visible:ring-offset-2 disabled:opacity-50',
          )}
        >
          {isDeleting ? copy('mealLog.actions.deleting') : copy('mealLog.actions.delete')}
        </button>
      </div>

      {itemCount === 0 && (
        <p className="text-center text-sm text-cs-muted">
          {copy('mealLog.actions.noItems')}
        </p>
      )}
    </div>
  );
}
