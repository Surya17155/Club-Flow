import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';
import { getCachedProfile, preloadProfile, setCachedProfile } from '@/lib/preloadCache';

type Profile = Tables<'profiles'>;

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(() => user ? getCachedProfile(user.id) ?? null : null);
  const [loading, setLoading] = useState(false);

  const fetchProfile = async (force = false) => {
    if (!user) return;
    const cached = getCachedProfile(user.id);
    if (cached && !force) setProfile(cached);
    const data = await preloadProfile(user.id, force);
    if (data) setProfile(data);
  };

  useEffect(() => {
    fetchProfile();
  }, [user?.id]);

  const updateProfile = async (updates: Partial<Omit<Profile, 'id' | 'user_id' | 'created_at' | 'updated_at'>>) => {
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();
    if (error) throw error;
    setCachedProfile(user.id, data);
    setProfile(data);
    return data;
  };

  const uploadAvatar = async (file: File) => {
    if (!user) throw new Error('Not authenticated');
    const ext = file.name.split('.').pop();
    const path = `${user.id}/avatar.${ext}`;
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(path, file, { upsert: true });
    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(path);

    await updateProfile({ avatar_url: `${publicUrl}?t=${Date.now()}` });
    return publicUrl;
  };

  return { profile, loading, updateProfile, uploadAvatar, refetch: fetchProfile };
};
