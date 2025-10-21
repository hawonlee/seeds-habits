import React, { useEffect, useMemo, useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';

interface TimeGridProps {
    mode: 'week' | 'day';
    currentDate: Date;
    startHour?: number; // 0-23
    endHour?: number;   // 1-24 (exclusive)
    stepMinutes?: 30 | 60;
    onSlotClick?: (dateTime: Date) => void;
    renderUntimed?: (date: Date) => React.ReactNode;
    untimedAreaHeight?: number; // px; fixed height to keep hour rows aligned across days
    onDropTask?: (taskId: string, dateTime: Date, isAllDay: boolean) => void;
    onDropHabit?: (habitId: string, dateTime: Date, isAllDay: boolean) => void;
    renderTimed?: (date: Date, ctx: { hourRowHeight: number; slotsPerHour: number; startHour: number; endHour: number; }) => React.ReactNode;
    resizableUntimed?: boolean;
    onResizeUntimed?: (height: number) => void;
}

const hoursInRange = (startHour: number, endHour: number) => {
    const list: number[] = [];
    for (let h = startHour; h < endHour; h++) list.push(h);
    return list;
};

const getWeekDates = (date: Date) => {
    const week: Date[] = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        week.push(d);
    }
    return week;
};

const isSameDate = (a: Date, b: Date) => a.toDateString() === b.toDateString();

