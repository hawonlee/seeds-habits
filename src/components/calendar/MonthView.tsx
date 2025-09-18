import { Checkbox } from "@/components/ui/checkbox";
import { CalendarHabitItem } from "@/components/calendar/CalendarHabitItem";
import { Habit } from "@/hooks/useHabits";
import { getCategoryClasses, getCategoryById, resolveCategoryBgColor } from "@/lib/categories";
import { useHabitCompletions } from "@/hooks/useHabitCompletions";
import { HabitSchedule } from "@/hooks/useHabitSchedules";
import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HabitCard } from "@/components/habits/HabitCard";

interface MonthViewProps {
  habits: Habit[];
  schedules: HabitSchedule[];
  onCheckIn: (id: string, date: Date) => void;
  onUndoCheckIn: (id: string, date: Date) => void;
  onDayClick: (date: Date, habits: Habit[]) => void;
  calendarViewMode: 'month' | 'week' | 'day';
  onViewModeChange: (mode: 'month' | 'week' | 'day') => void;
  currentDate: Date;
  onHabitDrop?: (habitId: string, date: Date) => void;
  onHabitUnschedule?: (habitId: string, date: Date) => void;
}

export const MonthView = ({ habits, schedules, onCheckIn, onUndoCheckIn, onDayClick, calendarViewMode, onViewModeChange, currentDate, onHabitDrop, onHabitUnschedule }: MonthViewProps) => {
  const { isHabitCompletedOnDate, toggleCompletion } = useHabitCompletions();
  const [openDateKey, setOpenDateKey] = React.useState<string | null>(null);
  
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

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add days from previous month to fill the first week
    // Use (year, month, 0) to get last day of the previous month reliably
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, daysInPrevMonth - i);
      // Normalize to noon to avoid DST/UTC rendering issues when using UTC conversions
      d.setHours(12, 0, 0, 0);
      days.push(d);
    }
    
    // Add days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      d.setHours(12, 0, 0, 0);
      days.push(d);
    }
    
    // Add days from next month only to complete the current week
    // Calculate how many days we need to complete the current week
    const currentWeekLength = days.length % 7;
    if (currentWeekLength > 0) {
      const daysNeededToCompleteWeek = 7 - currentWeekLength;
      for (let day = 1; day <= daysNeededToCompleteWeek; day++) {
        const d = new Date(year, month + 1, day);
        d.setHours(12, 0, 0, 0);
        days.push(d);
      }
    }
    
    return days;
  };

  const shouldHabitBeDoneOnDate = (habit: Habit, date: Date, dayOfWeek: number) => {
    // If target_frequency is 7, it's daily
    if (habit.target_frequency === 7) {
      // Only show daily habits from the day they were created onwards
      const createdDate = new Date(habit.created_at);
      const createdDateOnly = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate());
      const currentDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      return currentDateOnly >= createdDateOnly;
    }
    
    // For frequencies 1-6, don't show automatically on calendar
    // These habits should only appear when manually scheduled
    return false;
  };

  const getCompletedHabitsForDate = (date: Date) => {
    return habits.filter(habit => isHabitCompletedOnDate(habit.id, date));
  };

  const handleHabitCheckIn = async (habit: Habit, date: Date, isCompleted: boolean) => {
    // Use the database-backed completion system
    await toggleCompletion(habit.id, date);
    
    // Also call the original functions for backward compatibility
    if (isCompleted) {
      onUndoCheckIn(habit.id, date);
    } else {
      onCheckIn(habit.id, date);
    }
  };

  const getWeekStartDate = (date: Date) => {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    start.setHours(0, 0, 0, 0);
    return start;
  };

  const getDetailedHabitsForDate = (date: Date) => {
    const activeHabits = habits.filter(habit => habit.phase === 'current');
    const completedHabits = habits.filter(habit => isHabitCompletedOnDate(habit.id, date));
    
    // Helper function to check if a habit should appear on a given date based on creation date
    const isHabitActiveOnDate = (habit: Habit, checkDate: Date): boolean => {
      const createdDate = new Date(habit.created_at);
      const createdDateOnly = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate());
      const currentDateOnly = new Date(checkDate.getFullYear(), checkDate.getMonth(), checkDate.getDate());
      return currentDateOnly >= createdDateOnly;
    };
    
    // Get habits that are specifically assigned to this day
    const scheduledHabitIds = getScheduledHabitsForDate(date);
    const scheduledHabits = activeHabits.filter(habit => 
      scheduledHabitIds.includes(habit.id) && isHabitActiveOnDate(habit, date)
    );
    
    // Get daily habits (target_frequency = 7) that should appear on this day
    const dailyHabits = activeHabits.filter(habit => {
      if (habit.target_frequency !== 7) return false;
      if (scheduledHabitIds.includes(habit.id)) return false; // Don't double-count scheduled habits
      
      // Only show daily habits from the day they were created onwards
      return isHabitActiveOnDate(habit, date);
    });
    
    // Get custom day habits that should appear on this day
    const customDayHabits = activeHabits.filter(habit => {
      if (habit.target_frequency < 2 || habit.target_frequency > 6) return false;
      if (scheduledHabitIds.includes(habit.id)) return false; // Don't double-count scheduled habits
      
      // Only show custom day habits from the day they were created onwards
      if (!isHabitActiveOnDate(habit, date)) return false;
      
      // Check if this habit has custom days defined and this day is one of them
      const hasCustomDaysField = Object.prototype.hasOwnProperty.call(habit as any, 'custom_days');
      const customDays = (habit as any).custom_days as number[] | undefined;
      if (hasCustomDaysField && customDays && customDays.length > 0) {
        const dayOfWeek = date.getDay();
        return customDays.includes(dayOfWeek);
      }
      return false;
    });
    
    // Planned habits are those specifically assigned to this day
    const plannedHabits = [...scheduledHabits, ...dailyHabits, ...customDayHabits];
    
    // My habits are all other current habits that aren't specifically assigned to this day
    const myHabits = activeHabits.filter(habit => 
      !plannedHabits.some(p => p.id === habit.id) && isHabitActiveOnDate(habit, date)
    );
    
    const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
    const isFuture = date > new Date(new Date().setHours(23, 59, 59, 999));
    
    return { 
      activeHabits, 
      completedHabits, 
      plannedHabits, 
      myHabits, 
      isPast, 
      isFuture 
    };
  };

  const getHabitsForDate = (date: Date) => {
    const { plannedHabits } = getDetailedHabitsForDate(date);
    return plannedHabits;
  };


  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="w-full focus:outline-none">
      {/* Day headers above the table */}
      <div className="grid grid-cols-7 mb-2 px-1">
        {dayNames.map(day => (
          <div key={day} className="text-center text-xs font-normal text-gray-600">
            {day}
          </div>
        ))}
      </div>
      
      {/* Scrollable calendar container */}
      <div className="h-[600px] overflow-y-auto overflow-x-hidden scrollbar-hide focus:outline-none">
        <div className="grid grid-cols-7">
        {/* Calendar days */}
        {days.map((date, index) => {
          const habitsForDay = getHabitsForDate(date);
          const completedHabits = getCompletedHabitsForDate(date);
          const isToday = date.toDateString() === new Date().toDateString();
          const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
          const isFuture = date > new Date(new Date().setHours(23, 59, 59, 999));
          
          // Determine if this day is from current month, previous month, or next month
          const currentMonth = currentDate.getMonth();
          const currentYear = currentDate.getFullYear();
          const isCurrentMonth = date.getMonth() === currentMonth && date.getFullYear() === currentYear;
          const isPrevMonth = date.getMonth() < currentMonth || (date.getMonth() === 11 && currentMonth === 0 && date.getFullYear() < currentYear);
          const isNextMonth = date.getMonth() > currentMonth || (date.getMonth() === 0 && currentMonth === 11 && date.getFullYear() > currentYear);

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
              onHabitDrop(habitId, date);
            }
          };

          const y = date.getFullYear();
          const m = String(date.getMonth() + 1).padStart(2, '0');
          const dd = String(date.getDate()).padStart(2, '0');
          const dateKey = `${y}-${m}-${dd}`;
          const isOpen = openDateKey === dateKey;
          return (
            <Popover
              key={`cell-${y}-${m}-${index}`}
              open={isOpen}
              onOpenChange={(open) => {
                setOpenDateKey(open ? dateKey : null);
                if (open) onDayClick(date, habitsForDay);
              }}
            >
              <PopoverTrigger asChild>
                <div
                  className={`
                    aspect-square cursor-pointer transition-colors relative
                    ${isCurrentMonth ? '' : 'opacity-50'}
                    ${index % 7 === 6 ? 'border-r-0' : ''}
                    ${index >= 35 ? 'border-b-0' : ''}
                  `}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="p-1 h-full">
                    <div className="calendar-cell-inner h-full border bg-gray-50  rounded-md p-2 flex flex-col">
                    {/* Date number */}
                    <div className="h-8 flex items-center justify-end mb-1">
                      <div className={`
                        text-xs font-medium
                        ${isToday ? 'text-white bg-red-600 rounded-full w-6 h-6 flex items-center justify-center' : ''}
                        ${!isToday && isCurrentMonth ? 'text-gray-900' : ''}
                        ${!isToday && !isCurrentMonth ? 'text-gray-400' : ''}
                     `}>
                        {date.getDate()}
                      </div>
                    </div>

                    {/* Habits for this day */}
                    <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                      {habitsForDay.slice(0, 3).map(habit => (
                        <CalendarHabitItem
                          key={habit.id}
                          habit={habit}
                          date={date}
                          isCompleted={isHabitCompletedOnDate(habit.id, date)}
                          onToggle={(h, d, isDone) => handleHabitCheckIn(h, d, isDone)}
                          isScheduled={isHabitScheduledOnDate(habit.id, date)}
                          onUnschedule={onHabitUnschedule}
                        />
                      ))}

                      {habitsForDay.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{habitsForDay.length - 3} more
                        </div>
                      )}

                      {/* {isCurrentMonth && habitsForDay.length === 0 && (
                        <div className="mt-auto">
                          <button
                            className="text-gray-400 hover:text-gray-600 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              // Add habit functionality could go here
                            }}
                          >
                            +
                          </button>
                        </div>
                      )} */}
                    </div>
                    </div>
                  </div>
                </div>
              </PopoverTrigger>
              <PopoverContent side="right" align="start" className="w-[420px] p-3">
                {(() => {
                  const { completedHabits, plannedHabits, myHabits, isFuture } = getDetailedHabitsForDate(date);
                  const weekStart = getWeekStartDate(date);
                  return (
                    <div className="space-y-3">
                      {plannedHabits.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-gray-700">Planned Habits</div>
                          <div className="grid gap-2">
                            {plannedHabits.map(habit => (
                              <HabitCard
                                key={habit.id}
                                habit={habit}
                                adoptionThreshold={7}
                                onCheckIn={() => handleHabitCheckIn(habit, date, isHabitCompletedOnDate(habit.id, date))}
                                onUndoCheckIn={() => handleHabitCheckIn(habit, date, true)}
                                onMoveHabit={() => {}}
                                variant="calendar"
                                weekStartDate={weekStart}
                                isCompletedOnDate={isHabitCompletedOnDate}
                                selectedDate={date}
                                onCheckInForDate={(id, d) => handleHabitCheckIn(habit, d, isHabitCompletedOnDate(habit.id, d))}
                                onUndoCheckInForDate={(id, d) => handleHabitCheckIn(habit, d, true)}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {completedHabits.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-gray-700">Completed</div>
                          <div className="grid gap-2">
                            {completedHabits.map(habit => (
                              <HabitCard
                                key={habit.id}
                                habit={habit}
                                adoptionThreshold={7}
                                onCheckIn={() => handleHabitCheckIn(habit, date, isHabitCompletedOnDate(habit.id, date))}
                                onUndoCheckIn={() => handleHabitCheckIn(habit, date, true)}
                                onMoveHabit={() => {}}
                                variant="calendar"
                                weekStartDate={weekStart}
                                isCompletedOnDate={isHabitCompletedOnDate}
                                selectedDate={date}
                                onCheckInForDate={(id, d) => handleHabitCheckIn(habit, d, isHabitCompletedOnDate(habit.id, d))}
                                onUndoCheckInForDate={(id, d) => handleHabitCheckIn(habit, d, true)}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {myHabits.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-xs font-medium text-gray-700">My Habits</div>
                          <div className="grid gap-2">
                            {myHabits.map(habit => (
                              <HabitCard
                                key={habit.id}
                                habit={habit}
                                adoptionThreshold={7}
                                onCheckIn={() => handleHabitCheckIn(habit, date, isHabitCompletedOnDate(habit.id, date))}
                                onUndoCheckIn={() => handleHabitCheckIn(habit, date, true)}
                                onMoveHabit={() => {}}
                                variant="calendar"
                                weekStartDate={weekStart}
                                isCompletedOnDate={isHabitCompletedOnDate}
                                selectedDate={date}
                                onCheckInForDate={(id, d) => handleHabitCheckIn(habit, d, isHabitCompletedOnDate(habit.id, d))}
                                onUndoCheckInForDate={(id, d) => handleHabitCheckIn(habit, d, true)}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {plannedHabits.length === 0 && completedHabits.length === 0 && myHabits.length === 0 && (
                        <div className="text-xs text-muted-foreground text-center py-2">No active habits</div>
                      )}
                    </div>
                  );
                })()}
              </PopoverContent>
            </Popover>
          );
        })}
        </div>
      </div>
    </div>
  );
};
