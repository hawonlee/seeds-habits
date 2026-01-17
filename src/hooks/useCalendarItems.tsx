import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Database } from '@/integrations/supabase/types';

type CalendarItem = Database['public']['Tables']['calendar_items']['Row'];
type CalendarItemInsert = Database['public']['Tables']['calendar_items']['Insert'];
type CalendarItemUpdate = Database['public']['Tables']['calendar_items']['Update'];

export interface CalendarItemWithDetails extends CalendarItem {
  habit?: Database['public']['Tables']['habits']['Row'];
  task?: Database['public']['Tables']['tasks']['Row'];
}

export const useCalendarItems = () => {
  const { user } = useAuth();
  const [calendarItems, setCalendarItems] = useState<CalendarItemWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchIdRef = useRef(0);
  const nowIso = () => new Date().toISOString();

  // Format date for database (YYYY-MM-DD in local timezone)
  const formatDateForDB = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch all calendar items for the current user with related data
  const fetchCalendarItems = async (startDate?: Date, endDate?: Date) => {
    const fetchId = ++fetchIdRef.current;
    if (!user) {
      setCalendarItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      let query = supabase
        .from('calendar_items')
        .select('*')
        .eq('user_id', user.id);

      if (startDate && endDate) {
        query = query
          .gte('scheduled_date', formatDateForDB(startDate))
          .lte('scheduled_date', formatDateForDB(endDate));
      }

      const { data: calendarItemsData, error } = await query.order('scheduled_date', { ascending: true });

      // Debug: verify fetched calendar items and type distribution
      try {
        const total = calendarItemsData?.length || 0;
        const tasksCount = (calendarItemsData || []).filter(i => i.item_type === 'task').length;
        const habitsCount = (calendarItemsData || []).filter(i => i.item_type === 'habit').length;
        console.log('[calendar_items] fetched:', { total, tasksCount, habitsCount, sample: calendarItemsData?.slice(0, 5) });
      } catch {}

      if (error) throw error;
      
      // Fetch related habit and task data separately
      const habitIds = calendarItemsData?.filter(item => item.item_type === 'habit').map(item => item.item_id) || [];
      const taskIds = calendarItemsData?.filter(item => item.item_type === 'task').map(item => item.item_id) || [];
      
      const [habitsRes, tasksRes] = await Promise.all([
        habitIds.length > 0 ? supabase.from('habits').select('*').in('id', habitIds) : Promise.resolve({ data: [], error: null }),
        taskIds.length > 0 ? supabase.from('tasks').select('*').in('id', taskIds) : Promise.resolve({ data: [], error: null })
      ]);
      
      const habitsMap = new Map<string, Database['public']['Tables']['habits']['Row']>(habitsRes.data?.map(habit => [habit.id, habit] as const) || []);
      const tasksMap = new Map<string, Database['public']['Tables']['tasks']['Row']>(tasksRes.data?.map(task => [task.id, task] as const) || []);
      
      const itemsWithDetails: CalendarItemWithDetails[] = (calendarItemsData || []).map(item => ({
        ...item,
        habit: item.item_type === 'habit' ? habitsMap.get(item.item_id) : undefined,
        task: item.item_type === 'task' ? tasksMap.get(item.item_id) : undefined,
      }));

      // Debug: verify mapping enrichment
      try {
        const sample = itemsWithDetails.slice(0, 5);
        console.log('[calendar_items] mapped with details (sample):', sample);
      } catch {}
      
      // Only apply the results if this is the latest fetch to avoid overwriting
      // newer state (e.g., right after a drag-and-drop schedule).
      if (fetchId === fetchIdRef.current) {
        setCalendarItems(itemsWithDetails);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      if (fetchId === fetchIdRef.current) {
        setLoading(false);
      }
    }
  };

  // Schedule a habit for a specific date
  const minutesFromMidnight = (d: Date) => d.getHours() * 60 + d.getMinutes();

  const scheduleHabit = async (habitId: string, date: Date, options?: { isAllDay?: boolean }): Promise<boolean> => {
    if (!user) return false;

    const scheduledDate = formatDateForDB(date);
    const isAllDay = options?.isAllDay === true;
    const startMinutesValue = isAllDay ? null : minutesFromMidnight(date);
    const optimisticId = `optimistic-habit-${habitId}-${Date.now()}`;

    // Optimistically add so UI updates immediately, even if network is busy (e.g., during screen recording)
    const optimisticItem: CalendarItemWithDetails = {
      id: optimisticId,
      user_id: user.id,
      item_type: 'habit',
      item_id: habitId,
      scheduled_date: scheduledDate,
      start_minutes: startMinutesValue,
      end_minutes: null,
      completed: false,
      completed_at: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    setCalendarItems(prev => [...prev, optimisticItem]);

    try {
      const { data, error } = await supabase
        .from('calendar_items')
        .insert({
          user_id: user.id,
          item_type: 'habit',
          item_id: habitId,
          scheduled_date: scheduledDate,
          start_minutes: startMinutesValue,
        })
        .select('*')
        .single();

      if (error) {
        if (error.code === '23505') {
          console.log('Habit already scheduled for this date/time');
          return false;
        }
        throw error;
      }

      // Update local state
      if (data) {
        setCalendarItems(prev =>
          prev.map(ci => ci.id === optimisticId ? data : ci)
        );
      }
      
      return true;
    } catch (error) {
      // Remove optimistic item on failure
      setCalendarItems(prev => prev.filter(ci => ci.id !== optimisticId));
      console.error('Error scheduling habit:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      return false;
    }
  };

  // Schedule a task for a specific date
  const scheduleTask = async (taskId: string, date: Date, options?: { isAllDay?: boolean }): Promise<boolean> => {
    if (!user) return false;

    const scheduledDate = formatDateForDB(date);
    const isAllDay = options?.isAllDay === true;
    const startMinutesValue = isAllDay ? null : minutesFromMidnight(date);
    const optimisticId = `optimistic-task-${taskId}-${Date.now()}`;

    // Optimistically add so UI updates immediately, even if the network request is delayed
    const optimisticItem: CalendarItemWithDetails = {
      id: optimisticId,
      user_id: user.id,
      item_type: 'task',
      item_id: taskId,
      scheduled_date: scheduledDate,
      start_minutes: startMinutesValue,
      end_minutes: null,
      completed: false,
      completed_at: null,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    setCalendarItems(prev => [...prev, optimisticItem]);

    try {
      const { data, error } = await supabase
        .from('calendar_items')
        .insert({
          user_id: user.id,
          item_type: 'task',
          item_id: taskId,
          scheduled_date: scheduledDate,
          start_minutes: startMinutesValue,
          completed: false,
        })
        .select('*')
        .single();

      if (error) {
        if (error.code === '23505') {
          // If conflict and we're not all-day, keep disallowing duplicates at exact time
          console.log('Task already scheduled for this date/time');
          return false;
        }
        throw error;
      }

      // Update local state
      if (data) {
        setCalendarItems(prev =>
          prev.map(ci => ci.id === optimisticId ? data : ci)
        );
      }
      
      return true;
    } catch (error) {
      // Remove optimistic item on failure
      setCalendarItems(prev => prev.filter(ci => ci.id !== optimisticId));
      console.error('Error scheduling task:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      return false;
    }
  };

  // Toggle completion for a single occurrence
  const toggleCalendarItemCompleted = async (itemId: string, completed: boolean) => {
    if (!user) return false;
    try {
      const { data, error } = await supabase
        .from('calendar_items')
        .update({ completed, completed_at: completed ? new Date().toISOString() : null })
        .eq('id', itemId)
        .eq('user_id', user.id)
        .select('*')
        .single();
      if (error) throw error;
      setCalendarItems(prev => prev.map(ci => (ci.id === itemId ? { ...ci, ...data } : ci)));
      return true;
    } catch (err) {
      console.error('Error toggling calendar item completion:', err);
      return false;
    }
  };

  // Unschedule an item from a specific date
  const unscheduleItem = async (itemType: 'habit' | 'task', itemId: string, date: Date): Promise<boolean> => {
    if (!user) return false;

    try {
      const scheduledDate = formatDateForDB(date);
      
      // Delete all calendar items for this task/date combination, regardless of start_minutes
      // This handles both all-day items (start_minutes IS NULL) and timed items
      const { error } = await supabase
        .from('calendar_items')
        .delete()
        .eq('user_id', user.id)
        .eq('item_type', itemType)
        .eq('item_id', itemId)
        .eq('scheduled_date', scheduledDate);

      if (error) throw error;

      // Update local state
      setCalendarItems(prev => 
        prev.filter(item => 
          !(item.item_type === itemType && 
            item.item_id === itemId && 
            item.scheduled_date === scheduledDate)
        )
      );
      
      return true;
    } catch (error) {
      console.error('Error unscheduling item:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      return false;
    }
  };

  // Delete a specific calendar item by its id (single occurrence)
  const deleteCalendarItemById = async (calendarItemId: string): Promise<boolean> => {
    if (!user) return false;
    try {
      const { error } = await supabase
        .from('calendar_items')
        .delete()
        .eq('id', calendarItemId)
        .eq('user_id', user.id);
      if (error) throw error;
      setCalendarItems(prev => prev.filter(ci => ci.id !== calendarItemId));
      return true;
    } catch (err) {
      console.error('Error deleting calendar item by id:', err);
      return false;
    }
  };

  // Move an item to a different date
  const moveItem = async (itemType: 'habit' | 'task', itemId: string, fromDate: Date, toDate: Date): Promise<boolean> => {
    if (!user) return false;

    try {
      const fromDateStr = formatDateForDB(fromDate);
      const toDateStr = formatDateForDB(toDate);
      const toStartMinutes = minutesFromMidnight(toDate);
      
      const { data, error } = await supabase
        .from('calendar_items')
        .update({ scheduled_date: toDateStr, start_minutes: toStartMinutes })
        .eq('user_id', user.id)
        .eq('item_type', itemType)
        .eq('item_id', itemId)
        .eq('scheduled_date', fromDateStr)
        .eq('start_minutes', minutesFromMidnight(fromDate))
        .select('*')
        .single();

      if (error) throw error;

      // Update local state
      if (data) {
        setCalendarItems(prev => 
          prev.map(item => 
            item.item_type === itemType && 
            item.item_id === itemId && 
            item.scheduled_date === fromDateStr
              ? data
              : item
          )
        );
      }
      
      return true;
    } catch (error) {
      console.error('Error moving item:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      return false;
    }
  };

  // Get calendar items for a specific date
  const getItemsForDate = (date: Date): CalendarItemWithDetails[] => {
    const dateStr = formatDateForDB(date);
    return calendarItems.filter(item => item.scheduled_date === dateStr);
  };

  // Get calendar items for a date range
  const getItemsForDateRange = (startDate: Date, endDate: Date): CalendarItemWithDetails[] => {
    const startStr = formatDateForDB(startDate);
    const endStr = formatDateForDB(endDate);
    return calendarItems.filter(item => 
      item.scheduled_date >= startStr && item.scheduled_date <= endStr
    );
  };

  // Check if an item is scheduled for a specific date
  const isItemScheduled = (itemType: 'habit' | 'task', itemId: string, date: Date): boolean => {
    const dateStr = formatDateForDB(date);
    return calendarItems.some(item => 
      item.item_type === itemType && 
      item.item_id === itemId && 
      item.scheduled_date === dateStr
    );
  };

  // Load calendar items when user changes
  useEffect(() => {
    fetchCalendarItems();
  }, [user]);

  return {
    calendarItems,
    loading,
    error,
    scheduleHabit,
    scheduleTask,
    unscheduleItem,
    moveItem,
    getItemsForDate,
    getItemsForDateRange,
    isItemScheduled,
    refreshCalendarItems: fetchCalendarItems,
    toggleCalendarItemCompleted,
    deleteCalendarItemById,
  };
};
