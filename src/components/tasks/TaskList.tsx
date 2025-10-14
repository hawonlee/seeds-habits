import React, { useRef, useState } from 'react';
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
import ReorderIndicator from '@/components/ui/ReorderIndicator';
import type { TaskList as TaskListType, Task } from '@/hooks/useTasks';
import { COLOR_OPTIONS, findColorOptionByValue } from '@/lib/colorOptions';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
}

// Sortable Task Item Wrapper
const SortableTaskItem: React.FC<{
  task: Task;
  listColor: string;
  onToggleComplete: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onUpdate: (taskId: string, updates: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
  index: number;
  activeId?: string | null;
  overId?: string | null;
  overPlacement?: 'before' | 'after' | null;
}> = ({ task, listColor, onToggleComplete, onEdit, onUpdate, onDelete, index, activeId, overId, overPlacement }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    // Keep items static during drag: do not apply transforms/transitions
    transform: undefined as unknown as string,
    transition: undefined as unknown as string,
    opacity: 1,
  };

  const isActive = activeId === task.id;

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} data-task-id={task.id} className={`relative ${isActive ? 'opacity-30' : ''}`}>
      {activeId && overId === task.id && activeId !== overId && overPlacement === 'before' && (
        <ReorderIndicator className="-top-0.5" />
      )}
      <TaskItem
        task={task}
        listColor={listColor}
        onToggleComplete={onToggleComplete}
        onEdit={onEdit}
        onUpdate={onUpdate}
        onDelete={onDelete}
      />
      {activeId && overId === task.id && activeId !== overId && overPlacement === 'after' && (
        <ReorderIndicator className="-bottom-0.5" />
      )}
    </div>
  );
};

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

  const completedTasks = tasks.filter((task) => task.completed).length;
  const totalTasks = tasks.length;
  const completionPercentage =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Set up drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require a small movement before starting a drag so clicks still work
      activationConstraint: { distance: 8 }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [overPlacement, setOverPlacement] = useState<'before' | 'after' | null>(null);
  const [overEnd, setOverEnd] = useState<boolean>(false);
  const endZoneId = `END_ZONE_${taskList.id}`;
  const endZone = useDroppable({ id: endZoneId });
  const listRef = useRef<HTMLDivElement>(null);

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);
    setOverId(null);
    setOverPlacement(null);
    // If drop occurred outside any droppable but we were showing end indicator, move to last
    if (!over) {
      if (overEnd && active?.id) {
        const oldIndex = tasks.findIndex((task) => task.id === active.id);
        if (oldIndex !== -1) {
          const reorderedTasks = arrayMove(tasks, oldIndex, tasks.length - 1);
          const taskIds = reorderedTasks.map((task) => task.id);
          onReorderTasks(taskList.id, taskIds);
        }
      }
      setOverEnd(false);
      return;
    }

    const oldIndex = tasks.findIndex((task) => task.id === active.id);
    if (oldIndex === -1) return;

    if (over.id === endZoneId) {
      const reorderedTasks = arrayMove(tasks, oldIndex, tasks.length - 1);
      const taskIds = reorderedTasks.map((task) => task.id);
      onReorderTasks(taskList.id, taskIds);
      return;
    }

    if (active.id !== over.id) {
      const newIndex = tasks.findIndex((task) => task.id === over.id);
      if (newIndex === -1) return;
      const reorderedTasks = arrayMove(tasks, oldIndex, newIndex);
      const taskIds = reorderedTasks.map((task) => task.id);
      onReorderTasks(taskList.id, taskIds);
    }
  };

  const handleDragStart = (event: any) => {
    setActiveId(event.active?.id ?? null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    // Pointer Y for proximity calculations
    const clientY = (event as any).activatorEvent?.clientY ?? (event as any).sensor?.coords?.y ?? 0;

    if (!over) {
      // If the pointer is near/below the bottom of the list, keep end indicator on
      const rect = listRef.current?.getBoundingClientRect();
      if (rect && clientY >= rect.bottom - 8) {
        setOverId(null);
        setOverPlacement(null);
        setOverEnd(true);
        return;
      }
      setOverId(null);
      setOverPlacement(null);
      setOverEnd(false);
      return;
    }
    if (over.id === endZoneId) {
      setOverId(null);
      setOverPlacement(null);
      setOverEnd(true);
      return;
    }
    if (active.id === over.id) {
      setOverId(null);
      setOverPlacement(null);
      setOverEnd(false);
      return;
    }
    const targetEl = document.querySelector(`[data-task-id="${over.id}"]`) as HTMLElement | null;
    if (!targetEl) return;
    const rect = targetEl.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    const pointerY = (event as any).delta ? rect.top + rect.height / 2 : (event as any).over?.rect?.top || (event as any).activatorEvent?.clientY || 0; // fallback
    const y = clientY || pointerY;
    setOverId(String(over.id));
    setOverPlacement(y < midpoint ? 'before' : 'after');
    setOverEnd(false);
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
          <DropdownMenuContent align="end" className="w-64 p-4">
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
                          ? 'ring-2 ring-offset-1 ring-primary'
                          : ''
                        }
                      `}
                    >
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: findColorOptionByValue(color.value)?.bgHex || color.value }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex-1 flex bg-habitbg flex-col  rounded-md p-1">
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
          {/* Tasks */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={tasks.map(task => task.id)}
              strategy={verticalListSortingStrategy}
            >
              <div ref={listRef} className="space-y-0 overflow-y-auto">
                {tasks.map((task, index) => (
                  <SortableTaskItem
                    key={task.id}
                    task={task}
                    listColor={taskList.color}
                    onToggleComplete={onToggleTaskComplete}
                    onEdit={onEditTask}
                    onUpdate={onUpdateTask}
                    onDelete={onDeleteTask}
                    index={index}
                    activeId={activeId}
                    overId={overId}
                    overPlacement={overPlacement}
                  />
                ))}
              {/* End-of-list drop zone indicator for after last task (dnd-kit droppable) */}
              {/* {tasks.length > 0 && (
                <div ref={endZone.setNodeRef} className="relative h-8">
                  {overEnd && <ReorderIndicator className="top-0" />}
                </div>
              )} */}
              </div>
            </SortableContext>

            {/* Drag preview overlay to show a copy of the task under cursor */}
            <DragOverlay dropAnimation={null}>
              {activeId ? (() => {
                const activeTask = tasks.find(t => t.id === activeId);
                return activeTask ? (
                  <div className="pointer-events-none rounded-sm px-1 bg-button-ghost-hover/50">
                    <TaskItem
                      task={activeTask}
                      listColor={taskList.color}
                      onToggleComplete={onToggleTaskComplete}
                      onEdit={onEditTask}
                      onUpdate={onUpdateTask}
                      onDelete={onDeleteTask}
                    />
                  </div>
                ) : null;
              })() : null}
            </DragOverlay>
          </DndContext>

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
