'use client';

import { useRef, useState } from 'react';
import { PrimaryButton, SecondaryButton } from '@/components/design/PrimaryButton';
import { ScanDescriptionFullScreen } from '@/components/scanner/ScanDescriptionFullScreen';
import type { MealScannerState } from '@/lib/scanner/use-meal-scanner';
import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';
import { cn } from '@/lib/utils/cn';

interface MealScannerCaptureViewProps {
  scanner: MealScannerState;
}

export function MealScannerCaptureView({ scanner }: MealScannerCaptureViewProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [descriptionOverlayOpen, setDescriptionOverlayOpen] = useState(false);

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      void scanner.selectPhoto(file);
    }
    event.target.value = '';
  };

  /**
   * TEMPORARY UX EXPERIMENT — scroll-nudge <main> before closing the
   * description overlay.  Forces WebKit compositor layout recompute
   * so BottomTabNav renders at the true physical bottom.
   *
   * Only nudges if <main> has scroll room.  If already at the bottom
   * of the scroll range, nudges upward by 1px instead.
   *
   * Diagnostics via Safari Web Inspector: filter on
   * '[scan-keyboard-recovery]'.
   */
  function closeWithRecovery() {
    const main = document.querySelector<HTMLElement>('main');

    if (!main || main.scrollHeight <= main.clientHeight) {
      console.info('[scan-keyboard-recovery]', {
        scrollTop: main?.scrollTop,
        scrollHeight: main?.scrollHeight,
        clientHeight: main?.clientHeight,
        canScroll: false,
      });
      setDescriptionOverlayOpen(false);
      return;
    }

    const before = main.scrollTop;
    const maxScrollTop = main.scrollHeight - main.clientHeight;
    const nudgeTarget =
      before < maxScrollTop ? before + 1 : Math.max(0, before - 1);

    console.info('[scan-keyboard-recovery]', {
      scrollTop: before,
      scrollHeight: main.scrollHeight,
      clientHeight: main.clientHeight,
      maxScrollTop,
      nudgeTarget,
      canScroll: true,
    });

    main.scrollTo({ top: nudgeTarget, behavior: 'auto' });

    requestAnimationFrame(() => {
      main.scrollTo({ top: before, behavior: 'auto' });

      requestAnimationFrame(() => {
        setDescriptionOverlayOpen(false);
      });
    });
  }

  return (
    <>
      <div className="space-y-4">
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFile}
          aria-hidden
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
          aria-hidden
        />

        {scanner.previewUrl ? (
          <div className="overflow-hidden rounded-xl border border-cs-border bg-cs-surface">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={scanner.previewUrl}
              alt={copy('scanner.capture.photoAlt')}
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
        ) : (
          <div className="flex aspect-[4/3] flex-col items-center justify-center rounded-xl border-2 border-dashed border-cs-border bg-cs-surface p-6 text-center">
            <p className={typography.csCaption}>{copy('scanner.capture.prompt')}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <SecondaryButton
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="min-h-11 flex-1"
          >
            {copy('scanner.capture.camera')}
          </SecondaryButton>
          <SecondaryButton
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="min-h-11 flex-1"
          >
            {copy('scanner.capture.gallery')}
          </SecondaryButton>
        </div>

        {/*
         * TEMPORARY UX EXPERIMENT — test whether Save/Cancel interaction
         * after keyboard dismissal restores standalone PWA viewport before
         * nav is revealed.  See docs/build/FIXED-BOTTOM-NAV-FAILURE-REPORT-2.md
         */}
        {scanner.textDescription ? (
          <div className="overflow-hidden rounded-xl border border-cs-border bg-cs-surface">
            <div className="flex items-center justify-between p-3">
              <span className={cn(typography.csBody, 'font-medium')}>
                {copy('scanner.capture.description')}
              </span>
              <button
                type="button"
                onClick={() => setDescriptionOverlayOpen(true)}
                className="text-sm font-medium text-cs-primary"
              >
                {copy('scanner.capture.editDescription')}
              </button>
            </div>
            <p className="border-t border-cs-border px-3 pb-3 pt-2 text-sm text-cs-foreground">
              {scanner.textDescription}
            </p>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setDescriptionOverlayOpen(true)}
            className="flex w-full items-center justify-center rounded-xl border-2 border-dashed border-cs-border bg-cs-surface p-4 text-sm font-medium text-cs-muted"
          >
            {copy('scanner.capture.addDescription')}
          </button>
        )}

        <div className="flex flex-col gap-2">
          <PrimaryButton
            type="button"
            disabled={!scanner.canAnalyze}
            onClick={() => void scanner.analyze()}
            fullWidth
            className="min-h-11"
          >
            {copy('scanner.capture.analyze')}
          </PrimaryButton>
        </div>
      </div>

      {descriptionOverlayOpen && (
        <ScanDescriptionFullScreen
          initialValue={scanner.textDescription}
          onSave={(text) => {
            scanner.setTextDescription(text);
            closeWithRecovery();
          }}
          onCancel={() => closeWithRecovery()}
        />
      )}
    </>
  );
}
