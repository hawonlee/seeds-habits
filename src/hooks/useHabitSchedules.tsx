import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Database } from '@/integrations/supabase/types';

type CalendarItem = Database['public']['Tables']['calendar_items']['Row'];

export interface HabitSchedule {
  id: string;
  habit_id: string;
  user_id: string;
  scheduled_date: string;
  created_at: string;
  updated_at: string;
}

export const useHabitSchedules = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState<HabitSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  // Format date for database (YYYY-MM-DD in local timezone)
  const formatDateForDB = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Fetch all schedules for the current user
  const fetchSchedules = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('calendar_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('item_type', 'habit')
        .order('scheduled_date', { ascending: true });

      if (error) throw error;
      
      // Transform calendar_items to HabitSchedule format for backward compatibility
      const habitSchedules: HabitSchedule[] = (data || []).map(item => ({
        id: item.id,
        habit_id: item.item_id,
        user_id: item.user_id,
        scheduled_date: item.scheduled_date,
        created_at: item.created_at,
        updated_at: item.updated_at,
      }));
      
      setSchedules(habitSchedules);
    } catch (error) {
      console.error('Error fetching habit schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  // Schedule a habit for a specific date
  const scheduleHabit = async (habitId: string, date: Date): Promise<boolean> => {
    if (!user) return false;

    try {
      const scheduledDate = formatDateForDB(date);
      
      const { data, error } = await supabase
        .from('calendar_items')
        .insert({
          user_id: user.id,
          item_type: 'habit',
          item_id: habitId,
          scheduled_date: scheduledDate,
        })
        .select();

      if (error) {
        // If it's a unique constraint violation, the habit is already scheduled for this date
        if (error.code === '23505') {
          console.log('Habit already scheduled for this date');
          return false;
        }
        throw error;
      }

      // Optimistically update the local state immediately
      if (data && data.length > 0) {
        const habitSchedule: HabitSchedule = {
          id: data[0].id,
          habit_id: data[0].item_id,
          user_id: data[0].user_id,
          scheduled_date: data[0].scheduled_date,
          created_at: data[0].created_at,
          updated_at: data[0].updated_at,
        };
        setSchedules(prev => [...prev, habitSchedule]);
      }
      
      return true;
    } catch (error) {
      console.error('Error scheduling habit:', error);
      return false;
    }
  };

  // Unschedule a habit from a specific date
  const unscheduleHabit = async (habitId: string, date: Date): Promise<boolean> => {
    if (!user) return false;

    try {
      const scheduledDate = formatDateForDB(date);
      
      // Optimistically update the local state immediately
      setSchedules(prev => prev.filter(schedule => 
        !(schedule.habit_id === habitId && schedule.scheduled_date === scheduledDate)
      ));
      
      const { error } = await supabase
        .from('calendar_items')
        .delete()
        .eq('user_id', user.id)
        .eq('item_type', 'habit')
        .eq('item_id', habitId)
        .eq('scheduled_date', scheduledDate);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error unscheduling habit:', error);
      // Revert optimistic update on error
      fetchSchedules();
      return false;
    }
  };

  // Check if a habit is scheduled for a specific date
  const isHabitScheduledOnDate = (habitId: string, date: Date): boolean => {
    const scheduledDate = formatDateForDB(date);
    return schedules.some(
      schedule => schedule.habit_id === habitId && schedule.scheduled_date === scheduledDate
    );
  };

  // Get all habits scheduled for a specific date
  const getScheduledHabitsForDate = (date: Date): string[] => {
    const scheduledDate = formatDateForDB(date);
    return schedules
      .filter(schedule => schedule.scheduled_date === scheduledDate)
      .map(schedule => schedule.habit_id);
  };

  // Get all dates a habit is scheduled for
  const getScheduledDatesForHabit = (habitId: string): Date[] => {
    return schedules
      .filter(schedule => schedule.habit_id === habitId)
      .map(schedule => new Date(schedule.scheduled_date));
  };

  useEffect(() => {
    if (user) {
      fetchSchedules();
      
      // Subscribe to real-time changes
      const subscription = supabase
        .channel('habit_schedules_changes')
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'habit_schedules',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Habit schedules change received:', payload);
            console.log('Current schedules before refresh:', schedules.length);
            // Refresh schedules when any change occurs
            fetchSchedules();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    } else {
      setSchedules([]);
      setLoading(false);
    }
  }, [user]);

  return {
    schedules,
    loading,
    scheduleHabit,
    unscheduleHabit,
    isHabitScheduledOnDate,
    getScheduledHabitsForDate,
    getScheduledDatesForHabit,
    refreshSchedules: fetchSchedules,
  };
};
