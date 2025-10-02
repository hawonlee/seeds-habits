import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Home, CheckSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTasks, Task, TaskList } from '@/hooks/useTasks';
import { TaskList as TaskListComponent } from '@/components/tasks/TaskList';
import { TaskDialog } from '@/components/tasks/TaskDialog';
import { TaskListDialog } from '@/components/tasks/TaskListDialog';
import { DeleteConfirmationModal } from '@/components/diary/DeleteConfirmationModal';

export const TasksPage: React.FC = () => {
  const navigate = useNavigate();
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
    getTasksByList
  } = useTasks();

  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isTaskListDialogOpen, setIsTaskListDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [editingTaskList, setEditingTaskList] = useState<TaskList | undefined>(undefined);
  const [deletingTaskList, setDeletingTaskList] = useState<TaskList | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);
  const [selectedListId, setSelectedListId] = useState<string>('');

  const handleCreateTaskList = () => {
    setEditingTaskList(undefined);
    setIsTaskListDialogOpen(true);
  };

  const handleEditTaskList = (list: TaskList) => {
    setEditingTaskList(list);
    setIsTaskListDialogOpen(true);
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

  const handleAddTask = (listId: string) => {
    setSelectedListId(listId);
    setEditingTask(undefined);
    setIsTaskDialogOpen(true);
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

  const handleSaveTaskList = async (listData: Omit<TaskList, 'id' | 'created_at' | 'updated_at' | 'user_id'>) => {
    if (editingTaskList) {
      await updateTaskList(editingTaskList.id, listData);
    } else {
      await createTaskList(listData);
    }
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

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Back to Habits
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Tasks</h1>
            <p className="text-muted-foreground">Organize your tasks and to-dos</p>
          </div>
        </div>
        <Button onClick={handleCreateTaskList}>
          <Plus className="h-4 w-4 mr-2" />
          New List
        </Button>
      </div>

      {taskLists.length === 0 ? (
        <Card className="p-8 text-center">
          <CardContent>
            <CheckSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No task lists yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first task list to start organizing your tasks and to-dos.
            </p>
            <Button onClick={handleCreateTaskList}>
              <Plus className="h-4 w-4 mr-2" />
              Create First List
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {taskLists.map((list) => (
            <TaskListComponent
              key={list.id}
              taskList={list}
              tasks={getTasksByList(list.id)}
              onAddTask={handleAddTask}
              onEditTask={handleEditTask}
              onDeleteTask={handleDeleteTask}
              onToggleTaskComplete={handleToggleTaskComplete}
              onEditList={handleEditTaskList}
              onDeleteList={handleDeleteTaskList}
            />
          ))}
        </div>
      )}

      {/* Dialogs */}
      <TaskListDialog
        isOpen={isTaskListDialogOpen}
        onClose={() => setIsTaskListDialogOpen(false)}
        onSave={handleSaveTaskList}
        list={editingTaskList}
      />

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

export default TasksPage;
