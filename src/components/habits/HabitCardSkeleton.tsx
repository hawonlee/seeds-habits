import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface HabitCardSkeletonProps {
  variant?: 'future' | 'current' | 'adopted';
  showActions?: boolean;
}

export const HabitCardSkeleton = ({ 
  variant = 'current', 
  showActions = true 
}: HabitCardSkeletonProps) => {
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
        
        {/* Title */}
        <Skeleton className="h-5 w-3/4" />
        
        {/* Notes */}
        <Skeleton className="h-4 w-1/2" />
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
