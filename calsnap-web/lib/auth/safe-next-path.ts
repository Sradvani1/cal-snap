import { useSyncExternalStore } from 'react';

/** Returns a same-origin path from a `next` query value, or null when it is unsafe. */
export function safeNextPath(value: string | null): string | null {
  if (!value || !/^\/(?![/\\])[^\u0000-\u001F\u007F\\]*$/.test(value)) {
    return null;
  }
  return value;
}

export function nextPathFromLocation(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return safeNextPath(new URLSearchParams(window.location.search).get('next'));
}

const subscribeToNothing = () => () => {};

export function useNextPath(): string | null {
  return useSyncExternalStore(subscribeToNothing, nextPathFromLocation, () => null);
}

export function authPathWithNext(path: string, nextPath: string | null): string {
  return nextPath ? `${path}?next=${encodeURIComponent(nextPath)}` : path;
}
