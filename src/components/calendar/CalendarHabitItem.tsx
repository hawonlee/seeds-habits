import { Checkbox } from "@/components/ui/checkbox";
import { Habit } from "@/hooks/useHabits";
import { getCategoryPalette } from "@/lib/categories";
import React from "react";

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

  const { bgHex, textHex } = getCategoryPalette(habit.category);

  return (
    <div
      className={`group text-xs p-1 rounded flex items-center gap-1.5 truncate`}
      title={`${habit.title}${isScheduled ? ' (Scheduled - Right-click to unschedule)' : ''}`}
      onContextMenu={handleRightClick}
      style={{ 
        backgroundColor: habit.category === 'none' ? 'transparent' : bgHex, 
        color: textHex 
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
      {isScheduled && onUnschedule && (
        <button
          className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-0.5 rounded hover:bg-black/10"
          onClick={(e) => {
            e.stopPropagation();
            onUnschedule(habit.id, date);
          }}
          aria-label="Remove"
          title="Remove from this day"
        >
          ×
        </button>
      )}
    </div>
  );
};

export default CalendarHabitItem;


