'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PrimaryButton, SecondaryButton } from '@/components/design/PrimaryButton';
import { ScanDescriptionFullScreen } from '@/components/scanner/ScanDescriptionFullScreen';
import type { MealScannerState } from '@/lib/scanner/use-meal-scanner';
import { useNavVisibility } from '@/lib/app/nav-visibility-context';
import { copy } from '@/lib/copy';
import { typography } from '@/lib/design/typography';
import { cn } from '@/lib/utils/cn';

interface MealScannerCaptureViewProps {
  scanner: MealScannerState;
}

export function MealScannerCaptureView({ scanner }: MealScannerCaptureViewProps) {
  const { setHidden } = useNavVisibility();
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

  const openOverlay = () => {
    setHidden(true);
    setDescriptionOverlayOpen(true);
  };

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
          <Button
            type="button"
            variant="ghost"
            onClick={() => cameraInputRef.current?.click()}
            className="flex aspect-[4/3] w-full flex-col items-center justify-center whitespace-normal rounded-xl border-2 border-dashed border-cs-border bg-cs-surface p-6 text-center"
          >
            <p className={typography.csCaption}>{copy('scanner.capture.prompt')}</p>
          </Button>
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

        {scanner.textDescription ? (
          <div className="overflow-hidden rounded-xl border border-cs-border bg-cs-surface">
            <div className="flex items-center justify-between p-3">
              <span className={cn(typography.csBody, 'font-medium')}>
                {copy('scanner.capture.description')}
              </span>
              <button
                type="button"
                onClick={openOverlay}
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
            onClick={openOverlay}
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
            setDescriptionOverlayOpen(false);
          }}
          onCancel={() => setDescriptionOverlayOpen(false)}
        />
      )}
    </>
  );
}
