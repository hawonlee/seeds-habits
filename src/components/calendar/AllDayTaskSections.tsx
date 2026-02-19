import React, { useEffect } from "react";
import ReorderIndicator from "@/components/ui/ReorderIndicator";
import { TaskCalendarItem } from "@/components/calendar/CalendarTaskItem";
import { Task, TaskList } from "@/hooks/useTasks";

type CalendarSection = "task" | "deadline";

export type CalendarTaskEntry = {
  task: Task;
  calendarItemId?: string;
  displayType?: "task" | "deadline" | null;
  completed?: boolean;
};

const getSectionItemId = (
  section: CalendarSection,
  entry: CalendarTaskEntry,
  dateKey: string,
  index: number
): string => {
  if (entry.calendarItemId) {
    return `${section}-ci-${entry.calendarItemId}`;
  }
  const taskId = entry.task?.id || `idx-${index}`;
  return `${section}-due-${taskId}-${dateKey}-${index}`;
};

const orderSectionEntries = (
  section: CalendarSection,
  entries: CalendarTaskEntry[],
  dateKey: string,
  order: string[]
) => {
  const withIds = entries.map((entry, index) => ({
    entry,
    id: getSectionItemId(section, entry, dateKey, index),
  }));

  if (withIds.length <= 1) return withIds;

  const byId = new Map(withIds.map((row) => [row.id, row]));
  const ordered: typeof withIds = [];

  order.forEach((id) => {
    const row = byId.get(id);
    if (row) {
      ordered.push(row);
      byId.delete(id);
    }
  });

  withIds.forEach((row) => {
    if (byId.has(row.id)) ordered.push(row);
  });

  return ordered;
};

const reorderWithInsert = (ids: string[], draggedId: string, insertIndex: number): string[] => {
  const fromIndex = ids.indexOf(draggedId);
  if (fromIndex === -1) return ids;

  const withoutDragged = ids.filter((id) => id !== draggedId);
  let target = insertIndex;

  if (fromIndex < insertIndex) {
    target -= 1;
  }

  const clamped = Math.max(0, Math.min(target, withoutDragged.length));
  withoutDragged.splice(clamped, 0, draggedId);
  return withoutDragged;
};

const idsEqual = (a: string[], b: string[]) =>
  a.length === b.length && a.every((id, idx) => id === b[idx]);

interface AllDayTaskSectionsProps {
  date: Date;
  taskEntries: CalendarTaskEntry[];
  taskLists: TaskList[];
  onTaskToggleComplete?: (taskId: string) => void;
  onTaskUpdateTitle?: (taskId: string, title: string) => void;
  onCalendarItemToggleComplete?: (calendarItemId: string, completed: boolean) => void;
  onTaskDelete?: (taskId: string, date?: Date) => void;
  onCalendarItemDelete?: (calendarItemId: string) => void;
  maxDeadlineItems?: number;
  highlightedTaskIds?: Set<string>;
}

