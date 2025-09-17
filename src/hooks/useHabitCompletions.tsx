import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completion_date: string;
  created_at: string;
  updated_at: string;
}

export const useHabitCompletions = () => {
  const { user } = useAuth();
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all completions for the current user
  const fetchCompletions = async () => {
    if (!user) {
      setCompletions([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('user_id', user.id)
        .order('completion_date', { ascending: false });

      if (error) {
        console.error('Error fetching habit completions:', error);
        return;
      }

      setCompletions(data || []);
    } catch (error) {
      console.error('Error fetching habit completions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format date as YYYY-MM-DD in local timezone
  const formatDateForDB = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Check if a habit is completed on a specific date
  const isHabitCompletedOnDate = (habitId: string, date: Date): boolean => {
    const dateString = formatDateForDB(date);
    return completions.some(
      completion => 
        completion.habit_id === habitId && 
        completion.completion_date === dateString
    );
  };

  // Add a completion for a habit on a specific date
  const addCompletion = async (habitId: string, date: Date): Promise<boolean> => {
    if (!user) return false;

    const dateString = formatDateForDB(date);

    try {
      const { data, error } = await supabase
        .from('habit_completions')
        .insert({
          habit_id: habitId,
          user_id: user.id,
          completion_date: dateString,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding habit completion:', error);
        return false;
      }

      // Update local state
      setCompletions(prev => [data, ...prev]);
      return true;
    } catch (error) {
      console.error('Error adding habit completion:', error);
      return false;
    }
  };

  // Remove a completion for a habit on a specific date
  const removeCompletion = async (habitId: string, date: Date): Promise<boolean> => {
    if (!user) return false;

    const dateString = formatDateForDB(date);

    try {
      const { error } = await supabase
        .from('habit_completions')
        .delete()
        .eq('habit_id', habitId)
        .eq('user_id', user.id)
        .eq('completion_date', dateString);

      if (error) {
        console.error('Error removing habit completion:', error);
        return false;
      }

      // Update local state
      setCompletions(prev => 
        prev.filter(completion => 
          !(completion.habit_id === habitId && completion.completion_date === dateString)
        )
      );
      return true;
    } catch (error) {
      console.error('Error removing habit completion:', error);
      return false;
    }
  };

  // Toggle completion for a habit on a specific date
  const toggleCompletion = async (habitId: string, date: Date): Promise<boolean> => {
    const isCompleted = isHabitCompletedOnDate(habitId, date);
    
    if (isCompleted) {
      return await removeCompletion(habitId, date);
    } else {
      return await addCompletion(habitId, date);
    }
  };

  // Get completions for a specific habit
  const getCompletionsForHabit = (habitId: string): HabitCompletion[] => {
    return completions.filter(completion => completion.habit_id === habitId);
  };

  // Get completions for a specific date
  const getCompletionsForDate = (date: Date): HabitCompletion[] => {
    const dateString = formatDateForDB(date);
    return completions.filter(completion => completion.completion_date === dateString);
  };

  // Load completions when user changes
  useEffect(() => {
    fetchCompletions();
  }, [user]);

  return {
    completions,
    loading,
    isHabitCompletedOnDate,
    addCompletion,
    removeCompletion,
    toggleCompletion,
    getCompletionsForHabit,
    getCompletionsForDate,
    refreshCompletions: fetchCompletions,
  };
};
