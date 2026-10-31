'use client';

import { useEffect, useRef, useState } from 'react';
import { PrimaryButton } from '@/components/design/PrimaryButton';
import { copy } from '@/lib/copy';
import { formFieldInputClassName } from '@/lib/design/form-field';
import { useKeyboardInset } from '@/lib/hooks/use-keyboard-inset';
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
  const keyboardInset = useKeyboardInset();

  useEffect(() => {
    // Focus without scrolling: the field sits above the keyboard, so Safari's
    // pan has no job to do — and a mount-time pan against unsettled layout
    // flings this fixed overlay's header off the top of the screen.
    textareaRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-cs-background">
      <div
        className="flex h-full flex-col overflow-y-auto px-4"
        style={keyboardInset > 0 ? { paddingBottom: keyboardInset } : undefined}
      >
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
