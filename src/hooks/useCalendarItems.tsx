import { useState, useEffect } from 'react';
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

  // Format date for database (YYYY-MM-DD in local timezone)
  const formatDateForDB = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch all calendar items for the current user with related data
  const fetchCalendarItems = async (startDate?: Date, endDate?: Date) => {
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
      
      setCalendarItems(itemsWithDetails);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Schedule a habit for a specific date
  const minutesFromMidnight = (d: Date) => d.getHours() * 60 + d.getMinutes();

  const scheduleHabit = async (habitId: string, date: Date, options?: { isAllDay?: boolean }): Promise<boolean> => {
    if (!user) return false;

    try {
      const scheduledDate = formatDateForDB(date);
      const isAllDay = options?.isAllDay === true;
      const startMinutesValue = isAllDay ? null : minutesFromMidnight(date);
      
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
        setCalendarItems(prev => [...prev, data]);
      }
      
      return true;
    } catch (error) {
      console.error('Error scheduling habit:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      return false;
    }
  };

  // Schedule a task for a specific date
  const scheduleTask = async (taskId: string, date: Date, options?: { isAllDay?: boolean }): Promise<boolean> => {
    if (!user) return false;

    try {
      const scheduledDate = formatDateForDB(date);
      const isAllDay = options?.isAllDay === true;
      const startMinutesValue = isAllDay ? null : minutesFromMidnight(date);
      
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
        setCalendarItems(prev => [...prev, data]);
      }
      
      return true;
    } catch (error) {
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
      const startMinutes = minutesFromMidnight(date);
      
      // For all-day entries, start_minutes is NULL. For timed entries it equals minutesFromMidnight(date).
      let deleteQuery = supabase
        .from('calendar_items')
        .delete()
        .eq('user_id', user.id)
        .eq('item_type', itemType)
        .eq('item_id', itemId)
        .eq('scheduled_date', scheduledDate);

      if (startMinutes === 0) {
        deleteQuery = deleteQuery.is('start_minutes', null);
      } else {
        deleteQuery = deleteQuery.eq('start_minutes', startMinutes);
      }

      const { error } = await deleteQuery;

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
