import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_CATEGORIES, getCategoryClasses } from "@/lib/categories";

interface EditHabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingHabit: any;
  newHabit: {
    title: string;
    notes: string;
    category: string;
    target_frequency: number;
    leniency_threshold: number;
  };
  setNewHabit: (habit: any) => void;
  onUpdateHabit: () => void;
}

export const EditHabitDialog = ({
  open,
  onOpenChange,
  editingHabit,
  newHabit,
  setNewHabit,
  onUpdateHabit
}: EditHabitDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Habit</DialogTitle>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium">Target Frequency (per week)</label>
              <Select value={newHabit.target_frequency.toString()} onValueChange={(value) => setNewHabit({...newHabit, target_frequency: parseInt(value)})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5,6,7].map(num => (
                    <SelectItem key={num} value={num.toString()}>{num}x</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium">Leniency Threshold (days)</label>
              <Select value={newHabit.leniency_threshold.toString()} onValueChange={(value) => setNewHabit({...newHabit, leniency_threshold: parseInt(value)})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5].map(num => (
                    <SelectItem key={num} value={num.toString()}>{num}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex w-full justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="">
              Cancel
            </Button>
            <Button onClick={onUpdateHabit} className="">
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
