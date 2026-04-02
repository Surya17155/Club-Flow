import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type DesignTheme = 'design-1';

interface DesignContextType {
  activeDesign: DesignTheme;
  setActiveDesign: (design: DesignTheme) => void;
  designs: { id: DesignTheme; name: string; description: string }[];
}

const designs = [
  { id: 'design-1' as const, name: 'Design 1', description: 'Modern SaaS — Black sidebar, white floating card, colored stat cards, Lexend typography' },
];

const DesignContext = createContext<DesignContextType | undefined>(undefined);

export function DesignProvider({ children }: { children: ReactNode }) {
  const [activeDesign, setActiveDesignState] = useState<DesignTheme>(() => {
    return (localStorage.getItem('app-design-theme') as DesignTheme) || 'design-1';
  });

  const setActiveDesign = (design: DesignTheme) => {
    setActiveDesignState(design);
    localStorage.setItem('app-design-theme', design);
  };

  return (
    <DesignContext.Provider value={{ activeDesign, setActiveDesign, designs }}>
      {children}
    </DesignContext.Provider>
  );
}

export function useDesign() {
  const ctx = useContext(DesignContext);
  if (!ctx) throw new Error('useDesign must be used within DesignProvider');
  return ctx;
}
