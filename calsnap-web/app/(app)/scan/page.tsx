'use client';

import { Suspense, useEffect, useLayoutEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ConfirmAlertDialog } from '@/components/design/ConfirmAlertDialog';
import { MealAnalysisResultView } from '@/components/scanner/MealAnalysisResultView';
import { MealScannerAnalyzingView } from '@/components/scanner/MealScannerAnalyzingView';
import { MealScannerCaptureView } from '@/components/scanner/MealScannerCaptureView';
import { ScannerErrorBanner } from '@/components/scanner/ScannerErrorBanner';
import { useAuth } from '@/lib/auth/auth-context';
import { copy } from '@/lib/copy';
import { formFieldFocusRingClassName } from '@/lib/design/form-field';
import { layout } from '@/lib/design/layout';
import { typography } from '@/lib/design/typography';
import { cn } from '@/lib/utils/cn';
import { useLogMeal } from '@/lib/queries/use-log-meal';
import { useUnsavedWork } from '@/lib/scanner/unsaved-work-context';
import { useMealScanner } from '@/lib/scanner/use-meal-scanner';
import { useNavVisibility } from '@/lib/app/nav-visibility-context';
import { MealType, type MealType as MealTypeValue } from '@/lib/models/meal-type';

const VALID_MEAL_TYPES = new Set<string>(Object.values(MealType));

type DiscardPrompt = 'navigation' | 'discard' | null;

function parseMealTypeParam(param: string | null): MealTypeValue | undefined {
  if (param && VALID_MEAL_TYPES.has(param)) {
    return param as MealTypeValue;
  }
  return undefined;
}

function ScanPageContent() {
  const { user } = useAuth();
  const { setHidden } = useNavVisibility();
  const searchParams = useSearchParams();
  const { setHasUnsavedWork, registerNavigationHandler } = useUnsavedWork();
  const logMealMutation = useLogMeal(user?.uid);
  const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
  const [discardPrompt, setDiscardPrompt] = useState<DiscardPrompt>(null);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const initialMealType = parseMealTypeParam(searchParams.get('mealType'));

  const scanner = useMealScanner({
    userId: user?.uid ?? '',
    initialMealType,
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
      window.location.replace(pendingHref);
      return;
    }
    window.location.replace('/dashboard');
    return;
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

  useEffect(() => {
    return () => {
      setHidden(false);
    };
  }, [setHidden]);

  const handleDiscard = () => {
    if (scanner.hasUnsavedWork) {
      openDiscardDialog('discard');
      return;
    }
    scanner.discard();
    window.location.replace('/dashboard');
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
      window.location.replace('/dashboard');
      return;
    } catch {
      scanner.setLogError(copy('scanner.error.logFailed'));
    }
  };

  return (
    <div className={cn(layout.pageShell, 'py-6', layout.content.bottomPadding)}>
      <header className="mb-6 flex items-center justify-between">
        <h1 className={`${typography.csCardTitle} text-2xl`}>{copy('scanner.title')}</h1>
        {scanner.hasUnsavedWork && scanner.phase !== 'analyzing' && (
          <button
            type="button"
            onClick={handleDiscard}
            className={cn(
              'text-sm font-medium text-cs-danger-text',
              formFieldFocusRingClassName,
            )}
          >
            {copy('scanner.discard')}
          </button>
        )}
      </header>

      {scanner.phase === 'capture' && <MealScannerCaptureView scanner={scanner} />}

      {scanner.phase === 'analyzing' && (
        <MealScannerAnalyzingView onCancel={scanner.cancelAnalysis} />
      )}

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

export default function ScanPage() {
  return (
    <Suspense>
      <ScanPageContent />
    </Suspense>
  );
}
