'use client';

import { useCallback, useState } from 'react';
import { copy } from '@/lib/copy';

function shareCardBackgroundColor(): string {
  if (typeof window === 'undefined') {
    return '#ffffff';
  }
  const surface = getComputedStyle(document.documentElement)
    .getPropertyValue('--cs-surface')
    .trim();
  return surface || '#ffffff';
}

export function useMealShareImage() {
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const shareCardImage = useCallback(async (cardElement: HTMLElement, filename: string) => {
    setIsSharing(true);
    setShareError(null);

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardElement, {
        backgroundColor: shareCardBackgroundColor(),
        scale: 2,
        useCORS: true,
      });

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((result) => resolve(result), 'image/png');
      });

      if (!blob) {
        throw new Error(copy('mealLog.share.error.generate'));
      }

      const file = new File([blob], filename, { type: 'image/png' });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: copy('mealLog.share.title'),
        });
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      setShareError(copy('mealLog.share.error.failed'));
    } finally {
      setIsSharing(false);
    }
  }, []);

  return { shareCardImage, isSharing, shareError };
}
