import React, { useMemo } from 'react';

interface TimeGridProps {
    mode: 'week' | 'day';
    currentDate: Date;
    startHour?: number; // 0-23
    endHour?: number;   // 1-24 (exclusive)
    stepMinutes?: 30 | 60;
    onSlotClick?: (dateTime: Date) => void;
    maxHeight?: number; // px; when provided, makes grid vertically scrollable
    renderUntimed?: (date: Date) => React.ReactNode;
    untimedAreaHeight?: number; // px; fixed height to keep hour rows aligned across days
    onDropTask?: (taskId: string, dateTime: Date, isAllDay: boolean) => void;
    onDropHabit?: (habitId: string, dateTime: Date, isAllDay: boolean) => void;
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
    maxHeight,
    renderUntimed,
    untimedAreaHeight = 96,
    onDropTask,
    onDropHabit
}) => {
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

    return (
        <div className="relative">

            <div
                className="relative overflow-y-auto"
                style={maxHeight ? { maxHeight: `${maxHeight}px` } : undefined}
            >
                {/* Grid container: first column is time gutter, then day columns */}
                <div
                    className={`grid ${mode === 'week' ? 'grid-cols-[56px_repeat(7,minmax(0,1fr))]' : 'grid-cols-[56px_minmax(0,1fr)]'}`}
                >

                    {/* Time gutter */}
                    <div className="relative border-habitbg">

                        {/* Untimed gutter header */}
                        <div className="sticky top-0 z-30 border-t border-b border-habitbg mb-3 text-[10px] text-muted-foreground flex items-start justify-end pt-2 pr-2" style={{ height: untimedAreaHeight }}>
                            all <br/>day
                        </div>
                        {hours.map((h) => (
                            <div key={h} className="relative" style={{ height: slotsPerHour === 2 ? 64 : 48 }}>
                                <div className="absolute -translate-y-2 right-2 text-[10px] text-neutral-400 select-none">
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
                            <div
                                className="sticky top-0 z-30  border-t border-l -ml-[1px] border-b border-habitbg px-2 py-2 overflow-y-auto"
                                style={{ height: untimedAreaHeight }}
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    e.dataTransfer.dropEffect = 'move';
                                }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const data = e.dataTransfer.getData('text/plain');
                                    const dt = new Date(day);
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
                            </div>
                            <div className="mb-3" />
                            {/* Hour rows */}
                            {hours.map((h) => (
                                <div key={`${day.toDateString()}-${h}`} className="relative" style={{ height: slotsPerHour === 2 ? 64 : 48 }}>
                                    {/* Hour line */}
                                    <div className="absolute top-0 left-0 right-0 border-t border-neutral-200/60" />
                                    {/* Half-hour line (if applicable) */}
                                    {/* {slotsPerHour === 2 && (
                    <div className="absolute left-0 right-0 border-t border-dashed border-neutral-200/70" style={{ top: '50%' }} />
                  )} */}

                                    {/* Clickable slots */}
                                    <div className="absolute inset-0">
                                        {[...Array(slotsPerHour)].map((_, idx) => (
                                            <button
                                                key={idx}
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
                                                }}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    const data = e.dataTransfer.getData('text/plain');
                                                    const minutes = idx * (60 / slotsPerHour);
                                                    const dt = new Date(day);
                                                    dt.setHours(h, minutes, 0, 0);
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
        </div>
    );
};

export default TimeGrid;


