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
  MoveUpRight,
  Repeat,
  Check
} from "lucide-react";
import { Habit } from "@/hooks/useHabits";
import { getCategoryClasses, getCategoryById, getCategoryPrimaryColor, formatFrequency, getCategoryPalette } from "@/lib/categories";
import { InlineEditDropdown } from "./InlineEditDropdown";
import { HabitMeta } from "./HabitMeta";
import { useState, useRef } from "react";
import { Progress } from "@/components/ui/progress";
import { ProgressCircle } from "@/components/ui/progress-circle";
import { useHabitCompletions } from "@/hooks/useHabitCompletions";

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
  const today = new Date().toISOString().split('T')[0];
  const lastCompleted = habit.last_completed ? new Date(habit.last_completed).toISOString().split('T')[0] : null;
  const isCheckedInToday = lastCompleted === today;
  const createdAtStr = new Date(habit.created_at).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
  const adoptionProgressPct = Math.min((habit.streak / adoptionThreshold) * 100, 100);

  // Table variant specific logic
  const { isHabitCompletedOnDate, toggleCompletion } = useHabitCompletions();
  
  const getWeekDays = () => {
    if (!currentWeek) return [];
    return Array.from({ length: 7 }, (_, i) => {
      const day = new Date(currentWeek);
      day.setDate(currentWeek.getDate() + i);
      return day;
    });
  };

  const weekDays = getWeekDays();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Weekly progress based on target_frequency
  const completedThisWeek = weekDays.reduce((count, d) => count + (isHabitCompletedOnDate(habit.id, d) ? 1 : 0), 0);
  const targetPerWeek = Math.max(1, Math.min(7, habit.target_frequency || 1));
  const weeklyProgressPct = Math.min(100, (completedThisWeek / targetPerWeek) * 100);

  const handleDayCheckIn = async (day: Date, isCompleted: boolean) => {
    await toggleCompletion(habit.id, day);
  };

  const isHabitDoneOnDate = (date: Date) => {
    return isHabitCompletedOnDate(habit.id, date);
  };

  const shouldHabitBeDoneOnDate = (date: Date) => {
    const dayOfWeek = date.getDay();
    
    // If target_frequency is 7, it's daily
    if (habit.target_frequency === 7) {
      return true;
    }
    
    // If target_frequency is 1, it's weekly (show on one day)
    if (habit.target_frequency === 1) {
      const createdDay = new Date(habit.created_at).getDay();
      return dayOfWeek === createdDay;
    }
    
    // For other frequencies (2-6), distribute across the week
    if (habit.target_frequency >= 2 && habit.target_frequency <= 6) {
      const habitIdHash = Math.abs(habit.id.split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0));
      
      const targetDays = [];
      for (let i = 0; i < habit.target_frequency; i++) {
        targetDays.push((habitIdHash + i) % 7);
      }
      
      return targetDays.includes(dayOfWeek);
    }
    
    return false;
  };

  const handleToggleToday = (next: boolean | 'indeterminate') => {
    if (next === true && !isCheckedInToday) {
      onCheckIn(habit.id);
    } else if (next === false && isCheckedInToday) {
      onUndoCheckIn(habit.id);
    }
  };

  // Table variant - horizontal layout with weekly checkboxes
  if (variant === 'table') {
    const containerClasses = 'flex items-center rounded-lg px-4 py-2 bg-neutral-200/40 hover:bg-neutral-200 transition-colors duration-200 cursor-pointer group relative';

    return (
      <div className="relative" ref={cardRef}>
        <div 
          className={containerClasses}
          onClick={() => setShowInlineEdit(!showInlineEdit)}
        >
          
          {/* Left side - Habit name and details */}
          <HabitMeta habit={habit} size="sm" />

          {/* Right side - Weekly checkboxes table */}
          <div className="flex items-center ml-4">
            {weekDays.map((day, index) => {
              const isCompleted = isHabitDoneOnDate(day);
              const shouldShow = shouldHabitBeDoneOnDate(day);
              const isToday = day.toDateString() === new Date().toDateString();
              const wrapperSize = isToday ? 'w-7 h-7' : 'w-4 h-4';
              const checkboxSize = isToday ? 'h-7 w-7' : 'h-4 w-4';
              
              return (
                <div 
                  key={index} 
                  className={`flex flex-col items-center justify-center min-w-[32px] w-12 h-12`}
                >
                  <div 
                    className={`relative flex items-center justify-center ${wrapperSize}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={isCompleted}
                      onCheckedChange={() => handleDayCheckIn(day, isCompleted)}
                      className={checkboxSize}
                      categoryId={habit.category}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="relative w-24 h-12">
            <div className={`absolute inset-0 flex items-center justify-end pr-3`}>
              <ProgressCircle 
                value={weeklyProgressPct} 
                strokeWidth={5} 
                color={getCategoryById(habit.category)?.color || '#737373'} 
                label={`${completedThisWeek}/${targetPerWeek}`} 
              />
            </div>
          </div>

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
      </div>
    );
  }

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
          className={`group relative ${draggable ? 'hover:bg-neutral-100 cursor-pointer transition-colors duration-200' : 'hover:bg-neutral-100 transition-colors duration-200'}`}
          draggable={draggable}
          onDragStart={handleDragStart}
          onClick={() => setShowInlineEdit(!showInlineEdit)}
        >


          <CardContent className="">
            <div className="flex items-center justify-between w-full">
              <div className="flex flex-col gap-1 w-full">
                <div className="flex w-full items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium">{habit.title}</span>
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
  <HabitMeta habit={habit} size="sm" />

  // Calendar variant - optimized for calendar views
  if (variant === 'calendar') {
    const targetDate = selectedDate || new Date();
    const done = isCompletedOnDate
      ? isCompletedOnDate(habit.id, targetDate)
      : (() => {
        const dayString = targetDate.toISOString().split('T')[0];
        const lastCompletedLocal = habit.last_completed ? new Date(habit.last_completed).toISOString().split('T')[0] : null;
        return lastCompletedLocal === dayString;
      })();

    return (
      <div className="relative" ref={cardRef}>
        <Card
          className="group relative cursor-pointer bg-neutral-200/40 hover:bg-neutral-200/70 transition-colors duration-200"
          onClick={() => setShowInlineEdit(!showInlineEdit)}
        >
          {/* Plus button for future habits */}
          {habit.phase === 'future' && (
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onMoveHabit(habit.id, 'current');
              }}
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-green-600 hover:bg-green-700 text-white z-10 h-8 w-8"
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
                    if (checked) {
                      onCheckInForDate ? onCheckInForDate(habit.id, targetDate) : onCheckIn(habit.id);
                    } else {
                      onUndoCheckInForDate ? onUndoCheckInForDate(habit.id, targetDate) : onUndoCheckIn(habit.id);
                    }
                  }}
                  className="mt-1"
                  categoryId={habit.category}
                />
                <div className="flex-1">
                  <HabitMeta habit={habit} useCardTitle size="sm" />
                </div>
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
                const categoryBg = getCategoryPrimaryColor(habit.category);

                return (
                  <div className="space-y-1">
                    <div className="flex items-center justify-center">
                      <ProgressCircle
                        value={weeklyPct}
                        strokeWidth={5}
                        color={categoryBg}
                        label={`${completedCount}/${targetPerWeek}`}
                      />
                    </div>
                  </div>
                );
              })()}
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

    const categoryColor = getCategoryPrimaryColor(habit.category);
    return (
      <div className="relative" ref={cardRef}>
        <Card className="cursor-pointer w-full bg-neutral-200/40 hover:bg-neutral-200/70 transition-colors duration-200" onClick={() => setShowInlineEdit(true)}>
          <CardContent className="p-3">
            <div className="flex items-center justify-between gap-3">

              <HabitMeta habit={habit} size="sm" />

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
                          backgroundColor: dayDone ? categoryColor : 'white',
                          borderColor: dayDone ? categoryColor : (isToday ? '#A8A29E' : '#E5E7EB')
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
                              categoryId={habit.category}
                            />
                          ) : (
                            <button
                              className="text-neutral-700 cursor-pointer hover:text-neutral-900 hover:bg-neutral-100 w-full h-full flex flex-col items-center justify-center rounded duration-200"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onCheckInForDate) onCheckInForDate(habit.id, day);
                                else if (onCheckIn) onCheckIn(habit.id);
                              }}
                              title={`Check in for ${day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`}
                            >
                              {day.getDate()}
                              <Check className="h-3 w-3" />
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
                      strokeWidth={5}
                      color={categoryColor}
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
        className="mb-4 group relative cursor-pointer hover:bg-neutral-100"
        onClick={() => setShowInlineEdit(!showInlineEdit)}
      >
        {/* Plus button for future habits */}
        {habit.phase === 'future' && (
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onMoveHabit(habit.id, 'current');
            }}
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-green-600 hover:bg-green-700 text-white z-10 h-8 w-8 p-0"
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
                  {habit.category !== 'none' && (
                    <Badge
                      className={`${getCategoryClasses(habit.category).bgColor} ${getCategoryClasses(habit.category).textColor} border-0 px-2 py-0.5`}
                    >
                      {getCategoryById(habit.category)?.name || habit.category}
                    </Badge>
                  )}
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
                            ? 'border-neutral-300 bg-neutral-50'
                            : 'border-neutral-200 bg-neutral-50'
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
            const categoryColor = getCategoryById(habit.category)?.color || '#737373';

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
            <ProgressCircle value={adoptionProgressPct} strokeWidth={6} color={getCategoryPrimaryColor(habit.category)} />
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