export const TimeGrid: React.FC<TimeGridProps> = ({
    mode,
    currentDate,
    startHour = 0,
    endHour = 24,
    stepMinutes = 30,
    onSlotClick,
    renderUntimed,
    untimedAreaHeight = 96,
    onDropTask,
    onDropHabit,
    renderTimed,
    resizableUntimed,
    onResizeUntimed
}) => {
    const isDraggingRef = useRef(false);
    const dragStartYRef = useRef(0);
    const startHeightRef = useRef(untimedAreaHeight);
    const DroppableWrapper: React.FC<{
        id: string;
        className?: string;
        style?: React.CSSProperties;
    } & React.HTMLAttributes<HTMLDivElement>> = ({ id, className, style, children, ...rest }) => {
        const { setNodeRef, isOver } = useDroppable({ id });
        const mergedClassName = isOver ? `${className || ''} bg-muted` : (className || '');
        return (
            <div ref={setNodeRef} id={id} className={mergedClassName} style={style} {...rest}>
                {children}
            </div>
        );
    };

    const pad2 = (n: number) => String(n).padStart(2, '0');
    const fmtDate = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
    const hours = useMemo(() => hoursInRange(startHour, endHour), [startHour, endHour]);
    const slotsPerHour = stepMinutes === 30 ? 2 : 1;

    const days = useMemo(() => {
        return mode === 'week' ? getWeekDates(currentDate) : [new Date(currentDate)];
    }, [mode, currentDate]);

    const now = new Date();
    const hasToday = days.some(d => isSameDate(d, now));

    const minutesSinceStart = (now.getHours() - startHour) * 60 + now.getMinutes();
    const totalMinutes = (endHour - startHour) * 60;
    const hourRowHeight = slotsPerHour === 2 ? 64 : 48;
    const totalHoursHeight = hours.length * hourRowHeight;
    const nowOffsetPx = Math.max(
        0,
        Math.min(
            untimedAreaHeight + totalHoursHeight,
            untimedAreaHeight + (minutesSinceStart / totalMinutes) * totalHoursHeight
        )
    );

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDraggingRef.current) return;
            const dy = e.clientY - dragStartYRef.current;
            const next = Math.max(64, Math.min(600, (startHeightRef.current || 0) + dy));
            onResizeUntimed && onResizeUntimed(next);
        };
        const handleMouseUp = () => {
            if (!isDraggingRef.current) return;
            isDraggingRef.current = false;
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
        if (isDraggingRef.current) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [onResizeUntimed]);

    const startResize = (e: React.MouseEvent) => {
        if (!resizableUntimed) return;
        isDraggingRef.current = true;
        dragStartYRef.current = e.clientY;
        startHeightRef.current = untimedAreaHeight;
    };

    return (
        <div className="relative h-full min-h-0">

            <div className="relative overflow-y-auto h-full">
                {/* Grid container: first column is time gutter, then day columns */}
                <div
                    className={`grid ${mode === 'week' ? 'grid-cols-[56px_repeat(7,minmax(0,1fr))]' : 'grid-cols-[56px_minmax(0,1fr)]'}`}
                >

                    {/* Time gutter */}
                    <div className="relative border-habitbg">

                        {/* Untimed gutter header */}
                        <div className="sticky top-0 z-30 border-t border-b border-habitbg mb-3 text-[10px] text-muted-foreground flex items-start justify-end pt-2 pr-2" style={{ height: untimedAreaHeight }}>
                            all <br />day
                        </div>
                        {hours.map((h) => (
                            <div key={h} className="relative" style={{ height: slotsPerHour === 2 ? 64 : 48 }}>
                                <div className="absolute -translate-y-2 right-2 text-[10px] text-muted-foreground/60 select-none">
                                    {new Date(0, 0, 0, h).toLocaleTimeString([], { hour: 'numeric' })}
                                </div>
                            </div>
                        ))}
                        {/* Bottom label - repeat first hour (e.g., 12 AM) at the end */}
                        <div className="absolute right-2 bottom-0 text-[10px] text-neutral-400 select-none">
                            {new Date(0, 0, 0, startHour).toLocaleTimeString([], { hour: 'numeric' })}
                        </div>
                    </div>

                    {/* Day columns */}
                    {days.map((day) => (
                        <div key={day.toISOString()} className="relative border-l border-habitbg">
                            {/* Untimed items area */}
                            <DroppableWrapper
                                id={`calendar:${fmtDate(day)}`}
                                className="sticky top-0 z-30  border-t border-l -ml-[1px] border-b border-habitbg px-2 py-2 overflow-y-auto transition-colors"
                                style={{ height: untimedAreaHeight }}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    e.dataTransfer.dropEffect = 'move';
                                    (e.currentTarget as HTMLElement).classList.add('bg-muted');
                                }}
                                onDragLeave={(e) => {
                                    (e.currentTarget as HTMLElement).classList.remove('bg-muted');
                                }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    (e.currentTarget as HTMLElement).classList.remove('bg-muted');
                                    const data = e.dataTransfer.getData('text/plain');
                                    const idAttr = (e.currentTarget as HTMLElement).id || '';
                                    let dt = new Date(day);
                                    const idMatch = idAttr.match(/^calendar:(\d{4}-\d{2}-\d{2})$/);
                                    if (idMatch) {
                                        const [y, m, d] = idMatch[1].split('-').map(n => parseInt(n, 10));
                                        dt = new Date(y, m - 1, d);
                                    }
                                    dt.setHours(0, 0, 0, 0);
                                    if (data.startsWith('task:')) {
                                        const id = data.replace('task:', '');
                                        onDropTask && onDropTask(id, dt, true);
                                    } else if (data.startsWith('habit:')) {
                                        const id = data.replace('habit:', '');
                                        onDropHabit && onDropHabit(id, dt, true);
                                    }
                                }}
                            >
                                {renderUntimed ? renderUntimed(day) : null}
                            </DroppableWrapper>
                            <div className="mb-3" />
                            {/* Hour rows */}
                            <div className="relative" style={{ height: totalHoursHeight }}>
                                {hours.map((h) => (
                                    <div key={`${day.toDateString()}-${h}`} className="relative" style={{ height: hourRowHeight }}>
                                        {/* Hour line */}
                                        <div className="absolute top-0 left-0 right-0 border-t border-border-muted" />
                                        {/* Clickable slots */}
                                        <div className="absolute inset-0">
                                            {[...Array(slotsPerHour)].map((_, idx) => (
                                                <DroppableWrapper
                                                    key={idx}
                                                    id={`calendar:${fmtDate(day)}:${pad2(h)}:${pad2(idx * (60 / slotsPerHour))}`}
                                                    className="w-full h-1/2 block hover:bg-muted/40 transition-colors"
                                                    onClick={() => {
                                                        if (!onSlotClick) return;
                                                        const minutes = idx * (60 / slotsPerHour);
                                                        const dt = new Date(day);
                                                        dt.setHours(h, minutes, 0, 0);
                                                        onSlotClick(dt);
                                                    }}
                                                    onDragOver={(e) => {
                                                        e.preventDefault();
                                                        e.dataTransfer.dropEffect = 'move';
                                                        (e.currentTarget as HTMLElement).classList.add('bg-muted');
                                                    }}
                                                    onDragLeave={(e) => {
                                                        (e.currentTarget as HTMLElement).classList.remove('bg-muted');
                                                    }}
                                                    onDrop={(e) => {
                                                        e.preventDefault();
                                                        (e.currentTarget as HTMLElement).classList.remove('bg-muted');
                                                        const data = e.dataTransfer.getData('text/plain');
                                                        const minutes = idx * (60 / slotsPerHour);
                                                        const idAttr = (e.currentTarget as HTMLElement).id || '';
                                                        let dt = new Date(day);
                                                        const idMatch = idAttr.match(/^calendar:(\d{4}-\d{2}-\d{2}):(\d{2}):(\d{2})$/);
                                                        if (idMatch) {
                                                            const [y, m, d] = idMatch[1].split('-').map(n => parseInt(n, 10));
                                                            const hh = parseInt(idMatch[2], 10);
                                                            const mm = parseInt(idMatch[3], 10);
                                                            dt = new Date(y, m - 1, d);
                                                            dt.setHours(hh, mm, 0, 0);
                                                        } else {
                                                            dt.setHours(h, minutes, 0, 0);
                                                        }
                                                        if (data.startsWith('task:')) {
                                                            const id = data.replace('task:', '');
                                                            onDropTask && onDropTask(id, dt, false);
                                                        } else if (data.startsWith('habit:')) {
                                                            const id = data.replace('habit:', '');
                                                            onDropHabit && onDropHabit(id, dt, false);
                                                        }
                                                    }}
                                                    aria-label={`Schedule at ${h}:${idx * (60 / slotsPerHour)}`}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {renderTimed && (
                                    <div className="absolute inset-0">
                                        {renderTimed(day, { hourRowHeight, slotsPerHour, startHour, endHour })}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Current time indicator */}
                {hasToday && now.getHours() >= startHour && now.getHours() < endHour && (
                    <div
                        className="pointer-events-none absolute left-0 right-0 z-10"
                        style={{ top: `${nowOffsetPx}px` }}
                    >
                        <div className={`grid ${mode === 'week' ? 'grid-cols-[56px_repeat(7,minmax(0,1fr))]' : 'grid-cols-[56px_minmax(0,1fr)]'}`}>
                            <div />
                            {days.map((day) => (
                                <div key={`now-${day.toISOString()}`} className="relative">
                                    {isSameDate(day, now) && (
                                        <div className="relative">
                                            <div className="absolute left-0 right-0 border-t border-red-500" />
                                            <div className="absolute -top-[3.3px] -left-1 w-2 h-2 rounded-full bg-red-500" />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
            <div
                className="absolute top-0 left-0 right-0 bg-sidebar"
                style={{
                    height: untimedAreaHeight, // same as your "all day" section
                    zIndex: 20,                // just above the red line (z-10) but below sticky content (z-40)
                    pointerEvents: 'none',     // don’t block clicks
                }}
            />
            {resizableUntimed && (
                <div
                    className="absolute left-0 right-0 z-40 cursor-row-resize"
                    style={{ top: (untimedAreaHeight || 0) - 3, height: 6 }}
                    onMouseDown={startResize}
                    aria-label="Resize all-day bar"
                >
                    {/* invisible hit area */}
                </div>
            )}
        </div>
    );
};

export default TimeGrid;


