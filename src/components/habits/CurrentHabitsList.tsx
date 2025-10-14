import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { Habit } from "@/hooks/useHabits";
import { HabitCard } from "./HabitCard";
import { CategoryManager } from "./CategoryManager";
import { useState } from "react";
import ReorderIndicator from "@/components/ui/ReorderIndicator";

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
  onReorderHabits
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

  // Drag and drop handlers
  const [draggedHabitId, setDraggedHabitId] = useState<string | null>(null);
  const [dragOverHabitId, setDragOverHabitId] = useState<string | null>(null);
  const [dragOverPlacement, setDragOverPlacement] = useState<'before' | 'after' | null>(null);
  const [dragOverEnd, setDragOverEnd] = useState<boolean>(false);
  const [activeGapIndex, setActiveGapIndex] = useState<number | null>(null);

  const handleDragStart = (habit: Habit) => {
    setDraggedHabitId(habit.id);
  };

  const handleDragOver = (e: React.DragEvent, habit: Habit) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    // No longer used for indicator; kept for compatibility
    if (draggedHabitId && draggedHabitId !== habit.id) {
      setDragOverHabitId(habit.id);
    }
  };

  const handleDragLeave = () => {
    setDragOverHabitId(null);
    setDragOverPlacement(null);
    setDragOverEnd(false);
  };

  const handleDrop = (e: React.DragEvent, targetHabit: Habit) => {
    e.preventDefault();
    // Deprecated path (kept to avoid breaking), new logic uses gap drop zones
    if (!draggedHabitId || !onReorderHabits) return;
    const draggedIndex = habits.findIndex(h => h.id === draggedHabitId);
    const targetIndex = habits.findIndex(h => h.id === targetHabit.id);
    if (draggedIndex === -1 || targetIndex === -1 || draggedIndex === targetIndex) {
      setDraggedHabitId(null);
      setDragOverHabitId(null);
      return;
    }
    const newHabits = [...habits];
    const [draggedHabit] = newHabits.splice(draggedIndex, 1);
    newHabits.splice(targetIndex, 0, draggedHabit);
    const newOrder = newHabits.map(h => h.id);
    onReorderHabits(newOrder);
    setDraggedHabitId(null);
    setDragOverHabitId(null);
    setDragOverPlacement(null);
    setActiveGapIndex(null);
  };

  const handleDropAtGap = (e: React.DragEvent, gapIndex: number) => {
    e.preventDefault();
    if (!draggedHabitId || !onReorderHabits) return;
    const draggedIndex = habits.findIndex(h => h.id === draggedHabitId);
    if (draggedIndex === -1) {
      setDraggedHabitId(null);
      setActiveGapIndex(null);
      return;
    }
    let insertIndex = gapIndex;
    if (draggedIndex < gapIndex) insertIndex = gapIndex - 1;
    const newHabits = [...habits];
    const [draggedHabit] = newHabits.splice(draggedIndex, 1);
    newHabits.splice(insertIndex, 0, draggedHabit);
    const newOrder = newHabits.map(h => h.id);
    onReorderHabits(newOrder);
    setDraggedHabitId(null);
    setActiveGapIndex(null);
    setDragOverHabitId(null);
    setDragOverPlacement(null);
    setDragOverEnd(false);
  };

  const handleDragEnd = () => {
    setDraggedHabitId(null);
    setDragOverHabitId(null);
  };
  return (
    <div className="h-full overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium h-10 flex items-center">Current Habits</h2>
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
                  {headerDays.map((day, index) => {
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

          {/* Card Rows with explicit gap drop zones */}
          <div className="space-y-2">
            {habits.map((habit, index) => (
              <div key={habit.id} className="relative">
                {/* Gap before each item (including before first when index===0) */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (draggedHabitId) setActiveGapIndex(index);
                  }}
                  onDragLeave={(e) => {
                    // Only clear if leaving the gap area entirely
                    setActiveGapIndex((prev) => (prev === index ? null : prev));
                  }}
                  onDrop={(e) => handleDropAtGap(e, index)}
                  className="relative h-2"
                >
                  {activeGapIndex === index && draggedHabitId && (
                    <ReorderIndicator className="top-0" />
                  )}
                </div>

                {/* Row wrapper */}
                <div
                  draggable
                  onDragStart={(e) => {
                    if (e.dataTransfer) {
                      e.dataTransfer.setData('text/plain', habit.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }
                    setDraggedHabitId(habit.id);
                  }}
                  onDragEnd={handleDragEnd}
                  className={`relative transition-all duration-200 select-none ${
                    draggedHabitId === habit.id ? 'opacity-30' : ''
                  }`}
                >
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
                    variant="table"
                    draggable={false}
                  />
                </div>
              </div>
            ))}

            {/* Final gap at end of list */}
            {habits.length > 0 && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  if (draggedHabitId) setActiveGapIndex(habits.length);
                }}
                onDragLeave={() => {
                  setActiveGapIndex((prev) => (prev === habits.length ? null : prev));
                }}
                onDrop={(e) => handleDropAtGap(e, habits.length)}
                className="relative h-2"
              >
                {activeGapIndex === habits.length && draggedHabitId && (
                  <ReorderIndicator className="top-0" />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
