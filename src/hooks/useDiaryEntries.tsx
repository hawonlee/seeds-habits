import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Database } from '@/integrations/supabase/types';

type DiaryEntry = Database['public']['Tables']['diary_entries']['Row'];
type DiaryEntryInsert = Database['public']['Tables']['diary_entries']['Insert'];
type DiaryEntryUpdate = Database['public']['Tables']['diary_entries']['Update'];

export const useDiaryEntries = () => {
  const [diaryEntries, setDiaryEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchDiaryEntries = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('diary_entries')
        .select('*')
        .eq('user_id', user.id)
        .order('entry_date', { ascending: false });

      if (error) throw error;
      setDiaryEntries(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createDiaryEntry = async (entry: Omit<DiaryEntryInsert, 'user_id'>) => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data, error } = await supabase
        .from('diary_entries')
        .insert([{ ...entry, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      setDiaryEntries(prev => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const updateDiaryEntry = async (id: string, updates: DiaryEntryUpdate) => {
    try {
      const { data, error } = await supabase
        .from('diary_entries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setDiaryEntries(prev => 
        prev.map(entry => entry.id === id ? data : entry)
      );
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const deleteDiaryEntry = async (id: string) => {
    try {
      const { error } = await supabase
        .from('diary_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setDiaryEntries(prev => prev.filter(entry => entry.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err;
    }
  };

  const getDiaryEntriesForDate = (date: Date): DiaryEntry[] => {
    const dateString = date.toISOString().split('T')[0];
    return diaryEntries.filter(entry => entry.entry_date === dateString);
  };

  const getDiaryEntryById = (id: string): DiaryEntry | undefined => {
    return diaryEntries.find(entry => entry.id === id);
  };

  useEffect(() => {
    fetchDiaryEntries();
  }, [user]);

  return {
    diaryEntries,
    loading,
    error,
    createDiaryEntry,
    updateDiaryEntry,
    deleteDiaryEntry,
    getDiaryEntriesForDate,
    getDiaryEntryById,
    refetch: fetchDiaryEntries
  };
};
