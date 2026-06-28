'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

interface UnsavedWorkContextValue {
  hasUnsavedWork: boolean;
  setHasUnsavedWork: (value: boolean) => void;
  requestNavigation: (href: string) => boolean;
  registerNavigationHandler: (
    handler: ((href: string) => boolean) | null,
  ) => void;
}

const UnsavedWorkContext = createContext<UnsavedWorkContextValue | null>(null);

export function UnsavedWorkProvider({ children }: { children: ReactNode }) {
  const [hasUnsavedWork, setHasUnsavedWork] = useState(false);
  const [navigationHandler, setNavigationHandler] = useState<
    ((href: string) => boolean) | null
  >(null);

  const registerNavigationHandler = useCallback(
    (handler: ((href: string) => boolean) | null) => {
      setNavigationHandler(() => handler);
    },
    [],
  );

  const requestNavigation = useCallback(
    (href: string) => {
      if (!hasUnsavedWork) {
        return true;
      }
      if (navigationHandler) {
        return navigationHandler(href);
      }
      return window.confirm('Discard unsaved meal scan?');
    },
    [hasUnsavedWork, navigationHandler],
  );

  const value = useMemo(
    () => ({
      hasUnsavedWork,
      setHasUnsavedWork,
      requestNavigation,
      registerNavigationHandler,
    }),
    [hasUnsavedWork, requestNavigation, registerNavigationHandler],
  );

  return (
    <UnsavedWorkContext.Provider value={value}>{children}</UnsavedWorkContext.Provider>
  );
}

export function useUnsavedWork(): UnsavedWorkContextValue {
  const context = useContext(UnsavedWorkContext);
  if (!context) {
    throw new Error('useUnsavedWork must be used within UnsavedWorkProvider');
  }
  return context;
}
