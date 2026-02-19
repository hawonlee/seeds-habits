import React, { useEffect, useRef, useState } from 'react';
import { useContainerWidth } from '@/hooks/useContainerWidth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, CheckSquare, Check, X, CalendarIcon } from 'lucide-react';
import { useTasks, Task, TaskList } from '@/hooks/useTasks';
import { TaskListCard } from '@/components/tasks/TaskList';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { DeleteConfirmationModal } from '@/components/diary/DeleteConfirmationModal';
import { cn } from '@/lib/utils';
import { COLOR_OPTIONS } from '@/lib/colorOptions';
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TasksViewProps {
  onToggleCalendar?: () => void;
  isCalendarCollapsed?: boolean;
}

interface SortableTaskListCardProps {
  list: TaskList;
  tasksForList: Task[];
  onAddTask: (listId: string, taskText: string) => void;
  onEditTask: (task: Task) => void;
  onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
  onDeleteTask: (taskId: string) => void;
  onToggleTaskComplete: (taskId: string) => void;
  onDeleteList: (listId: string) => void;
  onUpdateList: (listId: string, updates: Partial<TaskList>) => void;
  onReorderTasks: (listId: string, taskIds: string[]) => void;
}

const SortableTaskListCard: React.FC<SortableTaskListCardProps> = ({
  list,
  tasksForList,
  onAddTask,
  onEditTask,
  onUpdateTask,
  onDeleteTask,
  onToggleTaskComplete,
  onDeleteList,
  onUpdateList,
  onReorderTasks,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: list.id,
  });

  const normalizedTransform = transform
    ? { ...transform, scaleX: 1, scaleY: 1 }
    : null;

  const style = {
    transform: CSS.Transform.toString(normalizedTransform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={cn('h-full', isDragging ? 'opacity-70 z-20' : '')}>
      <TaskListCard
        taskList={list}
        tasks={tasksForList}
        onAddTask={onAddTask}
        onEditTask={onEditTask}
        onUpdateTask={onUpdateTask}
        onDeleteTask={onDeleteTask}
        onToggleTaskComplete={onToggleTaskComplete}
        onEditList={() => {}}
        onDeleteList={onDeleteList}
        onUpdateList={onUpdateList}
        onReorderTasks={onReorderTasks}
        listDragHandleProps={{
          ...attributes,
          ...listeners,
          title: 'Drag to reorder list',
        }}
      />
    </div>
  );
};

