import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useEffect, useState } from "react";
import { DEFAULT_CATEGORIES, fetchCategories, getCategories, getCategoryClasses, resolveCategoryBgColor, type Category } from "@/lib/categories";
import { calculateWeeklyTarget, createEmptyCustomDays, deriveStandardFrequencyFromWeekly, type FrequencyPeriod } from "@/lib/frequency";
import { useAuth } from "@/hooks/useAuth";

interface AddHabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  addToPhase: 'future' | 'current' | 'adopted';
  newHabit: {
    title: string;
    notes: string;
    category: string;
    target_frequency: number;
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
  const [frequencyPeriod, setFrequencyPeriod] = useState<FrequencyPeriod>('daily');
  const [customDays, setCustomDays] = useState<boolean[]>(createEmptyCustomDays());
  const [categories, setCategories] = useState<Category[]>(getCategories());
  const [loadingCategories, setLoadingCategories] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      setLoadingCategories(true);
      try {
        if (!user?.id) {
          setCategories(DEFAULT_CATEGORIES);
          return;
        }
        const cats = await fetchCategories(user.id);
        setCategories(cats && cats.length ? cats : DEFAULT_CATEGORIES);
      } finally {
        setLoadingCategories(false);
      }
    };
    load();
  }, [user?.id]);

  useEffect(() => {
    if (frequencyPeriod === 'custom') return;

    const { value, period } = deriveStandardFrequencyFromWeekly(newHabit.target_frequency);
    setFrequencyValue(value);
    setFrequencyPeriod(period);
  }, [newHabit.target_frequency, frequencyPeriod]);
  
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
                  categories.map(category => (
                    <SelectItem key={category.id} value={category.id}>
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
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {/* {newHabit.category && (
              <div className="mt-2">
                <Badge
                  className={`${getCategoryClasses(newHabit.category).bgColor} ${getCategoryClasses(newHabit.category).textColor} border-0`}
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
                          setNewHabit({ ...newHabit, target_frequency: Math.max(1, selectedCount) });
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
                    value={frequencyValue}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                      setFrequencyValue(val);
                      setNewHabit({ ...newHabit, target_frequency: calculateWeeklyTarget(val, frequencyPeriod) });
                    }}
                    className="w-16"
                  />
                )}
                <Select
                  value={frequencyPeriod}
                  onValueChange={(value: FrequencyPeriod) => {
                    setFrequencyPeriod(value);
                    if (value === 'custom') {
                      setCustomDays(createEmptyCustomDays());
                      setNewHabit({ ...newHabit, target_frequency: 1 });
                    } else {
                      const val = Math.max(1, frequencyValue);
                      setNewHabit({ ...newHabit, target_frequency: calculateWeeklyTarget(val, value) });
                    }
                  }}
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">per day</SelectItem>
                    <SelectItem value="weekly">per week</SelectItem>
                    <SelectItem value="monthly">per month</SelectItem>
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
