import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarHabitItem } from "@/components/calendar/CalendarHabitItem";
import { CalendarDiaryItem } from "@/components/calendar/CalendarDiaryItem";
import { TaskCalendarItem } from "@/components/calendar/TaskCalendarItem";
import { Calendar as CalendarIcon, CheckCircle, Circle, RotateCcw } from "lucide-react";
import { Habit } from "@/hooks/useHabits";
import { Task, TaskList } from "@/hooks/useTasks";
import { HabitCard } from "@/components/habits/HabitCard";
import { getCategoryCSSClasses } from "@/lib/categories";
import { useHabitCompletionsContext } from "@/components/HabitCompletionsProvider";
import { HabitSchedule } from "@/hooks/useHabitSchedules";
import { CalendarItemWithDetails } from "@/hooks/useCalendarItems";
import React from "react";
import { shouldHabitBeScheduledOnDate } from "./calendarFrequency";
import type { Database } from "@/integrations/supabase/types";

type DiaryEntry = Database['public']['Tables']['diary_entries']['Row'];

interface WeekViewProps {
  habits: Habit[];
  schedules: HabitSchedule[];
  calendarItems: CalendarItemWithDetails[];
  diaryEntries?: DiaryEntry[];
  tasks?: Task[];
  taskLists?: TaskList[];
  onCheckIn: (id: string, date: Date) => void;
  onUndoCheckIn: (id: string, date: Date) => void;
  calendarViewMode: 'month' | 'week' | 'day';
  onViewModeChange: (mode: 'month' | 'week' | 'day') => void;
  currentDate: Date;
  onHabitDrop?: (habitId: string, date: Date) => void;
  onHabitUnschedule?: (habitId: string, date: Date) => void;
  onTaskToggleComplete?: (taskId: string) => void;
  onTaskDrop?: (taskId: string, date: Date) => void;
  onTaskDelete?: (taskId: string, date?: Date) => void;
  onDiaryEntryClick?: (entry: DiaryEntry) => void;
}

