import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Task, TaskList } from '@/hooks/useTasks';
import { getIntermediaryColorFromHex } from '@/lib/categories';
import { CalendarItem } from './CalendarItem';

interface TaskCalendarItemProps {
  task: Task;
  date: Date;
  taskList?: TaskList;
  onToggleComplete: (taskId: string) => void;
  onUnschedule?: (taskId: string, date: Date) => void;
  onClick?: (task: Task) => void;
  isScheduled?: boolean;
}

export const TaskCalendarItem: React.FC<TaskCalendarItemProps> = ({
  task,
  date,
  taskList,
  onToggleComplete,
  onUnschedule,
  onClick,
  isScheduled = false
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick(task);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUnschedule) {
      onUnschedule(task.id, date);
    }
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !task.completed;
  const isDueToday = task.due_date && new Date(task.due_date).toDateString() === date.toDateString();
  
  // Get the intermediary color for the task list
  const textColor = taskList ? getIntermediaryColorFromHex(taskList.color) : 'hsl(var(--category-6-intermediary))';

  return (
    <CalendarItem
      variant="interactive"
      className={`${task.completed ? 'opacity-60' : ''} group`}
      style={{ color: textColor }}
      onClick={handleClick}
      showDeleteButton={isScheduled}
      onDelete={handleDelete}
    >
      <Checkbox
        checked={task.completed}
        onCheckedChange={() => onToggleComplete(task.id)}
        onClick={(e) => e.stopPropagation()}
        className="h-3.5 w-3.5 mt-0"
        customColor={textColor}
      />
      <span className="truncate flex-1">
        {task.title}
      </span>
    </CalendarItem>
  );
};
