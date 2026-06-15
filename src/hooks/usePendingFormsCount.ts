import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useClub } from '@/contexts/ClubContext';

/**
 * Count of published forms the current user CAN fill but has NOT yet submitted
 * and whose deadline hasn't passed. Used for the sidebar Forms red badge.
 * RLS already restricts `forms` SELECT to clubs the user belongs to + public forms.
 */
export function usePendingFormsCount() {
  const { user } = useAuth();
  const { clubs } = useClub();
  const [count, setCount] = useState(0);
  const clubIds = clubs.map((club) => club.club_id).join(',');

  useEffect(() => {
    let cancelled = false;
    const ids = clubIds ? clubIds.split(',') : [];
    if (!user) { setCount(0); return; }

    const load = async () => {
      let q = supabase
        .from('forms')
        .select('id, deadline')
        .eq('is_published', true)
        .eq('accepting_responses', true)
        .or(`deadline.is.null,deadline.gte.${new Date().toISOString()}`);
      q = ids.length > 0
        ? q.or(`is_public.eq.true,club_id.in.(${ids.join(',')})`)
        : q.eq('is_public', true);
      const { data: forms } = await q;
      if (cancelled || !forms) return;

      if (forms.length === 0) { setCount(0); return; }

      const { data: resp } = await supabase
        .from('form_responses')
        .select('form_id')
        .eq('user_id', user.id)
        .in('form_id', forms.map((f: any) => f.id));
      if (cancelled) return;

      const submitted = new Set((resp ?? []).map((r: any) => r.form_id));
      setCount(forms.filter((f: any) => !submitted.has(f.id)).length);
    };

    load();
    const interval = setInterval(load, 60_000);
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    window.addEventListener('formsChanged', onFocus);

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('formsChanged', onFocus);
    };

  }, [user?.id, clubIds]);

  return count;
}
