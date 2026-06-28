'use client';

import { useCallback, useState } from 'react';
import html2canvas from 'html2canvas';

export function useMealShareImage() {
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  const shareCardImage = useCallback(async (cardElement: HTMLElement, filename: string) => {
    setIsSharing(true);
    setShareError(null);

    try {
      const canvas = await html2canvas(cardElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
      });

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((result) => resolve(result), 'image/png');
      });

      if (!blob) {
        throw new Error('Failed to generate share image');
      }

      const file = new File([blob], filename, { type: 'image/png' });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'CalSnap meal',
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
      const message =
        error instanceof Error ? error.message : 'Failed to share meal card';
      setShareError(message);
    } finally {
      setIsSharing(false);
    }
  }, []);

  return { shareCardImage, isSharing, shareError };
}
