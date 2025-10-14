import React, { useMemo, useRef, useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ReorderIndicator from '@/components/ui/ReorderIndicator';

type IdGetter<T> = (item: T) => string;
type RenderItem<T> = (item: T, opts: { isActive: boolean }) => React.ReactNode;

interface ReorderableListProps<T> {
  items: T[];
  getId: IdGetter<T>;
  renderItem: RenderItem<T>;
  onReorder: (ids: string[]) => void;
  className?: string;
  indicatorOffsetClassBefore?: string; // e.g., '-top-1.5' to center within gap above
  indicatorOffsetClassAfter?: string;  // e.g., '-bottom-1.5' to center within gap below
}

function SortableRow<T extends { __id?: string }>(props: {
  id: string;
  children: React.ReactNode;
  activeId?: string | null;
  overId?: string | null;
  overPlacement?: 'before' | 'after' | null;
  indicatorOffsetClassBefore: string;
  indicatorOffsetClassAfter: string;
}) {
  const { id, children, activeId, overId, overPlacement, indicatorOffsetClassBefore, indicatorOffsetClassAfter } = props;
  const { setNodeRef, attributes, listeners } = useSortable({ id });
  const isActive = activeId === id;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      data-task-id={id}
      className={`relative ${isActive ? 'opacity-30' : ''}`}
    >
      {activeId && overId === id && activeId !== overId && overPlacement === 'before' && (
        <ReorderIndicator className={indicatorOffsetClassBefore} />
      )}
      {children}
      {activeId && overId === id && activeId !== overId && overPlacement === 'after' && (
        <ReorderIndicator className={indicatorOffsetClassAfter} />
      )}
    </div>
  );
}

export function ReorderableList<T>({ items, getId, renderItem, onReorder, className, indicatorOffsetClassBefore = '-top-0.5', indicatorOffsetClassAfter = '-bottom-0.5' }: ReorderableListProps<T>) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [overPlacement, setOverPlacement] = useState<'before' | 'after' | null>(null);
  const [overEnd, setOverEnd] = useState<boolean>(false);
  const listRef = useRef<HTMLDivElement>(null);
  const bottomThreshold = 16;
  const endZoneId = 'END_ZONE_GENERIC';
  const endZone = useDroppable({ id: endZoneId });

  const ids = useMemo(() => items.map(getId), [items, getId]);

  const handleDragStart = (event: any) => {
    setActiveId(event.active?.id ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    const currentIds = ids;

    setOverId(null);
    setOverPlacement(null);

    if (!over) {
      if (overEnd && active?.id) {
        const oldIndex = currentIds.findIndex((x) => x === active.id);
        if (oldIndex !== -1) {
          const reordered = arrayMove(currentIds, oldIndex, currentIds.length - 1);
          onReorder(reordered);
        }
      }
      setOverEnd(false);
      setActiveId(null);
      return;
    }

    const oldIndex = currentIds.findIndex((x) => x === active.id);
    if (oldIndex === -1) {
      setActiveId(null);
      setOverEnd(false);
      return;
    }

    if (over.id === endZoneId) {
      const reordered = arrayMove(currentIds, oldIndex, currentIds.length - 1);
      onReorder(reordered);
      setActiveId(null);
      setOverEnd(false);
      return;
    }

    if (active.id !== over.id) {
      const newIndex = currentIds.findIndex((x) => x === over.id);
      if (newIndex !== -1) {
        const reordered = arrayMove(currentIds, oldIndex, newIndex);
        onReorder(reordered);
      }
    }
    setActiveId(null);
    setOverEnd(false);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    const clientY = (event.activatorEvent as MouseEvent)?.clientY ?? 0;
    const listRect = listRef.current?.getBoundingClientRect();

    if (listRect) {
      if (clientY >= listRect.bottom - bottomThreshold) {
        setOverEnd(true);
        setOverId(null);
        setOverPlacement(null);
        return;
      }
    }

    setOverEnd(false);

    if (!over || over.id === active.id) {
      setOverId(null);
      setOverPlacement(null);
      return;
    }

    const targetEl = document.querySelector(`[data-task-id="${over.id}"]`) as HTMLElement | null;
    if (!targetEl) return;
    const rect = targetEl.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    setOverId(String(over.id));
    setOverPlacement(clientY < midpoint ? 'before' : 'after');
  };

  return (
    <div ref={listRef} className={className}>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
          <div className="space-y-0">
            {items.map((item) => {
              const id = getId(item);
              return (
                <SortableRow
                  key={id}
                  id={id}
                  activeId={activeId}
                  overId={overId}
                  overPlacement={overPlacement}
                  indicatorOffsetClassBefore={indicatorOffsetClassBefore}
                  indicatorOffsetClassAfter={indicatorOffsetClassAfter}
                >
                  {renderItem(item, { isActive: activeId === id })}
                </SortableRow>
              );
            })}

            {items.length > 0 && (
              <div ref={endZone.setNodeRef} className="relative h-8">
                {overEnd && <ReorderIndicator className="top-1/2 -translate-y-1/2" />}
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

export default ReorderableList;


