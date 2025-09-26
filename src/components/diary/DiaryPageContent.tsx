import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Plus, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDiaryEntries } from '@/hooks/useDiaryEntries';
import { DiaryEntryCard } from './DiaryEntryCard';
import type { Database } from '@/integrations/supabase/types';

type DiaryEntry = Database['public']['Tables']['diary_entries']['Row'];

export const DiaryPageContent: React.FC = () => {
  const { diaryEntries, loading, updateDiaryEntry, deleteDiaryEntry } = useDiaryEntries();
  const navigate = useNavigate();
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);

  const handleDeleteEntry = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this diary entry?')) {
      try {
        await deleteDiaryEntry(id);
      } catch (error) {
        console.error('Error deleting diary entry:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading diary entries...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-xl md:max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Back to Habits
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Diary</h1>
            <p className="text-muted-foreground">Record your thoughts and experiences</p>
          </div>
        </div>
        <Button onClick={() => navigate('/diary/edit/new')}>
          <Plus className="h-4 w-4 mr-2" />
          New Entry
        </Button>
      </div>

      {diaryEntries.length === 0 ? (
        <Card className="p-8 text-center">
          <CardContent>
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No diary entries yet</h3>
            <p className="text-muted-foreground mb-4">
              Start documenting your thoughts and experiences by creating your first diary entry.
            </p>
            <Button onClick={() => navigate('/diary/edit/new')}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Entry
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {diaryEntries.map((entry) => (
            <DiaryEntryCard
              key={entry.id}
              entry={entry}
              onEdit={setEditingEntry}
              onDelete={handleDeleteEntry}
            />
          ))}
        </div>
      )}

    </div>
  );
};
