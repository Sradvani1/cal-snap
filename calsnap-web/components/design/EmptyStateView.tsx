import Link from 'next/link';
import type { ReactNode } from 'react';

import { PrimaryButton } from '@/components/design/PrimaryButton';
import { copy, type CopyKey } from '@/lib/copy';
import { cn } from '@/lib/utils/cn';
import { typography } from '@/lib/design/typography';

interface EmptyStateViewProps {
  icon: ReactNode;
  titleKey: CopyKey;
  messageKey: CopyKey;
  actionTitleKey?: CopyKey;
  actionHref?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyStateView({
  icon,
  titleKey,
  messageKey,
  actionTitleKey,
  actionHref,
  onAction,
  className,
}: EmptyStateViewProps) {
  const actionButton =
    actionTitleKey && actionHref ? (
      <Link href={actionHref} className="inline-flex">
        <PrimaryButton aria-label={copy('designSystem.emptyState.actionHint')}>
          {copy(actionTitleKey)}
        </PrimaryButton>
      </Link>
    ) : actionTitleKey && onAction ? (
      <PrimaryButton
        type="button"
        onClick={onAction}
        aria-label={copy('designSystem.emptyState.actionHint')}
      >
        {copy(actionTitleKey)}
      </PrimaryButton>
    ) : null;

  return (
    <div
      className={cn(
        'flex flex-col items-center gap-3 rounded-2xl border border-cs-border bg-cs-surface px-6 py-10 text-center',
        className,
      )}
    >
      <div className="text-4xl" aria-hidden>
        {icon}
      </div>
      <h3 className={typography.csCardTitle}>{copy(titleKey)}</h3>
      <p className={cn(typography.csCaption, 'max-w-sm')}>{copy(messageKey)}</p>
      {actionButton}
    </div>
  );
}
