import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, X, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import type { Task } from '@/hooks/useTasks';

interface TaskDetailsPopupProps {
  task: Task;
  listColor: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  onToggleComplete: (taskId: string) => void;
  position: { top: number; left: number; width: number };
}

export const TaskDetailsPopup: React.FC<TaskDetailsPopupProps> = ({
  task,
  listColor,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
  onToggleComplete,
  position
}) => {
  const [editTitle, setEditTitle] = useState(task.title);
  const [editNotes, setEditNotes] = useState(task.description || '');
  const [editDueDate, setEditDueDate] = useState<Date | undefined>(
    task.due_date ? (() => {
      // If it's a date-only string (YYYY-MM-DD), parse it correctly
      if (task.due_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [year, month, day] = task.due_date.split('-');
        return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }
      // Otherwise, parse as ISO string
      return new Date(task.due_date);
    })() : undefined
  );
  const [isEditingDueDate, setIsEditingDueDate] = useState(false);

  const popupRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [editNotes]);

  // Close popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        // Don't close if clicking on calendar popover
        const calendarPopover = document.querySelector('[data-radix-popper-content-wrapper]');
        if (calendarPopover && calendarPopover.contains(event.target as Node)) {
          return;
        }
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, onClose]);

  // Close popup on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  const handleSave = () => {
    const updates: Partial<Task> = {};
    if (editTitle.trim() !== task.title) updates.title = editTitle.trim();
    if (editNotes !== (task.description || '')) updates.description = editNotes;
    if (Object.keys(updates).length > 0) onUpdate(task.id, updates);
  };

  const handleCancel = () => {
    setEditTitle(task.title);
    setEditNotes(task.description || '');
  };

  const handleDueDateSave = (selectedDate: Date | undefined) => {
    onUpdate(task.id, { due_date: selectedDate?.toISOString() || null });
    setIsEditingDueDate(false);
  };

  const handleDelete = () => {
    onDelete(task.id);
    onClose();
  };

  const formatDateOnly = (dateString: string) => {
    // If it's already a date-only string (YYYY-MM-DD), use it directly
    if (dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateString.split('-');
      return format(new Date(parseInt(year), parseInt(month) - 1, parseInt(day)), 'MMM d');
    }
    // Otherwise, parse as ISO string
    return format(new Date(dateString), 'MMM d');
  };

  if (!isOpen) return null;

  return (
    <div
      ref={popupRef}
      className="fixed z-50 bg-habitbg rounded-md shadow-lg"
      style={{
        top: position.top,
        left: position.left,
        width: position.width > 0 ? position.width : 376
      }}
    >
      <div className="px-2 py-1">
        <div className="flex items-start gap-1">
          {/* Checkbox */}
          <div>
            <Checkbox
              checked={task.completed}
              onCheckedChange={() => onToggleComplete(task.id)}
              customColor={listColor}
            />
          </div>

          {/* Task Content */}
          <div className="flex-1 min-w-0 mt-0.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSave();
                    }
                    if (e.key === 'Escape') handleCancel();
                  }}
                  onBlur={handleSave}
                  className="h-[19px] text-xxs px-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  autoFocus
                />
                <Textarea
                  ref={textareaRef}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') handleCancel();
                    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSave();
                    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
                      e.preventDefault();
                      handleSave();
                    }
                  }}
                  onBlur={handleSave}
                  // className="text-xxs resize-none px-1 py-0 border-none min-h-[20px] text-muted-foreground/85 bg-transparent overflow-hidden focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/85"
                  className="resize-none -mt-[0.5px] text-[0.7rem] px-1 py-0 border-none text-muted-foreground/80 min-h-[20px] text-muted-foreground bg-transparent overflow-hidden focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/80"

                  placeholder="Notes"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 -mt-0.5">
                {isEditingDueDate ? (
                  <Popover open={isEditingDueDate} onOpenChange={setIsEditingDueDate}>
                    <PopoverTrigger asChild>
                      <Button variant="text" size="sm" className="h-6 px-2 text-xxs justify-end font-normal min-w-[60px] text-muted-foreground hover:text-foreground">
                        {task.due_date ? (
                          <span className="text-muted-foreground hover:text-foreground">
                            <CalendarIcon size={12} />
                            {format(new Date(task.due_date), 'MMM d')}
                          </span>
                        ) : (
                          <CalendarIcon className="h-3 w-3" />
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={editDueDate}
                        onSelect={(date) => {
                          setEditDueDate(date);
                          // Update the task but don't close the date picker immediately
                          onUpdate(task.id, { due_date: date ? date.toISOString().split('T')[0] : null });
                          // Close the date picker after a short delay
                          setTimeout(() => {
                            setIsEditingDueDate(false);
                          }, 100);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                    <Button
                      variant="text"
                      size="text"
                      onClick={handleDelete}
                      title="Delete task"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </Popover>
                ) : (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="text"
                      size="text"
                      onClick={() => setIsEditingDueDate(true)}
                      className="h-6 px-2 text-xxs justify-end font-normal min-w-[60px] transition-all duration-200 text-muted-foreground hover:text-foreground group"
                      title={task.due_date ? formatDateOnly(task.due_date) : 'Set due date'}
                    >
                      {task.due_date ? (
                        <span className="flex items-center gap-1 transition-all duration-200 text-muted-foreground group-hover:text-foreground">
                          <CalendarIcon size={12} />
                          {formatDateOnly(task.due_date)}
                        </span>
                      ) : (
                        <CalendarIcon className="h-3 w-3 transition-all duration-200 text-muted-foreground group-hover:text-foreground" />
                      )}
                    </Button>

                    <Button
                      variant="text"
                      size="text"
                      onClick={handleDelete}
                      title="Delete task"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>


                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
