import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Check } from "lucide-react";
import { Habit } from "@/hooks/useHabits";
import { getCategoryById, getCategoryCSSVariables } from "@/lib/categories";
import { HabitMeta } from "./HabitMeta";
import { useState, useRef } from "react";
import { ProgressCircle } from "@/components/ui/progress-circle";
import { useHabitCompletions } from "@/hooks/useHabitCompletions";
import {
  getHabitDates,
  createWeekUtils,
  createProgressUtils,
  createCompletionHandlers
} from "@/components/habits/habitCardUtils";

interface HabitCardProps {
  habit: Habit;
  adoptionThreshold: number;
  onCheckIn: (id: string) => void;
  onUndoCheckIn: (id: string) => void;
  onMoveHabit: (id: string, phase: Habit['phase']) => void;
  onEditHabit?: (habit: Habit) => void;
  onDeleteHabit?: (id: string) => void;
  onUpdateHabit?: (updatedHabit: Partial<Habit>) => void;
  variant?: 'default' | 'compact' | 'summary' | 'calendar' | 'week' | 'table';
  draggable?: boolean;
  onDragStart?: (habit: Habit) => void;
  // Week variant helpers
  weekStartDate?: Date; // start of the week (Sunday-based) to render squares for
  isCompletedOnDate?: (habitId: string, date: Date) => boolean; // completion lookup per date
  // Optional day-level handlers for week variant
  onCheckInForDate?: (id: string, date: Date) => void;
  onUndoCheckInForDate?: (id: string, date: Date) => void;
  // Selected day for the week variant
  selectedDate?: Date;
  // Table variant helpers
  currentWeek?: Date; // for table variant weekly checkboxes
}

