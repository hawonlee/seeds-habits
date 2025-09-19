import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ProgressCircle } from "@/components/ui/progress-circle";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Calendar, 
  MoveUpRight,
  TrendingUp, 
  Plus,
  Repeat
} from "lucide-react";
import { Habit } from "@/hooks/useHabits";
import { getCategoryClasses, getCategoryById, getCategoryColor, formatFrequency, getCategoryPalette } from "@/lib/categories";
import { useHabitCompletions } from "@/hooks/useHabitCompletions";
import { InlineEditDropdown } from "./InlineEditDropdown";
import { useState, useRef } from "react";

interface HabitTableRowProps {
  habit: Habit;
  adoptionThreshold: number;
  currentWeek: Date;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (id: string) => void;
  onUpdateHabit?: (updatedHabit: Partial<Habit>) => void;
  onCheckIn: (id: string, date?: Date) => void;
  onUndoCheckIn: (id: string, date?: Date) => void;
  onMoveHabit: (id: string, phase: Habit['phase']) => void;
  displayVariant?: 'table' | 'card';
}

export const HabitTableRow = ({
  habit,
  adoptionThreshold,
  currentWeek,
  onEditHabit,
  onDeleteHabit,
  onUpdateHabit,
  onCheckIn,
  onUndoCheckIn,
  onMoveHabit,
  displayVariant = 'table'
}: HabitTableRowProps) => {
  const [showInlineEdit, setShowInlineEdit] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  const { isHabitCompletedOnDate, toggleCompletion } = useHabitCompletions();

  const getWeekDays = () => {
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
    // Use only the database-backed completion system
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

  const containerClasses = displayVariant === 'card'
    ? 'flex items-center px-4 py-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-shadow cursor-pointer group relative'
    : 'flex items-center px-4 py-2 border-b border-neutral-100 hover:bg-neutral-50 cursor-pointer group relative';

  return (
    <div className="relative" ref={rowRef}>
      <div 
        className={containerClasses}
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
          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-green-600 hover:bg-green-700 text-white shadow-lg z-10 h-6 w-6 p-0"
        >
          <Plus className="h-3 w-3" />
        </Button>
      )}
      
      {/* Left side - Habit name and details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-medium text-xs truncate">{habit.title}</h3>
              {habit.category !== 'none' && (
                <Badge categoryId={habit.category} className="">
                  {getCategoryById(habit.category)?.name || habit.category}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {/* <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(habit.created_at).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
              </span> */}
              <span className="flex items-center gap-1">
                <MoveUpRight className="h-3 w-3" />
                {habit.total_completions} total
                </span>
                <span className="flex items-center gap-1">
                  <Repeat className="h-3 w-3" />
                  {formatFrequency(habit.target_frequency)}
                </span>            </div>

            </div>



          {/* Adopt button moved to hover state in the right info area */}
        </div>
      </div>

      {/* Right side - Weekly checkboxes table */}
      <div className="flex items-center ml-4">
        {weekDays.map((day, index) => {
          const isCompleted = isHabitDoneOnDate(day);
          const shouldShow = shouldHabitBeDoneOnDate(day);
          const isToday = day.toDateString() === today.toDateString();
          const wrapperSize = isToday ? 'w-7 h-7' : 'w-4 h-4';
          const checkboxSize = isToday ? 'h-7 w-7' : 'h-4 w-4';
          
          return (
            <div 
              key={index} 
              className={`flex flex-col items-center justify-center min-w-[32px] w-12 h-12`}
            >
              {/* Day name header */}
              {/* <div className="text-xs text-muted-foreground font-medium">
                {dayNames[day.getDay()]}
              </div> */}
              
              {/* Checkbox */}
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
              
              {/* Date number */}
              {/* <div className="text-xs text-muted-foreground">
                {day.getDate()}
              </div> */}
            </div>
          );
        })}
        </div>

        <div className="relative w-24 h-12">
          <div className={`absolute inset-0 flex items-center justify-end pr-3`}>
            <ProgressCircle value={weeklyProgressPct} size={50} strokeWidth={5} color={getCategoryById(habit.category)?.color || '#737373'} label={`${completedThisWeek}/${targetPerWeek}`} />
          </div>
{/* 
          {habit.phase === 'current' && (
            <div className="absolute inset-0 hidden group-hover:flex items-center justify-end">
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-3"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveHabit(habit.id, 'adopted');
                }}
              >
                Adopt
              </Button>
            </div>
          )} */}
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
            onDeleteHabit(id);
            setShowInlineEdit(false);
          }}
          onAdopt={(id) => {
            onMoveHabit(id, 'adopted');
            setShowInlineEdit(false);
          }}
          position={{
            top: rowRef.current ? rowRef.current.getBoundingClientRect().bottom + 4 : 0,
            left: rowRef.current ? rowRef.current.getBoundingClientRect().left : 0
          }}
          anchorRect={rowRef.current ? rowRef.current.getBoundingClientRect() : null}
        />
      )}
      </div>
    </div>
  );
};
