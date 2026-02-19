import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { UserDropdown } from "@/components/layout/UserDropdown";

interface CalendarHeaderProps {
  title: string;
  calendarViewMode: 'month' | 'week' | 'day';
  onViewModeChange: (mode: 'month' | 'week' | 'day') => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onOpenSettings?: () => void;
}

export const CalendarHeader = ({
  title,
  calendarViewMode,
  onViewModeChange,
  onPrevious,
  onNext,
  onToday,
  onOpenSettings
}: CalendarHeaderProps) => {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();

  return (
    <div className="flex items-center justify-between w-full h-10">
      {/* Left side - Title */}
      <h2 className="text-xs font-medium text-foreground">
        {title}
      </h2>
      
      {/* Right side - Navigation controls and user profile */}
      <div className="flex items-center gap-2">
        <Select value={calendarViewMode} onValueChange={onViewModeChange}>
          <SelectTrigger className="w-[85px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem className="mb-1 focus:text-foreground data-[highlighted]:text-foreground" value="month">Month</SelectItem>
            <SelectItem className="mb-1 focus:text-foreground data-[highlighted]:text-foreground" value="week">Week</SelectItem>
            <SelectItem className="focus:text-foreground data-[highlighted]:text-foreground" value="day">Day</SelectItem>
          </SelectContent>
        </Select>
        
       <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="smallicon"
            onClick={onPrevious}
            className="p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={onToday}
            className="h-8 px-3 text-xs font-normal border-input"
          >
            Today
          </Button>
          
          <Button
            variant="ghost"
            size="smallicon"
            onClick={onNext}
            className="p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
       </div>

       {/* User profile */}
       <div className="ml-2">
         <UserDropdown
           user={user}
           profile={profile}
           displayName={profile?.name || user?.email || 'User'}
           userInitials={(profile?.name || user?.email || 'User').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
           onOpenSettings={onOpenSettings || (() => {})}
           onSignOut={signOut}
         />
       </div>
      </div>
    </div>
  );
};
