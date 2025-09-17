import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Calendar, 
  TrendingUp, 
  Plus
} from "lucide-react";
import { Habit } from "@/hooks/useHabits";
import { getCategoryClasses, getCategoryById, resolveCategoryBgColor } from "@/lib/categories";
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
  onMoveHabit
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

  return (
    <div className="relative" ref={rowRef}>
      <div 
        className="flex items-center px-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer group relative"
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
              <Badge
                className={`${getCategoryClasses(habit.category).bgColor} ${getCategoryClasses(habit.category).textColor} border-0 px-2 py-0.5 text-xs`}
              >
                {getCategoryById(habit.category)?.name || habit.category}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(habit.created_at).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })}
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {habit.streak}/{adoptionThreshold}
              </span>
            </div>
            <div className="mt-1">
              <div className="relative w-full h-1.5 bg-gray-200 rounded-full">
                <div
                  className="absolute left-0 top-0 h-1.5 bg-black rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((habit.streak / adoptionThreshold) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2"
            onClick={(e) => {
              e.stopPropagation();
              onMoveHabit(habit.id, 'adopted');
            }}
          >
            Adopt
          </Button>
        </div>
      </div>

      {/* Right side - Weekly checkboxes table */}
      <div className="flex items-center ml-4">
        {weekDays.map((day, index) => {
          const isCompleted = isHabitDoneOnDate(day);
          const shouldShow = shouldHabitBeDoneOnDate(day);
          const isToday = day.toDateString() === today.toDateString();
          
          return (
            <div 
              key={index} 
              className={`flex flex-col items-center justify-center min-w-[32px] w-12 h-12 ${
                isToday ? 'bg-gray-100' : ''
              }`}
            >
              {/* Day name header */}
              {/* <div className="text-xs text-muted-foreground font-medium">
                {dayNames[day.getDay()]}
              </div> */}
              
              {/* Checkbox */}
              <div 
                className="relative flex items-center justify-center w-6 h-6"
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox
                  checked={isCompleted}
                  onCheckedChange={() => handleDayCheckIn(day, isCompleted)}
                  className="h-6 w-6"
                  customColor={resolveCategoryBgColor(habit.category)}
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
