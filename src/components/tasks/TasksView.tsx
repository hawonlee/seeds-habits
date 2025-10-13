import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, CheckSquare, Check, X } from 'lucide-react';
import { useTasks, Task, TaskList } from '@/hooks/useTasks';
import { TaskListCard } from '@/components/tasks/TaskList';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { DeleteConfirmationModal } from '@/components/diary/DeleteConfirmationModal';
import { COLOR_OPTIONS } from '@/lib/colorOptions';

export const TasksView: React.FC = () => {
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
  const [newListColor, setNewListColor] = useState(COLOR_OPTIONS[3].value); // Blue

  const handleCreateTaskList = () => {
    setIsCreatingList(true);
    setNewListName('');
    setNewListDescription('');
    setNewListColor(COLOR_OPTIONS[3].value); // Blue
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
      setNewListColor(COLOR_OPTIONS[3].value); // Blue
    } catch (error) {
      console.error('Error creating task list:', error);
    }
  };

  const handleCancelCreateList = () => {
    setIsCreatingList(false);
    setNewListName('');
    setNewListDescription('');
    setNewListColor(COLOR_OPTIONS[3].value); // Blue
  };

  const handleSaveTask = async (taskData: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (editingTask) {
      await updateTask(editingTask.id, taskData);
    } else {
      await createTask(taskData);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading tasks...</div>
      </div>
    );
  }

  const colorOptions = COLOR_OPTIONS.map(color => ({
    value: color.value,
    label: color.name
  }));

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between h-10 mb-4">
        <h1 className="text-sm font-medium">Tasks</h1>
        <DropdownMenu open={isCreatingList} onOpenChange={setIsCreatingList}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" onClick={handleCreateTaskList}>
              <Plus className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="p-4" align="end">
            <div className="flex items-end gap-2">
              <div>
                <Label htmlFor="list-name" className="text-xs font-normal">Name</Label>
                <Input
                  id="list-name"
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="Enter list name..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateListInline();
                    } else if (e.key === 'Escape') {
                      handleCancelCreateList();
                    }
                  }}
                  autoFocus
                />
              </div>
{/* 
              <div>
                <Label htmlFor="list-description">Description (optional)</Label>
                <Textarea
                  id="list-description"
                  value={newListDescription}
                  onChange={(e) => setNewListDescription(e.target.value)}
                  placeholder="Enter description"
                  rows={2}
                />
              </div> */}
              
              <div>
                <Label htmlFor="list-color" className="text-xs font-normal">Color</Label>
                <Select value={newListColor} onValueChange={setNewListColor}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {colorOptions.map((color) => (
                      <SelectItem key={color.value} value={color.value}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-sm"
                            style={{ backgroundColor: color.value }}
                          />
                          {color.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleCreateListInline}
                  disabled={!newListName.trim()}
                  size="icon"
                  className="flex-1"
                >
                  <Check className="h-4 w-4" />
                </Button>
                {/* <Button 
                  onClick={handleCancelCreateList}
                  variant="outline"
                  size="sm"
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button> */}
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {taskLists.length === 0 ? (
        <div className="text-left">
            <h3 className="text-sm mb-2 text-muted-foreground">Create your first task list</h3>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {taskLists.map((list) => (
            <TaskListCard
              key={list.id}
              taskList={list}
              tasks={getTasksByList(list.id)}
              onAddTask={handleAddTask}
              onEditTask={handleEditTask}
              onUpdateTask={handleUpdateTask}
              onDeleteTask={handleDeleteTask}
              onToggleTaskComplete={handleToggleTaskComplete}
              onEditList={handleEditTaskList}
              onDeleteList={handleDeleteTaskList}
              onUpdateList={handleUpdateTaskList}
              onReorderTasks={handleReorderTasks}
            />
          ))}
        </div>
      )}

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
