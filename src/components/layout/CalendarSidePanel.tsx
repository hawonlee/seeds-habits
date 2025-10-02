import React, { useState } from 'react';
import { Task, TaskList } from '@/hooks/useTasks';
import { Habit } from '@/hooks/useHabits';
import { DraggableTaskItem } from '@/components/calendar/DraggableTaskItem';
import { HabitCard } from '@/components/habits/HabitCard';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, Plus, CheckSquare, Target } from 'lucide-react';
import { findColorOptionByValue } from '@/lib/colorOptions';
import { SegmentedToggle } from '@/components/ui/segmented-toggle';

interface CalendarSidePanelProps {
  // Task props
  tasks: Task[];
  taskLists: TaskList[];
  onToggleComplete: (taskId: string) => void;
  onTaskClick?: (task: Task) => void;
  
  // Habit props
  habits: Habit[];
  onAddHabit: () => void;
  onCheckIn: (id: string, date?: Date) => void;
  onUndoCheckIn: (id: string, date?: Date) => void;
  onMoveHabit: (id: string, phase: Habit['phase']) => void;
  onEditHabit?: (habit: Habit) => void;
  onDeleteHabit?: (id: string) => void;
  adoptionThreshold: number;
  onDragStart?: (habit: Habit) => void;
}

export const CalendarSidePanel: React.FC<CalendarSidePanelProps> = ({
  tasks,
  taskLists,
  onToggleComplete,
  onTaskClick,
  habits,
  onAddHabit,
  onCheckIn,
  onUndoCheckIn,
  onMoveHabit,
  onEditHabit,
  onDeleteHabit,
  adoptionThreshold,
  onDragStart,
}) => {
  const [activeTab, setActiveTab] = useState<'tasks' | 'habits'>('tasks');
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

  const renderTasksContent = () => (
    <div className="space-y-4">
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
              className="flex items-center justify-between cursor-pointer rounded hover:opacity-80 transition-opacity"
              onClick={() => toggleListExpansion(taskList.id)}
            >
              <div className="flex items-center gap-1 text-xxs py-0.5 px-1 pr-2.5 rounded" style={{ backgroundColor: categoryColor?.bgHex || '#f3f4f6' }}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" style={{ color: textColor }} />
                ) : (
                  <ChevronRight className="h-4 w-4" style={{ color: textColor }} />
                )}
                <span className="" style={{ color: textColor }}>
                  {taskList.name}
                </span>
                {/* <span className="text-xs" style={{ color: textColor, opacity: 0.7 }}>
                  ({listTasks.length})
                </span> */}
              </div>
            </div>

            {isExpanded && (
              <div className="space-y-1">
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
                    {/* <div className="text-xs text-muted-foreground font-medium mt-2 mb-1">
                      Completed ({completedTasks.length})
                    </div> */}
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
  );

  const renderHabitsContent = () => (
    <div className="space-y-2">
      {habits.length === 0 ? (
        <div className="p-6 text-center text-muted-foreground">
          <p className="text-xs">No active habits</p>
        </div>
      ) : (
        habits.map(habit => (
          <HabitCard
            key={habit.id}
            habit={habit}
            variant="compact"
            adoptionThreshold={adoptionThreshold}
            onCheckIn={onCheckIn}
            onUndoCheckIn={onUndoCheckIn}
            onMoveHabit={onMoveHabit}
            onEditHabit={onEditHabit}
            onDeleteHabit={onDeleteHabit}
            draggable={true}
            onDragStart={onDragStart}
          />
        ))
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between h-10">

        
        <SegmentedToggle
                  options={[
                      { value: 'tasks', label: 'Tasks' },
                      { value: 'habits', label: 'Habits' },
                  ]}
                  value={activeTab}
                  onValueChange={(value) => setActiveTab(value as 'tasks' | 'habits')}
              />

              <div className="flex items-center justify-between">
                  {activeTab === 'habits' && (
                      <Button
                          variant="ghost"
                          size="sm"
                          onClick={onAddHabit}
                          className="h-8 w-8 p-0"
                      >
                          <Plus className="h-4 w-4" />
                      </Button>
                  )}
              </div>

              {/* <p className="text-sm text-muted-foreground mt-2">
          {activeTab === 'tasks'
            ? 'Drag tasks to calendar days to schedule them'
            : 'Drag habits to calendar days to schedule them'
          }
        </p> */}
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        {activeTab === 'tasks' ? renderTasksContent() : renderHabitsContent()}
      </div>
    </div>
  );
};

export default CalendarSidePanel;
