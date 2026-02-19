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
  listDragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
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
  listDragHandleProps,
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
      <div className="flex items-center justify-between pb-0.5">
        <Badge
          className="text-xxs px-2 py-0.5 cursor-grab active:cursor-grabbing select-none focus:ring-0 focus:ring-offset-0"
          style={{ 
            backgroundColor: findColorOptionByValue(taskList.color)?.bgHex || taskList.color,
            color: findColorOptionByValue(taskList.color)?.textHex || taskList.color
          }}
          {...listDragHandleProps}
        >
          {taskList.name}
        </Badge>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="">
              <Ellipsis className="h-3 w-3 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="p-2 bg-white w-64" onCloseAutoFocus={(e) => e.preventDefault()}>
            <div className="flex flex-col gap-2">
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
                  className="flex-1 h-7 px-2 text-xxs"
                  placeholder="List name"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDeleteList(taskList.id)}
                  className="h-7 w-7 flex-shrink-0 text-muted-foreground hover:text-foreground"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex flex-wrap justify-between p-2 mt-1">
                {COLOR_OPTIONS.map((color) => (
                  <button
                    key={color.value}
                    type="button"
                    onClick={() => handleColorChange(color.value)}
                    className={`w-4 h-4 rounded-full ring-1 ring-offset-4 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 ${
                      taskList.color === color.value
                        ? 'ring-foreground/40'
                        : 'ring-transparent hover:ring-foreground/20 transition-colors duration-200'
                    }`}
                    style={{ backgroundColor: findColorOptionByValue(color.value)?.midHex || color.value }}
                    title={color.name}
                  />
                ))}
              </div>

              <div className="w-full h-[1px] bg-foreground/5 my-1" />

              <div className="flex items-center justify-between px-1.5 pb-1">
                <Label
                  htmlFor={`hide-completed-${taskList.id}`}
                  className="text-[11px] font-light text-muted-foreground"
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
