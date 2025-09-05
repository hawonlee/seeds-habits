import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  Clock, 
  Trophy, 
  Edit, 
  Trash2, 
  TrendingUp, 
  Calendar, 
  Star,
  RotateCcw
} from "lucide-react";
import { Habit } from "@/hooks/useHabits";

interface HabitCardProps {
  habit: Habit;
  showActions?: boolean;
  adoptionThreshold: number;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (id: string) => void;
  onCheckIn: (id: string) => void;
  onUndoCheckIn: (id: string) => void;
  onMoveHabit: (id: string, phase: Habit['phase']) => void;
}

export const HabitCard = ({
  habit,
  showActions = true,
  adoptionThreshold,
  onEditHabit,
  onDeleteHabit,
  onCheckIn,
  onUndoCheckIn,
  onMoveHabit
}: HabitCardProps) => {
  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {habit.title}
              <Badge variant={habit.phase === 'adopted' ? 'default' : 'secondary'}>
                {habit.phase}
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                {habit.target_frequency}x/week
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {habit.leniency_threshold} days leniency
              </span>
              {habit.phase === 'adopted' && (
                <span className="flex items-center gap-1 text-green-600">
                  <Trophy className="h-4 w-4" />
                  {habit.points} pts
                </span>
              )}
            </div>
          </div>
          {showActions && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEditHabit(habit)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDeleteHabit(habit.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {habit.notes && (
          <p className="text-sm text-muted-foreground mb-3">{habit.notes}</p>
        )}
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              {habit.streak} day streak
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {habit.total_completions} total
            </span>
          </div>
          
          {/* Weekly Calendar - Only show for current habits */}
          {habit.phase === 'current' && (
            <div className="flex gap-1">
              {(() => {
                const today = new Date();
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay()); // Start from Sunday
                
                return Array.from({ length: 7 }, (_, i) => {
                  const day = new Date(startOfWeek);
                  day.setDate(startOfWeek.getDate() + i);
                  const dayString = day.toISOString().split('T')[0];
                  const lastCompleted = habit.last_completed ? new Date(habit.last_completed).toISOString().split('T')[0] : null;
                  const isCompleted = lastCompleted === dayString;
                  const isToday = dayString === today.toISOString().split('T')[0];
                  
                  return (
                    <div
                      key={i}
                      className={`w-6 h-6 rounded border-2 flex items-center justify-center text-xs ${
                        isCompleted 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : isToday 
                          ? 'border-green-300 bg-green-50' 
                          : 'border-gray-300 bg-gray-50'
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
          
        {habit.phase === 'current' && (
          <div className="flex gap-2 mt-3">
            {(() => {
              const today = new Date().toISOString().split('T')[0];
              const lastCompleted = habit.last_completed ? new Date(habit.last_completed).toISOString().split('T')[0] : null;
              const isCheckedInToday = lastCompleted === today;
              
              return isCheckedInToday ? (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span>Checked in today</span>
                </div>
              ) : (
                <Button
                  size="sm"
                  onClick={() => onCheckIn(habit.id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Check In
                </Button>
              );
            })()}
            
            {habit.total_completions > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onUndoCheckIn(habit.id)}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      
      {habit.phase === 'future' && (
        <div className="mt-3 pt-3 border-t">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onMoveHabit(habit.id, 'current')}
            className="w-full"
          >
            Start This Habit
          </Button>
        </div>
      )}
      
      {habit.phase === 'current' && (
        <div className="mt-3 pt-3 border-t">
          {habit.streak >= adoptionThreshold ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onMoveHabit(habit.id, 'adopted')}
              className="w-full bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
            >
              <Star className="h-4 w-4 mr-2" />
              Adopt Habit ({habit.streak}/{adoptionThreshold} days)
            </Button>
          ) : (
            <div className="text-center">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progress to adoption</span>
                <span>{habit.streak}/{adoptionThreshold} days</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((habit.streak / adoptionThreshold) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {adoptionThreshold - habit.streak} more days to adopt
              </p>
            </div>
          )}
        </div>
      )}
      </CardContent>
    </Card>
  );
};
