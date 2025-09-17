import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, Circle, RotateCcw, Calendar } from "lucide-react";
import { Habit } from "@/hooks/useHabits";

interface DayHabitsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: Date | null;
  habits: Habit[];
  onCheckIn: (id: string) => void;
  onUndoCheckIn: (id: string) => void;
}

export const DayHabitsDialog = ({
  open,
  onOpenChange,
  selectedDate,
  habits,
  onCheckIn,
  onUndoCheckIn
}: DayHabitsDialogProps) => {
  if (!selectedDate) return null;

  const dateString = selectedDate.toISOString().split('T')[0];
  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const isPast = selectedDate < new Date(new Date().setHours(0, 0, 0, 0));
  const isFuture = selectedDate > new Date(new Date().setHours(23, 59, 59, 999));

  const getCompletedHabits = () => {
    return habits.filter(habit => {
      if (!habit.last_completed) return false;
      const lastCompleted = new Date(habit.last_completed).toISOString().split('T')[0];
      return lastCompleted === dateString;
    });
  };

  const getActiveHabits = () => {
    return habits.filter(habit => {
      // Only show current and adopted habits
      if (habit.phase === 'future') return false;
      
      // For future dates, show all active habits
      if (isFuture) return habit.phase === 'current' || habit.phase === 'adopted';
      
      // For past/today, show habits that should be done (current/adopted)
      return habit.phase === 'current' || habit.phase === 'adopted';
    });
  };

  const completedHabits = getCompletedHabits();
  const activeHabits = getActiveHabits();
  const remainingHabits = activeHabits.filter(habit => 
    !completedHabits.some(completed => completed.id === habit.id)
  );

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDateStatus = () => {
    if (isToday) return { text: "Today", color: "text-green-600" };
    if (isPast) return { text: "Past", color: "text-gray-600" };
    return { text: "Future", color: "text-blue-600" };
  };

  const dateStatus = getDateStatus();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {formatDate(selectedDate)}
            <Badge variant="outline" className={dateStatus.color}>
              {dateStatus.text}
            </Badge>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Completed Habits */}
          {completedHabits.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-green-700 mb-3 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Completed Habits ({completedHabits.length})
              </h3>
              <div className="space-y-2">
                {completedHabits.map(habit => (
                  <Card key={habit.id} className="border-green-200 bg-green-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-green-800">{habit.title}</h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-green-600">
                            <span>{habit.target_frequency}x/week</span>
                            <span>{habit.streak} day streak</span>
                            {habit.phase === 'adopted' && (
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                Adopted
                              </span>
                            )}
                          </div>
                        </div>
                        {!isFuture && (
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
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Remaining Habits */}
          {remainingHabits.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <Circle className="h-5 w-5" />
                {isFuture ? 'Planned Habits' : 'Remaining Habits'} ({remainingHabits.length})
              </h3>
              <div className="space-y-2">
                {remainingHabits.map(habit => (
                  <Card key={habit.id} className="border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{habit.title}</h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span>{habit.target_frequency}x/week</span>
                            <span>{habit.streak} day streak</span>
                            <Badge variant={habit.phase === 'adopted' ? 'default' : 'secondary'}>
                              {habit.phase}
                            </Badge>
                          </div>
                        </div>
                        {!isFuture && (
                          <Button
                            size="sm"
                            onClick={() => onCheckIn(habit.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            Check In
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* No habits message */}
          {activeHabits.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No active habits</p>
              <p className="text-sm">
                {isFuture 
                  ? "No habits are planned for this day" 
                  : "No habits were active on this day"
                }
              </p>
            </div>
          )}

        
        </div>
      </DialogContent>
    </Dialog>
  );
};
