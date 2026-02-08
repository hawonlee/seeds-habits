import React, { useEffect, useState } from 'react';
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
  onUpdateTitle?: (taskId: string, title: string) => void;
  isScheduled?: boolean;
  calendarItemId?: string;
  onDeleteCalendarItem?: (calendarItemId: string) => void;
  isTimed?: boolean;
  displayType?: 'task' | 'deadline' | null;
}

export const TaskCalendarItem: React.FC<TaskCalendarItemProps> = ({
  task,
  date,
  taskList,
  onToggleComplete,
  onUnschedule,
  onClick,
  onUpdateTitle,
  isScheduled = false,
  calendarItemId,
  onDeleteCalendarItem,
  isTimed = false,
  displayType = 'task'
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(task.title);

  useEffect(() => {
    if (!isEditing) {
      setDraftTitle(task.title);
    }
  }, [task.title, isEditing]);

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

  const handleDragStart = (e: React.DragEvent) => {
    if (isEditing) {
      e.preventDefault();
      return;
    }
    // Don't stop propagation - let it bubble up
    // e.stopPropagation(); // REMOVED - was blocking drop events
    
    // Include task ID and display type in drag data
    const dragData = `task:${task.id}:${displayType || 'task'}`;
    console.log('[CalendarTaskItem] Starting drag:', dragData, 'title:', task.title, 'event:', e.type);
    e.dataTransfer.setData('text/plain', dragData);
    e.dataTransfer.effectAllowed = 'copy';
    
    console.log('[CalendarTaskItem] Drag data set, effectAllowed:', e.dataTransfer.effectAllowed);
  };

  const beginEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraftTitle(task.title);
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setDraftTitle(task.title);
    setIsEditing(false);
  };

  const commitEdit = () => {
    const nextTitle = draftTitle.trim();
    if (!nextTitle) {
      cancelEdit();
      return;
    }
    if (nextTitle !== task.title && onUpdateTitle) {
      onUpdateTitle(task.id, nextTitle);
    }
    setIsEditing(false);
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !task.completed;
  const isDueToday = task.due_date && new Date(task.due_date).toDateString() === date.toDateString();
  
  // Colors
  const textColor = taskList ? getIntermediaryColorFromHex(taskList.color) : 'hsl(var(--category-6-intermediary))';
  const cssVars = taskList ? getCategoryCSSVariables(taskList.color) : undefined;
  const textColor1 = cssVars ? cssVars.primary : 'hsl(var(--category-6-primary))';
  const bgColor = taskList ? (findColorOptionByValue(taskList.color)?.bgHex || taskList.color) : undefined;

  // Render as deadline (no checkbox, background color)
  if (displayType === 'deadline') {
    return (
      <div
        className="relative rounded group hover:opacity-90 transition-opacity "
        onClick={handleClick}
        draggable={!isEditing}
        onDragStart={handleDragStart}
      >
        <div 
          className="relative flex items-center justify-end gap-1.5 rounded h-4"
          style={{ 
            backgroundColor: bgColor,
            color: textColor1
          }}
        >
          <div className="absolute inset-0 flex items-center justify-center px-1">
            <div className="relative w-full min-w-0">
              {isEditing ? (
                <input
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onBlur={commitEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      commitEdit();
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      cancelEdit();
                    }
                  }}
                  autoFocus
                  className="w-full bg-transparent text-[11px] text-center outline-none"
                />
              ) : (
                <span
                  className="block truncate text-[11px] text-center"
                  onClick={beginEdit}
                >
                  {task.title}
                </span>
              )}
            </div>
          </div>
          {isScheduled && (
            <CalendarDeleteButton onClick={handleDelete} />
          )}
        </div>
      </div>
    );
  }

  // Render as regular task (with checkbox)
  return (
    <div
      className={`relative  rounded group hover:bg-muted transition-colors ${isTimed ? 'h-full' : ''}`}
      style={{ color: textColor }}
      onClick={handleClick}
      draggable={!isEditing}
      onDragStart={handleDragStart}
    >
      {isTimed && (
        <div className="absolute inset-0 rounded" style={{ backgroundColor: bgColor, opacity: 0.35, pointerEvents: 'none' }} />
      )}
      <div className="relative h-5 flex items-center gap-1.5 px-1 ">
        <Checkbox
          checked={task.completed}
          onCheckedChange={() => onToggleComplete(task.id)}
          onClick={(e) => e.stopPropagation()}
          className="mt-[2px]"
          customColor={textColor}
        />
        <div className="relative flex-1 min-w-0">
          {isEditing ? (
            <input
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commitEdit();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  cancelEdit();
                }
              }}
              autoFocus
              className="w-full bg-transparent text-[11px] outline-none p-0 m-0 h-full pb-[7px]"
            />
          ) : (
            <span
              className="block truncate text-[11px] "
              onClick={beginEdit}
            >
              {task.title}
            </span>
          )}
        </div>
        {isScheduled && (
          <CalendarDeleteButton onClick={handleDelete} />
        )}
      </div>
    </div>
  );
};
