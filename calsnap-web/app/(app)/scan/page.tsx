'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ConfirmAlertDialog } from '@/components/design/ConfirmAlertDialog';
import { MealAnalysisResultView } from '@/components/scanner/MealAnalysisResultView';
import { MealScannerAnalyzingView } from '@/components/scanner/MealScannerAnalyzingView';
import { MealScannerCaptureView } from '@/components/scanner/MealScannerCaptureView';
import { ManualMealEntryView } from '@/components/scanner/ManualMealEntryView';
import { ScannerErrorBanner } from '@/components/scanner/ScannerErrorBanner';
import { useAuth } from '@/lib/auth/use-auth';
import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';
import { useLogMeal } from '@/lib/queries/use-log-meal';
import { useUnsavedWork } from '@/lib/scanner/unsaved-work-context';
import { useMealScanner } from '@/lib/scanner/use-meal-scanner';

type DiscardPrompt = 'navigation' | 'discard' | null;

export default function ScanPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { setHasUnsavedWork, registerNavigationHandler } = useUnsavedWork();
  const logMealMutation = useLogMeal(user?.uid);
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const [discardPrompt, setDiscardPrompt] = useState<DiscardPrompt>(null);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const scanner = useMealScanner({
    userId: user?.uid ?? '',
    onUnsavedWorkChange: setHasUnsavedWork,
  });

  const { discard } = scanner;

  const openDiscardDialog = (prompt: DiscardPrompt, href?: string) => {
    setDiscardPrompt(prompt);
    setPendingHref(href ?? null);
    setDiscardDialogOpen(true);
  };

  const handleConfirmDiscard = () => {
    discard();
    setHasUnsavedWork(false);
    setDiscardDialogOpen(false);
    if (discardPrompt === 'navigation' && pendingHref) {
      router.push(pendingHref);
    }
    setDiscardPrompt(null);
    setPendingHref(null);
  };

  useLayoutEffect(() => {
    registerNavigationHandler((href) => {
      openDiscardDialog('navigation', href);
      return false;
    });
    return () => {
      setHasUnsavedWork(false);
      registerNavigationHandler(null);
    };
  }, [registerNavigationHandler, setHasUnsavedWork]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (scanner.hasUnsavedWork) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [scanner.hasUnsavedWork]);

  const handleDiscard = () => {
    if (scanner.hasUnsavedWork) {
      openDiscardDialog('discard');
      return;
    }
    scanner.discard();
  };

  const handleLog = async () => {
    if (!user || !scanner.canLog) {
      return;
    }
    scanner.setLogError(null);
    const mealId = crypto.randomUUID();
    const entry = scanner.makeMealEntry(mealId);

    try {
      await logMealMutation.mutateAsync({
        entry,
        photoBlob: scanner.preparedPhoto?.blob,
      });
      scanner.discard();
      setHasUnsavedWork(false);
      router.push('/dashboard');
    } catch {
      scanner.setLogError(copy('scanner.error.logFailed'));
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className={`${typography.csCardTitle} text-2xl`}>{copy('scanner.title')}</h1>
        {scanner.hasUnsavedWork && scanner.phase !== 'analyzing' && (
          <button
            type="button"
            onClick={handleDiscard}
            className="text-sm font-medium text-cs-danger"
          >
            {copy('scanner.discard')}
          </button>
        )}
      </header>

      {scanner.phase === 'capture' && <MealScannerCaptureView scanner={scanner} />}

      {scanner.phase === 'analyzing' && (
        <MealScannerAnalyzingView onCancel={scanner.cancelAnalysis} />
      )}

      {scanner.phase === 'manual' && <ManualMealEntryView scanner={scanner} />}

      {scanner.phase === 'error' && scanner.scannerError && (
        <div className="space-y-4">
          <ScannerErrorBanner
            error={scanner.scannerError}
            onRetry={
              scanner.scannerError === 'offline' ||
              scanner.scannerError === 'api' ||
              scanner.scannerError === 'parse'
                ? scanner.retryAnalyze
                : scanner.scannerError === 'photoPrep'
                  ? () => {
                      scanner.discard();
                    }
                  : scanner.retryAnalyze
            }
            onManualEntry={scanner.enterManualEntry}
          />
          {scanner.previewUrl && (
            <div className="overflow-hidden rounded-xl border border-cs-border bg-cs-surface">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={scanner.previewUrl}
                alt={copy('scanner.capture.photoAlt')}
                className="aspect-[4/3] w-full object-cover opacity-60"
              />
            </div>
          )}
        </div>
      )}

      {scanner.phase === 'results' && (
        <MealAnalysisResultView
          scanner={scanner}
          isLogging={logMealMutation.isPending}
          onLog={() => void handleLog()}
          onReAnalyze={scanner.reAnalyze}
          onDiscard={handleDiscard}
        />
      )}

      <ConfirmAlertDialog
        open={discardDialogOpen}
        onOpenChange={setDiscardDialogOpen}
        title={copy('scanner.confirm.discardTitle')}
        description={copy('scanner.confirm.discardScan')}
        confirmLabel={copy('scanner.discard')}
        destructive
        onConfirm={handleConfirmDiscard}
      />
    </div>
  );
}
