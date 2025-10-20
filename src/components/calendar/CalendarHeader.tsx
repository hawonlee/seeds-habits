import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarHeaderProps {
  title: string;
  calendarViewMode: 'month' | 'week' | 'day';
  onViewModeChange: (mode: 'month' | 'week' | 'day') => void;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}

export const CalendarHeader = ({
  title,
  calendarViewMode,
  onViewModeChange,
  onPrevious,
  onNext,
  onToday
}: CalendarHeaderProps) => {
  return (
    <div className="flex items-center justify-between w-full h-10">
      {/* Left side - Title */}
      <h2 className="text-sm font-medium text-foreground">
        {title}
      </h2>
      
      {/* Right side - Navigation controls */}
      <div className="flex items-center gap-2">
        <Select value={calendarViewMode} onValueChange={onViewModeChange}>
          <SelectTrigger className="w-[85px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem className="mb-1" value="month">Month</SelectItem>
            <SelectItem className="mb-1" value="week">Week</SelectItem>
            <SelectItem value="day">Day</SelectItem>
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
      </div>
    </div>
  );
};
