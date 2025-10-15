import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export type CalendarFilters = {
  habits: boolean;
  tasks: boolean;
  diaries: boolean;
};

const DEFAULT_FILTERS: CalendarFilters = { habits: true, tasks: true, diaries: true };

export function useUserPreferences() {
  const { user } = useAuth();
  // Hydrate immediately from localStorage to avoid UI flash before remote load
  const [calendarFilters, setCalendarFilters] = useState<CalendarFilters>(() => {
    try {
      const raw = localStorage.getItem('calendar_filters');
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<CalendarFilters>;
        return { ...DEFAULT_FILTERS, ...parsed };
      }
    } catch {}
    return DEFAULT_FILTERS;
  });
  const [loading, setLoading] = useState(true);
  const [hasLocal, setHasLocal] = useState<boolean>(() => {
    try { return !!localStorage.getItem('calendar_filters'); } catch { return false; }
  });

  const load = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('user_preferences')
      .select('calendar_filters')
      .eq('user_id', user.id)
      .single();

    if (!error && data?.calendar_filters) {
      const raw = data.calendar_filters as Partial<CalendarFilters>;
      setCalendarFilters({ ...DEFAULT_FILTERS, ...raw });
      try { localStorage.setItem('calendar_filters', JSON.stringify({ ...DEFAULT_FILTERS, ...raw })); } catch {}
    } else {
      setCalendarFilters(DEFAULT_FILTERS);
    }
    setLoading(false);
  }, [user?.id]);

  const save = useCallback(async (next: CalendarFilters) => {
    if (!user?.id) return;
    setCalendarFilters(next); // optimistic
    try {
      localStorage.setItem('calendar_filters', JSON.stringify(next));
    } catch {}
    await supabase
      .from('user_preferences')
      .upsert({ user_id: user.id, calendar_filters: next }, { onConflict: 'user_id' });
  }, [user?.id]);

  useEffect(() => { void load(); }, [load]);

  const ready = hasLocal || !loading;
  return { calendarFilters, setCalendarFilters: save, loading, ready, reloadPreferences: load };
}


