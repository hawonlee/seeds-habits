import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CalendarHeader } from "./CalendarHeader";
import { MonthView } from "./MonthView";
import { WeekView } from "./WeekView";
import { DayView } from "./DayView";
import { Habit } from "@/hooks/useHabits";
import { HabitSchedule } from "@/hooks/useHabitSchedules";

interface UnifiedCalendarProps {
  habits: Habit[];
  schedules: HabitSchedule[];
  onCheckIn: (id: string, date: Date) => void;
  onUndoCheckIn: (id: string, date: Date) => void;
  onDayClick: (date: Date, habits: Habit[]) => void;
  onHabitDrop?: (habitId: string, date: Date) => void;
  onHabitUnschedule?: (habitId: string, date: Date) => void;
}

export const UnifiedCalendar = ({ habits, schedules, onCheckIn, onUndoCheckIn, onDayClick, onHabitDrop, onHabitUnschedule }: UnifiedCalendarProps) => {
  const [calendarViewMode, setCalendarViewMode] = useState<'month' | 'week' | 'day'>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

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

  const renderContent = () => {
    switch (calendarViewMode) {
      case 'month':
        return (
          <MonthView
            habits={habits}
            schedules={schedules}
            onCheckIn={onCheckIn}
            onUndoCheckIn={onUndoCheckIn}
            onDayClick={onDayClick}
            calendarViewMode={calendarViewMode}
            onViewModeChange={handleViewModeChange}
            currentDate={currentDate}
            onHabitDrop={onHabitDrop}
            onHabitUnschedule={onHabitUnschedule}
          />
        );
      case 'week':
        return (
          <WeekView
            habits={habits}
            schedules={schedules}
            onCheckIn={onCheckIn}
            onUndoCheckIn={onUndoCheckIn}
            calendarViewMode={calendarViewMode}
            onViewModeChange={handleViewModeChange}
            currentDate={currentDate}
            onHabitDrop={onHabitDrop}
            onHabitUnschedule={onHabitUnschedule}
          />
        );
      case 'day':
        return (
          <DayView
            habits={habits}
            schedules={schedules}
            onCheckIn={onCheckIn}
            onUndoCheckIn={onUndoCheckIn}
            calendarViewMode={calendarViewMode}
            onViewModeChange={handleViewModeChange}
            currentDate={currentDate}
            onHabitDrop={onHabitDrop}
            onHabitUnschedule={onHabitUnschedule}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="">
      <div className="mb-4">
        <CalendarHeader
          title={getTitle()}
          calendarViewMode={calendarViewMode}
          onViewModeChange={handleViewModeChange}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onToday={handleToday}
        />
      </div>
      <div className="">
        {renderContent()}
      </div>
    </div>
  );
};
