import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { Habit } from "@/hooks/useHabits";
import { HabitCard } from "./HabitCard";
import { CategoryManager } from "./CategoryManager";
import { useState } from "react";

interface CurrentHabitsListProps {
  habits: Habit[];
  loading?: boolean;
  onAddHabit: () => void;
  adoptionThreshold: number;
  onChangeAdoptionThreshold?: (threshold: number) => void;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (id: string) => void;
  onUpdateHabit?: (updatedHabit: Partial<Habit>) => void;
  onCheckIn: (id: string, date?: Date) => void;
  onUndoCheckIn: (id: string, date?: Date) => void;
  onMoveHabit: (id: string, phase: Habit['phase']) => void;
  onRefreshHabits?: () => void;
}

export const CurrentHabitsList = ({
  habits,
  loading = false,
  onAddHabit,
  adoptionThreshold,
  onChangeAdoptionThreshold,
  onEditHabit,
  onDeleteHabit,
  onUpdateHabit,
  onCheckIn,
  onUndoCheckIn,
  onMoveHabit,
  onRefreshHabits
}: CurrentHabitsListProps) => {
  const [currentWeek, setCurrentWeek] = useState(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    return startOfWeek;
  });

  const getWeekDays = () => {
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(currentWeek);
      day.setDate(currentWeek.getDate() + i);
      return day;
    });
  };

  const weekDays = getWeekDays();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const goToPreviousWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() - 7);
    setCurrentWeek(newWeek);
  };

  const goToNextWeek = () => {
    const newWeek = new Date(currentWeek);
    newWeek.setDate(currentWeek.getDate() + 7);
    setCurrentWeek(newWeek);
  };

  const goToCurrentWeek = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    setCurrentWeek(startOfWeek);
  };

  const formatWeekRange = () => {
    const start = weekDays[0];
    const end = weekDays[6];
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  };
  return (
    <div className="h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium">Current Habits</h2>
        <div>
          <CategoryManager adoptionThreshold={adoptionThreshold} onChangeAdoptionThreshold={onChangeAdoptionThreshold} />
          <Button
            size="sm"
            variant="ghost"
            onClick={onAddHabit}
            className="h-8 w-8 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="h-5 w-5 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
          </div>
        </div>
      ) : habits.length === 0 ? (
        <div className="w-full text-muted-foreground">
          <p className="text-sm text-left">No active habits</p>
        </div>
      ) : (
        <div className="rounded-lg overflow-hidden">
          {/* Week Navigation */}
          <div className="flex justify-between pb-4">
            <div className="flex items-center justify-center gap-10">
              <div className="text-xs font-medium text-muted-foreground">
                {formatWeekRange()}
              </div>

            </div>

            <div className="flex items-center justify-center gap-4">
              {/* Day Headers above checkbox columns */}
              <div className="flex items-center">
                <div className="flex items-center">
                  {weekDays.map((day, index) => {
                    const today = new Date();
                    const isToday = day.toDateString() === today.toDateString();
                    return (
                      <div
                        key={index}
                        className={`flex items-center justify-center gap-1 min-w-[32px] w-12 text-center`}
                      >
                        <div className={`text-xs font-medium p-2  ${isToday ? 'text-foreground' : 'text-muted-foreground'} `}>{dayNames[day.getDay()]}</div>
                        {/* <div className={`text-xs text-neutral-400  ${isToday ? 'text-white bg-red-300 rounded-sm' : ''}`}>{day.getDate()}</div> */}
                      </div>
                    );
                  })}
                </div>
              </div>
  
              <div className="flex items-end justify-end w-24">
                <div className="flex items-center justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={goToPreviousWeek}
                    className="h-6 w-6 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={goToCurrentWeek}
                    className="h-6 px-3 text-xs font-medium"
                  >
                    Today
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={goToNextWeek}
                    className="h-6 w-6 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

          </div>

          {/* Card Rows */}
          <div className="space-y-2">
            {habits.map(habit => (
              <HabitCard
                key={habit.id}
                habit={habit}
                adoptionThreshold={adoptionThreshold}
                currentWeek={currentWeek}
                onEditHabit={onEditHabit}
                onDeleteHabit={onDeleteHabit}
                onUpdateHabit={onUpdateHabit}
                onCheckIn={onCheckIn}
                onUndoCheckIn={onUndoCheckIn}
                onMoveHabit={onMoveHabit}
                variant="table"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
