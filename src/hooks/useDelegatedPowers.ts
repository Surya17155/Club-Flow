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
  { key: 'manage_club', label: 'Official Dashboard', description: 'Can access the official club dashboard to manage members and view all details' },
  { key: 'use_chatbot', label: 'ClubBot Access', description: 'Can use the AI ClubBot assistant for club insights' },
] as const;

export type PowerKey = typeof AVAILABLE_POWERS[number]['key'];

export const useDelegatedPowers = (overrideClubId?: string) => {
  const { user } = useAuth();
  const { activeClub } = useClub();
  const effectiveClubId = overrideClubId || activeClub?.club_id;
  const [powers, setPowers] = useState<DelegatedPower[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPowers = useCallback(async () => {
    if (!user || !effectiveClubId) { setPowers([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('delegated_powers')
      .select('*')
      .eq('club_id', effectiveClubId);
    if (!error && data) setPowers(data as DelegatedPower[]);
    setLoading(false);
  }, [user?.id, effectiveClubId]);

  useEffect(() => { fetchPowers(); }, [fetchPowers]);

  const grantPower = async (userId: string, power: string) => {
    if (!effectiveClubId || !user) return;
    const { error } = await supabase.from('delegated_powers').insert({
      club_id: effectiveClubId,
      user_id: userId,
      power,
      granted_by: user.id,
    });
    if (!error) await fetchPowers();
    return error;
  };

  const revokePower = async (userId: string, power: string) => {
    if (!effectiveClubId) return;
    const { error } = await supabase
      .from('delegated_powers')
      .delete()
      .eq('club_id', effectiveClubId)
      .eq('user_id', userId)
      .eq('power', power);
    if (!error) await fetchPowers();
    return error;
  };

  const hasPower = (power: string): boolean => {
    if (!user || !effectiveClubId) return false;
    if (activeClub?.role === 'admin' || activeClub?.role === 'president') return true;
    return powers.some(p => p.user_id === user.id && p.power === power);
  };

  const isPresident = activeClub?.role === 'president' || activeClub?.role === 'admin';

  return { powers, loading, grantPower, revokePower, hasPower, isPresident, fetchPowers };
};
