import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_CATEGORIES, fetchCategories, getCategories, resolveCategoryBgColor, type Category } from "@/lib/categories";
import { Habit } from "@/hooks/useHabits";
import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Trash } from "lucide-react";

interface InlineEditDropdownProps {
  habit: Habit;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedHabit: Partial<Habit>) => void;
  onDelete: (id: string) => void;
  position?: { top: number; left: number };
  anchorRect?: DOMRect | null;
  onAdopt?: (id: string) => void;
}

export const InlineEditDropdown = ({
  habit,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  position,
  anchorRect,
  onAdopt
}: InlineEditDropdownProps) => {
  const [isLocallyOpen, setIsLocallyOpen] = useState(isOpen);
  
  // Sync local state with prop
  useEffect(() => {
    setIsLocallyOpen(isOpen);
  }, [isOpen]);
  
  const [editedHabit, setEditedHabit] = useState({
    title: habit.title,
    notes: habit.notes || '',
    category: habit.category,
    target_frequency: habit.target_frequency,
    leniency_threshold: habit.leniency_threshold
  });

  const dropdownRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const [categories, setCategories] = useState<Category[]>(getCategories());
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  
  // Frequency editing state
  const [frequencyType, setFrequencyType] = useState<'daily' | 'weekly' | 'custom'>('daily');
  const [frequencyValue, setFrequencyValue] = useState(1);
  const [customDays, setCustomDays] = useState<boolean[]>([false, false, false, false, false, false, false]);

  useEffect(() => {
    const load = async () => {
      setLoadingCategories(true);
      try {
        const { data: { user } } = await import('@/integrations/supabase/client').then(m => m.supabase.auth.getUser());
        const uid = user?.id as string | undefined;
        const cats = uid ? await fetchCategories(uid) : [];
        setCategories(cats);
      } finally {
        setLoadingCategories(false);
      }
    };
    load();
  }, []);

  // Initialize frequency state based on existing habit
  useEffect(() => {
    const freq = habit.target_frequency;
    if (freq === 7) {
      setFrequencyType('daily');
      setFrequencyValue(1);
    } else if (freq >= 1 && freq <= 6) {
      setFrequencyType('weekly');
      setFrequencyValue(freq);
    } else {
      setFrequencyType('custom');
      setFrequencyValue(1);
    }
  }, [habit.target_frequency]);

  // Compute optimal placement relative to the anchor
  useLayoutEffect(() => {
    if (!isOpen) {
      setCoords(null);
      return;
    }

    // Defer calculation to next frame to ensure dimensions are available
    const rAF = requestAnimationFrame(() => {
      const dropdownEl = dropdownRef.current;
      if (!dropdownEl) return;

      const dropdownBox = dropdownEl.getBoundingClientRect();
      const anchor = anchorRect || (position
        ? ({
            top: position.top,
            bottom: position.top,
            left: position.left,
            right: position.left,
            width: 0,
            height: 0,
          } as unknown as DOMRect)
        : null);

      if (!anchor) return;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const spaceBelow = viewportHeight - anchor.bottom;
      const spaceAbove = anchor.top;
      const verticalGap = 4;
      const horizontalPadding = 8;

      const placeBelow = spaceBelow >= dropdownBox.height + verticalGap || spaceBelow >= spaceAbove;
      const top = placeBelow
        ? Math.min(anchor.bottom + verticalGap, viewportHeight - dropdownBox.height - horizontalPadding)
        : Math.max(horizontalPadding, anchor.top - dropdownBox.height - verticalGap);

      let left = anchor.left;
      if (left + dropdownBox.width > viewportWidth - horizontalPadding) {
        left = Math.max(horizontalPadding, viewportWidth - dropdownBox.width - horizontalPadding);
      }

      setCoords({ top, left });
    });

    return () => cancelAnimationFrame(rAF);
  }, [isOpen, anchorRect, position]);

  // Close dropdown when clicking outside - handled by backdrop

  const handleSave = () => {
    try {
      onUpdate({ id: habit.id, ...editedHabit });
    } catch (error) {
      console.error('Error updating habit:', error);
    } finally {
      setIsLocallyOpen(false);
      onClose();
    }
  };

  const handleDelete = () => {
    onDelete(habit.id);
    setIsLocallyOpen(false);
    onClose();
  };

  if (!isLocallyOpen) return null;

  return createPortal(
    <>
      {/* Backdrop to capture outside clicks */}
      <div 
        className="fixed inset-0 z-[45] bg-transparent" 
        onClick={(e) => {
          // Don't close if Select is open
          if (isSelectOpen) {
            return;
          }
          setIsLocallyOpen(false);
          onClose();
        }} 
      />

      <div
        ref={dropdownRef}
        className="fixed z-50 bg-white border border-neutral-200 rounded-lg shadow-xl p-4 min-w-80 max-w-md"
        style={{
          top: `${(coords?.top ?? -9999) as number}px`,
          left: `${(coords?.left ?? -9999) as number}px`,
          visibility: coords ? 'visible' : 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">{editedHabit.title}</h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <label className="text-xs font-medium">Habit Title</label>
              <Input
                placeholder="Morning Exercise..."
                value={editedHabit.title}
                onChange={(e) => setEditedHabit({ ...editedHabit, title: e.target.value })}
              />
            </div>

          </div>

        <div>
          <label className="text-xs font-medium">Notes</label>
          <Textarea
            placeholder="Add details about your habit..."
            value={editedHabit.notes}
            onChange={(e) => setEditedHabit({...editedHabit, notes: e.target.value})}
          />
        </div>

        <div>
          <label className="text-xs font-medium">Category</label>
          <Select 
            value={editedHabit.category} 
            onValueChange={(value) => setEditedHabit({...editedHabit, category: value})}
            onOpenChange={setIsSelectOpen}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.length === 0 ? (
                <div className="px-2 py-1 text-xs text-muted-foreground">No categories. Create one in Category Manager.</div>
              ) : (
                categories.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      {category.id === 'none' ? (
                        <div className="w-3 h-3 rounded-full border border-neutral-300 bg-transparent" />
                      ) : (
                        <div
                          className="w-3 h-3 rounded-full border"
                          style={{ backgroundColor: category.color || resolveCategoryBgColor(category.id), borderColor: category.color || resolveCategoryBgColor(category.id) }}
                        />
                      )}
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-xs font-medium">Target Frequency</label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={frequencyType === 'daily' ? 'outlinefilled' : 'outlineinactive'}
              size="sm"
              onClick={() => {
                setFrequencyType('daily');
                setFrequencyValue(1);
                setCustomDays([false, false, false, false, false, false, false]);
                setEditedHabit({...editedHabit, target_frequency: 7});
              }}
              className={`flex-1`}
            >
              {frequencyType === 'daily' ? (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={frequencyValue}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setFrequencyValue(val);
                      setEditedHabit({...editedHabit, target_frequency: val * 7});
                    }}
                    className="rounded-full px-2 py-1 text-center text-xs bg-neutral-200 border-none outline-none text-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span>/day</span>
                </div>
              ) : (
                'Daily'
              )}
            </Button>
            <Button
              type="button"
              variant={frequencyType === 'weekly' ? 'outlinefilled' : 'outlineinactive'}
              size="sm"
              onClick={() => {
                setFrequencyType('weekly');
                setFrequencyValue(1);
                setCustomDays([false, false, false, false, false, false, false]);
                setEditedHabit({...editedHabit, target_frequency: 1});
              }}
              className={`flex-1`}
            >
              {frequencyType === 'weekly' ? (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={frequencyValue}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      setFrequencyValue(val);
                      setEditedHabit({...editedHabit, target_frequency: val});
                    }}
                    className="rounded-full px-2 py-1 text-center text-xs bg-neutral-200 border-none outline-none text-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <span>/ week</span>
                </div>
              ) : (
                'Weekly'
              )}
            </Button>
            <Button
              type="button"
              variant={frequencyType === 'custom' ? 'outlinefilled' : 'outlineinactive'}
              size="sm"
              onClick={() => {
                setFrequencyType('custom');
                setFrequencyValue(1);
                setCustomDays([false, false, false, false, false, false, false]);
              }}
              className={`flex-1`}
            >
              Custom Days
            </Button>
          </div>
        </div>

        {/* Custom Days Selector */}
        {frequencyType === 'custom' && (
          <div>
            <label className="text-xs font-medium">Select days of the week</label>
            <div className="flex gap-2 mt-2">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                <Button
                  key={index}
                  type="button"
                  variant={customDays[index] ? 'outlinefilled' : 'outlineinactive'}
                  size="sm"
                  onClick={() => {
                    const newCustomDays = [...customDays];
                    newCustomDays[index] = !newCustomDays[index];
                    setCustomDays(newCustomDays);
                    // Calculate target_frequency based on selected days
                    const selectedCount = newCustomDays.filter(Boolean).length;
                    setEditedHabit({...editedHabit, target_frequency: selectedCount});
                  }}
                  className="w-8 h-8 p-0 text-xs"
                >
                  {day}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium">Leniency Threshold (days)</label>
            <Input
              type="number"
              min="1"
              max="5"
              value={editedHabit.leniency_threshold}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                setEditedHabit({...editedHabit, leniency_threshold: val});
              }}
              className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>

        {/* Settings Section */}
        <div className="border-t pt-4">
          <h4 className="text-xs font-medium text-muted-foreground mb-3">Settings</h4>
          <div className="flex gap-2">
            {habit.phase === 'current' && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  onAdopt?.(habit.id);
                  onClose();
                }}
              >
                Adopt
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="flex-1"
            >
              <Trash className="h-3 w-3 mr-1" />
              Delete
            </Button>
          </div>
        </div>

        <div className="flex w-full justify-end gap-2">
            {/* <Button 
              variant="destructive" 
              size="sm"
              onClick={handleDelete}
              className="flex-1"
            >
              Delete
            </Button> */}
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => {
                setIsLocallyOpen(false);
                onClose();
              }}>
                Cancel
              </Button>
              <Button size="sm" onClick={handleSave}>
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};
