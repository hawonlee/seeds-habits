import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import { Habit } from "@/hooks/useHabits";
import { HabitCard } from "./HabitCard";
import { CategoryManager } from "./CategoryManager";
import { useState } from "react";
import { useContainerWidth } from "@/hooks/useContainerWidth";
import { ReorderableList } from "@/components/ui/ReorderableList";

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
  onReorderHabits?: (habitIds: string[]) => void;
  onToggleCalendar?: () => void;
  isCalendarCollapsed?: boolean;
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
  onRefreshHabits,
  onReorderHabits,
  onToggleCalendar,
  isCalendarCollapsed = true
}: CurrentHabitsListProps) => {
  // Track a moving 7-day window whose last day (rightmost square) is viewEndDate
  const [viewEndDate, setViewEndDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  // Header day labels (Sun-Sat) remain constant; dates reflect the 7-day range ending at viewEndDate
  const headerDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(viewEndDate);
    day.setHours(0, 0, 0, 0);
    day.setDate(viewEndDate.getDate() - (6 - i));
    return day;
  });
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const goToPreviousWeek = () => {
    const next = new Date(viewEndDate);
    next.setDate(viewEndDate.getDate() - 7);
    setViewEndDate(next);
  };

  const goToNextWeek = () => {
    const next = new Date(viewEndDate);
    next.setDate(viewEndDate.getDate() + 7);
    setViewEndDate(next);
  };

  const goToCurrentWeek = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setViewEndDate(today);
  };

  const formatWeekRange = () => {
    const start = headerDays[0];
    const end = headerDays[6];
    const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${startStr} - ${endStr}`;
  };

  // Reordered via ReorderableList

  const handleReorder = (ids: string[]) => onReorderHabits?.(ids);
  const { ref, width } = useContainerWidth<HTMLDivElement>();
  const isNarrow = width > 0 && width < 630; // threshold for compacting

  return (
    <div ref={ref} className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-2 flex-shrink-0">
        <div className="flex items-center justify-start gap-2">
          <h2 className="text-sm font-medium h-10 flex items-center">Current Habits</h2>
          <Button
            size="icon"
            variant="ghosticon"
            onClick={onAddHabit}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <CategoryManager adoptionThreshold={adoptionThreshold} onChangeAdoptionThreshold={onChangeAdoptionThreshold} />
          
          {onToggleCalendar && (
            <Button
              variant="ghosticon"
              size="icon"
              onClick={onToggleCalendar}
              className="text-xs gap-1"
              title={isCalendarCollapsed ? 'Show calendar' : 'Hide calendar'}
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          )}
        </div>

      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
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
        <div className="rounded-lg">
          {/* Week Navigation */}
          {!isNarrow && (
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
                    {headerDays.map((day, index) => {
                      const today = new Date();
                      const isToday = day.toDateString() === today.toDateString();
                      return (
                        <div
                          key={index}
                          className={`flex items-center justify-center gap-1 min-w-[32px] w-12 text-center`}
                        >
                          <div className={`text-xs p-2  ${isToday ? 'font-semibold text-foreground' : 'font-normal text-muted-foreground'} `}>{dayNames[day.getDay()]}</div>
                          {/* <div className={`text-xs text-neutral-400  ${isToday ? 'text-white bg-red-300 rounded-sm' : ''}`}>{day.getDate()}</div> */}
                        </div>
                      );
                    })}
                  </div>
                </div>


                <div className="flex items-center justify-end w-24 h-6">
                  <div className="flex items-center justify-end">
                    <Button
                      variant="ghost"
                      size={undefined}
                      onClick={goToPreviousWeek}
                      className="h-6 w-6 p-0 min-w-0 min-h-0 text-xs"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size={undefined}
                      onClick={goToCurrentWeek}
                      className="h-6 px-3 text-xs font-medium min-w-0 min-h-0"
                    >
                      Today
                    </Button>
                    <Button
                      variant="ghost"
                      size={undefined}
                      onClick={goToNextWeek}
                      className="h-6 w-6 p-0 min-w-0 min-h-0 text-xs"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

            </div>
          )}

          <ReorderableList
            items={habits}
            getId={(h) => h.id}
            onReorder={handleReorder}
            className="flex flex-col gap-2"
            externalDragType="habit"
            renderItem={(habit) => (
              <HabitCard
                habit={habit}
                adoptionThreshold={adoptionThreshold}
                viewEndDate={viewEndDate}
                onEditHabit={onEditHabit}
                onDeleteHabit={onDeleteHabit}
                onUpdateHabit={onUpdateHabit}
                onCheckIn={onCheckIn}
                onUndoCheckIn={onUndoCheckIn}
                onMoveHabit={onMoveHabit}
                variant={isNarrow ? 'default' : 'table'}
                draggable={false}
              />
            )}
          />
        </div>
      )}
      </div>
    </div>
  );
};