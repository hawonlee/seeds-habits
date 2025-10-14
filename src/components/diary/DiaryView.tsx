import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Calendar, Edit, Trash2, Plus, CalendarIcon, Loader2 } from 'lucide-react';
import { useDiaryEntries } from '@/hooks/useDiaryEntries';
import { useAuth } from '@/hooks/useAuth';
import { fetchCategories, getCategories, FALLBACK_CATEGORIES, resolveCategoryBgColor, type Category } from '@/lib/categories';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DiaryEntryCard } from './DiaryEntryCard';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { DiaryEditorPanel } from './DiaryEditorPanel';
import type { Database } from '@/integrations/supabase/types';

type DiaryEntry = Database['public']['Tables']['diary_entries']['Row'];

interface DiaryEntryFormProps {
  entry?: DiaryEntry;
  onSave: (data: { title: string; body: string; category: string; entry_date: string }) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const DiaryEntryForm: React.FC<DiaryEntryFormProps> = ({ entry, onSave, onCancel, isLoading }) => {
  const [title, setTitle] = useState(entry?.title || '');
  const [body, setBody] = useState(entry?.body || '');
  const [category, setCategory] = useState(entry?.category || 'none');
  const [entryDate, setEntryDate] = useState<Date | undefined>(
    entry?.entry_date ? new Date(entry.entry_date) : new Date()
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>(getCategories());
  const [loadingCategories, setLoadingCategories] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      setLoadingCategories(true);
      try {
        if (!user?.id) {
          setCategories(FALLBACK_CATEGORIES);
          return;
        }
        const cats = await fetchCategories(user.id);
        setCategories(cats && cats.length ? cats : FALLBACK_CATEGORIES);
      } finally {
        setLoadingCategories(false);
      }
    };
    load();
  }, [user?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim() || !entryDate) return;
    
