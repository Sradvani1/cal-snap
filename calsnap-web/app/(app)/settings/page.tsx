'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import type { ProfileWithExtras } from '@/lib/repositories/profile';
import { useDeleteAllData } from '@/lib/queries/use-delete-all-data';
import { useExportData } from '@/lib/queries/use-export-data';
import { usePlateauAlert } from '@/lib/queries/use-plateau-alert';
import { useProfile } from '@/lib/queries/use-profile';
import { queryKeys } from '@/lib/queries/query-keys';
import { useSaveSettingsProfile } from '@/lib/queries/use-save-settings-profile';
import { useSettingsForm } from '@/lib/settings/use-settings-form';
import { InlineErrorMessage } from '@/components/design/InlineErrorMessage';
import { PrimaryButton } from '@/components/design/PrimaryButton';
import { PlateauAlertSheet } from '@/components/dashboard/PlateauAlertSheet';
import { AboutSection } from '@/components/settings/AboutSection';
import { AccountSection } from '@/components/settings/AccountSection';
import { DataSection } from '@/components/settings/DataSection';
import { DeleteDataDialog } from '@/components/settings/DeleteDataDialog';
import { MacroTargetsSection } from '@/components/settings/MacroTargetsSection';
import { NotificationsSection } from '@/components/settings/NotificationsSection';
import { ProfileSection } from '@/components/settings/ProfileSection';
import { UnitsSection } from '@/components/settings/UnitsSection';
import { copy } from '@/lib/copy';
import { layout } from '@/lib/design/layout';
import { typography } from '@/lib/design/typography';
import { cn } from '@/lib/utils/cn';

interface SettingsContentProps {
  uid: string;
  profileData: ProfileWithExtras;
}

