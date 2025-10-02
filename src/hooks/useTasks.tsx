import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface TaskList {
  id: string;
  name: string;
  description?: string;
  color: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  due_date?: string;
  priority: 'low' | 'medium' | 'high';
  task_list_id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

// Simple cache to prevent unnecessary refetches
let tasksCache: { [userId: string]: { taskLists: TaskList[], tasks: Task[], timestamp: number } } = {};
export const invalidateTasksCacheForUser = (userId: string) => {
  if (userId && tasksCache[userId]) {
    delete tasksCache[userId];
  }
};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const useTasks = () => {
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Unified refresh function that fetches both task lists and tasks
  const refresh = useCallback(async () => {
    if (!user?.id) {
      setTaskLists([]);
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Check cache first
      const cached = tasksCache[user.id];
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        setTaskLists(cached.taskLists);
        setTasks(cached.tasks);
        setLoading(false);
        return;
      }

      // Fetch both task lists and tasks in parallel
      const [taskListsRes, tasksRes] = await Promise.all([
        supabase
          .from('task_lists')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
      ]);

      if (taskListsRes.error) {
        console.error('Error fetching task lists:', taskListsRes.error);
        setError(taskListsRes.error.message);
      } else {
        const taskListsData = taskListsRes.data || [];
        setTaskLists(taskListsData);
      }

      if (tasksRes.error) {
        console.error('Error fetching tasks:', tasksRes.error);
        setError(tasksRes.error.message);
      } else {
        const tasksData = tasksRes.data || [];
        setTasks(tasksData);
      }

      // Update cache
      tasksCache[user.id] = {
        taskLists: taskListsRes.data || [],
        tasks: tasksRes.data || [],
        timestamp: Date.now()
      };

    } catch (err) {
      console.error('Error in refresh:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Initial fetch when user becomes available
  useEffect(() => {
    if (user?.id) {
      refresh();
    } else {
      setTaskLists([]);
      setTasks([]);
      setLoading(false);
    }
  }, [user?.id, refresh]);

  // Real-time sync for task_lists table
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('tasks-realtime')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'task_lists', 
          filter: `user_id=eq.${user.id}` 
        }, 
        () => {
          console.log('Task list changed, refreshing...');
          refresh();
        }
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'tasks', 
          filter: `user_id=eq.${user.id}` 
        }, 
        () => {
          console.log('Task changed, refreshing...');
          refresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refresh]);

  // Refresh on page focus/visibility change
  useEffect(() => {
    const handleFocus = () => {
      if (user?.id) {
        refresh();
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden && user?.id) {
        refresh();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user?.id, refresh]);

  const createTaskList = async (list: Omit<TaskList, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('task_lists')
        .insert([{ ...list, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      setTaskLists(prev => [data, ...prev]);
      
      // Update cache
      if (user && tasksCache[user.id]) {
        tasksCache[user.id] = {
          ...tasksCache[user.id],
          taskLists: [data, ...tasksCache[user.id].taskLists],
          timestamp: Date.now()
        };
      }
      
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const updateTaskList = async (id: string, updates: Partial<TaskList>) => {
    try {
      const { data, error } = await supabase
        .from('task_lists')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setTaskLists(prev => 
        prev.map(list => list.id === id ? data : list)
      );
      
      // Update cache
      if (user && tasksCache[user.id]) {
        tasksCache[user.id] = {
          ...tasksCache[user.id],
          taskLists: tasksCache[user.id].taskLists.map(list => list.id === id ? data : list),
          timestamp: Date.now()
        };
      }
      
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const deleteTaskList = async (id: string) => {
    try {
      const { error } = await supabase
        .from('task_lists')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setTaskLists(prev => prev.filter(list => list.id !== id));
      // Also delete all tasks in this list
      setTasks(prev => prev.filter(task => task.task_list_id !== id));
      
      // Update cache
      if (user && tasksCache[user.id]) {
        tasksCache[user.id] = {
          ...tasksCache[user.id],
          taskLists: tasksCache[user.id].taskLists.filter(list => list.id !== id),
          tasks: tasksCache[user.id].tasks.filter(task => task.task_list_id !== id),
          timestamp: Date.now()
        };
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const createTask = async (task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{ ...task, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      setTasks(prev => [data, ...prev]);
      
      // Update cache
      if (user && tasksCache[user.id]) {
        tasksCache[user.id] = {
          ...tasksCache[user.id],
          tasks: [data, ...tasksCache[user.id].tasks],
          timestamp: Date.now()
        };
      }
      
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setTasks(prev => 
        prev.map(task => task.id === id ? data : task)
      );
      
      // Update cache
      if (user && tasksCache[user.id]) {
        tasksCache[user.id] = {
          ...tasksCache[user.id],
          tasks: tasksCache[user.id].tasks.map(task => task.id === id ? data : task),
          timestamp: Date.now()
        };
      }
      
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const deleteTask = async (id: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setTasks(prev => prev.filter(task => task.id !== id));
      
      // Update cache
      if (user && tasksCache[user.id]) {
        tasksCache[user.id] = {
          ...tasksCache[user.id],
          tasks: tasksCache[user.id].tasks.filter(task => task.id !== id),
          timestamp: Date.now()
        };
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const getTasksByList = (listId: string): Task[] => {
    return tasks.filter(task => task.task_list_id === listId);
  };

  // Format date for database (YYYY-MM-DD in local timezone)
  const formatDateForDB = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Schedule a task for a specific date (add to calendar_items)
  const scheduleTask = async (taskId: string, date: Date): Promise<boolean> => {
    if (!user) return false;

    try {
      const scheduledDate = formatDateForDB(date);
      
      const { data, error } = await supabase
        .from('calendar_items')
        .insert({
          user_id: user.id,
          item_type: 'task',
          item_id: taskId,
          scheduled_date: scheduledDate,
        })
        .select();

      if (error) {
        // If it's a unique constraint violation, the task is already scheduled for this date
        if (error.code === '23505') {
          console.log('Task already scheduled for this date');
          return false;
        }
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error scheduling task:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      return false;
    }
  };

  // Unschedule a task from a specific date
  const unscheduleTask = async (taskId: string, date: Date): Promise<boolean> => {
    if (!user) return false;

    try {
      const scheduledDate = formatDateForDB(date);
      
      const { error } = await supabase
        .from('calendar_items')
        .delete()
        .eq('user_id', user.id)
        .eq('item_type', 'task')
        .eq('item_id', taskId)
        .eq('scheduled_date', scheduledDate);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error unscheduling task:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      return false;
    }
  };

  // Move a task to a different date
  const moveTask = async (taskId: string, fromDate: Date, toDate: Date): Promise<boolean> => {
    if (!user) return false;

    try {
      const fromDateStr = formatDateForDB(fromDate);
      const toDateStr = formatDateForDB(toDate);
      
      const { error } = await supabase
        .from('calendar_items')
        .update({ scheduled_date: toDateStr })
        .eq('user_id', user.id)
        .eq('item_type', 'task')
        .eq('item_id', taskId)
        .eq('scheduled_date', fromDateStr);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error moving task:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      return false;
    }
  };

  return {
    taskLists,
    tasks,
    loading,
    error,
    createTaskList,
    updateTaskList,
    deleteTaskList,
    createTask,
    updateTask,
    deleteTask,
    getTasksByList,
    scheduleTask,
    unscheduleTask,
    moveTask,
    refresh
  };
};