/** Mobile browsers block popups; redirect is required there. */
export function shouldUseGoogleRedirect(): boolean {
  if (typeof navigator === 'undefined') {
    return true;
  }

  return /Android|iPhone|iPod|iPad|Mobile/i.test(navigator.userAgent);
}
