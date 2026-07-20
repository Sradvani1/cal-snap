'use client';

/**
 * TEMPORARY UX EXPERIMENT — full-screen overlay for description entry
 * on the Scan tab.  Covers BottomTabNav while the keyboard is open.
 *
 * Tests whether an explicit Save/Cancel interaction after keyboard
 * dismissal restores the standalone PWA viewport before the nav is
 * revealed.  This is NOT a viewport-recovery fix — it is a UX-containment
 * experiment.  See docs/build/FIXED-BOTTOM-NAV-FAILURE-REPORT.md and
 * FIXED-BOTTOM-NAV-FAILURE-REPORT-2.md for context.
 *
 * Device-test requirements (per approved plan):
 *   1. Overlay fully hides nav while typing.
 *   2. Save and Cancel both work after keyboard Done.
 *   3. Closing overlay returns nav to true bottom.
 *   4. All tabs remain visually and physically tappable after close.
 *   5. Normal photo-only Analyze flow unchanged.
 */

import { useEffect, useRef, useState } from 'react';
import { PrimaryButton } from '@/components/design/PrimaryButton';
import { copy } from '@/lib/copy';
import { formFieldInputClassName } from '@/lib/design/form-field';
import { typography } from '@/lib/design/typography';
import { cn } from '@/lib/utils/cn';

interface ScanDescriptionFullScreenProps {
  initialValue: string;
  onSave: (text: string) => void;
  onCancel: () => void;
}

export function ScanDescriptionFullScreen({
  initialValue,
  onSave,
  onCancel,
}: ScanDescriptionFullScreenProps) {
  const [text, setText] = useState(initialValue);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-cs-background">
      <div className="flex h-full flex-col px-4">
        {/* Header: Cancel | Title | spacer */}
        <div className="flex items-center justify-between py-3">
          <button
            type="button"
            onClick={onCancel}
            className="text-sm font-medium text-cs-primary"
          >
            {copy('scanner.capture.cancelDescription')}
          </button>
          <h2 className={cn(typography.csBody, 'font-semibold')}>
            {copy('scanner.capture.description')}
          </h2>
          <div className="w-12" />
        </div>

        {/*
         * TEMPORARY UX EXPERIMENT — test whether Save/Cancel restores nav;
         * device-test final nav position and tab hit targets.
         */}
        <p className={cn(typography.csCaption, 'mb-3 text-cs-muted')}>
          {copy('scanner.capture.descriptionHelper')}
        </p>

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={copy('scanner.capture.descriptionPlaceholder')}
          className={cn(formFieldInputClassName, 'min-h-32 resize-none')}
        />

        <PrimaryButton
          type="button"
          onClick={() => onSave(text)}
          fullWidth
          className="mt-4 min-h-11"
        >
          {copy('scanner.capture.saveDescription')}
        </PrimaryButton>
      </div>
    </div>
  );
}
