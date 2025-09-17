import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarIcon, CheckCircle, Circle, RotateCcw } from "lucide-react";
import { Habit } from "@/hooks/useHabits";
import { HabitCard } from "@/components/habits/HabitCard";
import { getCategoryClasses, getCategoryById } from "@/lib/categories";
import { useHabitCompletions } from "@/hooks/useHabitCompletions";
import { HabitSchedule } from "@/hooks/useHabitSchedules";
import React from "react";

interface WeekViewProps {
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

export const WeekView = ({ habits, schedules, onCheckIn, onUndoCheckIn, calendarViewMode, onViewModeChange, currentDate, onHabitDrop, onHabitUnschedule }: WeekViewProps) => {
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
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

  const getWeekDates = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay()); // Start from Sunday

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }

    return week;
  };

  // Auto-select current day or Monday of the week when component mounts
  useEffect(() => {
    if (!selectedDay) {
      const today = new Date();
      const weekDates = getWeekDates(currentDate);
      
      // Check if today is in the current week view
      const todayInWeek = weekDates.find(date => 
        date.toDateString() === today.toDateString()
      );
      
      if (todayInWeek) {
        // If today is in the week, select today
        setSelectedDay(todayInWeek);
      } else {
        // Otherwise, select Monday of the current week
        const monday = weekDates.find(date => date.getDay() === 1);
        if (monday) {
          setSelectedDay(monday);
        }
      }
    }
  }, [currentDate, selectedDay]);

  const getHabitsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.

    const isAfterCreatedDay = (habit: Habit, d: Date) => {
      const created = new Date(habit.created_at);
      const createdEnd = new Date(created);
      createdEnd.setHours(23, 59, 59, 999);
      return d > createdEnd;
    };

    // Get habits that are scheduled for this specific date
    const scheduledHabitIds = getScheduledHabitsForDate(date);
    const scheduledHabits = habits.filter(habit => scheduledHabitIds.includes(habit.id));

    // Get habits that should appear based on their frequency (current habits only)
    const frequencyHabits = habits.filter(habit => {
      if (habit.phase === 'future') return false;
      if (habit.phase !== 'current') return false;

      // Don't include if already scheduled for this date
      if (scheduledHabitIds.includes(habit.id)) return false;

      // Do not appear on or before the creation day
      if (!isAfterCreatedDay(habit, date)) return false;

      // Check if habit should be done on this day based on frequency
      return shouldHabitBeDoneOnDate(habit, date, dayOfWeek);
    });

    // Combine scheduled habits and frequency-based habits
    return [...scheduledHabits, ...frequencyHabits];
  };

  const shouldHabitBeDoneOnDate = (habit: Habit, date: Date, dayOfWeek: number) => {
    // For now, we'll use a simple approach based on target_frequency
    // This can be enhanced later to support specific day selection

    // If habit defines explicit custom days (0=Sun..6=Sat), honor that. If the field exists
    // but is empty, do not show this habit in day grid cells.
    const hasCustomDaysField = Object.prototype.hasOwnProperty.call(habit as any, 'custom_days');
    const customDays = (habit as any).custom_days as number[] | undefined;
    if (hasCustomDaysField) {
      if (!customDays || customDays.length === 0) {
        return false; // no specific days chosen -> do not appear in day cells
      }
      return customDays.includes(dayOfWeek);
    }

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

  const getDetailedHabitsForDate = (date: Date) => {
    const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
    const isFuture = date > new Date(new Date().setHours(23, 59, 59, 999));

    const activeHabits = habits.filter(habit => habit.phase === 'current');

    // Habits that should render in day cells (scheduled or pass frequency/custom rules)
    const habitsForGrid = getHabitsForDate(date);

    // Habits that are current but not in the grid (e.g., no custom days selected)
    const nonGridHabits = activeHabits.filter(h => !habitsForGrid.some(g => g.id === h.id));

    const completedHabits = getCompletedHabitsForDate(date);
    const remainingHabits = activeHabits.filter(habit =>
      !completedHabits.some(completed => completed.id === habit.id)
    );

    return {
      activeHabits,
      completedHabits,
      remainingHabits,
      nonGridHabits,
      isPast,
      isFuture
    };
  };

  const weekDates = getWeekDates(currentDate);
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const formatWeekRange = () => {
    const start = weekDates[0];
    const end = weekDates[6];
    const startMonth = start.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = end.toLocaleDateString('en-US', { month: 'short' });
    const year = start.getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth} ${start.getDate()}-${end.getDate()}, ${year}`;
    } else {
      return `${startMonth} ${start.getDate()} - ${endMonth} ${end.getDate()}, ${year}`;
    }
  };

  const handleDayClick = (date: Date) => {
    setSelectedDay(date);
  };

  return (
    <div className="focus:outline-none flex flex-col h-full">
      {/* Day headers above the week */}
      <div className="grid grid-cols-7 gap-4 mb-4">
        {weekDates.map((date, index) => {
          const isToday = date.toDateString() === new Date().toDateString();
          const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
          const isFuture = date > new Date(new Date().setHours(23, 59, 59, 999));

          return (
            <div key={date.toISOString()} className="flex items-center justify-center gap-2">
              <div className={`
                text-xs 
                ${isToday ? 'text-primary' : ''}
                ${isPast ? 'text-gray-400' : ''}
                ${isFuture ? 'text-gray-500' : ''}
                ${!isToday && !isPast && !isFuture ? 'text-gray-600' : ''}
              `}>
                {dayNames[index].substring(0, 3).toUpperCase()}
              </div>
              <div className={`
                text-xs flex items-center gap-1
                ${isToday ? 'text-white text-white bg-red-600 rounded w-5 h-5 flex items-center justify-center' : ''}
                ${isPast ? 'text-gray-400' : ''}
                ${isFuture ? 'text-gray-500' : ''}
                ${!isToday && !isPast && !isFuture ? 'text-gray-700' : ''}
              `}>
                {date.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Week days */}
      <div className="grid grid-cols-7 border border-gray-200 overflow-hidden">
        {weekDates.map((date, index) => {
          const habitsForDay = getHabitsForDate(date);
          const completedHabits = getCompletedHabitsForDate(date);
          const isToday = date.toDateString() === new Date().toDateString();
          const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
          const isFuture = date > new Date(new Date().setHours(23, 59, 59, 999));

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

          return (
            <div
              key={date.toISOString()}
              className={`
                  aspect-square border-r border-b border-gray-200 cursor-pointer transition-colors relative
                  ${selectedDay && selectedDay.toDateString() === date.toDateString() ? 'bg-gray-100 focus:outline-none' : ''}
                  ${index % 7 === 6 ? 'border-r-0' : ''}
                  ${index >= 0 ? 'border-b-0' : ''}
                `}
              onClick={() => handleDayClick(date)}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="p-2 h-full flex flex-col">
                <div className="flex-1 flex flex-col gap-1 overflow-hidden">
                  {/* Completed Habits */}
                  {completedHabits.slice(0, 3).map(habit => {
                    const isScheduled = isHabitScheduledOnDate(habit.id, date);
                    const handleRightClick = (e: React.MouseEvent) => {
                      if (isScheduled && onHabitUnschedule) {
                        e.preventDefault();
                        e.stopPropagation();
                        onHabitUnschedule(habit.id, date);
                      }
                    };
                    return (
                      <div
                        key={habit.id}
                        className={`text-xs p-1 rounded flex items-center gap-1 ${getCategoryClasses(habit.category).bgColor} ${getCategoryClasses(habit.category).textColor}`}
                        title={`${habit.title}${isScheduled ? ' (Scheduled - Right-click to unschedule)' : ''}`}
                        onContextMenu={handleRightClick}
                      >
                        <Checkbox
                          checked={isHabitCompletedOnDate(habit.id, date)}
                          onCheckedChange={() => handleHabitCheckIn(habit, date, isHabitCompletedOnDate(habit.id, date))}
                          onClick={(e) => e.stopPropagation()}
                          className="h-4 w-4 mt-0"
                          customColor={getCategoryById(habit.category)?.color || '#6B7280'}
                        />
                        <span className="truncate">{habit.title}</span>
                      </div>
                    );
                  })}

                  {/* Remaining Habits */}
                  {habitsForDay
                    .filter(h => !completedHabits.some(c => c.id === h.id))
                    .slice(0, 3 - completedHabits.length)
                    .map(habit => {
                      const isScheduled = isHabitScheduledOnDate(habit.id, date);
                      const handleRightClick = (e: React.MouseEvent) => {
                        if (isScheduled && onHabitUnschedule) {
                          e.preventDefault();
                          e.stopPropagation();
                          onHabitUnschedule(habit.id, date);
                        }
                      };
                      return (
                        <div
                          key={habit.id}
                          className={`text-xs p-1 rounded flex items-center gap-1 ${getCategoryClasses(habit.category).bgColor} ${getCategoryClasses(habit.category).textColor}`}
                          title={`${habit.title}${isScheduled ? ' (Scheduled - Right-click to unschedule)' : ''}`}
                          onContextMenu={handleRightClick}
                        >
                          <Checkbox
                            checked={isHabitCompletedOnDate(habit.id, date)}
                            onCheckedChange={() => handleHabitCheckIn(habit, date, isHabitCompletedOnDate(habit.id, date))}
                            onClick={(e) => e.stopPropagation()}
                            className="h-4 w-4 mt-0"
                            customColor={getCategoryById(habit.category)?.color || '#6B7280'}
                          />
                          <span className="truncate">{habit.title}</span>
                        </div>
                      );
                    })}

                  {/* Overflow indicator */}
                  {habitsForDay.length > 3 && (
                    <div className="text-xs text-gray-500 text-center">
                      +{habitsForDay.length - 3} more
                    </div>
                  )}

                  {/* No habits */}
                  {/* {habitsForDay.length === 0 && (
                      <div className="text-xs text-muted-foreground text-center py-2">
                        No habits
                      </div>
                    )} */}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Day Details */}
      {selectedDay && (
        <div className="mt-4 flex-1 min-h-0 overflow-hidden">
          <Card className="bg-white border-none">
            <CardContent className="h-full overflow-auto">
              {(() => {
                const { activeHabits, completedHabits, remainingHabits, nonGridHabits, isPast, isFuture } = getDetailedHabitsForDate(selectedDay);

                return (
                  <div className="space-y-4">

                    <h3 className="text-xs font-medium text-gray-700 flex items-center gap-2">
                      Planned Habits
                    </h3>
                    
                    <div className="space-y-2">
                      {/* Remaining Habits */}
                      {remainingHabits.length > 0 && (
                        <div>
                          <div className="grid gap-3">
                            {remainingHabits.map(habit => (
                              <HabitCard
                                key={habit.id}
                                habit={habit}
                                adoptionThreshold={7}
                                onCheckIn={(id) => handleHabitCheckIn(habit, selectedDay, isHabitCompletedOnDate(habit.id, selectedDay))}
                                onUndoCheckIn={() => handleHabitCheckIn(habit, selectedDay, true)}
                                onMoveHabit={() => { }}
                                variant="week"
                                weekStartDate={weekDates[0]}
                                isCompletedOnDate={isHabitCompletedOnDate}
                              />
                            ))}
                          </div>
                        </div>
                      )}
  
                      {/* Completed Habits */}
                      {completedHabits.length > 0 && (
                        <div>
                          <div className="grid gap-3">
                            {completedHabits.map(habit => (
                              <HabitCard
                                key={habit.id}
                                habit={habit}
                                adoptionThreshold={7}
                                onCheckIn={(id) => handleHabitCheckIn(habit, selectedDay, isHabitCompletedOnDate(habit.id, selectedDay))}
                                onUndoCheckIn={() => handleHabitCheckIn(habit, selectedDay, true)}
                                onMoveHabit={() => { }}
                                variant="week"
                                weekStartDate={weekDates[0]}
                                isCompletedOnDate={isHabitCompletedOnDate}
                              />
                            ))}
                          </div>
                        </div>
                      )}
  
  
                    </div>
                   


                    {/* Non-grid habits (no custom days selected) */}
                    {nonGridHabits.length > 0 && (
                      <div className="space-y-2">
                        <h3 className="text-xs font-medium text-gray-700 flex items-center">
                          My Habits
                        </h3>
                        <div className="grid gap-2">
                          {nonGridHabits.map(habit => (
                            <HabitCard
                              key={habit.id}
                              habit={habit}
                              adoptionThreshold={7}
                              onCheckIn={(id) => handleHabitCheckIn(habit, selectedDay, isHabitCompletedOnDate(habit.id, selectedDay))}
                              onUndoCheckIn={() => handleHabitCheckIn(habit, selectedDay, true)}
                              onMoveHabit={() => {}}
                              variant="week"
                              weekStartDate={weekDates[0]}
                              isCompletedOnDate={isHabitCompletedOnDate}
                            />
                          ))}
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
                );
              })()}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
