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
import { TimeGrid } from "./TimeGrid";

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
  onTaskDrop?: (taskId: string, date: Date, isAllDay?: boolean) => void;
  onTaskDelete?: (taskId: string, date?: Date) => void;
  onCalendarItemDelete?: (calendarItemId: string) => void;
  onDiaryEntryClick?: (entry: DiaryEntry) => void;
}

export const DayView = ({ habits, schedules, calendarItems, diaryEntries = [], tasks = [], taskLists = [], onCheckIn, onUndoCheckIn, calendarViewMode, onViewModeChange, currentDate, onHabitDrop, onHabitUnschedule, onTaskToggleComplete, onTaskDrop, onTaskDelete, onCalendarItemDelete, onDiaryEntryClick }: DayViewProps) => {
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

  const getScheduledCalendarTaskItems = (date: Date): CalendarItemWithDetails[] => {
    return getScheduledItemsForDate(date)
      .filter(item => item.item_type === 'task');
  };

  const getTimedCalendarTaskItems = (date: Date): CalendarItemWithDetails[] => {
    return getScheduledCalendarTaskItems(date).filter(ci => ci.start_minutes !== null && ci.start_minutes !== undefined);
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

  // removed old getTasksForDate (not used)

  const getUntimedForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    const dueTasks = (tasks || []).filter(task => task.due_date && new Date(task.due_date).toISOString().split('T')[0] === dateString);
    const dueEntries = dueTasks.map(t => ({ task: t, calendarItemId: undefined as string | undefined }));
    const scheduledTaskItems = getScheduledCalendarTaskItems(date);
    const scheduledEntries = scheduledTaskItems
      .map(ci => {
        const t = (tasks || []).find(task => task.id === ci.item_id);
        return t ? { task: t, calendarItemId: ci.id as string | undefined } : null;
      })
      .filter(Boolean) as Array<{ task: Task; calendarItemId?: string }>; 
    const taskEntries = [...dueEntries, ...scheduledEntries];
    // Habits: already computed via plannedHabits + myHabits for the day
    const diariesForDay = getDiaryEntriesForDate(date);
    return { habits: [...plannedHabits, ...myHabits], taskEntries, diaries: diariesForDay } as any;
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
      className="flex flex-col h-full"
    >
      <div className="flex-shrink-0">
        <div className="flex text-xs items-center gap-2 px-4 mb-4">
          <div className="">
            {currentDate.toLocaleDateString('en-US', { weekday: 'long' })}
          </div>
          <div className={`flex items-center justify-center rounded w-5 h-5 ${isToday ? 'bg-red-600 text-white' : 'border-transparent text-neutral-900'}`} >
            <span className="">{currentDate.getDate()}</span>
          </div>
        </div>
      </div>

      {/* Time grid for the day */}
      <div className="flex-1 min-h-0">
        <TimeGrid
          mode="day"
          currentDate={currentDate}
          startHour={0}
          endHour={24}
          stepMinutes={30}
          untimedAreaHeight={120}
          renderUntimed={(day) => {
              const { habits: habitsForDay, taskEntries, diaries: diariesForDay } = getUntimedForDate(day) as any;
            return (
              <div className="flex flex-col gap-2">
                  {habitsForDay.map(habit => (
                  <CalendarHabitItem
                    key={`untimed-h-${habit.id}`}
                    habit={habit}
                    date={day}
                    isCompleted={isHabitCompletedOnDate(habit.id, day)}
                    onToggle={(h, d, isDone) => handleHabitCheckIn(h, d, isDone)}
                    isScheduled={isHabitScheduledOnDate(habit.id, day)}
                    onUnschedule={onHabitUnschedule}
                  />
                ))}
                  {taskEntries.map((entry: any, idx: number) => {
                    const task = entry.task as Task;
                    const taskList = taskLists?.find(list => list.id === task.task_list_id);
                  return (
                    <TaskCalendarItem
                        key={`untimed-t-${task.id}-${idx}`}
                      task={task}
                      date={day}
                      taskList={taskList}
                      onToggleComplete={onTaskToggleComplete || (() => {})}
                        onUnschedule={(taskId, taskDate) => {
                          if (onTaskDelete) onTaskDelete(taskId, taskDate);
                        }}
                        calendarItemId={entry.calendarItemId}
                        onDeleteCalendarItem={onCalendarItemDelete}
                        isScheduled={Boolean(entry.calendarItemId)}
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
            const items = getTimedCalendarTaskItems(day);
            const hoursCount = ctx.endHour - ctx.startHour;
            const totalHeight = ctx.hourRowHeight * hoursCount;
            const pxPerMinute = totalHeight / (hoursCount * 60);
            return (
              <>
                {items.map((ci) => {
                  const t = (tasks || []).find(task => task.id === ci.item_id);
                  if (!t) return null;
                  const startMin = Math.max(0, (ci.start_minutes || 0) - ctx.startHour * 60);
                  const endMin = Math.min(hoursCount * 60, (ci.end_minutes ?? (ci.start_minutes || 0) + (ctx.slotsPerHour === 2 ? 30 : 60)) - ctx.startHour * 60);
                  const top = startMin * pxPerMinute;
                  const height = Math.max(20, (endMin - startMin) * pxPerMinute);
                  return (
                    <div key={`timed-ci-${ci.id}`} className="absolute left-0 right-0 px-2 pointer-events-auto" style={{ top, height }}>
                      <TaskCalendarItem
                        task={t}
                        date={day}
                        taskList={taskLists?.find(l => l.id === t.task_list_id)}
                        onToggleComplete={onTaskToggleComplete || (() => {})}
                        onUnschedule={(taskId, taskDate) => { if (onTaskDelete) onTaskDelete(taskId, taskDate); }}
                        calendarItemId={ci.id}
                        onDeleteCalendarItem={onCalendarItemDelete}
                        isScheduled={true}
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
            if (onHabitDrop) onHabitDrop(habitId, dateTime);
          }}
        />
      </div>
    </div>
  );
};
