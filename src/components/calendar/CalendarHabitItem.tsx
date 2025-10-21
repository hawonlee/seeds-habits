import { Checkbox } from "@/components/ui/checkbox";
import { Habit } from "@/hooks/useHabits";
import { getCategoryCSSVariables } from "@/lib/categories";
import { findColorOptionByValue } from "@/lib/colorOptions";
import React from "react";
import { CalendarDeleteButton } from "./CalendarDeleteButton";

interface CalendarHabitItemProps {
  habit: Habit;
  date: Date;
  isCompleted: boolean;
  onToggle: (habit: Habit, date: Date, isCompleted: boolean) => void;
  isScheduled?: boolean;
  onUnschedule?: (habitId: string, date: Date) => void;
  isTimed?: boolean;
  calendarItemId?: string;
  onDeleteCalendarItem?: (calendarItemId: string) => void;
}

export const CalendarHabitItem: React.FC<CalendarHabitItemProps> = ({
  habit,
  date,
  isCompleted,
  onToggle,
  isScheduled,
  onUnschedule,
  isTimed = false,
  calendarItemId,
  onDeleteCalendarItem
}) => {
  const handleRightClick = (e: React.MouseEvent) => {
    if (isScheduled && onUnschedule) {
      e.preventDefault();
      e.stopPropagation();
      onUnschedule(habit.id, date);
    }
  };

  const cssVars = getCategoryCSSVariables(habit.category);
  const bgColor = habit.category === 'none' ? undefined : cssVars.bg;

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (calendarItemId && onDeleteCalendarItem) {
      onDeleteCalendarItem(calendarItemId);
    } else if (onUnschedule) {
      onUnschedule(habit.id, date);
    }
  };

  return (
    <div
      className={`group text-xxs rounded truncate ${isTimed ? 'relative h-full' : 'px-1 h-5 flex items-center w-full'}`}
      title={`${habit.title}${isScheduled ? ' (Scheduled - Right-click to unschedule)' : ''}`}
      onContextMenu={handleRightClick}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', `habit:${habit.id}`);
        e.dataTransfer.effectAllowed = 'move';
      }}
      style={{ 
        backgroundColor: isTimed ? 'transparent' : (habit.category === 'none' ? 'transparent' : cssVars.bg), 
        color: cssVars.primary 
      }}
    >
      {isTimed && (
        <div className="absolute inset-0 rounded" style={{ backgroundColor: bgColor, opacity: 0.35, pointerEvents: 'none' }} />
      )}
      <div className={`relative w-full justify-between ${isTimed ? 'flex items-start gap-1.5 p-1' : 'flex items-center gap-1.5'}`}>
        <Checkbox
          checked={isCompleted}
          onCheckedChange={() => onToggle(habit, date, isCompleted)}
          onClick={(e) => e.stopPropagation()}
          className="h-3.5 w-3.5 mt-0"
          customColor={"currentColor"}
        />
        <span className="truncate flex-1 text-[10px]">{habit.title}</span>
        {isScheduled && (
          <CalendarDeleteButton onClick={handleDelete} />
        )}
      </div>
    </div>
  );
};

export default CalendarHabitItem;


