import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Target,
  Clock,
  Trophy,
  TrendingUp,
  Calendar,
  Star,
  RotateCcw,
  ChevronRight,
  Plus,
  MoveUpRight
} from "lucide-react";
import { Habit } from "@/hooks/useHabits";
import { getCategoryClasses, getCategoryById, resolveCategoryBgColor } from "@/lib/categories";
import { InlineEditDropdown } from "./InlineEditDropdown";
import { useState, useRef } from "react";
import { Progress } from "@/components/ui/progress";
import { ProgressCircle } from "@/components/ui/progress-circle";

interface HabitCardProps {
  habit: Habit;
  adoptionThreshold: number;
  onCheckIn: (id: string) => void;
  onUndoCheckIn: (id: string) => void;
  onMoveHabit: (id: string, phase: Habit['phase']) => void;
  onEditHabit?: (habit: Habit) => void;
  onDeleteHabit?: (id: string) => void;
  onUpdateHabit?: (updatedHabit: Partial<Habit>) => void;
  variant?: 'default' | 'compact' | 'summary' | 'calendar' | 'week';
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
  selectedDate
}: HabitCardProps) => {
  const [showInlineEdit, setShowInlineEdit] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const today = new Date().toISOString().split('T')[0];
  const lastCompleted = habit.last_completed ? new Date(habit.last_completed).toISOString().split('T')[0] : null;
  const isCheckedInToday = lastCompleted === today;
  const createdAtStr = new Date(habit.created_at).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
  const adoptionProgressPct = Math.min((habit.streak / adoptionThreshold) * 100, 100);

  const handleToggleToday = (next: boolean | 'indeterminate') => {
    if (next === true && !isCheckedInToday) {
      onCheckIn(habit.id);
    } else if (next === false && isCheckedInToday) {
      onUndoCheckIn(habit.id);
    }
  };

  // Compact variant - minimal info
  if (variant === 'compact') {
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
          className={`group relative ${draggable ? 'cursor-move hover:shadow-md transition-shadow' : 'cursor-pointer hover:shadow-md transition-shadow'}`}
          draggable={draggable}
          onDragStart={handleDragStart}
          onClick={() => setShowInlineEdit(true)}
        >


          <CardContent className="">
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col gap-1 w-full">
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{habit.title}</span>
                    <Badge
                      className={`${getCategoryClasses(habit.category).bgColor} ${getCategoryClasses(habit.category).textColor} `}
                    >
                      {getCategoryById(habit.category)?.name || habit.category}
                    </Badge>
                  </div>
                  {/* Plus button for future habits */}
                  {habit.phase === 'future' && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveHabit(habit.id, 'current');
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-transparent hover:bg-stone-200 text-stone-800 z-10 h-6 w-6 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{habit.streak} days</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">

              </div>
            </div>
          </CardContent>
        </Card>

        {showInlineEdit && (
          <InlineEditDropdown
            habit={habit}
            isOpen={showInlineEdit}
            onClose={() => setShowInlineEdit(false)}
            onUpdate={(updatedHabit) => {
              onUpdateHabit?.(updatedHabit);
              setShowInlineEdit(false);
            }}
            onDelete={(id) => {
              onDeleteHabit?.(id);
              setShowInlineEdit(false);
            }}
            onAdopt={(id) => {
              onMoveHabit(id, 'adopted');
              setShowInlineEdit(false);
            }}
            position={{
              top: cardRef.current ? cardRef.current.getBoundingClientRect().bottom + 4 : 0,
              left: cardRef.current ? cardRef.current.getBoundingClientRect().left : 0
            }}
            anchorRect={cardRef.current ? cardRef.current.getBoundingClientRect() : null}
          />
        )}
      </div>
    );
  }

  // Summary variant - key stats only
  if (variant === 'summary') {
    return (
      <Card className="mb-3">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-sm">{habit.title}</h3>
            <Badge
              className={`${getCategoryClasses(habit.category).bgColor} ${getCategoryClasses(habit.category).textColor} border-0 px-2 py-0.5 text-xs`}
            >
              {getCategoryById(habit.category)?.name || habit.category}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {habit.streak} day streak
            </span>
            <span className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              {habit.target_frequency}x/week
            </span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <ProgressCircle value={adoptionProgressPct} size={28} strokeWidth={6} color={resolveCategoryBgColor(habit.category)} />
            <div className="text-xs text-muted-foreground ml-auto">{habit.streak}/{adoptionThreshold} days</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calendar variant - optimized for calendar views
  if (variant === 'calendar') {
    return (
      <div className="text-xs p-1 rounded flex items-center gap-1 truncate bg-white border border-gray-200">
        <Badge
          className={`${getCategoryClasses(habit.category).bgColor} ${getCategoryClasses(habit.category).textColor} border-0 px-1 py-0.5 text-xs`}
        >
          {getCategoryById(habit.category)?.name || habit.category}
        </Badge>
        <span className="truncate">{habit.title}</span>
        <span className="text-muted-foreground ml-auto">{habit.target_frequency}x/week</span>
        <Button
          size="sm"
          variant="outline"
          className="h-5 px-2 ml-2"
          onClick={(e) => {
            e.stopPropagation();
            onMoveHabit(habit.id, 'adopted');
          }}
        >
          Adopt
        </Button>
      </div>
    );
  }

  // Week variant - single checkbox for the selected day
  if (variant === 'week') {
    const targetDate = selectedDate || new Date();
    const done = isCompletedOnDate
      ? isCompletedOnDate(habit.id, targetDate)
      : (() => {
        const dayString = targetDate.toISOString().split('T')[0];
        const lastCompletedLocal = habit.last_completed ? new Date(habit.last_completed).toISOString().split('T')[0] : null;
        return lastCompletedLocal === dayString;
      })();

    const start = weekStartDate
      ? new Date(weekStartDate)
      : (() => {
        const s = new Date(targetDate);
        s.setDate(targetDate.getDate() - targetDate.getDay());
        return s;
      })();

    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      return day;
    });
    const completedCount = weekDays.reduce((count, d) => {
      const isDone = isCompletedOnDate
        ? isCompletedOnDate(habit.id, d)
        : (() => {
          const dayString = d.toISOString().split('T')[0];
          const lastCompletedLocal = habit.last_completed ? new Date(habit.last_completed).toISOString().split('T')[0] : null;
          return lastCompletedLocal === dayString;
        })();
      return count + (isDone ? 1 : 0);
    }, 0);
    const targetPerWeek = Math.max(1, habit.target_frequency || 1);
    const weeklyPct = Math.min(100, Math.round((completedCount / targetPerWeek) * 100));

    const categoryColor = getCategoryById(habit.category)?.color || '#6B7280';
    const categoryBg = resolveCategoryBgColor(habit.category);
    return (
      <div className="relative" ref={cardRef}>
        <Card className="border-gray-200 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowInlineEdit(true)}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between gap-3">

              <div className="flex flex-col items-start gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate max-w-[12rem]">{habit.title}</span>
  
                  <Badge className={`${getCategoryClasses(habit.category).bgColor} ${getCategoryClasses(habit.category).textColor} border-0 px-1.5 py-0.5 text-[10px]`}>
                    {getCategoryById(habit.category)?.name || habit.category}
                  </Badge>
                </div>
  
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {/* <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(habit.created_at).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
                    </span> */}
                  <span className="flex items-center gap-1">
                    <MoveUpRight className="h-3 w-3" />
                    {habit.total_completions} total
                    <span className="text-[10px] text-gray-500">({habit.target_frequency}x/week)</span>
                  </span>
                </div>
              </div>

                <div className="flex items-center gap-4">
                  <div className="flex gap-1 h-[50px] items-center">
                    {Array.from({ length: 7 }, (_, i) => {
                    const day = new Date(start);
                    day.setDate(start.getDate() + i);
                    const dayDone = isCompletedOnDate
                      ? isCompletedOnDate(habit.id, day)
                      : (() => {
                        const dayString = day.toISOString().split('T')[0];
                        const lastCompletedLocal = habit.last_completed ? new Date(habit.last_completed).toISOString().split('T')[0] : null;
                        return lastCompletedLocal === dayString;
                      })();
                    const isToday = day.toDateString() === new Date().toDateString();
                    const isSelectedDay = day.toDateString() === targetDate.toDateString();
                      const sizeClasses = isSelectedDay ? 'w-10 h-10' : 'w-6 h-6';
                    return (
                      <div
                        key={i}
                          className={`${sizeClasses} rounded border flex items-center justify-center text-[10px] ${dayDone ? 'text-white' : ''}`}
                        title={`${day.toLocaleDateString('en-US', { weekday: 'short' })} ${day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                        style={{
                          backgroundColor: dayDone ? categoryBg : 'white',
                          borderColor: dayDone ? categoryBg : (isToday ? '#A8A29E' : '#E5E7EB')
                        }}
                      >
                        {isSelectedDay ? (
                          dayDone ? (
                            <Checkbox
                              checked={true}
                              onCheckedChange={(next) => {
                                const shouldCheck = Boolean(next);
                                if (!shouldCheck) {
                                  if (onUndoCheckInForDate) onUndoCheckInForDate(habit.id, day);
                                  else if (onUndoCheckIn) onUndoCheckIn(habit.id);
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                              className="h-4 w-4"
                              customColor={resolveCategoryBgColor(habit.category)}
                            />
                          ) : (
                              <button
                                className="text-gray-700 hover:text-gray-900 hover:bg-gray-100 w-full h-full flex items-center justify-center rounded duration-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onCheckInForDate) onCheckInForDate(habit.id, day);
                                else if (onCheckIn) onCheckIn(habit.id);
                              }}
                              title={`Check in for ${day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`}
                            >
                                {day.getDate()}
                            </button>
                          )
                        ) : (
                          day.getDate()
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Frequency progress */}
                <div className="space-y-1">
                  <div className="flex items-center justify-center">
                    <ProgressCircle
                      value={weeklyPct}
                      size={50}
                      strokeWidth={5}
                      color={categoryBg}
                      label={`${completedCount}/${targetPerWeek}`}
                    />
                  </div>
                </div>

              </div>

            </div>


          </CardContent>
        </Card>

        {showInlineEdit && (
          <InlineEditDropdown
            habit={habit}
            isOpen={showInlineEdit}
            onClose={() => setShowInlineEdit(false)}
            onUpdate={(updatedHabit) => {
              onUpdateHabit?.(updatedHabit);
              setShowInlineEdit(false);
            }}
            onDelete={(id) => {
              onDeleteHabit?.(id);
              setShowInlineEdit(false);
            }}
            onAdopt={(id) => {
              onMoveHabit(id, 'adopted');
              setShowInlineEdit(false);
            }}
            position={{
              top: cardRef.current ? cardRef.current.getBoundingClientRect().bottom + 4 : 0,
              left: cardRef.current ? cardRef.current.getBoundingClientRect().left : 0
            }}
            anchorRect={cardRef.current ? cardRef.current.getBoundingClientRect() : null}
          />
        )}
      </div>
    );
  }

  // Default variant - full card
  return (
    <div className="relative" ref={cardRef}>
      <Card
        className="mb-4 group relative cursor-pointer hover:bg-gray-100"
        onClick={() => setShowInlineEdit(true)}
      >
        {/* Plus button for future habits */}
        {habit.phase === 'future' && (
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onMoveHabit(habit.id, 'current');
            }}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-green-600 hover:bg-green-700 text-white shadow-lg z-10 h-8 w-8 p-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}

        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              {/* <Checkbox checked={isCheckedInToday} onCheckedChange={handleToggleToday} className="mt-1" /> */}
              <div className="flex-1">
                <CardTitle className="flex items-center gap-2 text-xs">
                  {habit.title}
                  <Badge
                    className={`${getCategoryClasses(habit.category).bgColor} ${getCategoryClasses(habit.category).textColor} border-0 px-2 py-0.5`}
                  >
                    {getCategoryById(habit.category)?.name || habit.category}
                  </Badge>
                </CardTitle>
                <div className="flex text-xs items-center gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {createdAtStr}
                  </span>
                  <span className="flex text-xs items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    {habit.streak}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mt-1">
            <div className="text-xs text-muted-foreground mb-2">This week</div>
            {habit.phase === 'current' && (
              <div className="flex gap-1">
                {(() => {
                  const todayDate = new Date();
                  const startOfWeek = new Date(todayDate);
                  startOfWeek.setDate(todayDate.getDate() - todayDate.getDay());

                  return Array.from({ length: 7 }, (_, i) => {
                    const day = new Date(startOfWeek);
                    day.setDate(startOfWeek.getDate() + i);
                    const dayString = day.toISOString().split('T')[0];
                    const lastCompletedLocal = habit.last_completed ? new Date(habit.last_completed).toISOString().split('T')[0] : null;
                    const isCompleted = lastCompletedLocal === dayString;
                    const isToday = dayString === todayDate.toISOString().split('T')[0];

                    return (
                      <div
                        key={i}
                        className={`w-7 h-7 rounded border flex items-center justify-center text-xs ${isCompleted
                            ? 'bg-lime-100 border-lime-200 text-foreground'
                            : isToday
                              ? 'border-gray-300 bg-gray-50'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        title={`${day.toLocaleDateString('en-US', { weekday: 'short' })} ${day.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                      >
                        {day.getDate()}
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </div>

          {(() => {
            const todayDate = new Date();
            const startOfWeek = new Date(todayDate);
            startOfWeek.setDate(todayDate.getDate() - todayDate.getDay());
            const weekDays = Array.from({ length: 7 }, (_, i) => {
              const d = new Date(startOfWeek);
              d.setDate(startOfWeek.getDate() + i);
              return d;
            });
            const completedCount = weekDays.reduce((count, d) => {
              const dayString = d.toISOString().split('T')[0];
              const lastCompletedLocal = habit.last_completed ? new Date(habit.last_completed).toISOString().split('T')[0] : null;
              const isDone = lastCompletedLocal === dayString;
              return count + (isDone ? 1 : 0);
            }, 0);
            const targetPerWeek = Math.max(1, habit.target_frequency || 1);
            const weeklyPct = Math.min(100, Math.round((completedCount / targetPerWeek) * 100));
            const categoryColor = getCategoryById(habit.category)?.color || '#6B7280';

            return (
              <div className="mt-3 space-y-1">
                <Progress value={weeklyPct} className="h-1.5" indicatorColor={categoryColor} />
                <div className="text-[10px] text-muted-foreground text-right">{completedCount}/{targetPerWeek} this week</div>
              </div>
            );
          })()}

          {habit.notes && (
            <div className="mt-4 text-sm text-muted-foreground flex items-center gap-1">
              <span>Notes</span>
              <ChevronRight className="h-4 w-4" />
            </div>
          )}

          <div className="mt-4 flex items-center gap-3">
            <ProgressCircle value={adoptionProgressPct} size={32} strokeWidth={6} color={resolveCategoryBgColor(habit.category)} />
            <div className="text-xs text-muted-foreground ml-auto">{habit.streak}/{adoptionThreshold} days</div>
          </div>
        </CardContent>
      </Card>

      {showInlineEdit && (
        <InlineEditDropdown
          habit={habit}
          isOpen={showInlineEdit}
          onClose={() => setShowInlineEdit(false)}
          onUpdate={(updatedHabit) => {
            onUpdateHabit?.(updatedHabit);
            setShowInlineEdit(false);
          }}
          onDelete={(id) => {
            onDeleteHabit?.(id);
            setShowInlineEdit(false);
          }}
          onAdopt={(id) => {
            onMoveHabit(id, 'adopted');
            setShowInlineEdit(false);
          }}
          position={{
            top: cardRef.current ? cardRef.current.getBoundingClientRect().bottom + 4 : 0,
            left: cardRef.current ? cardRef.current.getBoundingClientRect().left : 0
          }}
          anchorRect={cardRef.current ? cardRef.current.getBoundingClientRect() : null}
        />
      )}
    </div>
  );
};
