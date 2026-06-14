import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getCachedUserClubs, preloadUserClubs } from '@/lib/preloadCache';

export interface UserClub {
  club_id: string;
  club_name: string;
  role: string;
  logo_url: string | null;
}

export const useUserClubs = () => {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<UserClub[]>(() => user ? getCachedUserClubs(user.id) ?? [] : []);
  const [loading, setLoading] = useState(() => user ? !getCachedUserClubs(user.id) : false);

  useEffect(() => {
    if (!user) { setClubs([]); setLoading(false); return; }

    const fetch = async () => {
      const cached = getCachedUserClubs(user.id);
      if (cached) setClubs(cached);
      else setLoading(true);
      const data = await preloadUserClubs(user.id);
      setClubs(data);
      setLoading(false);
    };
    fetch();
  }, [user?.id]);

  return { clubs, loading };
};
