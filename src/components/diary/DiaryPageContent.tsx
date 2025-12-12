import React, { useMemo, useState, useEffect } from 'react';
import { formatDateLocal } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Plus, Home } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDiaryEntries } from '@/hooks/useDiaryEntries';
import { DiaryEntryCard } from './DiaryEntryCard';
import { DiaryEditorPanel } from './DiaryEditorPanel';
import type { Database } from '@/integrations/supabase/types';
import { format } from 'date-fns';

type DiaryEntry = Database['public']['Tables']['diary_entries']['Row'];

export const DiaryPageContent: React.FC = () => {
  const { diaryEntries, loading, updateDiaryEntry, deleteDiaryEntry, createDiaryEntry } = useDiaryEntries();
  const navigate = useNavigate();
  const location = useLocation();
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  
  const blankEntry: DiaryEntry = useMemo(() => ({
    id: 'new',
    title: '',
    body: '',
    category: 'none',
    entry_date: formatDateLocal(new Date()),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: ''
  }), []);

  const handleDeleteEntry = async (id: string) => {
    try {
      await deleteDiaryEntry(id);
    } catch (error) {
      console.error('Error deleting diary entry:', error);
    }
  };

  // If navigated with a diaryEntryId state (e.g., from calendar), open that entry in the panel
  useEffect(() => {
    const state = location.state as { diaryEntryId?: string } | null;
    if (state?.diaryEntryId) {
      const match = diaryEntries.find((entry) => entry.id === state.diaryEntryId);
      if (match) {
        setEditingEntry(match);
      }
    }
  }, [location.state, diaryEntries]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading diary entries...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
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
        <Button onClick={() => setEditingEntry(blankEntry)}>
          <Plus className="h-4 w-4 mr-2" />
          New Entry
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          {diaryEntries.length === 0 ? (
            <Card className="p-8 text-center">
              <CardContent>
                <h3 className="text-lg font-semibold mb-2">No diary entries yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start documenting your thoughts and experiences by creating your first diary entry.
                </p>
                <Button onClick={() => setEditingEntry(blankEntry)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Entry
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {(() => {
                const nodes: React.ReactNode[] = [];
                let currentMonthKey: string | null = null;

                for (const entry of diaryEntries) {
                  const entryDate = new Date(entry.entry_date);
                  const monthKey = format(entryDate, 'yyyy-MM');
                  if (monthKey !== currentMonthKey) {
                    currentMonthKey = monthKey;
                    nodes.push(
                      <div key={`divider-${monthKey}`} className="flex items-center gap-2 mt-6 mb-2">
                        <div className="text-xs text-muted-foreground font-bold whitespace-nowrap">
                          {format(entryDate, 'MMMM yyyy')}
                        </div>
                        <Separator className="flex-1" />
                      </div>
                    );
                  }
                  nodes.push(
                    <DiaryEntryCard
                      key={entry.id}
                      entry={entry}
                      onEdit={setEditingEntry}
                    />
                  );
                }

                return nodes;
              })()}
            </div>
          )}
        </div>
        <div className="min-h-[60vh]">
          {editingEntry ? (
            <DiaryEditorPanel
              entry={editingEntry}
              onClose={() => setEditingEntry(null)}
              onSave={async (data) => {
                if (editingEntry.id === 'new') {
                  await createDiaryEntry(data);
                  setEditingEntry(null);
                } else {
                  await updateDiaryEntry(editingEntry.id, data);
                }
              }}
            />
          ) : (
            <Card className="p-6 h-full flex items-center justify-center text-muted-foreground">
              <div>Select an entry to edit, or create a new one.</div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
