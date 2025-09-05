import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
            <label className="text-sm font-medium">Habit Title</label>
            <Input
              placeholder="e.g., Morning Exercise"
              value={newHabit.title}
              onChange={(e) => setNewHabit({...newHabit, title: e.target.value})}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Notes (Optional)</label>
            <Textarea
              placeholder="Add details about your habit..."
              value={newHabit.notes}
              onChange={(e) => setNewHabit({...newHabit, notes: e.target.value})}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Category</label>
            <Select value={newHabit.category} onValueChange={(value) => setNewHabit({...newHabit, category: value})}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">Personal</SelectItem>
                <SelectItem value="health">Health</SelectItem>
                <SelectItem value="learning">Learning</SelectItem>
                <SelectItem value="work">Work</SelectItem>
                <SelectItem value="social">Social</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Target Frequency (per week)</label>
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
              <label className="text-sm font-medium">Leniency Threshold (days)</label>
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
          <div className="flex gap-2 pt-4">
            <Button onClick={onUpdateHabit} className="flex-1 bg-green-600 hover:bg-green-700">
              Update Habit
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
