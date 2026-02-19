import { Checkbox } from "@/components/ui/checkbox";
import { CalendarHabitItem } from "@/components/calendar/CalendarHabitItem";
import { CalendarDiaryItem } from "@/components/calendar/CalendarDiaryItem";
import { AllDayTaskSections, CalendarTaskEntry } from "@/components/calendar/AllDayTaskSections";
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
  onTaskDrop?: (
    taskId: string,
    date: Date,
    isAllDay?: boolean,
    displayType?: 'task' | 'deadline',
    options?: { endDateTime?: Date }
  ) => void;
  onTaskCreate?: (title: string, date: Date) => Promise<string | void> | string | void;
  onTaskUpdateTitle?: (taskId: string, title: string) => void;
  onCalendarItemToggleComplete?: (calendarItemId: string, completed: boolean) => void;
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
  onTaskCreate,
  onTaskUpdateTitle,
  onCalendarItemToggleComplete,
  onTaskDelete,
  onCalendarItemDelete,
  onDiaryEntryClick,
  taskLists,
  isToday,
  isCurrentMonth,
  index,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  openDateKey,
  setOpenDateKey,
  onDayClick,
  getDetailedHabitsForDate,
  getWeekStartDate,
  getScheduledHabitsFromCalendarItems,
  getScheduledItemsForDate,
  allHabits,
  showHabits,
  showTasks,
  showDiaries
}: any) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const dateKey = `${y}-${m}-${dd}`;
  const isOpen = openDateKey === dateKey;

  // Separate items by type
  const scheduledHabitIds = getScheduledHabitsFromCalendarItems(date);
  const scheduledHabits = (allHabits || []).filter((h: any) => scheduledHabitIds.includes(h.id));

  // Combine all habits
  const allHabitsForDay = [
    ...scheduledHabits.map((habit: any) => ({ type: 'habit', data: habit })),
    ...(showHabits ? habitsForDay.map((habit: any) => ({ type: 'habit', data: habit })) : [])
  ];

  // Remove duplicates
  const uniqueHabits = allHabitsForDay.filter((item, index, self) =>
    index === self.findIndex(t => t.data.id === item.data.id)
  );

  const diaryItems = showDiaries ? diaryEntriesForDay : [];
  const [newTaskTitle, setNewTaskTitle] = React.useState("");
  const [inlineCreatedTaskIds, setInlineCreatedTaskIds] = React.useState<Set<string>>(new Set());

  const handleCreateTask = async () => {
    const title = newTaskTitle.trim();
    if (!title || !onTaskCreate) return;

    const createdTaskId = await onTaskCreate(title, date);
    if (createdTaskId) {
      setInlineCreatedTaskIds((prev) => {
        const next = new Set(prev);
        next.add(createdTaskId);
        return next;
      });
    }
    setNewTaskTitle("");
  };

  return (
    <div
      className="h-full cursor-pointer transition-colors relative"
      id={`calendar-${dateKey}`}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div className="h-full border-r border-t flex flex-col p-[2px] overflow-hidden">
        {/* Top section: Deadline drop zone + Date number */}
        <div className="flex h-fit justify-between mb-1 relative">
          {/* Deadline drop zone - positioned in background */}
          <div
            data-drop-zone="deadline"
            className="absolute left-0 top-0 h-6 w-5/6 rounded transition-colors pointer-events-none z-0"
          />
          
          <div className="flex-1 relative z-10" />
          
          <div
            className={`
              flex items-center justify-center m-[1px] w-[24px] h-[24px] rounded-full relative z-10 text-xs font-medium
              ${isCurrentMonth ? 'text-foreground' : 'text-muted-foreground/50'}
              ${isToday ? 'bg-red-600 text-white' : ''}
            `}
            data-date-number
          >
            {date.getDate()}
          </div>
        </div>

        {/* Task drop zone section - at the bottom with background */}
        <div className="flex-1 relative mt-[2px]">
          {/* Task drop zone - background layer */}
          <div
            data-drop-zone="task"
            className="absolute inset-0 rounded-sm transition-colors pointer-events-none z-0"
          />
          
          {/* Task items - foreground layer */}
          <div className="relative z-10 flex flex-col h-full">
            <div className="flex flex-col">
              <AllDayTaskSections
                date={date}
                taskEntries={showTasks ? (tasksForDay as CalendarTaskEntry[]) : []}
                taskLists={taskLists}
                onTaskToggleComplete={onTaskToggleComplete}
                onTaskUpdateTitle={onTaskUpdateTitle}
                onCalendarItemToggleComplete={onCalendarItemToggleComplete}
                onTaskDelete={onTaskDelete}
                onCalendarItemDelete={onCalendarItemDelete}
                maxDeadlineItems={2}
                highlightedTaskIds={inlineCreatedTaskIds}
              />

              {/* Habits section */}
              <div className="flex flex-col gap-1 mt-1">
                {uniqueHabits.slice(0, 2).map((item, index) => {
                  const isScheduledHabit = scheduledHabitIds.includes(item.data.id);
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
                })}
              </div>

              {/* Diary items */}
              {diaryItems.slice(0, 1).map(entry => (
                <CalendarDiaryItem
                  key={entry.id}
                  entry={entry}
                  date={date}
                  onClick={onDiaryEntryClick}
                />
              ))}
            </div>

            {/* Inline add task input pinned to bottom */}
            {showTasks && (
              <div className="mt-auto pt-1">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleCreateTask();
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      e.stopPropagation();
                      setNewTaskTitle("");
                    }
                  }}
                  placeholder="+"
                  className="h-5 w-full rounded bg-transparent px-1.5 text-[11px] text-foreground placeholder:text-muted-foreground/80 hover:bg-muted/50 focus:bg-muted/50 focus:outline-none"
                />
              </div>
            )}
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

