import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarHabitItem } from "@/components/calendar/CalendarHabitItem";
import { CalendarDiaryItem } from "@/components/calendar/CalendarDiaryItem";
import { TaskCalendarItem } from "@/components/calendar/CalendarTaskItem";
import { Calendar as CalendarIcon, CheckCircle, Circle, RotateCcw } from "lucide-react";
import { Habit } from "@/hooks/useHabits";
import { Task, TaskList } from "@/hooks/useTasks";
import { HabitCard } from "@/components/habits/HabitCard";
import { getCategoryCSSClasses } from "@/lib/categories";
import { useHabitCompletionsContext } from "@/components/HabitCompletionsProvider";
import { HabitSchedule } from "@/hooks/useHabitSchedules";
import { CalendarItemWithDetails } from "@/hooks/useCalendarItems";
import React from "react";
import { findColorOptionByValue } from '@/lib/colorOptions';
import { shouldHabitBeScheduledOnDate } from "./calendarFrequency";
import { TimeGrid } from "./TimeGrid";
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

export const WeekView = ({ habits, schedules, calendarItems, diaryEntries = [], tasks = [], taskLists = [], onCheckIn, onUndoCheckIn, calendarViewMode, onViewModeChange, currentDate, onHabitDrop, onHabitUnschedule, onTaskToggleComplete, onTaskDrop, onTaskDelete, onCalendarItemDelete, onDiaryEntryClick, showHabits = true, showTasks = true, showDiaries = true }: WeekViewProps) => {
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

  const getScheduledCalendarTaskItems = (date: Date): CalendarItemWithDetails[] => {
    return getScheduledItemsForDate(date)
      .filter(item => item.item_type === 'task');
  };

  const getTimedCalendarTaskItems = (date: Date): CalendarItemWithDetails[] => {
    return getScheduledCalendarTaskItems(date).filter(ci => ci.start_minutes !== null && ci.start_minutes !== undefined);
  };

  const getTimedCalendarHabitItems = (date: Date): CalendarItemWithDetails[] => {
    return getScheduledItemsForDate(date)
      .filter(item => item.item_type === 'habit' && item.start_minutes !== null && item.start_minutes !== undefined);
  };

  const getUntimedForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    
    // Get scheduled habits from calendar_items (only untimed/all-day ones)
    const scheduledHabitIds = getScheduledItemsForDate(date)
      .filter(item => item.item_type === 'habit' && item.start_minutes == null)
      .map(item => item.item_id);
    const scheduledHabits = habits.filter(habit => scheduledHabitIds.includes(habit.id));
    
    // Get frequency-based habits (only show if showHabits is true)
    const frequencyHabits = showHabits ? getHabitsForDate(date) : [];
    
    // Combine habits: scheduled habits + frequency habits (remove duplicates)
    const allHabitsForDay = [...scheduledHabits];
    frequencyHabits.forEach(habit => {
      if (!scheduledHabits.some(sh => sh.id === habit.id)) {
        allHabitsForDay.push(habit);
      }
    });
    
    // Tasks: due that day or scheduled via calendar item (only show if showTasks is true)
    const taskEntries = showTasks ? (() => {
      const dueTasks = (tasks || []).filter(task => task.due_date && new Date(task.due_date).toISOString().split('T')[0] === dateString);
      const dueEntries = dueTasks.map(t => ({ task: t, calendarItemId: undefined as string | undefined, displayType: 'task' as const }));
      const scheduledTaskItems = getScheduledCalendarTaskItems(date).filter(ci => ci.start_minutes == null);
      const scheduledEntries = scheduledTaskItems
        .map(ci => {
          const t = (tasks || []).find(task => task.id === ci.item_id) || ci.task;
          return t ? { task: t, calendarItemId: ci.id as string | undefined, displayType: ci.display_type || 'task' } : null;
        })
        .filter(Boolean) as Array<{ task: Task; calendarItemId?: string; displayType?: 'task' | 'deadline' | null }>; 
      return [...dueEntries, ...scheduledEntries];
    })() : [];
    
    // Diary entries (only show if showDiaries is true)
    const diariesForDay = showDiaries ? getDiaryEntriesForDate(date) : [];
    
    return { habits: allHabitsForDay, taskEntries, diaries: diariesForDay } as any;
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

  // removed old getTasksForDate (not used)

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

  // Unified all-day height across the week, resizable via TimeGrid handle
  const [untimedHeight, setUntimedHeight] = useState<number>(0);
  const MAX_ALL_DAY = 240;           // max px height for all‑day area
  const ITEM_ROW_PX = 24;            // approx item height + gap
  const VERTICAL_PADDING_PX = 16;    // py-2 top+bottom

  const computeUntimedAutoHeight = () => {
    let maxCount = 0;
    weekDates.forEach((d) => {
      const u = getUntimedForDate(d) as any;
      const count = (u.habits?.length || 0) + (u.taskEntries?.length || 0) + (u.diaries?.length || 0);
      if (count > maxCount) maxCount = count;
    });
    const autoHeight = Math.max(0, VERTICAL_PADDING_PX + ITEM_ROW_PX * maxCount);
    return Math.min(MAX_ALL_DAY, autoHeight);
  };

  // Fit content until max; allow handle to increase, but never go below content height (no explicit min)
  const untimedAreaHeight = Math.min(MAX_ALL_DAY, Math.max(computeUntimedAutoHeight(), untimedHeight));

  return (
    <div className="focus:outline-none flex flex-col h-full">
      {/* Day headers above the week */}
      <div className="grid grid-cols-7 gap-4 px-1 ml-[56px]">
        {weekDates.map((date, index) => {
          const isToday = date.toDateString() === new Date().toDateString();
          const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));
          const isFuture = date > new Date(new Date().setHours(23, 59, 59, 999));

          return (
            <div key={date.toISOString()} className="flex items-center justify-center gap-2">
              <div className={`
                text-xs 
                ${isToday ? 'text-foreground' : ''}
                ${isPast || isFuture ? 'text-muted-foreground/60' : ''}
                ${!isToday && !isPast && !isFuture ? 'text-muted-foreground' : ''}
              `}>
                {dayNames[index].substring(0, 3).toUpperCase()}
              </div>
              <div className={`
                text-xs flex items-center gap-1
                ${isToday ? 'text-white text-white bg-red-600 rounded w-5 h-5 flex items-center justify-center' : ''}
                ${isPast || isFuture ? 'text-muted-foreground/60' : ''}
                ${!isToday && !isPast && !isFuture ? 'text-neutral-700' : ''}
              `}>
                {date.getDate()}
              </div>
            </div>
          );
        })}
      </div>

      {/* Time grid for the week */}
      <div className="flex-1 min-h-0">
        <TimeGrid
          mode="week"
          currentDate={currentDate}
          startHour={0}
          endHour={24}
          stepMinutes={30}
          untimedAreaHeight={untimedAreaHeight}
          resizableUntimed
          onResizeUntimed={(h) => setUntimedHeight(h)}
          renderUntimed={(day) => {
            const { habits: habitsForDay, taskEntries, diaries: diariesForDay } = getUntimedForDate(day) as any;
            const scheduledHabitIds = getScheduledHabitsForDate(day);
            return (
              <div className="flex flex-col gap-1">
                {habitsForDay.map(habit => {
                  // Find the calendar item ID for this habit if it's scheduled
                  const calendarItem = getScheduledItemsForDate(day)
                    .find(item => item.item_type === 'habit' && item.item_id === habit.id && item.start_minutes == null);
                  
                  return (
                    <CalendarHabitItem
                      key={`untimed-h-${habit.id}`}
                      habit={habit}
                      date={day}
                      isCompleted={isHabitCompletedOnDate(habit.id, day)}
                      onToggle={(h, d, isDone) => handleHabitCheckIn(h, d, isDone)}
                      isScheduled={scheduledHabitIds.includes(habit.id)}
                      onUnschedule={onHabitUnschedule}
                      calendarItemId={calendarItem?.id}
                      onDeleteCalendarItem={onCalendarItemDelete}
                    />
                  );
                })}
                {taskEntries.map((entry: any, idx: number) => {
                  const task = entry.task as Task;
                  const taskList = taskLists?.find(list => list.id === task.task_list_id);
                  return (
                    <TaskCalendarItem
                      key={`untimed-t-${task.id}-${idx}`}
                      task={task}
                      date={day}
                      taskList={taskList}
                      onToggleComplete={onTaskToggleComplete || (() => { })}
                      onUnschedule={(taskId, taskDate) => {
                        if (onTaskDelete) onTaskDelete(taskId, taskDate);
                      }}
                      calendarItemId={entry.calendarItemId}
                      onDeleteCalendarItem={onCalendarItemDelete}
                      isScheduled={Boolean(entry.calendarItemId)}
                      displayType={entry.displayType || 'task'}
                    />
                  );
                })}
                {diariesForDay.map(entry => (
                  <CalendarDiaryItem
                    key={`untimed-d-${entry.id}`}
                    entry={entry}
                    date={day}
                    onClick={onDiaryEntryClick}
                  />
                ))}
              </div>
            );
          }}
          renderTimed={(day, ctx) => {
            const taskItems = getTimedCalendarTaskItems(day);
            const habitItems = getTimedCalendarHabitItems(day);
            const hoursCount = ctx.endHour - ctx.startHour;
            const totalHeight = ctx.hourRowHeight * hoursCount;
            const pxPerMinute = totalHeight / (hoursCount * 60);
            return (
              <>
                {/* Render timed tasks */}
                {taskItems.map((ci) => {
                  const t = (tasks || []).find(task => task.id === ci.item_id) || ci.task;
                  if (!t) return null;
                  const startMin = Math.max(0, (ci.start_minutes || 0) - ctx.startHour * 60);
                  const endMin = Math.min(hoursCount * 60, (ci.end_minutes ?? (ci.start_minutes || 0) + (ctx.slotsPerHour === 2 ? 30 : 60)) - ctx.startHour * 60);
                  const top = startMin * pxPerMinute;
                  const height = Math.max(20, (endMin - startMin) * pxPerMinute);
                  const list = taskLists?.find(l => l.id === t.task_list_id);
                  return (
                    <div key={`timed-task-${ci.id}`} className="absolute left-0 right-0 pointer-events-auto rounded mx-[1px] mt-[2px]" style={{ top, height: Math.max(16, height - 2) }}>
                      <TaskCalendarItem
                        task={t}
                        date={day}
                        taskList={list}
                        onToggleComplete={onTaskToggleComplete || (() => {})}
                        onUnschedule={(taskId, taskDate) => { if (onTaskDelete) onTaskDelete(taskId, taskDate); }}
                        calendarItemId={ci.id}
                        onDeleteCalendarItem={onCalendarItemDelete}
                        isScheduled={true}
                        isTimed
                        displayType={ci.display_type || 'task'}
                      />
                    </div>
                  );
                })}
                {/* Render timed habits */}
                {habitItems.map((ci) => {
                  const h = (habits || []).find(habit => habit.id === ci.item_id);
                  if (!h) return null;
                  const startMin = Math.max(0, (ci.start_minutes || 0) - ctx.startHour * 60);
                  const endMin = Math.min(hoursCount * 60, (ci.end_minutes ?? (ci.start_minutes || 0) + (ctx.slotsPerHour === 2 ? 30 : 60)) - ctx.startHour * 60);
                  const top = startMin * pxPerMinute;
                  const height = Math.max(20, (endMin - startMin) * pxPerMinute);
                  return (
                    <div key={`timed-habit-${ci.id}`} className="absolute left-0 right-0 pointer-events-auto rounded mx-[1px] mt-[2px]" style={{ top, height: Math.max(16, height - 2) }}>
                      <CalendarHabitItem
                        habit={h}
                        date={day}
                        isCompleted={isHabitCompletedOnDate(h.id, day)}
                        onToggle={(habit, d, isDone) => handleHabitCheckIn(habit, d, isDone)}
                        isScheduled={true}
                        onUnschedule={onHabitUnschedule}
                        isTimed={true}
                        calendarItemId={ci.id}
                        onDeleteCalendarItem={onCalendarItemDelete}
                      />
                    </div>
                  );
                })}
              </>
            );
          }}
          onSlotClick={(dt) => {
            // Placeholder: later we will open a scheduler for tasks/habits with time ranges
            console.log('Clicked time slot:', dt.toString());
          }}
        onDropTask={(taskId, dateTime, isAllDay) => {
            if (onTaskDrop) onTaskDrop(taskId, dateTime, isAllDay);
          }}
        onDropHabit={(habitId, dateTime, isAllDay) => {
            if (onHabitDrop) onHabitDrop(habitId, dateTime, isAllDay);
          }}
        />
      </div>
    </div>
  );
};