function SettingsContent({ uid, profileData }: SettingsContentProps) {
  const { signOut } = useAuth();
  const queryClient = useQueryClient();
  const form = useSettingsForm(profileData.profile, profileData.extras);
  const saveMutation = useSaveSettingsProfile(uid);
  const exportMutation = useExportData(uid, form.draft.name);
  const deleteMutation = useDeleteAllData(uid);
  const plateau = usePlateauAlert(uid);

  const [saveError, setSaveError] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPlateauSheet, setShowPlateauSheet] = useState(false);

  const handleSave = useCallback(async () => {
    if (!form.canSave) {
      return;
    }
    setSaveError(null);
    try {
      const result = await saveMutation.mutateAsync({
        profile: profileData.profile,
        extras: profileData.extras,
        draft: form.draft,
        macroProteinPct: form.macroProteinPct,
        macroCarbsPct: form.macroCarbsPct,
        macroFatPct: form.macroFatPct,
        currentWeightKg: form.currentWeightKg,
        savedWeightKg: form.savedWeightKg,
        reminderPrefs: form.reminderPrefs,
        unitPrefs: {
          useLbsForWeight: form.useLbsForWeight,
          useImperialForHeight: form.useImperialForHeight,
        },
      });
      form.applySavedValues({
        draft: result.savedDraft,
        currentWeightKg: result.savedCurrentWeightKg,
      });
      if (result.didTriggerPlateau) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.profile(uid) });
        setShowPlateauSheet(true);
      }
    } catch {
      setSaveError(copy('settings.error.saveFailed'));
    }
  }, [form, profileData, saveMutation, queryClient, uid]);

  const handleUseLbsChange = useCallback(
    (value: boolean) => {
      form.setUseLbsForWeight(value);
      form.updateDraft((d) => {
        d.useLbsWeight = value;
        d.useLbsGoalWeight = value;
      });
    },
    [form],
  );

  const handleUseImperialHeightChange = useCallback(
    (value: boolean) => {
      form.setUseImperialForHeight(value);
      form.updateDraft((d) => {
        d.useImperialHeight = value;
      });
    },
    [form],
  );

  const handleExport = useCallback(async () => {
    try {
      await exportMutation.mutateAsync();
    } catch {
      // Error surfaced via exportMutation.isError below.
    }
  }, [exportMutation]);

  const handleDeleteConfirm = useCallback(async () => {
    try {
      await deleteMutation.mutateAsync();
    } catch {
      // Error surfaced via deleteMutation.isError; dialog stays open.
    }
  }, [deleteMutation]);

  const exportError = exportMutation.isError
    ? copy('settings.error.exportFailed')
    : null;
  const deleteError = deleteMutation.isError
    ? copy('settings.error.deleteFailed')
    : null;
  const dataErrorMessage = exportError ?? deleteError;

  return (
    <>
      <div className={cn(layout.pageShell, 'min-h-full gap-4 py-8 pb-28')}>
        <header>
          <h1 className={`${typography.csCardTitle} text-2xl`}>{copy('settings.title')}</h1>
        </header>

        {(saveError || saveMutation.isError) && (
          <InlineErrorMessage
            message={
              saveMutation.isError ? copy('settings.error.saveGeneric') : saveError!
            }
          />
        )}

        {dataErrorMessage && <InlineErrorMessage message={dataErrorMessage} />}

        <ProfileSection
          draft={form.draft}
          onUpdateDraft={form.updateDraft}
          currentWeightKg={form.currentWeightKg}
          onWeightChange={form.setCurrentWeightKg}
          useLbsForWeight={form.useLbsForWeight}
          useImperialForHeight={form.useImperialForHeight}
          previewTDEE={form.previewTDEE}
          previewTarget={form.previewTarget}
          previewDeficit={form.previewDeficit}
          previewGoalTargetDate={form.previewGoalTargetDate}
          hardDeficitUnlocked={form.hardDeficitUnlocked}
          showHardDeficitAlert={form.showHardDeficitAlert}
          onDeficitChange={form.updateDeficit}
          onUnlockHardDeficit={form.unlockHardDeficit}
          onDismissHardDeficitAlert={() => form.setShowHardDeficitAlert(false)}
          minimumCalories={form.minimumCalories}
        />

        <MacroTargetsSection
          proteinPct={form.macroProteinPct}
          carbsPct={form.macroCarbsPct}
          fatPct={form.macroFatPct}
          macroSum={form.macroSum}
          onAdjust={form.adjustMacro}
        />

        <UnitsSection
          useLbsForWeight={form.useLbsForWeight}
          useImperialForHeight={form.useImperialForHeight}
          onUseLbsChange={handleUseLbsChange}
          onUseImperialHeightChange={handleUseImperialHeightChange}
        />

        <NotificationsSection
          reminderPrefs={form.reminderPrefs}
          onChange={form.setReminderPrefs}
        />

        <DataSection
          onExport={() => void handleExport()}
          onDelete={() => setShowDeleteDialog(true)}
          isExporting={exportMutation.isPending}
        />

        <AboutSection />

        <AccountSection onSignOut={() => void signOut()} />

        {form.validationMessage && form.isDirty && (
          <p className="text-sm text-cs-danger">{form.validationMessage}</p>
        )}
      </div>

      {form.isDirty && (
        <div className="fixed inset-x-0 bottom-16 z-40 overflow-x-hidden border-t border-cs-border bg-cs-surface/95 px-4 py-3 backdrop-blur sm:bottom-0">
          <div className="mx-auto flex w-full min-w-0 max-w-lg gap-3">
            <PrimaryButton
              type="button"
              onClick={() => void handleSave()}
              disabled={!form.canSave || saveMutation.isPending}
              fullWidth
              className="min-h-11"
            >
              {saveMutation.isPending
                ? copy('common.button.saving')
                : copy('settings.saveProfile')}
            </PrimaryButton>
          </div>
        </div>
      )}

      <DeleteDataDialog
        open={showDeleteDialog}
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={() => void handleDeleteConfirm()}
        isDeleting={deleteMutation.isPending}
      />

      <PlateauAlertSheet
        open={showPlateauSheet}
        onDietBreak={() => {
          void plateau.applyDietBreak().then(() => setShowPlateauSheet(false));
        }}
        onSmallReduction={() => {
          void plateau.applySmallReduction().then(() => setShowPlateauSheet(false));
        }}
        onDismiss={() => setShowPlateauSheet(false)}
      />
    </>
  );
}

export default function SettingsPage() {
  const { user } = useAuth();
  const uid = user?.uid;
  const profileQuery = useProfile(uid);

  if (profileQuery.isLoading) {
    return (
      <div className={cn(layout.pageShell, 'py-8')}>
        <div className="h-96 animate-pulse rounded-2xl bg-cs-muted/20" />
      </div>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <div className={cn(layout.pageShell, 'py-8')}>
        <InlineErrorMessage message={copy('settings.error.profileLoad')} />
      </div>
    );
  }

  return (
    <SettingsContent
      key={`${profileQuery.data.profile.id}-${profileQuery.data.profile.updatedAt.getTime()}`}
      uid={uid!}
      profileData={profileQuery.data}
    />
  );
}