export const WeekView = ({ habits, schedules, calendarItems, diaryEntries = [], tasks = [], taskLists = [], onCheckIn, onUndoCheckIn, calendarViewMode, onViewModeChange, currentDate, onHabitDrop, onHabitUnschedule, onTaskToggleComplete, onTaskDrop, onTaskDelete, onDiaryEntryClick }: WeekViewProps) => {
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const { isHabitCompletedOnDate, toggleCompletion } = useHabitCompletionsContext();

  // Helper functions for scheduled items
  const formatDateForDB = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getScheduledItemsForDate = (date: Date): CalendarItemWithDetails[] => {
    const scheduledDate = formatDateForDB(date);
    return calendarItems.filter(item => item.scheduled_date === scheduledDate);
  };

  const getScheduledTasksFromCalendarItems = (date: Date): string[] => {
    return getScheduledItemsForDate(date)
      .filter(item => item.item_type === 'task')
      .map(item => item.item_id);
  };

  const getScheduledHabitsFromCalendarItems = (date: Date): string[] => {
    return getScheduledItemsForDate(date)
      .filter(item => item.item_type === 'habit')
      .map(item => item.item_id);
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

  const getDiaryEntriesForDate = (date: Date): DiaryEntry[] => {
    const dateString = date.toISOString().split('T')[0];
    return diaryEntries.filter(entry => entry.entry_date === dateString);
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
    const dayOfWeek = date.getDay();

    const isAfterCreatedDay = (habit: Habit, d: Date) => {
      const created = new Date(habit.created_at);
      const createdDateOnly = new Date(created.getFullYear(), created.getMonth(), created.getDate());
      const currentDateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      return currentDateOnly >= createdDateOnly;
    };

    // Get habits that are scheduled for this specific date
    const scheduledHabitIds = getScheduledHabitsForDate(date);
    const scheduledHabits = habits.filter(habit => scheduledHabitIds.includes(habit.id));

    // Get habits that should appear based on their frequency (current habits only)
    const frequencyHabits = habits.filter(habit => {
      if (habit.phase !== 'current') return false;
      if (scheduledHabitIds.includes(habit.id)) return false;
      if (!isAfterCreatedDay(habit, date)) return false;
      return shouldHabitBeScheduledOnDate(habit, date);
    });

    // Combine scheduled habits and frequency-based habits
    return [...scheduledHabits, ...frequencyHabits];
  };

  const shouldHabitBeDoneOnDate = (habit: Habit, date: Date, dayOfWeek: number) =>
    shouldHabitBeScheduledOnDate(habit, date);

  const getCompletedHabitsForDate = (date: Date) => {
    return habits.filter(habit => isHabitCompletedOnDate(habit.id, date));
  };

  const getTasksForDate = (date: Date) => {
    if (!tasks) return [];
    const dateString = date.toISOString().split('T')[0];
    
    // Get tasks that are due on this date
    const dueTasks = tasks.filter(task => 
      task.due_date && 
      new Date(task.due_date).toISOString().split('T')[0] === dateString
    );
    
    // Get tasks that are scheduled for this date via calendar items
    const scheduledTaskIds = getScheduledTasksFromCalendarItems(date);
    const scheduledTasks = tasks.filter(task => scheduledTaskIds.includes(task.id));
    
    // Combine both, avoiding duplicates
    const allTasks = [...dueTasks];
    scheduledTasks.forEach(scheduledTask => {
      if (!allTasks.some(task => task.id === scheduledTask.id)) {
        allTasks.push(scheduledTask);
      }
    });
    
    return allTasks;
  };

  const handleHabitCheckIn = async (habit: Habit, date: Date, isCompleted: boolean) => {
    // Use the database-backed completion system
    await toggleCompletion(habit.id, date);
  };

  const getDetailedHabitsForDate = (date: Date) => {
    const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
    const isFuture = date > new Date(new Date().setHours(23, 59, 59, 999));

    const activeHabits = habits.filter(habit => habit.phase === 'current');
    const completedHabits = getCompletedHabitsForDate(date);
    
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

    const frequencyHabits = activeHabits.filter(habit => {
      if (scheduledHabitIds.includes(habit.id)) return false;
      if (!isHabitActiveOnDate(habit, date)) return false;
      return shouldHabitBeScheduledOnDate(habit, date);
    });
    
    const plannedHabits = [...scheduledHabits, ...frequencyHabits];
    
    // My habits are all other current habits that aren't specifically assigned to this day
    const myHabits = activeHabits.filter(habit => 
      !plannedHabits.some(p => p.id === habit.id) && isHabitActiveOnDate(habit, date)
    );

    return {
      activeHabits,
      completedHabits,
      plannedHabits,
      myHabits,
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
      <div className="grid grid-cols-7 gap-4 mb-4 px-1">
        {weekDates.map((date, index) => {
          const isToday = date.toDateString() === new Date().toDateString();
          const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
          const isFuture = date > new Date(new Date().setHours(23, 59, 59, 999));

          return (
            <div key={date.toISOString()} className="flex items-center justify-center gap-2">
              <div className={`
                text-xs 
                ${isToday ? 'text-foreground' : ''}
                ${isPast ? 'text-neutral-400' : ''}
                ${isFuture ? 'text-neutral-500' : ''}
                ${!isToday && !isPast && !isFuture ? 'text-muted-foreground' : ''}
              `}>
                {dayNames[index].substring(0, 3).toUpperCase()}
              </div>
              <div className={`
                text-xs flex items-center gap-1
                ${isToday ? 'text-white text-white bg-red-600 rounded w-5 h-5 flex items-center justify-center' : ''}
                ${isPast ? 'text-neutral-400' : ''}
                ${isFuture ? 'text-neutral-500' : ''}
                ${!isToday && !isPast && !isFuture ? 'text-neutral-700' : ''}
              `}>
                {date.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Week days */}
      <div className="grid grid-cols-7 overflow-hidden px-1">
        {weekDates.map((date, index) => {
          const habitsForDay = getHabitsForDate(date);
          const completedHabits = getCompletedHabitsForDate(date);
          const tasksForDay = getTasksForDate(date);
          const isToday = date.toDateString() === new Date().toDateString();
          const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
          const isFuture = date > new Date(new Date().setHours(23, 59, 59, 999));

          const handleDragOver = (e: React.DragEvent) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            e.currentTarget.classList.add('bg-future-bg', 'border-blue-300');
          };

          const handleDragLeave = (e: React.DragEvent) => {
            e.currentTarget.classList.remove('bg-future-bg', 'border-blue-300');
          };

          const handleDrop = (e: React.DragEvent) => {
            e.preventDefault();
            e.currentTarget.classList.remove('bg-future-bg', 'border-blue-300');
            const data = e.dataTransfer.getData('text/plain');
            
            if (data.startsWith('habit:')) {
              const habitId = data.replace('habit:', '');
              if (onHabitDrop) {
                onHabitDrop(habitId, date);
              }
            } else if (data.startsWith('task:')) {
              const taskId = data.replace('task:', '');
              if (onTaskDrop) {
                onTaskDrop(taskId, date);
              }
            }
          };

          return (
            <div
              key={date.toISOString()}
              className={`
                  cursor-pointer transition-colors relative
                 
                `}
              onClick={() => handleDayClick(date)}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="p-1 h-full">
                <div className={`calendar-cell-inner h-full rounded-md p-2 hover:bg-habitbghover transition-colors duration-200 flex flex-col  ${selectedDay && selectedDay.toDateString() === date.toDateString() ? 'bg-habitbghover' : 'bg-habitbg'}`}>
                  <div className="flex flex-col gap-1 min-h-20 max-h-64 overflow-y-auto">
                    {/* Combine all items and limit to 4 */}
                    {(() => {
                      const allItems: Array<{ type: 'habit' | 'task' | 'diary'; data: any }> = [
                        ...completedHabits.map(habit => ({ type: 'habit' as const, data: habit })),
                        ...habitsForDay
                          .filter(h => !completedHabits.some(c => c.id === h.id))
                          .map(habit => ({ type: 'habit' as const, data: habit })),
                        ...tasksForDay.map(task => ({ type: 'task' as const, data: task })),
                        ...getDiaryEntriesForDate(date).map(entry => ({ type: 'diary' as const, data: entry }))
                      ];
                      
                      const visibleItems = allItems.slice(0, 4);
                      const overflowCount = Math.max(0, allItems.length - 4);
                      
                      return (
                        <>
                          {visibleItems.map((item, index) => {
                            if (item.type === 'habit') {
                              return (
                                <CalendarHabitItem
                                  key={item.data.id}
                                  habit={item.data}
                                  date={date}
                                  isCompleted={isHabitCompletedOnDate(item.data.id, date)}
                                  onToggle={(h, d, isDone) => handleHabitCheckIn(h, d, isDone)}
                                  isScheduled={isHabitScheduledOnDate(item.data.id, date)}
                                  onUnschedule={onHabitUnschedule}
                                />
                              );
                            } else if (item.type === 'task') {
                              const taskList = taskLists.find(list => list.id === item.data.task_list_id);
                              return (
                                <TaskCalendarItem
                                  key={item.data.id}
                                  task={item.data}
                                  date={date}
                                  taskList={taskList}
                                  onToggleComplete={onTaskToggleComplete || (() => {})}
                                  onUnschedule={(taskId, taskDate) => {
                                    if (onTaskDelete) {
                                      onTaskDelete(taskId, taskDate);
                                    }
                                  }}
                                  isScheduled={getScheduledTasksFromCalendarItems(date).includes(item.data.id)}
                                />
                              );
                            } else if (item.type === 'diary') {
                              return (
                                <CalendarDiaryItem
                                  key={item.data.id}
                                  entry={item.data}
                                  date={date}
                                  onClick={onDiaryEntryClick}
                                />
                              );
                            }
                            return null;
                          })}
                          
                          {/* Show overflow indicator if more than 4 items */}
                          {overflowCount > 0 && (
                            <div className="text-xs text-neutral-500 text-center">
                              +{overflowCount} items
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="w-full border-t border-habitbg mt-8"></div>

      {/* Selected Day Details */}
      {selectedDay && (
        <div className="mt-4 flex-1 min-h-0 overflow-hidden">
          <Card className=" border-none h-full flex flex-col">
            <CardContent className="flex-1 overflow-auto">
              {(() => {
                const { activeHabits, completedHabits, plannedHabits, myHabits, isPast, isFuture } = getDetailedHabitsForDate(selectedDay);

                return (
                  <div className="space-y-4">

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Planned Habits column */}
                      <div>
                        <h3 className="text-xs font-medium text-neutral-500 flex items-center gap-2 mb-2">
                          Planned Habits
                        </h3>
                        <div className="grid gap-3">
                          {plannedHabits.map(habit => (
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
                              selectedDate={selectedDay}
                              onCheckInForDate={(id, d) => handleHabitCheckIn(habit, d, isHabitCompletedOnDate(habit.id, d))}
                              onUndoCheckInForDate={(id, d) => handleHabitCheckIn(habit, d, true)}
                            />
                          ))}
                        </div>
                      </div>

                      {/* My Habits column */}
                      <div>
                        <h3 className="text-xs font-medium text-neutral-500 flex items-center mb-2">
                          My Habits
                        </h3>
                        <div className="grid gap-2">
                          {myHabits.map(habit => (
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
                              selectedDate={selectedDay}
                              onCheckInForDate={(id, d) => handleHabitCheckIn(habit, d, isHabitCompletedOnDate(habit.id, d))}
                              onUndoCheckInForDate={(id, d) => handleHabitCheckIn(habit, d, true)}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* No habits message */}
                    {activeHabits.length === 0 && (
                      <div className="text-center py-12 text-muted-foreground">
                        <p className="text-sm">No active habits</p>
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