export const TasksView: React.FC<TasksViewProps> = ({ onToggleCalendar, isCalendarCollapsed = true }) => {
  const {
    taskLists,
    tasks,
    loading,
    createTaskList,
    updateTaskList,
    deleteTaskList,
    createTask,
    updateTask,
    deleteTask,
    getTasksByList,
    reorderTaskLists,
    reorderTasks
  } = useTasks();

  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [deletingTaskList, setDeletingTaskList] = useState<TaskList | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  // Inline task list creation state
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDescription, setNewListDescription] = useState('');
  const [newListColor, setNewListColor] = useState(COLOR_OPTIONS[0].value); // Red

  // CSS-only responsive columns to avoid timing issues on first navigation
  // (DiaryView also uses measured width, but here we rely on CSS for robustness)

  const handleCreateTaskList = () => {
    setIsCreatingList(true);
    setNewListName('');
    setNewListDescription('');
    setNewListColor(COLOR_OPTIONS[0].value); // Red
  };

  const handleEditTaskList = (list: TaskList) => {
    // For now, we'll keep the edit functionality as a modal
    // This could be converted to inline editing later
    console.log('Edit task list:', list);
  };

  const handleUpdateTaskList = async (listId: string, updates: Partial<TaskList>) => {
    try {
      await updateTaskList(listId, updates);
    } catch (error) {
      console.error('Error updating task list:', error);
    }
  };

  const handleDeleteTaskList = (listId: string) => {
    const list = taskLists.find(l => l.id === listId);
    if (list) {
      setDeletingTaskList(list);
    }
  };

  const handleConfirmDeleteTaskList = async () => {
    if (deletingTaskList) {
      await deleteTaskList(deletingTaskList.id);
      setDeletingTaskList(null);
    }
  };

  const handleAddTask = async (listId: string, taskText: string) => {
    try {
      await createTask({
        title: taskText,
        task_list_id: listId,
        completed: false,
        priority: 'medium'
      });
    } catch (error) {
      console.error('Error creating task:', error);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskDialogOpen(true);
  };

  const handleDeleteTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setDeletingTask(task);
    }
  };

  const handleConfirmDeleteTask = async () => {
    if (deletingTask) {
      await deleteTask(deletingTask.id);
      setDeletingTask(null);
    }
  };

  const handleToggleTaskComplete = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      await updateTask(taskId, { completed: !task.completed });
    }
  };

  const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
    try {
      await updateTask(taskId, updates);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleReorderTasks = async (listId: string, taskIds: string[]) => {
    try {
      await reorderTasks(listId, taskIds);
    } catch (error) {
      console.error('Error reordering tasks:', error);
    }
  };

  const handleReorderTaskLists = async (taskListIds: string[]) => {
    try {
      await reorderTaskLists(taskListIds);
    } catch (error) {
      console.error('Error reordering task lists:', error);
    }
  };

  const handleSaveTaskList = async (listData: Omit<TaskList, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    await createTaskList(listData);
  };

  const handleCreateListInline = async () => {
    if (!newListName.trim()) return;

    try {
      await createTaskList({
        name: newListName.trim(),
        description: newListDescription.trim() || undefined,
        color: newListColor
      });

      // Reset form
      setIsCreatingList(false);
      setNewListName('');
      setNewListDescription('');
      setNewListColor(COLOR_OPTIONS[0].value); // Red
    } catch (error) {
      console.error('Error creating task list:', error);
    }
  };

  const handleCancelCreateList = () => {
    setIsCreatingList(false);
    setNewListName('');
    setNewListDescription('');
    setNewListColor(COLOR_OPTIONS[0].value); // Red
  };

  const handleSaveTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (editingTask) {
      await updateTask(editingTask.id, taskData);
    } else {
      await createTask(taskData);
    }
  };

  const colorOptions = COLOR_OPTIONS.map(color => ({
    value: color.value,
    label: color.name,
    swatch: color.midHex
  }));
  const listIds = taskLists.map((list) => list.id);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 }
    })
  );

  const handleTaskListDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = listIds.indexOf(String(active.id));
    const newIndex = listIds.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedIds = arrayMove(listIds, oldIndex, newIndex);
    handleReorderTaskLists(reorderedIds);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between h-10 mb-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <h1 className="text-xs font-medium">My Tasks</h1>
          <DropdownMenu open={isCreatingList} onOpenChange={setIsCreatingList}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" onClick={handleCreateTaskList}>
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="p-2 bg-white" align="start">
              <div className="flex flex-col gap-2 min-w-[200px]">
                <div className="flex items-center gap-2">
                  <Input
                    id="list-name"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="Enter list name"
                    className="text-xxs h-7 flex-1 px-2"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateListInline();
                      } else if (e.key === 'Escape') {
                        handleCancelCreateList();
                      }
                    }}
                    autoFocus
                  />
                  <Button
                    onClick={handleCreateListInline}
                    disabled={!newListName.trim()}
                    size="icon"
                    className="flex-shrink-0 h-7 w-7 "
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap justify-between p-1.5">
                  {colorOptions.map((color) => (
                    <button
                      key={color.value}
                      type="button"
                      onClick={() => setNewListColor(color.value)}
                      className={cn(
                        'w-4 h-4 rounded-full ring-1 ring-offset-4 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
                        newListColor === color.value
                          ? 'ring-foreground/40'
                          : 'ring-transparent hover:ring-foreground/20 transition-colors duration-200'
                      )}
                      style={{ backgroundColor: color.swatch }}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* {onToggleCalendar && (
          <Button
            variant="ghosticon"
            size="icon"
            onClick={onToggleCalendar}
            className="text-xs gap-1"
            title={isCalendarCollapsed ? 'Show calendar' : 'Hide calendar'}
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        )} */}
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {taskLists.length === 0 ? (
          <div className="text-left">
            {/* <h3 className="text-sm mb-2 text-muted-foreground">Create your first task list</h3> */}
          </div>
        ) : (
          <DndContext sensors={sensors} onDragEnd={handleTaskListDragEnd}>
            <SortableContext items={listIds} strategy={rectSortingStrategy}>
              <div className={`grid gap-4 pb-4 items-stretch`} style={{ gridTemplateColumns: `repeat(auto-fill, minmax(200px, 1fr))` }}>
                {taskLists.map((list) => (
                  <SortableTaskListCard
                    key={list.id}
                    list={list}
                    tasksForList={(list.hide_completed
                      ? getTasksByList(list.id).filter(t => !t.completed)
                      : getTasksByList(list.id))}
                    onAddTask={handleAddTask}
                    onEditTask={handleEditTask}
                    onUpdateTask={handleUpdateTask}
                    onDeleteTask={handleDeleteTask}
                    onToggleTaskComplete={handleToggleTaskComplete}
                    onDeleteList={handleDeleteTaskList}
                    onUpdateList={handleUpdateTaskList}
                    onReorderTasks={handleReorderTasks}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Dialogs */}
      <TaskDialog
        isOpen={isTaskDialogOpen}
        onClose={() => setIsTaskDialogOpen(false)}
        onSave={handleSaveTask}
        task={editingTask}
        taskLists={taskLists}
      />

      <DeleteConfirmationModal
        isOpen={deletingTaskList !== null}
        onClose={() => setDeletingTaskList(null)}
        onConfirm={handleConfirmDeleteTaskList}
        title={deletingTaskList?.name || ''}
      />

      <DeleteConfirmationModal
        isOpen={deletingTask !== null}
        onClose={() => setDeletingTask(null)}
        onConfirm={handleConfirmDeleteTask}
        title={deletingTask?.title || ''}
      />
    </div>
  );
};
