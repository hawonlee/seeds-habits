import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useState } from "react";
import { FALLBACK_CATEGORIES, fetchCategories, getCategories, resolveCategoryBgColor, type Category, addCacheChangeListener, refreshCategories } from "@/lib/categories";
import { CategoryEditButton } from '@/components/habits/CategoryEditButton';
import { createEmptyCustomDays } from "@/lib/frequency";
import type { HabitTargetUnit } from "@/hooks/useHabits";
import { useAuth } from "@/hooks/useAuth";
import { Check, X } from "lucide-react";
import { COLOR_OPTIONS, findColorOptionByValue } from "@/lib/colorOptions";
import { setCategoriesCache } from "@/lib/categories";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type FrequencySelection = 'daily' | 'weekly' | 'custom';

interface AddHabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addToPhase: 'future' | 'current' | 'adopted';
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
  onAddHabit: () => void;
}

export const AddHabitDialog = ({
  open,
  onOpenChange,
  addToPhase,
  newHabit,
  setNewHabit,
  onAddHabit
}: AddHabitDialogProps) => {
  const [frequencyValue, setFrequencyValue] = useState(1);
  const [frequencyPeriod, setFrequencyPeriod] = useState<FrequencySelection>('daily');
  const [customDays, setCustomDays] = useState<boolean[]>(createEmptyCustomDays());
  const [userHasChangedSelection, setUserHasChangedSelection] = useState(false);
  const [categories, setCategories] = useState<Category[]>(getCategories());
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6');
  const { user } = useAuth();
  const { toast } = useToast();

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

  // Listen for cache changes from other components (like CategoryManager)
  useEffect(() => {
    const unsubscribe = addCacheChangeListener(() => {
      setCategories(getCategories());
    });
    return unsubscribe;
  }, []);

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

  const handleCategoryCreated = (category: Category) => {
    setNewHabit({ ...newHabit, category: category.id });
  };

  const handleCreateCategoryInline = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a category name",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingCategory(true);
    try {
      const palette = findColorOptionByValue(newCategoryColor);
      const category: Category = {
        id: newCategoryName.toLowerCase().replace(/\s+/g, '-'),
        name: newCategoryName,
        color: newCategoryColor,
        bgColor: palette ? palette.bgHex : '#FAFAFA',
        textColor: palette ? palette.textHex : '#262626'
      };
      
      const result: any = await supabase
        .from('categories')
        .insert({
          id: category.id,
          name: category.name,
          color: category.color,
          bg_color: category.bgColor,
          text_color: category.textColor,
          user_id: user?.id || null
        });
      const { error } = result;

      if (error) {
        toast({
          title: "Error",
          description: `Failed to create category: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      // Force refresh all components using categories
      await refreshCategories(user?.id);

      setNewHabit({ ...newHabit, category: category.id });
      setNewCategoryName('');
      setNewCategoryColor('#3B82F6');
      
    } catch (error) {
      console.error('Error creating category:', error);
      toast({
        title: "Error",
        description: "Failed to create category",
        variant: "destructive",
      });
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const colorOptions = COLOR_OPTIONS.map((color, index) => ({
    ...color,
    cssBg: `hsl(var(--category-${index + 1}-bg))`,
    cssPrimary: `hsl(var(--category-${index + 1}-primary))`
  }));
  
  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-sm font-medium">Add a New {addToPhase === 'future' ? 'Future' : addToPhase === 'current' ? 'Current' : 'Adopted'} Habit </DialogTitle>
        </DialogHeader>
        <div className="space-y-5">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium">Habit Name</label>
            <Input
              placeholder="Morning Exercise..."
              value={newHabit.title}
              onChange={(e) => setNewHabit({...newHabit, title: e.target.value})}
            />
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
            <Select value={newHabit.category} onValueChange={(value) => setNewHabit({...newHabit, category: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.length === 0 ? (
                  <div className="px-2 py-1 text-xs text-muted-foreground">No categories. Create one in Category Manager.</div>
                ) : (
                  <>
                    {categories.map(category => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {category.id === 'none' ? (
                              <div className="w-3 h-3 rounded-full border border-neutral-300 bg-transparent" />
                            ) : (
                              <div
                                className="w-3 h-3 rounded-full border"
                                style={{ backgroundColor: category.bgColor ? resolveCategoryBgColor(category.id) : 'transparent', borderColor: category.bgColor ? resolveCategoryBgColor(category.id) : 'transparent' }}
                              />
                            )}
                            <span>{category.name}</span>
                          </div>
                          {/* Inline edit */}
                          {/* <CategoryEditButton category={category} onUpdated={() => setCategories(getCategories())} /> */}
                        </div>
                      </SelectItem>
                    ))}
                    <div className="border-t border-neutral-200 my-1" />
                    <div className="p-2 space-y-3 bg-gray-50">
                      <div>
                        <label className="text-xs font-medium text-gray-700">Category Name</label>
                        <Input
                          placeholder="Enter category name"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                          onKeyDown={(e) => e.stopPropagation()}
                          className="mt-1"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-2 block">Color</label>
                        <div className="grid grid-cols-3 gap-1">
                          {colorOptions.map(color => (
                            <button
                              key={color.value}
                              onClick={() => setNewCategoryColor(color.value)}
                              className={`w-full h-8 rounded border-2 transition-all ${newCategoryColor === color.value ? 'border-gray-400' : 'border-transparent'}`}
                              style={{ 
                                backgroundColor: color.cssBg,
                                borderColor: newCategoryColor === color.value ? 'var(--light-border)' : 'transparent'
                              } as React.CSSProperties & { '--light-border': string }}
                              aria-label={color.name}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setNewCategoryName('');
                            setNewCategoryColor('#3B82F6');
                          }}
                          className="h-7 px-2"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleCreateCategoryInline}
                          disabled={!newCategoryName.trim() || isCreatingCategory}
                          className="h-7 px-2"
                        >
                          {isCreatingCategory ? (
                            <div className="w-3 h-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </SelectContent>
            </Select>
            {/* {newHabit.category && (
              <div className="mt-2">
                <Badge
                  className=""
                >
                  {DEFAULT_CATEGORIES.find(c => c.id === newHabit.category)?.name}
                </Badge>
              </div>
            )} */}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium">Target Frequency</label>
            <div className="flex gap-2">
              <div className="flex flex-1 items-center gap-2">
                {frequencyPeriod === 'custom' ? (
                  <div className="flex flex-wrap gap-1">
                    {dayNames.map((day, index) => (
                      <Button
                        key={day}
                        type="button"
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

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium">Leniency Threshold (days)</label>
            <Input
              type="number"
              min="1"
              // max="5"
              value={newHabit.leniency_threshold}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                setNewHabit({...newHabit, leniency_threshold: val});
              }}
              placeholder="1"
              className="[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
          <div className="flex w-full justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="">
              Cancel
            </Button>
            <Button onClick={onAddHabit} className="">
              Add Habit
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
