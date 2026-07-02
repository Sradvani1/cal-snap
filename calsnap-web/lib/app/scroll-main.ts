/** Scroll the app shell main region to top after tab navigation. */
export function scrollMainToTop(main: HTMLElement | null): void {
  if (!main) {
    return;
  }
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  main.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
}
