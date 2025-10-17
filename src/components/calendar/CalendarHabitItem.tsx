import { Checkbox } from "@/components/ui/checkbox";
import { Habit } from "@/hooks/useHabits";
import { getCategoryCSSVariables } from "@/lib/categories";
import React from "react";
import { CalendarItem } from "./CalendarItem";

interface CalendarHabitItemProps {
  habit: Habit;
  date: Date;
  isCompleted: boolean;
  onToggle: (habit: Habit, date: Date, isCompleted: boolean) => void;
  isScheduled?: boolean;
  onUnschedule?: (habitId: string, date: Date) => void;
}

export const CalendarHabitItem: React.FC<CalendarHabitItemProps> = ({
  habit,
  date,
  isCompleted,
  onToggle,
  isScheduled,
  onUnschedule
}) => {
  const handleRightClick = (e: React.MouseEvent) => {
    if (isScheduled && onUnschedule) {
      e.preventDefault();
      e.stopPropagation();
      onUnschedule(habit.id, date);
    }
  };

  const cssVars = getCategoryCSSVariables(habit.category);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUnschedule) {
      onUnschedule(habit.id, date);
    }
  };

  return (
    <CalendarItem
      className="group"
      title={`${habit.title}${isScheduled ? ' (Scheduled - Right-click to unschedule)' : ''}`}
      onContextMenu={handleRightClick}
      style={{ 
        backgroundColor: habit.category === 'none' ? 'transparent' : cssVars.bg, 
        color: cssVars.primary 
      }}
      showDeleteButton={isScheduled}
      onDelete={handleDelete}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', `habit:${habit.id}`);
        e.dataTransfer.effectAllowed = 'move';
      }}
    >
      <Checkbox
        checked={isCompleted}
        onCheckedChange={() => onToggle(habit, date, isCompleted)}
        onClick={(e) => e.stopPropagation()}
        className="h-3.5 w-3.5 mt-0"
        customColor={"currentColor"}
      />
      <span className="truncate flex-1">{habit.title}</span>
    </CalendarItem>
  );
};

export default CalendarHabitItem;


