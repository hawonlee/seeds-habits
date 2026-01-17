import { Checkbox } from "@/components/ui/checkbox";
import { CalendarHabitItem } from "@/components/calendar/CalendarHabitItem";
import { CalendarDiaryItem } from "@/components/calendar/CalendarDiaryItem";
import { TaskCalendarItem } from "@/components/calendar/CalendarTaskItem";
import { Habit } from "@/hooks/useHabits";
import { Task, TaskList } from "@/hooks/useTasks";
import { getCategoryCSSClasses } from "@/lib/categories";
import { useHabitCompletionsContext } from "@/components/HabitCompletionsProvider";
import { HabitSchedule } from "@/hooks/useHabitSchedules";
import { CalendarItemWithDetails } from "@/hooks/useCalendarItems";
import React, { useRef, useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HabitCard } from "@/components/habits/HabitCard";
import { shouldHabitBeScheduledOnDate } from "./calendarFrequency";
import type { Database } from "@/integrations/supabase/types";
import { Separator } from "@radix-ui/react-separator";

type DiaryEntry = Database['public']['Tables']['diary_entries']['Row'];

interface MonthViewProps {
  habits: Habit[];
  schedules: HabitSchedule[];
  calendarItems: CalendarItemWithDetails[];
  diaryEntries?: DiaryEntry[];
  tasks?: Task[];
  taskLists?: TaskList[];
  onCheckIn: (id: string, date: Date) => void;
  onUndoCheckIn: (id: string, date: Date) => void;
  onDayClick: (date: Date, habits: Habit[]) => void;
  calendarViewMode: 'month' | 'week' | 'day';
  onViewModeChange: (mode: 'month' | 'week' | 'day') => void;
  currentDate: Date;
  onHabitDrop?: (habitId: string, date: Date, isAllDay?: boolean) => void;
  onHabitUnschedule?: (habitId: string, date: Date) => void;
  onTaskToggleComplete?: (taskId: string) => void;
  onTaskDrop?: (taskId: string, date: Date, isAllDay?: boolean) => void;
  onTaskDelete?: (taskId: string, date?: Date) => void;
  onCalendarItemDelete?: (calendarItemId: string) => void;
  onDiaryEntryClick?: (entry: DiaryEntry) => void;
  showHabits?: boolean;
  showTasks?: boolean;
  showDiaries?: boolean;
}

