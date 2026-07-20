'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

interface NavVisibilityContext {
  hidden: boolean;
  setHidden: (v: boolean) => void;
}

const NavVisibilityCtx = createContext<NavVisibilityContext | null>(null);

export function NavVisibilityProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(false);
  return (
    <NavVisibilityCtx.Provider value={{ hidden, setHidden }}>
      {children}
    </NavVisibilityCtx.Provider>
  );
}

export function useNavVisibility(): NavVisibilityContext {
  const context = useContext(NavVisibilityCtx);
  if (!context) {
    throw new Error('useNavVisibility must be used within NavVisibilityProvider');
  }
  return context;
}
