import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarHeader } from "./CalendarHeader";
import { MonthView } from "./MonthView";
import { WeekView } from "./WeekView";
import { DayView } from "./DayView";
import { Habit } from "@/hooks/useHabits";
import { HabitSchedule } from "@/hooks/useHabitSchedules";
import { CalendarItemWithDetails } from "@/hooks/useCalendarItems";
import { Task, TaskList } from "@/hooks/useTasks";
import { Filter, ListFilter, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuCheckboxItem } from "@/components/ui/dropdown-menu";
import type { Database } from "@/integrations/supabase/types";
import { useUserPreferences } from "@/hooks/useUserPreferences";

type DiaryEntry = Database['public']['Tables']['diary_entries']['Row'];

interface CalendarFilter {
  habits: boolean;
  tasks: boolean;
  diaries: boolean;
}

interface UnifiedCalendarProps {
  habits: Habit[];
  schedules: HabitSchedule[];
  calendarItems: CalendarItemWithDetails[];
  diaryEntries?: DiaryEntry[];
  tasks?: Task[];
  taskLists?: TaskList[];
  onCheckIn: (id: string, date: Date) => void;
  onUndoCheckIn: (id: string, date: Date) => void;
  onDayClick: (date: Date, habits: Habit[]) => void;
  onHabitDrop?: (habitId: string, date: Date) => void;
  onHabitUnschedule?: (habitId: string, date: Date) => void;
  onTaskToggleComplete?: (taskId: string) => void;
  onTaskDrop?: (taskId: string, date: Date, isAllDay?: boolean, displayType?: 'task' | 'deadline') => void;
  onTaskUpdateTitle?: (taskId: string, title: string) => void;
  onCalendarItemToggleComplete?: (calendarItemId: string, completed: boolean) => void;
  onTaskDelete?: (taskId: string, date?: Date) => void;
  onCalendarItemDelete?: (calendarItemId: string) => void;
  onDiaryEntryClick?: (entry: DiaryEntry) => void;
  onOpenSettings?: () => void;
}