export const AllDayTaskSections: React.FC<AllDayTaskSectionsProps> = ({
  date,
  taskEntries,
  taskLists,
  onTaskToggleComplete,
  onTaskUpdateTitle,
  onCalendarItemToggleComplete,
  onTaskDelete,
  onCalendarItemDelete,
  maxDeadlineItems,
  highlightedTaskIds,
}) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const dateKey = `${y}-${m}-${dd}`;

  const deadlineItems = taskEntries.filter((entry) => entry.displayType === "deadline");
  const taskItems = taskEntries.filter((entry) => entry.displayType !== "deadline");
  const visibleDeadlineItems = typeof maxDeadlineItems === "number"
    ? deadlineItems.slice(0, maxDeadlineItems)
    : deadlineItems;

  const [deadlineOrder, setDeadlineOrder] = React.useState<string[]>([]);
  const [taskOrder, setTaskOrder] = React.useState<string[]>([]);
  const [dragState, setDragState] = React.useState<{
    section: CalendarSection;
    draggedId: string;
    insertIndex: number | null;
  } | null>(null);
  const dragPreviewRef = React.useRef<HTMLElement | null>(null);

  const deadlineRows = orderSectionEntries("deadline", visibleDeadlineItems, dateKey, deadlineOrder);
  const taskRows = orderSectionEntries("task", taskItems, dateKey, taskOrder);

  useEffect(() => {
    const currentIds = visibleDeadlineItems.map((entry, idx) =>
      getSectionItemId("deadline", entry, dateKey, idx)
    );
    setDeadlineOrder((prev) => {
      const kept = prev.filter((id) => currentIds.includes(id));
      const appended = currentIds.filter((id) => !kept.includes(id));
      const next = [...kept, ...appended];
      return idsEqual(prev, next) ? prev : next;
    });
  }, [visibleDeadlineItems, dateKey]);

  useEffect(() => {
    const currentIds = taskItems.map((entry, idx) =>
      getSectionItemId("task", entry, dateKey, idx)
    );
    setTaskOrder((prev) => {
      const kept = prev.filter((id) => currentIds.includes(id));
      const appended = currentIds.filter((id) => !kept.includes(id));
      const next = [...kept, ...appended];
      return idsEqual(prev, next) ? prev : next;
    });
  }, [taskItems, dateKey]);

  const cleanupDragPreview = () => {
    if (dragPreviewRef.current?.parentNode) {
      dragPreviewRef.current.parentNode.removeChild(dragPreviewRef.current);
    }
    dragPreviewRef.current = null;
  };

  const handleSectionDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    section: CalendarSection,
    draggedId: string,
    taskId: string
  ) => {
    e.stopPropagation();

    const sourceRowIds = section === "deadline"
      ? deadlineRows.map((row) => row.id)
      : taskRows.map((row) => row.id);
    const startIndex = sourceRowIds.indexOf(draggedId);

    setDragState({
      section,
      draggedId,
      insertIndex: startIndex >= 0 ? startIndex : null,
    });

    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", `task:${taskId}:${section}`);
    e.dataTransfer.setData("application/x-calendar-section-reorder", `${section}:${draggedId}`);

    const rowEl = e.currentTarget;
    const rect = rowEl.getBoundingClientRect();
    const clone = rowEl.cloneNode(true) as HTMLElement;
    clone.style.position = "fixed";
    clone.style.top = "-1000px";
    clone.style.left = "-1000px";
    clone.style.width = `${rect.width}px`;
    clone.style.pointerEvents = "none";
    clone.style.opacity = "0.92";
    clone.style.transform = "rotate(1deg)";
    clone.style.zIndex = "9999";
    document.body.appendChild(clone);
    dragPreviewRef.current = clone;
    e.dataTransfer.setDragImage(clone, e.clientX - rect.left, e.clientY - rect.top);
  };

  const handleSectionRowDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    section: CalendarSection,
    rowIndex: number
  ) => {
    if (!dragState || dragState.section !== section) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";

    const rect = e.currentTarget.getBoundingClientRect();
    const before = e.clientY < rect.top + rect.height / 2;
    const nextInsertIndex = before ? rowIndex : rowIndex + 1;

    setDragState((prev) =>
      prev ? { ...prev, insertIndex: nextInsertIndex } : prev
    );
  };

  const handleSectionDrop = (e: React.DragEvent<HTMLDivElement>, section: CalendarSection) => {
    if (!dragState || dragState.section !== section || !dragState.draggedId) return;
    e.preventDefault();
    e.stopPropagation();

    const sourceIds = section === "deadline"
      ? deadlineRows.map((row) => row.id)
      : taskRows.map((row) => row.id);
    const insertIndex = dragState.insertIndex ?? sourceIds.length;
    const reordered = reorderWithInsert(sourceIds, dragState.draggedId, insertIndex);

    if (section === "deadline") {
      setDeadlineOrder(reordered);
    } else {
      setTaskOrder(reordered);
    }
    setDragState(null);
    cleanupDragPreview();
  };

  const handleSectionDragEnd = () => {
    setDragState(null);
    cleanupDragPreview();
  };

  useEffect(() => () => cleanupDragPreview(), []);

  return (
    <>
      <div
        className="relative flex flex-col gap-[2px]"
        onDragOver={(e) => {
          if (!dragState || dragState.section !== "deadline") return;
          e.preventDefault();
          e.stopPropagation();
          if (deadlineRows.length === 0) {
            setDragState((prev) => (prev ? { ...prev, insertIndex: 0 } : prev));
          }
        }}
        onDrop={(e) => handleSectionDrop(e, "deadline")}
      >
        {deadlineRows.map(({ entry, id }, index) => {
          const task = entry.task;
          const taskList = taskLists.find((list) => list.id === task.task_list_id);
          const showIndicatorBefore =
            dragState?.section === "deadline" && dragState.insertIndex === index;
          const showIndicatorAfterLast =
            dragState?.section === "deadline" &&
            index === deadlineRows.length - 1 &&
            dragState.insertIndex === deadlineRows.length;
          return (
            <div
              key={id}
              className="relative"
              draggable
              onDragStart={(e) => handleSectionDragStart(e, "deadline", id, task.id)}
              onDragOver={(e) => handleSectionRowDragOver(e, "deadline", index)}
              onDrop={(e) => handleSectionDrop(e, "deadline")}
              onDragEnd={handleSectionDragEnd}
            >
              {showIndicatorBefore && (
                <ReorderIndicator className={`absolute top-0 left-0 right-0 ${index === 0 ? "" : "-translate-y-1/2"}`} />
              )}
              <TaskCalendarItem
                task={task}
                date={date}
                taskList={taskList}
                onToggleComplete={onTaskToggleComplete || (() => { })}
                onUpdateTitle={onTaskUpdateTitle}
                completed={entry.completed}
                onToggleCalendarItemComplete={onCalendarItemToggleComplete}
                onUnschedule={
                  entry.calendarItemId
                    ? undefined
                    : (taskId, taskDate) => {
                      if (onTaskDelete) onTaskDelete(taskId, taskDate);
                    }
                }
                isScheduled={Boolean(entry.calendarItemId)}
                calendarItemId={entry.calendarItemId}
                onDeleteCalendarItem={onCalendarItemDelete}
                displayType="deadline"
                isDraggable={false}
              />
              {showIndicatorAfterLast && (
                <ReorderIndicator className="absolute bottom-0 left-0 right-0" />
              )}
            </div>
          );
        })}
      </div>

      <div
        className="relative z-10 flex flex-col"
        onDragOver={(e) => {
          if (!dragState || dragState.section !== "task") return;
          e.preventDefault();
          e.stopPropagation();
          if (taskRows.length === 0) {
            setDragState((prev) => (prev ? { ...prev, insertIndex: 0 } : prev));
          }
        }}
        onDrop={(e) => handleSectionDrop(e, "task")}
      >
        {taskRows.map(({ entry, id }, index) => {
          const task = entry.task;
          const taskList = taskLists.find((list) => list.id === task.task_list_id);
          const showIndicatorBefore =
            dragState?.section === "task" && dragState.insertIndex === index;
          const showIndicatorAfterLast =
            dragState?.section === "task" &&
            index === taskRows.length - 1 &&
            dragState.insertIndex === taskRows.length;
          return (
            <div
              key={id}
              className="relative"
              draggable
              onDragStart={(e) => handleSectionDragStart(e, "task", id, task.id)}
              onDragOver={(e) => handleSectionRowDragOver(e, "task", index)}
              onDrop={(e) => handleSectionDrop(e, "task")}
              onDragEnd={handleSectionDragEnd}
            >
              {showIndicatorBefore && (
                <ReorderIndicator className={`absolute top-0 left-0 right-0 ${index === 0 ? "" : "-translate-y-1/2"}`} />
              )}
              <TaskCalendarItem
                task={task}
                date={date}
                taskList={taskList}
                onToggleComplete={onTaskToggleComplete || (() => { })}
                onUpdateTitle={onTaskUpdateTitle}
                completed={entry.completed}
                onToggleCalendarItemComplete={onCalendarItemToggleComplete}
                onUnschedule={
                  entry.calendarItemId
                    ? undefined
                    : (taskId, taskDate) => {
                      if (onTaskDelete) onTaskDelete(taskId, taskDate);
                    }
                }
                isScheduled={Boolean(entry.calendarItemId)}
                calendarItemId={entry.calendarItemId}
                onDeleteCalendarItem={onCalendarItemDelete}
                displayType="task"
                isDraggable={false}
                useForegroundColor={Boolean(highlightedTaskIds?.has(task.id))}
              />
              {showIndicatorAfterLast && (
                <ReorderIndicator className="absolute bottom-0 left-0 right-0" />
              )}
            </div>
          );
        })}
      </div>
    </>
  );
};

