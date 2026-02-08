import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { TaskDetailsPopup } from './TaskDetailsPopup';
import type { Task } from '@/hooks/useTasks';

interface TaskItemProps {
  task: Task;
  listColor: string;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  onToggleComplete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
}

export const TaskItem: React.FC<TaskItemProps> = ({
  task,
  listColor,
  containerRef,
  onToggleComplete,
  onEdit,
  onUpdate,
  onDelete
}) => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0, width: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleToggleComplete = () => {
    onToggleComplete(task.id);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-prevent-click]')) return;
    
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();
      const containerWidth = containerRef?.current
        ? containerRef.current.getBoundingClientRect().width
        : null;
      const offsetTop = -4;
      const offsetLeft = -4;
      setPopupPosition({
        top: rect.top + offsetTop,
        left: rect.left + offsetLeft,
        width: containerWidth ?? Math.max(rect.width, 300)
      });
    }
    setIsPopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
  };

  const truncateNotes = (notes: string, maxLength: number = 50) =>
    notes.length > maxLength ? notes.substring(0, maxLength) + '…' : notes;

  const formatDateOnly = (dateString: string) => {
    // If it's already a date-only string (YYYY-MM-DD), use it directly
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-');
      return format(new Date(parseInt(year), parseInt(month) - 1, parseInt(day)), 'MMM d');
    }
    // Otherwise, parse as ISO string
    return format(new Date(dateString), 'MMM d');
  };

  return (
    <>
      <div
        ref={cardRef}
        className="transition-all duration-200 hover:bg-button-ghost-hover/40 rounded-sm px-1 flex items-center cursor-pointer"
        onClick={handleCardClick}
      >
        <div className="flex items-start gap-2 w-full">
          {/* Checkbox */}
          <div data-prevent-click>
            <Checkbox
              checked={task.completed}
              onCheckedChange={handleToggleComplete}
              customColor={listColor}
            />
          </div>

          {/* Drag from anywhere in the row via ReorderableList external drag */}

          {/* Task Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 mt-1">
                <h3 className="text-xxs">{task.title}</h3>
                {task.description && (
                  <p className="text-xxs text-muted-foreground leading-relaxed">
                    {truncateNotes(task.description)}
                  </p>
                )}
              </div>

              {/* Due Date */}
              {task.due_date && (
                <div className="text-xxs text-muted-foreground mt-1">
                  {formatDateOnly(task.due_date)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <TaskDetailsPopup
        task={task}
        listColor={listColor}
        isOpen={isPopupOpen}
        onClose={handleClosePopup}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onToggleComplete={onToggleComplete}
        position={popupPosition}
      />
    </>
  );
};
