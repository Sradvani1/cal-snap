'use client';

import { useRef } from 'react';
import { PrimaryButton, SecondaryButton } from '@/components/design/PrimaryButton';
import type { MealScannerState } from '@/lib/scanner/use-meal-scanner';
import { copy } from '@/lib/copy';
import { formFieldInputClassName } from '@/lib/design/form-field';
import { typography } from '@/lib/design/typography';
import { cn } from '@/lib/utils/cn';

interface MealScannerCaptureViewProps {
  scanner: MealScannerState;
}

export function MealScannerCaptureView({ scanner }: MealScannerCaptureViewProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      void scanner.selectPhoto(file);
    }
    event.target.value = '';
  };

  return (
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

      <label className="block">
        <span className={cn(typography.csBody, 'mb-1 block font-medium')}>
          {copy('scanner.capture.description')}
        </span>
        <textarea
          value={scanner.textDescription}
          onChange={(event) => scanner.setTextDescription(event.target.value)}
          rows={3}
          placeholder={copy('scanner.capture.descriptionPlaceholder')}
          className={formFieldInputClassName}
        />
      </label>

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
  );
}
