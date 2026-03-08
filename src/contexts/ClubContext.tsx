import React, { createContext, useContext, useState, useEffect } from 'react';
import { useUserClubs, UserClub } from '@/hooks/useUserClubs';

interface ClubContextType {
  activeClub: UserClub | null;
  clubs: UserClub[];
  loading: boolean;
  switchClub: (clubId: string) => void;
}

const ClubContext = createContext<ClubContextType | undefined>(undefined);

export const ClubProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { clubs, loading } = useUserClubs();
  const [activeClub, setActiveClub] = useState<UserClub | null>(null);

  useEffect(() => {
    if (clubs.length === 0) { setActiveClub(null); return; }
    const saved = localStorage.getItem('activeClubId');
    const found = clubs.find(c => c.club_id === saved);
    setActiveClub(found ?? clubs[0]);
  }, [clubs]);

  const switchClub = (clubId: string) => {
    const club = clubs.find(c => c.club_id === clubId);
    if (club) {
      setActiveClub(club);
      localStorage.setItem('activeClubId', clubId);
    }
  };

  return (
    <ClubContext.Provider value={{ activeClub, clubs, loading, switchClub }}>
      {children}
    </ClubContext.Provider>
  );
};

export const useClub = () => {
  const ctx = useContext(ClubContext);
  if (!ctx) throw new Error('useClub must be used within ClubProvider');
  return ctx;
};
