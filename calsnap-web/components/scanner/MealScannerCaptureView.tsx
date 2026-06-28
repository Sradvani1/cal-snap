'use client';

import { useRef } from 'react';
import type { MealScannerState } from '@/lib/scanner/use-meal-scanner';

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
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={scanner.previewUrl}
            alt="Selected meal"
            className="aspect-[4/3] w-full object-cover"
          />
        </div>
      ) : (
        <div className="flex aspect-[4/3] flex-col items-center justify-center rounded-xl border-2 border-dashed border-neutral-300 bg-white p-6 text-center">
          <p className="text-sm text-neutral-600">Take a photo or choose from gallery</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="min-h-11 flex-1 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-900"
        >
          Camera
        </button>
        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          className="min-h-11 flex-1 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-900"
        >
          Gallery
        </button>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-neutral-700">
          Description (optional)
        </span>
        <textarea
          value={scanner.textDescription}
          onChange={(event) => scanner.setTextDescription(event.target.value)}
          rows={3}
          placeholder="e.g. homemade pasta with olive oil"
          className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
        />
      </label>

      <div className="flex flex-col gap-2">
        <button
          type="button"
          disabled={!scanner.canAnalyze}
          onClick={() => void scanner.analyze()}
          className="min-h-11 w-full rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Analyze
        </button>
        <button
          type="button"
          onClick={scanner.enterManualEntry}
          className="min-h-11 w-full rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-900"
        >
          Enter manually
        </button>
      </div>
    </div>
  );
}
