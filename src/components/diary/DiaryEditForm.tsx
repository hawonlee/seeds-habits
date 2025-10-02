import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDebounceFn } from 'ahooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { CalendarIcon, Loader2, CheckCircle2, AlertTriangle, House } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { useDiaryEntries } from '@/hooks/useDiaryEntries';
import { fetchCategories, getCategories, FALLBACK_CATEGORIES, resolveCategoryBgColor, type Category } from '@/lib/categories';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { DiarySidebar } from './DiarySidebar';

type DiaryEntry = Database['public']['Tables']['diary_entries']['Row'];

interface DiaryEditFormProps {
  entry: DiaryEntry;
  diaryEntries: DiaryEntry[];
  onSave: (data: { title: string; body: string; category: string; entry_date: string }) => Promise<void> | void;
  onCancel: () => void;
  onNavigateToEntry?: (entryId: string) => void;
  onCreateNewEntry?: () => void;
  onNavigateHome?: () => void;
}

export const DiaryEditForm: React.FC<DiaryEditFormProps> = ({
  entry,
  diaryEntries,
  onSave,
  onCancel,
  onNavigateToEntry,
  onCreateNewEntry,
  onNavigateHome
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState(entry.title);
  const [body, setBody] = useState(entry.body);
  const [category, setCategory] = useState(entry.category);
  const [entryDate, setEntryDate] = useState<Date | undefined>(new Date(entry.entry_date));
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>(getCategories());
  const [loadingCategories, setLoadingCategories] = useState(false);
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    const load = async () => {
      setLoadingCategories(true);
      try {
        if (!user?.id) {
          setCategories(FALLBACK_CATEGORIES);
          return;
        }
        const cats = await fetchCategories(user.id);
        setCategories(cats);
      } catch (error) {
        console.error('Error loading categories:', error);
        setCategories(FALLBACK_CATEGORIES);
      } finally {
        setLoadingCategories(false);
      }
    };

    load();
  }, [user?.id]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const populateEntry = useCallback(() => {
    setTitle(entry.title);
    setBody(entry.body);
    setCategory(entry.category);
    setEntryDate(new Date(entry.entry_date));
    setSaveError(null);
    setLastSavedAt(null);
    if (contentEditableRef.current) {
      const element = contentEditableRef.current;
      element.textContent = entry.body ?? '';
      requestAnimationFrame(() => {
        const selection = window.getSelection();
        if (!selection) return;
        const range = document.createRange();
        range.selectNodeContents(element);
        range.collapse(false);
        selection.removeAllRanges();
        selection.addRange(range);
      });
    }
  }, [entry.body, entry.category, entry.entry_date, entry.title]);

  useEffect(() => {
    populateEntry();
  }, [entry.id, populateEntry]);

  // Focus title input when component mounts or entry changes
  useEffect(() => {
    // Use setTimeout to ensure the focus happens after any other focus events
    const focusTitle = () => {
      if (titleInputRef.current) {
        titleInputRef.current.focus();
      }
    };
    
    const timeoutId = setTimeout(focusTitle, 0);
    return () => clearTimeout(timeoutId);
  }, [entry.id]);

  const performSave = useCallback(async () => {
    if (!entryDate || !title.trim()) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    const dateString = entryDate.toISOString().split('T')[0];
    try {
      await onSave({
        title: title.trim(),
        body: body.trim(),
        category,
        entry_date: dateString,
      });

      if (isMountedRef.current) {
        setLastSavedAt(new Date());
      }
    } catch (error) {
      console.error('Error autosaving diary entry:', error);
      if (isMountedRef.current) {
        setSaveError('Failed to save changes. We will keep retrying.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [entryDate, title, body, category, onSave]);

  const { run: debouncedSave, flush: flushDebounce, cancel: cancelDebounce } = useDebounceFn(performSave, {
    wait: 600,
    leading: true,
    trailing: true,
  });

  const triggerAutosave = useCallback(
    (options: { immediate?: boolean } = {}) => {
      setSaveError(null);
      if (options.immediate) {
        cancelDebounce();
        void performSave();
      } else {
        debouncedSave();
      }
    },
    [debouncedSave, cancelDebounce, performSave]
  );

  useEffect(() => {
    return () => {
      flushDebounce();
      cancelDebounce();
    };
  }, [flushDebounce, cancelDebounce]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newBody = e.currentTarget.textContent || '';
    setBody(newBody);
    triggerAutosave();
  };

  const handleBlurSave = () => {
    triggerAutosave({ immediate: true });
  };

  return (
    <SidebarProvider className="">
      <DiarySidebar
        diaryEntries={diaryEntries}
        currentEntryId={entry.id}
        onNavigateToEntry={onNavigateToEntry}
        onCreateNewEntry={onCreateNewEntry}
        onNavigateHome={onNavigateHome}
      />

      <SidebarInset className="transition-all duration-100 ease-in-out">
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger />
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="flex items-center gap-2"
          >
            <House className="h-4 w-4" />
          </Button>
        </header>
        
        <div className="flex-1 p-6 overflow-y-auto transition-all duration-150 ease-in-out bg-background">

          {/* Note Title and Save Status */}
          <div className="max-w-2xl mx-auto">

            <div className="flex items-center justify-between">
              <Input
                ref={titleInputRef}
                id="title"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  triggerAutosave();
                }}
                placeholder="Enter diary entry title"
                className="text-2xl font-semibold border-none shadow-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                tabIndex={1}
                required
              />

               {/* Save Status */}
               <div className="flex items-center gap-2 text-xs text-muted-foreground w-48 justify-end">
                 {isSaving ? (
                   <span className="inline-flex items-center gap-1 text-primary">
                     <Loader2 className="h-3 w-3 animate-spin" />
                     Saving…
                   </span>
                 ) : saveError ? (
                   <span className="inline-flex items-center gap-1 text-destructive">
                     <AlertTriangle className="h-3 w-3" />
                     {saveError}
                   </span>
                 ) : lastSavedAt ? (
                   <span className="inline-flex items-center gap-1 text-foreground">
                     <CheckCircle2 className="h-3 w-3" />
                     Saved 
                     {/* {formatDistanceToNow(lastSavedAt, { addSuffix: true })} */}
                   </span>
                 ) : (
                  //  <span>Start typing to save</span>
                  <span></span>
                 )}
                 {saveError && (
                   <Button
                     type="button"
                     variant="ghost"
                     size="sm"
                     className="h-7 px-2"
                     onClick={() => {
                       setSaveError(null);
                       triggerAutosave();
                     }}
                   >
                     Retry now
                   </Button>
                 )}
               </div>
            </div>

            {/* Note Details */}
            <div className="flex items-center gap-2 mb-8">
              <Select
                value={category}
                onValueChange={(value) => {
                  setCategory(value);
                  triggerAutosave();
                }}
              >
                <SelectTrigger className="w-auto border-none shadow-none p-0 focus:ring-0 focus:ring-offset-0">
                  <SelectValue>
                    <Badge
                      className="px-3 py-1 capitalize"
                      style={category === 'none' ? {
                        backgroundColor: 'transparent',
                        color: '#000'
                      } : {
                        backgroundColor: resolveCategoryBgColor(category),
                        color: '#000'
                      }}
                    >
                      {categories.find((cat) => cat.id === category)?.name ?? 'Uncategorized'}
                    </Badge>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full border"
                          style={{
                            backgroundColor: cat.id === 'none' ? 'transparent' : resolveCategoryBgColor(cat.id),
                            borderColor: cat.id === 'none' ? '#d1d5db' : resolveCategoryBgColor(cat.id)
                          }}
                        />
                        {cat.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="space-y-2">
                <Popover
                  open={isCalendarOpen}
                  onOpenChange={(open) => {
                    setIsCalendarOpen(open);
                    if (!open) {
                      flushDebounce();
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        "justify-start text-left font-normal",
                        !entryDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-1 h-4 w-4" />
                      {entryDate ? format(entryDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={entryDate}
                      onSelect={(date) => {
                        setEntryDate(date ?? undefined);
                        triggerAutosave();
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Note Body */}
            <div className="relative">
              <div
                ref={contentEditableRef}
                className="min-h-[300px] focus:outline-none text-sm"
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                onBlur={handleBlurSave}
                tabIndex={2}
                style={{ whiteSpace: 'pre-wrap' }}
              />
              {!body && (
                <div className="absolute top-0 left-1 text-muted-foreground text-sm pointer-events-none ">
                  Write your diary entry...
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};