export const HabitCard = ({
  habit,
  adoptionThreshold,
  onCheckIn,
  onUndoCheckIn,
  onMoveHabit,
  onEditHabit,
  onDeleteHabit,
  onUpdateHabit,
  variant = 'default',
  draggable = false,
  onDragStart,
  weekStartDate,
  isCompletedOnDate,
  onCheckInForDate,
  onUndoCheckInForDate,
  selectedDate,
  currentWeek
}: HabitCardProps) => {
  const [showInlineEdit, setShowInlineEdit] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const { todayDate, lastCompletedKey, isCheckedInToday } = getHabitDates(habit);
  const { isHabitCompletedOnDate, toggleCompletion } = useHabitCompletions();
  const weekUtils = createWeekUtils({
    habit,
    customIsCompleted: isCompletedOnDate,
    isHabitCompletedOnDate,
    lastCompletedKey
  });
  const progressUtils = createProgressUtils(
    habit,
    weekUtils.getWeekDaysFromStart,
    weekUtils.sharedCompletedCounts
  );
  const completionHandlers = createCompletionHandlers({
    habit,
    onCheckIn,
    onUndoCheckIn,
    onCheckInForDate,
    onUndoCheckInForDate,
    toggleCompletion,
    isHabitCompletedOnDate,
    customIsCompleted: isCompletedOnDate,
    lastCompletedKey
  });

  const { targetPerWeek, getWeekSummary } = progressUtils;
  const { days: tableWeekDays, completed: tableCompletedThisWeek, progressPct: tableWeeklyProgressPct } = getWeekSummary(currentWeek);

  // Table variant - horizontal layout with weekly checkboxes
  if (variant === 'table') {
    const containerClasses = 'flex items-center rounded-lg px-4 py-2 bg-habitbg hover:bg-habitbghover transition-colors duration-200 cursor-pointer group relative';

    return (
      <div className="relative" ref={cardRef}>
        <div
          className={containerClasses}
          onClick={() => onEditHabit?.(habit)}
        >

          {/* Left side - Habit name and details */}
          <HabitMeta habit={habit} size="sm" />

          {/* Right side - Weekly day buttons */}
          <div className="flex items-center ml-4">
            {tableWeekDays.map((day, index) => {
              const dayDone = completionHandlers.isDoneOnDate(day);
              const isToday = day.toDateString() === new Date().toDateString();
              const sizeClasses = isToday ? 'w-10 h-10' : 'w-6 h-6';
              const categoryColor = getCategoryCSSVariables(habit.category).primary;

              return (
                <div key={index} className="flex flex-col items-center w-12">
                  <div
                    className={`${sizeClasses} rounded flex items-center justify-center text-[10px] ${dayDone ? 'text-white' : ''}`}
                    title={`${day.toLocaleDateString('en-US', { weekday: 'short' })} ${day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                    style={{
                      backgroundColor: dayDone ? categoryColor : 'hsl(var(--daycell-bg))',
                      borderColor: dayDone ? categoryColor : (isToday ? 'hsl(var(--border-today))' : 'hsl(var(--border-default))')
                    }}
                  >
                    <button
                      className={`w-full h-full flex flex-col items-center justify-center rounded duration-200 ${dayDone ? 'text-white' : 'text-text-primary hover:text-text-hover hover:bg-button-hover'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        completionHandlers.setDateCompletion(day, !dayDone);
                      }}
                    >
                      {day.getDate()}
                      {isToday && <Check className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="relative w-24 h-12">
            <div className={`absolute inset-0 flex items-center justify-end pr-3`}>
              <ProgressCircle
                value={tableWeeklyProgressPct}
                strokeWidth={5}
                color={getCategoryCSSVariables(habit.category).primary}
                label={`${tableCompletedThisWeek}/${targetPerWeek}`}
              />
            </div>
          </div>

        </div>
      </div>
    );
  }

  // Week variant - single checkbox for the selected day
  if (variant === 'week') {
    const targetDate = selectedDate || todayDate;
    const weekStart = weekStartDate ? new Date(weekStartDate) : targetDate;
    const { days: weekDays, completed: weekCompletedCount, progressPct: weekProgressPct } = progressUtils.getWeekSummary(weekStart);
    const done = completionHandlers.isDoneOnDate(targetDate);

    const categoryColor = getCategoryCSSVariables(habit.category).primary;
    return (
      <div className="relative" ref={cardRef}>
        <div className="cursor-pointer w-full rounded-lg bg-habitbg hover:bg-habitbghover transition-colors duration-200" onClick={() => onEditHabit?.(habit)}>
          <div className="flex items-center justify-between gap-3 p-3">

            <HabitMeta habit={habit} size="sm" />

            <div className="flex items-center gap-4">
              <div className="flex gap-1 h-[50px] items-center">
                {weekDays.map((day, i) => {
                  const dayDone = completionHandlers.isDoneOnDate(day);
                  const isToday = day.toDateString() === new Date().toDateString();
                  const isSelectedDay = day.toDateString() === targetDate.toDateString();
                  const sizeClasses = isSelectedDay ? 'w-10 h-10' : 'w-6 h-6';
                  return (
                    <div
                      key={i}
                      className={`${sizeClasses} rounded flex items-center justify-center text-[10px] ${dayDone ? 'text-white' : ''}`}
                      title={`${day.toLocaleDateString('en-US', { weekday: 'short' })} ${day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                      style={{
                        backgroundColor: dayDone ? categoryColor : 'hsl(var(--daycell-bg))',
                        borderColor: dayDone ? categoryColor : (isToday ? 'hsl(var(--border-today))' : 'hsl(var(--border-default))')
                      }}
                    >
                      {isSelectedDay ? (
                        <button
                          className={`w-full h-full flex flex-col items-center justify-center rounded duration-200 ${dayDone ? 'text-white' : 'text-text-primary hover:text-text-hover hover:bg-button-hover'}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            completionHandlers.setDateCompletion(day, !dayDone);
                          }}
                          title={`${dayDone ? 'Undo check-in for' : 'Check in for'} ${day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`}
                        >
                          {day.getDate()}
                          <Check className="h-3 w-3" />
                        </button>
                      ) : (
                        <span className="pointer-events-none select-none">{day.getDate()}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Frequency progress */}
              <div className="space-y-1">
                <div className="flex items-center justify-center">
                  <ProgressCircle
                    value={weekProgressPct}
                    strokeWidth={5}
                    color={categoryColor}
                    label={`${weekCompletedCount}/${targetPerWeek}`}
                  />
                </div>
              </div>

            </div>



          </div>
        </div>
      </div>
    );
  }

  // Calendar variant - optimized for calendar views
  if (variant === 'calendar') {
    const targetDate = selectedDate || todayDate;
    const done = completionHandlers.isDoneOnDate(targetDate);

    return (
      <div className="relative" ref={cardRef}>
        <Card
          className="group relative cursor-pointer bg-habitbg hover:bg-habitbghover transition-colors duration-200"
          onClick={() => onEditHabit?.(habit)}
        >
          {/* Plus button for future habits */}
          {habit.phase === 'future' && (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onMoveHabit(habit.id, 'current');
              }}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-plus-button-bg hover:bg-plus-button-hover text-plus-button-text z-10 h-8 w-8"
            >
              <Plus className="h-4 w-4" />
            </Button>
          )}

          <CardContent className="">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={done}
                  onCheckedChange={(checked) => {
                    const shouldCheck = checked === true;
                    completionHandlers.setDateCompletion(targetDate, shouldCheck);
                  }}
                  className="mt-1"
                  categoryId={habit.category}
                />
                <div className="flex-1">
                  <HabitMeta habit={habit} useCardTitle size="sm" />
                </div>
              </div>
              {(() => {
                const { completed, progressPct } = progressUtils.getWeekSummary(todayDate);
                const categoryBg = getCategoryCSSVariables(habit.category).primary;

                return (
                  <div className="space-y-1">
                    <div className="flex items-center justify-center">
                      <ProgressCircle
                        value={progressPct}
                        strokeWidth={5}
                        color={categoryBg}
                        label={`${completed}/${targetPerWeek}`}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>

          </CardContent>
        </Card>
      </div>
    );
  }

  // Default variant - compact card
  const handleDragStart = (e: React.DragEvent) => {
    if (draggable && onDragStart) {
      e.dataTransfer.setData('text/plain', habit.id);
      e.dataTransfer.effectAllowed = 'move';
      onDragStart(habit);
    }
  };

  return (
    <div className="relative" ref={cardRef}>
      <Card
        className={`group relative bg-habitbg hover:bg-habitbghover transition-colors duration-200 ${draggable ? 'cursor-pointer' : ''}`}
        draggable={draggable}
        onDragStart={handleDragStart}
        onClick={() => onEditHabit?.(habit)}
      >
        <CardContent className="">
          <div className="flex items-center justify-between w-full">
            <div className="flex flex-col gap-1 w-full">
              <div className="flex w-full items-center justify-between h-5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-text-primary">{habit.title}</span>
                  {habit.category !== 'none' && (
                    <Badge categoryId={habit.category}>
                      {getCategoryById(habit.category)?.name || habit.category}
                    </Badge>
                  )}
                </div>
                {/* Plus button for future habits */}
                {habit.phase === 'future' && (
                  <Button
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMoveHabit(habit.id, 'current');
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-transparent hover:bg-button-hover text-plus-button-text-dark z-10 h-6 w-6 p-0"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                )}
              </div>
              <span className="text-xs text-text-secondary">{habit.streak} days</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-text-secondary">

            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
