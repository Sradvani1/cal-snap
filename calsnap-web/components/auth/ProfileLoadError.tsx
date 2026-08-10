import { EmptyStateView } from '@/components/design/EmptyStateView';
import { SecondaryButton } from '@/components/design/PrimaryButton';
import { copy } from '@/lib/copy';

export function ProfileLoadError({
  onRetry,
  onSignOut,
}: {
  onRetry: () => void;
  onSignOut?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <EmptyStateView
        icon="!"
        titleKey="common.error.title"
        messageKey="dashboard.error.profileLoad"
        actionTitleKey="common.button.retry"
        onAction={onRetry}
        className="w-full"
      />
      {onSignOut && (
        <SecondaryButton type="button" onClick={onSignOut}>
          {copy('settings.account.signOut')}
        </SecondaryButton>
      )}
    </div>
  );
}
