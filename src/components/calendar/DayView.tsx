import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarIcon, CheckCircle, Circle } from "lucide-react";
import { Habit } from "@/hooks/useHabits";
import { HabitSchedule } from "@/hooks/useHabitSchedules";
import React from "react";
import { HabitCard } from "@/components/habits/HabitCard";
import { useHabitCompletions } from "@/hooks/useHabitCompletions";

interface DayViewProps {
  habits: Habit[];
  schedules: HabitSchedule[];
  onCheckIn: (id: string, date: Date) => void;
  onUndoCheckIn: (id: string, date: Date) => void;
  calendarViewMode: 'month' | 'week' | 'day';
  onViewModeChange: (mode: 'month' | 'week' | 'day') => void;
  currentDate: Date;
  onHabitDrop?: (habitId: string, date: Date) => void;
  onHabitUnschedule?: (habitId: string, date: Date) => void;
}

export const DayView = ({ habits, schedules, onCheckIn, onUndoCheckIn, calendarViewMode, onViewModeChange, currentDate, onHabitDrop, onHabitUnschedule }: DayViewProps) => {
  const { isHabitCompletedOnDate, toggleCompletion } = useHabitCompletions();
  // Helper functions for scheduled habits
  const formatDateForDB = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isHabitScheduledOnDate = (habitId: string, date: Date): boolean => {
    const scheduledDate = formatDateForDB(date);
    return schedules.some(
      schedule => schedule.habit_id === habitId && schedule.scheduled_date === scheduledDate
    );
  };

  const getScheduledHabitsForDate = (date: Date): string[] => {
    const scheduledDate = formatDateForDB(date);
    return schedules
      .filter(schedule => schedule.scheduled_date === scheduledDate)
      .map(schedule => schedule.habit_id);
  };

  const getCompletedHabits = () => {
    return habits.filter(habit => isHabitCompletedOnDate(habit.id, currentDate));
  };

  const getActiveHabits = () => {
    const isPast = currentDate < new Date(new Date().setHours(0, 0, 0, 0));
    const isFuture = currentDate > new Date(new Date().setHours(23, 59, 59, 999));
    const dayOfWeek = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    const isAfterCreatedDay = (habit: Habit, d: Date) => {
      const created = new Date(habit.created_at);
      const createdEnd = new Date(created);
      createdEnd.setHours(23, 59, 59, 999);
      return d > createdEnd;
    };

    // Get habits that are scheduled for this specific date
    const scheduledHabitIds = getScheduledHabitsForDate(currentDate);
    const scheduledHabits = habits.filter(habit => scheduledHabitIds.includes(habit.id));
    
    // Get habits that should appear based on their frequency (current habits only)
    const frequencyHabits = habits.filter(habit => {
      if (habit.phase === 'future') return false;
      if (habit.phase !== 'current') return false;
      
      // Don't include if already scheduled for this date
      if (scheduledHabitIds.includes(habit.id)) return false;
      
      // Do not appear on or before the creation day
      if (!isAfterCreatedDay(habit, currentDate)) return false;
      
      // Check if habit should be done on this day based on frequency
      return shouldHabitBeDoneOnDate(habit, currentDate, dayOfWeek);
    });
    
    // Combine scheduled habits and frequency-based habits
    return [...scheduledHabits, ...frequencyHabits];
  };

  const shouldHabitBeDoneOnDate = (habit: Habit, date: Date, dayOfWeek: number) => {
    // For now, we'll use a simple approach based on target_frequency
    // This can be enhanced later to support specific day selection
    
    // If target_frequency is 7, it's daily
    if (habit.target_frequency === 7) {
      return true;
    }
    
    // If target_frequency is 1, it's weekly (show on one day)
    if (habit.target_frequency === 1) {
      // Show on the day of the week when the habit was created
      const createdDay = new Date(habit.created_at).getDay();
      return dayOfWeek === createdDay;
    }
    
    // For other frequencies (2-6), distribute across the week
    if (habit.target_frequency >= 2 && habit.target_frequency <= 6) {
      // Create a simple distribution based on habit ID for consistency
      const habitIdHash = Math.abs(habit.id.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0));
      
      // Generate days based on frequency and habit ID
      const targetDays = [];
      for (let i = 0; i < habit.target_frequency; i++) {
        targetDays.push((habitIdHash + i) % 7);
      }
      
      return targetDays.includes(dayOfWeek);
    }
    
    return false;
  };

  const completedHabits = getCompletedHabits();
  const activeHabits = getActiveHabits();
  const remainingHabits = activeHabits.filter(habit => 
    !completedHabits.some(completed => completed.id === habit.id)
  );

  const isToday = currentDate.toDateString() === new Date().toDateString();
  const isPast = currentDate < new Date(new Date().setHours(0, 0, 0, 0));
  const isFuture = currentDate > new Date(new Date().setHours(23, 59, 59, 999));

  const getWeekStartDate = (date: Date) => {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const weekStartDate = getWeekStartDate(currentDate);

  const handleHabitCheckIn = async (habit: Habit, date: Date, isCompleted: boolean) => {
    await toggleCompletion(habit.id, date);
    if (isCompleted) {
      onUndoCheckIn(habit.id, date);
    } else {
      onCheckIn(habit.id, date);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDateStatus = () => {
    if (isToday) return { text: "Today", color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-200" };
    if (isPast) return { text: "Past", color: "text-gray-600", bgColor: "bg-gray-50", borderColor: "border-gray-200" };
    return { text: "Future", color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200" };
  };

  const dateStatus = getDateStatus();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.classList.add('bg-blue-50', 'border-blue-300');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-blue-50', 'border-blue-300');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-blue-50', 'border-blue-300');
    const habitId = e.dataTransfer.getData('text/plain');
    if (habitId && onHabitDrop) {
      onHabitDrop(habitId, currentDate);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div>
        <div className="space-y-6">
          <div className="flex text-xs items-center gap-2">
            <div className="">
              {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}
            </div>
            <div className={`flex items-center justify-center bg-red-600 rounded w-5 h-5 text-white ${isToday ? 'border-red-500 text-red-600' : 'border-transparent text-gray-900'}`} >
              <span className="">{currentDate.getDate()}</span>
            </div>
          </div>
          {/* Summary Stats */}
          {/* <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{completedHabits.length}</div>
              <div className="text-sm text-green-600">Completed</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{remainingHabits.length}</div>
              <div className="text-sm text-yellow-600">Remaining</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{activeHabits.length}</div>
              <div className="text-sm text-blue-600">Total</div>
            </div>
          </div> */}

          {/* Completed Habits */
          }
          {completedHabits.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Completed Habits ({completedHabits.length})
              </h3>
              <div className="grid gap-3">
                {completedHabits.map(habit => {
                  const isScheduled = isHabitScheduledOnDate(habit.id, currentDate);
                  const handleRightClick = (e: React.MouseEvent) => {
                    if (isScheduled && onHabitUnschedule) {
                      e.preventDefault();
                      e.stopPropagation();
                      onHabitUnschedule(habit.id, currentDate);
                    }
                  };
                  return (
                    <div key={habit.id} onContextMenu={handleRightClick}>
                      <HabitCard
                        habit={habit}
                        adoptionThreshold={7}
                        onCheckIn={() => handleHabitCheckIn(habit, currentDate, isHabitCompletedOnDate(habit.id, currentDate))}
                        onUndoCheckIn={() => handleHabitCheckIn(habit, currentDate, true)}
                        onMoveHabit={() => {}}
                        variant="week"
                        weekStartDate={weekStartDate}
                        isCompletedOnDate={isHabitCompletedOnDate}
                        selectedDate={currentDate}
                        onCheckInForDate={(id, d) => handleHabitCheckIn(habit, d, isHabitCompletedOnDate(habit.id, d))}
                        onUndoCheckInForDate={(id, d) => handleHabitCheckIn(habit, d, true)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Remaining Habits */
          }
          {remainingHabits.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-gray-700 mb-4 flex items-center gap-2">
                {/* <Circle className="h-5 w-5" /> */}
                {isFuture ? 'Planned Habits' : 'Remaining Habits'} ({remainingHabits.length})
              </h3>
              <div className="grid gap-3">
                {remainingHabits.map(habit => {
                  const isScheduled = isHabitScheduledOnDate(habit.id, currentDate);
                  const handleRightClick = (e: React.MouseEvent) => {
                    if (isScheduled && onHabitUnschedule) {
                      e.preventDefault();
                      e.stopPropagation();
                      onHabitUnschedule(habit.id, currentDate);
                    }
                  };
                  return (
                    <div key={habit.id} onContextMenu={handleRightClick}>
                      <HabitCard
                        habit={habit}
                        adoptionThreshold={7}
                        onCheckIn={() => handleHabitCheckIn(habit, currentDate, isHabitCompletedOnDate(habit.id, currentDate))}
                        onUndoCheckIn={() => handleHabitCheckIn(habit, currentDate, true)}
                        onMoveHabit={() => {}}
                        variant="week"
                        weekStartDate={weekStartDate}
                        isCompletedOnDate={isHabitCompletedOnDate}
                        selectedDate={currentDate}
                        onCheckInForDate={(id, d) => handleHabitCheckIn(habit, d, isHabitCompletedOnDate(habit.id, d))}
                        onUndoCheckInForDate={(id, d) => handleHabitCheckIn(habit, d, true)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* No habits message */}
          {activeHabits.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarIcon className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-xl font-medium">No active habits</p>
              <p className="text-sm">
                {isFuture 
                  ? "No habits are planned for this day" 
                  : "No habits were active on this day"
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
