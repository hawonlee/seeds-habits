import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type HabitTargetUnit = 'day' | 'week';

export interface Habit {
  id: string;
  user_id: string;
  title: string;
  notes?: string;
  category: string;
  target_value: number;
  target_unit: HabitTargetUnit;
  custom_days: number[] | null;
  leniency_threshold: number;
  phase: 'future' | 'current' | 'adopted';
  streak: number;
  total_completions: number;
  last_completed?: string;
  points: number;
  created_at: string;
  updated_at: string;
}

// Simple cache to prevent unnecessary refetches
let habitsCache: { [userId: string]: { habits: Habit[], timestamp: number } } = {};
export const invalidateHabitsCacheForUser = (userId: string) => {
  if (userId && habitsCache[userId]) {
    delete habitsCache[userId];
  }
};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useHabits = () => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchHabits();
    } else {
      setHabits([]);
      setLoading(false);
      setHasLoaded(false);
    }
  }, [user]);

  // Optimize: Don't refetch if we already have data for this user
  useEffect(() => {
    if (user && habits.length === 0 && !loading) {
      fetchHabits();
    }
  }, [user?.id]);

  const fetchHabits = async () => {
    if (!user) return;

    // Check cache first
    const cached = habitsCache[user.id];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setHabits(cached.habits);
      setLoading(false);
      setHasLoaded(true);
      return;
    }

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });


      if (error) {
        console.error('Error fetching habits:', error);
        toast({
          title: "Error",
          description: `Failed to load habits: ${error.message}`,
          variant: "destructive",
        });
      } else {
        const habitsData = data || [];
        setHabits(habitsData);
        setHasLoaded(true);
        
        // Cache the results
        habitsCache[user.id] = {
          habits: habitsData,
          timestamp: Date.now()
        };
      }
    } catch (error) {
      console.error('Error fetching habits:', error);
      toast({
        title: "Error",
        description: "Failed to load habits",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addHabit = async (habitData: Omit<Habit, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) {
      console.error('No user found when trying to add habit');
      return { error: 'No user found' };
    }


    try {
      const insertData = {
        user_id: user.id,
        title: habitData.title,
        notes: habitData.notes,
        category: habitData.category,
        target_value: habitData.target_value,
        target_unit: habitData.target_unit,
        custom_days: habitData.custom_days,
        leniency_threshold: habitData.leniency_threshold,
        phase: habitData.phase,
        streak: habitData.streak,
        total_completions: habitData.total_completions,
        last_completed: habitData.last_completed,
        points: habitData.points,
      };


      const { data, error } = await supabase
        .from('habits')
        .insert(insertData)
        .select()
        .single();


      if (error) {
        console.error('Supabase error:', error);
        toast({
          title: "Error",
          description: `Failed to add habit: ${error.message}`,
          variant: "destructive",
        });
        return { error };
      } else {
        setHabits(prev => [data, ...prev]);
        
        // Invalidate cache
        if (user) {
          delete habitsCache[user.id];
        }
        
        // Removed success toast per request
        return { data };
      }
    } catch (error) {
      console.error('Error adding habit:', error);
      return { error };
    }
  };

  const updateHabit = async (id: string, updates: Partial<Habit>) => {
    if (!user) return { error: 'No user found' };

    try {
      const { data, error } = await supabase
        .from('habits')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        toast({
          title: "Error",
          description: "Failed to update habit",
          variant: "destructive",
        });
        return { error };
      } else {
        setHabits(prev => prev.map(h => h.id === id ? data : h));
        
        // Invalidate cache
        if (user) {
          delete habitsCache[user.id];
        }
        
        // Removed success toast per request
        return { data };
      }
    } catch (error) {
      console.error('Error updating habit:', error);
      return { error };
    }
  };

  const deleteHabit = async (id: string) => {
    if (!user) return { error: 'No user found' };

    try {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Error",
          description: "Failed to delete habit",
          variant: "destructive",
        });
        return { error };
      } else {
        setHabits(prev => prev.filter(h => h.id !== id));
        
        // Invalidate cache
        if (user) {
          delete habitsCache[user.id];
        }
        
        // Removed success toast per request
        return { success: true };
      }
    } catch (error) {
      console.error('Error deleting habit:', error);
      return { error };
    }
  };

  const checkInHabit = async (id: string, dateOverride?: Date) => {
    if (!user) return { error: 'No user found' };

    try {
      const habit = habits.find(h => h.id === id);
      if (!habit || habit.phase !== 'current') {
        return { error: 'Invalid habit or phase' };
      }

      const checkInDate = dateOverride || new Date();
      const dateKey = checkInDate.toISOString().split('T')[0];
      const lastCompleted = habit.last_completed ? new Date(habit.last_completed).toISOString().split('T')[0] : null;

      // Only enforce single check-in per day when checking in for today
      if (!dateOverride && lastCompleted === dateKey) {
        toast({
          title: "Already checked in today",
          description: "You can only check in once per day for this habit.",
          variant: "destructive",
        });
        return { error: 'Already checked in today' };
      }

      const checkInISO = checkInDate.toISOString();
      const isConsecutive = lastCompleted && 
        (checkInDate.getTime() - new Date(habit.last_completed).getTime()) <= (habit.leniency_threshold + 1) * 24 * 60 * 60 * 1000;

      const updates = {
        streak: isConsecutive ? habit.streak + 1 : 1,
        total_completions: habit.total_completions + 1,
        last_completed: checkInISO,
      };

      return await updateHabit(id, updates);
    } catch (error) {
      console.error('Error checking in habit:', error);
      return { error };
    }
  };

  const undoCheckIn = async (id: string) => {
    if (!user) return { error: 'No user found' };

    try {
      const habit = habits.find(h => h.id === id);
      if (!habit || habit.phase !== 'current') {
        return { error: 'Invalid habit or phase' };
      }

      if (habit.total_completions <= 0) {
        return { error: 'No check-ins to undo' };
      }

      // Calculate the previous streak and last completed date
      const previousCompletions = habit.total_completions - 1;
      let previousStreak = habit.streak - 1;
      let previousLastCompleted = null;

      // If this was the first check-in, reset everything
      if (previousCompletions === 0) {
        previousStreak = 0;
        previousLastCompleted = null;
      } else {
        // Find the previous last_completed date by looking at the habit history
        // For simplicity, we'll set it to null and let the user check in again
        // In a more complex system, you might want to store check-in history
        previousLastCompleted = null;
      }

      const updates = {
        streak: Math.max(0, previousStreak),
        total_completions: previousCompletions,
        last_completed: previousLastCompleted,
      };

      const result = await updateHabit(id, updates);
      
      if (!result.error) {
        // Removed success toast per request
      }

      return result;
    } catch (error) {
      console.error('Error undoing check-in:', error);
      return { error };
    }
  };

  const moveHabitPhase = async (id: string, newPhase: Habit['phase']) => {
    if (!user) return { error: 'No user found' };

    try {
      const habit = habits.find(h => h.id === id);
      if (!habit) {
        return { error: 'Habit not found' };
      }

      const updates: Partial<Habit> = { phase: newPhase };
      
      // Award points for adoption
      if (newPhase === 'adopted' && habit.points === 0) {
        updates.points = 50;
      }

      const result = await updateHabit(id, updates);
      return result;
    } catch (error) {
      console.error('Error moving habit phase:', error);
      return { error };
    }
  };

  return {
    habits,
    loading,
    hasLoaded,
    fetchHabits,
    addHabit,
    updateHabit,
    deleteHabit,
    checkInHabit,
    undoCheckIn,
    moveHabitPhase,
    refreshHabits: fetchHabits,
  };
};
