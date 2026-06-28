'use client';

import { ConfirmAlertDialog } from '@/components/design/ConfirmAlertDialog';
import { copy } from '@/lib/copy';

interface DeleteDataDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export function DeleteDataDialog({
  open,
  onCancel,
  onConfirm,
  isDeleting,
}: DeleteDataDialogProps) {
  return (
    <ConfirmAlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && !isDeleting) {
          onCancel();
        }
      }}
      title={copy('settings.deleteDialog.title')}
      description={copy('settings.deleteDialog.body')}
      confirmLabel={
        isDeleting ? copy('common.button.deleting') : copy('common.button.delete')
      }
      destructive
      confirmDisabled={isDeleting}
      onConfirm={onConfirm}
    />
  );
}
