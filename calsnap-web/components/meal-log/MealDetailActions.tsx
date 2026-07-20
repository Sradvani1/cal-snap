'use client';

import Link from 'next/link';
import { SecondaryButton } from '@/components/design/PrimaryButton';
import { buttonVariants } from '@/components/ui/button';
import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils/cn';

interface MealDetailActionsProps {
  mealId: string;
  onShare: () => void;
  onDelete: () => void;
  onSaveFavorite?: () => void;
  isSharing?: boolean;
  isDeleting?: boolean;
  savedFavorite?: boolean;
}

export function MealDetailActions({
  mealId,
  onShare,
  onDelete,
  onSaveFavorite,
  isSharing = false,
  isDeleting = false,
  savedFavorite = false,
}: MealDetailActionsProps) {
  return (
    <div>
      <div className="flex gap-2">
        <Link
          href={`/scan/edit/${mealId}`}
          className={cn(
            buttonVariants({ variant: 'outline', size: 'default' }),
            'min-h-11 w-full flex-1 text-center',
          )}
        >
          {copy('mealLog.actions.edit')}
        </Link>
        <SecondaryButton
          type="button"
          disabled={isSharing}
          onClick={onShare}
          className="min-h-11 flex-1"
        >
          {isSharing ? copy('mealLog.actions.sharing') : copy('mealLog.actions.share')}
        </SecondaryButton>
        <button
          type="button"
          disabled={isDeleting}
          onClick={onDelete}
          className={cn(
            'flex min-h-11 flex-1 items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-cs-danger disabled:opacity-50',
          )}
        >
          {isDeleting ? copy('mealLog.actions.deleting') : copy('mealLog.actions.delete')}
        </button>
      </div>
      {onSaveFavorite && (
        <div className="mt-3 text-center">
          <button
            type="button"
            disabled={savedFavorite}
            onClick={onSaveFavorite}
            className="text-sm text-cs-muted underline underline-offset-2 hover:text-cs-foreground disabled:no-underline disabled:text-cs-success"
          >
            {savedFavorite ? copy('mealLog.actions.savedFavorite') : copy('mealLog.actions.saveFavorite')}
          </button>
        </div>
      )}
    </div>
  );
}
