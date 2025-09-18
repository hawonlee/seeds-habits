import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { Habit } from "@/hooks/useHabits";
import { HabitCard } from "./HabitCard";
import { HabitTableRow } from "./HabitTableRow";
import { CategoryManager } from "./CategoryManager";
import { useState } from "react";

interface CurrentHabitsListProps {
  habits: Habit[];
  onAddHabit: () => void;
  adoptionThreshold: number;
  onChangeAdoptionThreshold?: (threshold: number) => void;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (id: string) => void;
  onUpdateHabit?: (updatedHabit: Partial<Habit>) => void;
  onCheckIn: (id: string, date?: Date) => void;
  onUndoCheckIn: (id: string, date?: Date) => void;
  onMoveHabit: (id: string, phase: Habit['phase']) => void;
}

export const CurrentHabitsList = ({
  habits,
  onAddHabit,
  adoptionThreshold,
  onChangeAdoptionThreshold,
  onEditHabit,
  onDeleteHabit,
  onUpdateHabit,
  onCheckIn,
  onUndoCheckIn,
  onMoveHabit
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
    <div className="h-full bg-white overflow-y-auto">
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
      {habits.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center bg-white  text-muted-foreground">
            <TrendingUp className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No active habits</p>
            <p className="text-sm">Move habits from Future to start tracking</p>
          </CardContent>
        </Card>
      ) : (
        <div className="bg-white rounded-lg overflow-hidden">
          {/* Week Navigation */}
          <div className="flex justify-between pb-4">
            <div className="flex items-center justify-center gap-10">
              <div className="text-xs font-medium text-gray-700">
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
                        <div className={`text-xs font-medium p-2  ${isToday ? 'text-black' : 'text-gray-400'} `}>{dayNames[day.getDay()]}</div>
                        {/* <div className={`text-xs text-gray-400  ${isToday ? 'text-white bg-red-300 rounded-sm' : ''}`}>{day.getDate()}</div> */}
                      </div>
                    );
                  })}
                </div>
              </div>
  
              <div className="flex items-end justify-end w-24 px-2">
                <div className="flex items-center justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={goToPreviousWeek}
                    className="h-4 w-4 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={goToCurrentWeek}
                    className="h-8 px-3 text-xs font-medium"
                  >
                    Today
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={goToNextWeek}
                    className="h-4 w-4 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

          </div>

          {/* Card Rows */}
          <div className="space-y-3">
            {habits.map(habit => (
              <HabitTableRow
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
                displayVariant="card"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
