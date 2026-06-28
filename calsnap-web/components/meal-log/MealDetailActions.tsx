'use client';

import Link from 'next/link';

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
        className="flex min-h-11 flex-1 items-center justify-center rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-900"
      >
        Edit
      </Link>
      <button
        type="button"
        disabled={isSharing}
        onClick={onShare}
        className="flex min-h-11 flex-1 items-center justify-center rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-900 disabled:opacity-50"
      >
        {isSharing ? 'Sharing…' : 'Share'}
      </button>
      <button
        type="button"
        disabled={isDeleting}
        onClick={onDelete}
        className="flex min-h-11 flex-1 items-center justify-center rounded-lg px-4 py-2 text-sm font-medium text-red-600 disabled:opacity-50"
      >
        {isDeleting ? 'Deleting…' : 'Delete'}
      </button>
    </div>
  );
}