    const dateString = entryDate.toISOString().split('T')[0];
    onSave({ title: title.trim(), body: body.trim(), category, entry_date: dateString });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What's on your mind?"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger>
            <SelectValue placeholder="Select a category" />
          </SelectTrigger>
          <SelectContent>
            {categories.length === 0 ? (
              <div className="px-2 py-1 text-xs text-muted-foreground">No categories. Create one in Category Manager.</div>
            ) : (
              categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>
                  <div className="flex items-center gap-2">
                    {cat.id === 'none' ? (
                      <div className="w-3 h-3 rounded-full border border-neutral-300 bg-transparent" />
                    ) : (
                      <div
                        className="w-3 h-3 rounded-full border"
                        style={{ backgroundColor: resolveCategoryBgColor(cat.id), borderColor: resolveCategoryBgColor(cat.id) }}
                      />
                    )}
                    <span>{cat.name}</span>
                  </div>
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="entry_date">Date</Label>
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !entryDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {entryDate ? format(entryDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={entryDate}
              onSelect={(date) => {
                setEntryDate(date);
                setIsCalendarOpen(false);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-2">
        <Label htmlFor="body">Entry</Label>
        <Textarea
          id="body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your thoughts here..."
          rows={8}
          required
        />
      </div>

      <div className="flex gap-2 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading || !title.trim() || !body.trim() || !entryDate}>
          {isLoading ? 'Saving...' : entry ? 'Update Entry' : 'Create Entry'}
        </Button>
      </div>
    </form>
  );
};

export const DiaryView: React.FC = () => {
  const navigate = useNavigate();
  const { diaryEntries, loading, deleteDiaryEntry, updateDiaryEntry, createDiaryEntry } = useDiaryEntries();
  const [deletingEntry, setDeletingEntry] = useState<DiaryEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);

  const getMostRecentEntry = (entries: DiaryEntry[]): DiaryEntry | null => {
    if (!entries || entries.length === 0) return null;
    const sorted = [...entries].sort((a, b) => {
      const aDate = new Date(`${a.entry_date}T00:00:00`).getTime();
      const bDate = new Date(`${b.entry_date}T00:00:00`).getTime();
      if (bDate !== aDate) return bDate - aDate;
      // Tie-breaker: updated_at
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
    return sorted[0] || null;
  };

  const blankEntry: DiaryEntry = useMemo(() => ({
    id: 'new',
    title: '',
    body: '',
    category: 'none',
    entry_date: new Date().toISOString().split('T')[0],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    user_id: ''
  }), []);

  // Placeholder card entry for a new (unsaved) editor session
  const placeholderCardEntry: DiaryEntry | null = useMemo(() => {
    if (editingEntry && editingEntry.id === 'new') {
      return {
        ...editingEntry,
        title: 'New Diary Entry'
      };
    }
    return null;
  }, [editingEntry]);

  const entriesForList: DiaryEntry[] = useMemo(() => {
    return placeholderCardEntry ? [placeholderCardEntry, ...diaryEntries] : diaryEntries;
  }, [placeholderCardEntry, diaryEntries]);

  const handleCreateNewEntry = () => {
    setEditingEntry(blankEntry);
  };

  const handleEditEntry = (entry: DiaryEntry) => {
    setEditingEntry(entry);
  };

  const handleDeleteClick = (entry: DiaryEntry) => {
    setDeletingEntry(entry);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingEntry) return;
    
    setIsDeleting(true);
    try {
      await deleteDiaryEntry(deletingEntry.id);
      // If the currently edited entry was deleted, switch to most recent remaining entry
      if (editingEntry && editingEntry.id === deletingEntry.id) {
        const remaining = diaryEntries.filter(e => e.id !== deletingEntry.id);
        if (remaining.length === 0) {
          // Close the editor when no entries remain
          setEditingEntry(null);
        } else {
          const next = getMostRecentEntry(remaining);
          setEditingEntry(next);
        }
      }
      setDeletingEntry(null);
    } catch (error) {
      console.error('Error deleting diary entry:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeletingEntry(null);
  };

  // Safety: if entries update and the currently edited entry no longer exists, switch to most recent
  useEffect(() => {
    // Do not override when creating a brand new entry (id === 'new')
    if (editingEntry && editingEntry.id !== 'new' && !diaryEntries.find(e => e.id === editingEntry.id)) {
      const next = getMostRecentEntry(diaryEntries);
      setEditingEntry(next);
    }
  }, [diaryEntries, editingEntry]);

  return (
    <div className="">
      <div className="flex items-center justify-between mb-4 h-10">
        <div>
          <h1 className="text-sm font-medium">Diary</h1>
        </div>
        <Button variant="ghost" size="smallicon" onClick={handleCreateNewEntry}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        editingEntry ? (
          <div className="flex w-full overflow-x-hidden">
            <div className="flex-1 min-w-0 pr-4">
              {entriesForList.length === 0 ? (
                <Card className="p-8 text-center">
                  <CardContent>
                    <h3 className="text-sm font-semibold mb-10">No diary entries yet</h3>
                    <Button variant="default" onClick={handleCreateNewEntry}>
                      Create First Entry
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4 auto-rows-min">
                {entriesForList.map((entry) => (
                    <DiaryEntryCard
                      key={entry.id}
                      entry={entry}
                      isActive={editingEntry?.id === entry.id}
                      onEdit={handleEditEntry}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="w-4/5 flex-none">
              <DiaryEditorPanel
                entry={editingEntry}
                onClose={() => setEditingEntry(null)}
                onSave={async (data) => {
                  if (editingEntry.id === 'new') {
                    const created = await createDiaryEntry(data);
                    setEditingEntry(created);
                  } else {
                    await updateDiaryEntry(editingEntry.id, data);
                  }
                }}
                onDelete={(id) => {
                  const entryToDelete = diaryEntries.find(e => e.id === id);
                  if (entryToDelete) {
                    handleDeleteClick(entryToDelete);
                  }
                }}
              />
            </div>
          </div>
        ) : (
          <div>
            {entriesForList.length === 0 ? (
              <Card className="p-8 text-center">
                <CardContent>
                  <h3 className="text-sm font-semibold mb-10">No diary entries yet</h3>
                  <Button variant="default" onClick={handleCreateNewEntry}>
                    Create First Entry
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-3 gap-4 auto-rows-min">
                {entriesForList.map((entry) => (
                  <DiaryEntryCard
                    key={entry.id}
                    entry={entry}
                    isActive={editingEntry?.id === entry.id}
                    onEdit={handleEditEntry}
                  />
                ))}
              </div>
            )}
          </div>
        )
      )}

      <DeleteConfirmationModal
        isOpen={deletingEntry !== null}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title={deletingEntry?.title || ''}
        isLoading={isDeleting}
      />
    </div>
  );
};
