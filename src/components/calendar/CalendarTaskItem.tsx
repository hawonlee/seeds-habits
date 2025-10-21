import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Task, TaskList } from '@/hooks/useTasks';
import { getCategoryCSSVariables, getIntermediaryColorFromHex } from '@/lib/categories';
import { findColorOptionByValue } from '@/lib/colorOptions';
import { CalendarDeleteButton } from './CalendarDeleteButton';

interface TaskCalendarItemProps {
  task: Task;
  date: Date;
  taskList?: TaskList;
  onToggleComplete: (taskId: string) => void;
  onUnschedule?: (taskId: string, date: Date) => void;
  onClick?: (task: Task) => void;
  isScheduled?: boolean;
  calendarItemId?: string;
  onDeleteCalendarItem?: (calendarItemId: string) => void;
  isTimed?: boolean;
}

export const TaskCalendarItem: React.FC<TaskCalendarItemProps> = ({
  task,
  date,
  taskList,
  onToggleComplete,
  onUnschedule,
  onClick,
  isScheduled = false,
  calendarItemId,
  onDeleteCalendarItem,
  isTimed = false
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick(task);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (calendarItemId && onDeleteCalendarItem) {
      onDeleteCalendarItem(calendarItemId);
    } else if (onUnschedule) {
      onUnschedule(task.id, date);
    }
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !task.completed;
  const isDueToday = task.due_date && new Date(task.due_date).toDateString() === date.toDateString();
  
  // Colors
  const textColor = taskList ? getIntermediaryColorFromHex(taskList.color) : 'hsl(var(--category-6-intermediary))';
  const cssVars = taskList ? getCategoryCSSVariables(taskList.color) : undefined;
  const textColor1 = cssVars ? cssVars.primary : 'hsl(var(--category-6-primary))';
  const bgColor = taskList ? (findColorOptionByValue(taskList.color)?.bgHex || taskList.color) : undefined;

  return (
    <div
      className={`relative  rounded group hover:bg-muted transition-colors ${isTimed ? 'h-full' : ''}`}
      style={{ color: textColor }}
      onClick={handleClick}
    >
      {isTimed && (
        <div className="absolute inset-0 rounded" style={{ backgroundColor: bgColor, opacity: 0.35, pointerEvents: 'none' }} />
      )}
      <div className="relative flex items-start gap-1.5 p-1">
        <Checkbox
          checked={task.completed}
          onCheckedChange={() => onToggleComplete(task.id)}
          onClick={(e) => e.stopPropagation()}
          className="h-3.5 w-3.5 mt-0"
          customColor={textColor}
        />
        <span className="truncate flex-1 text-[10px]">{task.title}</span>
        {isScheduled && (
          <CalendarDeleteButton onClick={handleDelete} />
        )}
      </div>
    </div>
  );
};
