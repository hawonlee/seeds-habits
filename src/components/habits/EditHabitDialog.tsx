import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogClose, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useEffect, useState, useRef } from "react";
import { FALLBACK_CATEGORIES, fetchCategories, getCategories, getCategoryClasses, resolveCategoryBgColor, type Category } from "@/lib/categories";
import { createEmptyCustomDays } from "@/lib/frequency";
import type { HabitTargetUnit } from "@/hooks/useHabits";
import { useAuth } from "@/hooks/useAuth";
import { Trash, MoreHorizontal, Settings, CheckCircle, Clock } from "lucide-react";

type FrequencySelection = 'daily' | 'weekly' | 'custom';

interface EditHabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingHabit: any;
  newHabit: {
    title: string;
    notes: string;
    category: string;
    target_value: number;
    target_unit: HabitTargetUnit;
    custom_days?: number[];
    leniency_threshold: number;
  };
  setNewHabit: (habit: any) => void;
  onUpdateHabit: () => void;
  onDelete?: (id: string) => void;
  onAdopt?: (id: string) => void;
  onMoveToFuture?: (id: string) => void;
}

export const EditHabitDialog = ({
  open,
  onOpenChange,
  editingHabit,
  newHabit,
  setNewHabit,
  onUpdateHabit,
  onDelete,
  onAdopt,
  onMoveToFuture
}: EditHabitDialogProps) => {
  const [categories, setCategories] = useState<Category[]>(getCategories());
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const { user } = useAuth();

  // Frequency editing state
  const [frequencyValue, setFrequencyValue] = useState(1);
  const [frequencyPeriod, setFrequencyPeriod] = useState<FrequencySelection>('daily');
  const [customDays, setCustomDays] = useState<boolean[]>(createEmptyCustomDays());
  const [userHasChangedSelection, setUserHasChangedSelection] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

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

  // Initialize frequency state based on existing habit
  useEffect(() => {
    // Don't override user selections
    if (userHasChangedSelection) return;

    const customState = createEmptyCustomDays();
    const selectedDays = newHabit.custom_days || [];

    // For daily habits, ignore custom_days and always show as daily
    if (newHabit.target_unit === 'day') {
      setFrequencyPeriod('daily');
      setFrequencyValue(newHabit.target_value || 1);
      setCustomDays(customState);
      return;
    }

    // For weekly habits, check if custom_days is populated
    if (selectedDays.length) {
      selectedDays.forEach(day => {
        if (day >= 0 && day < customState.length) customState[day] = true;
      });
      setFrequencyPeriod('custom');
      setFrequencyValue(selectedDays.length);
      setCustomDays(customState);
      return;
    }

    // Default to weekly
    setFrequencyPeriod('weekly');
    setFrequencyValue(newHabit.target_value || 1);
    setCustomDays(customState);
  }, [newHabit.target_value, newHabit.target_unit, newHabit.custom_days, userHasChangedSelection]);

  useEffect(() => {
    if (!open) {
      // Reset form state when dialog closes
      setUserHasChangedSelection(false);
    } else {
      // Reset user selection flag when dialog opens
      setUserHasChangedSelection(false);
      // Prevent focus on the title input when dialog opens
      setTimeout(() => {
        if (titleInputRef.current) {
          titleInputRef.current.blur();
        }
      }, 0);
    }
  }, [open]);

  const handleDelete = () => {
    if (onDelete && editingHabit?.id) {
      onDelete(editingHabit.id);
      onOpenChange(false);
    }
  };

  const handleAdopt = async () => {
    if (onAdopt && editingHabit?.id) {
      await onAdopt(editingHabit.id);
      onOpenChange(false);
    }
  }; 

  const handleMoveToFuture = async () => {
    if (onMoveToFuture && editingHabit?.id) {
      await onMoveToFuture(editingHabit.id);
      onOpenChange(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent 
        onEscapeKeyDown={() => handleOpenChange(false)}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-sm font-medium">{newHabit.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div className="flex items-center gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium">Habit Name</label>
              <Input
                ref={titleInputRef}
                placeholder="Morning Exercise..."
                value={newHabit.title}
                onChange={(e) => setNewHabit({ ...newHabit, title: e.target.value })}
                autoFocus={false}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium">Notes</label>
            <Textarea
              placeholder="Add details about your habit..."
              value={newHabit.notes}
              onChange={(e) => setNewHabit({...newHabit, notes: e.target.value})}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium">Category</label>
            <Select 
              value={newHabit.category} 
              onValueChange={(value) => setNewHabit({...newHabit, category: value})}
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
                            style={{ backgroundColor: resolveCategoryBgColor(category.id), borderColor: resolveCategoryBgColor(category.id) }}
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

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium">Target Frequency</label>
            <div className="flex gap-2">
              <div className="flex flex-1 items-center gap-2">
                {frequencyPeriod === 'custom' ? (
                  <div className="flex flex-wrap gap-1">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                      <Button
                        key={day}
                        type="button"
                        variant={customDays[index] ? 'outlinefilled' : 'outlineinactive'}
                        size="sm"
                        onClick={() => {
                          const updatedCustomDays = [...customDays];
                          updatedCustomDays[index] = !updatedCustomDays[index];
                          setCustomDays(updatedCustomDays);
                          const selectedCount = updatedCustomDays.filter(Boolean).length;
                          const selectedDays = updatedCustomDays
                            .map((selected, idx) => (selected ? idx : -1))
                            .filter((idx) => idx !== -1);
                          setNewHabit({
                            ...newHabit,
                            target_unit: 'week',
                            target_value: Math.max(1, selectedCount),
                            custom_days: selectedDays
                          });
                        }}
                        className={`w-10 h-10 rounded-lg text-xs flex items-center justify-center border transition-colors ${
                          customDays[index]
                            ? 'bg-neutral-800 border-neutral-600 text-white hover:bg-neutral-800'
                            : 'bg-white border-neutral-300 text-neutral-400 hover:bg-neutral-200'
                        }`}
                      >
                        {day}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <Input
                    type="number"
                    min="1"
                    value={frequencyPeriod === 'daily' ? 1 : frequencyValue}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                      setFrequencyValue(val);
                      const nextUnit: HabitTargetUnit = frequencyPeriod === 'daily' ? 'day' : 'week';
                      setNewHabit({ ...newHabit, target_unit: nextUnit, target_value: val, custom_days: [] });
                    }}
                    className="w-16"
                    disabled={frequencyPeriod === 'daily'}
                  />
                )}
                <Select
                  value={frequencyPeriod}
                  onValueChange={(value: FrequencySelection) => {
                    setUserHasChangedSelection(true);
                    setFrequencyPeriod(value);
                    if (value === 'custom') {
                      setCustomDays(createEmptyCustomDays());
                      setNewHabit({ ...newHabit, target_unit: 'week', target_value: 1, custom_days: [] });
                    } else {
                      const val = value === 'daily' ? 1 : Math.max(1, frequencyValue);
                      const nextUnit: HabitTargetUnit = value === 'daily' ? 'day' : 'week';
                      setNewHabit({
                        ...newHabit,
                        target_unit: nextUnit,
                        target_value: val,
                        custom_days: []
                      });
                    }
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">per day</SelectItem>
                    <SelectItem value="weekly">per week</SelectItem>
                    <SelectItem value="custom">custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium">Leniency Threshold (days)</label>
              <Input
                type="number"
                min="1"
                max="5"
                value={newHabit.leniency_threshold}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  setNewHabit({...newHabit, leniency_threshold: val});
                }}
                className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>

          {/* Settings Dropdown */}
          <div className="absolute right-4 top-0">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {editingHabit?.phase === 'current' && onAdopt && (
                  <DropdownMenuItem onClick={handleAdopt}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <p className="text-xs">Sucess</p>
                  </DropdownMenuItem>
                )}
                {(editingHabit?.phase === 'current' || editingHabit?.phase === 'adopted') && onMoveToFuture && (
                  <DropdownMenuItem onClick={handleMoveToFuture}>
                    <Clock className="h-4 w-4 mr-2" />
                    <p className="text-xs">Make Future Habit</p>
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    onClick={handleDelete}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash className="h-4 w-4 mr-2" />
                    <p className="text-xs">Delete</p>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex w-full justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
            <Button size="sm" onClick={() => {
              onUpdateHabit();
              onOpenChange(false);
            }}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};