export const MonthView = ({ habits, schedules, calendarItems, diaryEntries = [], tasks = [], taskLists = [], onCheckIn, onUndoCheckIn, onDayClick, calendarViewMode, onViewModeChange, currentDate, onHabitDrop, onHabitUnschedule, onTaskToggleComplete, onTaskDrop, onTaskCreate, onTaskUpdateTitle, onCalendarItemToggleComplete, onTaskDelete, onCalendarItemDelete, onDiaryEntryClick, showHabits = true, showTasks = true, showDiaries = true }: MonthViewProps) => {
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

    const dueEntries = tasks
      .filter(task =>
        task.due_date &&
        new Date(task.due_date).toISOString().split('T')[0] === dateString
      )
      .map(task => ({
        task,
        calendarItemId: undefined as string | undefined,
        displayType: 'task' as const
      }));

    const scheduledItems = getScheduledItemsForDate(date).filter(item => item.item_type === 'task');
    const scheduledEntries = scheduledItems
      .map(item => {
        const task = tasks.find(t => t.id === item.item_id) || item.task;
        if (!task) return null;
        return {
          task,
          calendarItemId: item.id as string,
          displayType: item.display_type || 'task',
          completed: item.completed,
          createdAt: item.created_at
        };
      })
      .filter(Boolean) as Array<{ task: Task; calendarItemId: string; displayType: 'task' | 'deadline' | null; completed?: boolean; createdAt?: string }>;

    const orderedScheduledEntries = [...scheduledEntries].sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return aTime - bTime;
    });

    return [...dueEntries, ...orderedScheduledEntries];
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

            const handleDragEnter = (e: React.DragEvent) => {
              e.preventDefault();
              console.log('[MonthView] Drag entered day cell:', date.toDateString());
            };

            let dragOverCount = 0;
            const handleDragOver = (e: React.DragEvent) => {
              e.preventDefault();
              e.stopPropagation();
              e.dataTransfer.dropEffect = 'copy';
              
              // Only log occasionally to avoid spam
              dragOverCount++;
              if (dragOverCount % 20 === 0) {
                console.log('[MonthView] Drag over day cell (count:', dragOverCount, '):', date.toDateString());
              }

              const currentTarget = e.currentTarget as HTMLElement;
              const deadlineZone = currentTarget.querySelector('[data-drop-zone="deadline"]') as HTMLElement | null;
              const taskZone = currentTarget.querySelector('[data-drop-zone="task"]') as HTMLElement | null;
              const rect = currentTarget.getBoundingClientRect();
              const relativeY = e.clientY - rect.top;
              
              // Calculate if we're in the deadline zone (top section with date)
              // or task zone (bottom section)
              const dateSection = currentTarget.querySelector('[data-date-number]');
              const dateSectionHeight = dateSection?.parentElement?.getBoundingClientRect().height || 30;
              const isDeadlineZone = relativeY < dateSectionHeight;

              // Different visual feedback for deadline vs task zones
              deadlineZone?.classList.remove('bg-mutedhover');
              taskZone?.classList.remove('bg-mutedhover');
              if (isDeadlineZone) {
                deadlineZone?.classList.add('bg-mutedhover');
              } else {
                taskZone?.classList.add('bg-mutedhover');
              }
            };

            const handleDragLeave = (e: React.DragEvent) => {
              console.log('[MonthView] Drag left day cell:', date.toDateString());
              const currentTarget = e.currentTarget as HTMLElement;
              const deadlineZone = currentTarget.querySelector('[data-drop-zone="deadline"]') as HTMLElement | null;
              const taskZone = currentTarget.querySelector('[data-drop-zone="task"]') as HTMLElement | null;
              deadlineZone?.classList.remove('bg-mutedhover');
              taskZone?.classList.remove('bg-mutedhover');
              dragOverCount = 0; // Reset counter
            };

            const handleDrop = (e: React.DragEvent) => {
              e.preventDefault();
              e.stopPropagation();
              
              console.log('[MonthView] ===== DROP EVENT FIRED =====');
              
              const currentTarget = e.currentTarget as HTMLElement;
              const deadlineZone = currentTarget.querySelector('[data-drop-zone="deadline"]') as HTMLElement | null;
              const taskZone = currentTarget.querySelector('[data-drop-zone="task"]') as HTMLElement | null;
              deadlineZone?.classList.remove('bg-mutedhover');
              taskZone?.classList.remove('bg-mutedhover');
              const data = e.dataTransfer.getData('text/plain');
              
              console.log('[MonthView] Drop event:', { data, date: date.toISOString() });
              dragOverCount = 0; // Reset counter

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

              // Determine display type for tasks: top section = deadline, bottom section = task
              const rect = currentTarget.getBoundingClientRect();
              const relativeY = e.clientY - rect.top;
              const dateSection = currentTarget.querySelector('[data-date-number]');
              const dateSectionHeight = dateSection?.parentElement?.getBoundingClientRect().height || 30;
              const isDeadlineZone = relativeY < dateSectionHeight;

              if (data.startsWith('habit:')) {
                const habitId = data.replace('habit:', '');
                console.log('[MonthView] Dropping habit:', habitId, 'on', targetDate.toDateString());
                if (onHabitDrop) {
                  onHabitDrop(habitId, targetDate, true); // MonthView only has all-day drops
                }
              } else if (data.startsWith('task:')) {
                // Parse task data: format is either "task:id" or "task:id:displayType"
                const parts = data.split(':');
                const taskId = parts[1];
                const draggedDisplayType = parts[2] || null;
                const displayType = isDeadlineZone ? 'deadline' : 'task';
                
                console.log('[MonthView] Dropping task:', { taskId, targetDate: targetDate.toDateString(), displayType, draggedDisplayType });
                
                if (onTaskDrop) {
                  // Use the drop zone to determine display type (user can change it on drop)
                  onTaskDrop(taskId, targetDate, true, displayType);
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
                onTaskCreate={onTaskCreate}
                onTaskUpdateTitle={onTaskUpdateTitle}
                onCalendarItemToggleComplete={onCalendarItemToggleComplete}
                onTaskDelete={onTaskDelete}
                onCalendarItemDelete={onCalendarItemDelete}
                onDiaryEntryClick={onDiaryEntryClick}
                taskLists={taskLists}
                isToday={isToday}
                isCurrentMonth={isCurrentMonth}
                index={index}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                openDateKey={openDateKey}
                setOpenDateKey={setOpenDateKey}
                onDayClick={onDayClick}
                getDetailedHabitsForDate={getDetailedHabitsForDate}
                getWeekStartDate={getWeekStartDate}
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
