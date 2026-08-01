import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type DisplayEnvironment = 'command-wall' | 'workstation' | 'field-sunlight';

export interface DisplayEnvironmentContextType {
  displayEnvironment: DisplayEnvironment;
  setDisplayEnvironment: (env: DisplayEnvironment) => void;
  isCommandWall: boolean;
  isWorkstation: boolean;
  isFieldSunlight: boolean;
  burnInMitigation: boolean;
  toggleBurnInMitigation: () => void;
}

const DISPLAY_ENV_STORAGE_KEY = 'ic360.displayEnvironment';
const BURN_IN_STORAGE_KEY = 'ic360.burnInMitigation';

const DisplayEnvironmentContext = createContext<DisplayEnvironmentContextType | undefined>(undefined);

export function DisplayEnvironmentProvider({ children }: { children: ReactNode }) {
  const [displayEnvironment, setDisplayEnvironmentState] = useState<DisplayEnvironment>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(DISPLAY_ENV_STORAGE_KEY) as DisplayEnvironment;
      if (stored === 'command-wall' || stored === 'workstation' || stored === 'field-sunlight') {
        return stored;
      }
    }
    return 'workstation';
  });

  const [burnInMitigation, setBurnInMitigation] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      const stored = localStorage.getItem(BURN_IN_STORAGE_KEY);
      if (stored !== null) return stored === 'true';
    }
    return false;
  });

  const setDisplayEnvironment = (env: DisplayEnvironment) => {
    setDisplayEnvironmentState(env);
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(DISPLAY_ENV_STORAGE_KEY, env);
    }
  };

  const toggleBurnInMitigation = () => {
    setBurnInMitigation((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(BURN_IN_STORAGE_KEY, String(next));
      }
      return next;
    });
  };

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.setAttribute('data-display-env', displayEnvironment);
      if (displayEnvironment === 'command-wall' && burnInMitigation) {
        root.setAttribute('data-burn-in-mitigation', 'true');
      } else {
        root.removeAttribute('data-burn-in-mitigation');
      }
    }
  }, [displayEnvironment, burnInMitigation]);

  const value: DisplayEnvironmentContextType = {
    displayEnvironment,
    setDisplayEnvironment,
    isCommandWall: displayEnvironment === 'command-wall',
    isWorkstation: displayEnvironment === 'workstation',
    isFieldSunlight: displayEnvironment === 'field-sunlight',
    burnInMitigation,
    toggleBurnInMitigation,
  };

  return (
    <DisplayEnvironmentContext.Provider value={value}>
      {children}
    </DisplayEnvironmentContext.Provider>
  );
}

export function useDisplayEnvironment(): DisplayEnvironmentContextType {
  const context = useContext(DisplayEnvironmentContext);
  if (!context) {
    throw new Error('useDisplayEnvironment debe ser usado dentro de DisplayEnvironmentProvider');
  }
  return context;
}
