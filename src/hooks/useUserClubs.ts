import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserClub {
  club_id: string;
  club_name: string;
  role: string;
  logo_url: string | null;
}

export const useUserClubs = () => {
  const { user } = useAuth();
  const [clubs, setClubs] = useState<UserClub[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setClubs([]); setLoading(false); return; }

    const fetch = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('club_members')
        .select('club_id, role, clubs(id, name, logo_url)')
        .eq('user_id', user.id);

      if (!error && data) {
        setClubs(data.map((m: any) => ({
          club_id: m.club_id,
          club_name: m.clubs?.name ?? '',
          role: m.role,
          logo_url: m.clubs?.logo_url ?? null,
        })));
      }
      setLoading(false);
    };
    fetch();
  }, [user?.id]);

  return { clubs, loading };
};
