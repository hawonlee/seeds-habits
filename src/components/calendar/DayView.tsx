import { Card, CardContent } from "@/components/ui/card";
import { TaskCalendarItem } from "@/components/calendar/TaskCalendarItem";
import { CalendarHabitItem } from "@/components/calendar/CalendarHabitItem";
import { Calendar as CalendarIcon, CheckCircle, Circle } from "lucide-react";
import { Habit } from "@/hooks/useHabits";
import { Task, TaskList } from "@/hooks/useTasks";
import { HabitSchedule } from "@/hooks/useHabitSchedules";
import { CalendarItemWithDetails } from "@/hooks/useCalendarItems";
import React from "react";
import { HabitCard } from "@/components/habits/HabitCard";
import { useHabitCompletionsContext } from "@/components/HabitCompletionsProvider";
import { shouldHabitBeScheduledOnDate } from "./calendarFrequency";
import { CalendarDiaryItem } from "@/components/calendar/CalendarDiaryItem";
import type { Database } from "@/integrations/supabase/types";

type DiaryEntry = Database['public']['Tables']['diary_entries']['Row'];

interface DayViewProps {
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

export const DayView = ({ habits, schedules, calendarItems, diaryEntries = [], tasks = [], taskLists = [], onCheckIn, onUndoCheckIn, calendarViewMode, onViewModeChange, currentDate, onHabitDrop, onHabitUnschedule, onTaskToggleComplete, onTaskDrop, onTaskDelete, onDiaryEntryClick }: DayViewProps) => {
  const { isHabitCompletedOnDate, toggleCompletion } = useHabitCompletionsContext();
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

  const getDiaryEntriesForDate = (date: Date): DiaryEntry[] => {
    const dateString = date.toISOString().split('T')[0];
    return diaryEntries.filter(entry => entry.entry_date === dateString);
  };

  // Helper functions for calendar items
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

  const getCompletedHabits = () => {
    return habits.filter(habit => isHabitCompletedOnDate(habit.id, currentDate));
  };

  const isAfterCreatedDay = (habit: Habit, d: Date) => {
    const created = new Date(habit.created_at);
    const createdEnd = new Date(created);
    createdEnd.setHours(23, 59, 59, 999);
    return d > createdEnd;
  };

  const getActiveHabits = () => {

    // Get habits that are scheduled for this specific date
    const scheduledHabitIds = getScheduledHabitsForDate(currentDate);
    const scheduledHabits = habits.filter(habit => scheduledHabitIds.includes(habit.id));
    
    // Get habits that should appear based on their frequency (current habits only)
    const frequencyHabits = habits.filter(habit => {
      if (habit.phase !== 'current') return false;
      if (scheduledHabitIds.includes(habit.id)) return false;
      if (!isAfterCreatedDay(habit, currentDate)) return false;
      return shouldHabitBeScheduledOnDate(habit, currentDate);
    });
    
    // Combine scheduled habits and frequency-based habits
    return [...scheduledHabits, ...frequencyHabits];
  };

  const shouldHabitBeDoneOnDate = (habit: Habit, date: Date) =>
    shouldHabitBeScheduledOnDate(habit, date);

  const completedHabits = getCompletedHabits();
  const activeHabits = getActiveHabits();
  
  // Get habits that are specifically assigned to this day
  const scheduledHabitIds = getScheduledHabitsForDate(currentDate);
  const scheduledHabits = activeHabits.filter(habit => scheduledHabitIds.includes(habit.id));
  
  const frequencyHabits = activeHabits.filter(habit => {
    if (scheduledHabitIds.includes(habit.id)) return false;
    if (!isAfterCreatedDay(habit, currentDate)) return false;
    return shouldHabitBeScheduledOnDate(habit, currentDate);
  });

  const plannedHabits = [...scheduledHabits, ...frequencyHabits];
  
  // My habits are all other current habits that aren't specifically assigned to this day
  const myHabits = activeHabits.filter(habit => 
    !plannedHabits.some(p => p.id === habit.id)
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

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDateStatus = () => {
    if (isToday) return { text: "Today", color: "text-today-text", bgColor: "bg-today-bg", borderColor: "border-green-200" };
    if (isPast) return { text: "Past", color: "text-past-text", bgColor: "bg-past-bg", borderColor: "border-neutral-200" };
    return { text: "Future", color: "text-future-text", bgColor: "bg-future-bg", borderColor: "border-blue-200" };
  };

  const dateStatus = getDateStatus();

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
        onHabitDrop(habitId, currentDate);
      }
    } else if (data.startsWith('task:')) {
      const taskId = data.replace('task:', '');
      if (onTaskDrop) {
        onTaskDrop(taskId, currentDate);
      }
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
            <div className={`flex items-center justify-center rounded w-5 h-5 ${isToday ? 'bg-red-600 text-white' : 'border-transparent text-neutral-900'}`} >
              <span className="">{currentDate.getDate()}</span>
            </div>
          </div>
          {/* Quick Summary - First 4 items */}
          {(() => {
            const allItems: Array<{ type: 'habit' | 'task' | 'diary'; data: any; completed?: boolean }> = [
              ...completedHabits.map(habit => ({ type: 'habit' as const, data: habit, completed: true })),
              ...plannedHabits.map(habit => ({ type: 'habit' as const, data: habit, completed: false })),
              ...myHabits.map(habit => ({ type: 'habit' as const, data: habit, completed: false })),
              ...getTasksForDate(currentDate).map(task => ({ type: 'task' as const, data: task })),
              ...getDiaryEntriesForDate(currentDate).map(entry => ({ type: 'diary' as const, data: entry }))
            ];
            
            if (allItems.length > 0) {
              return (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-neutral-700 mb-3">Today's Overview</h3>
                  <div className="grid gap-2">
                    {allItems.map((item, index) => {
                      if (item.type === 'habit') {
                        const isScheduled = isHabitScheduledOnDate(item.data.id, currentDate);
                        return (
                          <CalendarHabitItem
                            key={item.data.id}
                            habit={item.data}
                            date={currentDate}
                            isCompleted={item.completed || false}
                            onToggle={(h, d, isDone) => handleHabitCheckIn(h, d, isDone)}
                            isScheduled={isScheduled}
                            onUnschedule={onHabitUnschedule}
                          />
                        );
                      } else if (item.type === 'task') {
                        const taskList = taskLists.find(list => list.id === item.data.task_list_id);
                        const isScheduled = getScheduledTasksFromCalendarItems(currentDate).includes(item.data.id);
                        return (
                          <TaskCalendarItem
                            key={item.data.id}
                            task={item.data}
                            date={currentDate}
                            taskList={taskList}
                            onToggleComplete={onTaskToggleComplete || (() => {})}
                            onUnschedule={(taskId, taskDate) => {
                              if (onTaskDelete) {
                                onTaskDelete(taskId, taskDate);
                              }
                            }}
                            isScheduled={isScheduled}
                          />
                        );
                      } else if (item.type === 'diary') {
                        return (
                          <CalendarDiaryItem
                            key={item.data.id}
                            entry={item.data}
                            date={currentDate}
                            onClick={onDiaryEntryClick}
                          />
                        );
                      }
                      return null;
                    })}
                  </div>
                </div>
              );
            }
            return null;
          })()}

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

          {/* Planned Habits */}
          {plannedHabits.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-neutral-700 mb-4 flex items-center gap-2">
                Planned Habits ({plannedHabits.length})
              </h3>
              <div className="grid gap-3">
                {plannedHabits.map(habit => {
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

          {/* My Habits */}
          {myHabits.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-neutral-700 mb-4 flex items-center gap-2">
                My Habits ({myHabits.length})
              </h3>
              <div className="grid gap-3">
                {myHabits.map(habit => {
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

          {/* Tasks */}
          {getTasksForDate(currentDate).length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-neutral-700 mb-4 flex items-center gap-2">
                Tasks ({getTasksForDate(currentDate).length})
              </h3>
              <div className="grid gap-3">
                {getTasksForDate(currentDate).map(task => {
                  const taskList = taskLists.find(list => list.id === task.task_list_id);
                  const isScheduled = getScheduledTasksFromCalendarItems(currentDate).includes(task.id);
                  return (
                    <div key={task.id}>
                      <TaskCalendarItem
                        task={task}
                        date={currentDate}
                        taskList={taskList}
                        onToggleComplete={onTaskToggleComplete || (() => {})}
                        onUnschedule={(taskId, taskDate) => {
                          if (onTaskDelete) {
                            onTaskDelete(taskId, taskDate);
                          }
                        }}
                        isScheduled={isScheduled}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Diary Entries */}
          {/* {getDiaryEntriesForDate(currentDate).length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-neutral-700 mb-4 flex items-center gap-2">
                Diary Entries ({getDiaryEntriesForDate(currentDate).length})
              </h3>
              <div className="grid gap-3">
                {getDiaryEntriesForDate(currentDate).map(entry => (
                  <div key={entry.id} onClick={() => onDiaryEntryClick?.(entry)} className="cursor-pointer">
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm mb-1">{entry.title}</h4>
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {entry.body}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          )} */}

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
