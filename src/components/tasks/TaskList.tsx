import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Trash2,
  Settings,
  Ellipsis
} from 'lucide-react';
import { TaskItem } from './TaskItem';
import { ReorderableList } from '@/components/ui/ReorderableList';
import type { TaskList as TaskListType, Task } from '@/hooks/useTasks';
import { COLOR_OPTIONS, findColorOptionByValue } from '@/lib/colorOptions';
import { DragOverlay } from '@dnd-kit/core';
import { Switch } from '@/components/ui/switch';

interface TaskListProps {
  taskList: TaskListType;
  tasks: Task[];
  onAddTask: (listId: string, taskText: string) => void;
  onEditTask: (task: Task) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleTaskComplete: (taskId: string) => void;
  onEditList: (list: TaskListType) => void;
  onDeleteList: (listId: string) => void;
  onUpdateList: (listId: string, updates: Partial<TaskListType>) => void;
  onReorderTasks: (listId: string, taskIds: string[]) => void;
  // using DB-backed hide_completed; no local storage props
}

// Using ReorderableList for sorting behavior

export const TaskListCard: React.FC<TaskListProps> = ({
  taskList,
  tasks,
  onAddTask,
  onEditTask,
  onUpdateTask,
  onDeleteTask,
  onToggleTaskComplete,
  onDeleteList,
  onUpdateList,
  onReorderTasks,
}) => {
  const [editName, setEditName] = useState(taskList.name);
  const [newTaskText, setNewTaskText] = useState('');
  const listContainerRef = useRef<HTMLDivElement>(null);

  const completedTasks = tasks.filter((task) => task.completed).length;
  const totalTasks = tasks.length;
  const completionPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const handleReorder = (ids: string[]) => {
    onReorderTasks(taskList.id, ids);
  };

  const colorOptions = COLOR_OPTIONS.map(color => ({
    value: color.value,
    label: color.name
  }));

  const handleNameSave = () => {
    if (editName.trim() !== taskList.name) {
      onUpdateList(taskList.id, {
        name: editName.trim(),
      });
    }
  };

  const handleNameCancel = () => {
    setEditName(taskList.name);
  };

  const handleColorChange = (color: string) => {
    onUpdateList(taskList.id, {
      color: color,
    });
  };

  const handleAddTask = () => {
    if (newTaskText.trim()) {
      onAddTask(taskList.id, newTaskText.trim());
      setNewTaskText('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTask();
    } else if (e.key === 'Escape') {
      setNewTaskText('');
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* List Header */}
      <div className="flex items-center justify-between">
        <Badge
          className="text-xxs px-2 py-0.5"
          style={{ 
            backgroundColor: findColorOptionByValue(taskList.color)?.bgHex || taskList.color,
            color: findColorOptionByValue(taskList.color)?.textHex || taskList.color
          }}
        >
          {taskList.name}
        </Badge>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Ellipsis className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 p-4" onCloseAutoFocus={(e) => e.preventDefault()}>
            <div className="space-y-4">
              {/* Inline editable name with delete button */}
              <div className="flex items-center gap-2">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={handleNameSave}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleNameSave();
                    } else if (e.key === 'Escape') {
                      handleNameCancel();
                    }
                  }}
                  className="flex-1 h-8 text-xxs"
                  placeholder="List name"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteList(taskList.id)}
                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Color swatches */}
              <div className="space-y-2">
                <div className="grid grid-cols-6 gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => handleColorChange(color.value)}
                      className={`
                        flex items-center justify-center p-2 rounded-md transition-colors
                        hover:opacity-80
                        ${taskList.color === color.value
                          ? 'ring-2 ring-offset-1 ring-bordermuted'
                          : ''
                        }
                      `}
                    >
                      <div
                        className="h-4 w-4 rounded-sm"
                        style={{ backgroundColor: findColorOptionByValue(color.value)?.bgHex || color.value }}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Hide completed toggle (DB-backed) */}
              <div className="flex items-center justify-between">
                <Label
                  htmlFor={`hide-completed-${taskList.id}`}
                  className="text-xs font-normal"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onUpdateList(taskList.id, { hide_completed: !taskList.hide_completed });
                  }}
                >
                  Hide completed
                </Label>
                <Switch
                  id={`hide-completed-${taskList.id}`}
                  checked={!!taskList.hide_completed}
                  onCheckedChange={(checked) => onUpdateList(taskList.id, { hide_completed: checked })}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div ref={listContainerRef} className="flex-1 flex bg-habitbg/60 p-1 flex-col rounded-md">
        {/* <div className="pb-3">
          {totalTasks > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Progress</span>
                <span>
                  {completedTasks}/{totalTasks} ({completionPercentage}%)
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${completionPercentage}%`,
                    backgroundColor: taskList.color,
                  }}
                />
              </div>
            </div>
          )}
        </div> */}

        <div className="flex-1 flex flex-col">
          <ReorderableList
            items={tasks}
            getId={(t) => t.id}
            onReorder={handleReorder}
            className="space-y-0 overflow-y-auto"
            externalDragType="task"
            renderItem={(task) => (
              <TaskItem
                task={task}
                listColor={taskList.color}
                containerRef={listContainerRef}
                onToggleComplete={onToggleTaskComplete}
                onEdit={onEditTask}
                onUpdate={onUpdateTask}
                onDelete={onDeleteTask}
              />
            )}
          />

          {/* Add Task Input */}
          <div className="">
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="+ New Task"
              className="bg-transparent text-xxs p-1 placeholder:text-xxs hover:bg-button-ghost-hover/70 focus:bg-button-ghost-hover/50 rounded placeholder-stone-400 focus:outline-none w-full transition-all duration-200"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
