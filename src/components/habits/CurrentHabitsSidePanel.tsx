import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp } from 'lucide-react';
import { Habit } from '@/hooks/useHabits';
import { HabitCard } from './HabitCard';

interface CurrentHabitsSidePanelProps {
  habits: Habit[];
  onAddHabit: () => void;
  onCheckIn: (id: string, date?: Date) => void;
  onUndoCheckIn: (id: string, date?: Date) => void;
  onMoveHabit: (id: string, phase: Habit['phase']) => void;
  onEditHabit?: (habit: Habit) => void;
  onDeleteHabit?: (id: string) => void;
  adoptionThreshold: number;
  onDragStart?: (habit: Habit) => void;
}

export const CurrentHabitsSidePanel: React.FC<CurrentHabitsSidePanelProps> = ({
  habits,
  onAddHabit,
  onCheckIn,
  onUndoCheckIn,
  onMoveHabit,
  onEditHabit,
  onDeleteHabit,
  adoptionThreshold,
  onDragStart,
}) => {
  return (
    <div className="">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xs text-foreground">Current</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddHabit}
          className="h-8 w-8 p-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {habits.length === 0 ? (
        <div className="p-6 text-center text-muted-foreground">
          <p className="text-xs">No active habits</p>
        </div>
      ) : (
        <div className="space-y-2">
          {habits.map(habit => (
            <HabitCard
              key={habit.id}
              habit={habit}
              variant="compact"
              adoptionThreshold={adoptionThreshold}
              onCheckIn={onCheckIn}
              onUndoCheckIn={onUndoCheckIn}
              onMoveHabit={onMoveHabit}
              onEditHabit={onEditHabit}
              onDeleteHabit={onDeleteHabit}
              draggable={true}
              onDragStart={onDragStart}
            />
          ))}
        </div>
      )}
    </div>
  );
};
