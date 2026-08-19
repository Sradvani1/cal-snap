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
import { layout } from '@/lib/design/layout';
import { typography } from '@/lib/design/typography';
import { cn } from '@/lib/utils/cn';
import { Button } from '@/components/ui/button';
import { useLogMeal } from '@/lib/queries/use-log-meal';
import { errorRetryAction } from '@/lib/scanner/error-retry-action';
import { useUnsavedWork } from '@/lib/scanner/unsaved-work-context';
import { useMealScanner } from '@/lib/scanner/use-meal-scanner';
import { useNavVisibility } from '@/lib/app/nav-visibility-context';
import { MealType, type MealType as MealTypeValue } from '@/lib/models/meal-type';
import { parseLogDateParam } from '@/lib/meal-log/log-date';
import { localDayKey } from '@/lib/dashboard/date-window';
import { MealDateOutOfRangeError } from '@/lib/repositories/meal-errors';

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
  const logDateParam = searchParams.get('date');

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
    const logDate = parseLogDateParam(logDateParam);
    if (logDateParam && !logDate) {
      scanner.setLogError(copy('scanner.error.invalidLogDate'));
      return;
    }
    scanner.setLogError(null);
    const mealId = crypto.randomUUID();
    const entry = scanner.makeMealEntry(mealId, logDate);

    try {
      await logMealMutation.mutateAsync({
        entry,
        photoBlob: scanner.preparedPhoto?.blob,
      });
      scanner.discard();
      setHasUnsavedWork(false);
      if (logDate) {
        window.location.replace(`/log?date=${localDayKey(logDate)}`);
      } else {
        window.location.replace('/dashboard');
      }
      return;
    } catch (error) {
      scanner.setLogError(
        error instanceof MealDateOutOfRangeError
          ? copy('scanner.error.invalidLogDate')
          : copy('scanner.error.logFailed'),
      );
    }
  };

  return (
    <div className={cn(layout.pageShell, 'py-6', layout.content.bottomPadding)}>
      <header className="mb-6 flex items-center justify-between">
        <h1 className={`${typography.csCardTitle} text-2xl`}>{copy('scanner.title')}</h1>
        <div className="flex items-center gap-2">
          {scanner.phase === 'results' && (
            <Button
              size="sm"
              disabled={!scanner.canLog || logMealMutation.isPending}
              onClick={handleLog}
            >
              {logMealMutation.isPending
                ? copy('scanner.result.logging')
                : copy('scanner.result.logShort')}
            </Button>
          )}
          {scanner.hasUnsavedWork && scanner.phase !== 'analyzing' && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDiscard}
              className="border-cs-danger/40 text-cs-danger-text hover:bg-cs-danger/10 hover:text-cs-danger-text"
            >
              {copy('scanner.discard')}
            </Button>
          )}
        </div>
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
              errorRetryAction(scanner.scannerError) === 'discard'
                ? scanner.discard
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
