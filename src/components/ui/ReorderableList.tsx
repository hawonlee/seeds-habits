"use client";
import React, { useCallback, useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDndContext,
  DragOverlay,
} from '@dnd-kit/core';
import { useDraggable, useDroppable } from '@dnd-kit/core';
// Local fallback for arrayMove
function arrayMove<T>(arr: T[], from: number, to: number): T[] {
  const copy = arr.slice();
  if (from === to || from < 0 || to < 0 || from >= copy.length || to >= copy.length) return copy;
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}
import ReorderIndicator from '@/components/ui/ReorderIndicator';

type IdGetter<T> = (item: T) => string;
type RenderItem<T> = (item: T, opts: { isActive: boolean }) => React.ReactNode;

interface ReorderableListProps<T> {
  items: T[];
  getId: IdGetter<T>;
  renderItem: RenderItem<T>;
  onReorder: (ids: string[]) => void;
  className?: string;
}

export function ReorderableList<T>({
  items,
  getId,
  renderItem,
  onReorder,
  className,
}: ReorderableListProps<T>) {
  const ids = items.map(getId);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  // Custom PointerSensor that ignores calendar drag handles so native HTML5 DnD can be used
  class CalendarAwarePointerSensor extends PointerSensor {
    static activators = [
      {
        eventName: 'onPointerDown',
        handler: ({ nativeEvent }: { nativeEvent: PointerEvent }) => {
          const target = nativeEvent.target as HTMLElement | null;
          if (!target) return true;
          // Modifier-based activation: only activate list reordering if Option/Alt or Meta is held
          const allowReorder = nativeEvent.altKey || nativeEvent.metaKey || nativeEvent.ctrlKey;
          return allowReorder;
        },
      },
    ];
  }

  const sensors = useSensors(
    useSensor(CalendarAwarePointerSensor as unknown as typeof PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const activeItem = activeId ? items.find((i) => getId(i) === activeId) : undefined;

  const handleDragEnd = useCallback(({ active, over }: { active: any; over: any }) => {
    // Compute reorder immediately to avoid flicker
    setTargetIndex((currentTarget) => {
      const fromIndex = ids.indexOf(active?.id as string);
      if (fromIndex === -1) {
        setActiveId(null);
        return null;
      }

      let toIndex: number | null = null;
      if (over?.id) {
        const overIndex = ids.indexOf(over.id as string);
        if (overIndex !== -1) {
          const isMovingDown = fromIndex < overIndex;
          toIndex = isMovingDown ? overIndex + 1 : overIndex;
        }
      } else if (currentTarget != null) {
        // Fallback to last computed targetIndex (e.g., hovering after last item)
        toIndex = currentTarget;
      }

      if (toIndex == null) {
        setActiveId(null);
        return null;
      }

      const adjusted = toIndex > fromIndex ? toIndex - 1 : toIndex;
      const clamped = Math.max(0, Math.min(adjusted, ids.length - 1));
      if (clamped !== fromIndex) {
        const newOrder = arrayMove(ids, fromIndex, clamped);
        onReorder(newOrder);
      }
      setActiveId(null);
      return null;
    });
  }, [ids, onReorder]);

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <InnerList
        items={items}
        ids={ids}
        getId={getId}
        renderItem={renderItem}
        onReorder={onReorder}
        className={className}
        activeId={activeId}
        setActiveId={setActiveId}
        targetIndex={targetIndex}
        setTargetIndex={setTargetIndex}
      />
      <DragOverlay>
        {activeItem ? (
          <div className="opacity-50 pointer-events-none">
            {renderItem(activeItem as T, { isActive: true })}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function InnerList<T>({
  items,
  ids,
  getId,
  renderItem,
  onReorder,
  className,
  activeId,
  setActiveId,
  targetIndex,
  setTargetIndex,
}: {
  items: T[];
  ids: string[];
  getId: IdGetter<T>;
  renderItem: RenderItem<T>;
  onReorder: (ids: string[]) => void;
  className?: string;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  targetIndex: number | null;
  setTargetIndex: (i: number | null) => void;
}) {
  const { active, over } = useDndContext();

  // --- Update targetIndex live ---
  React.useEffect(() => {
    if (!active) {
      setActiveId(null);
      setTargetIndex(null);
      return;
    }
    setActiveId(active.id as string);

    if (!over) return;

    const oldIndex = ids.indexOf(active.id as string);
    const overIndex = ids.indexOf(over.id as string);

    if (overIndex === -1) return;

    const isMovingDown = oldIndex < overIndex;
    const newIndex = isMovingDown ? overIndex + 1 : overIndex;
    setTargetIndex(newIndex);
  }, [active, over, ids, setActiveId, setTargetIndex]);

  // --- Handle drop ---
  React.useEffect(() => {
    // No-op here; actual reorder is handled synchronously in onDragEnd to avoid flicker
    if (!active && activeId && targetIndex != null) {
      setTargetIndex(null);
    }
  }, [active, activeId, targetIndex, ids, onReorder, setTargetIndex]);

  return (
    <div className={className ?? 'space-y-0 relative'}>
      {items.map((item, i) => {
        const id = getId(item);
        const showBefore = targetIndex === i;
        const showAfterLast = i === items.length - 1 && targetIndex === items.length;
        return (
          <React.Fragment key={id}>
            <DroppableRow id={id}>
              {showBefore && (
                <ReorderIndicator
                  className={`absolute top-0 left-0 right-0 ${i === 0 ? '' : '-translate-y-1/2'}`}
                />
              )}
              {renderItem(item, { isActive: activeId === id })}
              {showAfterLast && (
                <ReorderIndicator className="absolute bottom-0 left-0 right-0" />
              )}
            </DroppableRow>
          </React.Fragment>
        );
      })}
    </div>
  );
}

function DroppableRow({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const { setNodeRef: setDropRef } = useDroppable({ id });
  const { attributes, listeners, setNodeRef: setDragRef } =
    useDraggable({ id });

  return (
    <div
      ref={(el) => {
        setDropRef(el);
        setDragRef(el);
      }}
      {...attributes}
      {...listeners}
      data-task-id={id}
      className={`relative select-none`}
    >
      {children}
    </div>
  );
}

export default ReorderableList;
