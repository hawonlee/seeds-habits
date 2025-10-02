import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { invalidateHabitsCacheForUser } from './useHabits';

export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  completion_date: string;
  completion_count: number;
  created_at: string;
  updated_at: string;
}

export const useHabitCompletions = (onHabitUpdate?: () => void) => {
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

  // Get the completion count for a habit on a specific date
  const getCompletionCountForDate = (habitId: string, date: Date): number => {
    const dateString = formatDateForDB(date);
    const completion = completions.find(
      completion => 
        completion.habit_id === habitId && 
        completion.completion_date === dateString
    );
    return completion ? completion.completion_count : 0;
  };

  // Add a completion for a habit on a specific date
  const addCompletion = async (habitId: string, date: Date): Promise<boolean> => {
    if (!user) return false;

    const dateString = formatDateForDB(date);

    try {
      // Check if there's already a completion for this habit on this date
      const existingCompletion = completions.find(
        completion => 
          completion.habit_id === habitId && 
          completion.completion_date === dateString
      );

      let data;
      if (existingCompletion) {
        // Update existing completion by incrementing the count
        const { data: updateData, error: updateError } = await supabase
          .from('habit_completions')
          .update({
            completion_count: existingCompletion.completion_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingCompletion.id)
          .select()
          .single();

        if (updateError) {
          console.error('Error updating habit completion:', updateError);
          return false;
        }
        data = updateData;

        // Update local state
        setCompletions(prev => 
          prev.map(completion => 
            completion.id === existingCompletion.id 
              ? { ...completion, completion_count: completion.completion_count + 1 }
              : completion
          )
        );
      } else {
        // Insert new completion
        const { data: insertData, error: insertError } = await supabase
          .from('habit_completions')
          .insert({
            habit_id: habitId,
            user_id: user.id,
            completion_date: dateString,
            completion_count: 1,
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error adding habit completion:', insertError);
          return false;
        }
        data = insertData;

        // Update local state
        setCompletions(prev => [data, ...prev]);
      }

      // Invalidate habits cache and request refresh immediately
      invalidateHabitsCacheForUser(user.id);
      onHabitUpdate?.();

      // Also update the main habit's total_completions and last_completed
      try {
        // First get the current habit to increment total_completions
        const { data: habitData, error: fetchError } = await supabase
          .from('habits')
          .select('total_completions')
          .eq('id', habitId)
          .eq('user_id', user.id)
          .single();

        if (fetchError) {
          console.error('Error fetching habit for update:', fetchError);
        } else {
          const { error: habitError } = await supabase
            .from('habits')
            .update({
              total_completions: (habitData.total_completions || 0) + 1,
              last_completed: date.toISOString()
            })
            .eq('id', habitId)
            .eq('user_id', user.id);

          if (habitError) {
            console.error('Error updating habit total_completions:', habitError);
          } else {
            // Notify that habit data has been updated
            onHabitUpdate?.();
          }
        }
      } catch (error) {
        console.error('Error updating habit total_completions:', error);
      }

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
      // Find the existing completion
      const existingCompletion = completions.find(
        completion => 
          completion.habit_id === habitId && 
          completion.completion_date === dateString
      );

      if (!existingCompletion) {
        console.error('No completion found to remove');
        return false;
      }

      if (existingCompletion.completion_count > 1) {
        // Decrement the completion count
        const { data, error } = await supabase
          .from('habit_completions')
          .update({
            completion_count: existingCompletion.completion_count - 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingCompletion.id)
          .select()
          .single();

        if (error) {
          console.error('Error decrementing habit completion:', error);
          return false;
        }

        // Update local state
        setCompletions(prev => 
          prev.map(completion => 
            completion.id === existingCompletion.id 
              ? { ...completion, completion_count: completion.completion_count - 1 }
              : completion
          )
        );
      } else {
        // Remove the completion entirely
        const { error } = await supabase
          .from('habit_completions')
          .delete()
          .eq('id', existingCompletion.id);

        if (error) {
          console.error('Error removing habit completion:', error);
          return false;
        }

        // Update local state
        setCompletions(prev => 
          prev.filter(completion => completion.id !== existingCompletion.id)
        );
      }

      // Invalidate habits cache and request refresh immediately
      invalidateHabitsCacheForUser(user.id);
      onHabitUpdate?.();

      // Also update the main habit's total_completions (decrement)
      try {
        // First get the current habit to decrement total_completions
        const { data: habitData, error: fetchError } = await supabase
          .from('habits')
          .select('total_completions')
          .eq('id', habitId)
          .eq('user_id', user.id)
          .single();

        if (fetchError) {
          console.error('Error fetching habit for update:', fetchError);
        } else {
          const { error: habitError } = await supabase
            .from('habits')
            .update({
              total_completions: Math.max((habitData.total_completions || 0) - 1, 0)
            })
            .eq('id', habitId)
            .eq('user_id', user.id);

          if (habitError) {
            console.error('Error updating habit total_completions:', habitError);
          } else {
            // Notify that habit data has been updated
            onHabitUpdate?.();
          }
        }
      } catch (error) {
        console.error('Error updating habit total_completions:', error);
      }

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
    getCompletionCountForDate,
    addCompletion,
    removeCompletion,
    toggleCompletion,
    getCompletionsForHabit,
    getCompletionsForDate,
    refreshCompletions: fetchCompletions,
  };
};