// Component to handle overflow detection for day cells
  const DayCell = ({ 
  date, 
  habitsForDay, 
  tasksForDay, 
  diaryEntriesForDay, 
  isHabitCompletedOnDate, 
  isHabitScheduledOnDate, 
  handleHabitCheckIn, 
  onHabitUnschedule, 
  onTaskToggleComplete, 
  onTaskDrop,
  onTaskDelete,
  onCalendarItemDelete,
  onDiaryEntryClick, 
  taskLists,
  isToday,
  isCurrentMonth,
  index,
  onDragOver,
  onDragLeave,
  onDrop,
  openDateKey,
  setOpenDateKey,
  onDayClick,
  getDetailedHabitsForDate,
  getWeekStartDate,
    getScheduledTasksFromCalendarItems,
    getScheduledHabitsFromCalendarItems,
    getScheduledItemsForDate,
    allHabits,
    showHabits,
    showTasks,
    showDiaries
}: any) => {
  const contentRef = useRef<HTMLDivElement>(null);

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const dateKey = `${y}-${m}-${dd}`;
  const isOpen = openDateKey === dateKey;

  return (
    // <Popover
    //   key={`cell-${y}-${m}-${index}`}
    //   open={isOpen}
    //   onOpenChange={(open) => {
    //     setOpenDateKey(open ? dateKey : null);
    //     if (open) onDayClick(date, habitsForDay);
    //   }}
    // >
    //   <PopoverTrigger asChild>
        <div
          className={`
            h-full cursor-pointer transition-colors relative
          `}
          id={`calendar-${dateKey}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <div className="h-full">
            <div className="calendar-cell-inner h-full border-r border-t flex flex-col py-2 px-1">
              {/* Date number */}
              <div className="flex items-center justify-end mb-1">
                <div className={`
                  text-xs font-medium p-1
                  ${isToday ? 'text-white bg-red-600 rounded-full w-6 h-6 flex items-center justify-center' : ''}
                  ${!isToday && isCurrentMonth ? 'text-foreground' : ''}
                  ${!isToday && !isCurrentMonth ? 'text-muted-foreground/50' : ''}
                `}>
                  {date.getDate()}
                </div>
              </div>

              {/* Content with max 4 items limit */}
              <div ref={contentRef} className="flex-1 flex flex-col overflow-hidden">
                {/* Combine all items and limit to 4 */}
                {(() => {
                  // Build items similarly to tasks: include scheduled habits from calendar_items
                  const scheduledHabitIds = getScheduledHabitsFromCalendarItems(date);
                  const scheduledHabits = (allHabits || []).filter((h: any) => scheduledHabitIds.includes(h.id));

                  // Combine all habits: scheduled habits from calendar_items + planned habits for this date
                  const allHabitsForDay = [
                    ...scheduledHabits.map((habit: any) => ({ type: 'habit', data: habit })),
                    ...(showHabits ? habitsForDay.map((habit: any) => ({ type: 'habit', data: habit })) : [])
                  ];
                  
                  // Remove duplicates (in case a habit is both scheduled and planned)
                  const uniqueHabits = allHabitsForDay.filter((item, index, self) => 
                    index === self.findIndex(t => t.data.id === item.data.id)
                  );

                  const allItems = [
                    ...uniqueHabits,
                    ...(showTasks ? tasksForDay.map(task => ({ type: 'task', data: task })) : []),
                    ...(showDiaries ? diaryEntriesForDay.map(entry => ({ type: 'diary', data: entry })) : [])
                  ];

                  
                  const visibleItems = allItems.slice(0, 4);
                  const overflowCount = Math.max(0, allItems.length - 4);
                  
                  return (
                    <>
                      {visibleItems.map((item, index) => {
                        
                        if (item.type === 'habit') {
                          const isScheduledHabit = scheduledHabitIds.includes(item.data.id);
                          
                          // Find the calendar item ID for this habit if it's scheduled
                          const calendarItem = getScheduledItemsForDate(date)
                            .find(calendarItem => calendarItem.item_type === 'habit' && calendarItem.item_id === item.data.id && calendarItem.start_minutes == null);
                          
                          return (
                            <CalendarHabitItem
                              key={`habit-${item.data.id}-${dateKey}`}
                              habit={item.data}
                              date={date}
                              isCompleted={isHabitCompletedOnDate(item.data.id, date)}
                              onToggle={(h, d, isDone) => handleHabitCheckIn(h, d, isDone)}
                              isScheduled={isScheduledHabit}
                              onUnschedule={onHabitUnschedule}
                              calendarItemId={calendarItem?.id}
                              onDeleteCalendarItem={onCalendarItemDelete}
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
                                // Only unschedule if it's a scheduled task (not due_date)
                                const isScheduledTask = getScheduledTasksFromCalendarItems(taskDate).includes(taskId);
                                if (isScheduledTask && onTaskDelete) {
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
                        <div className="text-xxs text-muted-foreground text-center">
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
      // </PopoverTrigger>
      // <PopoverContent side="right" align="start" className="w-[420px] p-3">
      //   {(() => {
      //     const { completedHabits, plannedHabits, myHabits, isFuture } = getDetailedHabitsForDate(date);
      //     const weekStart = getWeekStartDate(date);
      //     return (
      //       <div className="space-y-3">
      //         <div className="text-xs font-medium text-foreground">
      //           {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      //         </div>

      //         {plannedHabits.length > 0 && (
      //           <div className="space-y-2">
      //             <div className="text-xs text-foreground">Habits</div>
      //             <div className="grid gap-2">
      //               {plannedHabits.map(habit => (
      //                 <CalendarHabitItem
      //                   key={habit.id}
      //                   habit={habit}
      //                   date={date}
      //                   isCompleted={isHabitCompletedOnDate(habit.id, date)}
      //                   onToggle={(h, d, isDone) => handleHabitCheckIn(h, d, isDone)}
      //                   isScheduled={isHabitScheduledOnDate(habit.id, date)}
      //                   onUnschedule={onHabitUnschedule}
      //                 />
      //               ))}
      //             </div>
      //           </div>
      //         )}

      //         {/* {myHabits.length > 0 && (
      //           <div className="space-y-2">
      //             <div className="text-xs text-neutral-700">My Habits</div>
      //             <div className="grid gap-2">
      //               {myHabits.map(habit => (
      //                 <CalendarHabitItem
      //                   key={habit.id}
      //                   habit={habit}
      //                   date={date}
      //                   isCompleted={isHabitCompletedOnDate(habit.id, date)}
      //                   onToggle={(h, d, isDone) => handleHabitCheckIn(h, d, isDone)}
      //                   isScheduled={isHabitScheduledOnDate(habit.id, date)}
      //                   onUnschedule={onHabitUnschedule}
      //                 />
      //               ))}
      //             </div>
      //           </div>
      //         )} */}

      //         {tasksForDay && tasksForDay.length > 0 && (
      //           <div className="space-y-2">
      //             <div className="text-xs font-normaltext-foreground">Tasks</div>
      //             <div className="grid gap-2">
      //               {tasksForDay.map(task => {
      //                 const taskList = taskLists.find(list => list.id === task.task_list_id);
      //                 const scheduledIds = getScheduledTasksFromCalendarItems(date);
      //                 const isScheduled = scheduledIds.includes(task.id);
      //                 return (
      //                   <TaskCalendarItem
      //                     key={task.id}
      //                     task={task}
      //                     date={date}
      //                     taskList={taskList}
      //                     onToggleComplete={onTaskToggleComplete || (() => {})}
      //                     onUnschedule={(taskId, taskDate) => {
      //                       if (isScheduled && onTaskDelete) {
      //                         onTaskDelete(taskId, taskDate);
      //                       }
      //                     }}
      //                     isScheduled={isScheduled}
      //                   />
      //                 );
      //               })}
      //             </div>
      //           </div>
      //         )}

      //         {diaryEntriesForDay && diaryEntriesForDay.length > 0 && (
      //           <div className="space-y-2">
      //             <div className="text-xs font-normal text-foreground">Diary</div>
      //             <div className="grid gap-2">
      //               {diaryEntriesForDay.map(entry => (
      //                 <CalendarDiaryItem
      //                   key={entry.id}
      //                   entry={entry}
      //                   date={date}
      //                   onClick={onDiaryEntryClick}
      //                 />
      //               ))}
      //             </div>
      //           </div>
      //         )}

      //         {plannedHabits.length === 0 && completedHabits.length === 0 && myHabits.length === 0 && (tasksForDay?.length ?? 0) === 0 && (diaryEntriesForDay?.length ?? 0) === 0 && (
      //           <div className="text-xs text-muted-foreground text-center py-2">No items</div>
      //         )}
      //       </div>
      //     );
      //   })()}
      // </PopoverContent>
    // </Popover>
  );
};

export const MonthView = ({ habits, schedules, calendarItems, diaryEntries = [], tasks = [], taskLists = [], onCheckIn, onUndoCheckIn, onDayClick, calendarViewMode, onViewModeChange, currentDate, onHabitDrop, onHabitUnschedule, onTaskToggleComplete, onTaskDrop, onTaskDelete, onCalendarItemDelete, onDiaryEntryClick, showHabits = true, showTasks = true, showDiaries = true }: MonthViewProps) => {
  const { isHabitCompletedOnDate, toggleCompletion } = useHabitCompletionsContext();
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

  // Get scheduled items from calendar_items table
  const getScheduledItemsForDate = (date: Date): CalendarItemWithDetails[] => {
    const scheduledDate = formatDateForDB(date);
    return calendarItems.filter(item => item.scheduled_date === scheduledDate);
  };

  const getScheduledHabitsFromCalendarItems = (date: Date): string[] => {
    return getScheduledItemsForDate(date)
      .filter(item => item.item_type === 'habit')
      .map(item => item.item_id);
  };

  const getScheduledTasksFromCalendarItems = (date: Date): string[] => {
    return getScheduledItemsForDate(date)
      .filter(item => item.item_type === 'task')
      .map(item => item.item_id);
  };

  const getDiaryEntriesForDate = (date: Date): DiaryEntry[] => {
    const dateString = date.toISOString().split('T')[0];
    return diaryEntries.filter(entry => entry.entry_date === dateString);
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

  const shouldHabitBeDoneOnDate = (habit: Habit, date: Date) => {
    return shouldHabitBeScheduledOnDate(habit, date);
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
    // Include any scheduled habits regardless of phase (future/current/adopted)
    const scheduledHabitIds = [...getScheduledHabitsForDate(date), ...getScheduledHabitsFromCalendarItems(date)];
    const scheduledHabits = habits.filter(habit => 
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

  const getTasksForDate = (date: Date) => {
    if (!tasks) return [];
    const dateString = date.toISOString().split('T')[0];
    
    // Get tasks with due_date matching this date
    const dueDateTasks = tasks.filter(task => 
      task.due_date && 
      new Date(task.due_date).toISOString().split('T')[0] === dateString
    );
    
    // Get tasks scheduled for this date via calendar_items
    const scheduledTaskIds = getScheduledTasksFromCalendarItems(date);
    const scheduledTasks = tasks.filter(task => scheduledTaskIds.includes(task.id));
    
    // Combine both types of tasks, removing duplicates
    const allTasks = [...dueDateTasks, ...scheduledTasks];
    const uniqueTasks = allTasks.filter((task, index, self) => 
      index === self.findIndex(t => t.id === task.id)
    );
    
    return uniqueTasks;
  };


  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  return (
    <div className="w-full h-full focus:outline-none flex flex-col">
      {/* Day headers above the table */}
      <div className="grid grid-cols-7 mb-2 px-1 flex-shrink-0">
        {dayNames.map(day => (
          <div key={day} className="text-center text-xs font-normal text-muted-foreground">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid fills remaining height */}
      <div className="flex-1 min-h-0 overflow-hidden focus:outline-none">
        <div
          className="grid grid-cols-7 border-r border-b border-border h-full"
          style={{ gridTemplateRows: `repeat(${Math.ceil(days.length / 7)}, minmax(0, 1fr))` }}
        >
        {/* Calendar days */}
        {days.map((date, index) => {
          const habitsForDay = getHabitsForDate(date);
          const completedHabits = getCompletedHabitsForDate(date);
          const tasksForDay = getTasksForDate(date);
          const diaryEntriesForDay = getDiaryEntriesForDate(date);
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
            e.currentTarget.classList.add('bg-future-bg', 'border-blue-300');
          };

          const handleDragLeave = (e: React.DragEvent) => {
            e.currentTarget.classList.remove('bg-future-bg', 'border-blue-300');
          };

          const handleDrop = (e: React.DragEvent) => {
            e.preventDefault();
            e.currentTarget.classList.remove('bg-future-bg', 'border-blue-300');
            const data = e.dataTransfer.getData('text/plain');
            // Determine target date from drop zone id when available
            const targetId = (e.currentTarget as HTMLElement).id || '';
            let targetDate = date;
            const match = targetId.match(/^calendar-(\d{4}-\d{2}-\d{2})$/);
            if (match) {
              const [yStr, mStr, dStr] = match[1].split('-');
              const yr = parseInt(yStr, 10);
              const mo = parseInt(mStr, 10) - 1;
              const dy = parseInt(dStr, 10);
              const d = new Date(yr, mo, dy);
              d.setHours(12, 0, 0, 0);
              targetDate = d;
            }

            if (data.startsWith('habit:')) {
              const habitId = data.replace('habit:', '');
              if (onHabitDrop) {
                onHabitDrop(habitId, targetDate, true); // MonthView only has all-day drops
              }
            } else if (data.startsWith('task:')) {
              const taskId = data.replace('task:', '');
              if (onTaskDrop) {
                onTaskDrop(taskId, targetDate, true); // MonthView only has all-day drops
              }
            }
          };

          return (
            <DayCell
              key={`cell-${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${index}`}
              date={date}
              habitsForDay={habitsForDay}
              tasksForDay={tasksForDay}
              diaryEntriesForDay={diaryEntriesForDay}
              isHabitCompletedOnDate={isHabitCompletedOnDate}
              isHabitScheduledOnDate={isHabitScheduledOnDate}
              handleHabitCheckIn={handleHabitCheckIn}
              onHabitUnschedule={onHabitUnschedule}
              onTaskToggleComplete={onTaskToggleComplete}
              onTaskDrop={onTaskDrop}
              onTaskDelete={onTaskDelete}
              onCalendarItemDelete={onCalendarItemDelete}
              onDiaryEntryClick={onDiaryEntryClick}
              taskLists={taskLists}
              isToday={isToday}
              isCurrentMonth={isCurrentMonth}
              index={index}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              openDateKey={openDateKey}
              setOpenDateKey={setOpenDateKey}
              onDayClick={onDayClick}
              getDetailedHabitsForDate={getDetailedHabitsForDate}
              getWeekStartDate={getWeekStartDate}
              getScheduledTasksFromCalendarItems={getScheduledTasksFromCalendarItems}
              getScheduledHabitsFromCalendarItems={getScheduledHabitsFromCalendarItems}
              getScheduledItemsForDate={getScheduledItemsForDate}
              allHabits={habits}
              showHabits={showHabits}
              showTasks={showTasks}
              showDiaries={showDiaries}
            />
          );
        })}
        </div>
      </div>
    </div>
  );
};
