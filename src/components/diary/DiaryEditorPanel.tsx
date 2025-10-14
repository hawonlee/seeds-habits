import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDebounceFn } from 'ahooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { CalendarIcon, Loader2, CheckCircle2, AlertTriangle, X, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { fetchCategories, getCategories, FALLBACK_CATEGORIES, resolveCategoryBgColor, type Category } from '@/lib/categories';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type DiaryEntry = Database['public']['Tables']['diary_entries']['Row'];

interface DiaryEditorPanelProps {
  entry: DiaryEntry;
  onClose: () => void;
  onSave: (data: { title: string; body: string; category: string; entry_date: string }) => Promise<void> | void;
  onDelete?: (id: string) => void;
}

export const DiaryEditorPanel: React.FC<DiaryEditorPanelProps> = ({ entry, onClose, onSave, onDelete }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState(entry.title);
  const [body, setBody] = useState(entry.body);
  const [category, setCategory] = useState(entry.category);
  const [entryDate, setEntryDate] = useState<Date | undefined>(new Date(entry.entry_date + 'T00:00:00'));
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>(getCategories());
  const [loadingCategories, setLoadingCategories] = useState(false);
  const contentEditableRef = useRef<HTMLDivElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const isMountedRef = useRef(true);
  const [hasUserTyped, setHasUserTyped] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

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

  useEffect(() => {
    const raf = requestAnimationFrame(() => setIsVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const populateEntry = useCallback(() => {
    const safeBody = entry.body ?? '';
    setTitle(entry.title);
    setBody(safeBody);
    setCategory(entry.category);
    setEntryDate(new Date(entry.entry_date + 'T00:00:00'));
    setSaveError(null);
    setLastSavedAt(null);
    setHasUserTyped(false);
    if (contentEditableRef.current) {
      const element = contentEditableRef.current;
      element.innerHTML = safeBody.replace(/\n/g, '<br>');
      // Only move cursor to body for existing entries; for new entries keep focus on title
      if (entry.id !== 'new') {
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
    }
  }, [entry.body, entry.category, entry.entry_date, entry.title]);

  useEffect(() => {
    populateEntry();
  }, [entry.id, populateEntry]);

  // When creating a brand new entry, focus the title input initially
  useEffect(() => {
    if (entry.id === 'new') {
      requestAnimationFrame(() => {
        titleInputRef.current?.focus();
      });
    }
  }, [entry.id]);

  const performSave = useCallback(async () => {
    if (!entryDate || !title.trim() || !hasUserTyped) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    const dateString = `${entryDate.getFullYear()}-${String(entryDate.getMonth() + 1).padStart(2, '0')}-${String(entryDate.getDate()).padStart(2, '0')}`;
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
  }, [entryDate, title, body, category, onSave, hasUserTyped]);

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
    const newBody = e.currentTarget.innerHTML || '';
    setBody(newBody.replace(/<br\s*\/?>(?=\n|$)/gi, '\n').replace(/<div>/gi, '\n').replace(/<\/div>/gi, ''));
    setHasUserTyped(true);
    triggerAutosave();
  };

  const handleBlurSave = () => {
    triggerAutosave({ immediate: true });
  };

  const saveWithSpecificDate = useCallback(async (pickedDate: Date) => {
    if (!pickedDate || !title.trim()) return;

    setIsSaving(true);
    setSaveError(null);

    const dateString = `${pickedDate.getFullYear()}-${String(pickedDate.getMonth() + 1).padStart(2, '0')}-${String(pickedDate.getDate()).padStart(2, '0')}`;
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
      console.error('Error saving diary entry (date pick):', error);
      if (isMountedRef.current) {
        setSaveError('Failed to save changes. We will keep retrying.');
      }
    } finally {
      if (isMountedRef.current) {
        setIsSaving(false);
      }
    }
  }, [title, body, category, onSave]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <div className={cn(
      "w-full h-full rounded-lg bg-habitbg p-4 transform transition-all duration-200 ease-out",
      isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2"
    )}>
      <div className="relative flex items-center justify-between">
        {onDelete && (
          <Button
            variant="text"
            size="text"
            onClick={() => onDelete(entry.id)}
            className="absolute top-0 right-8"
            title="Delete entry"
            aria-label="Delete entry"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
        <Button variant="text" size="text" onClick={handleClose} className="absolute top-0 right-0" title="Close editor" aria-label="Close editor">
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Input
              id="title"
            ref={titleInputRef}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setHasUserTyped(true);
                triggerAutosave();
              }}
              placeholder="Enter diary entry title"
              className="text-2xl bg-transparent font-semibold border-none shadow-none p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              required
            />

            <div className="flex items-end gap-2 text-xs text-muted-foreground w-48 justify-end mt-5">
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
                </span>
              ) : (
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

          <div className="flex items-center gap-2 mb-8">
            {/* <Select
              value={category}
              onValueChange={(value) => {
                setCategory(value);
                setHasUserTyped(true);
                triggerAutosave();
              }}
            >
              <SelectTrigger className="w-auto border-none shadow-none p-0 focus:ring-0 focus:ring-offset-0">
                <SelectValue>
                  <Badge
                    className="px-3 py-1 capitalize"
                    style={category === 'none' ? {} : {
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
            </Select> */}

            <div className="space-y-2">
              <Popover
                modal
                open={isCalendarOpen}
                onOpenChange={(open) => {
                  setIsCalendarOpen(open);
                }}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="text"
                    size="text"
                    className={cn(
                      "justify-start text-left font-normal",
                      !entryDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="h-4 w-4" />
                    {entryDate ? format(entryDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={entryDate}
                    onSelect={(date) => {
                      if (date) {
                        setEntryDate(date);
                        setHasUserTyped(true);
                        cancelDebounce();
                        void saveWithSpecificDate(date);
                      }
                      setIsCalendarOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="relative">
            <div
              key={entry.id}
              ref={contentEditableRef}
              className="min-h-[300px] focus:outline-none text-sm"
              contentEditable
              suppressContentEditableWarning
              onInput={handleInput}
              onBlur={handleBlurSave}
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
    </div>
  );
};

export default DiaryEditorPanel;


