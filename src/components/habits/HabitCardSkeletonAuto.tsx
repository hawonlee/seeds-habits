import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Habit } from "@/hooks/useHabits";

/**
 * Auto-adapting skeleton that mirrors the actual HabitCard structure
 * This reduces maintenance overhead when HabitCard changes
 */

interface HabitCardSkeletonAutoProps {
  variant?: 'future' | 'current' | 'adopted';
  showActions?: boolean;
  // Optional: pass a real habit to get exact dimensions
  referenceHabit?: Partial<Habit>;
}

export const HabitCardSkeletonAuto = ({ 
  variant = 'current', 
  showActions = true,
  referenceHabit
}: HabitCardSkeletonAutoProps) => {
  
  // Get dynamic dimensions based on reference habit if provided
  const getTitleWidth = () => {
    if (referenceHabit?.title) {
      // Estimate width based on title length
      const length = referenceHabit.title.length;
      if (length < 10) return 'w-20';
      if (length < 20) return 'w-32';
      if (length < 30) return 'w-48';
      return 'w-64';
    }
    return 'w-3/4'; // Default
  };

  const getNotesWidth = () => {
    if (referenceHabit?.notes) {
      const length = referenceHabit.notes.length;
      if (length < 20) return 'w-1/3';
      if (length < 40) return 'w-1/2';
      return 'w-2/3';
    }
    return 'w-1/2'; // Default
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'future':
        return 'border-blue-200 bg-blue-50/30';
      case 'current':
        return 'border-yellow-200 bg-yellow-50/30';
      case 'adopted':
        return 'border-green-200 bg-green-50/30';
      default:
        return '';
    }
  };

  return (
    <Card className={`w-full ${getVariantStyles()}`}>
      <CardHeader className="pb-3">
        {/* Header with category badge and phase indicator */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        
        {/* Title - dynamic width */}
        <Skeleton className={`h-5 ${getTitleWidth()}`} />
        
        {/* Notes - dynamic width */}
        <Skeleton className={`h-4 ${getNotesWidth()}`} />
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Stats row */}
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-12" />
          </div>
          
          {/* Weekly calendar (only for current habits) */}
          {variant === 'current' && (
            <div className="flex gap-1">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-6 rounded" />
              ))}
            </div>
          )}
          
          {/* Adoption progress (only for current habits) */}
          {variant === 'current' && (
            <div className="space-y-2">
              <Skeleton className="h-2 w-full rounded-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          )}
          
          {/* Action buttons */}
          {showActions && (
            <div className="flex gap-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-16" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Utility function to generate skeletons that match existing habits
 * This is useful when you want skeletons to have similar dimensions to real data
 */
export const generateHabitSkeletons = (
  habits: Habit[], 
  variant: 'future' | 'current' | 'adopted' = 'current',
  count: number = 3
) => {
  return Array.from({ length: count }, (_, i) => {
    const referenceHabit = habits[i] || undefined;
    return (
      <HabitCardSkeletonAuto
        key={i}
        variant={variant}
        showActions={variant !== 'adopted'}
        referenceHabit={referenceHabit}
      />
    );
  });
};

