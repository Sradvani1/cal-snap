'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { useAuth } from '@/lib/auth/use-auth';
import type { ProfileWithExtras } from '@/lib/repositories/profile';
import { useDeleteAllData } from '@/lib/queries/use-delete-all-data';
import { useExportData } from '@/lib/queries/use-export-data';
import { usePlateauAlert } from '@/lib/queries/use-plateau-alert';
import { useProfile } from '@/lib/queries/use-profile';
import { queryKeys } from '@/lib/queries/query-keys';
import { useSaveSettingsProfile } from '@/lib/queries/use-save-settings-profile';
import { useSettingsForm } from '@/lib/settings/use-settings-form';
import { SessionErrorBanner } from '@/components/auth/SessionErrorBanner';
import { PlateauAlertSheet } from '@/components/dashboard/PlateauAlertSheet';
import { AboutSection } from '@/components/settings/AboutSection';
import { AccountSection } from '@/components/settings/AccountSection';
import { DataSection } from '@/components/settings/DataSection';
import { DeleteDataDialog } from '@/components/settings/DeleteDataDialog';
import { MacroTargetsSection } from '@/components/settings/MacroTargetsSection';
import { NotificationsSection } from '@/components/settings/NotificationsSection';
import { ProfileSection } from '@/components/settings/ProfileSection';
import { UnitsSection } from '@/components/settings/UnitsSection';

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
      form.markSaved();
      if (result.didTriggerPlateau) {
        await queryClient.invalidateQueries({ queryKey: queryKeys.profile(uid) });
        setShowPlateauSheet(true);
      }
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Failed to save profile');
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
      // Error surfaced via exportMutation.error below.
    }
  }, [exportMutation]);

  const handleDeleteConfirm = useCallback(async () => {
    try {
      await deleteMutation.mutateAsync();
    } catch {
      // Error surfaced via deleteMutation.error; dialog stays open.
    }
  }, [deleteMutation]);

  const dataErrorMessage =
    exportMutation.error instanceof Error
      ? exportMutation.error.message
      : exportMutation.error
        ? 'Failed to export data'
        : deleteMutation.error instanceof Error
          ? deleteMutation.error.message
          : deleteMutation.error
            ? 'Failed to delete data'
            : null;

  return (
    <>
      <div className="mx-auto flex min-h-full max-w-lg flex-col gap-4 px-4 py-8 pb-28">
        <header>
          <h1 className="text-2xl font-semibold text-neutral-900">Settings</h1>
        </header>

        {(saveError || saveMutation.error) && (
          <SessionErrorBanner
            message={
              saveError ??
              (saveMutation.error instanceof Error
                ? saveMutation.error.message
                : 'Failed to save')
            }
          />
        )}

        {dataErrorMessage && <SessionErrorBanner message={dataErrorMessage} />}

        <ProfileSection
          draft={form.draft}
          onUpdateDraft={form.updateDraft}
          currentWeightKg={form.currentWeightKg}
          onWeightChange={form.setCurrentWeightKg}
          useLbsForWeight={form.useLbsForWeight}
          useImperialForHeight={form.useImperialForHeight}
          previewTDEE={form.previewTDEE}
          previewTarget={form.previewTarget}
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
          <p className="text-sm text-red-600">{form.validationMessage}</p>
        )}
      </div>

      {form.isDirty && (
        <div className="fixed inset-x-0 bottom-16 z-40 border-t border-neutral-200 bg-white/95 px-4 py-3 backdrop-blur sm:bottom-0">
          <div className="mx-auto flex max-w-lg gap-3">
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={!form.canSave || saveMutation.isPending}
              className="flex-1 rounded-lg bg-neutral-900 px-4 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
            >
              {saveMutation.isPending ? 'Saving…' : 'Save profile'}
            </button>
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
      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="h-96 animate-pulse rounded-xl bg-neutral-100" />
      </div>
    );
  }

  if (profileQuery.isError || !profileQuery.data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <SessionErrorBanner
          message={
            profileQuery.error instanceof Error
              ? profileQuery.error.message
              : 'Could not load your profile.'
          }
        />
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
