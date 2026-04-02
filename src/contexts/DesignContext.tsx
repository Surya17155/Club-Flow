import { createContext, useContext, ReactNode } from 'react';

export type DesignTheme = 'design-2';

interface DesignContextType {
  activeDesign: DesignTheme;
  setActiveDesign: (design: DesignTheme) => void;
  designs: { id: DesignTheme; name: string; description: string }[];
}

const designs = [
  { id: 'design-2' as const, name: 'New Brutalism', description: 'Cream background, thick borders, hard shadows, Space Grotesk typography' },
];

const DesignContext = createContext<DesignContextType | undefined>(undefined);

export function DesignProvider({ children }: { children: ReactNode }) {
  const setActiveDesign = (_design: DesignTheme) => {
    // No-op: single design system
  };

  return (
    <DesignContext.Provider value={{ activeDesign: 'design-2', setActiveDesign, designs }}>
      {children}
    </DesignContext.Provider>
  );
}

export function useDesign() {
  const ctx = useContext(DesignContext);
  if (!ctx) throw new Error('useDesign must be used within DesignProvider');
  return ctx;
}