export const UnifiedCalendar = ({ habits, schedules, calendarItems, diaryEntries = [], tasks = [], taskLists = [], onCheckIn, onUndoCheckIn, onDayClick, onHabitDrop, onHabitUnschedule, onTaskToggleComplete, onTaskDrop, onTaskUpdateTitle, onCalendarItemToggleComplete, onTaskDelete, onCalendarItemDelete, onDiaryEntryClick, onOpenSettings }: UnifiedCalendarProps) => {
  // Get saved view mode from localStorage, default to 'month'
  const getInitialViewMode = (): 'month' | 'week' | 'day' => {
    const saved = localStorage.getItem('calendar-view-mode');
    if (saved && ['month', 'week', 'day'].includes(saved)) {
      return saved as 'month' | 'week' | 'day';
    }
    return 'month'; // Default to month view
  };

  const [calendarViewMode, setCalendarViewMode] = useState<'month' | 'week' | 'day'>(getInitialViewMode);
  const [currentDate, setCurrentDate] = useState(new Date());
  const { calendarFilters, setCalendarFilters, ready: prefsReady } = useUserPreferences();
  const [filter, setFilter] = useState<CalendarFilter>(calendarFilters);

  // Keep local filter in sync with preferences load
  useEffect(() => {
    setFilter(calendarFilters);
  }, [calendarFilters]);

  // Save view mode to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('calendar-view-mode', calendarViewMode);
  }, [calendarViewMode]);

  const getTitle = () => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    switch (calendarViewMode) {
      case 'month':
        return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
      case 'week':
        // Calculate week range
        // const startOfWeek = new Date(currentDate);
        // startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
        // const endOfWeek = new Date(startOfWeek);
        // endOfWeek.setDate(startOfWeek.getDate() + 6);
        
        // const startMonth = startOfWeek.toLocaleDateString('en-US', { month: 'short' });
        // const endMonth = endOfWeek.toLocaleDateString('en-US', { month: 'short' });
        // const year = startOfWeek.getFullYear();
        
        // if (startMonth === endMonth) {
        //   return `${startMonth} ${startOfWeek.getDate()}-${endOfWeek.getDate()}, ${year}`;
        // } else {
        //   return `${startMonth} ${startOfWeek.getDate()} - ${endMonth} ${endOfWeek.getDate()}, ${year}`;
        // }
        return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
      case 'day':
        return `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
      default:
        return 'Calendar';
    }
  };

  const handleViewModeChange = (mode: 'month' | 'week' | 'day') => {
    setCalendarViewMode(mode);
  };

  const handlePrevious = () => {
    const newDate = new Date(currentDate);
    switch (calendarViewMode) {
      case 'month':
        newDate.setMonth(currentDate.getMonth() - 1);
        break;
      case 'week':
        newDate.setDate(currentDate.getDate() - 7);
        break;
      case 'day':
        newDate.setDate(currentDate.getDate() - 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(currentDate);
    switch (calendarViewMode) {
      case 'month':
        newDate.setMonth(currentDate.getMonth() + 1);
        break;
      case 'week':
        newDate.setDate(currentDate.getDate() + 7);
        break;
      case 'day':
        newDate.setDate(currentDate.getDate() + 1);
        break;
    }
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleFilterChange = (key: keyof CalendarFilter) => {
    setFilter(prev => {
      const next = { ...prev, [key]: !prev[key] };
      // Persist to Supabase preferences
      setCalendarFilters(next);
      return next;
    });
  };

  const getFilteredData = () => {
    return {
      habits: habits, // Always pass all habits - needed for scheduled habits from calendar_items
      schedules: filter.habits ? schedules : [],
      calendarItems: calendarItems, // Always pass all calendar items - let views filter internally
      diaryEntries: filter.diaries ? diaryEntries : [],
      tasks: filter.tasks ? tasks : [],
      taskLists: filter.tasks ? taskLists : []
    };
  };

  const renderContent = () => {
    if (!prefsReady) {
      return (
        <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
          Loading...
        </div>
      );
    }
    const filteredData = getFilteredData();
    
    switch (calendarViewMode) {
      case 'month':
        return (
          <MonthView
            habits={filteredData.habits}
            schedules={filteredData.schedules}
            calendarItems={filteredData.calendarItems}
            diaryEntries={filteredData.diaryEntries}
            tasks={filteredData.tasks}
            taskLists={filteredData.taskLists}
            onCheckIn={onCheckIn}
            onUndoCheckIn={onUndoCheckIn}
            onDayClick={onDayClick}
            calendarViewMode={calendarViewMode}
            onViewModeChange={handleViewModeChange}
            currentDate={currentDate}
            onHabitDrop={onHabitDrop}
            onHabitUnschedule={onHabitUnschedule}
            onTaskToggleComplete={onTaskToggleComplete}
            onTaskDrop={onTaskDrop}
            onCalendarItemToggleComplete={onCalendarItemToggleComplete}
            onTaskDelete={onTaskDelete}
            onCalendarItemDelete={onCalendarItemDelete}
            onDiaryEntryClick={onDiaryEntryClick}
            showHabits={filter.habits}
            showTasks={filter.tasks}
            showDiaries={filter.diaries}
          />
        );
      case 'week':
        return (
          <WeekView
            habits={filteredData.habits}
            schedules={filteredData.schedules}
            calendarItems={filteredData.calendarItems}
            diaryEntries={filteredData.diaryEntries}
            tasks={filteredData.tasks}
            taskLists={filteredData.taskLists}
            onCheckIn={onCheckIn}
            onUndoCheckIn={onUndoCheckIn}
            // onDayClick={onDayClick}
            calendarViewMode={calendarViewMode}
            onViewModeChange={handleViewModeChange}
            currentDate={currentDate}
            onHabitDrop={onHabitDrop}
            onHabitUnschedule={onHabitUnschedule}
            onTaskToggleComplete={onTaskToggleComplete}
            onTaskDrop={onTaskDrop}
            onCalendarItemToggleComplete={onCalendarItemToggleComplete}
            onTaskDelete={onTaskDelete}
            onCalendarItemDelete={onCalendarItemDelete}
            onDiaryEntryClick={onDiaryEntryClick}
            showHabits={filter.habits}
            showTasks={filter.tasks}
            showDiaries={filter.diaries}
          />
        );
      case 'day':
        return (
          <DayView
            habits={filteredData.habits}
            schedules={filteredData.schedules}
            calendarItems={filteredData.calendarItems}
            diaryEntries={filteredData.diaryEntries}
            tasks={filteredData.tasks}
            taskLists={filteredData.taskLists}
            onCheckIn={onCheckIn}
            onUndoCheckIn={onUndoCheckIn}
            // onDayClick={onDayClick}
            calendarViewMode={calendarViewMode}
            onViewModeChange={handleViewModeChange}
            currentDate={currentDate}
            onHabitDrop={onHabitDrop}
            onHabitUnschedule={onHabitUnschedule}
            onTaskToggleComplete={onTaskToggleComplete}
            onTaskDrop={onTaskDrop}
            onTaskUpdateTitle={onTaskUpdateTitle}
            onCalendarItemToggleComplete={onCalendarItemToggleComplete}
            onTaskDelete={onTaskDelete}
            onCalendarItemDelete={onCalendarItemDelete}
            onDiaryEntryClick={onDiaryEntryClick}
            showHabits={filter.habits}
            showTasks={filter.tasks}
            showDiaries={filter.diaries}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col pt-3 bg-sidebar">
      <div className="flex items-center mb-4 flex-shrink-0 px-6">
        <CalendarHeader
          title={getTitle()}
          calendarViewMode={calendarViewMode}
          onViewModeChange={handleViewModeChange}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onToday={handleToday}
          onOpenSettings={onOpenSettings}
        />
        
        {/* Filter Controls */}
        {/* <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="flex items-center gap-2">
              <ListFilter className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuCheckboxItem
              checked={filter.habits}
              onCheckedChange={() => handleFilterChange('habits')}
            >
              Habits
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filter.tasks}
              onCheckedChange={() => handleFilterChange('tasks')}
            >
              Tasks
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={filter.diaries}
              onCheckedChange={() => handleFilterChange('diaries')}
            >
              Diaries
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu> */}
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="h-full">
          {/* Prevent flash of all items on calendar mount by using hydrated filter immediately */}
          {renderContent()}
        </div>
      </div>
    </div>
  );
};
