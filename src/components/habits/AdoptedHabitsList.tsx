import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trophy, PanelRight } from "lucide-react";
import { Habit } from "@/hooks/useHabits";
import { HabitCard } from "./HabitCard";

interface AdoptedHabitsListProps {
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

export const AdoptedHabitsList = ({ 
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
}: AdoptedHabitsListProps) => {
  // Debug logging
  console.log('AdoptedHabitsList received habits:', habits);
  console.log('AdoptedHabitsList habits length:', habits.length);
  console.log('AdoptedHabitsList isCollapsed:', isCollapsed);
  console.log('AdoptedHabitsList hideHeader:', hideHeader);
  
  if (isCollapsed) {
    console.log('AdoptedHabitsList: Rendering collapsed view');
    return (
      <div className="h-full flex flex-col items-center justify-center bg-neutral-50 rounded-lg border">
        <Button
          size="sm"
          variant="ghost"
          onClick={onToggleCollapse}
          className="h-12 w-12 p-0 hover:bg-neutral-100"
        >
          <PanelRight className="h-6 w-6 text-green-500" />
        </Button>
        <div className="mt-2 text-xs text-green-500 font-medium transform -rotate-90 whitespace-nowrap">
          Adopted
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-white overflow-y-auto">
      {/* {!hideHeader && (
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="group relative">
              <h2 className="text-sm font-medium cursor-pointer">ADOPTED</h2>
              <Button
                size="sm"
                variant="ghost"
                onClick={onToggleCollapse}
                className="absolute -right-8 top-0 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <PanelRight className="h-4 w-4" />
              </Button>
            </div>
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
      )} */}
      <div className="space-y-4">
        {habits.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground">
            <p className="text-xs">No adopted habits yet</p>
          </div>
        ) : (
          habits.map(habit => (
            <HabitCard
              key={habit.id}
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
