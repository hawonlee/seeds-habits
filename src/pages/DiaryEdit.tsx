import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDiaryEntries } from '@/hooks/useDiaryEntries';
import { DiaryEditForm } from '@/components/diary/DiaryEditForm';
import type { Database } from '@/integrations/supabase/types';

type DiaryEntry = Database['public']['Tables']['diary_entries']['Row'];

export const DiaryEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { diaryEntries, updateDiaryEntry, createDiaryEntry } = useDiaryEntries();
  
  const [loading, setLoading] = useState(true);
  const [isNewEntry, setIsNewEntry] = useState(false);

  // Find the diary entry or check if it's a new entry
  const entry = id === 'new' ? null : diaryEntries.find(e => e.id === id);

  useEffect(() => {
    if (id === 'new') {
      setIsNewEntry(true);
      setLoading(false);
    } else if (entry) {
      setIsNewEntry(false);
      setLoading(false);
    } else if (diaryEntries.length > 0) {
      // Entry not found
      navigate('/diary');
    }
  }, [entry, diaryEntries, navigate, id]);

  const handleSave = async (data: { title: string; body: string; category: string; entry_date: string }) => {
    try {
      if (isNewEntry) {
        const newEntry = await createDiaryEntry(data);
        navigate(`/diary/edit/${newEntry.id}`);
      } else if (entry) {
        await updateDiaryEntry(entry.id, data);
      }
    } catch (error) {
      console.error('Error saving diary entry:', error);
      throw error;
    }
  };

  const handleCancel = () => {
    navigate('/diary');
  };

  const handleNavigateToEntry = (entryId: string) => {
    navigate(`/diary/edit/${entryId}`);
  };

  const handleCreateNewEntry = () => {
    navigate('/diary/edit/new');
  };

  const handleNavigateHome = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isNewEntry && !entry) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Diary entry not found</div>
      </div>
    );
  }

  // Create a blank entry for new entries
  const blankEntry: DiaryEntry = {
    id: 'new',
    title: '',
    body: '',
    category: 'none',
    entry_date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: ''
  };

  const currentEntry = isNewEntry ? blankEntry : entry!;

  return (
    <DiaryEditForm
      entry={currentEntry}
      onSave={handleSave}
      onCancel={handleCancel}
      onNavigateToEntry={handleNavigateToEntry}
      onCreateNewEntry={handleCreateNewEntry}
      onNavigateHome={handleNavigateHome}
    />
  );
};

export default DiaryEditPage;
