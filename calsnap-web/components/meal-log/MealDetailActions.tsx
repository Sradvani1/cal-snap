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
  isSharing?: boolean;
  isDeleting?: boolean;
}

export function MealDetailActions({
  mealId,
  onShare,
  onDelete,
  isSharing = false,
  isDeleting = false,
}: MealDetailActionsProps) {
  return (
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
  );
}
