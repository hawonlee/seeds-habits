import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, PanelLeft, PanelRight } from "lucide-react";
import { Habit } from "@/hooks/useHabits";
import { HabitCard } from "./HabitCard";

interface HabitPanelLayoutProps {
  // Panel configuration
  title: string;
  color: string;
  icon: React.ReactNode;
  habits: Habit[];
  adoptionThreshold: number;
  
  // Collapsible functionality
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  collapseIcon?: 'left' | 'right';
  
  // Actions
  onAddHabit: () => void;
  onEditHabit: (habit: Habit) => void;
  onDeleteHabit: (id: string) => void;
  onCheckIn: (id: string) => void;
  onUndoCheckIn: (id: string) => void;
  onMoveHabit: (id: string, phase: Habit['phase']) => void;
  
  // Content customization
  emptyStateIcon?: React.ReactNode;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  showActions?: boolean;
}

export const HabitPanelLayout = ({
  title,
  color,
  icon,
  habits,
  adoptionThreshold,
  isCollapsed = false,
  onToggleCollapse,
  collapseIcon = 'left',
  onAddHabit,
  onEditHabit,
  onDeleteHabit,
  onCheckIn,
  onUndoCheckIn,
  onMoveHabit,
  emptyStateIcon,
  emptyStateTitle,
  emptyStateDescription,
  showActions = true
}: HabitPanelLayoutProps) => {
  // Collapsed state
  if (isCollapsed) {
    const CollapseIcon = collapseIcon === 'left' ? PanelLeft : PanelRight;
    
    return (
      <div className="h-full flex flex-col items-center justify-center bg-neutral-50 rounded-lg border">
        <Button
          size="sm"
          variant="ghost"
          onClick={onToggleCollapse}
          className="h-12 w-12 p-0 hover:bg-neutral-100"
        >
          <CollapseIcon className={`h-6 w-6 ${color}`} />
        </Button>
        <div className={`mt-2 text-xs font-medium transform -rotate-90 whitespace-nowrap ${color}`}>
          {title}
        </div>
      </div>
    );
  }

  // Expanded state
  const CollapseIcon = collapseIcon === 'left' ? PanelLeft : PanelRight;
  
  return (
    <div className="h-full bg-white rounded-lg border p-4 overflow-y-auto">
      {/* Panel toggle button - positioned based on collapse direction */}
      {onToggleCollapse && (
        <div className={`mb-4 ${collapseIcon === 'right' ? '' : ''}`}>
          <Button
            size="sm"
            variant="ghost"
            onClick={onToggleCollapse}
            className="h-8 w-8 p-0 hover:bg-neutral-100"
          >
            <CollapseIcon className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${color}`}></div>
          <h2 className="text-xl font-semibold">{title}</h2>
          <Badge variant="secondary">{habits.length}</Badge>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={onAddHabit}
          className="h-8 w-8 p-0"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Content */}
      <div className="space-y-4">
        {habits.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              {emptyStateIcon && (
                <div className="h-8 w-8 mx-auto mb-2 opacity-50">
                  {emptyStateIcon}
                </div>
              )}
              <p>{emptyStateTitle || `No ${title.toLowerCase()} yet`}</p>
              <p className="text-sm">{emptyStateDescription || `Add a new habit to get started`}</p>
            </CardContent>
          </Card>
        ) : (
          habits.map(habit => (
            <HabitCard 
              key={habit.id} 
              habit={habit} 
              showActions={showActions}
              adoptionThreshold={adoptionThreshold}
              onEditHabit={onEditHabit}
              onDeleteHabit={onDeleteHabit}
              onCheckIn={onCheckIn}
              onUndoCheckIn={onUndoCheckIn}
              onMoveHabit={onMoveHabit}
            />
          ))
        )}
      </div>
    </div>
  );
};
