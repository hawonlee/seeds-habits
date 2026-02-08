import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Task, TaskList } from '@/hooks/useTasks';
import { findColorOptionByValue } from '@/lib/colorOptions';
import { CalendarItem } from './CalendarItem';

interface DraggableTaskItemProps {
  task: Task;
  taskList?: TaskList;
  onToggleComplete: (taskId: string) => void;
  onClick?: (task: Task) => void;
}

export const DraggableTaskItem: React.FC<DraggableTaskItemProps> = ({
  task,
  taskList,
  onToggleComplete,
  onClick
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick(task);
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    // Use consistent format with CalendarTaskItem, without specifying display type
    // so the drop zone determines it
    e.dataTransfer.setData('text/plain', `task:${task.id}`);
    e.dataTransfer.effectAllowed = 'copy';
  };

  // Get the category color for the task list
  const categoryColor = taskList ? findColorOptionByValue(taskList.color) : null;
  const textColor = categoryColor?.textHex || '#000000';

  return (
    <CalendarItem
      variant="interactive"
      className={`${task.completed ? 'opacity-60' : ''} cursor-move`}
      style={{ color: textColor }}
      onClick={handleClick}
      draggable
      onDragStart={handleDragStart}
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

export default DraggableTaskItem;
