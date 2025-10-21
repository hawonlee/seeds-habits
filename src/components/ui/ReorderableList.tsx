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
  external?: boolean; // if true, do not create own DndContext
  idPrefix?: string; // prefix to ensure unique draggable/droppable ids across lists
  // When provided, the entire row also participates in native HTML5 drag with the given type
  // and will set dataTransfer text/plain to `${externalDragType}:${id}` to support external drop zones
  externalDragType?: string;
}

export function ReorderableList<T>({
  items,
  getId,
  renderItem,
  onReorder,
  className,
  external = false,
  idPrefix,
  externalDragType,
}: ReorderableListProps<T>) {
  const ids = items.map(getId);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [targetIndex, setTargetIndex] = useState<number | null>(null);
  // Default sensors for internal context
  class ListPointerSensor extends PointerSensor {}
  const sensors = useSensors(
    useSensor(ListPointerSensor as unknown as typeof PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const activeItem = activeId ? items.find((i) => getId(i) === activeId) : undefined;

  const handleDragEnd = useCallback(({ active, over }: { active: any; over: any }) => {
    // Compute reorder immediately to avoid flicker
    setTargetIndex((currentTarget) => {
      const activeKey = (active?.id as string) || '';
      const fromId = activeKey.includes(':') ? activeKey.split(':').pop() as string : activeKey;
      const fromIndex = ids.indexOf(fromId);
      if (fromIndex === -1) {
        setActiveId(null);
        return null;
      }

      let toIndex: number | null = null;
      if (over?.id) {
        const overKey = over.id as string;
        const overId = overKey.includes(':') ? overKey.split(':').pop() as string : overKey;
        const overIndex = ids.indexOf(overId);
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

  // If externalDragType is provided, use native HTML5 DnD for reordering to coexist with calendar drops
  if (externalDragType) {
    return (
      <NativeList
        items={items}
        ids={ids}
        getId={getId}
        renderItem={renderItem}
        onReorder={onReorder}
        className={className}
        externalDragType={externalDragType}
      />
    );
  }

  const content = (
    <>
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
        idPrefix={idPrefix}
        externalDragType={externalDragType}
      />
      <DragOverlay>
        {activeItem ? (
          <div className="opacity-50 pointer-events-none">
            {renderItem(activeItem as T, { isActive: true })}
          </div>
        ) : null}
      </DragOverlay>
    </>
  );

  if (external) return content;
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      {content}
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
  idPrefix,
  externalDragType,
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
  idPrefix?: string;
  externalDragType?: string;
}) {
  const { active, over } = useDndContext();
  const fromIndexRef = React.useRef<number | null>(null);

  // --- Update targetIndex live ---
  React.useEffect(() => {
    if (!active) {
      setActiveId(null);
      setTargetIndex(null);
      fromIndexRef.current = null;
      return;
    }
    const activeKey = active.id as string;
    const baseId = activeKey.includes(':') ? activeKey.split(':').pop() as string : activeKey;
    setActiveId(baseId);
    const fi = ids.indexOf(baseId);
    fromIndexRef.current = fi;

    if (!over) return;

    const overKey = over.id as string;
    const overBase = overKey.includes(':') ? overKey.split(':').pop() as string : overKey;
    const oldIndex = ids.indexOf(baseId);
    const overIndex = ids.indexOf(overBase);

    if (overIndex === -1) return;

    const isMovingDown = oldIndex < overIndex;
    const newIndex = isMovingDown ? overIndex + 1 : overIndex;
    setTargetIndex(newIndex);
  }, [active, over, ids, setActiveId, setTargetIndex]);

  // --- Handle drop ---
  React.useEffect(() => {
    if (active) return;
    if (activeId && targetIndex != null && fromIndexRef.current != null) {
      const fromIndex = fromIndexRef.current;
      const adjusted = targetIndex > fromIndex ? targetIndex - 1 : targetIndex;
      const clamped = Math.max(0, Math.min(adjusted, ids.length - 1));
      if (clamped !== fromIndex) {
        const newOrder = arrayMove(ids, fromIndex, clamped);
        onReorder(newOrder);
      }
    }
    setTargetIndex(null);
    fromIndexRef.current = null;
  }, [active, activeId, targetIndex, ids, onReorder, setTargetIndex]);

  return (
    <div className={className ?? 'space-y-0 relative'}>
      {items.map((item, i) => {
        const id = getId(item);
        const showBefore = targetIndex === i;
        const showAfterLast = i === items.length - 1 && targetIndex === items.length;
        return (
          <React.Fragment key={id}>
            <DroppableRow id={id} externalDragType={externalDragType}>
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
  externalDragType,
}: {
  id: string;
  children: React.ReactNode;
  externalDragType?: string;
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
      draggable={!!externalDragType}
      onDragStart={(e) => {
        if (!externalDragType) return;
        e.stopPropagation();
        try {
          e.dataTransfer.setData('text/plain', `${externalDragType}:${id}`);
          e.dataTransfer.effectAllowed = 'move';
        } catch {}
      }}
      data-task-id={id}
      className={`relative select-none`}
    >
      {children}
    </div>
  );
}

export default ReorderableList;

// Native HTML5 DnD implementation that supports both list reordering and external drag payloads
function NativeList<T>({
  items,
  ids,
  getId,
  renderItem,
  onReorder,
  className,
  externalDragType,
}: {
  items: T[];
  ids: string[];
  getId: IdGetter<T>;
  renderItem: RenderItem<T>;
  onReorder: (ids: string[]) => void;
  className?: string;
  externalDragType: string;
}) {
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [overIndex, setOverIndex] = React.useState<number | null>(null);

  return (
    <div className={className ?? 'space-y-0 relative'}
      onDragOver={(e) => {
        // allow drop within list container
        e.preventDefault();
      }}
      onDrop={(e) => {
        // If dropped on the list container but not a specific row, treat as cancel
        setOverIndex(null);
      }}
    >
      {items.map((item, i) => {
        const id = getId(item);
        const showBefore = overIndex === i;
        const showAfterLast = i === items.length - 1 && overIndex === items.length;
        return (
          <div
            key={id}
            data-id={id}
            draggable
            onDragStart={(e) => {
              setDraggingId(id);
              try {
                e.dataTransfer.setData('text/plain', `${externalDragType}:${id}`);
                e.dataTransfer.effectAllowed = 'move';
              } catch {}
            }}
            onDragEnd={() => {
              setDraggingId(null);
              setOverIndex(null);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              // decide target index based on cursor position in the row
              const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
              const relativeY = e.clientY - rect.top;
              const before = relativeY < rect.height / 2;
              const target = before ? i : i + 1;
              setOverIndex(target);
            }}
            onDrop={(e) => {
              e.preventDefault();
              const data = e.dataTransfer.getData('text/plain');
              // If payload matches our externalDragType, treat as internal reorder
              if (data && data.startsWith(`${externalDragType}:`)) {
                const droppedId = data.split(':')[1];
                const fromIndex = ids.indexOf(droppedId);
                const toIndex = overIndex == null ? i : overIndex;
                if (fromIndex !== -1 && toIndex != null) {
                  const adjusted = toIndex > fromIndex ? toIndex - 1 : toIndex;
                  const clamped = Math.max(0, Math.min(adjusted, ids.length - 1));
                  if (clamped !== fromIndex) {
                    onReorder(arrayMove(ids, fromIndex, clamped));
                  }
                }
                setDraggingId(null);
                setOverIndex(null);
                return;
              }
              // Otherwise it's an external drop target (e.g., calendar) — ignore here
            }}
            className={`relative select-none`}
          >
            {showBefore && (
              <ReorderIndicator className={`absolute top-0 left-0 right-0 ${i === 0 ? '' : '-translate-y-1/2'}`} />
            )}
            {renderItem(item, { isActive: draggingId === id })}
            {showAfterLast && (
              <ReorderIndicator className="absolute bottom-0 left-0 right-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}
