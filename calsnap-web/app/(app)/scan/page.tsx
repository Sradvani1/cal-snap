'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MealAnalysisResultView } from '@/components/scanner/MealAnalysisResultView';
import { MealScannerAnalyzingView } from '@/components/scanner/MealScannerAnalyzingView';
import { MealScannerCaptureView } from '@/components/scanner/MealScannerCaptureView';
import { ManualMealEntryView } from '@/components/scanner/ManualMealEntryView';
import { ScannerErrorBanner } from '@/components/scanner/ScannerErrorBanner';
import { useAuth } from '@/lib/auth/use-auth';
import { useLogMeal } from '@/lib/queries/use-log-meal';
import { useUnsavedWork } from '@/lib/scanner/unsaved-work-context';
import { useMealScanner } from '@/lib/scanner/use-meal-scanner';

export default function ScanPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { setHasUnsavedWork, registerNavigationHandler } = useUnsavedWork();
  const logMealMutation = useLogMeal(user?.uid);

  const scanner = useMealScanner({
    userId: user?.uid ?? '',
    onUnsavedWorkChange: setHasUnsavedWork,
  });

  const { discard } = scanner;

  useEffect(() => {
    registerNavigationHandler(() => {
      const confirmed = window.confirm(
        'Discard unsaved meal scan? Your progress will be lost.',
      );
      if (confirmed) {
        discard();
      }
      return confirmed;
    });
    return () => {
      setHasUnsavedWork(false);
      registerNavigationHandler(null);
    };
  }, [registerNavigationHandler, discard, setHasUnsavedWork]);

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
      const confirmed = window.confirm(
        'Discard unsaved meal scan? Your progress will be lost.',
      );
      if (!confirmed) {
        return;
      }
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
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to log meal. Try again.';
      scanner.setLogError(message);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-neutral-900">Scan meal</h1>
        {scanner.hasUnsavedWork && scanner.phase !== 'analyzing' && (
          <button
            type="button"
            onClick={handleDiscard}
            className="text-sm font-medium text-red-600"
          >
            Discard
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
            <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={scanner.previewUrl}
                alt="Selected meal"
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
    </div>
  );
}
