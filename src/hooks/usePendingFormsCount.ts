import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Count of published forms the current user CAN fill but has NOT yet submitted
 * and whose deadline hasn't passed. Used for the sidebar Forms red badge.
 * RLS already restricts `forms` SELECT to clubs the user belongs to + public forms.
 */
export function usePendingFormsCount() {
  const { user } = useAuth();
  const [count, setCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (!user) { setCount(0); return; }

    const load = async () => {
      const { data: forms } = await supabase
        .from('forms')
        .select('id, deadline')
        .eq('is_published', true);
      if (cancelled || !forms) return;

      const now = Date.now();
      const active = forms.filter(
        (f: any) => !f.deadline || new Date(f.deadline).getTime() >= now
      );
      if (active.length === 0) { setCount(0); return; }

      const { data: resp } = await supabase
        .from('form_responses')
        .select('form_id')
        .eq('user_id', user.id)
        .in('form_id', active.map((f: any) => f.id));
      if (cancelled) return;

      const submitted = new Set((resp ?? []).map((r: any) => r.form_id));
      setCount(active.filter((f: any) => !submitted.has(f.id)).length);
    };

    load();
    const interval = setInterval(load, 60_000);
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    window.addEventListener('formsChanged', onFocus);

    const channel = supabase
      .channel(`pending-forms-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'forms' }, () => load())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'form_responses', filter: `user_id=eq.${user.id}` }, () => load())
      .subscribe();

    return () => {
      cancelled = true;
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('formsChanged', onFocus);
      supabase.removeChannel(channel);
    };

  }, [user?.id]);

  return count;
}
