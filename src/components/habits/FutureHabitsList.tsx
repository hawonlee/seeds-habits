import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Target, PanelLeft, PanelRight } from "lucide-react";
import { Habit } from "@/hooks/useHabits";
import { HabitCard } from "./HabitCard";

interface FutureHabitsListProps {
  habits: Habit[];
  onAddHabit: () => void;
  adoptionThreshold: number;
  onCheckIn: (id: string, date?: Date) => void;
  onUndoCheckIn: (id: string, date?: Date) => void;
  onMoveHabit: (id: string, phase: Habit['phase']) => void;
  onEditHabit?: (habit: Habit) => void;
  onDeleteHabit?: (id: string) => void;
  onUpdateHabit?: (updatedHabit: Partial<Habit>) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  hideHeader?: boolean;
}

export const FutureHabitsList = ({ 
  habits, 
  onAddHabit, 
  adoptionThreshold,
  onCheckIn,
  onUndoCheckIn,
  onMoveHabit,
  onEditHabit,
  onDeleteHabit,
  onUpdateHabit,
  isCollapsed = false,
  onToggleCollapse,
  hideHeader = false
}: FutureHabitsListProps) => {
  if (isCollapsed) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-50 rounded-lg border">
        <Button
          size="sm"
          variant="ghost"
          onClick={onToggleCollapse}
          className="h-12 w-12 p-0 hover:bg-gray-100"
        >
          <PanelLeft className="h-6 w-6 text-blue-500" />
        </Button>
        <div className="mt-2 text-xs text-blue-500 font-medium transform -rotate-90 whitespace-nowrap">
          Future
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white overflow-y-auto">
      {!hideHeader && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={onToggleCollapse}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <PanelRight className="h-4 w-4" />
            </Button>
            {/* <div className="w-3 h-3 bg-blue-500 rounded-full"></div> */}
            <h2 className="text-sm font-medium">FUTURE</h2>
            {/* <Badge variant="secondary">{habits.length}</Badge> */}
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
      )}
      <div className="space-y-4">
        {habits.length === 0 ? (
          <Card>
            <CardContent className="text-center text-muted-foreground">
              <p className="text-xs">No future habits yet</p>
            </CardContent>
          </Card>
        ) : (
          habits.map(habit => (
            <HabitCard 
              key={habit.id} 
              variant="compact"
              habit={habit} 
              adoptionThreshold={adoptionThreshold}
              onCheckIn={onCheckIn}
              onUndoCheckIn={onUndoCheckIn}
              onMoveHabit={onMoveHabit}
              onEditHabit={onEditHabit}
              onDeleteHabit={onDeleteHabit}
              onUpdateHabit={onUpdateHabit}
            />
          ))
        )}
      </div>
    </div>
  );
};
