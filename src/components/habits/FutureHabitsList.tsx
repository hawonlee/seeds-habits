import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Target } from "lucide-react";
import { Habit } from "@/hooks/useHabits";
import { HabitCard } from "./HabitCard";

interface FutureHabitsListProps {
  habits: Habit[];
  onAddHabit: () => void;
  adoptionThreshold: number;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (id: string) => void;
  onCheckIn: (id: string) => void;
  onUndoCheckIn: (id: string) => void;
  onMoveHabit: (id: string, phase: Habit['phase']) => void;
}

export const FutureHabitsList = ({ 
  habits, 
  onAddHabit, 
  adoptionThreshold,
  onEditHabit,
  onDeleteHabit,
  onCheckIn,
  onUndoCheckIn,
  onMoveHabit
}: FutureHabitsListProps) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <h2 className="text-xl font-semibold">Future Habits</h2>
          <Badge variant="secondary">{habits.length}</Badge>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onAddHabit}
          className="h-8 w-8 p-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-4">
        {habits.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No future habits yet</p>
              <p className="text-sm">Add a new habit to get started</p>
            </CardContent>
          </Card>
        ) : (
          habits.map(habit => (
            <HabitCard 
              key={habit.id} 
              habit={habit} 
              adoptionThreshold={adoptionThreshold}
              onEditHabit={onEditHabit}
              onDeleteHabit={onDeleteHabit}
              onCheckIn={onCheckIn}
              onUndoCheckIn={onUndoCheckIn}
              onMoveHabit={onMoveHabit}
            />
          ))
        )}
      </div>
    </div>
  );
};
