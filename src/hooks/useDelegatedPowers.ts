import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useClub } from '@/contexts/ClubContext';

export interface DelegatedPower {
  id: string;
  club_id: string;
  user_id: string;
  power: string;
  granted_by: string;
  granted_at: string;
}

export const AVAILABLE_POWERS = [
  { key: 'create_event', label: 'Create Event', description: 'Can create and publish events for the club' },
] as const;

export type PowerKey = typeof AVAILABLE_POWERS[number]['key'];

export const useDelegatedPowers = () => {
  const { user } = useAuth();
  const { activeClub } = useClub();
  const [powers, setPowers] = useState<DelegatedPower[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPowers = useCallback(async () => {
    if (!user || !activeClub) { setPowers([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('delegated_powers')
      .select('*')
      .eq('club_id', activeClub.club_id);
    if (!error && data) setPowers(data as DelegatedPower[]);
    setLoading(false);
  }, [user?.id, activeClub?.club_id]);

  useEffect(() => { fetchPowers(); }, [fetchPowers]);

  const grantPower = async (userId: string, power: string) => {
    if (!activeClub || !user) return;
    const { error } = await supabase.from('delegated_powers').insert({
      club_id: activeClub.club_id,
      user_id: userId,
      power,
      granted_by: user.id,
    });
    if (!error) await fetchPowers();
    return error;
  };

  const revokePower = async (userId: string, power: string) => {
    if (!activeClub) return;
    const { error } = await supabase
      .from('delegated_powers')
      .delete()
      .eq('club_id', activeClub.club_id)
      .eq('user_id', userId)
      .eq('power', power);
    if (!error) await fetchPowers();
    return error;
  };

  const hasPower = (power: string): boolean => {
    if (!user || !activeClub) return false;
    // Presidents and admins always have all powers
    if (activeClub.role === 'admin' || activeClub.role === 'president') return true;
    return powers.some(p => p.user_id === user.id && p.power === power);
  };

  const isPresident = activeClub?.role === 'president' || activeClub?.role === 'admin';

  return { powers, loading, grantPower, revokePower, hasPower, isPresident, fetchPowers };
};
