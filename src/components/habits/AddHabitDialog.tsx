import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { DEFAULT_CATEGORIES, getCategoryClasses } from "@/lib/categories";

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
  const [frequencyType, setFrequencyType] = useState<'daily' | 'weekly' | 'custom'>('daily');
  const [frequencyValue, setFrequencyValue] = useState(1);
  const [customDays, setCustomDays] = useState<boolean[]>([false, false, false, false, false, false, false]);
  
  const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a New {addToPhase === 'future' ? 'Future' : addToPhase === 'current' ? 'Current' : 'Adopted'} Habit </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium">Habit Title</label>
            <Input
              placeholder="Morning Exercise..."
              value={newHabit.title}
              onChange={(e) => setNewHabit({...newHabit, title: e.target.value})}
            />
          </div>
          <div>
            <label className="text-xs font-medium">Notes</label>
            <Textarea
              placeholder="Add details about your habit..."
              value={newHabit.notes}
              onChange={(e) => setNewHabit({...newHabit, notes: e.target.value})}
            />
          </div>
          <div>
            <label className="text-xs font-medium">Category</label>
            <Select value={newHabit.category} onValueChange={(value) => setNewHabit({...newHabit, category: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEFAULT_CATEGORIES.map(category => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <span>{category.name}</span>
                    </div>
                  </SelectItem>
                ))}
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
                        setNewHabit({...newHabit, target_frequency: val * 7});
                      }}
                      className="rounded-full px-2 py-1 text-center text-xs bg-gray-200 border-none outline-none text-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                        setNewHabit({...newHabit, target_frequency: val});
                      }}
                      className="rounded-full px-2 py-1 text-center text-xs bg-gray-200 border-none outline-none text-black [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
              {/* <label className="text-xs font-medium">Select days of the week</label> */}
              <div className="flex gap-2 mt-2">
                {dayNames.map((day, index) => (
                  <Button
                    key={day}
                    type="button"
                    onClick={() => {
                      const newCustomDays = [...customDays];
                      newCustomDays[index] = !newCustomDays[index];
                      setCustomDays(newCustomDays);
                      // Calculate target frequency based on selected days
                      const selectedCount = newCustomDays.filter(Boolean).length;
                      setNewHabit({...newHabit, target_frequency: selectedCount});
                    }}
                    className={`w-8 h-8 rounded-lg text-black border flex items-center justify-center text-xs font-normal transition-colors ${
                      customDays[index] 
                        ? 'bg-gray-100 border-gray-600 text-black hover:bg-gray-100' 
                        : 'bg-white border-gray-300 text-gray-400 hover:bg-gray-200'
                    }`}
                  >
                    {day}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div>
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
