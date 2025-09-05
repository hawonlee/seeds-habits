import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trophy } from "lucide-react";
import { Habit } from "@/hooks/useHabits";
import { HabitCard } from "./HabitCard";

interface AdoptedHabitsListProps {
  habits: Habit[];
  onAddHabit: () => void;
  adoptionThreshold: number;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (id: string) => void;
  onCheckIn: (id: string) => void;
  onUndoCheckIn: (id: string) => void;
  onMoveHabit: (id: string, phase: Habit['phase']) => void;
}

export const AdoptedHabitsList = ({ 
  habits, 
  onAddHabit, 
  adoptionThreshold,
  onEditHabit,
  onDeleteHabit,
  onCheckIn,
  onUndoCheckIn,
  onMoveHabit
}: AdoptedHabitsListProps) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <h2 className="text-xl font-semibold">Adopted Habits</h2>
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
              <Trophy className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No adopted habits yet</p>
              <p className="text-sm">Maintain streaks to adopt habits</p>
            </CardContent>
          </Card>
        ) : (
          habits.map(habit => (
            <HabitCard 
              key={habit.id} 
              habit={habit} 
              showActions={false}
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
