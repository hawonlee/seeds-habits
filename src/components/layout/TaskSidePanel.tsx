import React, { useState } from 'react';
import { Task, TaskList } from '@/hooks/useTasks';
import { DraggableTaskItem } from '@/components/calendar/DraggableTaskItem';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { findColorOptionByValue } from '@/lib/colorOptions';

interface TaskSidePanelProps {
  tasks: Task[];
  taskLists: TaskList[];
  onToggleComplete: (taskId: string) => void;
  onTaskClick?: (task: Task) => void;
}

export const TaskSidePanel: React.FC<TaskSidePanelProps> = ({
  tasks,
  taskLists,
  onToggleComplete,
  onTaskClick
}) => {
  const [expandedLists, setExpandedLists] = useState<Set<string>>(new Set());

  const toggleListExpansion = (listId: string) => {
    const newExpanded = new Set(expandedLists);
    if (newExpanded.has(listId)) {
      newExpanded.delete(listId);
    } else {
      newExpanded.add(listId);
    }
    setExpandedLists(newExpanded);
  };

  const getTasksForList = (listId: string) => {
    return tasks.filter(task => task.task_list_id === listId);
  };

  const getTasksWithoutList = () => {
    return tasks.filter(task => !task.task_list_id);
  };

  const getCompletedTasks = (taskList: Task[]) => {
    return taskList.filter(task => task.completed);
  };

  const getIncompleteTasks = (taskList: Task[]) => {
    return taskList.filter(task => !task.completed);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Tasks</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Drag tasks to calendar days to schedule them
        </p>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Task Lists */}
        {taskLists.map(taskList => {
          const listTasks = getTasksForList(taskList.id);
          const isExpanded = expandedLists.has(taskList.id);
          const completedTasks = getCompletedTasks(listTasks);
          const incompleteTasks = getIncompleteTasks(listTasks);
          
          const categoryColor = findColorOptionByValue(taskList.color);
          const textColor = categoryColor?.textHex || '#000000';

          return (
            <div key={taskList.id} className="space-y-2">
              <div
                className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded p-2 -m-2"
                onClick={() => toggleListExpansion(taskList.id)}
              >
                <div className="flex items-center gap-2">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <div
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: textColor }}
                  />
                  <span className="font-medium text-sm">{taskList.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({incompleteTasks.length} incomplete, {completedTasks.length} done)
                  </span>
                </div>
              </div>

              {isExpanded && (
                <div className="ml-6 space-y-1">
                  {/* Incomplete Tasks */}
                  {incompleteTasks.map(task => (
                    <DraggableTaskItem
                      key={task.id}
                      task={task}
                      taskList={taskList}
                      onToggleComplete={onToggleComplete}
                      onClick={onTaskClick}
                    />
                  ))}

                  {/* Completed Tasks (collapsed by default) */}
                  {completedTasks.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-xs text-muted-foreground font-medium mt-2 mb-1">
                        Completed ({completedTasks.length})
                      </div>
                      {completedTasks.map(task => (
                        <DraggableTaskItem
                          key={task.id}
                          task={task}
                          taskList={taskList}
                          onToggleComplete={onToggleComplete}
                          onClick={onTaskClick}
                        />
                      ))}
                    </div>
                  )}

                  {listTasks.length === 0 && (
                    <div className="text-xs text-muted-foreground italic">
                      No tasks in this list
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Tasks without a list */}
        {getTasksWithoutList().length > 0 && (
          <div className="space-y-2">
            <div
              className="flex items-center justify-between cursor-pointer hover:bg-muted/50 rounded p-2 -m-2"
              onClick={() => toggleListExpansion('no-list')}
            >
              <div className="flex items-center gap-2">
                {expandedLists.has('no-list') ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
                <span className="font-medium text-sm">Unorganized Tasks</span>
                <span className="text-xs text-muted-foreground">
                  ({getTasksWithoutList().length})
                </span>
              </div>
            </div>

            {expandedLists.has('no-list') && (
              <div className="ml-6 space-y-1">
                {getTasksWithoutList().map(task => (
                  <DraggableTaskItem
                    key={task.id}
                    task={task}
                    onToggleComplete={onToggleComplete}
                    onClick={onTaskClick}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Empty state */}
        {tasks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <div className="text-sm">No tasks available</div>
            <div className="text-xs mt-1">Create tasks to drag to calendar days</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskSidePanel;
